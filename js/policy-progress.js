// Object to store progress for each policy and player
const policyProgress = {
  social: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  land: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  economy: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  justice: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  culture: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  governance: Array(4).fill({ player1: 0, player2: 0, completed: false }),
};

// Fix the initialization issue - Arrays are filled with references to the same object
Object.keys(policyProgress).forEach((category) => {
  policyProgress[category] = Array(4)
    .fill(0)
    .map(() => ({ player1: 0, player2: 0, completed: false }));
});

// Import player information
import { player1, player2 } from "./player-info.js";
import { isGamePaused } from "./game-options.js";

// Mapping from campaign categories and indices to actual policy names
const POLICY_MAPPING = {
  social: [
    "Education",           // social-1
    "Rural Development",   // social-2  
    "Women's Empowerment", // social-3
    "Healthcare"           // social-4
  ],
  land: [
    "Land Reforms",               // land-1
    "Agricultural Reforms",       // land-2
    "Water and Mineral Rights",   // land-3
    "Infrastructure"              // land-4
  ],
  economy: [
    "Economic Liberalization", // economy-1
    "Privatization",          // economy-2
    "Public Sector",          // economy-3
    "Digital Transformation"  // economy-4
  ],
  justice: [
    "Anti-Corruption",  // justice-1
    "Judicial Activism", // justice-2
    "Press Freedom",     // justice-3
    "Law and Order"      // justice-4
  ],
  culture: [
    "Hindi Language",     // culture-1
    "Hindutva",          // culture-2
    "Secularism",        // culture-3
    "Indigenous Rights"   // culture-4
  ],
  governance: [
    "Caste Reservation",     // governance-1
    "Uniform Civil Code",    // governance-2
    "State's Rights",        // governance-3
    "National Defense"       // governance-4
  ]
};

// Game configuration for dynamic party names
let gameConfig = null;

// Get game configuration for dynamic party names
function loadGameConfiguration() {
  try {
    const config = localStorage.getItem("gameConfig");
    if (config) {
      gameConfig = JSON.parse(config);
    } else {
      console.warn("No game configuration found, using defaults");
      gameConfig = {
        player1Politician: { party: "Player 1" },
        player2Politician: { party: "Player 2" },
      };
    }
  } catch (error) {
    console.error("Error loading game configuration:", error);
    gameConfig = {
      player1Politician: { party: "Player 1" },
      player2Politician: { party: "Player 2" },
    };
  }
}

// Get party name for a player
function getPlayerPartyName(playerId) {
  if (!gameConfig) {
    loadGameConfiguration();
  }
  return playerId === 1
    ? gameConfig.player1Politician?.party || "Player 1"
    : gameConfig.player2Politician?.party || "Player 2";
}

// Constants
const CAMPAIGN_CLICK_COST = 20; // 20M per click (base cost, will be modified by tier)
const CAMPAIGN_MAX_COST = 200; // 200M total cost (base)
const CAMPAIGN_COMPLETION_BONUS = 0; // No cash bonus for completing campaigns
const CAMPAIGN_MAX_CLICKS = 10; // 10 clicks to complete (200M total)
const CAMPAIGN_MAX_CLICKS_PER_PHASE = 5; // Maximum clicks per policy per phase

// Function to update progress bar
function updateProgressBar(category, index) {
  const progressBar = document.getElementById(`${category}-${index + 1}`);
  const policy = policyProgress[category][index];
  const player1Progress = policy.player1;
  const player2Progress = policy.player2;

  // Calculate total progress (combined from both players)
  const totalProgress = Math.min(100, player1Progress + player2Progress);

  if (progressBar) {
    // Update progress width
    progressBar.style.width = `${totalProgress}%`;

    // Determine which player has contributed more
    if (player1Progress > player2Progress) {
      progressBar.className = "progress-fill player1";
    } else if (player2Progress > player1Progress) {
      progressBar.className = "progress-fill player2";
    } else if (player1Progress > 0) {
      // Equal non-zero contributions
      progressBar.className = "progress-fill player1";
    }

    // Add complete class if fully funded
    if (totalProgress === 100) {
      progressBar.classList.add("complete");
    } else {
      progressBar.classList.remove("complete");
    }
  }

  // Update campaign info display
  updateCampaignInfoDisplay(category, index);
}

