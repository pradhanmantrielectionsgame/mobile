/**
 * Policy Impact Example and Explanation
 * 
 * This file demonstrates how the policy impact notification system works.
 */

// Example policy calculations to understand the notification system

function explainPolicyNotifications() {
  console.log("=== HOW POLICY NOTIFICATIONS WORK ===");
  
  // Example 1: Hindi Language Policy (baseMagnitude = 12)
  console.log("\n--- Example 1: Hindi Language Policy ---");
  console.log("Policy: Hindi Language (baseMagnitude = 12)");
  console.log("Support tags: ['HindiHeartland']");
  console.log("Oppose tags: ['SouthIndia', 'NortheastIndia', 'MinorityAreas']");
  
  console.log("\nState-by-state calculation:");
  console.log("Formula: BaseMagnitude × (supportCount - opposeCount)");
  
  // Uttar Pradesh example
  console.log("\nUttar Pradesh:");
  console.log("- Has tags: ['HindiHeartland', 'Pilgrimage']");
  console.log("- Support tags hit: 1 (HindiHeartland)");
  console.log("- Oppose tags hit: 0");
  console.log("- Impact: 12 × (1 - 0) = +12%");
  
  // Tamil Nadu example
  console.log("\nTamil Nadu:");
  console.log("- Has tags: ['SouthIndia', 'CoastalIndia', 'Education']");
  console.log("- Support tags hit: 0");
  console.log("- Oppose tags hit: 1 (SouthIndia)");
  console.log("- Impact: 12 × (0 - 1) = -12%");
  
  // Kerala example
  console.log("\nKerala:");
  console.log("- Has tags: ['SouthIndia', 'CoastalIndia', 'Education', 'MinorityAreas']");
  console.log("- Support tags hit: 0");
  console.log("- Oppose tags hit: 2 (SouthIndia, MinorityAreas)");
  console.log("- Impact: 12 × (0 - 2) = -24%");
  
  console.log("\n--- NOTIFICATION CALCULATION ---");
  console.log("Instead of confusing 'net impact', we show:");
  console.log("- Total positive impact: +12% (from UP)");
  console.log("- Total negative impact: -36% (from TN: -12%, Kerala: -24%)");
  console.log("- Clear message: '+12% in supportive regions, -36% in opposing regions'");
  console.log("- Examples: 'Uttar Pradesh: +12%, Kerala: -24%'");
  
  console.log("\n--- WHY THIS IS BETTER ---");
  console.log("❌ Old way: 'Hindi Language affects 3 states (-24% net impact)'");
  console.log("   -> Confusing! Sounds like the policy failed");
  console.log("✅ New way: 'Hindi Language Policy Completed! +12% in supportive regions, -36% in opposing regions. Examples: Uttar Pradesh: +12%, Kerala: -24%'");
  console.log("   -> Clear! Shows both the gains AND the backlash");
  
  console.log("\n=== END EXPLANATION ===");
}

function testPolicyCalculation(policyName, testStates) {
  console.log(`\n=== TESTING ${policyName.toUpperCase()} POLICY ===`);
  
  // Mock the calculation for demonstration
  const policies = {
    "Hindi Language": {
      baseMagnitude: 12,
      supportTags: ["HindiHeartland"],
      opposeTags: ["SouthIndia", "NortheastIndia", "MinorityAreas"]
    },
    "Hindutva": {
      baseMagnitude: 12,
      supportTags: ["HindiHeartland", "Pilgrimage"],
      opposeTags: ["MinorityAreas", "SouthIndia", "NortheastIndia"]
    },
    "Secularism": {
      baseMagnitude: 8,
      supportTags: ["MinorityAreas", "Education"],
      opposeTags: ["HindiHeartland", "Pilgrimage"]
    }
  };
  
  const policy = policies[policyName];
  if (!policy) {
    console.log("Policy not found in test data");
    return;
  }
  
  console.log(`Policy: ${policyName}`);
  console.log(`Base Magnitude: ${policy.baseMagnitude}`);
  console.log(`Support tags: [${policy.supportTags.join(', ')}]`);
  console.log(`Oppose tags: [${policy.opposeTags.join(', ')}]`);
  
  let totalPositive = 0;
  let totalNegative = 0;
  let affectedStates = 0;
  let majorChanges = [];
  
  testStates.forEach(state => {
    const supportCount = policy.supportTags.filter(tag => state.tags.includes(tag)).length;
    const opposeCount = policy.opposeTags.filter(tag => state.tags.includes(tag)).length;
    const impact = policy.baseMagnitude * (supportCount - opposeCount);
    
    if (impact !== 0) {
      affectedStates++;
      if (impact > 0) totalPositive += impact;
      else totalNegative += Math.abs(impact);
      
      if (Math.abs(impact) >= 8) {
        majorChanges.push({ state: state.name, impact });
      }
      
      console.log(`${state.name}: ${impact > 0 ? '+' : ''}${impact}% (support: ${supportCount}, oppose: ${opposeCount})`);
    } else {
      console.log(`${state.name}: 0% (neutral)`);
    }
  });
  
  // Generate the notification message
  let message = `📜 ${policyName} Policy Completed! `;
  
  if (affectedStates === 0) {
    message += `No regional impact.`;
  } else {
    if (totalPositive > 0 && totalNegative > 0) {
      message += `+${totalPositive}% in supportive regions, -${totalNegative}% in opposing regions.`;
    } else if (totalPositive > 0) {
      message += `+${totalPositive}% boost across ${affectedStates} supportive states.`;
    } else if (totalNegative > 0) {
      message += `-${totalNegative}% backlash across ${affectedStates} opposing states.`;
    }
    
    if (majorChanges.length > 0) {
      const examples = majorChanges.slice(0, 2).map(change => 
        `${change.state}: ${change.impact > 0 ? '+' : ''}${change.impact}%`
      ).join(', ');
      message += ` Examples: ${examples}`;
      if (majorChanges.length > 2) {
        message += ` +${majorChanges.length - 2} more`;
      }
    }
  }
  
  console.log(`\nNotification: "${message}"`);
  console.log(`Summary: ${affectedStates} states affected, +${totalPositive}% positive, -${totalNegative}% negative`);
}

// Test data
const testStates = [
  { name: "Uttar Pradesh", tags: ["HindiHeartland", "Pilgrimage"] },
  { name: "Tamil Nadu", tags: ["SouthIndia", "CoastalIndia", "Education"] },
  { name: "Kerala", tags: ["SouthIndia", "CoastalIndia", "Education", "MinorityAreas"] },
  { name: "Gujarat", tags: ["IndustrialCorridor", "Manufacturing", "Pilgrimage", "BorderLands"] },
  { name: "West Bengal", tags: ["MinorityAreas", "Education", "Manufacturing"] },
  { name: "Assam", tags: ["NortheastIndia", "BorderLands", "MinorityAreas", "NaturalResources"] }
];

// Run examples if in browser console
if (typeof window !== 'undefined') {
  window.explainPolicyNotifications = explainPolicyNotifications;
  window.testPolicyCalculation = testPolicyCalculation;
  window.testStates = testStates;
  
  console.log("Policy notification examples loaded!");
  console.log("Run these commands in the console:");
  console.log("1. explainPolicyNotifications() - See detailed explanation");
  console.log("2. testPolicyCalculation('Hindi Language', testStates) - Test Hindi Language policy");
  console.log("3. testPolicyCalculation('Hindutva', testStates) - Test Hindutva policy");
  console.log("4. testPolicyCalculation('Secularism', testStates) - Test Secularism policy");
}
