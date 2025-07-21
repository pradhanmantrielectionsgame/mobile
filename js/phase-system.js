// Phase Management System for Pradhan Mantri Elections Game
// Handles phase transitions, timers, and refresh funds

let phaseGameConfig = null;
let phaseTimer = null;
let currentPhaseTimeRemaining = 0;
let phaseTransitionInProgress = false;

// Phase management state
const phaseState = {
    isRunning: false,
    isPaused: false,
    currentPhase: 1,
    totalPhases: 10,
    timeRemaining: 30,
    intervalId: null
};

// Load game configuration from JSON
async function loadPhaseGameConfig() {
    try {
        const response = await fetch('data/game-config.json');
        phaseGameConfig = await response.json();
        
        // Update phase state with config values
        phaseState.totalPhases = phaseGameConfig.gameSettings.totalPhases;
        phaseState.timeRemaining = phaseGameConfig.gameSettings.phaseDurationSeconds;
        
        console.log('Phase game configuration loaded:', phaseGameConfig);
        return phaseGameConfig;
    } catch (error) {
        console.error('Failed to load phase game configuration:', error);
        // Fallback to default values
        phaseGameConfig = {
            gameSettings: {
                totalPhases: 10,
                phaseDurationSeconds: 30,
                refreshFundsPerPhase: 500
            }
        };
        return phaseGameConfig;
    }
}

// Initialize the phase management system
async function initializePhaseSystem() {
    console.log('Initializing phase system...');
    
    await loadPhaseGameConfig();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }
    
    // Set up the UI elements
    setupPhaseUI();
    
    // Initialize the first phase
    resetPhaseTimer();
    updatePhaseDisplay();
    
    console.log('Phase management system initialized, phaseState:', phaseState);
}

// Set up phase-related UI elements
function setupPhaseUI() {
    const timerDisplay = document.getElementById('timer-display');
    console.log('setupPhaseUI called, timerDisplay element:', timerDisplay);
    
    if (timerDisplay) {
        // Add click handler for manual phase controls (for testing)
        timerDisplay.addEventListener('click', (e) => {
            if (e.ctrlKey) {
                // Ctrl+Click to pause/resume
                togglePausePhase();
            } else if (e.shiftKey) {
                // Shift+Click to skip phase (for testing)
                advanceToNextPhase();
            }
        });
        
        // Update tooltip
        timerDisplay.title = 'Phase Timer\nCtrl+Click: Pause/Resume\nShift+Click: Skip Phase (Testing)';
        
        console.log('Phase UI setup complete');
    } else {
        console.error('Timer display element not found during setup!');
    }
}

// Start the phase system
function startPhaseSystem() {
    if (phaseState.isRunning) {
        console.log('Phase system already running');
        return;
    }
    
    phaseState.isRunning = true;
    phaseState.isPaused = false;
    phaseState.currentPhase = 1;
    
    // Add visual indicator that game is running
    document.body.classList.add('game-started');
    
    // Start the first phase
    startPhase(1);
    
    console.log('Phase system started');
}

// Start a specific phase
function startPhase(phaseNumber) {
    if (phaseTransitionInProgress) {
        console.log('Phase transition already in progress');
        return;
    }
    
    phaseState.currentPhase = phaseNumber;
    phaseState.timeRemaining = phaseGameConfig.gameSettings.phaseDurationSeconds;
    
    // Award refresh funds to both players
    awardRefreshFunds();
    
    // Reset rally tokens for the new phase
    if (typeof resetRallyTokensForPhase === 'function') {
        resetRallyTokensForPhase();
    }
    
    // Reset campaign phase contributions for the new phase
    if (typeof resetCampaignPhaseContributions === 'function') {
        resetCampaignPhaseContributions();
    }
    
    // Start countdown timer
    startCountdownTimer();
    
    // Update displays
    updatePhaseDisplay();
    
    // Play phase start sound
    playSound('phase_reset');
    
    // Show phase start message
    showPhaseMessage(`🎮 Game Started! Phase ${phaseNumber} begins now. You received ₹${phaseGameConfig.gameSettings.refreshFundsPerPhase}Cr refresh funds.`);
    
    console.log(`Phase ${phaseNumber} started - ${phaseGameConfig.gameSettings.phaseDurationSeconds} seconds`);
}

// Start the countdown timer
function startCountdownTimer() {
    // Clear any existing timer
    if (phaseState.intervalId) {
        clearInterval(phaseState.intervalId);
    }
    
    phaseState.intervalId = setInterval(() => {
        if (!phaseState.isPaused && phaseState.isRunning) {
            phaseState.timeRemaining--;
            updatePhaseDisplay();
            
            // Warning when 10 seconds remain
            if (phaseGameConfig?.ui?.showCountdownWarning && 
                phaseState.timeRemaining === (phaseGameConfig?.ui?.countdownWarningSeconds || 10)) {
                showPhaseWarning();
            }
            
            // End phase when time runs out
            if (phaseState.timeRemaining <= 0) {
                endCurrentPhase();
            }
        }
    }, 1000);
}

