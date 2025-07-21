// Campaign System Management
// This file handles campaign functionality, policy loading, and campaign interactions

// Campaign system variables
let policyTags = null;
let campaignProgress = {};
let campaignClicks = {};
let campaignPhaseContributions = {}; // Track contributions per phase per player

// Rally system variables
let rallyTokens = {
    player1: { available: 2, used: {} }, // used tracks rallies per state
    player2: { available: 2, used: {} }
};

// Load policy tags data
async function loadPolicyTags() {
    try {
        const response = await fetch('data/policy-tags.json');
        const data = await response.json();
        policyTags = data.policyTags;
        
        // Initialize campaign progress
        Object.keys(policyTags).forEach(policyName => {
            campaignProgress[policyName] = {
                player1: 0,
                player2: 0,
                completed: false
            };
            campaignClicks[policyName] = {
                player1: 0,
                player2: 0
            };
            campaignPhaseContributions[policyName] = {
                player1: 0,
                player2: 0
            };
        });
        
        console.log('Policy tags loaded:', Object.keys(policyTags).length, 'policies');
        return true;
    } catch (error) {
        console.error('Error loading policy tags:', error);
        return false;
    }
}

// Initialize rally system for all states
async function initializeRallySystem() {
    const config = await getGameConfig();
    const statesData = getStatesData();
    
    // Initialize used rallies tracker for each state
    statesData.forEach(state => {
        rallyTokens.player1.used[state.State] = 0;
        rallyTokens.player2.used[state.State] = 0;
    });
    
    console.log('Rally system initialized for', statesData.length, 'states');
}

// Reset rally tokens at start of each phase (deprecated - use the one in game-data.js)
// function resetRallyTokensForPhase() {
//     const config = getGameConfig();
//     rallyTokens.player1.available = config.rallySystem.maxRalliesPerPhase;
//     rallyTokens.player2.available = config.rallySystem.maxRalliesPerPhase;
// }

// Generate campaign grid
function generateCampaignGrid() {
    const grid = document.getElementById('campaign-grid');
    if (!policyTags) return;
    
    grid.innerHTML = '';
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'campaign-instructions';
    instructions.innerHTML = `
        <div style="background: rgba(59, 64, 189, 0.2); padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 12px; border: 1px solid #3b40bd;">
            <strong>Campaign Instructions:</strong> Click to invest in campaigns (10 clicks to complete). 
            Hold <strong>Shift + Click</strong> for Player 2. Each tier has different costs and impacts.<br>
            <strong>Map Instructions:</strong> Click states to select & invest. Alt+Click for rallies. Ctrl/Cmd+Click for info only.
        </div>
    `;
    grid.appendChild(instructions);
    
    // Sort policies by tier (1 = highest priority)
    const sortedPolicies = Object.entries(policyTags).sort((a, b) => {
        return a[1].tier - b[1].tier;
    });
    
    sortedPolicies.forEach(([policyName, policyData]) => {
        const item = document.createElement('div');
        item.className = `campaign-item tier-${policyData.tier}`;
        item.dataset.policy = policyName;
        
        const progress = campaignProgress[policyName];
        const totalProgress = Math.min(100, progress.player1 + progress.player2);
        const clicks = campaignClicks[policyName];
        const totalClicks = clicks.player1 + clicks.player2;
        
        // Debug logging for progress calculation
        console.log(`Generating grid for ${policyName}: P1=${progress.player1}%, P2=${progress.player2}%, Total=${totalProgress}%`);
        
        // Determine cost based on tier
        const baseCost = policyData.baseMagnitude || 4;
        const cost = baseCost * 5; // 5M per magnitude point
        
        // Determine dominant player color
        let progressClass = 'player1';
        if (progress.player2 > progress.player1) {
            progressClass = 'player2';
        } else if (progress.player1 === progress.player2 && progress.player1 > 0) {
            progressClass = 'player1'; // Default to player1 in ties
        }
        
        // Helper function to convert camelCase/PascalCase to readable labels
        function toLabel(str) {
            return str
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, s => s.toUpperCase())
                .replace(/\bAnd\b/g, '&')
                .trim();
        }
        
        // Generate support and oppose labels
        let supportLabels = '';
        let opposeLabels = '';
        
        // Check if both arrays are empty - show nationwide effect
        if ((!policyData.supportTags || policyData.supportTags.length === 0) && 
            (!policyData.opposeTags || policyData.opposeTags.length === 0)) {
            supportLabels = `<span class="support-label">+${policyData.baseMagnitude || 4}% Nationwide</span>`;
        } else {
            // Generate specific region labels
            supportLabels = (policyData.supportTags || [])
                .map(tag => `<span class="support-label">+${policyData.baseMagnitude || 4}% ${toLabel(tag)}</span>`)
                .join(' ');
            opposeLabels = (policyData.opposeTags || [])
                .map(tag => `<span class="oppose-label">-${policyData.baseMagnitude || 4}% ${toLabel(tag)}</span>`)
                .join(' ');
        }
        
        item.innerHTML = `
            <div class="campaign-header">
                <div class="campaign-title">${policyName}</div>
                <div class="campaign-cost">₹${cost}Cr</div>
            </div>
            <div class="campaign-labels">
                ${supportLabels} ${opposeLabels}
            </div>
            <div class="campaign-progress">
                <div class="campaign-progress-bar">
                    <div class="campaign-progress-fill ${progressClass} ${progress.completed ? 'complete' : ''}" 
                         style="width: ${totalProgress}%"></div>
                </div>
            </div>
        `;
        
        // Add click handler
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Campaign item clicked:', policyName);
            handleCampaignClick(e, policyName, policyData, progress, totalClicks, cost);
        });
        
        grid.appendChild(item);
    });
}

