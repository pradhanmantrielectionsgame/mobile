// UI Management System
// Handles UI updates, map coloring, seat projections, and state info display

// Update state info banner with popularity and leader information
function updateStateInfo(svgId) {
    const state = findStateById(svgId);
    const popularity = getStatePopularity(svgId);
    const banner = document.getElementById('states-banner');
    
    if (state && popularity && banner) {
        const stateInfoSection = banner.querySelector('.state-info-section');
        if (stateInfoSection) {
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
        }
    } else {
        console.log(`No data found for SVG ID: ${svgId}`);
    }
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
        } else {
            p1Segment.style.border = '';
            p2Segment.style.border = '';
            p1Segment.title = '';
            p2Segment.title = '';
        }
    }
    
    console.log(`Projected Seats - P1: ${p1Seats}, Others: ${otherSeats}, P2: ${p2Seats}, Total: ${totalSeats}`);
}

// Update map colors based on current popularity
function updateMapColors() {
    const svgElement = document.querySelector('#map-container svg');
    if (!svgElement) return;
    
    const statesData = getStatesData();
    
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

// Initialize UI updates after data is loaded
function initializeUI() {
    // Update projected seats after data is loaded
    setTimeout(() => {
        updateProjectedSeatsBar();
        updateMapColors();
    }, 100);
}

// Test function to demonstrate the system
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
        const popularity = getStatePopularity(svgId);
        const leader = getStateLeader(svgId);
        if (state && popularity) {
            console.log(`${state.State}: P1=${Math.round(popularity.player1)}% P2=${Math.round(popularity.player2)}% Others=${Math.round(popularity.others)}% | Leader: ${leader.player} (${Math.round(leader.percentage)}%)`);
        }
    });
    
    console.log('=== Test Complete ===');
}

// Export functions for global access
window.updateStateInfo = updateStateInfo;
window.updateProjectedSeatsBar = updateProjectedSeatsBar;
window.updateMapColors = updateMapColors;
window.showElectionResults = showElectionResults;
window.initializeUI = initializeUI;
window.testPopularitySystem = testPopularitySystem;
