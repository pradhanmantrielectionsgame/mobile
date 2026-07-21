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
        
        // Track rally for visual indicator (only for simple rallies)
        if (!playerData.ralliesHeld.includes(stateId)) {
            playerData.ralliesHeld.push(stateId);
            addPersistentRallyIndicatorToState(stateId, playerId);
        }
        
        // Play rally sound effect
        if (typeof window.playAudio === 'function') {
            window.playAudio('rally_sound');
        }
        
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
    
    // Play rally sound effect
    if (typeof window.playAudio === 'function') {
        window.playAudio('rally_sound');
    }
    
    return true;
}

// Reset rally tokens at the start of each phase
async function resetRallyTokensForPhase() {
    const rallyConfig = await getRallyConfig();
    const player1Data = getPlayerData('player1');
    const player2Data = getPlayerData('player2');
    
    // Determine special token allocation based on probability
    const specialTokenProbability = rallyConfig.specialTokenProbability || 0.05;
    const receiveSpecialToken = Math.random() < specialTokenProbability;
    
    if (player1Data) {
        player1Data.rallyTokens.simple = rallyConfig.simpleRallyTokens || 1;
        player1Data.rallyTokens.special = receiveSpecialToken ? 1 : 0;
    }
    
    if (player2Data) {
        player2Data.rallyTokens.simple = rallyConfig.simpleRallyTokens || 1;
        player2Data.rallyTokens.special = receiveSpecialToken ? 1 : 0;
    }
    
    const specialTokenMessage = receiveSpecialToken ? 
        'Lucky! You received a special rally token this phase!' : 
        'Regular rally tokens only this phase.';
    
    // Clear rally indicators from previous phase
    clearAllRallyIndicators();
    
    // Reset rally tracking
    if (player1Data) {
        player1Data.ralliesHeld = [];
    }
    if (player2Data) {
        player2Data.ralliesHeld = [];
    }
    
    console.log(`Rally tokens reset for new phase: ${rallyConfig.simpleRallyTokens || 1} simple, ${receiveSpecialToken ? 1 : 0} special. ${specialTokenMessage}`);
    updateRallyTokenDisplay();
}

// Update rally token display in UI
function updateRallyTokenDisplay() {
    const player1Data = getPlayerData('player1');
    
    if (!player1Data) return;
    
    // Update simple token count and state
    const simpleTokenSlot = document.getElementById('simple-token-slot');
    const simpleTokenCount = document.getElementById('simple-token-count');
    const specialTokenSlot = document.getElementById('special-token-slot');
    const specialTokenCount = document.getElementById('special-token-count');
    
    if (simpleTokenCount) {
        simpleTokenCount.textContent = player1Data.rallyTokens.simple;
        if (player1Data.rallyTokens.simple <= 0) {
            simpleTokenSlot?.classList.add('disabled');
            simpleTokenSlot?.classList.remove('can-pickup');
        } else {
            simpleTokenSlot?.classList.remove('disabled');
            simpleTokenSlot?.classList.add('can-pickup');
        }
    }
    
    if (specialTokenCount) {
        specialTokenSlot.innerHTML = `<div class="special-token-card" style="display:flex; align-items:center; justify-content:center; background:white; border:2px solid #FFD700; border-radius:6px; padding:4px;">
           <span class="golden-star" style="font-size:18px;">⭐</span>
           <div class="token-count" style="margin-left:4px; font-weight:bold;">${player1Data.rallyTokens.special}</div>
        </div>`;
        if (player1Data.rallyTokens.special <= 0) {
            specialTokenSlot.classList.add('disabled');
            specialTokenSlot.classList.remove('can-pickup');
        } else {
            specialTokenSlot.classList.remove('disabled');
            specialTokenSlot.classList.add('can-pickup');
        }
    }
    
    // Update tooltips based on selected state
    updateTokenTooltips();
}