// Handle campaign item clicks
function handleCampaignClick(e, policyName, policyData, progress, totalClicks, cost) {
    if (progress.completed) {
        showCampaignMessage(`${policyName} campaign is already completed!`, 'info');
        // Play invalid action sound
        if (typeof window.playAudio === 'function') {
            window.playAudio('invalid_action');
        }
        return;
    }
    
    if (totalClicks >= 10) {
        showCampaignMessage(`${policyName} campaign has reached maximum clicks!`, 'warning');
        // Play invalid action sound
        if (typeof window.playAudio === 'function') {
            window.playAudio('invalid_action');
        }
        return;
    }
    
    // Determine player (shift = player 2, otherwise player 1)
    const playerId = e.shiftKey ? 'player2' : 'player1';
    const playerData = getPlayerData(playerId);
    
    if (!playerData) {
        showCampaignMessage(`Player data not found!`, 'error');
        // Play invalid action sound
        if (typeof window.playAudio === 'function') {
            window.playAudio('invalid_action');
        }
        return;
    }
    
    if (playerData.funds < cost) {
        showInsufficientFundsAnimation(playerId);
        // Play invalid action sound
        if (typeof window.playAudio === 'function') {
            window.playAudio('invalid_action');
        }
        return;
    }
    
    // Check phase contribution limit
    const config = getGameConfig();
    const maxPerPhase = config?.campaign?.maxContributionsPerPhase || 5;
    const playerContributions = campaignPhaseContributions[policyName]?.[playerId] || 0;
    
    if (playerContributions >= maxPerPhase) {
        showCampaignMessage(`Maximum ${maxPerPhase} contributions per phase reached for ${policyName}!`, 'warning');
        // Play invalid action sound
        if (typeof window.playAudio === 'function') {
            window.playAudio('invalid_action');
        }
        return;
    }
    
    // Update campaign progress
    const playerNum = playerId === 'player1' ? 1 : 2;
    campaignClicks[policyName][`player${playerNum}`]++;
    campaignProgress[policyName][`player${playerNum}`] += 10; // 10% per click
    campaignPhaseContributions[policyName][playerId]++; // Track phase contributions
    
    // Debug logging for progress
    console.log(`Progress updated for ${policyName}:`, campaignProgress[policyName]);
    const debugTotal = campaignProgress[policyName].player1 + campaignProgress[policyName].player2;
    console.log(`Total progress: ${debugTotal}%`);
    console.log(`Phase contributions for ${policyName}:`, campaignPhaseContributions[policyName]);
    
    // Update player funds using the new system
    updatePlayerFunds(playerId, -cost);
    
    // Play money spent sound
    if (typeof window.playAudio === 'function') {
        window.playAudio('money_spent');
    }
    
    // Check if completed
    const newTotal = campaignProgress[policyName].player1 + campaignProgress[policyName].player2;
    if (newTotal >= 100) {
        campaignProgress[policyName].completed = true;
        const winner = campaignProgress[policyName].player1 > campaignProgress[policyName].player2 ? 1 : 2;
        const winnerData = getPlayerData(`player${winner}`);
        showCampaignMessage(`🎉 ${policyName} campaign completed by ${winnerData ? winnerData.name : `Player ${winner}`}!`, 'success');
    } else {
        showCampaignMessage(`${playerData.name} invested ₹${cost}Cr in ${policyName}`, 'success');
    }
    
    // Check and award bonuses
    checkAndAwardBonuses();
    
    // Regenerate the full grid to show updates with proper timing
    requestAnimationFrame(() => {
        generateCampaignGrid();
    });
    
    console.log(`${playerId} invested in ${policyName}. Total progress: ${newTotal}%`);
}

