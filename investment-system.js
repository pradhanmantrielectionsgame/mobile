// Investment System
// Handles direct investment mechanics and diminishing returns

// Handle direct investment in a state
async function handleDirectInvestment(stateId, playerId) {
    const state = findStateById(stateId);
    const playerData = getPlayerData(playerId);
    
    if (!state || !playerData) {
        console.error('Invalid state or player for direct investment');
        return false;
    }
    
    const investmentConfig = await getInvestmentConfig();
    
    // Calculate investment cost: seats × base cost per seat
    const seats = parseInt(state.LokSabhaSeats);
    const baseCost = seats * investmentConfig.baseCostPerSeat;
    
    // Check if player has sufficient funds
    if (playerData.funds < baseCost) {
        showInsufficientFundsAnimation(playerId);
        return false;
    }
    
    // Initialize investment tracking for this state if needed
    if (!playerData.investments[stateId]) {
        playerData.investments[stateId] = 0;
    }
    
    // Calculate diminishing returns
    const investmentCount = playerData.investments[stateId];
    let popularityBoost = investmentConfig.basePopularityBoost;
    
    // Apply diminishing returns: each subsequent investment gives reduced effect
    for (let i = 0; i < investmentCount; i++) {
        popularityBoost *= investmentConfig.diminishingReturnsRate;
    }
    
    // Round to 1 decimal place
    popularityBoost = Math.round(popularityBoost * 10) / 10;
    
    // Minimum boost
    popularityBoost = Math.max(investmentConfig.minimumBoost, popularityBoost);
    
    // Update player funds
    updatePlayerFunds(playerId, -baseCost);
    
    // Track the investment
    playerData.investments[stateId]++;
    
    // Apply popularity boost
    const success = updateStatePopularity(stateId, playerId, popularityBoost, `direct investment #${playerData.investments[stateId]}`);
    
    if (success) {
        showInvestmentMessage(
            `${playerData.name} invested ₹${baseCost}M in ${state.State} (+${popularityBoost}% popularity)`,
            'success'
        );
        return true;
    }
    
    return false;
}

// Get investment stats for a player
function getInvestmentStats(playerId) {
    const playerData = getPlayerData(playerId);
    if (!playerData) return null;
    
    const stats = {
        totalInvestments: 0,
        statesInvested: 0,
        totalSpentOnInvestments: 0
    };
    
    Object.keys(playerData.investments).forEach(stateId => {
        const investmentCount = playerData.investments[stateId];
        if (investmentCount > 0) {
            stats.totalInvestments += investmentCount;
            stats.statesInvested++;
            
            // Calculate total spent on this state
            const state = findStateById(stateId);
            if (state) {
                const baseCost = parseInt(state.LokSabhaSeats) * 10; // Assuming 10M per seat base cost
                stats.totalSpentOnInvestments += baseCost * investmentCount;
            }
        }
    });
    
    return stats;
}

// Show investment messages
function showInvestmentMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        z-index: 1000;
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease;
        max-width: 70%;
        text-align: center;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 1500);
}

// Calculate investment cost for a state
async function calculateInvestmentCost(stateId) {
    const state = findStateById(stateId);
    if (!state) return 0;
    
    const investmentConfig = await getInvestmentConfig();
    const seats = parseInt(state.LokSabhaSeats);
    return seats * investmentConfig.baseCostPerSeat;
}

// Calculate expected popularity boost for next investment
async function calculateNextInvestmentBoost(stateId, playerId) {
    const playerData = getPlayerData(playerId);
    if (!playerData) return 0;
    
    const investmentConfig = await getInvestmentConfig();
    const investmentCount = playerData.investments[stateId] || 0;
    
    let popularityBoost = investmentConfig.basePopularityBoost;
    
    // Apply diminishing returns for current investment count
    for (let i = 0; i < investmentCount; i++) {
        popularityBoost *= investmentConfig.diminishingReturnsRate;
    }
    
    // Round to 1 decimal place
    popularityBoost = Math.round(popularityBoost * 10) / 10;
    
    // Apply minimum boost
    return Math.max(investmentConfig.minimumBoost, popularityBoost);
}

// Export functions for global access
window.handleDirectInvestment = handleDirectInvestment;
window.getInvestmentStats = getInvestmentStats;
window.showInvestmentMessage = showInvestmentMessage;
window.calculateInvestmentCost = calculateInvestmentCost;
window.calculateNextInvestmentBoost = calculateNextInvestmentBoost;
