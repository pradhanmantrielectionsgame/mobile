// Game Data Management
// This file handles loading and managing states data, popularity, and seats calculation

let statesData = [];
let statePopularity = {};
let politiciansData = [];

// Player management system
let gameState = {
    player1: {
        id: 'player1',
        name: 'Player 1',
        politician: null, // Will store selected politician data
        funds: 1600, // In millions
        totalSpent: 0,
        // Investment tracking for diminishing returns
        investments: {}, // stateId: number of investments
        // Rally tokens
        rallyTokens: {
            simple: 2, // Simple rally tokens (per phase)
            special: 2  // Special rally tokens (per phase)
        }
    },
    player2: {
        id: 'player2', 
        name: 'Player 2',
        politician: null, // Will store selected politician data
        funds: 850, // In millions
        totalSpent: 0,
        // Investment tracking for diminishing returns
        investments: {}, // stateId: number of investments
        // Rally tokens
        rallyTokens: {
            simple: 2, // Simple rally tokens (per phase)
            special: 2  // Special rally tokens (per phase)
        }
    },
    currentPhase: 1,
    maxPhases: 10,
    gameStarted: false
};

// Game configuration - will be loaded from JSON file
let gameConfig = {
    // Default fallback values
    gameSettings: {
        totalPhases: 10,
        phaseDurationSeconds: 30,
        refreshFundsPerPhase: 500
    },
    rallySystem: {
        maxRalliesPerState: 2,
        popularityBoost: 8,
        tokensPerPhase: 2
    },
    campaign: {
        maxCampaignsPerState: 3,
        basePopularityGain: 5,
        costMultiplier: 1.5
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
    }
};

// Load game configuration from JSON
async function loadGameConfig() {
    try {
        const response = await fetch('data/game-config.json');
        const config = await response.json();
        
        // Merge with existing config to preserve any runtime modifications
        gameConfig = { ...gameConfig, ...config };
        
        // Update game state with new values
        gameState.maxPhases = gameConfig.gameSettings.totalPhases;
        
        console.log('Game configuration loaded from file:', gameConfig);
        return gameConfig;
    } catch (error) {
        console.error('Failed to load game configuration, using defaults:', error);
        return gameConfig;
    }
}

// Get game configuration
async function getGameConfig() {
    // Ensure config is loaded
    if (!gameConfig.gameSettings) {
        await loadGameConfig();
    }
    return gameConfig;
}

// Get states data (for compatibility)
function getStatesData() {
    return statesData;
}

// Load states data from JSON file
async function loadStatesData() {
    try {
        const response = await fetch('data/states_data.json');
        statesData = await response.json();
        
        // Initialize balanced popularity system
        initializeStatePopularity();
        
        console.log('States data loaded:', statesData.length, 'states');
        
        // Update projected seats after data is loaded
        setTimeout(() => {
            updateProjectedSeatsBar();
            updateMapColors();
        }, 100);
        
    } catch (error) {
        console.error('Error loading states data:', error);
        // Fallback data
        statesData = [
            { State: "Uttar Pradesh", LokSabhaSeats: "80", SvgId: "INUP" },
            { State: "Maharashtra", LokSabhaSeats: "48", SvgId: "INMH" },
            { State: "Tamil Nadu", LokSabhaSeats: "39", SvgId: "INTN" }
        ];
    }
}

// Load politicians data from JSON file
async function loadPoliticiansData() {
    try {
        const response = await fetch('data/politicians-data.json');
        const data = await response.json();
        politiciansData = data.politicians;
        
        console.log('Politicians data loaded:', politiciansData.length, 'politicians');
        
        // Auto-assign default politicians for demo (can be removed later)
        if (politiciansData.length >= 2) {
            assignPoliticianToPlayer('player1', politiciansData[0].id); // Narendra Modi
            assignPoliticianToPlayer('player2', politiciansData[2].id); // Rahul Gandhi
        }
        
        // Update player info display after politicians are assigned
        updatePlayerInfoDisplay();
        
    } catch (error) {
        console.error('Error loading politicians data:', error);
        // Fallback - create basic politician data
        politiciansData = [
            {
                id: "default-p1",
                name: "Player 1 Leader",
                party: "Party 1",
                image: "assets/images/default.png",
                partyLogo: "assets/icons/default.svg",
                primaryColor: "#5ac461"
            },
            {
                id: "default-p2", 
                name: "Player 2 Leader",
                party: "Party 2",
                image: "assets/images/default.png",
                partyLogo: "assets/icons/default.svg",
                primaryColor: "#e65c5c"
            }
        ];
    }
}

