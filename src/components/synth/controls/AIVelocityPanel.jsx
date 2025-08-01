
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RangeSlider from '@/components/ui/range-slider';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Zap, ChevronDown, ChevronUp } from 'lucide-react'; // Changed Volume2 to Zap
import { InvokeLLM } from '@/api/integrations';

export default function AIVelocityPanel({ 
  notes,
  onVelocityChange,
  disabled,
  isLockedOut = false // New prop
}) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [globalVelocity, setGlobalVelocity] = useState(80);
  const [showExamples, setShowExamples] = useState(false);

  const handleAIGenerate = async () => {
    if (!description.trim() || isGenerating || disabled || notes.length === 0 || isLockedOut) return;
    
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      // Create note context for the AI
      const noteContext = notes.map((note, index) => ({
        index,
        frequency: note.liveFrequency || note.frequency,
        scaleDegree: note.scaleDegree || 0,
        currentVelocity: note.midiVelocity || 100,
        position: note.position
      }));

      const prompt = `You are a music production assistant specializing in MIDI velocity control. A user has described how they want the velocities (dynamics) of their notes to behave.

Current notes context:
${noteContext.map(n => `Note ${n.index}: ${n.frequency.toFixed(1)}Hz, Scale degree: ${n.scaleDegree}, Current velocity: ${n.currentVelocity}`).join('\n')}

User's velocity description: "${description}"

Based on the description, assign appropriate MIDI velocity values (1-127) to each note. Consider:
- Higher notes often have different dynamics than lower notes
- Musical phrases should have natural velocity curves
- Scale degrees can inform accent patterns
- Spatial positioning might affect perceived loudness

Common velocity interpretations:
- "crescendo" or "building up" -> gradual increase from low to high
- "diminuendo" or "fading" -> gradual decrease from high to low
- "accent the bass" -> higher velocity for lower frequencies
- "bright and punchy" -> generally higher velocities (90-127)
- "soft and gentle" -> lower velocities (40-80)
- "alternating dynamics" -> varying pattern between high and low
- "emphasize the melody" -> higher velocity for higher scale degrees

Return a JSON array with velocity values for each note in order:
[velocity1, velocity2, velocity3, ...]`;

      const data = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            velocities: {
              type: "array",
              items: {
                type: "number",
                minimum: 1,
                maximum: 127
              },
              description: "Array of velocity values for each note in order"
            },
            explanation: {
              type: "string",
              description: "Brief explanation of the velocity pattern applied"
            }
          },
          required: ["velocities"]
        }
      });
      
      if (data && data.velocities && Array.isArray(data.velocities)) {
        const velocities = data.velocities.slice(0, notes.length); // Ensure we don't exceed note count
        
        // Apply the AI-generated velocities to each note
        velocities.forEach((velocity, index) => {
          if (index < notes.length) {
            const clampedVelocity = Math.max(1, Math.min(127, Math.round(velocity)));
            onVelocityChange(index, clampedVelocity);
          }
        });
        
        setDescription('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("AI returned an invalid response.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate velocities. Please try again.';
      console.error('Failed to generate velocities:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGlobalVelocityChange = (newValue) => {
    if (isLockedOut) return; // Prevent change if locked out
    setGlobalVelocity(newValue);
    // Apply the global velocity to all notes
    notes.forEach((note, index) => {
      onVelocityChange(index, newValue);
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAIGenerate();
    }
  };

  const examplePrompts = [
    'crescendo from soft to loud',
    'accent the bass notes',
    'bright and punchy',
    'soft and gentle',
    'alternating strong and weak',
    'emphasize the melody',
    'diminuendo fade out',
    'jazz swing accents'
  ];

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-fuchsia-400" />
          AI Velocity Randomizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {/* Global Velocity Slider */}
        <div>
          {/* MASTER VELOCITY SLIDER REPLACEMENT */}
          <RangeSlider
            label="Global Velocity"
            value={globalVelocity}
            onChange={(v) => handleGlobalVelocityChange(v)}
            min={1}
            max={127}
            step={1}
            thickness="thick"
            labelSize = 'text-sm'
            valueSize = 'text-xs'
            disabled={disabled || notes.length === 0 || isLockedOut}
            boldLabel={false}
          />
        </div>

        <div className="border-t border-white/10 pt-2">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Describe velocity pattern..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-8 text-xs bg-black/20 border-slate-600 text-white placeholder:text-slate-400"
              disabled={disabled || isGenerating || notes.length === 0 || isLockedOut}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              onClick={handleAIGenerate}
              disabled={!description.trim() || isGenerating || disabled || notes.length === 0 || isLockedOut}
              size="sm"
              className={`flex-1 h-7 text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 ${isLockedOut ? 'cursor-not-allowed' : ''}`}
              title={isLockedOut ? 'Upgrade to use AI features' : undefined}
            >
              <Sparkles className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Apply AI Velocities'}
            </Button>
          </div>

          <div className="space-y-1 mt-2">
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
                    disabled={disabled || isGenerating || notes.length === 0 || isLockedOut}
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
            <div className="text-xs text-green-400 text-center p-2 bg-green-500/10 rounded mt-2">
              ✓ AI velocities applied successfully!
            </div>
          )}
          {error && (
            <div className="text-xs text-red-400 text-center p-2 bg-red-500/10 rounded mt-2">
              {error}
            </div>
          )}
          
          {notes.length === 0 && (
            <div className="text-xs text-slate-500 text-center p-2 mt-2">
              Add some notes to use velocity control
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
