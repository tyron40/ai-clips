'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Trophy, TrendingUp, Target, Zap, Heart, DollarSign, Rocket, Brain, Users, Award, Clock, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateMotivationalPrompts } from '@/lib/motivationalPromptGenerator';
import MotivationalVideoCombiner from './MotivationalVideoCombiner';
import { supabase } from '@/lib/supabase';

interface MotivationalVideoFormProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

export default function MotivationalVideoForm({ onVideoGenerated }: MotivationalVideoFormProps) {
  const [theme, setTheme] = useState('');
  const [duration, setDuration] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBatchResults, setShowBatchResults] = useState(false);
  const [batchVideos, setBatchVideos] = useState<Array<{ id: string; prompt: string }>>([]);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });

  const getDurationLabel = (seconds: string) => {
    const s = parseInt(seconds);
    if (s < 60) return `${s} seconds`;
    const minutes = Math.floor(s / 60);
    const remainingSeconds = s % 60;
    if (remainingSeconds === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleGenerate = async () => {
    if (!theme.trim()) return;

    setIsGenerating(true);
    try {
      const targetDuration = parseInt(duration);
      const numberOfClips = Math.ceil(targetDuration / 10);

      const prompts = generateMotivationalPrompts(theme, numberOfClips);

      setGenerationProgress({ current: 0, total: numberOfClips });
      setShowBatchResults(true);

      const generatedVideos: Array<{ id: string; prompt: string }> = [];

      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        setGenerationProgress({ current: i + 1, total: numberOfClips });

        const { data: { user } } = await supabase.auth.getUser();

        const response = await fetch('/api/luma/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            aspect_ratio: '16:9',
            loop: false,
            keyframes: undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate video');
        }

        const data = await response.json();

        if (user) {
          await supabase.from('videos').insert({
            user_id: user.id,
            prompt: prompt,
            luma_id: data.id,
            status: 'processing',
            generation_mode: 'motivational',
          });
        }

        const newVideo = {
          id: data.id,
          prompt: prompt,
        };

        generatedVideos.push(newVideo);
        setBatchVideos([...generatedVideos]);
      }
    } catch (error) {
      console.error('Failed to generate motivational video:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0 });
    }
  };

  const motivationalThemes = [
    { name: 'Success and Achievement', icon: Trophy, color: 'from-amber-500 to-orange-500' },
    { name: 'Overcoming Adversity', icon: Target, color: 'from-red-500 to-pink-500' },
    { name: 'Personal Growth', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { name: 'Entrepreneurship', icon: Rocket, color: 'from-blue-500 to-cyan-500' },
    { name: 'Fitness and Health', icon: Heart, color: 'from-rose-500 to-red-500' },
    { name: 'Financial Freedom', icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
    { name: 'Dream Pursuit', icon: Sparkles, color: 'from-yellow-500 to-amber-500' },
    { name: 'Self-Discipline', icon: Zap, color: 'from-orange-500 to-red-500' },
    { name: 'Leadership', icon: Users, color: 'from-blue-600 to-indigo-600' },
    { name: 'Mindset and Positivity', icon: Brain, color: 'from-teal-500 to-cyan-500' }
  ];

  return (
    <>
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="relative space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Film className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Motivational Video Creator</h2>
                <p className="text-white/90 text-sm">Create powerful multi-clip videos that inspire action</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="theme" className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Your Motivational Message
          </Label>
          <Textarea
            id="theme"
            placeholder="Describe the theme or message of your motivational video (e.g., 'overcoming challenges and achieving success through persistence and hard work')"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="min-h-[120px] text-base border-2 focus:border-orange-500 transition-colors"
          />
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Be specific about the message, tone, and visual style you want
          </p>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-500" />
            Quick Theme Presets
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {motivationalThemes.map((quickTheme) => {
              const Icon = quickTheme.icon;
              return (
                <button
                  key={quickTheme.name}
                  onClick={() => setTheme(`Create a hyperrealistic motivational video about ${quickTheme.name.toLowerCase()}, showing powerful scenes that inspire action`)}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left transition-all hover:border-transparent hover:scale-105 hover:shadow-xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${quickTheme.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="relative space-y-2">
                    <div className={`inline-flex rounded-lg bg-gradient-to-br ${quickTheme.color} p-2 text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold group-hover:text-white transition-colors">
                      {quickTheme.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="duration" className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Video Duration
          </Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="duration" className="h-12 text-base border-2 focus:border-orange-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10" className="text-base">10 seconds (1 clip)</SelectItem>
              <SelectItem value="30" className="text-base">30 seconds (3 clips)</SelectItem>
              <SelectItem value="60" className="text-base">1 minute (6 clips)</SelectItem>
              <SelectItem value="90" className="text-base">1.5 minutes (9 clips)</SelectItem>
              <SelectItem value="120" className="text-base">2 minutes (12 clips)</SelectItem>
              <SelectItem value="150" className="text-base">2.5 minutes (15 clips)</SelectItem>
              <SelectItem value="180" className="text-base">3 minutes (18 clips)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 p-3 border border-orange-200 dark:border-orange-800">
            <Film className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <p className="text-sm text-orange-900 dark:text-orange-100">
              Your video will have <span className="font-bold">{Math.ceil(parseInt(duration) / 10)} diverse scenes</span> at 10 seconds each
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-2 border-blue-200 dark:border-blue-800 p-6">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl"></div>
          <div className="relative flex items-start gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3 text-white shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-3 flex-1">
              <p className="font-bold text-lg text-blue-900 dark:text-blue-100">How It Works</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">Multiple hyperrealistic 10-second clips generated in sequence</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">Each clip features different motivational scenes</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">Download all clips with one click</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">Combine with provided FFmpeg commands</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {parseInt(duration) >= 60 && (
            <div className="flex items-start gap-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-3 border border-amber-200 dark:border-amber-800">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <span className="font-semibold">Please Note:</span> Generating {Math.ceil(parseInt(duration) / 10)} clips will take approximately {Math.ceil(parseInt(duration) / 10) * 3}-{Math.ceil(parseInt(duration) / 10) * 5} minutes. Each clip is created individually and then you can combine them.
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!theme.trim() || isGenerating}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting Clip {generationProgress.current} of {generationProgress.total}...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate {getDurationLabel(duration)} Motivational Video
              </>
            )}
          </Button>
        </div>
      </div>

      {showBatchResults && (
        <MotivationalVideoCombiner
          videos={batchVideos}
          onClose={() => {
            setShowBatchResults(false);
            setTheme('');
          }}
          targetDuration={duration}
          theme={theme}
        />
      )}
    </>
  );
}
