/**
 * Ripple Effects System
 * Provides visual feedback for player actions with animated ripples
 */

class RippleEffectsManager {
    constructor() {
        this.activeRipples = new Set();
        this.maxConcurrentRipples = 4;
        this.mapContainer = null;
        this.statesData = null;
        this.init();
    }

    init() {
        // Get map container reference
        this.mapContainer = document.getElementById('map-container');
        if (!this.mapContainer) {
            console.warn('Map container not found for ripple effects');
            return;
        }

        // Ensure map container can contain ripples
        if (!this.mapContainer.classList.contains('ripple-container')) {
            this.mapContainer.classList.add('ripple-container');
        }

        // Get states data reference
        if (window.getStatesData) {
            this.statesData = window.getStatesData();
        }

        // Initialize basic audio system if not already present
        this.initAudioSystem();

        console.log('Ripple Effects Manager initialized');
    }

    /**
     * Initialize basic audio system for sound effects
     */
    initAudioSystem() {
        // Create playAudio function if it doesn't exist
        if (typeof window.playAudio === 'undefined') {
            window.playAudio = (soundName) => {
                try {
                    // Check if audio is enabled in config
                    if (window.getGameConfig) {
                        window.getGameConfig().then(config => {
                            if (config?.audio?.enableSounds !== false) {
                                const audio = new Audio(`sounds/${soundName}.mp3`);
                                audio.volume = config?.audio?.volume || 0.5;
                                audio.play().catch(e => {
                                    console.log(`Audio play failed (user interaction required): ${soundName}`);
                                });
                            }
                        });
                    } else {
                        // Fallback if config not available
                        const audio = new Audio(`sounds/${soundName}.mp3`);
                        audio.volume = 0.5;
                        audio.play().catch(e => {
                            console.log(`Audio play failed (user interaction required): ${soundName}`);
                        });
                    }
                } catch (error) {
                    console.warn(`Audio system error for ${soundName}:`, error);
                }
            };
        }
    }

    /**
     * Create a ripple effect at specific coordinates
     * @param {number} x - X coordinate relative to map container
     * @param {number} y - Y coordinate relative to map container  
     * @param {string} playerId - 'player1' or 'player2'
     * @param {HTMLElement} container - Container element (defaults to map container)
     */
    createRippleEffect(x, y, playerId, container = null) {
        if (!container) {
            container = this.mapContainer;
        }

        if (!container) {
            console.warn('No container available for ripple effect');
            return;
        }

        // Limit concurrent ripples for performance
        if (this.activeRipples.size >= this.maxConcurrentRipples) {
            const oldestRipple = this.activeRipples.values().next().value;
            this.removeRipple(oldestRipple);
        }

        // Create ripple element
        const ripple = document.createElement('div');
        ripple.className = `ripple-effect ${playerId}`;

        // Calculate ripple size based on container size
        const containerRect = container.getBoundingClientRect();
        const rippleSize = Math.min(containerRect.width, containerRect.height) * 0.15; // Reduced from 0.3 to 0.15

        // Position ripple
        ripple.style.width = `${rippleSize}px`;
        ripple.style.height = `${rippleSize}px`;
        ripple.style.left = `${x - rippleSize / 2}px`;
        ripple.style.top = `${y - rippleSize / 2}px`;

        // Add to container
        container.appendChild(ripple);
        this.activeRipples.add(ripple);

        // Auto-remove after animation
        setTimeout(() => {
            this.removeRipple(ripple);
        }, 800);

        return ripple;
    }

    /**
     * Create ripple effect from a click event on an element
     * @param {HTMLElement} element - The clicked element
     * @param {Event} event - The click event
     * @param {string} playerId - 'player1' or 'player2'
     */
    createRippleFromClick(element, event, playerId) {
        if (!this.mapContainer) return;

        // Get click coordinates relative to map container
        const mapRect = this.mapContainer.getBoundingClientRect();
        const x = event.clientX - mapRect.left;
        const y = event.clientY - mapRect.top;

        this.createRippleEffect(x, y, playerId);
    }

    /**
     * Create ripple effect at the geographic center of a state/UT
     * @param {string} svgId - The SVG ID of the state/UT
     * @param {string} playerId - 'player1' or 'player2'
     */
    createRippleAtGeographicCenter(svgId, playerId) {
        if (!this.mapContainer) return;

        // Find the SVG element by ID
        const svgElement = this.mapContainer.querySelector(`#${svgId}`);
        if (!svgElement) {
            console.warn(`SVG element not found for ID: ${svgId}`);
            return;
        }

        // Get element's bounding box
        const elementBounds = svgElement.getBBox();
        const mapSvg = this.mapContainer.querySelector('svg');
        
        if (!mapSvg) {
            console.warn('SVG map not found');
            return;
        }

        // Calculate center coordinates in SVG space
        const centerX = elementBounds.x + elementBounds.width / 2;
        const centerY = elementBounds.y + elementBounds.height / 2;

        // Convert SVG coordinates to container coordinates
        const svgRect = mapSvg.getBoundingClientRect();
        const mapRect = this.mapContainer.getBoundingClientRect();
        
        const viewBox = mapSvg.viewBox.baseVal;
        const scaleX = svgRect.width / viewBox.width;
        const scaleY = svgRect.height / viewBox.height;

        const containerX = (centerX * scaleX) + (svgRect.left - mapRect.left);
        const containerY = (centerY * scaleY) + (svgRect.top - mapRect.top);

        this.createRippleEffect(containerX, containerY, playerId);
    }

    /**
     * Remove a ripple element
     * @param {HTMLElement} ripple - The ripple element to remove
     */
    removeRipple(ripple) {
        if (ripple && ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
        this.activeRipples.delete(ripple);
    }

    /**
     * Clean up all active ripples
     */
    cleanup() {
        this.activeRipples.forEach(ripple => {
            this.removeRipple(ripple);
        });
        this.activeRipples.clear();
    }

    /**
     * Handle investment action ripple for states (click-based positioning)
     * @param {Event} event - The click event
     * @param {string} playerId - 'player1' or 'player2'
     */
    handleStateInvestmentRipple(event, playerId) {
        this.createRippleFromClick(event.target, event, playerId);
        
        // Play money_spent sound only for Player 1 (sound is now handled in app.js based on success)
        if (playerId === 'player1' && window.playAudio) {
            window.playAudio('money_spent');
        }
    }

    /**
     * Handle investment action ripple for UTs (geographic positioning)
     * @param {string} svgId - The SVG ID of the UT
     * @param {string} playerId - 'player1' or 'player2'
     */
    handleUTInvestmentRipple(svgId, playerId) {
        this.createRippleAtGeographicCenter(svgId, playerId);
        
        // Play money_spent sound only for Player 1 (sound is now handled in app.js based on success)
        if (playerId === 'player1' && window.playAudio) {
            window.playAudio('money_spent');
        }
    }
}

// Create global instance
const rippleEffectsManager = new RippleEffectsManager();

// Export functions globally for use in other modules
window.createInvestmentRipple = {
    forState: (event, playerId) => rippleEffectsManager.handleStateInvestmentRipple(event, playerId),
    forUT: (svgId, playerId) => rippleEffectsManager.handleUTInvestmentRipple(svgId, playerId)
};

// Export manager for advanced usage
window.rippleEffectsManager = rippleEffectsManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    rippleEffectsManager.cleanup();
});

console.log('Ripple Effects System loaded');
