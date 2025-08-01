
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Logo from '@/components/Logo';

export default function Spher8BrandPanel() {
  return (
    <Card className="bg-black/20 backdrop-blur-sm border-blue-700/30 shadow-[0_0_15px_rgba(37,99,235,0.05)] transition-all duration-300">
      <CardContent className="p-4 text-center">
        <div className="flex justify-center mb-3">
            <Logo className="w-16 h-16" />
        </div>
        <p className="text-sm text-slate-300">Molecular Synthesizer</p>
        <blockquote className="mt-4 border-l-2 border-slate-500 pl-3 text-left">
            <p className="text-xs italic text-slate-400">
                "Transform spatial relationships into musical harmony."
            </p>
        </blockquote>
      </CardContent>
    </Card>
  );
}
