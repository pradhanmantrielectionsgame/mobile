// Campaign System Management
// This file handles campaign functionality, policy loading, and campaign interactions

// Campaign system variables
let policyTags = null;
let campaignProgress = {};
let campaignClicks = {};

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
        
        item.innerHTML = `
            <div class="campaign-header">
                <div class="campaign-title">${policyName}</div>
                <div class="campaign-cost">₹${cost}M</div>
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
    const playerId = e.shiftKey ? 2 : 1;
    const fundsElement = document.getElementById(`p${playerId}-funds`);
    const playerFunds = parseInt(fundsElement.textContent.replace('₹', '').replace('M', ''));
    
    if (playerFunds < cost) {
        showCampaignMessage(`Player ${playerId} has insufficient funds! Need ${cost}M, have ${playerFunds}M`, 'error');
        return;
    }
    
    // Update campaign progress
    campaignClicks[policyName][`player${playerId}`]++;
    campaignProgress[policyName][`player${playerId}`] += 10; // 10% per click
    
    // Update player funds with animation
    const newFunds = playerFunds - cost;
    fundsElement.textContent = `₹${newFunds}M`;
    fundsElement.style.transform = 'scale(1.1)';
    fundsElement.style.color = '#ff6b6b';
    setTimeout(() => {
        fundsElement.style.transform = 'scale(1)';
        fundsElement.style.color = '#4CAF50';
    }, 200);
    
    // Check if completed
    const newTotal = campaignProgress[policyName].player1 + campaignProgress[policyName].player2;
    if (newTotal >= 100) {
        campaignProgress[policyName].completed = true;
        const winner = campaignProgress[policyName].player1 > campaignProgress[policyName].player2 ? 1 : 2;
        showCampaignMessage(`🎉 ${policyName} campaign completed by Player ${winner}!`, 'success');
    } else {
        showCampaignMessage(`Player ${playerId} invested ${cost}M in ${policyName}`, 'success');
    }
    
    // Regenerate grid to show updates
    generateCampaignGrid();
    
    console.log(`Player ${playerId} invested in ${policyName}. Total progress: ${newTotal}%`);
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
