'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Save, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InfluencerProfile {
  id?: string;
  name: string;
  nickname: string;
  age_range: string;
  ethnicity: string;
  skin_tone: string;
  hair_style: string;
  hair_color: string;
  eye_color: string;
  face_shape: string;
  body_type: string;
  style: string;
  personality: string;
  voice_tone: string;
  niche: string;
  base_image_url: string;
  prompt_template: string;
  camera_style: string;
}

const defaultTemplate = `A realistic [AGE] year old [ETHNICITY] [GENDER] influencer, [HAIR_STYLE] [HAIR_COLOR] hair, [EYE_COLOR] eyes, [FACE_SHAPE] face, [BODY_TYPE] body type, wearing [OUTFIT], in [LOCATION], [CAMERA_STYLE], high detail, 4k, influencer content, same face and same identity`;

interface InfluencerProfileFormProps {
  profileId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function InfluencerProfileForm({ profileId, onSuccess, onCancel }: InfluencerProfileFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<InfluencerProfile>({
    name: '',
    nickname: '',
    age_range: '',
    ethnicity: '',
    skin_tone: '',
    hair_style: '',
    hair_color: '',
    eye_color: '',
    face_shape: '',
    body_type: '',
    style: '',
    personality: '',
    voice_tone: '',
    niche: '',
    base_image_url: '',
    prompt_template: defaultTemplate,
    camera_style: 'soft cinematic lighting',
  });

  useEffect(() => {
    if (profileId) {
      loadProfile();
    }
  }, [profileId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error: any) {
      toast.error('Failed to load profile: ' + error.message);
    }
  };

  const handleChange = (field: keyof InfluencerProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const generatePromptTemplate = () => {
    const template = `A realistic ${profile.age_range || '[AGE]'} year old ${profile.ethnicity || '[ETHNICITY]'} influencer, ${profile.hair_style || '[HAIR_STYLE]'} ${profile.hair_color || '[HAIR_COLOR]'} hair, ${profile.eye_color || '[EYE_COLOR]'} eyes, ${profile.face_shape || '[FACE_SHAPE]'} face, ${profile.body_type || '[BODY_TYPE]'} body type, wearing [OUTFIT], in [LOCATION], ${profile.camera_style || 'soft cinematic lighting'}, high detail, 4k, influencer content, same face and same identity`;

    setProfile(prev => ({ ...prev, prompt_template: template }));
    toast.success('Prompt template generated!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!profile.name || !profile.niche) {
      toast.error('Name and niche are required');
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        ...profile,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (profileId) {
        const { error } = await supabase
          .from('influencer_profiles')
          .update(profileData)
          .eq('id', profileId);

        if (error) throw error;
        toast.success('Profile updated successfully!');
      } else {
        const { error } = await supabase
          .from('influencer_profiles')
          .insert([profileData]);

        if (error) throw error;
        toast.success('Profile created successfully!');
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error('Error saving profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900">Master Identity Blueprint</h3>
            <p className="text-sm text-orange-700 mt-1">
              Define every detail of your influencer&apos;s appearance and personality. This ensures perfect consistency across all generated content.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Sparkles className="w-5 h-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Create your influencer&apos;s master identity that will remain consistent across all content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Luna Martinez"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={profile.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                placeholder="e.g., Lu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age_range">Age Range</Label>
              <Input
                id="age_range"
                value={profile.age_range}
                onChange={(e) => handleChange('age_range', e.target.value)}
                placeholder="e.g., 22-26"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="niche">Content Niche *</Label>
              <Select value={profile.niche} onValueChange={(value) => handleChange('niche', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select niche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="luxury">Luxury Lifestyle</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="motivational">Motivational</SelectItem>
                  <SelectItem value="business">Business/Finance</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <CardTitle className="text-orange-900">Physical Appearance</CardTitle>
          <CardDescription>
            Define the exact look that will be consistent across all generated content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ethnicity">Ethnicity</Label>
              <Input
                id="ethnicity"
                value={profile.ethnicity}
                onChange={(e) => handleChange('ethnicity', e.target.value)}
                placeholder="e.g., Latina, Mixed, Asian"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skin_tone">Skin Tone</Label>
              <Input
                id="skin_tone"
                value={profile.skin_tone}
                onChange={(e) => handleChange('skin_tone', e.target.value)}
                placeholder="e.g., warm tan, fair, deep brown"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hair_style">Hair Style</Label>
              <Input
                id="hair_style"
                value={profile.hair_style}
                onChange={(e) => handleChange('hair_style', e.target.value)}
                placeholder="e.g., long wavy, short curly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hair_color">Hair Color</Label>
              <Input
                id="hair_color"
                value={profile.hair_color}
                onChange={(e) => handleChange('hair_color', e.target.value)}
                placeholder="e.g., dark brown, blonde"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eye_color">Eye Color</Label>
              <Input
                id="eye_color"
                value={profile.eye_color}
                onChange={(e) => handleChange('eye_color', e.target.value)}
                placeholder="e.g., hazel, blue, brown"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="face_shape">Face Shape</Label>
              <Input
                id="face_shape"
                value={profile.face_shape}
                onChange={(e) => handleChange('face_shape', e.target.value)}
                placeholder="e.g., oval, round, sharp jawline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body_type">Body Type</Label>
              <Input
                id="body_type"
                value={profile.body_type}
                onChange={(e) => handleChange('body_type', e.target.value)}
                placeholder="e.g., slim, athletic, curvy"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Fashion Style</Label>
              <Input
                id="style"
                value={profile.style}
                onChange={(e) => handleChange('style', e.target.value)}
                placeholder="e.g., streetwear, luxury, casual"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <CardTitle className="text-orange-900">Personality & Brand</CardTitle>
          <CardDescription>
            Define the character and voice that makes your influencer unique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personality">Personality Vibe</Label>
            <Input
              id="personality"
              value={profile.personality}
              onChange={(e) => handleChange('personality', e.target.value)}
              placeholder="e.g., confident, soft, bold, funny"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice_tone">Voice & Tone</Label>
            <Input
              id="voice_tone"
              value={profile.voice_tone}
              onChange={(e) => handleChange('voice_tone', e.target.value)}
              placeholder="e.g., warm and motivational, playful"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <CardTitle className="text-orange-900">Technical Settings</CardTitle>
          <CardDescription>
            Configure the visual consistency and reference image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base_image_url">Base Reference Image URL</Label>
            <Input
              id="base_image_url"
              value={profile.base_image_url}
              onChange={(e) => handleChange('base_image_url', e.target.value)}
              placeholder="Upload your base influencer image and paste URL here"
            />
            <p className="text-xs text-muted-foreground">
              This is the ONE perfect image that becomes your influencer&apos;s visual reference
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="camera_style">Camera Style</Label>
            <Select value={profile.camera_style} onValueChange={(value) => handleChange('camera_style', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select camera style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soft cinematic lighting">Soft Cinematic Lighting</SelectItem>
                <SelectItem value="iPhone portrait mode">iPhone Portrait Mode</SelectItem>
                <SelectItem value="Instagram influencer aesthetic">Instagram Aesthetic</SelectItem>
                <SelectItem value="soft flash photography">Soft Flash Photography</SelectItem>
                <SelectItem value="golden hour outdoor lighting">Golden Hour Lighting</SelectItem>
                <SelectItem value="studio lighting">Studio Lighting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="prompt_template">Master Prompt Template</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePromptTemplate}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Template
              </Button>
            </div>
            <Textarea
              id="prompt_template"
              value={profile.prompt_template}
              onChange={(e) => handleChange('prompt_template', e.target.value)}
              rows={4}
              placeholder="Your master prompt template..."
            />
            <p className="text-xs text-muted-foreground">
              Use [OUTFIT], [LOCATION], [ACTIVITY] as placeholders for variable elements
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end sticky bottom-0 bg-white p-4 -mx-4 -mb-4 border-t shadow-lg">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} size="lg">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading} size="lg" className="min-w-[180px]">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              {profileId ? 'Update Profile' : 'Create Profile'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
