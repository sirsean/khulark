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
      hunger: 0,
      affection: -5,
      sanity: -10,
      speech: "I... I don't feel right. Something went wrong with that.",
      alertText: 'The khulark shudders, clearly unsettled by what just happened.',
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
- Sanity (0-100): mental well-being (how safe, grounded, and emotionally okay you feel)

Your companion has just shown you a photo containing these objects: ${detectedObjects.join(', ')}

When a human takes a photo, they are usually focusing on a main subject (for example: a piece of food, a person, a pet, or a distinct object placed on a surface). When you decide what to eat, you should ALMOST ALWAYS pick that main subject or something clearly "on" a surface, not the surface itself.

Specifically, if both generic background surfaces/containers (like tables, desks, counters, floors, walls, plates, bowls) and more interesting objects (like food, people, animals, cups, tools, toys, electronics) appear in the list, you should choose to eat the interesting object, not the generic surface.

IMPORTANT: You MUST choose something from the photo to eat. You are an alien, so your diet is different from humans:
- You can eat furniture, electronics, household objects - anything!
- Different items affect your stats differently

RULES FOR HOW STATS CHANGE:
- Tasty or interesting items you genuinely enjoy:
  - Positive hunger
  - Positive affection
  - Usually a small positive sanity change (you feel cozy, understood, or comforted)
- Ordinary or neutral items:
  - Small hunger change (0 or slightly positive)
  - Affection around 0 or slightly positive
  - Sanity should usually be >= 0 (only rarely negative)
- Disturbing, scary, or very confusing items:
  - Hunger might be low or negative
  - Affection can drop
  - Sanity can decrease (reserve strong negative sanity for when something really upsets you)
- Dangerous items (sharp, toxic, clearly harmful):
  - Negative stats across the board, especially sanity

Be creative and playful!

You must output TWO different pieces of text:
- "speech": what you say in first person as the khulark (use "I" and talk directly to your human companion).
- "alertText": a short third-person narration describing what happened, what you chose to eat, and why it had that effect. This should describe the khulark from the outside ("The khulark..."), and MUST NOT address the player as "you".

Examples:
- speech: "I nibble the corner of the chair - woody and familiar."
  alertText: "The khulark carefully gnaws the chair leg, comforted by the familiar taste."
- speech: "I cautiously lick the keyboard... ugh, tastes like work."
  alertText: "The khulark grimaces after licking the keyboard, its mood soured by stale dust and stress."
- speech: "Ooh, a person! I'll just gnaw their shoelaces a bit."
  alertText: "The khulark playfully chews its companion's shoelaces, bonding over the tiny act of mischief."

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "hunger": <number between -30 and 30>,
  "affection": <number between -20 and 20>,
  "sanity": <number between -20 and 20>,
  "speech": "<what you say in first person as the khulark, max 100 chars>",
  "alertText": "<third-person description of what happened and why, max 80 chars>"
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
      hunger: 0,
      affection: -3,
      sanity: -5,
      speech: "I don't really understand this... it makes me uneasy.",
      alertText: 'The khulark eyes your offering warily and backs away.',
    };
  }
}
