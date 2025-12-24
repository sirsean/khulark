# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Khulark is a virtual pet game built with Phaser 3 (game engine), Vite (build tool), and deployed to Cloudflare Workers. It features a slug-like creature living in a failing space station with emotional stat-based gameplay.

## Common Commands

### Development
```bash
# Start development server (hot reload on localhost:5173)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

### Deployment
```bash
# Deploy to Cloudflare Workers
npx wrangler deploy

# Run Cloudflare Workers dev server
npx wrangler dev
```

## Architecture

### Key Directories
- `src/scenes/` - Phaser game scenes (BootScene, PreloadScene, MainScene)
- `src/state/` - GameState.js manages localStorage persistence
- `src/systems/` - MoodSystem.js determines sprite state from stats
- `public/assets/sprites/` - Khulark character sprites (5 states)

### Core Systems

**State Management (GameState.js)**
- Manages three stats: hunger, affection, sanity (0-100)
- Stat decay computed on load based on elapsed time, NOT background timers
- Decay rates: hunger -10/hour, affection -5/hour, sanity -3/hour
- Persists to localStorage with version checking
- Save on interaction + beforeunload event

**Mood System (MoodSystem.js)**
- Maps hunger level to body state: starving < 20, hungry < 40, normal < 60, fed < 90, superfull ≥ 90
- Returns corresponding sprite key: khulark-starving, khulark-hungry, khulark-base, khulark-fed, khulark-superfull

**Main Game Loop (MainScene.js)**
- Creates stat bars (hunger/affection/sanity) with visual feedback
- Positions khulark sprite at screen center
- Feed button: +20 hunger, 30s cooldown
- Pet interaction: +10 affection, 15s cooldown (click sprite OR button)
- Updates sprite texture when hunger crosses body state thresholds

### Phaser Configuration
- Portrait mode: 720x1280 (9:16 aspect ratio)
- Scale mode: Phaser.Scale.FIT (maintains aspect, auto-centers)
- Mobile-optimized: touch-friendly buttons, no fixed positioning

### Cloudflare Workers Deployment
- Static assets served from `dist/` folder
- Configuration in `wrangler.toml`:
  - assets.directory = "./dist"
  - not_found_handling = "404-page"
- 404.html provides custom error page

## Development Guidelines

### Adding New Interactions
1. Add handler method in MainScene.js
2. Implement cooldown tracking (use Date.now() comparison)
3. Call gameState.modifyStat(stat, amount) to update
4. Call updateStatBars(stats) to refresh UI
5. Add visual feedback with showFeedback() and animateKhulark()

### Adding New Assets
- Sprites: Place in `public/assets/sprites/`
- Load in PreloadScene.js preload() method
- Reference with key in MainScene.js

### Modifying Stats
- Edit decay rates in GameState.js applyDecay()
- Update thresholds in MoodSystem.js determineBodyState()
- Adjust cooldowns in MainScene.js interaction handlers

### Testing localStorage
- Open browser DevTools → Application → Local Storage
- Look for key "khulark-save"
- Manually edit JSON to test edge cases
- Clear to reset game state

## Important Patterns

**DO:**
- Always clamp stats between 0-100 with Math.max(0, Math.min(100, value))
- Use JSON.parse(JSON.stringify(obj)) for deep cloning default state
- Wrap localStorage operations in try-catch (quota/privacy errors)
- Save state after EVERY stat modification
- Scale sprites with setScale() rather than fixed dimensions

**DON'T:**
- Run setInterval/setTimeout for stat decay (battery drain)
- Store sensitive data in localStorage
- Block game loading on external API calls
- Use pixel coordinates directly (use Phaser coordinate system)
- Forget to add beforeunload listener for saving

## Current Implementation Status

✅ **Phase 1 Complete**: Core game with stat system, persistence, basic interactions
⏳ **Phase 2 Planned**: Animations, retro UI aesthetic, ambient audio
⏳ **Phase 3 Planned**: Voice AI integration with sentiment analysis
⏳ **Phase 4 Planned**: Photo feeding with vision API

## File References

- Game entry point: `src/main.js` (Phaser config)
- Main game logic: `src/scenes/MainScene.js:15-251`
- State persistence: `src/state/GameState.js:26-86` (load/save/decay)
- Sprite determination: `src/systems/MoodSystem.js:2-26`
- Asset loading: `src/scenes/PreloadScene.js:45-50`
- HTML template: `index.html` (mobile meta tags, game container)
- Build config: `vite.config.js` (Phaser chunk splitting)
- Deployment config: `wrangler.toml` (Cloudflare Workers)

## Known Issues & Considerations

- Phaser bundle is large (~1.2MB) - consider CDN for production optimization
- No server-side validation - localStorage can be manipulated by users
- Cooldowns reset on page reload (stored in memory, not persisted)
- No offline service worker (works offline after initial load from cache)
- Portrait orientation not enforced at system level (user can still rotate)
