'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Wand2, Copy, RefreshCw } from 'lucide-react';
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
}

interface TemplatePromptBuilderProps {
  onPromptGenerated?: (prompt: string, imageUrl: string, profileId: string) => void;
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

export default function TemplatePromptBuilder({ onPromptGenerated }: TemplatePromptBuilderProps) {
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [outfit, setOutfit] = useState('');
  const [location, setLocation] = useState('');
  const [activity, setActivity] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Template Prompt Builder
        </CardTitle>
        <CardDescription>
          Generate consistent prompts using your influencer&apos;s master template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile">Select Influencer Profile</Label>
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger>
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

        {selectedProfile && (
          <>
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

            <div className="flex gap-2">
              <Button onClick={generatePrompt} className="flex-1">
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Prompt
              </Button>
              <Button variant="outline" onClick={randomizeInputs}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Randomize
              </Button>
            </div>

            {generatedPrompt && (
              <div className="space-y-2">
                <Label>Generated Prompt</Label>
                <div className="relative">
                  <div className="bg-muted p-4 rounded-lg pr-12 text-sm">
                    {generatedPrompt}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={copyToClipboard}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
