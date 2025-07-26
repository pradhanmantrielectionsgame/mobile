// Configuration Management System
// Handles loading and managing game configuration from JSON files

let gameConfig = null;

// Load game configuration from JSON
async function loadGameConfig() {
    try {
        const response = await fetch('data/game-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        gameConfig = await response.json();
        
        console.log('Game configuration loaded:', gameConfig);
        return gameConfig;
    } catch (error) {
        console.error('Failed to load game configuration:', error);
        throw new Error('Game configuration is required to run the game. Please ensure data/game-config.json exists and is valid.');
    }
}

// Get game configuration (ensures it's loaded)
async function getGameConfig() {
    if (!gameConfig) {
        await loadGameConfig();
    }
    return gameConfig;
}

// Get specific configuration section
async function getConfig(section) {
    const config = await getGameConfig();
    return config[section] || {};
}

// Get player starting configuration
async function getPlayerStartingConfig() {
    const config = await getGameConfig();
    return {
        funds: config.playerSettings.startingFunds,
        simpleRallyTokens: config.rallySystem.simpleRallyTokens,
        specialRallyTokens: config.rallySystem.specialRallyTokens
    };
}

// Get investment configuration
async function getInvestmentConfig() {
    const config = await getGameConfig();
    return {
        baseCostPerSeat: config.investmentSystem.baseCostPerSeat,
        basePopularityBoost: config.investmentSystem.basePopularityBoost,
        finalPopularityBoost: config.investmentSystem.finalPopularityBoost,
        glidePathInvestments: config.investmentSystem.glidePathInvestments,
        minimumBoost: config.investmentSystem.minimumBoost
    };
}

// Get rally configuration
async function getRallyConfig() {
    const config = await getGameConfig();
    return {
        simpleRallyBoost: config.rallySystem.regularTokenBoost,
        specialRallyBoost: config.rallySystem.specialTokenBoost,
        maxRalliesPerState: config.rallySystem.maxRalliesPerState,
        tokensPerPhase: config.rallySystem.tokensPerPhase
    };
}

// Get phase configuration
async function getPhaseConfig() {
    const config = await getGameConfig();
    return {
        totalPhases: config.gameSettings.totalPhases,
        phaseDurationSeconds: config.gameSettings.phaseDurationSeconds,
        refreshFundsPerPhase: config.gameSettings.refreshFundsPerPhase
    };
}

// Get game balance configuration
async function getGameBalanceConfig() {
    const config = await getGameConfig();
    return config.gameBalance;
}

// Export functions for global access
window.loadGameConfig = loadGameConfig;
window.getGameConfig = getGameConfig;
window.getConfig = getConfig;
window.getPlayerStartingConfig = getPlayerStartingConfig;
window.getInvestmentConfig = getInvestmentConfig;
window.getRallyConfig = getRallyConfig;
window.getPhaseConfig = getPhaseConfig;
window.getGameBalanceConfig = getGameBalanceConfig;
