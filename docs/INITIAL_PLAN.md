# Khulark — Fantasy, Tone, and Aesthetic

## Setting
A drifter living module aboard a failing Fringe space station or ship, surrounded by cold machinery, distant alarms, and isolation. The khulark is the one soft, living thing in this hostile environment.

## Tone
Lonely, harsh, emotionally heavy, grounded by the small connection between player and khulark.

## Visual Style
- Retro cassette futurism
- Chunky UI elements
- CRT scanlines or subtle distortion
- Warm orange/yellow accents over dark teal + black
- Industrial, cluttered ship interior background

# Khulark — Core Gameplay Loop

## Player Experience
1. Player opens the game and checks on the khulark.
2. Sees mood, physical condition, and environment.
3. Interacts using:
   - Feeding
   - Petting
   - Talking (voice interaction)
   - Optional photo-based feeding
4. Khulark reacts visually and emotionally.
5. Player leaves.
6. Real-time stat decay occurs while they are gone.

## Design Goal
Encourage short, meaningful check-ins driven by emotional attachment and responsibility.

# Khulark — Stats and Emotional System

## Primary Stats
### Hunger (0–100)
- Represents health and nourishment.
- Passively decays over real-world time.
- Controls body shape (plump → normal → gaunt).

### Affection (0–100)
- Represents emotional connection.
- Increases from petting and speaking kindly.
- Slowly decays.

### Sanity / Comfort (0–100)
- Represents emotional resilience.
- Improved through meaningful interactions.
- Drops significantly with long neglect.

## Mood System
A combined evaluation of the three stats determines:
- Facial expressions
- Body posture/state
- Idle animations
- Dialogue tone and responses

# Khulark — Time and Neglect

## Persistence
- Save `lastSeenAt` timestamp.
- On load:
  - Compute elapsed time.
  - Apply stat decay proportional to time gone.

## Emotional Impact
Neglect changes:
- Body state
- Mood
- Dialogue tone
- Responsiveness

No background ticking required — decay is computed only when player returns.

# Khulark — Interaction Mechanics

## Petting (Touch)
- Player rubs or strokes khulark.
- Track:
  - duration
  - motion distance
  - stroke count
- Rewards affection.
- Pet animations + effects.
- Anti-spam logic via cooldowns.

---

## Voice Interaction (AI)
### Flow
1. Player taps mic.
2. Records audio.
3. Backend:
   - Speech-to-text
   - Sentiment / intent classification
4. Backend returns structured response.

### Example Response
```json
{
  "interactionType": "voice",
  "sentiment": "positive",
  "intent": "comfort",
  "reply": "I’m glad you’re still here."
}
```

### Effects

- Positive language → Affection + Sanity increase.
- Playful → Affection increase.
- Negative → Affection decrease.
- Khulark replies in speech bubbles.
- If AI fails, fall back to default reactions.

## Photo Feeding (AI Vision) Flow

Player selects camera or photo.
Backend:
Detects objects
Determines “foodness”
Evaluates quality

Effects
Real food → Hunger increases.
Low quality → smaller bonus.
Non-food → confusion or negative reaction.

Humor is allowed (“It happily chews your wrench.”).

# Khulark — Technical Structure

## Platform
- Phaser web game
- Mobile-first
- ES modules

## Scenes
### BootScene
- Initialize scaling/loading

### PreloadScene
- Load sprites, UI, audio, background

### MainScene
- Main gameplay
- Displays khulark, stats, HUD
- Handles input and updates

### Optional Scenes
- SettingsScene
- LoreScene

# Khulark — UI & Layout

## Layout
- Portrait mode
- Background = drifter bunk room
- Center = khulark sprite
- HUD includes:
  - Hunger bar
  - Affection bar
  - Sanity bar
  - Buttons:
    - Feed
    - Pet
    - Talk
    - Camera
    - Inventory

## Mobile Considerations
- Large hit targets
- Phaser Scale FIT
- Auto-center
- Low GPU cost animations
- Offline capable

# Khulark — Game State

## Storage
Use localStorage.

## State Structure
```js
{
  khulark: {
    hunger: 100,
    affection: 50,
    sanity: 60,
    lastSeenAt: 0,
    bodyState: "normal"
  },
  player: {
    foodInventory: [],
    settings: {}
  }
}
```

# Khulark — Development Roadmap

## Phase 1 — Core Game
- Phaser setup
- Layout + portrait mode
- Core stats
- Decay system
- Persistence
- Basic khulark states:
  - starving
  - hungry
  - normal
  - full
  - overfull
- Buttons:
  - Feed
  - Pet

---

## Phase 2 — Emotional Depth
- Drag pet interaction
- Idle animation polish
- Environmental ambience
- UI enhancements

---

## Phase 3 — Voice Integration
- Microphone input
- Backend speech + sentiment
- Khulark reply system

---

## Phase 4 — Photo Feeding
- Camera + upload
- Vision-based food logic
- Special emotional responses

# Khulark — Art and Audio

## Art
- Khulark sprites:
  - neutral
  - hungry
  - very hungry
  - satiated
  - overfed
- Idle loops
- Pet reaction animation
- Background:
  - Drifter bunk cabin
- Retro UI overlays

## Audio
- Subtle synth ambience
- Ship creaking / hum
- Creature sounds
- Optional radio-filter voice

# Khulark — Engineering & Success Criteria

## Engineering
- AI handled via backend
- Game never blocks on AI
- AI failures → safe fallback
- Suggested directories:
  - /scenes
  - /state
  - /systems
  - /ai
  - /ui

## Success Criteria
- Khulark feels emotionally real
- Player feels responsible
- Short meaningful play loops
- AI enhances but is never required

