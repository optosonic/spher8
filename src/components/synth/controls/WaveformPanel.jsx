
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, Zap } from 'lucide-react'; // Added Zap
import ADSREnvelope from './ADSREnvelope';

const waveforms = [
  { value: 'sine', label: 'Sine' },
  { value: 'square', label: 'Square' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'triangle', label: 'Triangle' },
];

export default function WaveformPanel({ waveform, onWaveformChange, envelope, onEnvelopeChange }) {
  return (
    <Card className="bg-black/20 backdrop-blur-sm border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-violet-400" />
          Waveform & Envelope
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-3">
        <div>
          <label className="text-xs text-slate-300 mb-1 block">Waveform</label>
          <div className="grid grid-cols-4 gap-2">
            {waveforms.map((wf) => (
              <Button
                key={wf.value}
                onClick={() => onWaveformChange(wf.value)}
                variant={waveform === wf.value ? 'default' : 'outline'}
                size="sm"
                className={`h-8 text-xs px-1 ${
                  waveform === wf.value
                    ? 'bg-teal-500 hover:bg-teal-600'
                    : 'border-slate-600 text-slate-600 hover:bg-slate-700'
                }`}
              >
                {wf.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="border-b border-white/10 !my-3"></div>
        <div>
          <label className="text-xs text-slate-300 mb-2 block">ADSR Envelope</label>
          <ADSREnvelope envelope={envelope} onChange={onEnvelopeChange} />
        </div>
      </CardContent>
    </Card>
  );
}
