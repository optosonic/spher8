
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves, Power } from 'lucide-react';
import RangeSlider from '@/components/ui/range-slider';

const delayTimeOptions = [
  { value: 2, label: '1/2' },
  { value: 1.5, label: '1/4.' },
  { value: 1, label: '1/4' },
  { value: 0.75, label: '1/8.' },
  { value: 0.5, label: '1/8' },
  { value: 0.375, label: '1/16.' },
  { value: 0.25, label: '1/16' },
  { value: 0.125, label: '1/32' },
];

const OnOffButton = ({ isOn, onClick, disabled, activeColor }) => {
  const baseClasses = "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 border";
  const onClasses = {
    cyan: `bg-cyan-500/90 border-cyan-200 text-cyan-200 shadow-[0_0_5px_1px] shadow-cyan-500/80`,
    fuchsia: `bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_5px_1px] shadow-fuchsia-500/80`,
  };
  const offClasses = "`bg-cyan-500/70 border-cyan-400 text-cyan-300 shadow-[0_0_5px_1px] shadow-cyan-500/60`";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${isOn ? onClasses[activeColor] : offClasses}`}
    >
      <Power className="w-3 h-3" />
    </button>
  );
};

export default function EFXPanel({ efx, onEfxChange, disabled }) {
  
  const efxDisabledClass = (isOn) => 
    `space-y-3 transition-opacity duration-300 ${!isOn || disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`;

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Waves className="w-4 h-4 text-blue-400" />
          EFX Processor
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-4">
        {/* Delay Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300">STEREO DELAY</span>
            <OnOffButton
              isOn={efx.delayOn}
              onClick={() => onEfxChange({ ...efx, delayOn: !efx.delayOn })}
              disabled={disabled}
              activeColor="cyan"
            />
          </div>
          <div className={efxDisabledClass(efx.delayOn)}>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {delayTimeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onEfxChange({ ...efx, delayTime: option.value })}
                  className={`h-7 text-xs px-2 rounded border transition-all duration-200 ${
                    efx.delayTime === option.value
                      ? 'bg-cyan-600/80 border-cyan-400 text-white shadow-[0_0_1px] shadow-cyan-400/60'
                      : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70'
                  }`}
                  disabled={disabled || !efx.delayOn}
                  title={`${option.label} note delay`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <RangeSlider label="Feedback" value={efx.delayFeedback} onChange={(v) => onEfxChange({ ...efx, delayFeedback: v })} min={0} max={0.85} step={0.01} valueFormatter={(v) => v.toFixed(2)} thickness="medium" labelSize="text-xs" valueSize="text-xs" />
            <RangeSlider label="Mix" value={efx.delayMix} onChange={(v) => onEfxChange({ ...efx, delayMix: v })} min={0} max={1} step={0.01} valueFormatter={(v) => v.toFixed(2)} thickness="medium" labelSize="text-xs" valueSize="text-xs" />
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t-blue-500/20" />

        {/* Reverb Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300">REVERB - IR</span>
             <OnOffButton
              isOn={efx.reverbOn}
              onClick={() => onEfxChange({ ...efx, reverbOn: !efx.reverbOn })}
              disabled={disabled}
              activeColor="cyan"
            />
          </div>
          <div className={efxDisabledClass(efx.reverbOn)}>
            <RangeSlider label="Size" value={efx.reverbSize} onChange={(v) => onEfxChange({ ...efx, reverbSize: v })} min={0.5} max={5} step={0.1} valueFormatter={(v) => v.toFixed(1)} thickness="medium" labelSize="text-xs" valueSize="text-xs" />
            <RangeSlider label="Decay" value={efx.reverbDecay} onChange={(v) => onEfxChange({ ...efx, reverbDecay: v })} min={0.5} max={5} step={0.1} valueFormatter={(v) => v.toFixed(1)} thickness="medium" labelSize="text-xs" valueSize="text-xs" />
            <RangeSlider label="Dry" value={efx.reverbDry} onChange={(v) => onEfxChange({ ...efx, reverbDry: v })} min={0} max={1} step={0.01} valueFormatter={(v) => v.toFixed(2)} thickness="medium" labelSize="text-xs" valueSize="text-xs" />
            <RangeSlider label="Wet" value={efx.reverbWet} onChange={(v) => onEfxChange({ ...efx, reverbWet: v })} min={0} max={1} step={0.01} valueFormatter={(v) => v.toFixed(2)} thickness="medium" labelSize="text-xs" valueSize="text-xs" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