// Function to update campaign info display (apply tier classes)
function updateCampaignInfoDisplay(category, index) {
  const progressId = `${category}-${index + 1}`;
  const progressItem = document.getElementById(progressId).closest(".progress-item");
  
  if (!progressItem) return;

  // Get policy information
  const policyName = POLICY_MAPPING[category] && POLICY_MAPPING[category][index];
  if (!policyName) return;

  let tier = 3; // default
  
  // Get tier information from policy tags
  if (window.policyCalculator && window.policyCalculator.policyTags) {
    const policy = window.policyCalculator.policyTags.policyTags[policyName];
    if (policy) {
      tier = policy.tier || 3;
    }
  }

  // Remove existing tier classes
  progressItem.classList.remove('tier-1', 'tier-2', 'tier-3');
  
  // Apply tier class for border styling
  progressItem.classList.add(`tier-${tier}`);
}

// Function to get tier description
function getTierDescription(tier) {
  const descriptions = {
    1: "Mega Policy - Major transformative policies with highest impact (40M per click)",
    2: "Major Policy - Significant policies with moderate impact (30M per click)", 
    3: "Standard Policy - Regular policies with smaller impact (20M per click)"
  };
  return descriptions[tier] || "Unknown tier";
}

// Function to update all progress bars
function updateAllProgressBars() {
  Object.entries(policyProgress).forEach(([category, policies]) => {
    policies.forEach((policy, index) => {
      updateProgressBar(category, index);
    });
  });
  updateProgressItemUI();
}

// Track clicks per policy per phase
const policyClicksThisPhase = {
  social: Array(4).fill(0),
  land: Array(4).fill(0),
  economy: Array(4).fill(0),
  justice: Array(4).fill(0),
  culture: Array(4).fill(0),
  governance: Array(4).fill(0),
};

// Function to get campaign cost based on policy tier
function getCampaignCost(category, index) {
  const policyName = POLICY_MAPPING[category] && POLICY_MAPPING[category][index];
  if (!policyName) {
    return CAMPAIGN_CLICK_COST; // fallback to base cost
  }

  // Load policy tags to determine tier
  if (window.policyCalculator && window.policyCalculator.policyTags) {
    const policy = window.policyCalculator.policyTags.policyTags[policyName];
    if (policy && policy.tier) {
      switch (policy.tier) {
        case 1: return CAMPAIGN_CLICK_COST * 2; // Tier 1 (Mega): 40M per click
        case 2: return CAMPAIGN_CLICK_COST * 1.5; // Tier 2 (Major): 30M per click  
        case 3: return CAMPAIGN_CLICK_COST; // Tier 3 (Standard): 20M per click
        default: return CAMPAIGN_CLICK_COST;
      }
    }
  }
  
  return CAMPAIGN_CLICK_COST; // fallback
}

// Function to reset phase click counters
function resetPhaseClickCounters() {
  Object.keys(policyClicksThisPhase).forEach(category => {
    policyClicksThisPhase[category].fill(0);
  });
  console.log("Phase click counters reset");
  
  // Update all campaign info displays to reflect reset counters
  updateAllProgressBars();
}

// Function to check if player can make more clicks on this policy this phase
function canClickPolicyThisPhase(category, index) {
  const currentClicks = policyClicksThisPhase[category][index];
  return currentClicks < CAMPAIGN_MAX_CLICKS_PER_PHASE;
}

