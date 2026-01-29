'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Wand2, Copy, RefreshCw, User, Video, Loader2, CheckCircle2, XCircle, PlayCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InfluencerProfile {
  id: string;
  name: string;
  prompt_template: string;
  base_image_url: string;
  niche?: string;
  ethnicity?: string;
  age_range?: string;
}

interface TemplatePromptBuilderProps {
  onPromptGenerated?: (prompt: string, imageUrl: string, profileId: string) => void;
  onVideoGenerated?: (videoId: string, prompt: string, imageUrl?: string, profileId?: string) => void;
}

const outfitSuggestions = [
  'casual streetwear',
  'athletic gym wear',
  'elegant evening dress',
  'business casual attire',
  'summer beach outfit',
  'cozy winter sweater',
  'trendy designer outfit',
  'casual jeans and t-shirt',
  'professional business suit',
  'bohemian style dress',
];

const locationSuggestions = [
  'urban city street',
  'modern gym',
  'luxury hotel room',
  'tropical beach',
  'cozy coffee shop',
  'rooftop terrace',
  'minimalist studio',
  'scenic mountain view',
  'upscale restaurant',
  'home office',
];

const activitySuggestions = [
  'looking at camera with confidence',
  'working out',
  'enjoying a meal',
  'walking down the street',
  'posing for a photo',
  'sitting casually',
  'standing with arms crossed',
  'laughing and smiling',
  'looking away thoughtfully',
  'interacting with phone',
];

interface VideoState {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  prompt?: string;
}

