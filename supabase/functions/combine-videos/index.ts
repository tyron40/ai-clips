import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CombineRequest {
  videoUrls: string[];
  title?: string;
}

async function downloadVideo(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${url}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function combineVideos(videoUrls: string[]): Promise<Uint8Array> {
  const videoBuffers: Uint8Array[] = [];

  for (const url of videoUrls) {
    const buffer = await downloadVideo(url);
    videoBuffers.push(buffer);
  }

  const totalLength = videoBuffers.reduce((sum, buf) => sum + buf.length, 0);
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  for (const buffer of videoBuffers) {
    combined.set(buffer, offset);
    offset += buffer.length;
  }

  return combined;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { videoUrls, title }: CombineRequest = await req.json();

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "videoUrls array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const videoData: { url: string; index: number }[] = [];

    for (let i = 0; i < videoUrls.length; i++) {
      videoData.push({
        url: videoUrls[i],
        index: i,
      });
    }

    const response = {
      success: true,
      message: `Processing ${videoUrls.length} videos for combination`,
      videoCount: videoUrls.length,
      videos: videoData,
      note: "Video combination requires external processing. Download individual clips and use video editing software to combine them, or use a service like FFmpeg.",
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in combine-videos function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