// Function to increment progress for a specific policy
// Function to increment progress for a specific policy
function incrementPolicy(category, index, playerId) {
  console.log(
    `incrementPolicy called: ${category}-${index + 1}, player ${playerId}`,
  );

  // Check if game is paused - prevent policy contributions while paused
  if (isGamePaused()) {
    console.log("Game is paused - policy contribution ignored");
    return false;
  }

  const policy = policyProgress[category][index];
  if (!policy) {
    console.error(`Policy not found: ${category}-${index}`);
    return false;
  }

  // Check if player has reached click limit for this policy this phase
  if (!canClickPolicyThisPhase(category, index)) {
    console.log(`Cannot click policy ${category}-${index + 1}: phase limit reached (${CAMPAIGN_MAX_CLICKS_PER_PHASE} clicks)`);
    // Play invalid action sound (only for Player 1)
    if (window.soundManager && playerId === 1) {
      window.soundManager.playInvalidAction();
    }
    return false;
  }

  const player = playerId === 1 ? player1 : player2;
  const campaignCost = getCampaignCost(category, index);

  // Check if campaign is already completed
  if (policy.player1 + policy.player2 >= 100) {
    console.log(`Campaign ${category}-${index + 1} is already completed`);
    return false;
  }
  
  // Check if player has enough funds (using tiered cost)
  if (!player.canSpend(campaignCost)) {
    // Play invalid action sound (only for Player 1)
    if (window.soundManager && playerId === 1) {
      window.soundManager.playInvalidAction();
    }

    player.showInsufficientFundsError();
    return false;
  }

  // Spend funds (using tiered cost)
  player.updateFunds(-campaignCost);

  // Track click for this phase
  policyClicksThisPhase[category][index]++;

  // Increment player's contribution
  if (playerId === 1) {
    policy.player1 = Math.min(100, policy.player1 + 10);
  } else {
    policy.player2 = Math.min(100, policy.player2 + 10);
  }

  // Update the progress bar and campaign info
  updateProgressBar(category, index);
  updateProgressItemUI();

  // Check if campaign is now completed
  if (policy.player1 + policy.player2 >= 100 && !policy.completed) {
    policy.completed = true;
    // Determine dominant player (who contributed more)
    const dominantPlayer = policy.player1 > policy.player2 ? 1 : 2;

    // No cash bonus for completion - only policy effects reward

    // Play fanfare sound for Player 1 campaign completion
    if (dominantPlayer === 1 && window.soundManager) {
      window.soundManager.playFanfare();
    }

    // Get the actual policy name and apply effects to all states
    const policyName = POLICY_MAPPING[category] && POLICY_MAPPING[category][index];
    if (policyName) {
      console.log(`Applying policy effects for "${policyName}" completed by Player ${dominantPlayer}`);
      
      // Apply policy effects to all states with the completing player ID
      if (window.policyCalculator) {
        window.policyCalculator.applyPolicyEffects(policyName, dominantPlayer);
      } else {
        console.warn('Policy calculator not available');
      }
    } else {
      console.warn(`Could not find policy name for ${category}-${index + 1}`);
    }

    // Show completion notification with policy name if available
    showCampaignCompletionNotification(category, index, dominantPlayer, policyName);

    // Log completion
    console.log(
      `Campaign ${category}-${index + 1} completed! Player ${dominantPlayer} awarded ${CAMPAIGN_COMPLETION_BONUS}M bonus.`,
    );

    // Record that this policy is now eligible for phase bonuses
    if (!window.completedPolicies) {
      window.completedPolicies = [];
    }
    window.completedPolicies.push({
      category,
      index,
      dominantPlayer,
      policyName
    });
  }

  // Log action
  console.log(
    `Player ${playerId} contributed ${campaignCost}M to ${category}-${index + 1}`,
  );
  return true;
}

// Function to show campaign completion notification
function showCampaignCompletionNotification(category, index, playerId, policyName = null) {
  const playerName = getPlayerPartyName(playerId);
  
  // Use provided policy name or fall back to DOM lookup
  let policyLabel;
  if (policyName) {
    policyLabel = policyName;
  } else {
    const progressId = `${category}-${index + 1}`;
    const progressItem = document
      .getElementById(progressId)
      .closest(".progress-item");
    policyLabel = progressItem.querySelector(
      ".progress-item-label",
    ).textContent;
  }

  // Create structured notification directly
  window.tvDisplay.addNotification({
    type: 'campaign-update',
    title: `${policyLabel} Campaign Completed!`,
    details: `${playerName} implements nationwide policy effects`,
    timestamp: new Date(),
    duration: 2000
  });
}

