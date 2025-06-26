/**
 * Policy Popularity Calculator
 * Calculates popularity changes based on policy tags and state characteristics
 */

class PolicyPopularityCalculator {
    constructor() {
        this.policyTags = null;
        this.statesData = null;
        this.loadData();
    }

    async loadData() {
        try {
            // Load policy tags
            const policyResponse = await fetch('./data/policy-tags.json');
            this.policyTags = await policyResponse.json();
            
            // Load states data
            const statesResponse = await fetch('./data/states_data.json');
            const rawStatesData = await statesResponse.json();
            
            // Transform the states data structure
            this.statesData = this.transformStatesData(rawStatesData);
            
            console.log('Policy calculator data loaded successfully');
            
            // Run test to verify data loading
            setTimeout(() => this.testDataLoading(), 100);
        } catch (error) {
            console.error('Error loading policy calculator data:', error);
        }
    }

    /**
     * Transform the states data from array format to the expected format
     */
    transformStatesData(rawData) {
        const states = {};
        
        rawData.forEach(stateData => {
            const stateName = stateData.State;
            const tags = [];
            
            // Convert boolean string values to tags
            Object.keys(stateData).forEach(key => {
                if (key !== 'State' && key !== 'LokSabhaSeats' && key !== 'SvgId') {
                    if (stateData[key] === "TRUE") {
                        tags.push(key);
                    }
                }
            });
            
            states[stateName] = {
                name: stateName,
                tags: tags,
                svgId: stateData.SvgId,
                lokSabhaSeats: parseInt(stateData.LokSabhaSeats) || 0
            };
        });
        
        return { states };
    }

    /**
     * Calculate popularity change for a policy in a specific state
     * Formula: BaseMagnitude * (supports - opposes)
     */
    calculatePolicyEffect(policyName, stateName) {
        if (!this.policyTags || !this.statesData) {
            console.warn('Policy calculator data not loaded yet');
            return 0;
        }

        const policy = this.policyTags.policyTags[policyName];
        if (!policy) {
            console.warn(`Policy "${policyName}" not found in policy tags`);
            return 0;
        }

        const state = this.statesData.states[stateName];
        if (!state) {
            console.warn(`State "${stateName}" not found in states data`);
            return 0;
        }

        const stateTags = state.tags || [];
        const supportTags = policy.supportTags || [];
        const opposeTags = policy.opposeTags || [];
        const baseMagnitude = policy.baseMagnitude || 0;

        // Count matching tags
        const supports = supportTags.filter(tag => stateTags.includes(tag)).length;
        const opposes = opposeTags.filter(tag => stateTags.includes(tag)).length;

        // Calculate effect
        const effect = baseMagnitude * (supports - opposes);

        // Debug logging for the first few states
        if (stateName === 'Uttar Pradesh' || stateName === 'Andhra Pradesh' || stateName === 'Gujarat') {
            console.log(`DEBUG ${stateName}:`);
            console.log(`  State tags: [${stateTags.join(', ')}]`);
            console.log(`  Support tags: [${supportTags.join(', ')}]`);
            console.log(`  Oppose tags: [${opposeTags.join(', ')}]`);
            console.log(`  Base magnitude: ${baseMagnitude}`);
            console.log(`  Supports: ${supports}, Opposes: ${opposes}`);
            console.log(`  Effect: ${effect}`);
        }

        return effect;
    }

    /**
     * Apply policy effects to all states for campaign completion
     */
    applyPolicyEffects(policyName, completingPlayerId) {
        if (!this.statesData) {
            console.warn('States data not loaded yet');
            return;
        }

        const effects = [];
        let totalPositive = 0;
        let totalNegative = 0;
        let affectedStates = 0;

        console.log(`\n=== Applying Policy Effects for ${policyName} ===`);
        console.log(`Total states to check: ${Object.keys(this.statesData.states).length}`);

        // Calculate effects for all states
        for (const stateName in this.statesData.states) {
            const effect = this.calculatePolicyEffect(policyName, stateName);
            
            console.log(`${stateName}: effect = ${effect}`);
            
            if (effect !== 0) {
                // Apply the effect to the state's popularity for the completing player
                this.applyCampaignCompletionBonus(stateName, completingPlayerId, effect);
                
                effects.push({ state: stateName, effect });
                affectedStates++;
                
                if (effect > 0) {
                    totalPositive += effect;
                } else {
                    totalNegative += Math.abs(effect);
                }
            }
        }

        console.log(`Final stats: ${effects.length} effects, ${affectedStates} affected states`);
        console.log(`Total positive: ${totalPositive}, Total negative: ${totalNegative}`);

        // Create detailed notification
        this.showPolicyEffectNotification(policyName, effects, totalPositive, totalNegative, affectedStates, completingPlayerId);

        return effects;
    }

