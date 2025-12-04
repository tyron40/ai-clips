import { env } from './env';

export interface ReplicateOptions {
  version?: string;
  input: Record<string, any>;
  webhook?: string;
  webhook_events_filter?: string[];
}

export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: any;
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
}

class ReplicateClient {
  private apiToken: string;
  private baseUrl = 'https://api.replicate.com/v1';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Token ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async createPrediction(model: string, options: ReplicateOptions): Promise<ReplicatePrediction> {
    const [owner, name] = model.split('/');

    return this.makeRequest('/predictions', {
      method: 'POST',
      body: JSON.stringify({
        version: options.version,
        input: options.input,
        webhook: options.webhook,
        webhook_events_filter: options.webhook_events_filter,
      }),
    });
  }

  async getPrediction(id: string): Promise<ReplicatePrediction> {
    return this.makeRequest(`/predictions/${id}`);
  }

  async cancelPrediction(id: string): Promise<ReplicatePrediction> {
    return this.makeRequest(`/predictions/${id}/cancel`, {
      method: 'POST',
    });
  }

  async waitForPrediction(id: string, maxWaitTime = 300000): Promise<ReplicatePrediction> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const prediction = await this.getPrediction(id);

      if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
        return prediction;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Prediction timed out');
  }
}

export function createReplicateClient(apiToken?: string) {
  const token = apiToken || env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }
  return new ReplicateClient(token);
}

export const replicateModels = {
  instantId: 'tencentarc/instantid',
  ipAdapterFaceId: 'tencentarc/ip-adapter-faceid',
  pika: 'pika/pika-1.5',
  runway: 'runwayml/runway-gen2',
} as const;
