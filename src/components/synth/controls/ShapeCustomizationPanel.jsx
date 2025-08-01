import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shapes } from 'lucide-react';

const shapeOptions = [
  { value: 'sphere', label: 'Sphere', icon: '●' },
  { value: 'cube', label: 'Cube', icon: '■' },
  { value: 'losange', label: '3D Losange', icon: '◆' },
  { value: 'diamond', label: 'Diamond', icon: '♦' }
];

export default function ShapeCustomizationPanel({ selectedShape, onShapeChange }) {
  const [hoveredShape, setHoveredShape] = useState(null);

  return (
    <Card className="glass-panel border-white/10">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Shapes className="w-4 h-4 text-indigo-400" />
          Node Shapes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {shapeOptions.map((shape) => (
            <Button
              key={shape.value}
              onClick={() => onShapeChange(shape.value)}
              onMouseEnter={() => setHoveredShape(shape.label)}
              onMouseLeave={() => setHoveredShape(null)}
              variant={selectedShape === shape.value ? 'default' : 'outline'}
              size="sm"
              className={`h-10 flex items-center justify-center ${
                selectedShape === shape.value
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  : 'border-indigo-600/50 bg-indigo-900/30 text-white hover:bg-indigo-800/40 hover:text-white'
              }`}
              title={`Change all spheres to ${shape.label} shape`}
            >
              <span className="text-xl">{shape.icon}</span>
            </Button>
          ))}
        </div>
        <div className="text-center h-4 mt-2">
          <span className="text-xs text-slate-300">
            {hoveredShape || 'Hover over a shape'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}