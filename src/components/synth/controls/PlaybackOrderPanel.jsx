
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, ArrowRightLeft, List, Shuffle } from 'lucide-react';

const playbackModes = [
  {
    key: 'forward',
    label: 'Forward',
    icon: ArrowRight,
    description: 'Play notes in order: 1→2→3→4'
  },
  {
    key: 'reverse',
    label: 'Reverse',
    icon: ArrowLeft,
    description: 'Play notes backwards: 4→3→2→1'
  },
  {
    key: 'boomerang',
    label: 'Boomerang',
    icon: ArrowRightLeft,
    description: 'Back and forth: 1→2→3→4→3→2'
  },
  {
    key: 'sequential',
    label: 'Sequential',
    icon: List,
    description: 'From first: 1→2→1→3→1→4'
  },
  {
    key: 'random',
    label: 'Random',
    icon: Shuffle,
    description: 'Random order each cycle'
  }
];

export default function PlaybackOrderPanel({ selectedMode = 'forward', onModeChange, disabled }) {
  const currentModeInfo = playbackModes.find(m => m.key === selectedMode);

  return (
    <Card className={`bg-black/20 backdrop-blur-sm border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <List className="w-4 h-4 text-indigo-400" />
          Playback Order
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="grid grid-cols-5 gap-2">
          {playbackModes.map((mode) => {
            const IconComponent = mode.icon;
            const isSelected = selectedMode === mode.key;
            
            return (
              <div key={mode.key} className="flex flex-col items-center">
                <Button
                  onClick={() => onModeChange(mode.key)}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`w-8 h-8 p-0 ${
                    isSelected
                      ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-indigo-500/20 border-indigo-500/50 text-white hover:white hover:text-indigo-600'
                  }`}
                  title={mode.description}
                  disabled={disabled}
                >
                  <IconComponent className="w-4 h-4" />
                </Button>
                <span className="text-xs text-slate-300 mt-1 text-center">
                  {mode.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Display current mode description */}
        <div className="text-xs text-slate-400 text-center p-2 bg-black/20 rounded">
          {currentModeInfo ? currentModeInfo.description : 'Select playback order'}
        </div>
      </CardContent>
    </Card>
  );
}
