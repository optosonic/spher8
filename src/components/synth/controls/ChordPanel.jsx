
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Music, AlertTriangle } from 'lucide-react'; // Changed Music2 to Music
import { ROOT_NOTES, SCALES } from '../scales';
import Dial from './Dial';

const CHORDS = {
  'Major triad': [0, 4, 7],
  'Minor triad': [0, 3, 7],
  'Augmented triad': [0, 4, 8],
  'Diminished triad': [0, 3, 6],
  'Dominant seventh': [0, 4, 7, 10],
  'Major seventh': [0, 4, 7, 11],
  'Minor-major seventh': [0, 3, 7, 11],
  'Minor seventh': [0, 3, 7, 10],
  'Augmented-major seventh': [0, 4, 8, 11],
  'Augmented seventh': [0, 4, 8, 10],
  'Half-diminished seventh': [0, 3, 6, 10],
  'Diminished seventh': [0, 3, 6, 10],
  'Dominant seventh flat five': [0, 4, 6, 10],
  'Major ninth': [0, 4, 7, 11, 14],
  'Dominant ninth': [0, 4, 7, 10, 14],
  'Dominant minor ninth': [0, 4, 7, 10, 13],
  'Minor-major ninth': [0, 3, 7, 11, 14],
  'Minor ninth': [0, 3, 7, 10, 14],
  'Augmented major ninth': [0, 4, 8, 11, 14],
  'Augmented dominant ninth': [0, 4, 8, 10, 14],
  'Half-diminished ninth': [0, 3, 6, 10, 14],
  'Half-diminished minor ninth': [0, 3, 6, 10, 13],
  'Diminished ninth': [0, 3, 6, 10, 14],
  'Diminished minor ninth': [0, 3, 6, 10, 13],
};