    /**
     * Show simplified policy effect notification using tags and base magnitude
     */
    showPolicyEffectNotification(policyName, effects, totalPositive, totalNegative, affectedStates, completingPlayerId) {
        // Get policy configuration from policy tags
        const policy = this.policyTags?.policyTags[policyName];
        if (!policy) {
            console.warn(`Policy "${policyName}" not found in policy tags`);
            return;
        }

        let messageParts = [`📜 ${policyName}:`];
        
        // Show support tags with positive magnitude
        if (policy.supportTags && policy.supportTags.length > 0) {
            messageParts.push(`✅ +${policy.baseMagnitude} ${policy.supportTags.join(', ')}`);
        } else if (policy.baseMagnitude > 0) {
            // No specific support tags - show nationwide benefit
            messageParts.push(`✅ +${policy.baseMagnitude}% nationwide!`);
        }

        // Show oppose tags with negative magnitude  
        if (policy.opposeTags && policy.opposeTags.length > 0) {
            messageParts.push(`❌ -${policy.baseMagnitude} ${policy.opposeTags.join(', ')}`);
        }

        const message = messageParts.join('\n');

        // Show notification using the TV display system
        if (window.tvDisplay && typeof window.tvDisplay.addNewsUpdate === 'function') {
            window.tvDisplay.addNewsUpdate(message, false, 3000); // Show for 3 seconds (shorter since it's simpler)
        } else {
            console.log(message);
        }
    }

    /**
     * Get player name for notifications
     */
    getPlayerName(playerId) {
        try {
            const config = localStorage.getItem("gameConfig");
            if (config) {
                const gameConfig = JSON.parse(config);
                return playerId === 1 
                    ? gameConfig.player1Politician?.party || "Player 1"
                    : gameConfig.player2Politician?.party || "Player 2";
            }
        } catch (error) {
            console.warn("Could not load player names from config");
        }
        return `Player ${playerId}`;
    }

    /**
     * Apply campaign completion bonus to a specific state's popularity
     * Formula: pop_change = BaseMagnitude * (supports - opposes)
     */
    applyCampaignCompletionBonus(stateName, playerId, popularityChange) {
        // Find the state data to get the SVG ID
        const state = this.statesData?.states[stateName];
        if (!state) {
            console.warn(`Could not find state data for "${stateName}"`);
            return;
        }

        const stateId = state.svgId; // Use the SVG ID for state identification
        if (!stateId) {
            console.warn(`Could not find state ID for "${stateName}"`);
            return;
        }

        // Apply the popularity change using the existing state info system
        if (window.stateInfo && typeof window.stateInfo.updateStatePopularityFromCampaign === 'function') {
            window.stateInfo.updateStatePopularityFromCampaign(stateId, playerId, popularityChange);
            console.log(`Applied ${popularityChange > 0 ? '+' : ''}${popularityChange}% popularity change to ${stateName} (${stateId}) for Player ${playerId}`);
        } else {
            console.warn('State info system not available for popularity updates');
        }
    }

    /**
     * Helper function to find state ID by state name
     */
    findStateIdByName(stateName) {
        if (!this.statesData) return null;
        
        // Search through states to find the one with matching name
        const state = this.statesData.states[stateName];
        if (state) {
            return state.svgId;
        }
        return null;
    }

