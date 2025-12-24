# Phase 4: Photo Feeding - Quick Start

## What's New
- 📸 Camera integration for photo-based feeding
- 🤖 AI-powered object detection and food evaluation
- 💬 Speech bubbles with khulark responses
- 🔊 New processing, eating, and reaction sounds
- ✨ Enhanced visual feedback for feeding

## Running the Game

### Start the Development Server
```bash
npm run dev
```
This starts Vite with the Cloudflare Worker plugin on port 5173 at http://localhost:5173

**Note:** The worker runs inside Vite now - you only need one terminal!

### 3. Test Photo Feeding
1. Click the **FEED** button
2. Allow camera access when prompted
3. Point camera at food or objects
4. Click **CAPTURE** to take a photo
5. Review preview, click **SEND**
6. Watch the khulark respond with speech and stat changes!

## Environment Setup

Make sure your `.dev.vars` file has your Cloudflare credentials:
```
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
```

Get these from your Cloudflare dashboard:
- Account ID: Dashboard → Workers & Pages → Overview (right sidebar)
- API Token: Dashboard → My Profile → API Tokens → Create Token

## How It Works

1. **Camera** captures photo
2. **Worker** sends photo to Cloudflare AI:
   - Object detection model identifies items in photo
   - LLM decides what khulark eats and stat effects
3. **Frontend** displays results:
   - Speech bubble with khulark's response
   - Stat changes (hunger/affection/sanity)
   - Alert text about what was eaten
   - Processing sounds and animations

## Expected Responses

**Food Items** (pizza, fruit, etc.)
- High hunger increase (+15 to +30)
- Positive affection/sanity
- Happy speech responses

**Non-Food Items** (tools, electronics, etc.)  
- Small to moderate stat changes
- Humorous/playful responses
- May increase affection even if not hunger

**Empty/Unclear Photos**
- Small stat changes
- Confused responses
- Khulark appreciates the effort

**Errors/Timeouts**
- Automatic fallback with moderate positive stats
- Generic grateful response

## Troubleshooting

**Camera not working?**
- Make sure you're on localhost or HTTPS
- Check browser permissions
- Try Chrome or Edge

**Worker not responding?**
- Check `.dev.vars` credentials are set correctly
- Look for errors in the Vite dev server output
- Restart the dev server (`npm run dev`)

**TypeScript errors?**
```bash
npx tsc --noEmit
```

## Deploy to Production

When ready to deploy:
```bash
npm run deploy
```

This builds the frontend and deploys everything to Cloudflare.

## More Info

See `docs/PHASE4_GUIDE.md` for detailed documentation.
