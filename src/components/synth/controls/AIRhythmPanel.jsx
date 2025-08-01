
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, ChevronDown, ChevronUp, Zap } from 'lucide-react'; // Added Zap
// Import the integration directly, not a backend function
import { InvokeLLM } from '@/api/integrations';

export default function AIRhythmPanel({ 
  onRhythmChange,
  currentBpm,
  disabled,
  isLockedOut = false // New prop
}) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showExamples, setShowExamples] = useState(false); // New state for examples visibility

  const handleGenerate = async () => {
    if (!description.trim() || isGenerating || disabled || isLockedOut) return;
    
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      // The logic now lives in the frontend, calling the integration directly.
      const prompt = `You are a music production assistant. A user has described a rhythm for a synthesizer. Your job is to translate their description into BPM (beats per minute) and a rhythm value.

The rhythm value determines the note division for the sequencer:
- 1: Quarter notes (slow, basic pulse)
- 2: Eighth notes (standard, walking pace)
- 4: Sixteenth notes (fast, running pace)
- 8: 32nd notes (very fast, frantic)

User's Description: "${description}"
Current BPM for context: ${currentBpm}

Based on the description, determine the most appropriate BPM and rhythm value. For example:
- "slow pulsing drone" -> { "bpm": 80, "rhythm": 1 }
- "standard techno beat" -> { "bpm": 130, "rhythm": 4 }
- "fast, frantic arpeggio" -> { "bpm": 160, "rhythm": 8 }
- "a relaxed walking bassline" -> { "bpm": 110, "rhythm": 2 }

Return ONLY a valid JSON object with this exact structure:
{
  "bpm": <number>,
  "rhythm": <number>
}`;

      // Call the integration directly from the component
      const data = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            bpm: { 
              type: "number",
              description: "The suggested beats per minute, between 40 and 240."
            },
            rhythm: { 
              type: "number",
              description: "The note division value.",
              enum: [1, 2, 4, 8]
            }
          },
          required: ["bpm", "rhythm"]
        }
      });
      
      if (data && typeof data.bpm === 'number' && typeof data.rhythm === 'number') {
        const cleanedData = {
          bpm: Math.max(40, Math.min(240, data.bpm)),
          rhythm: data.rhythm
        };
        onRhythmChange(cleanedData);
        setDescription(''); // Clear input after successful generation
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000); // Hide success message after 2s
      } else {
          throw new Error(data.error || "AI returned an invalid response.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate rhythm. Please try again.';
      console.error('Failed to generate rhythm:', errorMessage);
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
    'fast arpeggio',
    'slow pulse', 
    'standard techno',
    'walking bassline',
    'driving allegro beat',
    'slow adagio tempo',
    'lively allegro passage',
    'graceful waltz',
    'flowing baroque melody',
    'stately march tempo',
    'dramatic build-up'
  ];

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-fuchsia-400" />
          AI Rhythm Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Describe a rhythm for the spheres..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-8 text-xs bg-black/20 border-slate-600 text-white placeholder:text-slate-400"
            disabled={disabled || isGenerating || isLockedOut}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating || disabled || isLockedOut}
            size="sm"
            className={`flex-1 h-7 text-xs bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 ${isLockedOut ? 'cursor-not-allowed' : ''}`}
            title={isLockedOut ? 'Upgrade to use AI features' : undefined}
          >
            <Sparkles className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Set Rhythm'}
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
            ✓ Rhythm controls updated!
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
