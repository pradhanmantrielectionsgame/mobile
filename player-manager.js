// Player Management System
// Handles player state, funds, politicians, and interactions

// Player management system - initialized with config values
let gameState = {
    player1: {
        id: 'player1',
        name: 'Player 1',
        politician: null, // Will store selected politician data
        funds: 2000, // Will be updated from config
        totalSpent: 0,
        // Investment tracking for diminishing returns
        investments: {}, // stateId: number of investments
        // Rally tokens
        rallyTokens: {
            simple: 2, // Will be updated from config
            special: 2  // Will be updated from config
        }
    },
    player2: {
        id: 'player2', 
        name: 'Player 2',
        politician: null, // Will store selected politician data
        funds: 2000, // Will be updated from config
        totalSpent: 0,
        // Investment tracking for diminishing returns
        investments: {}, // stateId: number of investments
        // Rally tokens
        rallyTokens: {
            simple: 2, // Will be updated from config
            special: 2  // Will be updated from config
        }
    },
    currentPhase: 1,
    maxPhases: 10, // Will be updated from config
    gameStarted: false
};

// Assign a politician to a player
function assignPoliticianToPlayer(playerId, politicianId) {
    const politician = getPoliticiansData().find(p => p.id === politicianId);
    if (politician && gameState[playerId]) {
        gameState[playerId].politician = politician;
        gameState[playerId].name = `${politician.name}`;
        console.log(`Assigned ${politician.name} to ${playerId}`);
        updatePlayerInfoDisplay();
        return true;
    }
    console.error(`Failed to assign politician ${politicianId} to ${playerId}`);
    return false;
}

// Update player funds (positive amount adds, negative amount subtracts)
function updatePlayerFunds(playerId, amount) {
    if (gameState[playerId]) {
        const oldFunds = gameState[playerId].funds;
        gameState[playerId].funds = Math.max(0, gameState[playerId].funds + amount);
        
        if (amount < 0) {
            gameState[playerId].totalSpent += Math.abs(amount);
        }
        
        console.log(`${playerId} funds: ₹${oldFunds}M → ₹${gameState[playerId].funds}M`);
        
        // Update display with animation
        const fundsElement = document.getElementById(`${playerId === 'player1' ? 'p1' : 'p2'}-funds`);
        if (fundsElement) {
            fundsElement.textContent = `₹${gameState[playerId].funds}M`;
            
            // Add animation class
            if (amount < 0) {
                fundsElement.classList.add('updating');
                setTimeout(() => {
                    fundsElement.classList.remove('updating');
                }, 300);
            }
        }
        
        updatePlayerInfoDisplay();
        return true;
    }
    return false;
}

// Show insufficient funds animation
function showInsufficientFundsAnimation(playerId) {
    const fundsElement = document.getElementById(`${playerId === 'player1' ? 'p1' : 'p2'}-funds`);
    if (fundsElement) {
        fundsElement.classList.add('insufficient');
        setTimeout(() => {
            fundsElement.classList.remove('insufficient');
        }, 500);
    }
}

// Get player data
function getPlayerData(playerId) {
    return gameState[playerId] || null;
}

// Get game state
function getGameState() {
    return gameState;
}