// Check and award bonuses
function checkAndAwardBonuses() {
    const config = getGameConfig();
    
    // Check policy completion bonuses
    Object.keys(campaignProgress).forEach(policyName => {
        const progress = campaignProgress[policyName];
        if (progress.completed && !progress.bonusAwarded) {
            // Award bonus to player with majority contribution
            const p1Contribution = progress.player1;
            const p2Contribution = progress.player2;
            
            if (p1Contribution > p2Contribution) {
                updatePlayerFunds('player1', config.bonuses.campaignCompletion);
                showCampaignMessage(`Policy completion bonus: ₹${config.bonuses.campaignCompletion / 1000000}Cr awarded to Player 1!`, 'success');
            } else if (p2Contribution > p1Contribution) {
                updatePlayerFunds('player2', config.bonuses.campaignCompletion);
                showCampaignMessage(`Policy completion bonus: ₹${config.bonuses.campaignCompletion / 1000000}Cr awarded to Player 2!`, 'success');
            }
            
            progress.bonusAwarded = true;
        }
    });
    
    // Check regional dominance bonuses
    checkRegionalDominanceBonuses();
}

// Check regional dominance bonuses
function checkRegionalDominanceBonuses() {
    const config = getGameConfig();
    const statesData = getStatesData();
    
    ['player1', 'player2'].forEach(playerId => {
        // Check each regional group
        ['SouthIndia', 'HindiHeartland', 'NortheastIndia', 'CoastalIndia'].forEach(regionField => {
            const regionStates = statesData.filter(state => state[regionField] === 'TRUE');
            const allDominant = regionStates.every(state => {
                const stateIndex = getStateIndex(state.State);
                return stateIndex !== -1 && gameState.popularity[stateIndex][playerId] > 50;
            });
            
            if (allDominant) {
                const bonusKey = `${playerId}_${regionField}_bonus`;
                if (!gameState.bonusesAwarded) gameState.bonusesAwarded = {};
                
                if (!gameState.bonusesAwarded[bonusKey]) {
                    // First time achieving dominance - award initial bonus
                    updatePlayerFunds(playerId, config.bonuses.regionalDominance.baseBonus);
                    gameState.bonusesAwarded[bonusKey] = true;
                    showCampaignMessage(`Regional dominance achieved in ${regionField.replace(/([A-Z])/g, ' $1').trim()}! ₹${config.bonuses.regionalDominance.baseBonus / 1000000}Cr bonus!`, 'success');
                }
                
                // Award carry-forward bonus every phase
                updatePlayerFunds(playerId, config.bonuses.regionalDominance.carryForwardBonus);
            }
        });
    });
}

