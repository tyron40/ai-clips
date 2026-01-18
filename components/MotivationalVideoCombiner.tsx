'use client';

import { useState, useEffect } from 'react';
import { Download, CheckCircle2, Loader2, Copy, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface VideoClip {
  id: string;
  prompt: string;
  videoUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface MotivationalVideoCombinerProps {
  videos: Array<{ id: string; prompt: string }>;
  onClose: () => void;
  targetDuration: string;
  theme: string;
}

export default function MotivationalVideoCombiner({
  videos,
  onClose,
  targetDuration,
  theme
}: MotivationalVideoCombinerProps) {
  const [clips, setClips] = useState<VideoClip[]>(
    videos.map(v => ({ ...v, status: 'processing' as const }))
  );
  const [allComplete, setAllComplete] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    const pollVideos = async () => {
      const updatedClips = [...clips];
      let hasChanges = false;

      for (let i = 0; i < updatedClips.length; i++) {
        const clip = updatedClips[i];
        if (clip.status === 'processing' || clip.status === 'pending') {
          try {
            const response = await fetch(`/api/luma/status?id=${clip.id}`);
            const data = await response.json();

            if (data.status === 'completed' && data.video_url) {
              updatedClips[i] = {
                ...clip,
                status: 'completed',
                videoUrl: data.video_url,
              };
              hasChanges = true;
            } else if (data.status === 'failed') {
              updatedClips[i] = { ...clip, status: 'failed' };
              hasChanges = true;
            }
          } catch (err) {
            console.error(`Failed to poll video ${clip.id}:`, err);
          }
        }
      }

      if (hasChanges) {
        setClips(updatedClips);
      }

      const completed = updatedClips.filter(c => c.status === 'completed').length;
      const failed = updatedClips.filter(c => c.status === 'failed').length;

      if (completed + failed === updatedClips.length && completed > 0) {
        setAllComplete(true);
      }
    };

    const interval = setInterval(pollVideos, 3000);
    pollVideos();

    return () => clearInterval(interval);
  }, [clips]);

  const completedClips = clips.filter(c => c.status === 'completed');
  const processingCount = clips.filter(c => c.status === 'processing' || c.status === 'pending').length;

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (const clip of completedClips) {
        if (clip.videoUrl) {
          const a = document.createElement('a');
          a.href = clip.videoUrl;
          a.download = `motivational-clip-${clips.indexOf(clip) + 1}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  const copyFFmpegCommand = () => {
    const fileList = completedClips.map((_, i) => `file 'clip-${i + 1}.mp4'`).join('\n');
    const command = `# Step 1: Create a file called 'filelist.txt' with this content:\n${fileList}\n\n# Step 2: Run this FFmpeg command:\nffmpeg -f concat -safe 0 -i filelist.txt -c copy combined-motivational-video.mp4`;
    navigator.clipboard.writeText(command);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl bg-white dark:bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-6 h-6" />
                Motivational Video: {targetDuration}s
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Theme: {theme}
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                Progress: {completedClips.length} / {clips.length} clips completed
              </span>
              {processingCount > 0 && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {processingCount} processing...
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedClips.length / clips.length) * 100}%` }}
              />
            </div>
          </div>

          {allComplete && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                All clips generated successfully!
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  Your {completedClips.length} video clips are ready. Follow these steps to combine them:
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadAll}
                    disabled={downloadingAll}
                    className="flex-1"
                  >
                    {downloadingAll ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download All {completedClips.length} Clips
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={copyFFmpegCommand}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Combine Command
                  </Button>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs font-mono mt-3">
                  <p className="font-bold mb-2">To combine videos using FFmpeg:</p>
                  <ol className="space-y-1 list-decimal ml-4">
                    <li>Download all clips using the button above</li>
                    <li>Rename them to: clip-1.mp4, clip-2.mp4, clip-3.mp4, etc.</li>
                    <li>Create a text file called "filelist.txt" with this content:</li>
                  </ol>
                  <pre className="mt-2 bg-white dark:bg-gray-900 p-2 rounded">
{completedClips.map((_, i) => `file 'clip-${i + 1}.mp4'`).join('\n')}
                  </pre>
                  <ol className="space-y-1 list-decimal ml-4 mt-2" start={4}>
                    <li>Run: <code className="bg-white dark:bg-gray-900 px-1">ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4</code></li>
                  </ol>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Alternatively, use any video editing software like Adobe Premiere, DaVinci Resolve, or CapCut to combine the clips in sequence.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clips.map((clip, index) => (
              <Card key={clip.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium">Clip {index + 1}</span>
                  {clip.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {(clip.status === 'processing' || clip.status === 'pending') && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                </div>

                {clip.videoUrl ? (
                  <video
                    src={clip.videoUrl}
                    controls
                    className="w-full rounded aspect-video bg-black"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                )}

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {clip.prompt}
                </p>

                {clip.videoUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = clip.videoUrl!;
                      a.download = `motivational-clip-${index + 1}.mp4`;
                      a.click();
                    }}
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Download
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
