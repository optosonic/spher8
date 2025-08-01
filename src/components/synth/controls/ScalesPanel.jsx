
import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Music2 } from 'lucide-react'; // Added Music2
import Dial from './Dial';
import { SCALES, ROOT_NOTES } from '../scales';

// Musical staff component
const MusicalStaff = ({ rootNote, intervals, noteNames }) => {
  // --- Constants for staff layout ---
  const staffLineY = [20, 28, 36, 44, 52]; // 8px interline distance
  const staffBottom = staffLineY[4];
  const lineSpacing = 8;
  const noteSpacingX = 22;
  const startX = 55;

  // --- MIDI to Staff Position Calculation ---
  const midiToStaffPos = (midi) => {
    // Reference: E4 (bottom line of treble clef) is MIDI 64, staff pos 0
    const diatonicPitchMap = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // Steps from C
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    const diatonicPitch = diatonicPitchMap[noteIndex];
    // Position relative to C4 (Middle C)
    const posFromC4 = (octave - 4) * 7 + diatonicPitch;
    // Position relative to E4 (bottom staff line). C4 is 2 steps below E4.
    return posFromC4 - 2;
  };

  // Assume root note is in the 4th octave (around middle C)
  const baseMidi = 60 + rootNote;
  const midiNotes = intervals.map(interval => baseMidi + interval);

  // --- Helper for rendering ---
  const isSharp = (noteName) => noteName.includes('#');
  const isFlat = (noteName) => noteName.includes('b');

  return (
    <div className="relative bg-black/10 rounded p-2 overflow-x-auto">
      <svg width="240" height="80" viewBox="0 0 240 80" className="min-w-full">
        {/* Staff lines */}
        {staffLineY.map((y, index) => (
          <line key={index} x1="15" y1={y} x2="225" y2={y} stroke="#64748b" strokeWidth="1" />
        ))}
        
        {/* Treble clef - Bigger */}
        <text x="18" y="47" fill="#94a3b8" fontSize="38" fontFamily="serif" style={{ fontKerning: 'none' }}>𝄞</text>
        
        {/* Notes */}
        {midiNotes.map((midi, index) => {
          const staffPos = midiToStaffPos(midi);
          const x = startX + (index * noteSpacingX);
          // Y position calculated from the bottom line, moving up. Each step is half a line spacing.
          const y = staffBottom - (staffPos * (lineSpacing / 2));
          const noteName = noteNames[index];

          // --- Ledger Lines ---
          const ledgerLines = [];
          // Below staff (Middle C is at staffPos -2)
          if (staffPos <= -2) {
            for (let p = -2; p >= staffPos; p -= 2) {
              const lineY = staffBottom - (p * (lineSpacing / 2));
              ledgerLines.push(<line key={`l-b-${p}`} x1={x-7} y1={lineY} x2={x+7} y2={lineY} stroke="#64748b" strokeWidth="1" />);
            }
          }
          // Above staff (A5 is at staffPos 8)
          if (staffPos >= 8) {
             for (let p = 8; p <= staffPos; p += 2) {
              const lineY = staffBottom - (p * (lineSpacing / 2));
              ledgerLines.push(<line key={`l-a-${p}`} x1={x-7} y1={lineY} x2={x+7} y2={lineY} stroke="#64748b" strokeWidth="1" />);
            }
          }

          return (
            <g key={index}>
              {ledgerLines}
              {/* Note head */}
              <ellipse cx={x} cy={y} rx="5" ry="3.5" fill="#00d4ff" />
              {/* Accidentals */}
              {(isSharp(noteName) || isFlat(noteName)) && (
                <text x={x-13} y={y+4} fill="#00d4ff" fontSize="14" fontWeight="bold">
                  {isSharp(noteName) ? '♯' : '♭'}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};


export default function ScalesPanel({ selectedScale, onScaleChange, rootNote, onRootNoteChange, onCreateNoteSequence, sphereCount }) {
  const intervals = SCALES[selectedScale] || [];
  const noteNames = intervals.map(interval => ROOT_NOTES[(rootNote + interval) % 12]);
  
  const createdNotesCountRef = useRef(0);

  const handleNoteClick = (noteIndex, event) => {
    // isNewSequence is true only on the first click of a build cycle.
    const isNewSequence = createdNotesCountRef.current === 0;

    // Don't add notes if the builder is already full.
    if (createdNotesCountRef.current >= sphereCount) {
      // If the builder is full, the next click should reset.
      createdNotesCountRef.current = 0;
      // We call the function again, which will now correctly register as a new sequence.
      handleNoteClick(noteIndex, event);
      return;
    }
    
    const interval = intervals[noteIndex];
    const octaveOffset = event.shiftKey ? 12 : 0;
    const baseMidiNote = 60 + rootNote + interval + octaveOffset;
    
    // Position notes horizontally based on their build order.
    const xPosition = (createdNotesCountRef.current - (sphereCount - 1) / 2) * 2;
    
    const noteData = {
      position: { x: xPosition, y: 0, z: 0 },
      midiNote: baseMidiNote,
    };
    
    // Call the parent function, telling it whether to reset (isNewSequence) or add.
    onCreateNoteSequence(noteData, isNewSequence);
    
    // Increment the counter for the next click.
    createdNotesCountRef.current += 1;
  };

  // If the user changes the sphereCount (the capacity), we should reset the build process.
  useEffect(() => {
    createdNotesCountRef.current = 0;
  }, [sphereCount]);

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Music2 className="w-4 h-4 text-cyan-400" />
          Scales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-2">
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
          <div className="flex-1 flex flex-col items-center">
            <label className="text-xs text-slate-300 mb-1 block">Scale</label>
            <Dial
              value={Object.keys(SCALES).indexOf(selectedScale)}
              onChange={(v) => onScaleChange(Object.keys(SCALES)[Math.round(v)])}
              min={0}
              max={Object.keys(SCALES).length - 1}
              label={selectedScale}
            />
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-2 space-y-2">
          {/* Row 1: Scale Intervals */}
          <div className="flex justify-center gap-1 flex-wrap">
            {intervals.map((interval, index) => (
              <div key={`interval-${index}`} className="flex items-center justify-center w-6 h-6 text-xs font-mono bg-black/20 text-slate-300 rounded" title={`Interval: ${interval}`}>
                {interval}
              </div>
            ))}
          </div>
          
          {/* Row 2: Note Names - Clickable */}
          <div className="flex justify-center gap-1 flex-wrap">
            {noteNames.map((noteName, index) => (
              <button
                key={`note-${index}`}
                onClick={(event) => handleNoteClick(index, event)}
                className="flex items-center justify-center w-6 h-6 text-xs font-semibold bg-cyan-900/50 text-cyan-300 rounded hover:bg-cyan-800/70 hover:text-cyan-200 transition-colors cursor-pointer active:bg-cyan-700/80"
                title={`Click to add ${noteName} (Shift+Click for octave higher)`}
              >
                {noteName}
              </button>
            ))}
          </div>
          
          {/* Row 3: Musical Staff */}
          <div>
            <MusicalStaff rootNote={rootNote} intervals={intervals} noteNames={noteNames} />
          </div>
          
          {/* Instructions */}
          <div className="text-xs text-slate-400 text-center">
            Click notes to add spheres • Shift+Click for octave higher
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
