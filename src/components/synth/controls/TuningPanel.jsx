import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Info } from 'lucide-react';
import { TUNING_SYSTEMS } from '../tuning';

export default function TuningPanel({ activeTuning, onTuningChange, disabled }) {
  const tuningData = TUNING_SYSTEMS[activeTuning];

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          Tuning System
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(TUNING_SYSTEMS).map((tuningName) => (
            <Button
              key={tuningName}
              onClick={() => onTuningChange(tuningName)}
              variant="outline"
              size="sm"
              className={`
                h-8 text-xs font-light tracking-tight transition-all duration-200 text-center
                ${activeTuning === tuningName 
                  ? 'bg-purple-500 text-white border-purple-400 ring-1 ring-purple-400' 
                  : 'bg-black text-purple-300 border border-purple-500/50 hover:bg-purple-900/50 hover:text-white hover:border-purple-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={disabled}
            >
              {tuningName}
            </Button>
          ))}
        </div>
        {tuningData && (
          <div className="text-xs text-slate-400 bg-black/30 p-2 rounded-md border border-white/10 flex items-start gap-2">
            <Info className="w-3 h-3 text-purple-300 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-300">{tuningData.name}</p>
              <p>{tuningData.description}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}