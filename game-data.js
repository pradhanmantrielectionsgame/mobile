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
        totalSpent: 0
    },
    player2: {
        id: 'player2', 
        name: 'Player 2',
        politician: null, // Will store selected politician data
        funds: 850, // In millions
        totalSpent: 0
    },
    currentPhase: 1,
    maxPhases: 8,
    gameStarted: false
};

// Load states data from JSON file
async function loadStatesData() {
    try {
        const response = await fetch('data/states_data.json');
        statesData = await response.json();
        
        // Generate random popularity data for each state
        statesData.forEach(state => {
            // Generate random popularity percentages that sum to 100
            const player1 = Math.floor(Math.random() * 60) + 20; // 20-80%
            const player2 = Math.floor(Math.random() * (80 - player1)) + 10; // 10-remaining%
            const others = 100 - player1 - player2;
            
            statePopularity[state.SvgId] = {
                player1: player1,
                player2: player2,
                others: others
            };
        });
        
        console.log('States data loaded:', statesData.length, 'states');
        
        // Update projected seats after data is loaded
        setTimeout(() => {
            updateProjectedSeatsBar();
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
                <div class="funds-display" id="p1-funds">₹${p1Data.funds}M</div>
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
                <div class="funds-display" id="p2-funds">₹${p2Data.funds}M</div>
            </div>
            <div class="player-avatar-section">
                <img src="${p2Data.politician.image}" alt="${p2Data.politician.name}" class="candidate-icon" onerror="this.style.display='none'">
                <img src="${p2Data.politician.partyLogo}" alt="${p2Data.politician.party}" class="party-icon" onerror="this.style.display='none'">
            </div>
        `;
    }
}

// Calculate and update projected seats
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
            // Determine winner based on highest percentage
            if (popularity.player1 > popularity.player2 && popularity.player1 > popularity.others) {
                p1Seats += seats;
            } else if (popularity.player2 > popularity.player1 && popularity.player2 > popularity.others) {
                p2Seats += seats;
            } else {
                otherSeats += seats;
            }
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
    
    console.log(`Projected Seats - P1: ${p1Seats}, Others: ${otherSeats}, P2: ${p2Seats}, Total: ${totalSeats}`);
}

// Find state by SVG ID
function findStateById(svgId) {
    return statesData.find(state => state.SvgId === svgId);
}

// Update state info banner with two-row layout
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
                <span>P1: ${popularity.player1}%</span>
                <span>P2: ${popularity.player2}%</span>
                <span>Others: ${popularity.others}%</span>
            </div>
        `;
        console.log(`Updated info for ${state.State} (${svgId})`);
    } else {
        console.log(`No data found for SVG ID: ${svgId}`);
    }
}

// Simulate dynamic popularity changes (for demonstration)
function simulatePopularityChanges() {
    setInterval(() => {
        // Randomly update a few states' popularity
        const stateIds = Object.keys(statePopularity);
        const randomStates = stateIds.slice(0, 3); // Update first 3 states
        
        randomStates.forEach(svgId => {
            if (statePopularity[svgId]) {
                // Small random changes (±5%)
                const change1 = (Math.random() - 0.5) * 10;
                const change2 = (Math.random() - 0.5) * 10;
                
                let newP1 = Math.max(5, Math.min(85, statePopularity[svgId].player1 + change1));
                let newP2 = Math.max(5, Math.min(85, statePopularity[svgId].player2 + change2));
                
                // Ensure total doesn't exceed 100
                if (newP1 + newP2 > 95) {
                    const total = newP1 + newP2;
                    newP1 = (newP1 / total) * 95;
                    newP2 = (newP2 / total) * 95;
                }
                
                const newOthers = 100 - newP1 - newP2;
                
                statePopularity[svgId] = {
                    player1: Math.round(newP1),
                    player2: Math.round(newP2),
                    others: Math.round(newOthers)
                };
            }
        });
        
        console.log('Popularity updated for', randomStates.length, 'states');
        
        // Update projected seats after popularity changes
        updateProjectedSeatsBar();
    }, 15000); // Update every 15 seconds
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