// Update player info display in the UI
function updatePlayerInfoDisplay() {
    // Update Player 1
    const p1Data = gameState.player1;
    const p1InfoContainer = document.querySelector('.player-info.p1');
    if (p1InfoContainer && p1Data.politician) {
        p1InfoContainer.innerHTML = `
            <div class="player-avatar-section">
                <img src="${p1Data.politician.image}" alt="${p1Data.politician.name}" class="candidate-icon" onerror="this.style.display='none'">
                <img src="${p1Data.politician.partyLogo}" alt="${p1Data.politician.party}" class="party-icon" onerror="this.style.display='none'">
            </div>
            <div class="player-details">
                <div class="player-name">${p1Data.name}</div>
                <div style="display: flex; align-items: center;">
                    <div class="funds-display" id="p1-funds">₹${p1Data.funds}M</div>
                    <div class="rally-tokens">
                        <span class="token-display">🏟️<span id="p1-simple-tokens">${p1Data.rallyTokens.simple}</span></span>
                        <span class="token-display">🌟<span id="p1-special-tokens">${p1Data.rallyTokens.special}</span></span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update Player 2  
    const p2Data = gameState.player2;
    const p2InfoContainer = document.querySelector('.player-info.p2');
    if (p2InfoContainer && p2Data.politician) {
        p2InfoContainer.innerHTML = `
            <div class="player-details">
                <div class="player-name">${p2Data.name}</div>
                <div style="display: flex; align-items: center; justify-content: flex-end;">
                    <div class="rally-tokens">
                        <span class="token-display">🏟️<span id="p2-simple-tokens">${p2Data.rallyTokens.simple}</span></span>
                        <span class="token-display">🌟<span id="p2-special-tokens">${p2Data.rallyTokens.special}</span></span>
                    </div>
                    <div class="funds-display" id="p2-funds">₹${p2Data.funds}M</div>
                </div>
            </div>
            <div class="player-avatar-section">
                <img src="${p2Data.politician.image}" alt="${p2Data.politician.name}" class="candidate-icon" onerror="this.style.display='none'">
                <img src="${p2Data.politician.partyLogo}" alt="${p2Data.politician.party}" class="party-icon" onerror="this.style.display='none'">
            </div>
        `;
    }
}

// Initialize players with configuration values
async function initializePlayers() {
    // Load player starting configuration
    const playerConfig = await getPlayerStartingConfig();
    const phaseConfig = await getPhaseConfig();
    
    // Update starting funds and rally tokens from config
    gameState.player1.funds = playerConfig.funds;
    gameState.player1.rallyTokens.simple = playerConfig.simpleRallyTokens;
    gameState.player1.rallyTokens.special = playerConfig.specialRallyTokens;
    
    gameState.player2.funds = playerConfig.funds;
    gameState.player2.rallyTokens.simple = playerConfig.simpleRallyTokens;
    gameState.player2.rallyTokens.special = playerConfig.specialRallyTokens;
    
    // Update game state max phases from config
    gameState.maxPhases = phaseConfig.totalPhases;
    
    // Initialize default politicians (for demo)
    const politicians = getPoliticiansData();
    if (politicians.length >= 2) {
        assignPoliticianToPlayer('player1', politicians[0].id); // Narendra Modi
        assignPoliticianToPlayer('player2', politicians[2].id); // Rahul Gandhi
    }
    
    updatePlayerInfoDisplay();
    console.log('Players initialized with config values:', {
        startingFunds: playerConfig.funds,
        maxPhases: phaseConfig.totalPhases,
        rallyTokens: {
            simple: playerConfig.simpleRallyTokens,
            special: playerConfig.specialRallyTokens
        }
    });
}

// Update rally token display in UI
function updateRallyTokenDisplay() {
    // Update rally token counts in the UI
    const p1SimpleTokens = document.getElementById('p1-simple-tokens');
    const p1SpecialTokens = document.getElementById('p1-special-tokens');
    const p2SimpleTokens = document.getElementById('p2-simple-tokens');
    const p2SpecialTokens = document.getElementById('p2-special-tokens');
    
    if (p1SimpleTokens) p1SimpleTokens.textContent = gameState.player1.rallyTokens.simple;
    if (p1SpecialTokens) p1SpecialTokens.textContent = gameState.player1.rallyTokens.special;
    if (p2SimpleTokens) p2SimpleTokens.textContent = gameState.player2.rallyTokens.simple;
    if (p2SpecialTokens) p2SpecialTokens.textContent = gameState.player2.rallyTokens.special;
}

// Reset rally tokens at the start of each phase
async function resetRallyTokensForPhase() {
    const rallyConfig = await getRallyConfig();
    
    gameState.player1.rallyTokens.simple = rallyConfig.tokensPerPhase;
    gameState.player1.rallyTokens.special = rallyConfig.tokensPerPhase;
    gameState.player2.rallyTokens.simple = rallyConfig.tokensPerPhase;
    gameState.player2.rallyTokens.special = rallyConfig.tokensPerPhase;
    
    console.log(`Rally tokens reset for new phase: ${rallyConfig.tokensPerPhase} simple, ${rallyConfig.tokensPerPhase} special`);
    updateRallyTokenDisplay();
}

// Get investment stats for a player
async function getInvestmentStats(playerId) {
    const playerData = getPlayerData(playerId);
    if (!playerData) return null;
    
    const investmentConfig = await getInvestmentConfig();
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
            
            // Calculate total spent on this state using config
            const state = findStateById(stateId);
            if (state) {
                const baseCost = parseInt(state.LokSabhaSeats) * investmentConfig.baseCostPerSeat;
                stats.totalSpentOnInvestments += baseCost * investmentCount;
            }
        }
    });
    
    return stats;
}

// Check if game should end (after max phases)
function checkGameEnd() {
    if (gameState.currentPhase >= gameState.maxPhases) {
        setTimeout(() => {
            showElectionResults();
        }, 1000);
        return true;
    }
    return false;
}

// Make functions available globally
window.assignPoliticianToPlayer = assignPoliticianToPlayer;
window.updatePlayerFunds = updatePlayerFunds;
window.showInsufficientFundsAnimation = showInsufficientFundsAnimation;
window.getPlayerData = getPlayerData;
window.getGameState = getGameState;
window.updatePlayerInfoDisplay = updatePlayerInfoDisplay;
window.initializePlayers = initializePlayers;
window.updateRallyTokenDisplay = updateRallyTokenDisplay;
window.resetRallyTokensForPhase = resetRallyTokensForPhase;
window.getInvestmentStats = getInvestmentStats;
window.checkGameEnd = checkGameEnd;
