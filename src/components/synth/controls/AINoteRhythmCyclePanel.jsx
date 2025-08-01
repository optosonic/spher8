
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Music3, RotateCcw, ChevronDown, ChevronUp, Zap } from 'lucide-react'; // Added Zap
import { InvokeLLM } from '@/api/integrations';

// Standard rhythmic subdivisions including tuplets
const RHYTHM_SUBDIVISIONS = {
  1: { label: '♩', name: 'Quarter', value: 1, color: '#3b82f6' },
  2: { label: '♪', name: 'Eighth', value: 2, color: '#10b981' },
  3: { label: '♪₃', name: 'Triplet', value: 3, color: '#f59e0b' },
  4: { label: '♬', name: 'Sixteenth', value: 4, color: '#ef4444' },
  5: { label: '♬₅', name: 'Quintuplet', value: 5, color: '#8b5cf6' },
  6: { label: '♬₆', name: 'Sextuplet', value: 6, color: '#ec4899' },
  8: { label: '♫', name: '32nd', value: 8, color: '#06b6d4' },
  0.5: { label: '♩.', name: 'Half', value: 0.5, color: '#6366f1' },
  0.25: { label: '𝅗𝅥', name: 'Whole', value: 0.25, color: '#84cc16' }
};

const RhythmVisualizer = ({ 
  rhythmPattern, 
  cycleLength, 
  onCycleLengthChange, 
  currentSphereCount,
  onPatternClick 
}) => {
  const trackRef = useRef(null);
  const dragStateRef = useRef(null);

  const getTimeFromX = useCallback((clientX) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(percent * 32); // Max 32 steps
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragStateRef.current) return;
    e.preventDefault();

    const { initialLength, startX } = dragStateRef.current;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;
    const lengthChange = Math.round(deltaX / 20); // Sensitivity
    
    const newLength = Math.max(currentSphereCount, Math.min(32, initialLength + lengthChange));
    onCycleLengthChange(newLength);
  }, [currentSphereCount, onCycleLengthChange]);

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = null;
    document.removeEventListener('mousemove', handlePointerMove);
    document.removeEventListener('mouseup', handlePointerUp);
    document.removeEventListener('touchmove', handlePointerMove);
    document.removeEventListener('touchend', handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback((e) => {
    if (!trackRef.current) return;
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clickStep = getTimeFromX(clientX);
    
    // If clicking on pattern, allow editing
    if (clickStep < rhythmPattern.length && onPatternClick) {
      onPatternClick(clickStep);
      return;
    }
    
    // Otherwise, start dragging to resize cycle
    dragStateRef.current = { 
      initialLength: cycleLength,
      startX: clientX
    };
    
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handlePointerUp);
  }, [cycleLength, getTimeFromX, handlePointerMove, handlePointerUp, onPatternClick, rhythmPattern.length]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Rhythm Cycle Pattern</span>
        <span>{cycleLength} steps ({currentSphereCount} spheres)</span>
      </div>
      
      <div 
        ref={trackRef}
        className="relative h-16 bg-black/20 rounded border border-white/10 overflow-hidden cursor-pointer select-none"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        style={{ touchAction: 'none' }}
      >
        {/* Grid lines */}
        {Array.from({ length: Math.min(32, cycleLength) }, (_, i) => (
          <div
            key={`grid-${i}`}
            className="absolute top-0 bottom-0 border-l border-white/5"
            style={{ left: `${(i / cycleLength) * 100}%` }}
          />
        ))}
        
        {/* Sphere count indicator */}
        <div
          className="absolute top-0 bottom-0 bg-blue-500/20 border-r-2 border-blue-400"
          style={{ width: `${(currentSphereCount / cycleLength) * 100}%` }}
        />
        
        {/* Rhythm pattern visualization */}
        {Array.from({ length: cycleLength }, (_, index) => {
          const subdivision = rhythmPattern[index] || 1; // Default to 1 if pattern is shorter
          const subdivisionInfo = RHYTHM_SUBDIVISIONS[subdivision] || RHYTHM_SUBDIVISIONS[1];
          const isInSphereRange = index < currentSphereCount;
          
          return (
            <div
              key={`step-${index}`}
              className={`absolute top-1 bottom-1 rounded-sm border transition-all duration-150 ${
                isInSphereRange ? 'opacity-100' : 'opacity-60 border-dashed'
              }`}
              style={{
                left: `${(index / cycleLength) * 100}%`,
                width: `${(1 / cycleLength) * 100}%`,
                backgroundColor: subdivisionInfo.color + '40',
                borderColor: subdivisionInfo.color,
                marginLeft: '1px',
                marginRight: '1px'
              }}
              title={`Step ${index + 1}: ${subdivisionInfo.name} (${subdivision})`}
            >
              <div className="flex items-center justify-center h-full text-xs font-bold text-white">
                {subdivisionInfo.label}
              </div>
            </div>
          );
        })}
        
        {/* Cycle length handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-yellow-400 cursor-ew-resize opacity-70 hover:opacity-100"
          style={{ left: `${100}%`, marginLeft: '-2px' }}
          title="Drag to adjust cycle length"
        />
      </div>
      
      <div className="text-xs text-slate-500 text-center">
        Click pattern to edit • Drag right edge to extend cycle
      </div>
    </div>
  );
};

export default function AINoteRhythmCyclePanel({ 
  notes,
  onNoteRhythmChange,
  currentBpm,
  disabled,
  rhythmPattern,
  onRhythmPatternChange,
  cycleLength,
  onCycleLengthChange,
  repeatMode,
  onRepeatModeChange,
  isLockedOut = false 
}) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // Directly use props. No more internal useEffects to sync state.
  // The parent component is now the single source of truth.
  const currentRhythmPattern = rhythmPattern || [];
  const currentCycleLength = cycleLength || 0;

  const handleGenerate = async () => {
    console.log('Generate button clicked', { description: description.trim(), isGenerating, disabled, isLockedOut });
    
    if (!description.trim() || isGenerating || disabled || isLockedOut) {
      console.log('Generate blocked:', { 
        hasDescription: !!description.trim(), 
        isGenerating, 
        disabled,
        isLockedOut
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Starting AI generation with cycleLength:', currentCycleLength);
      
      const noteInfo = notes.map((note, index) => ({
        index,
        frequency: note.liveFrequency || note.frequency,
        scaleDegree: note.scaleDegree,
        position: note.position,
        currentRhythm: note.rhythmSubdivision || 1
      }));

      const prompt = `You are an expert rhythm programmer and music producer. Create a rhythmic pattern based on the user's description.

Current Context:
- Number of spheres/notes: ${notes.length}
- Cycle length: ${currentCycleLength} steps
- Current BPM: ${currentBpm}
- Note details: ${JSON.stringify(noteInfo)}

Available rhythm subdivisions:
- 0.25: Whole note (very slow)
- 0.5: Half note (slow)
- 1: Quarter note (basic pulse)
- 2: Eighth note (standard)
- 3: Eighth note triplet
- 4: Sixteenth note (fast)
- 5: Sixteenth quintuplet
- 6: Sixteenth sextuplet  
- 8: Thirty-second note (very fast)

A separate "Repeat Mode" selector exists in the UI with three options:
1. Off: Each step plays one note.
2. Ratchet: A rhythm value of 'X' will automatically repeat the *same* note 'X' times.
3. Flow: A rhythm value of 'X' will play the *next X notes in sequence* (arpeggio style).

Therefore, you should ONLY focus on assigning the core numeric rhythmic subdivision value.

User's description: "${description}"

Create a rhythmic pattern of exactly ${currentCycleLength} numeric values from the list above. The pattern will cycle through the notes repeatedly.

Return a JSON object with the rhythm pattern:`;

      console.log('Sending prompt to AI:', prompt);

      const data = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            rhythmPattern: {
              type: "array",
              items: {
                type: "number",
                enum: [0.25, 0.5, 1, 2, 3, 4, 5, 6, 8]
              },
              minItems: currentCycleLength,
              maxItems: currentCycleLength,
              description: `Array of ${currentCycleLength} rhythm subdivision values.`
            },
            explanation: {
              type: "string",
              description: "Brief explanation of the rhythmic choices made"
            }
          },
          required: ["rhythmPattern"]
        }
      });
      
      console.log('AI response received:', data);
      
      if (data && Array.isArray(data.rhythmPattern) && data.rhythmPattern.length === currentCycleLength) {
        console.log('Applying rhythm pattern:', data.rhythmPattern);
        applyRhythmPattern(data.rhythmPattern);
        setDescription('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        console.error('Invalid AI response:', data);
        throw new Error("AI returned invalid rhythm pattern");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate rhythm pattern. Please try again.';
      console.error('Failed to generate rhythm pattern:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyRhythmPattern = (pattern) => {
    console.log('Applying pattern:', pattern);
    // Update the pattern in parent state
    onRhythmPatternChange(pattern);
    
    // Apply the pattern cyclically to all notes for individual note rhythm tracking
    notes.forEach((note, index) => {
      const patternIndex = index % pattern.length;
      const newRhythm = pattern[patternIndex];
      console.log(`Setting note ${index} rhythm to ${newRhythm}`);
      onNoteRhythmChange(index, newRhythm);
    });
  };

  const handlePatternClick = (stepIndex) => {
    // Cycle through common numeric subdivisions only
    const currentValue = currentRhythmPattern[stepIndex];
    const commonValues = [1, 2, 4, 3, 8, 0.5];

    const currentIndex = commonValues.indexOf(currentValue);
    const nextValue = commonValues[(currentIndex + 1) % commonValues.length];
    
    const newPattern = [...currentRhythmPattern];
    newPattern[stepIndex] = nextValue;
    applyRhythmPattern(newPattern);
  };

  const handleReset = () => {
    const resetPattern = Array(currentCycleLength).fill(1);
    applyRhythmPattern(resetPattern);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const examplePrompts = [
    'driving techno pattern',
    'syncopated jazz rhythm',
    'polyrhythmic complexity',
    'smooth flowing triplets',
    'aggressive breakbeat',
    'ambient slow pulse',
    'latin clave pattern',
    'minimalist repetition',
    'cyberpunk chase scene'
  ];

  const repeatModes = [
    { value: 'off', label: 'Off', description: 'Normal: Each step plays one note.' },
    { value: 'ratchet', label: 'Ratchet', description: 'Repeats the same note for the step.' },
    { value: 'flow', label: 'Flow', description: 'Plays the next notes in sequence.' }
  ];

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-fuchsia-400" />
          AI Note Rhythm Cycle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <RhythmVisualizer
          rhythmPattern={currentRhythmPattern}
          cycleLength={currentCycleLength}
          onCycleLengthChange={onCycleLengthChange}
          currentSphereCount={notes.length}
          onPatternClick={handlePatternClick}
        />

        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Describe the rhythm pattern you want..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-8 text-xs bg-black/20 border-slate-600 text-white placeholder:text-slate-400"
            disabled={disabled || isGenerating}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating || disabled || isLockedOut}
            size="sm"
            className={`flex-1 h-7 text-xs bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 ${isLockedOut ? 'cursor-not-allowed' : ''}`}
            title={isLockedOut ? 'Upgrade to use AI features' : undefined}
          >
            <Sparkles className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Pattern'}
          </Button>
          
          <Button
            onClick={handleReset}
            disabled={disabled || isLockedOut}
            size="sm"
            variant="outline"
            className={`h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700 ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isLockedOut ? 'Upgrade to modify patterns' : undefined}
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-300 font-medium text-center">Repeat Mode</div>
          <div className="grid grid-cols-3 gap-1">
            {repeatModes.map((mode) => (
              <Button
                key={mode.value}
                onClick={() => onRepeatModeChange(mode.value)}
                variant="ghost"
                size="sm"
                className={`h-8 text-xs transition-colors rounded-md ${
                  repeatMode === mode.value
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                } ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={disabled || isLockedOut}
                title={isLockedOut ? 'Upgrade to modify patterns' : mode.description}
              >
                {mode.label}
              </Button>
            ))}
          </div>
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
            ✓ Rhythm pattern applied to all notes!
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