export default function TemplatePromptBuilder({ onPromptGenerated, onVideoGenerated }: TemplatePromptBuilderProps) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [outfit, setOutfit] = useState('');
  const [location, setLocation] = useState('');
  const [activity, setActivity] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [selectedProfileData, setSelectedProfileData] = useState<InfluencerProfile | null>(null);
  const [videoState, setVideoState] = useState<VideoState | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadProfileData();
    } else {
      setSelectedProfileData(null);
    }
  }, [selectedProfile]);

  useEffect(() => {
    if (!videoState || videoState.status === 'completed' || videoState.status === 'failed') {
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/luma/status?id=${videoState.id}`);
        const contentType = response.headers.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response from server');
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch status');
        }

        setVideoState(prev => prev ? {
          ...prev,
          status: data.status,
          videoUrl: data.video_url,
          error: data.error,
        } : null);

        if (data.status === 'completed' && data.video_url) {
          toast.success('Video generated successfully!');

          if (user) {
            await supabase
              .from('videos')
              .update({
                status: 'completed',
                video_url: data.video_url,
                completed_at: new Date().toISOString()
              })
              .eq('luma_id', videoState.id);
          }
        } else if (data.status === 'failed') {
          toast.error('Video generation failed: ' + (data.error || 'Unknown error'));

          if (user) {
            await supabase
              .from('videos')
              .update({
                status: 'failed',
                error_message: data.error
              })
              .eq('luma_id', videoState.id);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const interval = setInterval(pollStatus, 4000);
    pollStatus();

    return () => clearInterval(interval);
  }, [videoState?.id, videoState?.status, user]);

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

  const loadProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('*')
        .eq('id', selectedProfile)
        .maybeSingle();

      if (error) throw error;
      setSelectedProfileData(data);
    } catch (error: any) {
      console.error('Failed to load profile data:', error);
    }
  };

  const generatePrompt = () => {
    const profile = profiles.find(p => p.id === selectedProfile);
    if (!profile) {
      toast.error('Please select a profile first');
      return;
    }

    let prompt = profile.prompt_template;

    if (outfit) {
      prompt = prompt.replace('[OUTFIT]', outfit);
    }
    if (location) {
      prompt = prompt.replace('[LOCATION]', location);
    }
    if (activity) {
      prompt = prompt.replace(/\[ACTIVITY\]/g, activity);
    }

    prompt = prompt.replace(/\[OUTFIT\]/g, outfit || 'stylish outfit');
    prompt = prompt.replace(/\[LOCATION\]/g, location || 'aesthetic setting');
    prompt = prompt.replace(/\[ACTIVITY\]/g, activity || 'posing naturally');

    setGeneratedPrompt(prompt);

    if (onPromptGenerated) {
      onPromptGenerated(prompt, profile.base_image_url, profile.id);
    }

    toast.success('Prompt generated!');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success('Prompt copied to clipboard!');
  };

  const randomizeInputs = () => {
    setOutfit(outfitSuggestions[Math.floor(Math.random() * outfitSuggestions.length)]);
    setLocation(locationSuggestions[Math.floor(Math.random() * locationSuggestions.length)]);
    setActivity(activitySuggestions[Math.floor(Math.random() * activitySuggestions.length)]);
  };

  const generateVideo = async () => {
    if (!generatedPrompt) {
      toast.error('Please generate a prompt first');
      return;
    }

    if (!user) {
      toast.error('Please sign in to generate videos');
      return;
    }

    const profile = profiles.find(p => p.id === selectedProfile);
    if (!profile) {
      toast.error('Profile not found');
      return;
    }

    try {
      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          prompt: generatedPrompt,
          imageUrl: profile.base_image_url || undefined,
          duration: '5s',
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create video');
      }

      setVideoState({
        id: data.id,
        status: 'queued',
        prompt: generatedPrompt,
      });

      await supabase.from('videos').insert({
        user_id: user.id,
        luma_id: data.id,
        prompt: generatedPrompt,
        image_url: profile.base_image_url,
        duration: '5s',
        status: 'queued',
        generation_mode: 'luma',
        influencer_profile_id: profile.id,
      });

      toast.success('Video generation started!');

      if (onVideoGenerated) {
        onVideoGenerated(data.id, generatedPrompt, profile.base_image_url, profile.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate video');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <CardTitle className="flex items-center gap-2 text-orange-900 text-2xl">
            <Wand2 className="w-6 h-6" />
            Template Prompt Builder
          </CardTitle>
          <CardDescription className="text-base">
            Generate consistent prompts using your influencer&apos;s master template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <Label htmlFor="profile" className="text-base font-semibold">Select Influencer Profile</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Choose an influencer profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.length === 0 ? (
                  <SelectItem value="none" disabled>No profiles created yet</SelectItem>
                ) : (
                  profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedProfileData && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border-2 border-orange-200">
              <div className="flex items-start gap-4">
                {selectedProfileData.base_image_url ? (
                  <img
                    src={selectedProfileData.base_image_url}
                    alt={selectedProfileData.name}
                    className="w-20 h-20 rounded-lg object-cover ring-2 ring-orange-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-orange-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-orange-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 text-lg">{selectedProfileData.name}</h3>
                  {selectedProfileData.niche && (
                    <p className="text-sm text-orange-700 mt-1">
                      <span className="font-medium">Niche:</span> {selectedProfileData.niche}
                    </p>
                  )}
                  {selectedProfileData.ethnicity && (
                    <p className="text-sm text-orange-700">
                      <span className="font-medium">Profile:</span> {selectedProfileData.ethnicity}
                      {selectedProfileData.age_range && `, ${selectedProfileData.age_range}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProfile && (
        <Card className="border-2">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outfit">Outfit</Label>
                <Select value={outfit} onValueChange={setOutfit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outfit" />
                  </SelectTrigger>
                  <SelectContent>
                    {outfitSuggestions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationSuggestions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity">Activity/Pose</Label>
                <Select value={activity} onValueChange={setActivity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {activitySuggestions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Or enter custom values:</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Custom outfit..."
                  value={outfit}
                  onChange={(e) => setOutfit(e.target.value)}
                />
                <Input
                  placeholder="Custom location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <Input
                  placeholder="Custom activity..."
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={generatePrompt} className="flex-1" size="lg">
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Prompt
              </Button>
              <Button variant="outline" onClick={randomizeInputs} size="lg">
                <RefreshCw className="w-5 h-5 mr-2" />
                Randomize
              </Button>
            </div>

            {generatedPrompt && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Generated Prompt</Label>
                <div className="relative">
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border-2 border-orange-200 pr-16 text-base leading-relaxed">
                    {generatedPrompt}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 hover:bg-orange-100"
                    onClick={copyToClipboard}
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={generateVideo}
                    disabled={!!videoState && videoState.status !== 'completed' && videoState.status !== 'failed'}
                    size="lg"
                    className="flex-1"
                  >
                    {videoState && videoState.status !== 'completed' && videoState.status !== 'failed' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5 mr-2" />
                        Generate Video with Luma AI
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  This will use your influencer&apos;s reference image and the generated prompt to create a video
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {videoState && (
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <PlayCircle className="w-6 h-6" />
              Generated Video
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {videoState.status === 'queued' && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Video Queued</p>
                  <p className="text-sm text-blue-700">Your video is in the queue and will start processing soon...</p>
                </div>
              </div>
            )}

            {videoState.status === 'processing' && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Processing Video</p>
                  <p className="text-sm text-blue-700">Your video is being generated. This may take a few minutes...</p>
                </div>
              </div>
            )}

            {videoState.status === 'completed' && videoState.videoUrl && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Video Ready!</p>
                    <p className="text-sm text-green-700">Your video has been generated successfully</p>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden border-2 border-gray-200">
                  <video
                    src={videoState.videoUrl}
                    controls
                    className="w-full"
                    playsInline
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Prompt Used:</p>
                  <p className="text-sm text-gray-600">{videoState.prompt}</p>
                </div>
                <Button
                  onClick={() => setVideoState(null)}
                  variant="outline"
                  className="w-full"
                >
                  Create Another Video
                </Button>
              </div>
            )}

            {videoState.status === 'failed' && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <XCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Generation Failed</p>
                  <p className="text-sm text-red-700">{videoState.error || 'An error occurred during video generation'}</p>
                </div>
                <Button
                  onClick={() => setVideoState(null)}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
