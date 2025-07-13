// Main Application Logic
// This file handles map loading, UI interactions, state groups, and modal functionality

// Handle SVG path clicks
function handleStateClick(event) {
    const target = event.target;
    let svgId = null;
    
    // Check if clicked element has an ID
    if (target.id) {
        svgId = target.id;
    }
    // Check if clicked element's parent has an ID (for grouped elements)
    else if (target.parentElement && target.parentElement.id) {
        svgId = target.parentElement.id;
    }
    
    if (svgId && findStateById(svgId)) {
        updateStateInfo(svgId);
        
        // Add visual feedback
        target.style.stroke = '#ff6b6b';
        target.style.strokeWidth = '2';
        setTimeout(() => {
            target.style.stroke = '';
            target.style.strokeWidth = '';
        }, 500);
    } else if (svgId) {
        console.log(`Clicked SVG element with ID: ${svgId}, but no matching state found`);
    }
}

// Add hover effects to SVG paths
function addMapInteractivity(svgElement) {
    const paths = svgElement.querySelectorAll('path[id], g[id]');
    
    paths.forEach(path => {
        const svgId = path.id;
        const state = findStateById(svgId);
        
        if (state) {
            // Make it clickable
            path.style.cursor = 'pointer';
            
            // Store original color for hover effects
            const originalFill = path.style.fill;
            
            // Add hover effect
            path.addEventListener('mouseenter', () => {
                path.style.opacity = '0.8';
                path.style.stroke = '#fff';
                path.style.strokeWidth = '2';
            });
            
            path.addEventListener('mouseleave', () => {
                path.style.opacity = '';
                path.style.stroke = '';
                path.style.strokeWidth = '';
            });
            
            // Add click handler
            path.addEventListener('click', handleStateClick);
        }
    });
}

// Load India map
async function loadMap() {
    try {
        const response = await fetch('assets/icons/INDIA_V3_smaller_viewbox.svg');
        const svgText = await response.text();
        const container = document.getElementById('map-container');
        container.innerHTML = svgText;
        
        const svgElement = container.querySelector('svg');
        if (svgElement) {
            svgElement.removeAttribute('width');
            svgElement.removeAttribute('height');
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
            
            console.log('India map loaded with states data integration');
            
            // Add interactivity to the map
            addMapInteractivity(svgElement);
            
            // Apply initial map colors based on popularity
            setTimeout(() => {
                if (typeof updateMapColors === 'function') {
                    updateMapColors();
                }
            }, 500);
        }
    } catch (error) {
        console.error('Error loading map:', error);
        // Fallback display
        document.getElementById('map-container').innerHTML = 
            '<div style="color: #fff; text-align: center; padding: 20px;">Map loading failed. States data still available.</div>';
    }
}

