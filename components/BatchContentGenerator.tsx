'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface InfluencerProfile {
  id: string;
  name: string;
  prompt_template: string;
  base_image_url: string;
}

interface BatchJob {
  id: number;
  prompt: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  videoUrl?: string;
  error?: string;
}

const batchPresets = {
  selfies: [
    { outfit: 'casual t-shirt', location: 'home setting', activity: 'smiling at camera' },
    { outfit: 'cozy sweater', location: 'bedroom', activity: 'natural pose' },
    { outfit: 'stylish top', location: 'bathroom mirror', activity: 'taking selfie' },
    { outfit: 'summer dress', location: 'outdoor balcony', activity: 'golden hour selfie' },
    { outfit: 'hoodie', location: 'living room', activity: 'relaxed pose' },
  ],
  fitness: [
    { outfit: 'sports bra and leggings', location: 'modern gym', activity: 'doing squats' },
    { outfit: 'athletic wear', location: 'gym mirror', activity: 'flexing muscles' },
    { outfit: 'workout clothes', location: 'outdoor park', activity: 'jogging' },
    { outfit: 'yoga outfit', location: 'yoga studio', activity: 'stretching pose' },
    { outfit: 'gym attire', location: 'fitness center', activity: 'lifting weights' },
  ],
  fashion: [
    { outfit: 'designer dress', location: 'urban street', activity: 'fashion walk' },
    { outfit: 'trendy outfit', location: 'city backdrop', activity: 'posing confidently' },
    { outfit: 'luxury wear', location: 'upscale area', activity: 'editorial pose' },
    { outfit: 'streetwear', location: 'graffiti wall', activity: 'street style pose' },
    { outfit: 'elegant attire', location: 'boutique entrance', activity: 'looking away' },
  ],
  lifestyle: [
    { outfit: 'casual outfit', location: 'coffee shop', activity: 'enjoying coffee' },
    { outfit: 'comfortable wear', location: 'bookstore', activity: 'browsing books' },
    { outfit: 'day wear', location: 'park bench', activity: 'relaxing' },
    { outfit: 'summer outfit', location: 'beach', activity: 'enjoying sunset' },
    { outfit: 'cozy attire', location: 'home couch', activity: 'reading' },
  ],
};

export default function BatchContentGenerator() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof batchPresets>('selfies');
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('id, name, prompt_template, base_image_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast.error('Failed to load profiles: ' + error.message);
    }
  };

  const generateBatchPrompts = () => {
    const profile = profiles.find(p => p.id === selectedProfile);
    if (!profile) {
      toast.error('Please select a profile first');
      return;
    }

    const preset = batchPresets[selectedPreset];
    const jobs: BatchJob[] = preset.map((item, index) => {
      let prompt = profile.prompt_template;
      prompt = prompt.replace(/\[OUTFIT\]/g, item.outfit);
      prompt = prompt.replace(/\[LOCATION\]/g, item.location);
      prompt = prompt.replace(/\[ACTIVITY\]/g, item.activity);

      return {
        id: index,
        prompt,
        status: 'pending',
      };
    });

    setBatchJobs(jobs);
    toast.success(`${jobs.length} prompts generated! Ready to create batch.`);
  };

  const startBatchGeneration = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    if (batchJobs.length === 0) {
      toast.error('Generate prompts first');
      return;
    }

    const profile = profiles.find(p => p.id === selectedProfile);
    if (!profile) return;

    setIsGenerating(true);

    for (let i = 0; i < batchJobs.length; i++) {
      setBatchJobs(prev => prev.map((job, idx) =>
        idx === i ? { ...job, status: 'generating' } : job
      ));

      try {
        const response = await fetch('/api/luma/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: batchJobs[i].prompt,
            imageUrl: profile.base_image_url || undefined,
            mode: 'text',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create video');
        }

        const data = await response.json();

        await supabase.from('videos').insert({
          user_id: user.id,
          generation_id: data.id,
          prompt: batchJobs[i].prompt,
          mode: 'text',
          status: 'pending',
          influencer_profile_id: selectedProfile,
        });

        setBatchJobs(prev => prev.map((job, idx) =>
          idx === i ? { ...job, status: 'success' } : job
        ));

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        setBatchJobs(prev => prev.map((job, idx) =>
          idx === i ? { ...job, status: 'error', error: error.message } : job
        ));
      }
    }

    setIsGenerating(false);
    toast.success('Batch generation complete! Check your video gallery.');
  };

  const getProgress = () => {
    if (batchJobs.length === 0) return 0;
    const completed = batchJobs.filter(j => j.status === 'success' || j.status === 'error').length;
    return (completed / batchJobs.length) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Batch Content Generator
        </CardTitle>
        <CardDescription>
          Generate multiple videos at once using preset content themes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Influencer Profile</label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Choose profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content Preset</label>
            <Select
              value={selectedPreset}
              onValueChange={(value) => setSelectedPreset(value as keyof typeof batchPresets)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selfies">Selfies (5 videos)</SelectItem>
                <SelectItem value="fitness">Fitness (5 videos)</SelectItem>
                <SelectItem value="fashion">Fashion (5 videos)</SelectItem>
                <SelectItem value="lifestyle">Lifestyle (5 videos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={generateBatchPrompts}
            disabled={!selectedProfile || isGenerating}
            variant="outline"
            className="flex-1"
          >
            Generate Prompts
          </Button>
          <Button
            onClick={startBatchGeneration}
            disabled={!selectedProfile || batchJobs.length === 0 || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Batch Generation
              </>
            )}
          </Button>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <Progress value={getProgress()} />
          </div>
        )}

        {batchJobs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Batch Jobs</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {batchJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-start gap-3 p-3 bg-muted rounded-lg text-sm"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {job.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    {job.status === 'generating' && (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    )}
                    {job.status === 'success' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {job.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{job.prompt}</p>
                    {job.error && (
                      <p className="text-xs text-red-500 mt-1">{job.error}</p>
                    )}
                  </div>
                  <Badge
                    variant={
                      job.status === 'success'
                        ? 'default'
                        : job.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
