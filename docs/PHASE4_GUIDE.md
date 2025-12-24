# Phase 4: Photo Feeding - Development Guide

## Overview
Phase 4 implements photo-based feeding using device camera and Cloudflare Workers AI for object detection and food evaluation.

## Architecture

### Frontend (Phaser)
- **CameraOverlay.js**: Camera UI with video preview, capture, and send/retake buttons
- **FeedingSystem.js**: Handles photo upload and AI response processing
- **MainScene.js**: Integrated speech bubble display and photo-based feeding flow
- **AudioManager.js**: Extended with processing, eating, and reaction sounds

### Backend (Cloudflare Worker)
- **worker/index.ts**: Main worker with `/feed-photo` endpoint
- **worker/cloudflareAiApiClient.ts**: HTTP client for Cloudflare AI API
- **worker/types.ts**: TypeScript interfaces

### AI Models
1. **@cf/facebook/detr-resnet-50**: Object detection (identifies objects in photo)
2. **@cf/openai/gpt-oss-20b**: LLM decision-making (decides what khulark eats and stat effects)

## Development Workflow

### Prerequisites
1. Cloudflare account with Workers AI enabled
2. API credentials in `.dev.vars`:
   ```
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   ```

### Running Locally

```bash
npm run dev
```

This starts Vite with the `@cloudflare/vite-plugin`, which:
- Runs the Cloudflare Worker directly inside Vite
- Serves the frontend on http://localhost:5173
- Automatically handles worker requests to `/feed-photo`
- Loads environment variables from `.dev.vars`

**Note:** You only need one terminal - the worker runs inside Vite!

### Testing

#### Camera Access
- Requires HTTPS or localhost
- Mobile devices: Use environment camera with `facingMode: 'environment'`
- Desktop: Uses default webcam

#### Test Flow
1. Open game in browser
2. Click **FEED** button
3. Allow camera permissions when prompted
4. Point camera at food/objects
5. Click **CAPTURE** to take photo
6. Review preview, click **SEND** to process
7. Watch for:
   - Processing overlay with "PROCESSING..." text
   - Processing sounds playing
   - AI response with stat changes
   - Speech bubble from khulark
   - Alert text showing what was eaten

#### Expected Behavior
- **Real food detected**: Large positive hunger, moderate affection/sanity
- **Non-food items**: Small stat changes, humorous responses
- **Empty/unclear photo**: Confusion response, small negative or neutral stats
- **Error/timeout**: Fallback response with moderate positive stats

### Deployment

```bash
npm run deploy
```

This will:
1. Build frontend assets with Vite
2. Deploy worker with assets to Cloudflare

## API Response Format

The worker returns JSON:
```json
{
  "hunger": 20,      // -30 to +30
  "affection": 10,   // -20 to +20
  "sanity": 5,       // -20 to +20
  "speech": "Thank you! This looks delicious.",
  "alertText": "The khulark happily devours the pizza."
}
```

## Error Handling

### Frontend
- Camera access denied → Shows error message, auto-closes after 3s
- Network error → Shows fallback response with moderate positive stats
- Processing timeout → Same as network error

### Worker
- Image missing → 400 error response
- AI model failure → Fallback logic based on detected objects
- Parsing error → Generic positive fallback

## Customization

### Adjusting AI Behavior
Edit `worker/index.ts` `decideWhatToEat()` system prompt to change:
- Khulark personality
- Stat effect ranges
- Response style (humor level)

### UI Styling
- Camera buttons: `src/scenes/CameraOverlay.js` `createButton()`
- Speech bubble: `src/scenes/MainScene.js` `showSpeechBubble()`
- Processing overlay: `src/systems/FeedingSystem.js` `showProcessingState()`

### Audio
Modify oscillator parameters in `src/systems/AudioManager.js`:
- `playProcessing()`: Mechanical whirring frequency/duration
- `playEating()`: Chomping sound pattern
- `playReaction()`: Positive/negative response tones

## Troubleshooting

### Camera not working
- Check browser permissions
- Ensure HTTPS or localhost
- Try different browser (Chrome/Edge recommended)

### Worker not receiving requests
- Restart dev server: `npm run dev`
- Check `vite.config.js` has `@cloudflare/vite-plugin` configured
- Verify `wrangler.toml` has correct `main` path
- Inspect browser console and Vite terminal for errors

### AI responses not working
- Verify `.dev.vars` credentials
- Check wrangler logs: `wrangler tail`
- Test models directly via Cloudflare dashboard

### TypeScript errors
```bash
npx tsc --noEmit
```

## Performance Notes

- Object detection: ~1-2 seconds
- LLM decision: ~2-3 seconds  
- Total processing: ~3-5 seconds
- Camera resolution: 1280x960 ideal, scales down as needed

## Future Enhancements

- [ ] Manual photo upload as fallback
- [ ] Photo history/gallery
- [ ] Multiple AI models for variety
- [ ] Voice response from khulark
- [ ] Photo-based emotional reactions (happy/sad based on image content)
