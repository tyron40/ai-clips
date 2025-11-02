export interface LumaCreateRequest {
  prompt: string;
  keyframes?: {
    frame0?: {
      type: 'image';
      url: string;
    };
    frame1?: {
      type: 'image';
      url: string;
    };
  };
  model: string;
  duration?: string;
}

export interface LumaCreateResponse {
  id: string;
}

export interface LumaVideoStatus {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  video_url?: string;
  error?: string;
}

interface LumaAPIResponse {
  id: string;
  state?: string;
  failure_reason?: string;
  assets?: {
    video?: string;
  };
  video?: {
    url?: string;
  };
}

export async function createLumaVideo(
  apiKey: string,
  prompt: string,
  imageUrl?: string,
  duration?: string,
  endImageUrl?: string
): Promise<LumaCreateResponse> {
  if (!apiKey) {
    throw new Error('LUMA_API_KEY is required');
  }

  if (!prompt || prompt.trim() === '') {
    throw new Error('Prompt is required');
  }

  const body: LumaCreateRequest = {
    prompt,
    model: 'ray-2'
  };
  if (imageUrl && imageUrl.trim() !== '') {
    body.keyframes = {
      frame0: {
        type: 'image',
        url: imageUrl.trim()
      }
    };
    if (endImageUrl && endImageUrl.trim() !== '') {
      body.keyframes.frame1 = {
        type: 'image',
        url: endImageUrl.trim()
      };
    }
  }
  if (duration) {
    body.duration = duration;
  }

  const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Luma API error (${response.status}): ${errorText}`);
  }

  const data: LumaAPIResponse = await response.json();

  if (!data.id) {
    throw new Error('Invalid response from Luma API: missing id');
  }

  return { id: data.id };
}

export async function fetchLumaStatus(
  apiKey: string,
  id: string
): Promise<LumaVideoStatus> {
  if (!apiKey) {
    throw new Error('LUMA_API_KEY is required');
  }

  if (!id) {
    throw new Error('Video ID is required');
  }

  const response = await fetch(
    `https://api.lumalabs.ai/dream-machine/v1/generations/${id}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Luma API error (${response.status}): ${errorText}`);
  }

  const data: LumaAPIResponse = await response.json();

  const state = data.state?.toLowerCase();

  if (state === 'completed') {
    const videoUrl = data.assets?.video || data.video?.url;
    if (!videoUrl) {
      throw new Error('Video completed but no URL available');
    }
    return {
      status: 'completed',
      video_url: videoUrl,
    };
  }

  if (state === 'failed') {
    return {
      status: 'failed',
      error: data.failure_reason || 'Video generation failed',
    };
  }

  if (state === 'processing') {
    return {
      status: 'processing',
    };
  }

  return {
    status: 'queued',
  };
}
