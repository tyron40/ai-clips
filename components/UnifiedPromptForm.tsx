'use client';

import { useState, FormEvent } from 'react';
import { Volume2, Sparkles, Image, Film, Users, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UploadImage from './UploadImage';
import PromptTemplates from './PromptTemplates';
import { generateAudioFromText } from '@/lib/generateAudio';
import { enhancePromptWithImage, optimizeForCharacterAnimation, enhanceForMovieScene, enhanceForTalkingCharacter, enhanceForMultiImage, enhanceForImageMotion, validatePrompt } from '@/lib/promptEnhancer';

interface UnifiedPromptFormProps {
  onSubmit: (
    videoId: string,
    prompt: string,
    imageUrl?: string,
    duration?: string,
    mode?: string,
    style?: string,
    transition?: string,
    images?: string[],
    motionType?: string,
    dialogue?: string,
    audioUrl?: string
  ) => void;
}

type VideoMode = 'simple' | 'character' | 'talking' | 'scene' | 'motion' | 'multi';

export default function UnifiedPromptForm({ onSubmit }: UnifiedPromptFormProps) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<VideoMode>('simple');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>('5s');
  const [style, setStyle] = useState('drama');
  const [transition, setTransition] = useState('smooth');
  const [motionType, setMotionType] = useState('gentle');
  const [dialogue, setDialogue] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('natural');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      setError(validation.error || 'Invalid prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let audioUrl: string | null = null;
      let finalPrompt = prompt.trim();

      if (mode === 'talking' && dialogue.trim()) {
        audioUrl = await generateAudioFromText(dialogue, voiceStyle);
        if (!audioUrl) {
          throw new Error('Failed to generate audio. Please try again.');
        }
        finalPrompt = enhanceForTalkingCharacter(finalPrompt, true);
      } else if (mode === 'character' && imageUrl.trim()) {
        finalPrompt = enhancePromptWithImage(finalPrompt, true);
        finalPrompt = optimizeForCharacterAnimation(finalPrompt, 'moderate');
      } else if (mode === 'scene' && imageUrl.trim()) {
        finalPrompt = enhanceForMovieScene(finalPrompt, style, true);
      } else if (mode === 'motion' && imageUrl.trim()) {
        finalPrompt = enhanceForImageMotion(finalPrompt, motionType, true);
      } else if (mode === 'multi' && images.length > 0) {
        finalPrompt = enhanceForMultiImage(finalPrompt, images.length, transition);
      }

      const response = await fetch('/api/luma/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          prompt: finalPrompt,
          imageUrl: imageUrl.trim() || undefined,
          duration,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server. Please check your configuration.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create video');
      }

      const modeMap: Record<VideoMode, string> = {
        simple: 'luma',
        character: 'luma',
        talking: 'luma',
        scene: 'movie-scene',
        motion: 'image-motion',
        multi: 'multi-image'
      };

      onSubmit(
        data.id,
        prompt.trim(),
        imageUrl.trim() || undefined,
        duration,
        modeMap[mode],
        style,
        transition,
        images.length > 0 ? images : undefined,
        motionType,
        dialogue.trim() || undefined,
        audioUrl || undefined
      );

      setPrompt('');
      setImageUrl('');
      setImages([]);
      setDialogue('');
      setDuration('5s');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const modeDescriptions: Record<VideoMode, { title: string; icon: any; description: string }> = {
    simple: {
      title: 'Text to Video',
      icon: Sparkles,
      description: 'Generate video from text prompt'
    },
    character: {
      title: 'Animate Character',
      icon: Users,
      description: 'Animate a character from an image'
    },
    talking: {
      title: 'Talking Character',
      icon: Volume2,
      description: 'Make character speak with audio'
    },
    scene: {
      title: 'Movie Scene',
      icon: Film,
      description: 'Create cinematic scene with style'
    },
    motion: {
      title: 'Image Motion',
      icon: Wand2,
      description: 'Add motion effects to image'
    },
    multi: {
      title: 'Multi-Image',
      icon: Image,
      description: 'Transition between multiple images'
    }
  };

  const needsImage = mode === 'character' || mode === 'talking' || mode === 'scene' || mode === 'motion';
  const needsMultiImages = mode === 'multi';
  const showDialogue = mode === 'talking';
  const showStyle = mode === 'scene';
  const showMotion = mode === 'motion';
  const showTransition = mode === 'multi';

  return (
    <>
      <PromptTemplates onSelectTemplate={setPrompt} />

      <div className="w-full max-w-4xl mx-auto space-y-6 p-6 bg-white rounded-lg shadow-lg">
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Video Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.keys(modeDescriptions) as VideoMode[]).map((m) => {
              const { title, icon: Icon } = modeDescriptions[m];
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mode === m
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${mode === m ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="text-sm font-medium">{title}</div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-base font-semibold">
              Describe Your Video
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === 'talking'
                  ? 'Describe the scene while the character speaks...'
                  : mode === 'character'
                  ? 'Describe how you want the character to move...'
                  : mode === 'scene'
                  ? 'Describe the cinematic scene...'
                  : mode === 'motion'
                  ? 'Describe the desired motion effect...'
                  : mode === 'multi'
                  ? 'Describe the transition story...'
                  : 'Describe the video you want to create...'
              }
              className="min-h-[120px] text-base"
              required
            />
          </div>

          {needsImage && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">Upload Image</Label>
              <UploadImage onUploadComplete={setImageUrl} />
              {imageUrl && (
                <div className="mt-2">
                  <img src={imageUrl} alt="Uploaded" className="max-w-xs rounded-lg shadow" />
                </div>
              )}
            </div>
          )}

          {needsMultiImages && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">Upload Images (2-5)</Label>
              <UploadImage
                onUploadComplete={(url) => {
                  if (images.length < 5) {
                    setImages([...images, url]);
                  }
                }}
              />
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`Image ${idx + 1}`} className="w-full rounded-lg shadow" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showDialogue && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dialogue" className="text-base font-semibold">
                  <Volume2 className="inline w-4 h-4 mr-2" />
                  Character Dialogue
                </Label>
                <Textarea
                  id="dialogue"
                  value={dialogue}
                  onChange={(e) => setDialogue(e.target.value)}
                  placeholder="What should the character say?"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Voice Style</Label>
                <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5s">5 seconds</SelectItem>
                  <SelectItem value="10s">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showStyle && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thriller">Thriller</SelectItem>
                    <SelectItem value="comedy">Comedy</SelectItem>
                    <SelectItem value="drama">Drama</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="scifi">Sci-Fi</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showMotion && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Motion Type</Label>
                <Select value={motionType} onValueChange={setMotionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gentle">Gentle</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="pan">Pan</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showTransition && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Transition</Label>
                <Select value={transition} onValueChange={setTransition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smooth">Smooth</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="dissolve">Dissolve</SelectItem>
                    <SelectItem value="morph">Morph</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg font-semibold"
          >
            {loading ? 'Creating Video...' : 'Generate Video'}
          </Button>
        </form>
      </div>
    </>
  );
}
