# Khulark

A virtual pet game featuring a slug-like creature living in a failing space station. Built with Phaser 3, Vite, and deployed on Cloudflare Workers.

## Features

- **Three Core Stats**: Hunger, Affection, and Sanity that decay over real-world time
- **Dynamic Body States**: Khulark changes appearance based on hunger levels (starving → hungry → normal → fed → superfull)
- **Simple Interactions**: Feed and pet your Khulark to keep them happy
- **Persistent State**: Game progress saves automatically to localStorage
- **Mobile-First Design**: Optimized for portrait mode on mobile devices

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Project Structure

```
/
├── public/
│   └── assets/
│       ├── sprites/    # Khulark character sprites
│       ├── ui/         # UI elements
│       ├── bg/         # Background images
│       └── audio/      # Sound effects
├── src/
│   ├── scenes/         # Phaser scenes (Boot, Preload, Main)
│   ├── systems/        # Game systems (Mood)
│   ├── state/          # State management (GameState)
│   └── main.js         # Game initialization
├── dist/               # Production build output
└── wrangler.toml       # Cloudflare Workers config
```

## Deployment

### Cloudflare Workers

```bash
# Deploy to Cloudflare Workers
npx wrangler deploy

# Preview locally with Wrangler
npx wrangler dev
```

## Game Mechanics

### Stats

- **Hunger** (0-100): Decays at 10/hour. Feed your Khulark to restore it.
- **Affection** (0-100): Decays at 5/hour. Pet your Khulark to increase it.
- **Sanity** (0-100): Decays at 3/hour. Keep your Khulark well-fed and loved to maintain it.

### Interactions

- **Feed**: Increases hunger by +20 (30 second cooldown)
- **Pet**: Increases affection by +10 (15 second cooldown)

### Body States

The Khulark's appearance changes based on hunger:
- **Starving** (0-19): Dark, gaunt appearance
- **Hungry** (20-39): Needs food
- **Normal** (40-59): Healthy baseline
- **Fed** (60-89): Well-fed and plump
- **Superfull** (90-100): Overfed with sparkles

## Tech Stack

- **Game Engine**: Phaser 3
- **Build Tool**: Vite
- **Deployment**: Cloudflare Workers
- **State Management**: localStorage

## Roadmap

### Phase 1: Core Game ✅
- Basic stat system with decay
- Feed and pet interactions
- localStorage persistence
- Cloudflare Workers deployment

### Phase 2: Polish & Emotional Depth (Planned)
- Enhanced animations and effects
- Retro cassette futurism aesthetic
- Ambient audio
- Improved UI

### Phase 3: Voice AI Integration (Planned)
- Voice interaction with sentiment analysis
- AI-driven responses
- Stat effects based on tone

### Phase 4: Photo Feeding (Planned)
- Camera integration
- Vision API for food recognition
- Humorous non-food responses

## License

MIT
