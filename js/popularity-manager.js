// Popularity Management System
// Handles state popularity calculations, updates, and analysis

let statePopularity = {};

// Initialize state popularity system with balanced game design
async function initializeStatePopularity() {
    console.log('Initializing balanced state popularity system...');
    
    const statesData = getStatesData();
    const balanceConfig = await getGameBalanceConfig();
    
    // Calculate total seats to determine targets
    const totalSeats = getTotalSeats();
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
            player1 = Math.floor(Math.random() * 26) + balanceConfig.dominantTerritoryMinPopularity; // 35-60%
            player2 = Math.floor(Math.random() * (balanceConfig.competitiveMaxPopularity - 5)) + 5; // 5-34%
            others = 100 - player1 - player2;
        } else if (p2DominantStates.includes(svgId)) {
            // Player 2 dominant: 35-60% for P2
            player2 = Math.floor(Math.random() * 26) + balanceConfig.dominantTerritoryMinPopularity; // 35-60%
            player1 = Math.floor(Math.random() * (balanceConfig.competitiveMaxPopularity - 5)) + 5; // 5-34%
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
    
    return statePopularity;
}

// Calculate initialization statistics for validation
function calculateInitializationStats() {
    const statesData = getStatesData();
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

// Calculate and update projected seats using proportional allocation
function calculateProjectedSeats() {
    const statesData = getStatesData();
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

// Calculate seat distribution using proportional allocation
function calculateSeatDistribution() {
    const statesData = getStatesData();
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

// Get popularity statistics for analysis
function getPopularityStats() {
    const statesData = getStatesData();
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

// Apply popularity change to multiple states at once (for regional campaigns)
function updateRegionalPopularity(stateFilter, player, popularityChange, reason = '') {
    const statesData = getStatesData();
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

// Get state popularity data
function getStatePopularity(svgId) {
    return statePopularity[svgId] || null;
}

// Get all state popularity data
function getAllStatePopularity() {
    return statePopularity;
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

// Export functions for global access
window.initializeStatePopularity = initializeStatePopularity;
window.updateStatePopularity = updateStatePopularity;
window.getStateLeader = getStateLeader;
window.calculateProjectedSeats = calculateProjectedSeats;
window.calculateSeatDistribution = calculateSeatDistribution;
window.getPopularityStats = getPopularityStats;
window.updateRegionalPopularity = updateRegionalPopularity;
window.strengthenStrongholds = strengthenStrongholds;
window.targetCompetitiveStates = targetCompetitiveStates;
window.targetStatesByCategory = targetStatesByCategory;
window.getStatePopularity = getStatePopularity;
window.getAllStatePopularity = getAllStatePopularity;
window.simulatePopularityChanges = simulatePopularityChanges;
