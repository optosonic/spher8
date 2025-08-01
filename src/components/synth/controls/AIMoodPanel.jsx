
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';

export default function AIMoodPanel({ 
  onMoodSettingsChange,
  currentSettings,
  disabled,
  isLockedOut = false // New prop
}) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim() || isGenerating || disabled || isLockedOut) return;
    
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const prompt = `You are an expert music producer and sound designer specializing in creating atmospheric moods through synthesizer parameters. A user has described a musical mood they want to achieve.

Your job is to translate their mood description into optimal synthesizer settings for the Spher8 molecular synthesizer.

User's Mood Description: "${description}"

Current context for reference:
- Current BPM: ${currentSettings.bpm}
- Current Scale: ${currentSettings.selectedScale}
- Current Sphere Count: ${currentSettings.sphereCount}

Based on the mood description, determine the most appropriate settings across all parameters:

MUSICAL PARAMETERS:
- bpm: Beats per minute (40-240). Slow for calm/dark, fast for energetic/chaotic
- rhythm: Note division (1=quarter notes, 2=eighth notes, 4=sixteenth notes, 8=32nd notes)
- selectedScale: Choose from Major, Natural Minor, Harmonic Minor, Melodic Minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, Chromatic, Major Pentatonic, Minor Pentatonic, Blues, Whole Tone, Arabic (Bayati), Persian, Gypsy, Japanese (Insen), Egyptian, Flamenco
- rootNote: Root note (0-11, where 0=C, 1=C#, 2=D, etc.)
- sphereCount: Number of spheres/notes (1-8). Fewer for minimal/sparse, more for lush/complex

SPATIAL PARAMETERS:
- yTranslation: Pitch transposition (-36 to 36 semitones). Negative for darker/lower, positive for brighter/higher
- autoTranspose: Boolean, enables automatic pitch modulation for movement
- autoTransposeRange: Range of auto-transposition (1-24 semitones)
- autoTransposeSpeed: Speed of auto-transposition (0-10)
- xRotation, yRotation, zRotation: Manual rotations (0-360 degrees)
- autoRotateX, autoRotateY, autoRotateZ: Enable automatic rotations (boolean)
- autoRotateSpeedX, autoRotateSpeedY, autoRotateSpeedZ: Rotation speeds (0-10)

SYNTHESIS PARAMETERS (for Web Audio mode):
- waveform: sine (smooth), square (harsh), sawtooth (bright), triangle (mellow)
- envelope: ADSR envelope
  - a: Attack time (0-2 seconds). Fast for punchy, slow for swelling
  - d: Decay time (0-2 seconds)
  - s: Sustain level (0-1). How loud the sustained portion is
  - r: Release time (0-2 seconds). Short for staccato, long for ambient
- isChordMode: Boolean, play all notes together vs sequentially
- arpeggioDelay: Delay between chord notes in ms (0-200)

VISUAL PARAMETERS:
- sphereBrightness: Sphere glow intensity (0-1). Lower for dark moods, higher for bright
- selectedBackground: Choose from 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)', 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)', 'linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #ef4444 100%)', 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)', 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)', 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)', 'stars'

MOOD EXAMPLES:
- "dark and mysterious" -> Minor scales, low BPM, negative yTranslation, dark backgrounds
- "uplifting and hopeful" -> Major scales, moderate BPM, positive yTranslation, bright backgrounds
- "chaotic and dissonant" -> Chromatic/Whole Tone scales, fast rotations, high rhythm values
- "peaceful meditation" -> Pentatonic scales, slow BPM, gentle auto-movements
- "sci-fi tension" -> Persian/Arabic scales, auto-rotations, darker backgrounds
- "jazz club atmosphere" -> Blues scale, moderate BPM, warm backgrounds

Return ONLY a valid JSON object with this exact structure:
{
  "bpm": <number>,
  "rhythm": <number>,
  "selectedScale": <string>,
  "rootNote": <number>,
  "sphereCount": <number>,
  "yTranslation": <number>,
  "autoTranspose": <boolean>,
  "autoTransposeRange": <number>,
  "autoTransposeSpeed": <number>,
  "xRotation": <number>,
  "yRotation": <number>,
  "zRotation": <number>,
  "autoRotateX": <boolean>,
  "autoRotateY": <boolean>,
  "autoRotateZ": <boolean>,
  "autoRotateSpeedX": <number>,
  "autoRotateSpeedY": <number>,
  "autoRotateSpeedZ": <number>,
  "waveform": <string>,
  "envelope": {
    "a": <number>,
    "d": <number>,
    "s": <number>,
    "r": <number>
  },
  "isChordMode": <boolean>,
  "arpeggioDelay": <number>,
  "sphereBrightness": <number>,
  "selectedBackground": <string>
}`;

      const data = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            bpm: { type: "number", minimum: 40, maximum: 240 },
            rhythm: { type: "number", enum: [1, 2, 4, 8] },
            selectedScale: { 
              type: "string", 
              enum: ["Major", "Natural Minor", "Harmonic Minor", "Melodic Minor", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Locrian", "Chromatic", "Major Pentatonic", "Minor Pentatonic", "Blues", "Whole Tone", "Arabic (Bayati)", "Persian", "Gypsy", "Japanese (Insen)", "Egyptian", "Flamenco"]
            },
            rootNote: { type: "number", minimum: 0, maximum: 11 },
            sphereCount: { type: "number", minimum: 1, maximum: 8 },
            yTranslation: { type: "number", minimum: -36, maximum: 36 },
            autoTranspose: { type: "boolean" },
            autoTransposeRange: { type: "number", minimum: 1, maximum: 24 },
            autoTransposeSpeed: { type: "number", minimum: 0, maximum: 10 },
            xRotation: { type: "number", minimum: 0, maximum: 360 },
            yRotation: { type: "number", minimum: 0, maximum: 360 },
            zRotation: { type: "number", minimum: 0, maximum: 360 },
            autoRotateX: { type: "boolean" },
            autoRotateY: { type: "boolean" },
            autoRotateZ: { type: "boolean" },
            autoRotateSpeedX: { type: "number", minimum: 0, maximum: 10 },
            autoRotateSpeedY: { type: "number", minimum: 0, maximum: 10 },
            autoRotateSpeedZ: { type: "number", minimum: 0, maximum: 10 },
            waveform: { type: "string", enum: ["sine", "square", "sawtooth", "triangle"] },
            envelope: {
              type: "object",
              properties: {
                a: { type: "number", minimum: 0, maximum: 2 },
                d: { type: "number", minimum: 0, maximum: 2 },
                s: { type: "number", minimum: 0, maximum: 1 },
                r: { type: "number", minimum: 0, maximum: 2 }
              },
              required: ["a", "d", "s", "r"]
            },
            isChordMode: { type: "boolean" },
            arpeggioDelay: { type: "number", minimum: 0, maximum: 200 },
            sphereBrightness: { type: "number", minimum: 0, maximum: 1 },
            selectedBackground: { 
              type: "string",
              enum: [
                "linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)",
                "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
                "linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)",
                "linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #ef4444 100%)",
                "linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)",
                "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
                "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
                "stars"
              ]
            }
          },
          required: ["bpm", "rhythm", "selectedScale", "rootNote", "sphereCount", "yTranslation", "autoTranspose", "autoTransposeRange", "autoTransposeSpeed", "xRotation", "yRotation", "zRotation", "autoRotateX", "autoRotateY", "autoRotateZ", "autoRotateSpeedX", "autoRotateSpeedY", "autoRotateSpeedZ", "waveform", "envelope", "isChordMode", "arpeggioDelay", "sphereBrightness", "selectedBackground"]
        }
      });
      
      if (data && typeof data === 'object') {
        onMoodSettingsChange(data);
        setDescription('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("AI returned an invalid response.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate mood settings. Please try again.';
      console.error('Failed to generate mood:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const examplePrompts = [
    'dark and mysterious',
    'uplifting and hopeful',
    'chaotic and dissonant',
    'peaceful meditation',
    'sci-fi tension',
    'jazz club atmosphere',
    'ethereal dreamscape',
    'industrial dystopia',
    'tropical sunset',
    'cosmic journey',
    'ancient ritual',
    'cyberpunk chase scene'
  ];

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Palette className="w-4 h-4 text-fuchsia-400" />
          AI Musical Mood
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Describe the musical mood you want..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-8 text-xs bg-black/20 border-slate-600 text-white placeholder:text-slate-400"
            disabled={disabled || isGenerating || isLockedOut}
            title={isLockedOut ? 'Upgrade to use AI features' : undefined}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating || disabled || isLockedOut}
            size="sm"
            className={`flex-1 h-7 text-xs bg-pink-600 hover:bg-pink-700 disabled:opacity-50 ${isLockedOut ? 'cursor-not-allowed' : ''}`}
            title={isLockedOut ? 'Upgrade to use AI features' : undefined}
          >
            <Sparkles className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Create Mood'}
          </Button>
        </div>

        <div className="space-y-1">
          <Button
            onClick={() => setShowExamples(!showExamples)}
            variant="ghost"
            size="sm"
            className="w-full h-6 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 justify-between px-2"
          >
            <span>Examples</span>
            {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          
          {showExamples && (
            <div className="flex flex-wrap gap-1 pt-1">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setDescription(prompt)}
                  disabled={disabled || isGenerating || isLockedOut}
                  className={`text-xs px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded border border-slate-600/50 transition-colors disabled:opacity-50 ${isLockedOut ? 'cursor-not-allowed' : ''}`}
                  title={isLockedOut ? 'Upgrade to use AI features' : undefined}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>

        {success && (
          <div className="text-xs text-green-400 text-center p-2 bg-green-500/10 rounded">
            ✓ Musical mood applied successfully!
          </div>
        )}
        {error && (
          <div className="text-xs text-red-400 text-center p-2 bg-red-500/10 rounded">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
