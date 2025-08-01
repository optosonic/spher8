
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Sparkles } from 'lucide-react';

const colorPresets = [
  { name: 'Deep Purple', value: 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)' },
  { name: 'Ocean Blue', value: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)' },
  { name: 'Deep Forest Green', value: 'linear-gradient(135deg, #0a2f1a 0%, #0d3f20 50%, #0c4b24 100%)' },  
  { name: 'Golden Amber', value: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #f59e0b 100%)' },
  { name: 'Burgundy Bliss', value: 'linear-gradient(135deg, #4a0c1e 0%, #7a1e3a 50%, #9b2a44 100%)' },
  { name: 'Midnight Black', value: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #292524 100%)' },
  //{ name: 'Light Grey', value: 'linear-gradient(135deg, #374151 0%, #6b7280 50%, #9ca3af 100%)' },
  { name: 'Lighter Grey', value: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #d1d5db 100%)' },
  // Updated preset to better represent the starfield with milky way
  { name: 'Starfield', value: 'stars' }
];

export default function BackgroundPanel({ selectedBackground, onBackgroundChange }) {
  // Custom style for the starfield button to give a hint of the milky way
  const starfieldButtonStyle = {
    background: 'linear-gradient(135deg, #090a0f 20%, #302a3f 50%, #090a0f 80%)'
  };
  
  return (
    <Card className="bg-black/20 backdrop-blur-sm border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Palette className="w-4 h-4 text-rose-400" />
          Background
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-4 gap-2 justify-items-center">
          {colorPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => onBackgroundChange(preset.value)}
              className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                selectedBackground === preset.value 
                  ? 'border-white shadow-lg shadow-white/20' 
                  : 'border-white/30 hover:border-white/60'
              }`}
              style={preset.value === 'stars' ? starfieldButtonStyle : { background: preset.value }}
              title={preset.name}
            >
              {preset.value === 'stars' && <Sparkles className="w-4 h-4 text-white/80" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