// Update token tooltips with current state information
function updateTokenTooltips() {
    const selectedStateId = getCurrentSelectedState();
    const simpleTokenSlot = document.getElementById('simple-token-slot');
    const specialTokenSlot = document.getElementById('special-token-slot');
    
    if (selectedStateId && simpleTokenSlot) {
        const state = findStateById(selectedStateId);
        if (state) {
            simpleTokenSlot.title = `Simple Rally Token - Click to use in ${state.State}`;
        } else {
            simpleTokenSlot.title = 'Simple Rally Token - Click to use on selected state';
        }
    } else if (simpleTokenSlot) {
        simpleTokenSlot.title = 'Simple Rally Token - Select a state first';
    }
    
    if (specialTokenSlot) {
        specialTokenSlot.title = 'Special Rally Token - Click for nationwide boost';
    }
}

// Rally Token Click and Drop System
let pickedUpToken = null; // Tracks which token is currently picked up

// Initialize rally token tray interactions
function initializeRallyTokenTray() {
    const simpleTokenSlot = document.getElementById('simple-token-slot');
    const specialTokenSlot = document.getElementById('special-token-slot');
    
    // Simple token click handler - pickup
    if (simpleTokenSlot) {
        simpleTokenSlot.addEventListener('click', (e) => {
            e.stopPropagation();
            if (canUseRallyToken('player1', 'simple')) {
                pickupToken('simple');
            } else {
                showRallyMessage('No simple rally tokens available!', 'error');
            }
        });
    }
    
    // Special token click handler - pickup
    if (specialTokenSlot) {
        specialTokenSlot.addEventListener('click', (e) => {
            e.stopPropagation();
            if (canUseRallyToken('player1', 'special')) {
                pickupToken('special');
            } else {
                showRallyMessage('No special rally tokens available!', 'error');
            }
        });
    }
    
    // Global click handler to cancel pickup
    document.addEventListener('click', (e) => {
        // If we have a picked up token and click somewhere that's not a state
        if (pickedUpToken && !e.target.closest('path[id], g[id]') && !e.target.closest('.rally-token-slot')) {
            cancelTokenPickup();
        }
    });
    
    // Initial display update
    updateRallyTokenDisplay();
}

// Pick up a token
function pickupToken(tokenType) {
    // Clear any previously picked up token
    clearPickupState();
    
    pickedUpToken = tokenType;
    
    // Add visual feedback
    const tokenSlot = document.getElementById(`${tokenType}-token-slot`);
    if (tokenSlot) {
        tokenSlot.classList.add('picked-up');
    }
    
    // Enable drop zone highlighting
    enableDropZoneHighlighting();
    
    // Show instruction message
    if (tokenType === 'simple') {
        showRallyMessage('Token picked up! Click on a state to use the rally.', 'info');
    } else {
        showRallyMessage('Special token picked up! Click anywhere to use nationwide rally.', 'info');
    }
}

// Cancel token pickup
function cancelTokenPickup() {
    if (pickedUpToken) {
        clearPickupState();
        disableDropZoneHighlighting();
        showRallyMessage('Rally token pickup cancelled.', 'warning');
    }
}

// Clear pickup visual state
function clearPickupState() {
    if (pickedUpToken) {
        const tokenSlot = document.getElementById(`${pickedUpToken}-token-slot`);
        if (tokenSlot) {
            tokenSlot.classList.remove('picked-up');
        }
    }
    pickedUpToken = null;
}

// Handle token drop on state
function handleTokenDrop(stateId) {
    if (!pickedUpToken) return false;
    
    const tokenType = pickedUpToken;
    clearPickupState();
    disableDropZoneHighlighting();
    
    if (tokenType === 'simple') {
        if (stateId) {
            return useSimpleRallyToken(stateId, 'player1');
        } else {
            showRallyMessage('Please click on a state to use the simple rally token!', 'warning');
            return false;
        }
    } else if (tokenType === 'special') {
        // Special token can be used anywhere (nationwide effect)
        return useSpecialRallyToken('player1');
    }
    
    return false;
}

