
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dial } from './Dial';
import { Waves, ArrowUp, ArrowDown, PlusCircle } from 'lucide-react';

const ROOT_NOTES_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIN_ROOT_NOTE = 21; // A0
const MAX_ROOT_NOTE = 60; // C4

// Helper function to convert MIDI to Frequency
const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Helper function to convert Frequency to MIDI
const freqToMidi = (freq) => Math.round(12 * Math.log2(freq / 440) + 69);

// Helper to get note name from MIDI
const midiToNoteName = (midi) => {
  if (midi < 0 || midi > 127) return '';
  const octave = Math.floor(midi / 12) - 1;
  const noteName = ROOT_NOTES_NAMES[midi % 12];
  return `${noteName}${octave}`;
};

const calculateHarmonicSeries = (baseMidi) => {
  const baseFreq = midiToFreq(baseMidi);
  const harmonicsData = {};
  const MAX_HARMONICS = 16;

  for (let h = 2; h <= MAX_HARMONICS; h++) {
    const harmonicFreq = baseFreq * h;
    const harmonicMidi = freqToMidi(harmonicFreq);
    const octave = Math.floor(harmonicMidi / 12) - 1;
    
    if (!harmonicsData[octave]) {
      harmonicsData[octave] = [];
    }
    
    // Avoid duplicate notes in the same octave
    if (!harmonicsData[octave].some(n => n.midi === harmonicMidi)) {
      harmonicsData[octave].push({
        midi: harmonicMidi,
        name: midiToNoteName(harmonicMidi),
        harmonicNumber: h,
      });
    }
  }
  return harmonicsData;
};


export default function HarmonicSeriesPanel({ onCreateNoteSequence, disabled }) {
  const [rootNote, setRootNote] = useState(48); // Start at C3
  const [harmonics, setHarmonics] = useState({});
  const [selectedNotes, setSelectedNotes] = useState({});
  const [octaveShifts, setOctaveShifts] = useState({});

  useEffect(() => {
    const newHarmonics = calculateHarmonicSeries(rootNote);
    setHarmonics(newHarmonics);
    // Don't reset selections when root changes - keep them selected
    
    // Initialize octave shifts for new harmonics
    const initialShifts = {};
    Object.keys(newHarmonics).forEach(octave => {
      initialShifts[octave] = 0;
    });
    setOctaveShifts(initialShifts);
  }, [rootNote]);

  const handleNoteToggle = (octave, note) => {
    const key = `${octave}-${note.midi}`;
    setSelectedNotes(prev => {
      const newSelection = { ...prev };
      if (newSelection[key]) {
        delete newSelection[key];
      } else {
        newSelection[key] = { ...note, originalOctave: octave };
      }
      return newSelection;
    });
  };

  const handleOctaveShift = (octave, direction) => {
    setOctaveShifts(prev => ({
      ...prev,
      [octave]: (prev[octave] || 0) + direction,
    }));
  };

  const handleCreateSpheres = () => {
    if (Object.keys(selectedNotes).length === 0) return;

    const notesForSequence = Object.values(selectedNotes).map((note, index) => {
      const shift = octaveShifts[note.originalOctave] || 0;
      const finalMidi = note.midi + (shift * 12);
      
      return {
        midiNote: finalMidi,
        position: { // Simple spiral positioning
          x: Math.cos(index * 0.8) * (2 + index * 0.3),
          y: (Math.random() - 0.5) * 2,
          z: Math.sin(index * 0.8) * (2 + index * 0.3)
        }
      };
    });
    
    onCreateNoteSequence(notesForSequence, true); // true to reset existing spheres
    // Don't clear selection after creation - keep notes selected
  };

  const handleReset = () => {
    setSelectedNotes({});
  };
  
  const rootNoteName = midiToNoteName(rootNote);
  const orderedOctaves = Object.keys(harmonics).map(Number).sort((a, b) => a - b);

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Waves className="w-4 h-4 text-cyan-400" />
          Harmonic Series
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
             <Dial
                value={rootNote}
                min={MIN_ROOT_NOTE}
                max={MAX_ROOT_NOTE}
                step={1}
                onChange={setRootNote}
                label="Root Note"
                unit={rootNoteName}
                disabled={disabled}
              />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              onClick={handleCreateSpheres}
              disabled={disabled || Object.keys(selectedNotes).length === 0}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 h-10"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create
            </Button>
            <Button
              onClick={handleReset}
              disabled={disabled || Object.keys(selectedNotes).length === 0}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs border-slate-600 text-slate-400 hover:bg-slate-600 hover:text-white"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="text-xs text-slate-400 text-center -my2">
          Select notes from series
        </div>

        <div className="space-y-1 max-h-52 overflow-y-auto">
            {orderedOctaves.length === 0 && <p className="text-xs text-slate-400 text-center">Select a root note.</p>}
            {orderedOctaves.map(octave => {
              const currentShift = octaveShifts[octave] || 0;
              return (
                <div key={octave} className="p-0.5 bg-indigo-700/20 border-slate-400/50 rounded border">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-300">Octave {octave}</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${currentShift > 0 ? 'text-green-400' : currentShift < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                                {currentShift > 0 ? `+${currentShift}` : currentShift} Oct
                            </span>
                            <Button size="icon" variant="default" className="h-5 w-5 bg-green-700 hover:bg-green-300 text-black" onClick={() => handleOctaveShift(octave, -1)} disabled={disabled}>
                                <ArrowDown className="w-3 h-3"/>
                            </Button>
                            <Button size="icon" variant="default" className="h-5 w-5 bg-blue-700 hover:bg-blue-300 text-black" onClick={() => handleOctaveShift(octave, 1)} disabled={disabled}>
                                <ArrowUp className="w-3 h-3"/>
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {harmonics[octave].map(note => {
                            const key = `${octave}-${note.midi}`;
                            const isSelected = !!selectedNotes[key];
                            const shiftedMidi = note.midi + (currentShift * 12);
                            
                            return (
                                <Button
                                    key={note.midi}
                                    onClick={() => handleNoteToggle(octave, note)}
                                    variant={isSelected ? "default" : "secondary"}
                                    size="sm"
                                    className={`h-3 px-1 text-xs transition-all ${
                                        isSelected 
                                        ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                    }`}
                                    disabled={disabled}
                                    title={`Harmonic #${note.harmonicNumber}`}
                                >
                                    {midiToNoteName(shiftedMidi)}
                                </Button>
                            );
                        })}
                    </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