    /**
     * Debug function to test policy effects
     */
    debugPolicyEffect(policyName) {
        console.log(`\n=== DEBUG: ${policyName} Policy Effects ===`);
        
        const policy = this.policyTags?.policyTags[policyName];
        if (!policy) {
            console.log(`Policy "${policyName}" not found`);
            return;
        }

        console.log(`Base Magnitude: ${policy.baseMagnitude}`);
        console.log(`Support Tags: ${policy.supportTags?.join(', ') || 'None'}`);
        console.log(`Oppose Tags: ${policy.opposeTags?.join(', ') || 'None'}`);
        console.log('');

        // Test with a few key states
        const testStates = ['Uttar Pradesh', 'Tamil Nadu', 'Gujarat', 'Kerala', 'Assam'];
        
        for (const stateName of testStates) {
            const state = this.statesData?.states[stateName];
            if (state) {
                const effect = this.calculatePolicyEffect(policyName, stateName);
                const stateTags = state.tags || [];
                
                console.log(`${stateName}:`);
                console.log(`  Tags: ${stateTags.join(', ')}`);
                console.log(`  Effect: ${effect > 0 ? '+' : ''}${effect}%`);
                console.log('');
            }
        }
    }

    /**
     * Debug function to test campaign completion effects
     */
    debugCampaignCompletion(policyName, playerId) {
        console.log(`\n=== DEBUG: Campaign Completion for ${policyName} by Player ${playerId} ===`);
        
        const policy = this.policyTags?.policyTags[policyName];
        if (!policy) {
            console.log(`Policy "${policyName}" not found`);
            return;
        }

        console.log(`Base Magnitude: ${policy.baseMagnitude}`);
        console.log(`Support Tags: ${policy.supportTags?.join(', ') || 'None'}`);
        console.log(`Oppose Tags: ${policy.opposeTags?.join(', ') || 'None'}`);
        console.log('');

        // Test with all states and show expected popularity changes
        const results = [];
        for (const stateName in this.statesData.states) {
            const effect = this.calculatePolicyEffect(policyName, stateName);
            if (effect !== 0) {
                const state = this.statesData.states[stateName];
                const stateTags = state.tags || [];
                
                results.push({
                    name: stateName,
                    effect: effect,
                    tags: stateTags
                });
            }
        }

        // Sort by effect magnitude
        results.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));

        console.log('Expected Popularity Changes:');
        results.forEach(result => {
            console.log(`${result.name}: ${result.effect > 0 ? '+' : ''}${result.effect}% (Tags: ${result.tags.join(', ')})`);
        });

        if (results.length === 0) {
            console.log('No states would be affected by this policy');
        }

        console.log(`\nTotal states affected: ${results.length}`);
        const totalPositive = results.filter(r => r.effect > 0).reduce((sum, r) => sum + r.effect, 0);
        const totalNegative = results.filter(r => r.effect < 0).reduce((sum, r) => sum + Math.abs(r.effect), 0);
        console.log(`Net effect: +${totalPositive}% positive, -${totalNegative}% negative`);
    }

    /**
     * Test function to verify data loading and transformation
     */
    testDataLoading() {
        console.log('\n=== Testing Data Loading ===');
        
        if (!this.policyTags) {
            console.log('❌ Policy tags not loaded');
            return;
        }
        
        if (!this.statesData) {
            console.log('❌ States data not loaded');
            return;
        }
        
        console.log('✅ Data loaded successfully');
        console.log(`Policy count: ${Object.keys(this.policyTags.policyTags).length}`);
        console.log(`States count: ${Object.keys(this.statesData.states).length}`);
        
        // Test a few states
        const testStates = ['Uttar Pradesh', 'Andhra Pradesh', 'Gujarat'];
        testStates.forEach(stateName => {
            const state = this.statesData.states[stateName];
            if (state) {
                console.log(`${stateName}: ${state.tags.length} tags - [${state.tags.join(', ')}]`);
            } else {
                console.log(`❌ ${stateName} not found`);
            }
        });
        
        // Test a policy
        const testPolicy = 'Rural Development';
        const policy = this.policyTags.policyTags[testPolicy];
        if (policy) {
            console.log(`\n${testPolicy} policy:`);
            console.log(`  Base Magnitude: ${policy.baseMagnitude}`);
            console.log(`  Support Tags: [${policy.supportTags.join(', ')}]`);
            console.log(`  Oppose Tags: [${policy.opposeTags.join(', ')}]`);
            
            // Test effect calculation
            const effect = this.calculatePolicyEffect(testPolicy, 'Uttar Pradesh');
            console.log(`  Effect on Uttar Pradesh: ${effect}`);
        }
    }
}

// Create global instance
window.policyCalculator = new PolicyPopularityCalculator();