// End the current phase
function endCurrentPhase() {
    if (phaseTransitionInProgress) return;
    
    phaseTransitionInProgress = true;
    
    // Clear the timer
    if (phaseState.intervalId) {
        clearInterval(phaseState.intervalId);
        phaseState.intervalId = null;
    }
    
    // Play phase end sound
    playSound('cash_added');
    
    // Check if game should end
    if (phaseState.currentPhase >= phaseState.totalPhases) {
        endGame();
    } else {
        // Advance to next phase
        setTimeout(() => {
            advanceToNextPhase();
        }, 1000);
    }
}

// Advance to the next phase
function advanceToNextPhase() {
    if (!phaseTransitionInProgress) {
        phaseTransitionInProgress = true;
    }
    
    const nextPhase = phaseState.currentPhase + 1;
    
    if (nextPhase <= phaseState.totalPhases) {
        // Update game state for next phase
        if (typeof gameState !== 'undefined') {
            gameState.currentPhase = nextPhase;
        }
        
        setTimeout(() => {
            phaseTransitionInProgress = false;
            startPhase(nextPhase);
        }, 500);
    } else {
        endGame();
    }
}

// Award refresh funds to both players
function awardRefreshFunds() {
    const refreshAmount = phaseGameConfig.gameSettings.refreshFundsPerPhase;
    
    // Award to both players using the existing fund system
    if (typeof updatePlayerFunds === 'function') {
        updatePlayerFunds('player1', refreshAmount);
        updatePlayerFunds('player2', refreshAmount);
    } else {
        console.warn('updatePlayerFunds function not available');
    }
}

// Update phase display in the UI
function updatePhaseDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    console.log('updatePhaseDisplay called, timerDisplay element:', timerDisplay);
    
    if (timerDisplay) {
        const minutes = Math.floor(phaseState.timeRemaining / 60);
        const seconds = phaseState.timeRemaining % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        let displayText = `Phase ${phaseState.currentPhase}/${phaseState.totalPhases} | ${timeString}`;
        
        if (phaseState.isPaused) {
            displayText += ' (PAUSED)';
        }
        
        console.log('Setting timer display to:', displayText);
        timerDisplay.textContent = displayText;
        
        // Add visual warning when time is low
        if (phaseState.timeRemaining <= 10 && phaseState.timeRemaining > 0) {
            timerDisplay.classList.add('timer-warning');
        } else {
            timerDisplay.classList.remove('timer-warning');
        }
    } else {
        console.error('Timer display element not found!');
    }
}