// Handle rally button click for a specific state
function handleRallyClick(stateName, playerId) {
    const config = getGameConfig();
    const playerTokens = rallyTokens[playerId];
    
    // Check if player has available rally tokens
    if (playerTokens.available <= 0) {
        showCampaignMessage(`No rally tokens remaining for this phase!`, 'error');
        return false;
    }
    
    // Check if state has reached maximum rallies
    if (playerTokens.used[stateName] >= config.rallySystem.maxRalliesPerState) {
        showCampaignMessage(`Maximum rallies reached for ${stateName}!`, 'error');
        return false;
    }
    
    // Conduct rally
    playerTokens.available--;
    playerTokens.used[stateName]++;
    
    // Boost popularity using the new system
    const popularityBoost = config.rallySystem.popularityBoost;
    const stateData = statesData.find(state => state.State === stateName);
    
    if (stateData) {
        // Use the new updateStatePopularity function
        const success = updateStatePopularity(stateData.SvgId, playerId, popularityBoost, `rally in ${stateName}`);
        
        if (success) {
            showCampaignMessage(`Rally successful in ${stateName}! +${popularityBoost}% popularity`, 'success');
            return true;
        }
    }
    
    return false;
}

// Get available rally information for display
function getRallyInfo(playerId) {
    return {
        available: rallyTokens[playerId].available,
        used: rallyTokens[playerId].used
    };
}

/**
 * Reset campaign phase contributions when a new phase begins
 * Called automatically by the phase system
 */
function resetCampaignPhaseContributions() {
    if (!policyTags) return;
    
    Object.keys(policyTags).forEach(policyName => {
        campaignPhaseContributions[policyName] = {
            player1: 0,
            player2: 0
        };
    });
    
    console.log('Campaign phase contributions reset for new phase');
}

/**
 * Update a single campaign's progress bar without regenerating the entire grid
 * Used for immediate visual feedback before full grid refresh
 * @param {string} policyName - The name of the policy to update
 */
function updateSingleCampaignProgressBar(policyName) {
    const campaignItem = document.querySelector(`[data-policy="${policyName}"]`);
    if (!campaignItem) {
        console.log(`Campaign item not found for: ${policyName}`);
        return;
    }
    
    const progress = campaignProgress[policyName];
    const totalProgress = Math.min(100, progress.player1 + progress.player2);
    
    // Determine dominant player color
    let progressClass = 'player1';
    if (progress.player2 > progress.player1) {
        progressClass = 'player2';
    } else if (progress.player1 === progress.player2 && progress.player1 > 0) {
        progressClass = 'player1';
    }
    
    const progressFill = campaignItem.querySelector('.campaign-progress-fill');
    if (progressFill) {
        // Force a reflow before updating
        progressFill.offsetHeight;
        
        // Update the width and class immediately
        progressFill.style.width = `${totalProgress}%`;
        progressFill.className = `campaign-progress-fill ${progressClass} ${progress.completed ? 'complete' : ''}`;
        
        // Force another reflow to ensure the change is applied
        progressFill.offsetHeight;
        
        console.log(`Progress bar updated for ${policyName}: ${totalProgress}% with class: ${progressClass}`);
    } else {
        console.log(`Progress fill element not found for: ${policyName}`);
    }
}

