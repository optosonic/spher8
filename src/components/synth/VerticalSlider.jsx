import React from 'react';
import { Slider } from '@/components/ui/slider';

export default function VerticalSlider({ value, onChange, min, max, step, disabled, position = 'left', icon: IconComponent }) {
  const positionClasses = position === 'left' ? 'left-4' : 'right-4';
  
  // Map the internal value to a more logical display value for camera Y
  const displayValue = position === 'left' ? value + 2.1 : value; // Camera Y gets +2.1 offset for display
  
  return (
    <div className={`absolute ${positionClasses} top-1/2 -translate-y-1/2 h-64 flex flex-col items-center justify-center gap-4 p-2 rounded-xl transition-opacity duration-300 ${disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      {IconComponent && <IconComponent className="w-5 h-5 text-slate-300" />}
      <Slider
        value={[value]}
        onValueChange={(val) => onChange(val[0])}
        min={min}
        max={max}
        step={step}
        orientation="vertical"
        className="h-full py-2 data-[orientation=vertical]:w-auto slider-custom"
      />
      <span className="text-sm font-mono text-slate-200">{displayValue.toFixed(2)}</span>
    </div>
  );
}