// Show phase start message
function showPhaseMessage(message) {
    // Try to use existing campaign message system
    if (typeof showCampaignMessage === 'function') {
        showCampaignMessage(message, 'info');
    } else {
        // Fallback: create a temporary message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'phase-message';
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #2196F3;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-weight: bold;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
}

// Show warning when phase is about to end
function showPhaseWarning() {
    playSound('invalid_action'); // Use warning sound
    const warningSeconds = phaseGameConfig?.ui?.countdownWarningSeconds || 10;
    showPhaseMessage(`⚠️ ${warningSeconds} seconds remaining in Phase ${phaseState.currentPhase}!`);
}

// Pause/Resume phase timer
function togglePausePhase() {
    if (!phaseState.isRunning) return;
    
    phaseState.isPaused = !phaseState.isPaused;
    updatePhaseDisplay();
    
    // Update body class for visual feedback
    if (phaseState.isPaused) {
        document.body.classList.add('game-paused');
        document.body.classList.remove('game-started');
    } else {
        document.body.classList.remove('game-paused');
        document.body.classList.add('game-started');
    }
    
    if (phaseState.isPaused) {
        console.log('Phase timer paused');
        showPhaseMessage('Phase timer paused');
    } else {
        console.log('Phase timer resumed');
        showPhaseMessage('Phase timer resumed');
    }
}

// Reset phase timer to full duration
function resetPhaseTimer() {
    phaseState.timeRemaining = phaseGameConfig?.gameSettings?.phaseDurationSeconds || 30;
    updatePhaseDisplay();
}

// End the entire game
function endGame() {
    phaseTransitionInProgress = true;
    phaseState.isRunning = false;
    
    // Remove visual indicators
    document.body.classList.remove('game-started', 'game-paused');
    
    // Clear any running timer
    if (phaseState.intervalId) {
        clearInterval(phaseState.intervalId);
        phaseState.intervalId = null;
    }
    
    // Play game end sound
    playSound('game_over');
    
    // Show game end message
    showPhaseMessage('🎉 Game Over! Final results will be displayed.');
    
    // Trigger final results display
    setTimeout(() => {
        if (typeof showElectionResults === 'function') {
            showElectionResults();
        } else {
            console.log('Game ended - showing final results');
        }
    }, 2000);
}

// Play sound helper function
function playSound(soundName) {
    if (phaseGameConfig?.audio?.enableSounds && typeof playAudio === 'function') {
        playAudio(soundName);
    }
}

// Get current phase information
function getCurrentPhaseInfo() {
    return {
        currentPhase: phaseState.currentPhase,
        totalPhases: phaseState.totalPhases,
        timeRemaining: phaseState.timeRemaining,
        isRunning: phaseState.isRunning,
        isPaused: phaseState.isPaused
    };
}

// Get game configuration
function getPhaseGameConfig() {
    return phaseGameConfig;
}

// Manual phase controls (for testing/debugging)
function skipToPhase(phaseNumber) {
    if (phaseNumber >= 1 && phaseNumber <= phaseState.totalPhases) {
        phaseState.currentPhase = phaseNumber - 1; // Will be incremented in advanceToNextPhase
        endCurrentPhase();
    }
}

// Stop the phase system
function stopPhaseSystem() {
    phaseState.isRunning = false;
    phaseState.isPaused = false;
    
    // Remove visual indicators
    document.body.classList.remove('game-started', 'game-paused');
    
    if (phaseState.intervalId) {
        clearInterval(phaseState.intervalId);
        phaseState.intervalId = null;
    }
    
    console.log('Phase system stopped');
}

// Testing and Debug Functions for Phase Management
// These functions are available in the browser console for testing

// Quick start game for testing
function quickStartGame() {
    startPhaseSystem();
    console.log('Game started via console command');
}

// Skip to specific phase for testing
function testSkipPhase(phaseNumber) {
    skipToPhase(phaseNumber);
    console.log(`Skipped to phase ${phaseNumber} via console command`);
}

// Get current game status
function getGameStatus() {
    const phaseInfo = getCurrentPhaseInfo();
    const config = getPhaseGameConfig();
    
    console.log('=== GAME STATUS ===');
    console.log(`Current Phase: ${phaseInfo.currentPhase}/${phaseInfo.totalPhases}`);
    console.log(`Time Remaining: ${phaseInfo.timeRemaining} seconds`);
    console.log(`Game Running: ${phaseInfo.isRunning}`);
    console.log(`Game Paused: ${phaseInfo.isPaused}`);
    console.log(`Refresh Funds: ₹${config?.gameSettings?.refreshFundsPerPhase || 'N/A'}Cr per phase`);
    console.log('==================');
    
    return phaseInfo;
}

// Test refresh funds manually
function testRefreshFunds() {
    if (typeof updatePlayerFunds === 'function') {
        const config = getPhaseGameConfig();
        const amount = config?.gameSettings?.refreshFundsPerPhase || 500;
        updatePlayerFunds('player1', amount);
        updatePlayerFunds('player2', amount);
        console.log(`Manually awarded ₹${amount}Cr to both players`);
    } else {
        console.error('updatePlayerFunds function not available');
    }
}

// Quick debug test - call this from browser console
window.debugPhaseSystem = function() {
    console.log('=== PHASE SYSTEM DEBUG ===');
    console.log('Phase state:', phaseState);
    console.log('Phase config:', phaseGameConfig);
    
    const timerElement = document.getElementById('timer-display');
    console.log('Timer element:', timerElement);
    console.log('Timer element content:', timerElement?.textContent);
    
    // Test update display
    console.log('Testing updatePhaseDisplay...');
    updatePhaseDisplay();
    
    console.log('Testing complete');
    return {
        phaseState,
        phaseGameConfig,
        timerElement
    };
};

console.log('Phase system debug function added: window.debugPhaseSystem()');

// Make testing functions available globally
window.quickStartGame = quickStartGame;
window.testSkipPhase = testSkipPhase;
window.getGameStatus = getGameStatus;
window.testRefreshFunds = testRefreshFunds;

// Export functions to global scope
window.initializePhaseSystem = initializePhaseSystem;
window.startPhaseSystem = startPhaseSystem;
window.togglePausePhase = togglePausePhase;
window.getCurrentPhaseInfo = getCurrentPhaseInfo;
window.getPhaseGameConfig = getPhaseGameConfig;
window.skipToPhase = skipToPhase;
window.stopPhaseSystem = stopPhaseSystem;

console.log('Phase management system loaded');
console.log('Phase system debugging commands loaded:');
console.log('- quickStartGame() - Restart the game if needed');
console.log('- testSkipPhase(n) - Skip to phase n');
console.log('- getGameStatus() - Show current game status'); 
console.log('- testRefreshFunds() - Manually award refresh funds');
console.log('- togglePausePhase() - Pause/resume the current phase');
