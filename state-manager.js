// State Data Management System
// Handles loading states data and basic state operations

let statesData = [];

// Load states data from JSON file
async function loadStatesData() {
    try {
        const response = await fetch('data/states_data.json');
        statesData = await response.json();
        
        console.log('States data loaded:', statesData.length, 'states');
        return statesData;
        
    } catch (error) {
        console.error('Error loading states data:', error);
        // Fallback data
        statesData = [
            { State: "Uttar Pradesh", LokSabhaSeats: "80", SvgId: "INUP" },
            { State: "Maharashtra", LokSabhaSeats: "48", SvgId: "INMH" },
            { State: "Tamil Nadu", LokSabhaSeats: "39", SvgId: "INTN" }
        ];
        return statesData;
    }
}

// Get states data
function getStatesData() {
    return statesData;
}

// Find state by SVG ID
function findStateById(svgId) {
    return statesData.find(state => state.SvgId === svgId);
}

// Find state by name
function findStateByName(stateName) {
    return statesData.find(state => 
        state.State.toLowerCase() === stateName.toLowerCase()
    );
}

// Get state seats count
function getStateSeats(svgId) {
    const state = findStateById(svgId);
    return state ? parseInt(state.LokSabhaSeats) || 0 : 0;
}

// Get total seats in the country
function getTotalSeats() {
    return statesData.reduce((total, state) => {
        return total + (parseInt(state.LokSabhaSeats) || 0);
    }, 0);
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

// Get states by category
function getStatesByCategory(categoryName) {
    return statesData.filter(state => shouldHighlightState(state, categoryName));
}

// Get states statistics
function getStatesStatistics() {
    const totalSeats = getTotalSeats();
    const stateCount = statesData.filter(s => s.UnionTerritory === 'FALSE').length;
    const utCount = statesData.filter(s => s.UnionTerritory === 'TRUE').length;
    
    return {
        totalStates: statesData.length,
        stateCount,
        utCount,
        totalSeats
    };
}

// Update group statistics in the UI banner
function updateGroupStatistics(groupName, matchingStates) {
    const banner = document.getElementById('states-banner');
    const stateInfoSection = banner.querySelector('.state-info-section');
    
    if (!stateInfoSection) return;
    
    if (groupName.toLowerCase() === 'all') {
        const stats = getStatesStatistics();
        stateInfoSection.innerHTML = `
            <div class="state-name">Select a state to view details...</div>
            <div class="state-stats">
                <span>Total: ${stats.totalStates} states/UTs</span>
                <span>Seats: ${stats.totalSeats}</span>
                <span>States: ${stats.stateCount}</span>
                <span>UTs: ${stats.utCount}</span>
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

// Export functions for global access
window.loadStatesData = loadStatesData;
window.getStatesData = getStatesData;
window.findStateById = findStateById;
window.findStateByName = findStateByName;
window.getStateSeats = getStateSeats;
window.getTotalSeats = getTotalSeats;
window.shouldHighlightState = shouldHighlightState;
window.getStatesByCategory = getStatesByCategory;
window.getStatesStatistics = getStatesStatistics;
window.updateGroupStatistics = updateGroupStatistics;
