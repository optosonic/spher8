import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, RefreshCw, Loader2 } from 'lucide-react';

export default function SceneControlPanel({ onReset, isResetting, disabled }) {
  return (
    <Card className="bg-black/20 backdrop-blur-sm border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4 text-fuchsia-400" />
          Scene Control
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="w-full border-purple-600/50 bg-purple-900/30 text-white hover:bg-purple-800/40 hover:text-white disabled:opacity-50 text-xs h-7"
          disabled={disabled}
        >
          {isResetting ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset to 4 Spheres
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}