import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import RangeSlider from '@/components/ui/range-slider';

export default function VisualsPanel({
  sphereBrightness,
  onSphereBrightnessChange
}) {
  return (
    <Card className="bg-black/20 backdrop-blur-sm border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-teal-400" />
          Visuals
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <RangeSlider
          label="Sphere Brightness"
          value={sphereBrightness}
          onChange={onSphereBrightnessChange}
          min={0}
          max={1}
          step={0.05}
          valueFormatter={(v) => v.toFixed(2)}
          thickness="thick"
          labelSize="text-xs"
          valueSize="text-xs"
        />
      </CardContent>
    </Card>
  );
}