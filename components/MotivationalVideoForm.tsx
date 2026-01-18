'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
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

      const generatedVideos: Array<{ id: string; prompt: string }> = [];

      for (const prompt of prompts) {
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

        generatedVideos.push({
          id: data.id,
          prompt: prompt,
        });
      }

      setBatchVideos(generatedVideos);
      setShowBatchResults(true);
    } catch (error) {
      console.error('Failed to generate motivational video:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const motivationalThemes = [
    'Success and Achievement',
    'Overcoming Adversity',
    'Personal Growth',
    'Entrepreneurship',
    'Fitness and Health',
    'Financial Freedom',
    'Dream Pursuit',
    'Self-Discipline',
    'Leadership',
    'Mindset and Positivity'
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="theme">Motivational Theme</Label>
          <Textarea
            id="theme"
            placeholder="Describe the theme or message of your motivational video (e.g., 'overcoming challenges and achieving success through persistence and hard work')"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-sm text-muted-foreground">
            Be specific about the message, tone, and visual style you want
          </p>
        </div>

        <div className="space-y-2">
          <Label>Quick Themes</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {motivationalThemes.map((quickTheme) => (
              <Button
                key={quickTheme}
                variant="outline"
                size="sm"
                onClick={() => setTheme(`Create a hyperrealistic motivational video about ${quickTheme.toLowerCase()}, showing powerful scenes that inspire action`)}
                className="justify-start text-left h-auto py-2 px-3"
              >
                {quickTheme}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Target Duration</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 seconds (1 clip)</SelectItem>
              <SelectItem value="30">30 seconds (3 clips)</SelectItem>
              <SelectItem value="60">1 minute (6 clips)</SelectItem>
              <SelectItem value="90">1.5 minutes (9 clips)</SelectItem>
              <SelectItem value="120">2 minutes (12 clips)</SelectItem>
              <SelectItem value="150">2.5 minutes (15 clips)</SelectItem>
              <SelectItem value="180">3 minutes (18 clips)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Each clip is 10 seconds. Your video will have {Math.ceil(parseInt(duration) / 10)} diverse scenes.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-500">How It Works</p>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Multiple hyperrealistic 10-second clips will be generated in sequence</li>
                <li>Each clip features different motivational scenes based on your theme</li>
                <li>All clips will be automatically downloaded and ready to combine</li>
                <li>You'll receive FFmpeg commands or can use any video editor to combine them</li>
                <li>Perfect for creating YouTube motivational content</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!theme.trim() || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating {Math.ceil(parseInt(duration) / 10)} Clips...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate {getDurationLabel(duration)} Motivational Video
            </>
          )}
        </Button>
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
