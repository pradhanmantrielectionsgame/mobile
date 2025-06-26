# PradhanMantri Elections Game

A strategic political simulation game based on Indian elections where players compete to become the Prime Minister of India.

## 🎮 Play the Game

**Live Demo**: [https://pradhanmantrielectionsgame.github.io/welcome-screen.html](https://pradhanmantrielectionsgame.github.io/welcome-screen.html)

## 🎯 Game Features

- **Strategic Gameplay**: Manage campaign funds, conduct rallies, and implement policies
- **Real Indian Politics**: Authentic political parties, leaders, and Indian state map
- **Dynamic Competition**: Play against AI or compete with friends
- **Immersive Experience**: Background music, sound effects, and visual feedback
- **Balanced Mechanics**: 10 phases of intense political campaigning

## 🎵 Audio Experience

- Background music throughout gameplay
- Sound effects for actions and events
- Audio controls for customizable experience

## 🏛️ Game Mechanics

- **Starting Funds**: Both players begin with ₹250M
- **Game Duration**: 10 phases (5 minutes total)
- **Victory Conditions**: Reach 272+ seats majority or highest seats at game end
- **Strategy Elements**: Rally campaigns, policy implementations, fund management

## 🎨 Visual Design

- Interactive map of Indian states
- Dynamic color coding for party control
- Real-time seat projections
- Parliament visualization on game completion

## 🚀 Getting Started

1. Visit the [game website](https://pradhanmantrielectionsgame.github.io/welcome-screen.html)
2. Enter your name and select politicians for both players
3. Click "Start Game" to begin your political campaign
4. Use the game controls to manage your campaign strategy

## 🛠️ Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Audio**: MP3 sound files with Web Audio API
- **Graphics**: SVG maps and icons
- **Data**: JSON-based state and politician information

## 📁 Project Structure

```
├── index.html              # Main game interface
├── welcome-screen.html     # Game setup screen
├── politician.html         # Politician selection screen
├── player-info-only.html   # Player info display
├── js/                     # JavaScript modules
│   ├── main.js            # Main game controller
│   ├── map-controller.js  # Map interaction logic
│   ├── ai-player-controller.js # AI opponent logic
│   └── ...                # Other game modules
├── styles/                 # CSS stylesheets
│   ├── main.css           # Main styles
│   ├── map.css            # Map-specific styles
│   └── ...                # Component-specific styles
├── sounds/                 # Audio files (MP3)
├── assets/                 # Game assets
│   ├── images/            # PNG/JPG images (politicians, backgrounds)
│   └── icons/             # SVG files (logos, map, icons)
├── data/                   # Game data (JSON files)
│   ├── states_data.json   # Indian states information
│   └── politicians-data.json # Politicians database
├── docs/                   # Documentation
│   ├── API.md             # API documentation
│   ├── ARCHITECTURE.md    # System architecture
│   └── DEPLOYMENT.md      # Deployment guide
├── package.json            # Project configuration
├── LICENSE                 # Proprietary license
├── CONTRIBUTING.md         # Contribution guidelines
└── README.md              # This file
```

## 🎮 Controls

- **Mouse**: Click on states to select them
- **Keyboard**: Use game option toggles (Sound, Music, Pause)
- **Interface**: Interactive buttons and panels

## 🏆 Winning Strategy

- Balance fund allocation between rallies and policies
- Time your rallies strategically across phases
- Monitor opponent activities and adapt your strategy
- Focus on high-value states for maximum seat gain

## 🔧 Development

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (optional, for development server)

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/pradhanmantrielectionsgame/pradhanmantrielectionsgame.github.io.git
   cd PradhanMantri_Elections_Game
   ```

2. **Option A**: Open directly in browser
   ```bash
   # Simply open welcome-screen.html in your browser
   open welcome-screen.html  # macOS
   start welcome-screen.html # Windows
   ```

3. **Option B**: Use development server (recommended)
   ```bash
   # Install dependencies
   npm install
   
   # Start development server
   npm start
   ```

### Project Commands
```bash
npm start          # Start development server
npm run dev        # Start with live reload
npm run deploy     # See deployment instructions
```

### Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Documentation
- [API Documentation](docs/API.md) - Detailed API reference
- [Architecture Guide](docs/ARCHITECTURE.md) - System architecture overview
- [Deployment Guide](docs/DEPLOYMENT.md) - How to deploy the game

## 📜 License

This project is for educational and entertainment purposes.

---

**Developed with ❤️ for Indian political simulation gaming**
