
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircleDot } from 'lucide-react'; // Changed from Hash to CircleDot

export default function SphereCountPanel({ sphereCount, onSphereCountChange, disabled }) {
  return (
    <Card className="bg-black/20 backdrop-blur-sm border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <CircleDot className="w-4 h-4 text-amber-500" /> {/* Changed icon and color */}
          Sphere Count
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 p-3">
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            onClick={() => onSphereCountChange(Math.max(1, sphereCount - 1))}
            variant="outline"
            size="sm"
            className="w-10 h-10 md:w-8 md:h-8 p-0 border-orange-500/50 text-orange-300 bg-orange-500/20 hover:bg-orange-400/80 hover:text-orange-200 text-lg md:text-base"
            disabled={sphereCount <= 1 || disabled}
          >
            -
          </Button>
          <div className="w-16 md:w-16 text-center">
            <span className="text-2xl font-bold text-orange-400">{sphereCount}</span>
            <div className="text-xs text-slate-400">spheres</div>
          </div>
          <Button
            onClick={() => onSphereCountChange(Math.min(8, sphereCount + 1))}
            variant="outline"
            size="sm"
            className="w-10 h-10 md:w-8 md:h-8 p-0 border-orange-500/50 text-orange-300 bg-orange-500/20 hover:bg-orange-400/80 hover:text-orange-200 text-lg md:text-base"
            disabled={sphereCount >= 8 || disabled}
          >
            +
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