// Function to show phase bonus notification
function showPhaseBonusNotification(playerId, amount, completedCount) {
  // Add news update to TV display with short 1.5-second duration
  const playerName = getPlayerPartyName(playerId);
  const totalBonus = amount * completedCount;
  window.tvDisplay.addNewsUpdate(
    `💰 Phase Bonus: ${playerName} gains +${totalBonus}M for ${completedCount} campaigns`,
    false,
    1500
  );
}

// Function to award phase bonuses for completed policies
function awardPhaseCompletionBonuses() {
  if (!window.completedPolicies) return;

  // Group by player
  const player1Policies = window.completedPolicies.filter(
    (p) => p.dominantPlayer === 1,
  );
  const player2Policies = window.completedPolicies.filter(
    (p) => p.dominantPlayer === 2,
  );

  // Award bonuses for player 1
  if (player1Policies.length > 0) {
    const totalBonus = CAMPAIGN_COMPLETION_BONUS * player1Policies.length;
    player1.updateFunds(totalBonus);
    showPhaseBonusNotification(
      1,
      CAMPAIGN_COMPLETION_BONUS,
      player1Policies.length,
    );
    console.log(
      `Phase bonus: Player 1 awarded ${totalBonus}M for ${player1Policies.length} completed policies`,
    );
  }

  // Award bonuses for player 2
  if (player2Policies.length > 0) {
    const totalBonus = CAMPAIGN_COMPLETION_BONUS * player2Policies.length;
    player2.updateFunds(totalBonus);
    showPhaseBonusNotification(
      2,
      CAMPAIGN_COMPLETION_BONUS,
      player2Policies.length,
    );
    console.log(
      `Phase bonus: Player 2 awarded ${totalBonus}M for ${player2Policies.length} completed policies`,
    );
  }
}

// Add contribution indicators to progress items
function updateProgressItemUI() {
  Object.entries(policyProgress).forEach(([category, policies]) => {
    policies.forEach((policy, index) => {
      const progressId = `${category}-${index + 1}`;
      const progressItem = document
        .getElementById(progressId)
        .closest(".progress-item");

      // Remove any existing contribution info
      const existingInfo = progressItem.querySelector(".contribution-info");
      if (existingInfo) {
        progressItem.removeChild(existingInfo);
      }

      // Add or remove completed class
      if (policy.completed) {
        progressItem.classList.add("completed");
      } else {
        progressItem.classList.remove("completed");
      }
    });
  });
}

// Initialize progress bars when the page loads
document.addEventListener("DOMContentLoaded", () => {
  updateAllProgressBars();

  // Add click handlers to all progress items
  document.querySelectorAll(".progress-item").forEach((item, idx) => {
    // Get category and index
    const progressFill = item.querySelector(".progress-fill");
    if (progressFill && progressFill.id) {
      const categoryMatch = progressFill.id.match(/^([a-z]+)-(\d+)$/);
      if (categoryMatch) {
        const category = categoryMatch[1];
        const index = parseInt(categoryMatch[2]) - 1;

        console.log(`Setting up click handler for ${category}-${index + 1}`);

        // Add click handler
        item.addEventListener("click", (e) => {
          console.log(`Clicked on ${category}-${index + 1}`);
          // Determine which player clicked based on keyboard modifiers
          // Shift key = Player 2, otherwise Player 1
          const playerId = e.shiftKey ? 2 : 1;
          incrementPolicy(category, index, playerId);
        });
      } else {
        console.log(
          `No category match for progress fill ID: ${progressFill.id}`,
        );
      }
    } else {
      console.log(`No progress fill found for item at index ${idx}`);
    }
  });

  // Listen for phase changes to award bonuses and reset click counters
  window.addEventListener("gamePhaseChanged", () => {
    awardPhaseCompletionBonuses();
    resetPhaseClickCounters();
  });

  // Initialize campaign progress from politician bonuses after a short delay
  setTimeout(() => {
    initializeCampaignProgressFromPoliticianBonuses();
    // Also initialize campaign info displays after policy data is loaded
    setTimeout(updateAllProgressBars, 200);
  }, 500);
});