// Show campaign messages
function showCampaignMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
    `;
    messageDiv.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
        style.remove();
    }, 3000);
}

// Campaign modal functionality
function initCampaignModal() {
    const campaignModal = document.getElementById('campaign-modal');
    const campaignBtn = document.getElementById('campaign-btn');
    const closeBtn = campaignModal.querySelector('.close-btn');
    
    // Open modal
    campaignBtn.addEventListener('click', async () => {
        if (!policyTags) {
            await loadPolicyTags();
        }
        generateCampaignGrid();
        campaignModal.classList.add('open');
    });
    
    // Close modal via close button
    closeBtn.addEventListener('click', () => {
        campaignModal.classList.remove('open');
    });
    
    // Close modal via backdrop click
    campaignModal.addEventListener('click', (e) => {
        if (e.target === campaignModal) {
            campaignModal.classList.remove('open');
        }
    });
}

// Rally button functionality
function initRallyButton() {
    const rallyBtn = document.getElementById('rally-btn');
    rallyBtn.addEventListener('click', () => {
        showRallyInstructions();
    });
}

// Show rally instructions modal
function showRallyInstructions() {
    const modalHTML = `
        <div id="rally-instructions-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                text-align: left;
                color: #333;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <h2 style="margin-bottom: 20px; color: #9C27B0;">Rally & Investment System</h2>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #4CAF50; margin-bottom: 10px;">📍 Select & Invest</h3>
                    <p><strong>How:</strong> Click on any state</p>
                    <p><strong>Effect:</strong> Shows state info AND makes direct investment</p>
                    <p><strong>Cost:</strong> Number of seats × ₹10Cr (e.g., UP = 80 seats = ₹800Cr)</p>
                    <p><strong>Investment Effect:</strong> +5% popularity with diminishing returns</p>
                    <p><strong>Player 2:</strong> Shift + Click</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #9C27B0; margin-bottom: 10px;">🏟️ Simple Rally</h3>
                    <p><strong>How:</strong> Alt + Click on any state</p>
                    <p><strong>Tokens:</strong> 2 per phase per player</p>
                    <p><strong>Effect:</strong> +4% popularity in that state</p>
                    <p><strong>Player 2:</strong> Shift + Alt + Click</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #ff6b6b; margin-bottom: 10px;">ℹ️ State Info Only</h3>
                    <p><strong>How:</strong> Ctrl/Cmd + Click on any state</p>
                    <p><strong>Effect:</strong> Shows state information without investment</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #FF9800; margin-bottom: 10px;">🌟 Special Rally</h3>
                    <p><strong>How:</strong> Click the "Special Rally" button below</p>
                    <p><strong>Tokens:</strong> 2 per phase per player</p>
                    <p><strong>Effect:</strong> +10% popularity in ALL states</p>
                </div>
                
                <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
                    <h4>Current Rally Tokens:</h4>
                    <p>Player 1: <span id="modal-p1-simple">${gameState.player1.rallyTokens.simple}</span> Simple, <span id="modal-p1-special">${gameState.player1.rallyTokens.special}</span> Special</p>
                    <p>Player 2: <span id="modal-p2-simple">${gameState.player2.rallyTokens.simple}</span> Simple, <span id="modal-p2-special">${gameState.player2.rallyTokens.special}</span> Special</p>
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button onclick="useSpecialRallyToken('player1')" 
                            style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        P1 Special Rally
                    </button>
                    <button onclick="useSpecialRallyToken('player2')" 
                            style="flex: 1; padding: 10px; background: #e65c5c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        P2 Special Rally
                    </button>
                </div>
                
                <button onclick="document.getElementById('rally-instructions-modal').remove()" 
                        style="width: 100%; padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Master campaign system initialization function
async function initializeCampaignSystem() {
    console.log('Initializing campaign system...');
    
    try {
        // Check if required data is loaded
        const statesData = getStatesData();
        if (!statesData || statesData.length === 0) {
            console.warn('States data not loaded yet, skipping rally system initialization');
        } else {
            // Initialize rally system (now async)
            await initializeRallySystem();
        }
        
        // Initialize campaign modal (doesn't depend on states data)
        if (typeof initCampaignModal === 'function') {
            initCampaignModal();
        } else {
            console.warn('initCampaignModal function not found');
        }
        
        // Initialize rally button (doesn't depend on states data)
        if (typeof initRallyButton === 'function') {
            initRallyButton();
        } else {
            console.warn('initRallyButton function not found');
        }
        
        console.log('Campaign system initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize campaign system:', error);
        return false;
    }
}

// Make the function available globally
window.initializeCampaignSystem = initializeCampaignSystem;
window.resetCampaignPhaseContributions = resetCampaignPhaseContributions;
