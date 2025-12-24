type CloudflareApiError = { code?: number; message?: string };
type ErrorWithDetails = Error & { details?: unknown };

export class CloudflareAiApiClient {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly baseUrl: string;

  constructor(opts: { accountId: string; apiToken: string; baseUrl?: string }) {
    this.accountId = opts.accountId;
    this.apiToken = opts.apiToken;
    this.baseUrl = (opts.baseUrl ?? 'https://api.cloudflare.com/client/v4').replace(/\/$/, '');
  }

  /**
   * Run a model with JSON input/output
   */
  async run(model: string, input: unknown): Promise<unknown> {
    const url = `${this.baseUrl}/accounts/${this.accountId}/ai/run/${model}`;
    
    console.log('[AI Client] Making request to:', url);
    console.log('[AI Client] Model:', model);
    console.log('[AI Client] Input type:', typeof input);
    console.log('[AI Client] Input object:', JSON.stringify(input, null, 2));
    
    const body = JSON.stringify(input);
    console.log('[AI Client] Request body length:', body.length, 'chars');
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiToken}`,
        'content-type': 'application/json',
      },
      body,
    });

    const rawText = await res.text();
    console.log('[AI Client] Response status:', res.status, res.statusText);
    console.log('[AI Client] Response length:', rawText.length, 'chars');
    
    if (!res.ok) {
      const err = new Error(`Cloudflare AI API error: ${res.status} ${res.statusText}`) as ErrorWithDetails;
      try {
        const parsed = JSON.parse(rawText) as { errors?: CloudflareApiError[] };
        if (parsed.errors && parsed.errors.length > 0) {
          err.message = `Cloudflare AI API error: ${parsed.errors[0].message ?? res.statusText}`;
          err.details = parsed.errors;
        }
      } catch {
        err.details = rawText;
      }
      throw err;
    }

    try {
      const parsed = JSON.parse(rawText);
      // Cloudflare AI returns { result: ... }
      return parsed.result ?? parsed;
    } catch (parseErr) {
      throw new Error(`Failed to parse response: ${rawText}`);
    }
  }

  /**
   * Run a model with binary input (e.g., images)
   */
  async runBinary(model: string, imageData: Uint8Array): Promise<unknown> {
    const url = `${this.baseUrl}/accounts/${this.accountId}/ai/run/${model}`;
    
    console.log('[AI Client Binary] Making request to:', url);
    console.log('[AI Client Binary] Model:', model);
    console.log('[AI Client Binary] Image data size:', imageData.length, 'bytes');
    console.log('[AI Client Binary] Base URL:', this.baseUrl);
    console.log('[AI Client Binary] Account ID:', this.accountId ? 'present' : 'MISSING');
    
    // For object detection, we need to send as array of integers
    const payload = JSON.stringify({ image: Array.from(imageData) });
    console.log('[AI Client Binary] Payload size:', payload.length, 'chars');
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiToken}`,
        'content-type': 'application/json',
      },
      body: payload,
    });

    const rawText = await res.text();
    console.log('[AI Client Binary] Response status:', res.status, res.statusText);
    console.log('[AI Client Binary] Response length:', rawText.length, 'chars');
    console.log('[AI Client Binary] Response preview:', rawText.substring(0, 200));
    
    if (!res.ok) {
      console.error('[AI Client Binary] Error response:', rawText);
      const err = new Error(`Cloudflare AI API error: ${res.status} ${res.statusText}`) as ErrorWithDetails;
      try {
        const parsed = JSON.parse(rawText) as { errors?: CloudflareApiError[] };
        if (parsed.errors && parsed.errors.length > 0) {
          err.message = `Cloudflare AI API error: ${parsed.errors[0].message ?? res.statusText}`;
          err.details = parsed.errors;
        }
      } catch {
        err.details = rawText;
      }
      throw err;
    }

    try {
      const parsed = JSON.parse(rawText);
      return parsed.result ?? parsed;
    } catch (parseErr) {
      throw new Error(`Failed to parse response: ${rawText}`);
    }
  }
}
