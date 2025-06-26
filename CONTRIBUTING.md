# Contributing to PradhanMantri Elections Game

Thank you for your interest in contributing to this project! This document provides guidelines for contributing to the PradhanMantri Elections Game.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project aims to be inclusive and welcoming to all contributors. Please be respectful in all interactions.

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of HTML, CSS, and JavaScript
- Understanding of Indian political system (helpful but not required)

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd PradhanMantri-Elections-Game
   ```

2. Open `welcome-screen.html` in your browser to start the game

3. For development, use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description-of-feature`
- `bugfix/description-of-bug`
- `docs/description-of-documentation`
- `refactor/description-of-refactor`

### Commit Message Format

```
type(scope): brief description

Detailed description if necessary

- List any breaking changes
- Reference issues with #issue-number
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

## Coding Standards

### JavaScript

- Use ES6+ features when appropriate
- Use `const` for constants, `let` for variables
- Use arrow functions for callbacks
- Add JSDoc comments for functions
- Use meaningful variable and function names

Example:
```javascript
/**
 * Calculates the seat distribution for a state based on popularity
 * @param {string} stateId - The ID of the state
 * @param {Object} popularity - Popularity scores for all players
 * @returns {Object} Seat distribution object
 */
const calculateSeatDistribution = (stateId, popularity) => {
    // Implementation here
};
```

### CSS

- Use BEM naming convention for classes
- Group related properties together
- Use CSS custom properties for consistent theming
- Ensure responsive design principles

Example:
```css
.game-panel {
    /* Layout */
    display: flex;
    flex-direction: column;
    
    /* Sizing */
    width: 100%;
    min-height: 300px;
    
    /* Styling */
    background-color: var(--panel-bg-color);
    border-radius: var(--border-radius);
    box-shadow: var(--panel-shadow);
}

.game-panel__header {
    /* Nested element styling */
}

.game-panel--highlighted {
    /* Modifier styling */
}
```

### HTML

- Use semantic HTML5 elements
- Ensure accessibility with proper ARIA labels
- Maintain proper indentation
- Include alt text for images

### File Organization

```
├── assets/
│   ├── images/          # PNG/JPG images
│   ├── icons/           # SVG icons and logos
│   └── fonts/           # Custom fonts (if any)
├── data/                # JSON data files
├── docs/                # Documentation
├── js/                  # JavaScript modules
├── sounds/              # Audio files
├── styles/              # CSS stylesheets
└── *.html              # Main HTML files
```

## Testing Guidelines

### Manual Testing Checklist

- [ ] Game loads without errors
- [ ] All interactive elements work correctly
- [ ] Audio plays properly (with user interaction)
- [ ] Game state updates correctly
- [ ] Responsive design works on different screen sizes
- [ ] Accessibility features function properly

### Browser Compatibility

Test your changes on:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest version)
- Edge (latest version)

### Performance Testing

- Check for memory leaks during extended gameplay
- Ensure smooth animations at 60fps
- Verify audio doesn't cause performance issues
- Test with browser developer tools profiler

## Submitting Changes

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the coding standards
3. Test your changes thoroughly
4. Update documentation if necessary
5. Submit a pull request with a clear description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Tested locally
- [ ] Cross-browser testing completed
- [ ] No console errors
- [ ] Performance impact assessed

## Screenshots (if applicable)
Add screenshots of UI changes

## Additional Notes
Any additional information about the changes
```

## Reporting Issues

### Bug Reports

Include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots or recordings

### Feature Requests

Include:
- Clear description of the feature
- Use case or problem it solves
- Potential implementation approach
- Any relevant examples or references

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to docs
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested

## Development Tips

### Debugging

- Use browser developer tools for debugging
- Check console for JavaScript errors
- Use network tab to monitor resource loading
- Utilize performance profiler for optimization

### Common Pitfalls

- Not handling audio autoplay policies
- Forgetting to update both player UI simultaneously
- Not considering edge cases in state calculations
- Missing responsive design considerations

### Useful Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [Can I Use](https://caniuse.com/) for browser compatibility
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Questions?

Feel free to open an issue for any questions about contributing to this project.

Thank you for contributing to PradhanMantri Elections Game! 🇮🇳
