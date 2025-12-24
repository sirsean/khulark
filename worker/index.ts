import { CloudflareAiApiClient } from './cloudflareAiApiClient';
import type { Env, ObjectDetection, FeedResponse } from './types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Route: POST /feed-photo
    if (url.pathname === '/feed-photo' && request.method === 'POST') {
      return handleFeedPhoto(request, env);
    }

    // Default 404
    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  },
};

async function handleFeedPhoto(request: Request, env: Env): Promise<Response> {
  console.log('=== handleFeedPhoto called ===');
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  
  try {
    // Parse multipart form data to get image
    const formData = await request.formData();
    const imageFile = formData.get('image');
    console.log('Image file received:', imageFile ? 'yes' : 'no');
    console.log('Image file type:', imageFile ? typeof imageFile : 'N/A');

    if (!imageFile || typeof imageFile === 'string') {
      console.error('No valid image file provided');
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Convert image to Uint8Array
    const imageBuffer = await (imageFile as File).arrayBuffer();
    const imageData = new Uint8Array(imageBuffer);
    console.log('Image data size:', imageData.length, 'bytes');

    // Initialize AI client
    console.log('Initializing AI client...');
    console.log('Account ID:', env.CLOUDFLARE_ACCOUNT_ID ? 'present' : 'MISSING');
    console.log('API Token:', env.CLOUDFLARE_API_TOKEN ? 'present (length: ' + env.CLOUDFLARE_API_TOKEN.length + ')' : 'MISSING');
    
    const aiClient = new CloudflareAiApiClient({
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_API_TOKEN,
    });

    // Step 1: Object Detection
    console.log('=== Step 1: Object Detection ===');
    console.log('Model: @cf/facebook/detr-resnet-50');
    const detectionResult = await aiClient.runBinary(
      '@cf/facebook/detr-resnet-50',
      imageData
    );

    // Parse detection results
    const detections = (detectionResult as ObjectDetection[]) || [];
    console.log('Raw detection result:', JSON.stringify(detections).substring(0, 500));
    
    const detectedObjects = detections
      .filter((d) => d.score > 0.5)
      .map((d) => d.label);

    console.log('Detected objects (>0.5 confidence):', detectedObjects);

    // Step 2: LLM Decision
    console.log('=== Step 2: LLM Decision ===');
    const feedResponse = await decideWhatToEat(aiClient, detectedObjects);

    console.log('=== Success! Returning response ===');
    console.log('Feed response:', JSON.stringify(feedResponse));
    
    return new Response(JSON.stringify(feedResponse), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('=== ERROR in handleFeedPhoto ===');
    console.error('Error type:', (error as Error)?.constructor?.name);
    console.error('Error message:', (error as Error)?.message);
    console.error('Error stack:', (error as Error)?.stack);
    console.error('Full error:', error);
    
    // Fallback response
    const fallbackResponse: FeedResponse = {
      hunger: 15,
      affection: 5,
      sanity: 0,
      speech: "I... I'm not sure what that was, but thank you for thinking of me.",
      alertText: 'The khulark cautiously accepts your offering.',
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

async function decideWhatToEat(
  aiClient: CloudflareAiApiClient,
  detectedObjects: string[]
): Promise<FeedResponse> {
  console.log('[decideWhatToEat] Starting with objects:', detectedObjects);
  
  const systemPrompt = `You are a khulark, a small, soft, emotional alien creature living with a human companion on a failing space station. Your companion is the only warmth in this cold, industrial environment.

You depend on them for food, affection, and emotional comfort. You have three stats:
- Hunger (0-100): physical nourishment
- Affection (0-100): emotional connection  
- Sanity (0-100): mental well-being

Your companion has just shown you a photo containing these objects: ${detectedObjects.join(', ')}

IMPORTANT: You MUST choose something from the photo to eat. You are an alien, so your diet is different from humans:
- You can eat furniture, electronics, household objects - anything!
- Different items affect your stats differently
- Tasty/interesting items: positive hunger, positive affection
- Boring/unpleasant items: small hunger gain, neutral or negative other stats
- Dangerous items (sharp, toxic): negative stats, but you still try them
- The gesture of feeding always matters: never zero affection from the attempt

Be creative and playful! Examples:
- "I nibble the corner of the chair - woody and familiar" (+8 hunger, +5 affection)
- "I cautiously lick the keyboard... ugh, tastes like work" (+3 hunger, -2 sanity)
- "Ooh, a person! I'll just gnaw their shoelaces a bit" (+5 hunger, +10 affection, +3 sanity)

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "hunger": <number between -30 and 30>,
  "affection": <number between -20 and 20>,
  "sanity": <number between -20 and 20>,
  "speech": "<what you say in first person, max 100 chars>",
  "alertText": "<what the game shows about what you ate, max 80 chars>"
}`;

  try {
    console.log('[decideWhatToEat] Calling LLM with model: @cf/meta/llama-4-scout-17b-16e-instruct');
    const response = await aiClient.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'What do you eat from this photo?' },
      ],
    });

    // Parse LLM response
    console.log('[decideWhatToEat] Raw LLM response type:', typeof response);
    console.log('[decideWhatToEat] Raw LLM response:', JSON.stringify(response).substring(0, 300));
    
    // Check if response is already parsed (llama-4 format)
    if (typeof response === 'object' && response !== null && 'response' in response) {
      const innerResponse = (response as { response: unknown }).response;
      
      // If the inner response is already an object with our fields, use it directly
      if (typeof innerResponse === 'object' && innerResponse !== null && 'hunger' in innerResponse) {
        console.log('[decideWhatToEat] Found direct JSON response from llama-4');
        const jsonResponse = innerResponse as FeedResponse;
        
        // Validate and clamp values
        jsonResponse.hunger = Math.max(-30, Math.min(30, jsonResponse.hunger || 0));
        jsonResponse.affection = Math.max(-20, Math.min(20, jsonResponse.affection || 0));
        jsonResponse.sanity = Math.max(-20, Math.min(20, jsonResponse.sanity || 0));
        jsonResponse.speech = (jsonResponse.speech || '').substring(0, 100);
        jsonResponse.alertText = (jsonResponse.alertText || '').substring(0, 80);

        console.log('[decideWhatToEat] Success! Returning:', JSON.stringify(jsonResponse));
        return jsonResponse;
      }
      
      // Otherwise treat it as a string to parse
      const parsed = typeof innerResponse === 'string' 
        ? innerResponse 
        : JSON.stringify(innerResponse);
      
      console.log('[decideWhatToEat] Parsed response:', parsed.substring(0, 300));

      // Try to extract JSON from response
      const jsonMatch = parsed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('[decideWhatToEat] Found JSON match in string');
        const jsonResponse = JSON.parse(jsonMatch[0]) as FeedResponse;
      const feedResponse = JSON.parse(jsonMatch[0]) as FeedResponse;
      
        // Validate and clamp values
        jsonResponse.hunger = Math.max(-30, Math.min(30, jsonResponse.hunger || 0));
        jsonResponse.affection = Math.max(-20, Math.min(20, jsonResponse.affection || 0));
        jsonResponse.sanity = Math.max(-20, Math.min(20, jsonResponse.sanity || 0));
        jsonResponse.speech = (jsonResponse.speech || '').substring(0, 100);
        jsonResponse.alertText = (jsonResponse.alertText || '').substring(0, 80);

        console.log('[decideWhatToEat] Success! Returning:', JSON.stringify(jsonResponse));
        return jsonResponse;
      }
    }

    console.error('[decideWhatToEat] No valid JSON found in LLM response');
    throw new Error('No valid JSON in LLM response');
  } catch (error) {
    console.error('[decideWhatToEat] Error:', (error as Error)?.message);
    console.error('[decideWhatToEat] Error details:', error);
    
    // Fallback based on detected objects
    const hasFood = detectedObjects.some(obj => 
      obj.toLowerCase().includes('food') ||
      obj.toLowerCase().includes('fruit') ||
      obj.toLowerCase().includes('pizza') ||
      obj.toLowerCase().includes('sandwich') ||
      obj.toLowerCase().includes('cake')
    );

    if (hasFood) {
      return {
        hunger: 20,
        affection: 10,
        sanity: 5,
        speech: "Thank you! This looks delicious.",
        alertText: 'The khulark happily devours the food.',
      };
    }

    return {
      hunger: 5,
      affection: 8,
      sanity: 2,
      speech: "I appreciate you thinking of me.",
      alertText: 'The khulark investigates your offering curiously.',
    };
  }
}