export default function ChordPanel({ 
  onCreateNoteSequence, 
  rootNote, 
  onRootNoteChange,
  selectedScale,
  disabled 
}) {
  const [selectedChord, setSelectedChord] = useState('Major triad');
  const [forceToScale, setForceToScale] = useState(false);

  // Function to find the closest scale degree for a given chromatic interval
  const mapToScale = (chromaticInterval, scaleIntervals) => {
    // Normalize the chromatic interval to be within an octave
    const normalizedInterval = ((chromaticInterval % 12) + 12) % 12;
    
    // Find the closest scale interval
    let closestInterval = scaleIntervals[0];
    let minDistance = Math.abs(normalizedInterval - closestInterval);
    
    scaleIntervals.forEach(scaleInterval => {
      const distance = Math.abs(normalizedInterval - scaleInterval);
      if (distance < minDistance) {
        minDistance = distance;
        closestInterval = scaleInterval;
      }
    });
    
    // Preserve the octave information
    const octaveOffset = Math.floor(chromaticInterval / 12) * 12;
    return octaveOffset + closestInterval;
  };

  // Function to check if an interval is in the scale
  const isInScale = (chromaticInterval, scaleIntervals) => {
    const normalizedInterval = ((chromaticInterval % 12) + 12) % 12;
    return scaleIntervals.includes(normalizedInterval);
  };

  // Get analysis of current chord vs selected scale
  const getChordAnalysis = () => {
    const intervals = CHORDS[selectedChord] || [];
    const scaleIntervals = SCALES[selectedScale] || [];
    
    return intervals.map(interval => {
      const inScale = isInScale(interval, scaleIntervals);
      const mappedInterval = forceToScale ? mapToScale(interval, scaleIntervals) : interval;
      const originalNote = ROOT_NOTES[(rootNote + interval) % 12];
      const mappedNote = ROOT_NOTES[(rootNote + mappedInterval) % 12];
      
      return {
        original: interval,
        mapped: mappedInterval,
        originalNote,
        mappedNote,
        inScale,
        changed: interval !== mappedInterval
      };
    });
  };

  const handleChordSelect = () => {
    if (disabled) return;

    const intervals = CHORDS[selectedChord] || [];
    if (intervals.length === 0) return;

    const scaleIntervals = SCALES[selectedScale] || [];
    
    // Create note data for each interval in the chord
    const chordNotes = intervals.map((interval, index) => {
      // Apply scale mapping if enabled
      const finalInterval = forceToScale ? mapToScale(interval, scaleIntervals) : interval;
      const baseMidiNote = 60 + rootNote + finalInterval; // Middle C + root + interval
      
      // Arrange spheres in a gentle arc formation
      const totalNotes = intervals.length;
      const spacing = Math.min(3, 12 / totalNotes); // Adaptive spacing based on chord size
      const startX = -(totalNotes - 1) * spacing / 2;
      const xPosition = startX + (index * spacing);
      
      // Add slight vertical variation for visual interest
      const yVariation = Math.sin(index * Math.PI / (totalNotes - 1)) * 0.5;
      
      return {
        position: { 
          x: xPosition, 
          y: yVariation, 
          z: 0 
        },
        midiNote: baseMidiNote,
      };
    });

    // Reset sequence and create the chord structure
    onCreateNoteSequence(chordNotes, true);
  };

  const chordNames = Object.keys(CHORDS);
  const chordAnalysis = getChordAnalysis();
  const hasOutOfScaleNotes = chordAnalysis.some(note => !note.inScale);

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Music className="w-4 h-4 text-cyan-400" /> {/* Changed Music2 to Music and color */}
          Chord {/* Changed title text */}
          {hasOutOfScaleNotes && !forceToScale && (
            <AlertTriangle className="w-3 h-3 text-yellow-400" title="Some chord notes are outside the selected scale" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-col items-center">
            <label className="text-xs text-slate-300 mb-1 block">Root</label>
            <Dial
              value={rootNote}
              onChange={(value) => onRootNoteChange(Math.round(value))}
              min={0}
              max={11}
              label={ROOT_NOTES[rootNote]}
              size="small"
            />
          </div>
          <div className="flex-2">
            <label className="text-xs text-slate-300 mb-1 block">Chord Type</label>
            <Select value={selectedChord} onValueChange={setSelectedChord}>
              <SelectTrigger className="h-7 text-xs bg-black/20 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {chordNames.map((chordName) => (
                  <SelectItem key={chordName} value={chordName} className="text-xs">
                    {chordName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scale Mapping Option */}
        <div className="flex items-center space-x-2 bg-black/20 p-2 rounded">
          <Checkbox
            id="force-to-scale"
            checked={forceToScale}
            onCheckedChange={setForceToScale}
            className="h-4 w-4 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 border-slate-400 data-[state=unchecked]:bg-slate-700"
          />
          <label htmlFor="force-to-scale" className="text-xs text-slate-300 cursor-pointer">
            Force to Scale ({selectedScale})
          </label>
        </div>

        <div className="border-t border-white/10 pt-2">
          {/* Chord Notes Analysis */}
          <div className="flex justify-center gap-1 flex-wrap mb-2">
            {chordAnalysis.map((noteInfo, index) => (
              <div key={`note-${index}`} className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-8 h-6 text-xs font-semibold rounded border ${
                    noteInfo.inScale 
                      ? 'bg-green-900/50 text-green-300 border-green-600/50' 
                      : noteInfo.changed
                        ? 'bg-blue-900/50 text-blue-300 border-blue-600/50'
                        : 'bg-yellow-900/50 text-yellow-300 border-yellow-600/50'
                  }`}
                  title={
                    noteInfo.inScale 
                      ? `${noteInfo.originalNote} - In scale`
                      : noteInfo.changed
                        ? `${noteInfo.originalNote} → ${noteInfo.mappedNote} (mapped to scale)`
                        : `${noteInfo.originalNote} - Outside scale`
                  }
                >
                  {forceToScale ? noteInfo.mappedNote : noteInfo.originalNote}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {forceToScale ? noteInfo.mapped : noteInfo.original}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-2 mb-2 text-xs">
            <Badge variant="outline" className="bg-green-900/30 border-green-600/50 text-green-300">In Scale</Badge>
            {hasOutOfScaleNotes && !forceToScale && (
              <Badge variant="outline" className="bg-yellow-900/30 border-yellow-600/50 text-yellow-300">Outside</Badge>
            )}
            {forceToScale && chordAnalysis.some(n => n.changed) && (
              <Badge variant="outline" className="bg-blue-900/30 border-blue-600/50 text-blue-300">Mapped</Badge>
            )}
          </div>

          <Button
            onClick={handleChordSelect}
            size="sm"
            className="w-full h-7 text-xs bg-orange-700 hover:bg-orange-600 disabled:opacity-50"
            disabled={disabled}
            title={`Create ${ROOT_NOTES[rootNote]} ${selectedChord} ${forceToScale ? '(mapped to scale)' : '(chromatic)'}`}
          >
            Create {ROOT_NOTES[rootNote]} {selectedChord}
          </Button>

          <div className="text-xs text-slate-400 text-center mt-2">
            Creates {chordAnalysis.length} spheres in chord formation
            {forceToScale && <div>Notes will be mapped to {selectedScale} scale</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
