import React from 'react';
import { Atom } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Atom className="w-6 h-6 text-white" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 animate-pulse"></div>
      </div>
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
          Spher8
        </h1>
        <p className="text-xs text-slate-400">3D Music Visualizer</p>
      </div>
    </div>
  );
}