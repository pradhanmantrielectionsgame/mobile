// Game Data Coordinator
// Main entry point that coordinates all game data systems

// Initialize the entire game data system
async function initializeGame() {
    try {
        console.log('Initializing Pradhan Mantri Elections Game...');
        
        // Initialize all data systems
        const success = await initializeGameData();
        
        if (success) {
            console.log('Game initialization complete!');
            
            // Start natural popularity fluctuations
            setTimeout(() => {
                simulatePopularityChanges();
            }, 5000);
            
            return true;
        } else {
            console.error('Game initialization failed');
            return false;
        }
    } catch (error) {
        console.error('Error during game initialization:', error);
        return false;
    }
}

// Export main initialization function
window.initializeGame = initializeGame;

// Re-export commonly used functions for backwards compatibility
window.getStatesData = getStatesData;
window.findStateById = findStateById;
window.getPlayerData = getPlayerData;
window.updatePlayerFunds = updatePlayerFunds;
window.updateStatePopularity = updateStatePopularity;
window.calculateProjectedSeats = calculateProjectedSeats;
window.updateProjectedSeatsBar = updateProjectedSeatsBar;
window.updateMapColors = updateMapColors;
window.updateStateInfo = updateStateInfo;
window.showElectionResults = showElectionResults;
window.checkGameEnd = checkGameEnd;
window.handleDirectInvestment = handleDirectInvestment;
window.useSimpleRallyToken = useSimpleRallyToken;
window.useSpecialRallyToken = useSpecialRallyToken;
window.resetRallyTokensForPhase = resetRallyTokensForPhase;
