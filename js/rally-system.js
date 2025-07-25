// Rally System
// Handles rally token mechanics and rally actions

// Use simple rally token for targeted state popularity boost
async function useSimpleRallyToken(stateId, playerId) {
    const state = findStateById(stateId);
    const playerData = getPlayerData(playerId);
    
    if (!state || !playerData) {
        console.error('Invalid state or player for rally');
        return false;
    }
    
    // Check if player has simple rally tokens
    if (playerData.rallyTokens.simple <= 0) {
        showRallyMessage(`${playerData.name} has no simple rally tokens left!`, 'error');
        return false;
    }
    
    const rallyConfig = await getRallyConfig();
    
    // Use the rally token
    playerData.rallyTokens.simple--;
    
    // Apply popularity boost
    const popularityBoost = rallyConfig.simpleRallyBoost;
    const success = updateStatePopularity(stateId, playerId, popularityBoost, `simple rally in ${state.State}`);
    
    if (success) {
        showRallyMessage(
            `${playerData.name} held a rally in ${state.State} (+${popularityBoost}% popularity)`,
            'success'
        );
        updateRallyTokenDisplay();
        return true;
    }
    
    return false;
}

// Use special rally token for nationwide popularity boost
async function useSpecialRallyToken(playerId) {
    const playerData = getPlayerData(playerId);
    
    if (!playerData) {
        console.error('Invalid player for special rally');
        return false;
    }
    
    // Check if player has special rally tokens
    if (playerData.rallyTokens.special <= 0) {
        showRallyMessage(`${playerData.name} has no special rally tokens left!`, 'error');
        return false;
    }
    
    const rallyConfig = await getRallyConfig();
    const statesData = getStatesData();
    
    // Use the special rally token
    playerData.rallyTokens.special--;
    
    // Apply popularity boost nationwide
    const popularityBoost = rallyConfig.specialRallyBoost;
    let affectedStates = 0;
    
    statesData.forEach(state => {
        const success = updateStatePopularity(state.SvgId, playerId, popularityBoost, 'nationwide special rally');
        if (success) affectedStates++;
    });
    
    showRallyMessage(
        `${playerData.name} held a nationwide campaign (+${popularityBoost}% popularity across ${affectedStates} states)`,
        'success'
    );
    
    updateRallyTokenDisplay();
    return true;
}

// Reset rally tokens at the start of each phase
async function resetRallyTokensForPhase() {
    const rallyConfig = await getRallyConfig();
    const player1Data = getPlayerData('player1');
    const player2Data = getPlayerData('player2');
    
    if (player1Data) {
        player1Data.rallyTokens.simple = rallyConfig.tokensPerPhase;
        player1Data.rallyTokens.special = rallyConfig.tokensPerPhase;
    }
    
    if (player2Data) {
        player2Data.rallyTokens.simple = rallyConfig.tokensPerPhase;
        player2Data.rallyTokens.special = rallyConfig.tokensPerPhase;
    }
    
    console.log(`Rally tokens reset for new phase: ${rallyConfig.tokensPerPhase} simple, ${rallyConfig.tokensPerPhase} special`);
    updateRallyTokenDisplay();
}

// Update rally token display in UI
function updateRallyTokenDisplay() {
    const player1Data = getPlayerData('player1');
    const player2Data = getPlayerData('player2');
    
    // Rally tokens are tracked internally but no longer displayed in player info panels
    // Token counts are managed by the rally system but UI display has been removed for space optimization
}

// Show rally messages
function showRallyMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 110px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#9C27B0' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
        max-width: 80%;
        text-align: center;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 4000);
}

// Get rally token stats for a player
function getRallyTokenStats(playerId) {
    const playerData = getPlayerData(playerId);
    if (!playerData) return null;
    
    return {
        simpleTokens: playerData.rallyTokens.simple,
        specialTokens: playerData.rallyTokens.special,
        totalTokens: playerData.rallyTokens.simple + playerData.rallyTokens.special
    };
}

// Check if player can use rally token
function canUseRallyToken(playerId, tokenType = 'simple') {
    const playerData = getPlayerData(playerId);
    if (!playerData) return false;
    
    if (tokenType === 'simple') {
        return playerData.rallyTokens.simple > 0;
    } else if (tokenType === 'special') {
        return playerData.rallyTokens.special > 0;
    }
    
    return false;
}

// Export functions for global access
window.useSimpleRallyToken = useSimpleRallyToken;
window.useSpecialRallyToken = useSpecialRallyToken;
window.resetRallyTokensForPhase = resetRallyTokensForPhase;
window.updateRallyTokenDisplay = updateRallyTokenDisplay;
window.showRallyMessage = showRallyMessage;
window.getRallyTokenStats = getRallyTokenStats;
window.canUseRallyToken = canUseRallyToken;
