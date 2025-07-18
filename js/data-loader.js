// Data Loading and Management
// Handles loading game data from JSON files and coordinating initialization

let politiciansData = [];

// Load politicians data from JSON file
async function loadPoliticiansData() {
    try {
        const response = await fetch('data/politicians-data.json');
        const data = await response.json();
        politiciansData = data.politicians;
        
        console.log('Politicians data loaded:', politiciansData.length, 'politicians');
        return politiciansData;
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
        return politiciansData;
    }
}

// Get politicians data
function getPoliticiansData() {
    return politiciansData;
}

// Initialize all data loaders
async function initializeGameData() {
    try {
        console.log('Starting game data initialization...');
        
        // Load all data in parallel
        await Promise.all([
            loadGameConfig(),
            loadStatesData(),
            loadPoliticiansData()
        ]);
        
        // Initialize popularity system after states data is loaded
        await initializeStatePopularity();
        
        // Initialize players with config values
        await initializePlayers();
        
        // Initialize UI updates
        initializeUI();
        
        console.log('All game data loaded and initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing game data:', error);
        return false;
    }
}

// Make functions available globally
window.loadPoliticiansData = loadPoliticiansData;
window.getPoliticiansData = getPoliticiansData;
window.initializeGameData = initializeGameData;
