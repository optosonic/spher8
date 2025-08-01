import React from 'react';

export default function HudViewfinder({ isVisible }) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Main subtle crosshair lines across the screen */}
      <div className="absolute top-1/2 left-6 right-6 h-px bg-slate-300/20"></div>
      <div className="absolute left-1/2 top-6 bottom-6 w-px bg-slate-300/20"></div>

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-10 h-10 border-t border-l border-slate-300/50"></div>
      <div className="absolute top-6 right-6 w-10 h-10 border-t border-r border-slate-300/50"></div>
      <div className="absolute bottom-6 left-6 w-10 h-10 border-b border-l border-slate-300/50"></div>
      <div className="absolute bottom-6 right-6 w-10 h-10 border-b border-r border-slate-300/50"></div>

      {/* Center aiming reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-5 h-px bg-slate-400/80"></div>
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-5 h-px bg-slate-400/80"></div>
        <div className="absolute left-1/2 -translate-x-1/2 top-0 h-5 w-px bg-slate-400/80"></div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-5 w-px bg-slate-400/80"></div>
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-slate-400/80 rounded-full"></div>
      </div>
    </div>
  );
}