// Assign a politician to a player
function assignPoliticianToPlayer(playerId, politicianId) {
    const politician = politiciansData.find(p => p.id === politicianId);
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

// Calculate and update projected seats using proportional allocation
function calculateProjectedSeats() {
    let p1Seats = 0;
    let p2Seats = 0;
    let otherSeats = 0;
    let totalSeats = 0;
    
    statesData.forEach(state => {
        const popularity = statePopularity[state.SvgId];
        const seats = parseInt(state.LokSabhaSeats) || 0;
        totalSeats += seats;
        
        if (popularity) {
            // Proportional allocation of seats based on popularity percentage
            const p1StateSeats = Math.round((popularity.player1 / 100) * seats);
            const p2StateSeats = Math.round((popularity.player2 / 100) * seats);
            const otherStateSeats = seats - p1StateSeats - p2StateSeats;
            
            p1Seats += p1StateSeats;
            p2Seats += p2StateSeats;
            otherSeats += otherStateSeats;
        }
    });
    
    return { p1Seats, p2Seats, otherSeats, totalSeats };
}

// Update the projected seats progress bar
function updateProjectedSeatsBar() {
    const { p1Seats, p2Seats, otherSeats, totalSeats } = calculateProjectedSeats();
    
    if (totalSeats === 0) return; // Prevent division by zero
    
    // Calculate percentages
    const p1Percentage = (p1Seats / totalSeats) * 100;
    const p2Percentage = (p2Seats / totalSeats) * 100;
    const othersPercentage = (otherSeats / totalSeats) * 100;
    
    // Update segment widths
    const p1Segment = document.getElementById('p1-segment');
    const othersSegment = document.getElementById('others-segment');
    const p2Segment = document.getElementById('p2-segment');
    
    if (p1Segment && othersSegment && p2Segment) {
        p1Segment.style.width = `${p1Percentage}%`;
        othersSegment.style.width = `${othersPercentage}%`;
        p2Segment.style.width = `${p2Percentage}%`;
        
        // Add seat counts to segments with better formatting
        if (p1Percentage > 20) {
            p1Segment.textContent = `P1: ${p1Seats}`;
        } else if (p1Percentage > 8) {
            p1Segment.textContent = p1Seats;
        } else {
            p1Segment.textContent = '';
        }
        
        if (othersPercentage > 20) {
            othersSegment.textContent = `Others: ${otherSeats}`;
        } else if (othersPercentage > 8) {
            othersSegment.textContent = otherSeats;
        } else {
            othersSegment.textContent = '';
        }
        
        if (p2Percentage > 20) {
            p2Segment.textContent = `P2: ${p2Seats}`;
        } else if (p2Percentage > 8) {
            p2Segment.textContent = p2Seats;
        } else {
            p2Segment.textContent = '';
        }
        
        // Add winner indication if majority reached
        if (p1Seats >= 272) {
            p1Segment.style.border = '2px solid gold';
            p1Segment.title = 'Majority Winner!';
        } else if (p2Seats >= 272) {
            p2Segment.style.border = '2px solid gold';
            p2Segment.title = 'Majority Winner!';
        }
    }
    
    console.log(`Projected Seats - P1: ${p1Seats}, Others: ${otherSeats}, P2: ${p2Seats}, Total: ${totalSeats}`);
}

// Find state by SVG ID
function findStateById(svgId) {
    return statesData.find(state => state.SvgId === svgId);
}

// Update state info banner with popularity and leader information
function updateStateInfo(svgId) {
    const state = findStateById(svgId);
    const popularity = statePopularity[svgId];
    const banner = document.getElementById('states-banner');
    
    if (state && popularity) {
        const stateInfoSection = banner.querySelector('.state-info-section');
        stateInfoSection.innerHTML = `
            <div class="state-name">${state.State}</div>
            <div class="state-stats">
                <span>Seats: ${state.LokSabhaSeats}</span>
                <span>P1: ${Math.round(popularity.player1)}%</span>
                <span>P2: ${Math.round(popularity.player2)}%</span>
                <span>Others: ${Math.round(popularity.others)}%</span>
            </div>
        `;
        console.log(`Updated info for ${state.State} (${svgId})`);
    } else {
        console.log(`No data found for SVG ID: ${svgId}`);
    }
}

// Simulate dynamic popularity changes during gameplay
function simulatePopularityChanges() {
    setInterval(() => {
        // Randomly select 2-3 states for small popularity shifts
        const stateIds = Object.keys(statePopularity);
        const randomStates = [];
        
        // Select random states, avoiding too frequent changes
        while (randomStates.length < 3 && randomStates.length < stateIds.length) {
            const randomId = stateIds[Math.floor(Math.random() * stateIds.length)];
            if (!randomStates.includes(randomId)) {
                randomStates.push(randomId);
            }
        }
        
        randomStates.forEach(svgId => {
            // Randomly choose which player gets the change
            const player = Math.random() < 0.5 ? 'player1' : 'player2';
            
            // Small random changes (±2 to ±5 points)
            const change = Math.round((Math.random() - 0.5) * 8); // -4 to +4, rounded to whole numbers
            
            // Apply the change using the new system
            updateStatePopularity(svgId, player, change, 'natural fluctuation');
        });
        
        console.log('Natural popularity fluctuations applied to', randomStates.length, 'states');
        
    }, 20000); // Update every 20 seconds for less frequent changes
}

// Determine if a state should be highlighted for a group based on states_data.json flags
function shouldHighlightState(state, groupName) {
    switch(groupName.toLowerCase()) {
        case 'all':
            return true;
        case 'union territory':
            return state.UnionTerritory === 'TRUE';
        case 'coastal india':
            return state.CoastalIndia === 'TRUE';
        case 'northeast india':
            return state.NortheastIndia === 'TRUE';
        case 'south india':
            return state.SouthIndia === 'TRUE';
        case 'hindi heartland':
            return state.HindiHeartland === 'TRUE';
        case 'agricultural region':
            return state.AgriculturalRegion === 'TRUE';
        case 'border lands':
            return state.BorderLands === 'TRUE';
        case 'pilgrimage':
            return state.Pilgrimage === 'TRUE';
        case 'industrial corridor':
            return state.IndustrialCorridor === 'TRUE';
        case 'manufacturing':
            return state.Manufacturing === 'TRUE';
        case 'education':
            return state.Education === 'TRUE';
        case 'tribal lands':
            return state.TribalLands === 'TRUE';
        case 'travel and tourism':
            return state.TravelAndTourism === 'TRUE';
        case 'natural resources':
            return state.NaturalResources === 'TRUE';
        case 'minority areas':
            return state.MinorityAreas === 'TRUE';
        default:
            return false;
    }
}

// Update state info banner with group statistics
function updateGroupStatistics(groupName, matchingStates) {
    const banner = document.getElementById('states-banner');
    const stateInfoSection = banner.querySelector('.state-info-section');
    
    if (groupName.toLowerCase() === 'all') {
        // Show default message when "All" is selected
        stateInfoSection.innerHTML = `
            <div class="state-name">Select a state to view details...</div>
            <div class="state-stats">
                <span>Total: ${statesData.length} states/UTs</span>
                <span>Seats: ${statesData.reduce((sum, state) => sum + parseInt(state.LokSabhaSeats), 0)}</span>
                <span>States: ${statesData.filter(s => s.UnionTerritory === 'FALSE').length}</span>
                <span>UTs: ${statesData.filter(s => s.UnionTerritory === 'TRUE').length}</span>
            </div>
        `;
    } else {
        const totalSeats = matchingStates.reduce((sum, state) => sum + parseInt(state.LokSabhaSeats), 0);
        const stateCount = matchingStates.filter(s => s.UnionTerritory === 'FALSE').length;
        const utCount = matchingStates.filter(s => s.UnionTerritory === 'TRUE').length;
        
        stateInfoSection.innerHTML = `
            <div class="state-name">${groupName} Category</div>
            <div class="state-stats">
                <span>Total: ${matchingStates.length}</span>
                <span>Seats: ${totalSeats}</span>
                <span>States: ${stateCount}</span>
                <span>UTs: ${utCount}</span>
            </div>
        `;
    }
}

// Initialize state popularity system with balanced game design
function initializeStatePopularity() {
    console.log('Initializing balanced state popularity system...');
    
    // Calculate total seats to determine targets
    const totalSeats = statesData.reduce((sum, state) => sum + parseInt(state.LokSabhaSeats), 0);
    console.log(`Total Lok Sabha seats: ${totalSeats}`);
    
    // Sort states by seat count for strategic assignment
    const sortedStates = [...statesData].sort((a, b) => 
        parseInt(b.LokSabhaSeats) - parseInt(a.LokSabhaSeats)
    );
    
    // Target: ~100 seats each for P1 and P2 dominance
    const targetSeatsPerPlayer = 100;
    let p1DominantSeats = 0;
    let p2DominantSeats = 0;
    const p1DominantStates = [];
    const p2DominantStates = [];
    
    // Assign Player 1 dominant territories (3-5 territories with ~100 seats total)
    for (const state of sortedStates) {
        const seats = parseInt(state.LokSabhaSeats);
        if (p1DominantSeats < targetSeatsPerPlayer && p1DominantStates.length < 5) {
            p1DominantStates.push(state.SvgId);
            p1DominantSeats += seats;
            if (p1DominantSeats >= targetSeatsPerPlayer) break;
        }
    }
    
    // Assign Player 2 dominant territories (3-5 territories with ~100 seats total) 
    for (const state of sortedStates) {
        const seats = parseInt(state.LokSabhaSeats);
        if (p2DominantSeats < targetSeatsPerPlayer && 
            p2DominantStates.length < 5 && 
            !p1DominantStates.includes(state.SvgId)) {
            p2DominantStates.push(state.SvgId);
            p2DominantSeats += seats;
            if (p2DominantSeats >= targetSeatsPerPlayer) break;
        }
    }
    
    console.log(`P1 dominant territories: ${p1DominantStates.length} (${p1DominantSeats} seats)`);
    console.log(`P2 dominant territories: ${p2DominantStates.length} (${p2DominantSeats} seats)`);
    
    // Initialize popularity for all states
    statesData.forEach(state => {
        const svgId = state.SvgId;
        let player1, player2, others;
        
        if (p1DominantStates.includes(svgId)) {
            // Player 1 dominant: 35-60% for P1
            player1 = Math.floor(Math.random() * 26) + 35; // 35-60%
            player2 = Math.floor(Math.random() * (35 - 5)) + 5; // 5-34%
            others = 100 - player1 - player2;
        } else if (p2DominantStates.includes(svgId)) {
            // Player 2 dominant: 35-60% for P2
            player2 = Math.floor(Math.random() * 26) + 35; // 35-60%
            player1 = Math.floor(Math.random() * (35 - 5)) + 5; // 5-34%
            others = 100 - player1 - player2;
        } else {
            // Competitive territory: both players < 35%, Others get residual
            player1 = Math.floor(Math.random() * 25) + 5; // 5-29%
            player2 = Math.floor(Math.random() * 25) + 5; // 5-29%
            others = 100 - player1 - player2;
        }
        
        // Ensure values are within bounds and sum to 100
        player1 = Math.max(0, Math.min(100, Math.round(player1)));
        player2 = Math.max(0, Math.min(100, Math.round(player2)));
        others = Math.max(0, 100 - player1 - player2);
        
        statePopularity[svgId] = {
            player1: player1,
            player2: player2,
            others: others,
            isDominantP1: p1DominantStates.includes(svgId),
            isDominantP2: p2DominantStates.includes(svgId)
        };
    });
    
    console.log('State popularity initialization complete');
    
    // Log summary statistics
    const finalStats = calculateInitializationStats();
    console.log('Initialization Stats:', finalStats);
}

// Calculate initialization statistics for validation
function calculateInitializationStats() {
    let p1DominantSeats = 0;
    let p2DominantSeats = 0;
    let competitiveSeats = 0;
    let p1DominantCount = 0;
    let p2DominantCount = 0;
    
    statesData.forEach(state => {
        const popularity = statePopularity[state.SvgId];
        const seats = parseInt(state.LokSabhaSeats);
        
        if (popularity.isDominantP1) {
            p1DominantSeats += seats;
            p1DominantCount++;
        } else if (popularity.isDominantP2) {
            p2DominantSeats += seats;
            p2DominantCount++;
        } else {
            competitiveSeats += seats;
        }
    });
    
    return {
        p1DominantTerritories: p1DominantCount,
        p1DominantSeats: p1DominantSeats,
        p2DominantTerritories: p2DominantCount,
        p2DominantSeats: p2DominantSeats,
        competitiveSeats: competitiveSeats,
        totalSeats: p1DominantSeats + p2DominantSeats + competitiveSeats
    };
}

// Update state popularity based on in-game actions
function updateStatePopularity(svgId, player, popularityChange, reason = '') {
    if (!statePopularity[svgId]) {
        console.error(`State ${svgId} not found in popularity data`);
        return false;
    }
    
    const state = statePopularity[svgId];
    const oldValues = { ...state };
    
    // Apply the change to the specified player
    if (player === 'player1') {
        state.player1 = Math.max(0, Math.min(100, state.player1 + popularityChange));
    } else if (player === 'player2') {
        state.player2 = Math.max(0, Math.min(100, state.player2 + popularityChange));
    } else {
        console.error(`Invalid player: ${player}`);
        return false;
    }
    
    // Redistribute the difference proportionally among others
    const totalOtherPlayers = (player === 'player1') ? 
        (oldValues.player2 + oldValues.others) : 
        (oldValues.player1 + oldValues.others);
    
    if (totalOtherPlayers > 0) {
        const remainingPercentage = 100 - ((player === 'player1') ? state.player1 : state.player2);
        
        if (player === 'player1') {
            const p2Ratio = oldValues.player2 / totalOtherPlayers;
            const othersRatio = oldValues.others / totalOtherPlayers;
            state.player2 = Math.round(remainingPercentage * p2Ratio);
            state.others = Math.round(remainingPercentage - state.player2);
        } else {
            const p1Ratio = oldValues.player1 / totalOtherPlayers;
            const othersRatio = oldValues.others / totalOtherPlayers;
            state.player1 = Math.round(remainingPercentage * p1Ratio);
            state.others = Math.round(remainingPercentage - state.player1);
        }
    }
    
    // Ensure values sum to 100 and are all whole numbers
    const total = state.player1 + state.player2 + state.others;
    if (total !== 100) {
        const adjustment = 100 - total;
        state.others = Math.round(state.others + adjustment);
    }
    
    // Final check to ensure all values are whole numbers
    state.player1 = Math.round(state.player1);
    state.player2 = Math.round(state.player2);
    state.others = Math.round(state.others);
    
    console.log(`Updated ${svgId} ${player} popularity: ${oldValues[player.replace('player', 'player')]} → ${state[player.replace('player', 'player')]} ${reason ? `(${reason})` : ''}`);
    
    // Update visual representation
    updateMapColors();
    updateProjectedSeatsBar();
    
    // Update state info if currently displayed
    const currentStateName = document.querySelector('.state-name');
    if (currentStateName) {
        const stateName = findStateById(svgId)?.State;
        if (stateName && currentStateName.textContent === stateName) {
            updateStateInfo(svgId);
        }
    }
    
    return true;
}

// Calculate seat distribution using proportional allocation
function calculateSeatDistribution() {
    const results = {
        player1: 0,
        player2: 0,
        others: 0,
        stateBreakdown: []
    };
    
    statesData.forEach(state => {
        const popularity = statePopularity[state.SvgId];
        const totalSeats = parseInt(state.LokSabhaSeats);
        
        // Calculate proportional seats (rounded)
        const p1Seats = Math.round((popularity.player1 / 100) * totalSeats);
        const p2Seats = Math.round((popularity.player2 / 100) * totalSeats);
        const otherSeats = totalSeats - p1Seats - p2Seats;
        
        results.player1 += p1Seats;
        results.player2 += p2Seats;
        results.others += otherSeats;
        
        results.stateBreakdown.push({
            state: state.State,
            svgId: state.SvgId,
            totalSeats: totalSeats,
            player1Seats: p1Seats,
            player2Seats: p2Seats,
            otherSeats: otherSeats,
            popularity: { ...popularity }
        });
    });
    
    return results;
}

// Get the current leading player for a state
function getStateLeader(svgId) {
    const popularity = statePopularity[svgId];
    if (!popularity) return null;
    
    if (popularity.player1 > popularity.player2 && popularity.player1 > popularity.others) {
        return { player: 'player1', percentage: popularity.player1 };
    } else if (popularity.player2 > popularity.player1 && popularity.player2 > popularity.others) {
        return { player: 'player2', percentage: popularity.player2 };
    } else {
        return { player: 'others', percentage: popularity.others };
    }
}

// Update map colors based on current popularity
function updateMapColors() {
    const svgElement = document.querySelector('#map-container svg');
    if (!svgElement) return;
    
    statesData.forEach(state => {
        const path = svgElement.querySelector(`#${state.SvgId}`);
        if (!path) return;
        
        const leader = getStateLeader(state.SvgId);
        if (!leader) return;
        
        let color;
        let intensity;
        
        // Base colors for players
        const colors = {
            player1: { r: 90, g: 196, b: 97 },   // Green (#5ac461)
            player2: { r: 230, g: 92, b: 92 },   // Red (#e65c5c)
            others: { r: 150, g: 150, b: 150 }   // Gray
        };
        
        const baseColor = colors[leader.player];
        
        // Calculate intensity based on percentage (35% = min opacity, 80% = max opacity)
        const minPercentage = 35;
        const maxPercentage = 80;
        intensity = Math.max(0.3, Math.min(1.0, 
            0.3 + (leader.percentage - minPercentage) / (maxPercentage - minPercentage) * 0.7
        ));
        
        // Apply color with calculated intensity
        color = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${intensity})`;
        path.style.fill = color;
        
        // Add subtle border for very competitive states
        if (leader.percentage < 40) {
            path.style.stroke = '#333';
            path.style.strokeWidth = '0.5';
        } else {
            path.style.stroke = '';
            path.style.strokeWidth = '';
        }
    });
    
    console.log('Map colors updated based on current popularity');
}

// Display final election results
function showElectionResults() {
    const results = calculateSeatDistribution();
    const winner = results.player1 >= 272 ? 'Player 1' : 
                   results.player2 >= 272 ? 'Player 2' : 'Hung Parliament';
    
    console.log('Final Election Results:', results);
    
    // Create results modal or display
    const resultsHTML = `
        <div id="election-results-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                text-align: center;
                color: #333;
            ">
                <h2 style="margin-bottom: 20px;">Election Results</h2>
                <div style="margin-bottom: 20px;">
                    <h3 style="color: ${winner === 'Player 1' ? '#5ac461' : winner === 'Player 2' ? '#e65c5c' : '#666'}">
                        ${winner}${winner !== 'Hung Parliament' ? ' Wins!' : ''}
                    </h3>
                </div>
                <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                    <div>
                        <strong>Player 1</strong><br>
                        ${results.player1} seats
                    </div>
                    <div>
                        <strong>Player 2</strong><br>
                        ${results.player2} seats
                    </div>
                    <div>
                        <strong>Others</strong><br>
                        ${results.others} seats
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <small>Total: ${results.player1 + results.player2 + results.others} seats</small><br>
                    <small>Majority needed: 272 seats</small>
                </div>
                <button onclick="document.getElementById('election-results-modal').remove()" 
                        style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', resultsHTML);
    
    return results;
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

// Utility functions for campaign actions

// Apply popularity change to multiple states at once (for regional campaigns)
function updateRegionalPopularity(stateFilter, player, popularityChange, reason = '') {
    let affectedStates = 0;
    
    statesData.forEach(state => {
        if (stateFilter(state)) {
            const success = updateStatePopularity(state.SvgId, player, popularityChange, reason);
            if (success) affectedStates++;
        }
    });
    
    console.log(`Regional campaign affected ${affectedStates} states: ${reason}`);
    return affectedStates;
}

// Apply popularity boost to states where player is already strong
function strengthenStrongholds(player, boost = 3) {
    return updateRegionalPopularity(
        (state) => {
            const leader = getStateLeader(state.SvgId);
            return leader && leader.player === player && leader.percentage > 40;
        },
        player,
        boost,
        'strengthening strongholds'
    );
}

// Apply popularity boost to competitive states (where no one has >50%)
function targetCompetitiveStates(player, boost = 4) {
    return updateRegionalPopularity(
        (state) => {
            const popularity = statePopularity[state.SvgId];
            return popularity && Math.max(popularity.player1, popularity.player2, popularity.others) < 50;
        },
        player,
        boost,
        'targeting competitive states'
    );
}

// Apply popularity boost based on state characteristics
function targetStatesByCategory(category, player, boost = 5) {
    return updateRegionalPopularity(
        (state) => shouldHighlightState(state, category),
        player,
        boost,
        `targeting ${category} states`
    );
}

// Get popularity statistics for analysis
function getPopularityStats() {
    const stats = {
        player1: { dominant: 0, competitive: 0, trailing: 0, totalSeats: 0 },
        player2: { dominant: 0, competitive: 0, trailing: 0, totalSeats: 0 },
        others: { dominant: 0, totalSeats: 0 }
    };
    
    statesData.forEach(state => {
        const popularity = statePopularity[state.SvgId];
        const seats = parseInt(state.LokSabhaSeats);
        const leader = getStateLeader(state.SvgId);
        
        if (leader.player === 'player1') {
            stats.player1.totalSeats += seats;
            if (leader.percentage > 50) stats.player1.dominant++;
            else stats.player1.competitive++;
        } else if (leader.player === 'player2') {
            stats.player2.totalSeats += seats;
            if (leader.percentage > 50) stats.player2.dominant++;
            else stats.player2.competitive++;
        } else {
            stats.others.totalSeats += seats;
            stats.others.dominant++;
        }
        
        // Count trailing states
        if (popularity.player1 < 25) stats.player1.trailing++;
        if (popularity.player2 < 25) stats.player2.trailing++;
    });
    
    return stats;
}

// Test function to demonstrate the popularity system
function testPopularitySystem() {
    console.log('=== Testing State Popularity Management System ===');
    
    // Show initial stats
    console.log('Initial Setup:');
    const initialStats = getPopularityStats();
    console.log('Player 1 - Dominant:', initialStats.player1.dominant, 'Competitive:', initialStats.player1.competitive, 'Seats:', initialStats.player1.totalSeats);
    console.log('Player 2 - Dominant:', initialStats.player2.dominant, 'Competitive:', initialStats.player2.competitive, 'Seats:', initialStats.player2.totalSeats);
    
    // Test individual state update
    console.log('\n--- Testing Individual State Update ---');
    updateStatePopularity('INUP', 'player1', 10, 'test campaign');
    
    // Test regional campaigns
    console.log('\n--- Testing Regional Campaigns ---');
    const affected1 = targetStatesByCategory('South India', 'player1', 8);
    console.log(`South India campaign affected ${affected1} states`);
    
    const affected2 = strengthenStrongholds('player2', 5);
    console.log(`Stronghold reinforcement affected ${affected2} states`);
    
    // Show seat distribution
    console.log('\n--- Current Seat Distribution ---');
    const results = calculateSeatDistribution();
    console.log('Player 1:', results.player1, 'seats');
    console.log('Player 2:', results.player2, 'seats');
    console.log('Others:', results.others, 'seats');
    console.log('Total:', results.player1 + results.player2 + results.others, 'seats');
    
    // Show some state details
    console.log('\n--- Sample State Details ---');
    ['INUP', 'INMH', 'INTN', 'INWB', 'INGJ'].forEach(svgId => {
        const state = findStateById(svgId);
        const popularity = statePopularity[svgId];
        const leader = getStateLeader(svgId);
        if (state && popularity) {
            console.log(`${state.State}: P1=${Math.round(popularity.player1)}% P2=${Math.round(popularity.player2)}% Others=${Math.round(popularity.others)}% | Leader: ${leader.player} (${Math.round(leader.percentage)}%)`);
        }
    });
    
    console.log('=== Test Complete ===');
}

// Make key functions available in browser console for testing
window.showElectionResults = showElectionResults;
window.getPopularityStats = getPopularityStats;
window.calculateSeatDistribution = calculateSeatDistribution;
window.updateStatePopularity = updateStatePopularity;
window.targetStatesByCategory = targetStatesByCategory;
window.strengthenStrongholds = strengthenStrongholds;
window.targetCompetitiveStates = targetCompetitiveStates;

// Add a way to trigger the test from the browser console
window.testPopularitySystem = testPopularitySystem;

// Direct Investment System
function handleDirectInvestment(stateId, playerId) {
    const state = findStateById(stateId);
    const playerData = getPlayerData(playerId);
    
    if (!state || !playerData) {
        console.error('Invalid state or player for direct investment');
        return false;
    }
    
    // Calculate investment cost: seats × 10M
    const seats = parseInt(state.LokSabhaSeats);
    const baseCost = seats * 10; // 10M per seat
    
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
    let popularityBoost = 5; // Base 5% boost
    
    // Apply diminishing returns: each subsequent investment gives 20% less effect
    for (let i = 0; i < investmentCount; i++) {
        popularityBoost *= 0.8; // 20% reduction per previous investment
    }
    
    // Round to 1 decimal place
    popularityBoost = Math.round(popularityBoost * 10) / 10;
    
    // Minimum boost of 0.5%
    popularityBoost = Math.max(0.5, popularityBoost);
    
    // Update player funds
    updatePlayerFunds(playerId, -baseCost);
    
    // Track the investment
    playerData.investments[stateId]++;
    
    // Apply popularity boost
    const success = updateStatePopularity(stateId, playerId, popularityBoost, `direct investment #${playerData.investments[stateId]}`);
    
    if (success) {
        return true;
    }
    
    return false;
}

// Rally System Functions
function useSimpleRallyToken(stateId, playerId) {
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
    
    // Use the rally token
    playerData.rallyTokens.simple--;
    
    // Apply 4% popularity boost
    const popularityBoost = 4;
    const success = updateStatePopularity(stateId, playerId, popularityBoost, `simple rally in ${state.State}`);
    
    if (success) {
        updateRallyTokenDisplay();
        return true;
    }
    
    return false;
}

function useSpecialRallyToken(playerId) {
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
    
    // Use the special rally token
    playerData.rallyTokens.special--;
    
    // Apply 10% popularity boost nationwide
    const popularityBoost = 10;
    let affectedStates = 0;
    
    statesData.forEach(state => {
        const success = updateStatePopularity(state.SvgId, playerId, popularityBoost, 'nationwide special rally');
        if (success) affectedStates++;
    });
    
    updateRallyTokenDisplay();
    return true;
}

// Reset rally tokens at the start of each phase
async function resetRallyTokensForPhase() {
    const config = await getGameConfig();
    const simpleTokens = config.rallySystem?.simpleRallyTokens || 2;
    const specialTokens = config.rallySystem?.specialRallyTokens || 2;
    
    gameState.player1.rallyTokens.simple = simpleTokens;
    gameState.player1.rallyTokens.special = specialTokens;
    gameState.player2.rallyTokens.simple = simpleTokens;
    gameState.player2.rallyTokens.special = specialTokens;
    
    console.log(`Rally tokens reset for new phase: ${simpleTokens} simple, ${specialTokens} special`);
    updateRallyTokenDisplay();
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
                const baseCost = parseInt(state.LokSabhaSeats) * 10;
                stats.totalSpentOnInvestments += baseCost * investmentCount;
            }
        }
    });
    
    return stats;
}

// Make new functions available globally
window.handleDirectInvestment = handleDirectInvestment;
window.useSimpleRallyToken = useSimpleRallyToken;
window.useSpecialRallyToken = useSpecialRallyToken;
window.resetRallyTokensForPhase = resetRallyTokensForPhase;
window.getInvestmentStats = getInvestmentStats;