// Enable drop zone highlighting
function enableDropZoneHighlighting() {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        mapContainer.classList.add('drop-zone-active');
    }
    
    // Highlight all state paths
    const statePaths = document.querySelectorAll('path[id], g[id]');
    statePaths.forEach(path => {
        const svgId = path.id;
        if (findStateById(svgId)) {
            if (pickedUpToken === 'simple') {
                path.classList.add('drop-zone-valid');
            } else {
                // Special token works everywhere
                path.classList.add('drop-zone-valid');
            }
        }
    });
}

// Disable drop zone highlighting
function disableDropZoneHighlighting() {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        mapContainer.classList.remove('drop-zone-active');
    }
    
    // Remove highlighting from all paths
    const statePaths = document.querySelectorAll('path[id], g[id]');
    statePaths.forEach(path => {
        path.classList.remove('drop-zone-valid', 'drop-zone-invalid');
    });
}

// Check if we have a picked up token
function hasPickedUpToken() {
    return pickedUpToken !== null;
}

// Get currently picked up token type
function getPickedUpTokenType() {
    return pickedUpToken;
}

// Helper function to get currently selected state
function getCurrentSelectedState() {
    // Use the global state tracking from app.js
    if (typeof getCurrentlySelectedState === 'function') {
        return getCurrentlySelectedState();
    }
    
    // Fallback: check for any highlighted state on the map
    const highlightedState = document.querySelector('path.selected, path.highlighted');
    if (highlightedState) {
        return highlightedState.id;
    }
    
    return null;
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

// Rally State Indicator Functions
function addRallyIndicatorToState(stateId) {
    const stateElement = document.getElementById(stateId);
    if (!stateElement) return;
    
    // Check if indicator already exists
    const existingIndicator = stateElement.querySelector('.rally-indicator');
    if (existingIndicator) return;
    
    // Create rally indicator
    const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    indicator.setAttribute('class', 'rally-indicator');
    indicator.setAttribute('r', '8');
    indicator.setAttribute('fill', '#FFD700'); // Gold color
    indicator.setAttribute('stroke', '#FF6B00'); // Orange border
    indicator.setAttribute('stroke-width', '2');
    indicator.setAttribute('opacity', '0.9');
    
    // Get state bounding box to position the indicator
    const bbox = stateElement.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    
    indicator.setAttribute('cx', centerX);
    indicator.setAttribute('cy', centerY);
    
    // Add to the same parent as the state element
    const parent = stateElement.parentNode;
    parent.appendChild(indicator);
    
    // Add animation
    indicator.style.animation = 'rallyIndicatorAppear 0.5s ease-out';
}

function clearAllRallyIndicators() {
    const indicators = document.querySelectorAll('.rally-indicator');
    indicators.forEach(indicator => {
        indicator.remove();
    });
}

function hasRallyIndicator(stateId) {
    const stateElement = document.getElementById(stateId);
    if (!stateElement) return false;
    
    return stateElement.querySelector('.rally-indicator') !== null;
}

// Export functions for global access
window.useSimpleRallyToken = useSimpleRallyToken;
window.useSpecialRallyToken = useSpecialRallyToken;
window.resetRallyTokensForPhase = resetRallyTokensForPhase;
window.updateRallyTokenDisplay = updateRallyTokenDisplay;
window.updateTokenTooltips = updateTokenTooltips;
window.initializeRallyTokenTray = initializeRallyTokenTray;
window.showRallyMessage = showRallyMessage;
window.getRallyTokenStats = getRallyTokenStats;
window.canUseRallyToken = canUseRallyToken;
window.handleTokenDrop = handleTokenDrop;
window.hasPickedUpToken = hasPickedUpToken;
window.getPickedUpTokenType = getPickedUpTokenType;
window.cancelTokenPickup = cancelTokenPickup;
window.addRallyIndicatorToState = addRallyIndicatorToState;
window.clearAllRallyIndicators = clearAllRallyIndicators;
window.hasRallyIndicator = hasRallyIndicator;
