
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Boxes } from 'lucide-react'; // Import Boxes icon

export default function MolecularChainPanel({ notes, sphereCount, playingNotes = [] }) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const frequencyToNote = (frequency) => {
    if (!frequency) return 'N/A';
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    const h = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(h / 12);
    const n = h % 12;
    return noteNames[n] + octave;
  };

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Boxes className="w-4 h-4 text-emerald-400" />
          Molecular Chain
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
            {notes.length}/{sphereCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {notes.map((note, index) => {
            const isPlaying = playingNotes.includes(note.id);
            return (
              <div
                key={note.id || index}
                className={`flex items-center justify-between p-2 rounded border transition-colors duration-150 ${isPlaying ? 'bg-sky-500/30 border-sky-400' : 'bg-white/5 border-white/10'}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: note.liveColor || note.color }}
                  />
                  <span className="text-xs text-white font-medium">
                    {frequencyToNote(note.liveFrequency || note.frequency)}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {(note.liveFrequency || note.frequency) ? `${Math.round(note.liveFrequency || note.frequency)}Hz` : ''}
                </div>
              </div>
            );
          })}
          {notes.length === 0 && (
            <div className="text-center text-slate-400 text-xs py-3">
              No notes added yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