// Update game stats (timer simulation)
function updateGameStats() {
    const timer = document.getElementById('timer-display');
    
    // Example of dynamic updates (in a real game, this would come from game logic)
    setInterval(() => {
        const minutes = Math.floor(Math.random() * 5);
        const seconds = Math.floor(Math.random() * 60);
        const phase = Math.floor(Math.random() * 8) + 1;
        timer.textContent = `Phase ${phase}/8 | ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 10000);
}

// State groups functionality
function initStateGroups() {
    const stateGroups = document.querySelectorAll('.state-group');
    stateGroups.forEach(group => {
        group.addEventListener('click', () => {
            // Remove active class from all groups
            stateGroups.forEach(g => g.classList.remove('active'));
            // Add active class to clicked group
            group.classList.add('active');
            
            const groupName = group.textContent.trim();
            console.log('Selected state group:', groupName);
            
            // Filter states by group
            if (groupName.toLowerCase() === 'all') {
                resetMapHighlighting();
                updateGroupStatistics('all', statesData);
            } else {
                filterStatesByGroup(groupName);
            }
        });
    });
    
    // Initialize with "All" group statistics
    setTimeout(() => {
        updateGroupStatistics('all', statesData);
    }, 100);
}

// Union Territories functionality
function initUnionTerritories() {
    const utButtons = document.querySelectorAll('.ut-button');
    utButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove selected class from all UT buttons
            utButtons.forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            button.classList.add('selected');
            
            const svgId = button.getAttribute('data-svg-id');
            const utName = button.textContent.trim();
            console.log('Selected Union Territory:', utName, 'SVG ID:', svgId);
            
            // Update state info for the selected UT
            updateStateInfo(svgId);
            
            // Highlight the UT on the map
            highlightUnionTerritory(svgId);
            
            // Reset state groups to "All"
            const stateGroups = document.querySelectorAll('.state-group');
            stateGroups.forEach(g => g.classList.remove('active'));
            stateGroups[0].classList.add('active'); // "All" is first
            
            // Reset map highlighting but preserve this UT selection
            resetMapHighlighting();
            highlightUnionTerritory(svgId);
        });
    });
}

// Highlight specific Union Territory on the map
function highlightUnionTerritory(svgId) {
    const svgElement = document.querySelector('#map-container svg');
    if (!svgElement) return;
    
    const paths = svgElement.querySelectorAll('path[id], g[id]');
    
    // Reset all paths to normal
    paths.forEach(path => {
        path.style.opacity = '0.4';
        path.style.filter = '';
        path.style.stroke = '';
        path.style.strokeWidth = '';
    });
    
    // Highlight the selected UT
    const utPath = svgElement.querySelector(`#${svgId}`);
    if (utPath) {
        utPath.style.opacity = '1';
        utPath.style.filter = 'brightness(1.3) drop-shadow(0 0 5px #4CAF50)';
        utPath.style.stroke = '#4CAF50';
        utPath.style.strokeWidth = '2';
        
        // Scroll the UT into view if needed (for small devices)
        utPath.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    console.log('Highlighted Union Territory:', svgId);
}

// Handle state group filtering with UT button highlighting
function filterStatesByGroup(groupName) {
    const svgElement = document.querySelector('#map-container svg');
    if (!svgElement) return;
    
    const paths = svgElement.querySelectorAll('path[id], g[id]');
    const utButtons = document.querySelectorAll('.ut-button');
    
    // Reset all map paths
    paths.forEach(path => {
        path.style.opacity = '0.3';
        path.style.filter = '';
        path.style.stroke = '';
        path.style.strokeWidth = '';
    });
    
    // Reset all UT buttons
    utButtons.forEach(button => {
        button.classList.remove('group-highlighted');
        button.style.opacity = '0.4';
        button.style.transform = '';
    });
    
    // If "All" is selected, reset everything to normal
    if (groupName.toLowerCase() === 'all') {
        paths.forEach(path => {
            path.style.opacity = '';
            path.style.filter = '';
        });
        utButtons.forEach(button => {
            button.style.opacity = '';
        });
        return;
    }
    
    // Highlight states that match the group criteria
    let matchingStates = [];
    statesData.forEach(state => {
        if (shouldHighlightState(state, groupName)) {
            matchingStates.push(state);
            const path = svgElement.querySelector(`#${state.SvgId}`);
            if (path) {
                path.style.opacity = '1';
                path.style.filter = 'brightness(1.2) drop-shadow(0 0 3px #4CAF50)';
                path.style.stroke = '#4CAF50';
                path.style.strokeWidth = '1';
            }
            
            // Highlight corresponding UT button if it's a Union Territory
            if (state.UnionTerritory === 'TRUE') {
                const utButton = document.querySelector(`[data-svg-id="${state.SvgId}"]`);
                if (utButton) {
                    utButton.classList.add('group-highlighted');
                    utButton.style.opacity = '1';
                    utButton.style.transform = 'scale(1.05)';
                }
            }
        }
    });
    
    console.log(`Filtered by "${groupName}": ${matchingStates.length} states/UTs highlighted`);
    console.log('Matching states:', matchingStates.map(s => s.State).join(', '));
    
    // Update state info banner with group statistics
    updateGroupStatistics(groupName, matchingStates);
}

// Reset map highlighting and UT buttons
function resetMapHighlighting() {
    const svgElement = document.querySelector('#map-container svg');
    if (!svgElement) return;
    
    const paths = svgElement.querySelectorAll('path[id], g[id]');
    const utButtons = document.querySelectorAll('.ut-button');
    
    // Reset map paths
    paths.forEach(path => {
        path.style.opacity = '';
        path.style.filter = '';
        path.style.stroke = '';
        path.style.strokeWidth = '';
    });
    
    // Reset UT buttons (but preserve individual selections)
    utButtons.forEach(button => {
        button.classList.remove('group-highlighted');
        button.style.opacity = '';
        button.style.transform = '';
    });
}

// Options modal functionality
function initOptionsModal() {
    const optionsModal = document.getElementById('options-modal');
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = optionsModal.querySelector('.close-btn');
    
    // Open modal
    menuBtn.addEventListener('click', () => {
        optionsModal.classList.add('open');
    });
    
    // Close modal via close button
    closeBtn.addEventListener('click', () => {
        optionsModal.classList.remove('open');
    });
    
    // Close modal via backdrop click
    optionsModal.addEventListener('click', (e) => {
        if (e.target === optionsModal) {
            optionsModal.classList.remove('open');
        }
    });
    
    // Handle card clicks
    const cards = optionsModal.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const action = card.textContent.trim();
            console.log('Selected option:', action);
            // Add your action handling logic here
            optionsModal.classList.remove('open');
        });
    });
}

// Main initialization function
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Pradhan Mantri Elections Game...');
    
    // Load states data first
    await loadStatesData();
    
    // Load politicians data
    await loadPoliticiansData();
    
    // Load policy tags for campaigns
    await loadPolicyTags();
    
    // Then load the map and other components
    loadMap();
    updateGameStats();
    initStateGroups();
    initUnionTerritories();
    
    // Modal functionality
    initOptionsModal();
    
    // Initialize campaign and rally systems
    initCampaignModal();
    initRallyButton();
    
    // Start popularity simulation
    simulatePopularityChanges();
    
    // Show initial state info after data is loaded
    setTimeout(() => {
        // Show Uttar Pradesh by default (INUP)
        updateStateInfo('INUP');
    }, 1000);
    
    // Add resize listener to ensure proper layout on viewport changes
    window.addEventListener('resize', () => {
        // Force a re-render of the state info if it exists
        const currentStateName = document.querySelector('.state-name');
        if (currentStateName && currentStateName.textContent !== 'Select a state to view details...') {
            const currentState = statesData.find(state => 
                currentStateName.textContent === state.State
            );
            if (currentState) {
                updateStateInfo(currentState.SvgId);
            }
        }
    });
    
    console.log('Game initialization complete!');
});
