
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dial } from './Dial';
import { Waves, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, PlusCircle } from 'lucide-react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const pcToName = (pc) => NOTES[pc % 12];

export default function DodecaphonicPanel({ onCreateNoteSequence, disabled, onFirstCreate }) {
  const [toneRow, setToneRow] = useState([]);
  const [selectedTransposition, setSelectedTransposition] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState('hex1'); // Changed to single selection
  const [isForward, setIsForward] = useState(true);
  const [isInverted, setIsInverted] = useState(false);
  const [octaveShift, setOctaveShift] = useState(0);
  const [baseOctave, setBaseOctave] = useState(4);
  const [seriesCreated, setSeriesCreated] = useState(false); // Track if series has been created

  const handleAddNote = (pc) => {
    if (toneRow.length >= 12 || toneRow.includes(pc)) return;
    setToneRow([...toneRow, pc]);
  };

  const handleRemoveNote = (index) => {
    setToneRow(prev => {
      const newRow = [...prev];
      newRow.splice(index, 1);
      return newRow;
    });
  };

  const handleClearRow = () => setToneRow([]);

  const handleRandom = () => {
    const allPcs = Array.from({ length: 12 }, (_, i) => i);
    for (let i = allPcs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPcs[i], allPcs[j]] = [allPcs[j], allPcs[i]];
    }
    setToneRow(allPcs);
  };

  const handleOctaveShift = (direction) => {
    const newOctaveShift = octaveShift + direction;
    setOctaveShift(newOctaveShift);
    
    // If series is created, update immediately
    if (seriesCreated) {
      handleCreateSpheres(newOctaveShift, selectedTransposition, selectedGroup, isForward, isInverted);
    }
  };

  const handleTranspositionChange = (newTransposition) => {
    setSelectedTransposition(newTransposition);
    
    // If series is created, update immediately
    if (seriesCreated) {
      handleCreateSpheres(octaveShift, newTransposition, selectedGroup, isForward, isInverted);
    }
  };

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
    
    // If series is created, update immediately
    if (seriesCreated) {
      handleCreateSpheres(octaveShift, selectedTransposition, group, isForward, isInverted);
    }
  };

  const invertRow = (row) => {
    const inv = [row[0]];
    for (let i = 1; i < 12; i++) {
      const interval = row[i] - row[i - 1];
      inv.push((inv[i - 1] - interval + 24) % 12);
    }
    return inv;
  };

  const handleCreateSpheres = (currentOctaveShift = octaveShift, currentTransposition = selectedTransposition, currentGroup = selectedGroup, currentIsForward = isForward, currentIsInverted = isInverted) => {
    if (toneRow.length !== 12) return;

    let baseForm = currentIsInverted ? invertRow(toneRow) : [...toneRow];
    if (!currentIsForward) baseForm = baseForm.reverse();

    const transposed = baseForm.map(pc => (pc + currentTransposition) % 12);

    let indices = new Set();
    if (currentGroup === 'all') {
      for (let i = 0; i < 12; i++) indices.add(i);
    } else if (currentGroup === 'hex1') {
      for (let i = 0; i < 6; i++) indices.add(i);
    } else if (currentGroup === 'hex2') {
      for (let i = 6; i < 12; i++) indices.add(i);
    } else if (currentGroup === 'tet1') {
      for (let i = 0; i < 4; i++) indices.add(i);
    } else if (currentGroup === 'tet2') {
      for (let i = 4; i < 8; i++) indices.add(i);
    } else if (currentGroup === 'tet3') {
      for (let i = 8; i < 12; i++) indices.add(i);
    }

    if (indices.size === 0) return;

    const orderedIndices = Array.from(indices).sort((a, b) => a - b);

    const seqPcs = orderedIndices.map(idx => transposed[idx]);

    const baseMidi = (baseOctave + 1) * 12;

    const notesForSequence = seqPcs.map((pc, index) => ({
      midiNote: baseMidi + pc + (currentOctaveShift * 12),
      position: {
        x: Math.cos(index * 0.8) * (2 + index * 0.3),
        y: (Math.random() - 0.5) * 2,
        z: Math.sin(index * 0.8) * (2 + index * 0.3)
      }
    }));

    onCreateNoteSequence(notesForSequence, true);
    
    // Mark series as created on first call
    if (!seriesCreated) {
      setSeriesCreated(true);
      if (onFirstCreate) {
        onFirstCreate();
      }
    }
  };

  const handleReset = () => {
    setSelectedGroup('hex1');
    setIsForward(true);
    setIsInverted(false);
    setOctaveShift(0);
    setSeriesCreated(false);
  };

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Waves className="w-4 h-4 text-cyan-400" />
          Tone Row Shuffle
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Dial
              value={baseOctave}
              min={2}
              max={6}
              step={1}
              onChange={setBaseOctave}
              label="Base Octave"
              unit={baseOctave}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              onClick={() => handleCreateSpheres()}
              disabled={disabled || toneRow.length !== 12}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 h-10"
            >
              <PlusCircle className="w-4 h-4 mr-2 mb-2" />
              Create
            </Button>
          </div>
        </div>

        <div className="text-xs text-slate-400 text-center -my-2">
          Build Tone Row by Clicking Notes
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {NOTES.map((name, pc) => (
            <button
              key={pc}
              onClick={() => handleAddNote(pc)}
              disabled={disabled || toneRow.includes(pc) || toneRow.length >= 12}
              className="h-6 px-2 text-[0.625rem] bg-black/60 border border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-slate-300">Primary Row</span>
          <div className="flex gap-1">
            <button
              onClick={handleRandom}
              disabled={disabled}
              className="h-6 px-2 text-xs border border-slate-500/70 text-slate-400 hover:border-slate-400 hover:text-white transition-all bg-black/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Random
            </button>
            <button
              onClick={() => { handleClearRow(); handleReset(); }}
              disabled={disabled || toneRow.length === 0}
              className="h-6 px-2 text-xs border border-slate-500/70 text-slate-400 hover:border-slate-400 hover:text-white transition-all bg-black/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 min-h-[20px] bg-indigo-700/20 p-1 rounded border border-slate-400/50">
          {toneRow.map((pc, index) => (
            <button
              key={index}
              onClick={() => handleRemoveNote(index)}
              className="h-5 px-1 text-[0.625rem] bg-cyan-500/80 border border-cyan-400/50 hover:bg-cyan-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
            >
              {pcToName(pc)}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 text-center my-1">
          Transposition (1-12)
        </div>

        <div className="flex flex-wrap gap-1 justify-center mb-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((label) => {
            const t = label - 1;
            return (
              <button
                key={label}
                onClick={() => handleTranspositionChange(t)}
                className={`h-6 px-2 text-xs transition-all border bg-black/60 ${
                  selectedTransposition === t 
                    ? 'border-cyan-400 text-cyan-400' 
                    : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
                }`}
                disabled={disabled}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-slate-300">Octave Shift</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${octaveShift > 0 ? 'text-green-400' : octaveShift < 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {octaveShift > 0 ? `+${octaveShift}` : octaveShift} Oct
            </span>
            <button 
              className="h-5 w-5 bg-black/60 border border-green-600/50 text-green-400 hover:border-green-400 hover:bg-green-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
              onClick={() => handleOctaveShift(-1)} 
              disabled={disabled}
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <button 
              className="h-5 w-5 bg-black/60 border border-blue-600/50 text-blue-400 hover:border-blue-400 hover:bg-blue-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
              onClick={() => handleOctaveShift(1)} 
              disabled={disabled}
            >
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 text-center my-1">
          Select Group
        </div>

        <div className="flex justify-center gap-1 mb-1">
          <button
            onClick={() => handleGroupChange('all')}
            className={`h-6 px-2 text-xs transition-all border bg-black/60 ${
              selectedGroup === 'all' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
            }`}
            disabled={disabled}
          >
            All 12
          </button>
          <button
            onClick={() => handleGroupChange('hex1')}
            className={`h-6 px-2 text-xs transition-all border bg-black/60 ${
              selectedGroup === 'hex1' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
            }`}
            disabled={disabled}
          >
            Hex 0-5
          </button>
          <button
            onClick={() => handleGroupChange('hex2')}
            className={`h-6 px-2 text-xs transition-all border bg-black/60 ${
              selectedGroup === 'hex2' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
            }`}
            disabled={disabled}
          >
            Hex 6-11
          </button>
        </div>

        <div className="flex justify-center gap-1 mb-2">
          <button
            onClick={() => handleGroupChange('tet1')}
            className={`h-6 px-2 text-xs transition-all border bg-black/60 ${
              selectedGroup === 'tet1' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
            }`}
            disabled={disabled}
          >
            Tet 0-3
          </button>
          <button
            onClick={() => handleGroupChange('tet2')}
            className={`h-6 px-2 text-xs transition-all border bg-black/60 ${
              selectedGroup === 'tet2' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
            }`}
            disabled={disabled}
          >
            Tet 4-7
          </button>
          <button
            onClick={() => handleGroupChange('tet3')}
            className={`h-6 px-2 text-xs transition-all border bg-black/60 ${
              selectedGroup === 'tet3' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
            }`}
            disabled={disabled}
          >
            Tet 8-11
          </button>
        </div>

        <div className="flex justify-center gap-1">
          <button
            onClick={() => {
              const newIsForward = true;
              setIsForward(newIsForward);
              if (seriesCreated) {
                handleCreateSpheres(octaveShift, selectedTransposition, selectedGroup, newIsForward, isInverted);
              }
            }}
            className={`h-6 px-2 text-xs transition-all border bg-black/60 flex items-center ${
              isForward 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
            }`}
            disabled={disabled}
          >
            <ArrowRight className="w-3 h-3 mr-1" />
            Forward
          </button>
          <button
            onClick={() => {
              const newIsForward = false;
              setIsForward(newIsForward);
              if (seriesCreated) {
                handleCreateSpheres(octaveShift, selectedTransposition, selectedGroup, newIsForward, isInverted);
              }
            }}
            className={`h-6 px-2 text-xs transition-all border bg-black/60 flex items-center ${
              !isForward 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
            }`}
            disabled={disabled}
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Backward
          </button>
          <button
            onClick={() => {
              const newIsInverted = !isInverted;
              setIsInverted(newIsInverted);
              if (seriesCreated) {
                handleCreateSpheres(octaveShift, selectedTransposition, selectedGroup, isForward, newIsInverted);
              }
            }}
            className={`h-6 px-2 text-xs transition-all border bg-black/60 ${
              isInverted 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-slate-600/50 text-slate-300 hover:border-slate-400 hover:text-white'
            }`}
            disabled={disabled}
          >
            Inversion
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
