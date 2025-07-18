// Configuration Management System
// Handles loading and managing game configuration from JSON files

let gameConfig = null;

// Load game configuration from JSON
async function loadGameConfig() {
    try {
        const response = await fetch('data/game-config.json');
        gameConfig = await response.json();
        
        console.log('Game configuration loaded:', gameConfig);
        return gameConfig;
    } catch (error) {
        console.error('Failed to load game configuration:', error);
        // Return minimal fallback config
        gameConfig = {
            gameSettings: {
                totalPhases: 10,
                phaseDurationSeconds: 30,
                refreshFundsPerPhase: 1000
            },
            playerSettings: {
                startingFunds: 2000
            },
            rallySystem: {
                maxRalliesPerState: 2,
                popularityBoost: 8,
                tokensPerPhase: 2,
                simpleRallyTokens: 2,
                specialRallyTokens: 2
            },
            bonuses: {
                campaignCompletion: 300,
                regionalDominance: {
                    baseBonus: 200,
                    carryForwardBonus: 50
                }
            },
            gameBalance: {
                dominantTerritoryMinPopularity: 35,
                dominantTerritoryMaxPopularity: 60,
                competitiveMaxPopularity: 34
            },
            audio: {
                enableSounds: true,
                volume: 0.5
            },
            ui: {
                showCountdownWarning: true,
                countdownWarningSeconds: 10,
                autoAdvancePhases: true
            }
        };
        return gameConfig;
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
        funds: config.playerSettings?.startingFunds || 2000,
        simpleRallyTokens: config.rallySystem?.simpleRallyTokens || 2,
        specialRallyTokens: config.rallySystem?.specialRallyTokens || 2
    };
}

// Get investment configuration
async function getInvestmentConfig() {
    const config = await getGameConfig();
    return {
        baseCostPerSeat: config.investmentSystem?.baseCostPerSeat || 10, // 10 crores per seat
        basePopularityBoost: config.investmentSystem?.basePopularityBoost || 5, // Starting at 5%
        finalPopularityBoost: config.investmentSystem?.finalPopularityBoost || 2, // Ending at 2%
        glidePathInvestments: config.investmentSystem?.glidePathInvestments || 20, // 20 investments to reach final boost
        minimumBoost: config.investmentSystem?.minimumBoost || 2 // Minimum boost after glide path
    };
}

// Get rally configuration
async function getRallyConfig() {
    const config = await getGameConfig();
    return {
        simpleRallyBoost: config.rallySystem?.popularityBoost || 4,
        specialRallyBoost: 10, // Nationwide boost - could be configurable
        maxRalliesPerState: config.rallySystem?.maxRalliesPerState || 2,
        tokensPerPhase: config.rallySystem?.tokensPerPhase || 2
    };
}

// Get phase configuration
async function getPhaseConfig() {
    const config = await getGameConfig();
    return {
        totalPhases: config.gameSettings?.totalPhases || 10,
        phaseDurationSeconds: config.gameSettings?.phaseDurationSeconds || 30,
        refreshFundsPerPhase: config.gameSettings?.refreshFundsPerPhase || 1000
    };
}

// Get game balance configuration
async function getGameBalanceConfig() {
    const config = await getGameConfig();
    return config.gameBalance || {
        dominantTerritoryMinPopularity: 35,
        dominantTerritoryMaxPopularity: 60,
        competitiveMaxPopularity: 34
    };
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
