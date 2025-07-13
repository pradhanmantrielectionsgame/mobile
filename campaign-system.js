// Campaign System Management
// This file handles campaign functionality, policy loading, and campaign interactions

// Campaign system variables
let policyTags = null;
let campaignProgress = {};
let campaignClicks = {};

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
        });
        
        console.log('Policy tags loaded:', Object.keys(policyTags).length, 'policies');
        return true;
    } catch (error) {
        console.error('Error loading policy tags:', error);
        return false;
    }
}

// Initialize rally system for all states
function initializeRallySystem() {
    const config = getGameConfig();
    const statesData = getStatesData();
    
    // Initialize used rallies tracker for each state
    statesData.forEach(state => {
        rallyTokens.player1.used[state.State] = 0;
        rallyTokens.player2.used[state.State] = 0;
    });
}

// Reset rally tokens at start of each phase
function resetRallyTokensForPhase() {
    const config = getGameConfig();
    rallyTokens.player1.available = config.rallySystem.maxRalliesPerPhase;
    rallyTokens.player2.available = config.rallySystem.maxRalliesPerPhase;
}

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
            <strong>Instructions:</strong> Click to invest in campaigns (10 clicks to complete). 
            Hold <strong>Shift + Click</strong> for Player 2. Each tier has different costs and impacts.
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
                <div class="campaign-cost">₹${cost}M</div>
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
        return;
    }
    
    if (totalClicks >= 10) {
        showCampaignMessage(`${policyName} campaign has reached maximum clicks!`, 'warning');
        return;
    }
    
    // Determine player (shift = player 2, otherwise player 1)
    const playerId = e.shiftKey ? 'player2' : 'player1';
    const playerData = getPlayerData(playerId);
    
    if (!playerData) {
        showCampaignMessage(`Player data not found!`, 'error');
        return;
    }
    
    if (playerData.funds < cost) {
        showCampaignMessage(`${playerData.name} has insufficient funds! Need ₹${cost}M, have ₹${playerData.funds}M`, 'error');
        showInsufficientFundsAnimation(playerId);
        return;
    }
    
    // Update campaign progress
    const playerNum = playerId === 'player1' ? 1 : 2;
    campaignClicks[policyName][`player${playerNum}`]++;
    campaignProgress[policyName][`player${playerNum}`] += 10; // 10% per click
    
    // Update player funds using the new system
    updatePlayerFunds(playerId, -cost);
    
    // Check if completed
    const newTotal = campaignProgress[policyName].player1 + campaignProgress[policyName].player2;
    if (newTotal >= 100) {
        campaignProgress[policyName].completed = true;
        const winner = campaignProgress[policyName].player1 > campaignProgress[policyName].player2 ? 1 : 2;
        const winnerData = getPlayerData(`player${winner}`);
        showCampaignMessage(`🎉 ${policyName} campaign completed by ${winnerData ? winnerData.name : `Player ${winner}`}!`, 'success');
    } else {
        showCampaignMessage(`${playerData.name} invested ₹${cost}M in ${policyName}`, 'success');
    }
    
    // Check and award bonuses
    checkAndAwardBonuses();
    
    // Regenerate grid to show updates
    generateCampaignGrid();
    
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
                showCampaignMessage(`Policy completion bonus: ₹${config.bonuses.campaignCompletion / 1000000}M awarded to Player 1!`, 'success');
            } else if (p2Contribution > p1Contribution) {
                updatePlayerFunds('player2', config.bonuses.campaignCompletion);
                showCampaignMessage(`Policy completion bonus: ₹${config.bonuses.campaignCompletion / 1000000}M awarded to Player 2!`, 'success');
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
                    showCampaignMessage(`Regional dominance achieved in ${regionField.replace(/([A-Z])/g, ' $1').trim()}! ₹${config.bonuses.regionalDominance.baseBonus / 1000000}M bonus!`, 'success');
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

// Rally button functionality (placeholder)
function initRallyButton() {
    const rallyBtn = document.getElementById('rally-btn');
    rallyBtn.addEventListener('click', () => {
        alert('Rally system coming soon! This will allow you to boost popularity in selected states.');
    });
}
