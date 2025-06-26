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
            this.statesData = await statesResponse.json();
            
            console.log('Policy calculator data loaded successfully');
        } catch (error) {
            console.error('Error loading policy calculator data:', error);
        }
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

        // Calculate effects for all states
        for (const stateName in this.statesData.states) {
            const effect = this.calculatePolicyEffect(policyName, stateName);
            
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

        // Create detailed notification
        this.showPolicyEffectNotification(policyName, effects, totalPositive, totalNegative, affectedStates, completingPlayerId);

        return effects;
    }

    /**
     * Show detailed policy effect notification
     */
    showPolicyEffectNotification(policyName, effects, totalPositive, totalNegative, affectedStates, completingPlayerId) {
        // Sort effects by magnitude for better display
        const positiveEffects = effects.filter(e => e.effect > 0).sort((a, b) => b.effect - a.effect);
        const negativeEffects = effects.filter(e => e.effect < 0).sort((a, b) => a.effect - b.effect);

        let message = `📜 ${policyName} Campaign Impact:\n`;
        
        if (positiveEffects.length > 0) {
            message += `✅ Support Gained: `;
            const topPositive = positiveEffects.slice(0, 3);
            message += topPositive.map(e => `${e.state} (+${e.effect}%)`).join(', ');
            if (positiveEffects.length > 3) {
                message += ` and ${positiveEffects.length - 3} more states`;
            }
            message += `\n`;
        }

        if (negativeEffects.length > 0) {
            message += `❌ Support Lost: `;
            const topNegative = negativeEffects.slice(0, 3);
            message += topNegative.map(e => `${e.state} (${e.effect}%)`).join(', ');
            if (negativeEffects.length > 3) {
                message += ` and ${negativeEffects.length - 3} more states`;
            }
            message += `\n`;
        }

        if (affectedStates === 0) {
            message += `No significant impact across states`;
        } else {
            const netImpact = totalPositive - totalNegative;
            message += `Net Impact: ${netImpact > 0 ? '+' : ''}${netImpact}% across ${affectedStates} states`;
            
            // Add player information if provided
            if (completingPlayerId) {
                const playerName = this.getPlayerName(completingPlayerId);
                message += ` for ${playerName}`;
            }
        }

        // Show notification using the TV display system
        if (window.tvDisplay && typeof window.tvDisplay.addNewsUpdate === 'function') {
            window.tvDisplay.addNewsUpdate(message, false, 4000); // Show for 4 seconds
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
        // Find the state ID by name (need to convert from full name to state ID)
        const stateId = this.findStateIdByName(stateName);
        if (!stateId) {
            console.warn(`Could not find state ID for "${stateName}"`);
            return;
        }

        // Apply the popularity change using the existing state info system
        if (window.stateInfo && typeof window.stateInfo.updateStatePopularityFromCampaign === 'function') {
            window.stateInfo.updateStatePopularityFromCampaign(stateId, playerId, popularityChange);
            console.log(`Applied ${popularityChange > 0 ? '+' : ''}${popularityChange}% popularity change to ${stateName} for Player ${playerId}`);
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
        for (const [stateId, stateData] of Object.entries(this.statesData.states)) {
            if (stateData.name === stateName || stateId === stateName) {
                return stateId;
            }
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
}

// Create global instance
window.policyCalculator = new PolicyPopularityCalculator();
