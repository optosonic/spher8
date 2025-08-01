
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Atom, Loader2 } from 'lucide-react'; // Added Loader2

const SHAPES = {
  Linear: { count: 2, icon: <div className="w-5 h-0.5 bg-white rounded-full"></div> },
  'Bent': { count: 3, icon: '∠' },
  'Trigonal Planar': { count: 4, icon: '▲' },
  Tetrahedral: { count: 5, icon: '♦' },
  'Trigonal Bipyramidal': { count: 6, icon: '⬟' },
  'Square Pyramidal': { count: 6, icon: <span className="text-sm">⬜</span> },
  Octahedral: { count: 7, icon: '✠' },
  'Pentagonal Bipyramidal': { count: 8, icon: '✪' }
};

export default function MolecularShapePanel({ onShapeSelect, disabled, processingShape }) { // Added processingShape prop
  const [hoveredShape, setHoveredShape] = useState(null);

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Atom className="w-4 h-4 text-fuchsia-400" />
          Molecular Geometry
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {Object.entries(SHAPES).map(([name, { icon }]) => {
            const isProcessingThisShape = processingShape === name;
            const isAnyShapeProcessing = !!processingShape; // Check if any shape is currently processing

            return (
              <Button
                key={name}
                onClick={() => onShapeSelect(name)}
                onMouseEnter={() => setHoveredShape(name)}
                onMouseLeave={() => setHoveredShape(null)}
                variant="outline"
                size="sm"
                className="h-10 border-lime-600/50 bg-lime-900/30 text-white hover:bg-lime-800/40 hover:text-white disabled:opacity-50 flex items-center justify-center"
                disabled={disabled || isAnyShapeProcessing} // Disable if overall disabled or any shape is processing
                title={`Arrange spheres in a ${name} shape`}
              >
                {isProcessingThisShape ? ( // Conditionally render Loader2
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  typeof icon === 'string' ? <span className="text-lg">{icon}</span> : icon
                )}
              </Button>
            );
          })}
        </div>
        <div className="text-center h-4">
          <span className="text-xs text-slate-300">
            {processingShape ? `Generating ${processingShape}...` : (hoveredShape || 'Hover over a shape')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