// Export functions for use in other modules
window.policyProgress = policyProgress;
window.incrementPolicy = incrementPolicy;
window.updateAllProgressBars = updateAllProgressBars;
window.initializeCampaignProgressFromPoliticianBonuses =
  initializeCampaignProgressFromPoliticianBonuses;
window.getCampaignCost = getCampaignCost;
window.resetPhaseClickCounters = resetPhaseClickCounters;
window.canClickPolicyThisPhase = canClickPolicyThisPhase;
window.updateCampaignInfoDisplay = updateCampaignInfoDisplay;
window.getTierDescription = getTierDescription;

// Function to initialize campaign progress based on politician bonuses
function initializeCampaignProgressFromPoliticianBonuses() {
  console.log("Initializing campaign progress from politician bonuses");

  try {
    // Get game configuration with selected politicians
    const config = localStorage.getItem("gameConfig");
    if (!config) {
      console.warn(
        "No game configuration found, skipping bonus initialization",
      );
      return;
    }

    const gameConfig = JSON.parse(config);
    const player1PoliticianName = gameConfig.player1Politician?.name || gameConfig.player1Politician;
    const player2PoliticianName = gameConfig.player2Politician?.name || gameConfig.player2Politician;

    if (!player1PoliticianName || !player2PoliticianName) {
      console.warn("Missing politician names in game configuration");
      return;
    }

    // Load politicians data to get their policies
    fetch("./data/politicians-data.json")
      .then((response) => response.json())
      .then((politiciansData) => {
        // Find politician objects by name
        const player1Politician = politiciansData.politicians.find(
          politician => politician.name === player1PoliticianName
        );
        const player2Politician = politiciansData.politicians.find(
          politician => politician.name === player2PoliticianName
        );

        if (!player1Politician || !player2Politician) {
          console.warn("Could not find politician data for:", {
            player1: player1PoliticianName,
            player2: player2PoliticianName
          });
          return;
        }

        console.log("Player 1 politician:", player1Politician.name);
        console.log("Player 2 politician:", player2Politician.name);

        // Debug: Log all policies for both politicians
        console.log("Player 1 policies:", player1Politician.policies);
        console.log("Player 2 policies:", player2Politician.policies);

        // Continue with the rest of the initialization...
        initializePoliciesWithBonuses(player1Politician, player2Politician);
      })
      .catch((error) => {
        console.error("Error loading politicians data for policy initialization:", error);
      });
  } catch (error) {
    console.error(
      "Error initializing campaign progress from politician bonuses:",
      error,
    );
  }
}

