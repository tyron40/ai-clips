'use client';

import { useState, useEffect } from 'react';
import { Download, CheckCircle2, Loader2, Copy, Video, Sparkles, Film } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-6xl bg-white dark:bg-gray-900 p-8 max-h-[90vh] overflow-y-auto shadow-2xl border-2">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-3 text-white shadow-lg">
                  <Video className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Your Motivational Video</h2>
                  <p className="text-muted-foreground">
                    {targetDuration} seconds total duration
                  </p>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 px-4 py-2 border border-orange-200 dark:border-orange-800">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Theme: {theme}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose} size="lg" className="border-2">
              Close
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-2 border-blue-200 dark:border-blue-800 p-5">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl"></div>
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  Generation Progress
                </span>
                {processingCount > 0 && (
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {processingCount} processing...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${(completedClips.length / clips.length) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-100 min-w-[80px] text-right">
                  {completedClips.length} / {clips.length}
                </span>
              </div>
            </div>
          </div>

          {allComplete && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 p-6">
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-green-400/10 blur-2xl"></div>
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-3 text-white shadow-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                      All Clips Generated Successfully!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your {completedClips.length} video clips are ready to download and combine
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleDownloadAll}
                    disabled={downloadingAll}
                    size="lg"
                    className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                  >
                    {downloadingAll ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download All {completedClips.length} Clips
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={copyFFmpegCommand}
                    size="lg"
                    className="h-12 border-2 border-green-300 dark:border-green-700"
                  >
                    <Copy className="mr-2 h-5 w-5" />
                    Copy Commands
                  </Button>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 text-sm font-mono shadow-inner">
                  <p className="font-bold text-base mb-3 text-foreground">Combine Videos Using FFmpeg:</p>
                  <ol className="space-y-2 list-decimal ml-5 text-muted-foreground">
                    <li>Download all clips using the button above</li>
                    <li>Rename them to: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">clip-1.mp4, clip-2.mp4, clip-3.mp4</code>, etc.</li>
                    <li>Create a text file called <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">filelist.txt</code> with:</li>
                  </ol>
                  <pre className="mt-2 bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-gray-800 text-xs overflow-x-auto">
{completedClips.map((_, i) => `file 'clip-${i + 1}.mp4'`).join('\n')}
                  </pre>
                  <ol className="space-y-2 list-decimal ml-5 mt-3 text-muted-foreground" start={4}>
                    <li>Run this command:</li>
                  </ol>
                  <pre className="mt-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 p-3 rounded-lg border-2 border-blue-200 dark:border-blue-800 text-xs overflow-x-auto">
ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4
                  </pre>
                </div>

                <div className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    <span className="font-semibold">Pro Tip:</span> You can also use video editing software like Adobe Premiere, DaVinci Resolve, or CapCut to combine the clips in sequence with transitions.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Film className="w-5 h-5 text-orange-500" />
              All Video Clips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clips.map((clip, index) => (
                <Card key={clip.id} className="overflow-hidden border-2 hover:border-orange-300 dark:hover:border-orange-700 transition-all hover:shadow-lg group">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-gradient-to-br from-orange-500 to-red-500 px-2.5 py-1 text-white text-sm font-bold shadow">
                          #{index + 1}
                        </div>
                        <span className="text-sm font-semibold">Clip {index + 1}</span>
                      </div>
                      {clip.status === 'completed' && (
                        <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      {(clip.status === 'processing' || clip.status === 'pending') && (
                        <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-1.5">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </div>

                    {clip.videoUrl ? (
                      <div className="relative overflow-hidden rounded-lg">
                        <video
                          src={clip.videoUrl}
                          controls
                          className="w-full rounded-lg aspect-video bg-black shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        <p className="text-xs font-medium text-muted-foreground">Generating...</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {clip.prompt}
                    </p>

                    {clip.videoUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-2 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/30 dark:hover:border-orange-700 transition-all"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = clip.videoUrl!;
                          a.download = `motivational-clip-${index + 1}.mp4`;
                          a.click();
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Clip
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
