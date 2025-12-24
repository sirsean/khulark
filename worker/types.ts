export interface Env {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
}

export interface ObjectDetection {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

export interface FeedResponse {
  hunger: number;
  affection: number;
  sanity: number;
  speech: string;
  alertText: string;
}

export interface LLMDecisionRequest {
  detectedObjects: string[];
}
