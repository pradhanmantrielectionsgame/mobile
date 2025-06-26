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
     * Apply policy effects to all states
     */
    applyPolicyEffects(policyName) {
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
                // Apply the effect to the state's popularity
                if (typeof updateStatePopularity === 'function') {
                    updateStatePopularity(stateName, effect);
                }
                
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
        this.showPolicyEffectNotification(policyName, effects, totalPositive, totalNegative, affectedStates);

        return effects;
    }

    /**
     * Show detailed policy effect notification
     */
    showPolicyEffectNotification(policyName, effects, totalPositive, totalNegative, affectedStates) {
        // Sort effects by magnitude for better display
        const positiveEffects = effects.filter(e => e.effect > 0).sort((a, b) => b.effect - a.effect);
        const negativeEffects = effects.filter(e => e.effect < 0).sort((a, b) => a.effect - b.effect);

        let message = `📜 ${policyName} Policy Effects:\n`;
        
        if (positiveEffects.length > 0) {
            message += `✅ Gained Support: `;
            const topPositive = positiveEffects.slice(0, 3);
            message += topPositive.map(e => `${e.state} (+${e.effect}%)`).join(', ');
            if (positiveEffects.length > 3) {
                message += ` and ${positiveEffects.length - 3} more states`;
            }
            message += `\n`;
        }

        if (negativeEffects.length > 0) {
            message += `❌ Lost Support: `;
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
        }

        // Show notification using the TV display system
        if (typeof addNewsUpdate === 'function') {
            addNewsUpdate(message);
        } else {
            console.log(message);
        }
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
}

// Create global instance
window.policyCalculator = new PolicyPopularityCalculator();