// Separate function to handle the actual policy initialization
function initializePoliciesWithBonuses(player1Politician, player2Politician) {
  // Reset all progress to ensure we start fresh
  Object.keys(policyProgress).forEach((category) => {
    policyProgress[category].forEach((policy) => {
      policy.player1 = 0;
      policy.player2 = 0;
      policy.completed = false;
    });
  });
  // Define mapping from politician policy names to UI campaign categories and indices
  const policyToCampaignMap = {
    Education: { category: "social", index: 0 },
    "Rural Development": { category: "social", index: 1 },
    "Women's Empowerment": { category: "social", index: 2 },
    Healthcare: { category: "social", index: 3 },

    "Land Reforms": { category: "land", index: 0 },
    "Agricultural Reforms": { category: "land", index: 1 },
    "Water and Mineral Rights": { category: "land", index: 2 },
    Infrastructure: { category: "land", index: 3 },

    "Economic Liberalization": { category: "economy", index: 0 },
    Privatization: { category: "economy", index: 1 },
    "Public Sector": { category: "economy", index: 2 },
    "Digital Transformation": { category: "economy", index: 3 },

    "Anti-Corruption": { category: "justice", index: 0 },
    "Judicial Activism": { category: "justice", index: 1 },
    "Press Freedom": { category: "justice", index: 2 },
    "Law and Order": { category: "justice", index: 3 },

    "Hindi Language": { category: "culture", index: 0 },
    Hindutva: { category: "culture", index: 1 },
    Secularism: { category: "culture", index: 2 },
    "Indigenous Rights": { category: "culture", index: 3 },

    "Caste Reservation": { category: "governance", index: 0 },
    "Uniform Civil Code": { category: "governance", index: 1 },
    "State's Rights": { category: "governance", index: 2 },
    "National Defense": { category: "governance", index: 3 }
  };
  // Process player 1 politician bonuses
  if (player1Politician.policies) {
    player1Politician.policies.forEach((policy) => {
      const mapping = policyToCampaignMap[policy.name];
      if (mapping) {
        const { category, index } = mapping;
        // Set initial progress for player 1
        if (policyProgress[category] && policyProgress[category][index]) {
          policyProgress[category][index].player1 = policy.bonus;
          console.log(
            `Player 1: Set ${policy.name} (${category}-${index + 1}) to ${policy.bonus}%`,
          );
        }
      } else {
        console.warn(`Player 1: No mapping found for policy "${policy.name}"`);
      }
    });
  }

  // Process player 2 politician bonuses
  if (player2Politician.policies) {
    player2Politician.policies.forEach((policy) => {
      const mapping = policyToCampaignMap[policy.name];
      if (mapping) {
        const { category, index } = mapping;
        // Set initial progress for player 2
        if (policyProgress[category] && policyProgress[category][index]) {
          policyProgress[category][index].player2 = policy.bonus;
          console.log(
            `Player 2: Set ${policy.name} (${category}-${index + 1}) to ${policy.bonus}%`,
          );
        }
      } else {
        console.warn(`Player 2: No mapping found for policy "${policy.name}"`);
      }
    });
  }

  // Update all progress bars to reflect the initial bonuses
  updateAllProgressBars();

  // Check for any campaigns that are now complete due to initial bonuses
  Object.entries(policyProgress).forEach(([category, policies]) => {
    policies.forEach((policy, index) => {
      // Check if campaign is now completed
      if (policy.player1 + policy.player2 >= 100 && !policy.completed) {
        policy.completed = true;

        // Award completion bonus to the player who contributed more
        const dominantPlayer = policy.player1 > policy.player2 ? 1 : 2;
        const dominantPlayerObj = dominantPlayer === 1 ? player1 : player2;

        // Award one-time bonus
        dominantPlayerObj.updateFunds(CAMPAIGN_COMPLETION_BONUS);

        // Get the actual policy name and apply effects to all states
        const policyName = POLICY_MAPPING[category] && POLICY_MAPPING[category][index];
        if (policyName) {
          console.log(`Applying initial policy effects for "${policyName}" completed by Player ${dominantPlayer}`);
          
          // Apply policy effects to all states with the completing player ID
          if (window.policyCalculator) {
            window.policyCalculator.applyPolicyEffects(policyName, dominantPlayer);
          } else {
            console.warn('Policy calculator not available for initial policy');
          }
        } else {
          console.warn(`Could not find policy name for initial ${category}-${index + 1}`);
        }

        // Show completion notification
        showCampaignCompletionNotification(category, index, dominantPlayer);

        // Log completion
        console.log(
          `Campaign ${category}-${index + 1} completed from initial politician bonuses! Player ${dominantPlayer} awarded ${CAMPAIGN_COMPLETION_BONUS}M bonus.`,
        );

        // Record that this policy is now eligible for phase bonuses
        if (!window.completedPolicies) {
          window.completedPolicies = [];
        }
        window.completedPolicies.push({
          category,
          index,
          dominantPlayer,
          policyName
        });
      }
    });
  });

  console.log("Campaign progress initialization complete");
}

// Initialize campaign progress from politician bonuses when game loads
document.addEventListener("DOMContentLoaded", () => {
  // Wait a short moment to ensure other initialization is complete
  setTimeout(initializeCampaignProgressFromPoliticianBonuses, 500);
});

// Export the initialization function
window.initializeCampaignProgressFromPoliticianBonuses =
  initializeCampaignProgressFromPoliticianBonuses;
