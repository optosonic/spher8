
import React, { useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2 } from 'lucide-react'; // Changed import from AlignVerticalSpaceAround to Volume2

// A custom multi-slider component for setting multiple values at once
const MultiSlider = ({ notes, onVelocityChange, disabled }) => {
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  const handlePointerMove = useCallback((event) => {
    if (!isDraggingRef.current) return;

    // This is crucial to prevent the page from scrolling on mobile
    event.preventDefault();

    if (!containerRef.current || disabled || notes.length === 0) return;

    // Get clientX/clientY regardless of whether it's a mouse or touch event
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const sliderWidth = containerWidth / notes.length;

    const sliderIndex = Math.floor((clientX - rect.left) / sliderWidth);
    if (sliderIndex < 0 || sliderIndex >= notes.length) return;

    const relativeY = clientY - rect.top;
    const normalizedY = Math.max(0, Math.min(1, (containerHeight - relativeY) / containerHeight));
    const velocityValue = Math.round(normalizedY * 127);
    const clampedValue = Math.max(0, Math.min(127, velocityValue));

    const currentNote = notes[sliderIndex];
    if (currentNote && typeof onVelocityChange === 'function' && currentNote.midiVelocity !== clampedValue) {
      onVelocityChange(sliderIndex, clampedValue);
    }
  }, [notes, disabled, onVelocityChange]); // Dependencies for useCallback

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handlePointerMove);
    document.removeEventListener('mouseup', handlePointerUp);
    document.removeEventListener('touchmove', handlePointerMove);
    document.removeEventListener('touchend', handlePointerUp);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    document.body.style.pointerEvents = 'auto';
  }, [handlePointerMove]); // Dependencies for useCallback

  const handlePointerDown = useCallback((event) => {
    if (disabled || notes.length === 0) return;
    
    // For touch events, we must prevent default to stop scrolling
    if (event.type === 'touchstart') {
      event.preventDefault();
    }
    
    isDraggingRef.current = true;
    handlePointerMove(event); // Call once to register the initial press

    // Add listeners to the document to capture movement anywhere on the page
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handlePointerUp);
    
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
  }, [disabled, notes.length, handlePointerMove, handlePointerUp]); // Dependencies for useCallback

  return (
    <div
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      className={`flex h-24 w-full rounded-md border border-white/10 transition-opacity ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'
      }`}
      style={{ touchAction: 'none' }}
      title={disabled ? "Controls disabled" : "Click and drag to set velocities"}
    >
      {notes.map((note, index) => {
        const velocity = typeof note.midiVelocity === 'number' ? note.midiVelocity : 100;
        const heightPercent = (velocity / 127) * 100;
        
        return (
          <div key={note.id || index} className="flex-1 h-full relative border-r border-white/10 last:border-r-0">
            {/* The visual track of the slider */}
            <div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500/50 to-emerald-400/20 transition-all duration-75"
              style={{ height: `${heightPercent}%` }}
            />
            {/* The visual thumb/indicator of the slider */}
            <div 
              className="absolute w-full h-0.5 bg-emerald-300 transition-all duration-75" 
              style={{ bottom: `calc(${heightPercent}% - 1px)` }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default function VelocityPanel({ notes, onVelocityChange, playingNotes = [], disabled = false }) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const frequencyToNote = (frequency) => {
    if (!frequency) return 'N/A';
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    const h = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(h / 12);
    const n = h % 12;
    return noteNames[n] + octave;
  };
  
  return (
    <Card className={`bg-black/20 backdrop-blur-sm border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 ${disabled ? 'opacity-50' : 'opacity-100'}`}>
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          Note Velocities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {notes.length > 0 ? (
          <>
            <MultiSlider notes={notes} onVelocityChange={onVelocityChange} disabled={disabled} />
            <div className="flex -mx-1">
              {notes.map((note) => {
                const isPlaying = playingNotes.includes(note.id);
                const isSilent = note.midiVelocity === 0;
                return (
                  <div key={note.id} className="flex flex-col items-center gap-1 flex-1 px-1">
                    <div className="text-[0.625rem] font-mono text-slate-200 h-4 min-w-[3ch] text-center">{note.midiVelocity}</div>
                    <div
                      className={`w-3 h-3 rounded-full border transition-all duration-150 ease-in-out ${
                        isSilent 
                          ? 'bg-gray-800 border-gray-600'
                          : isPlaying 
                            ? 'shadow-lg shadow-white/40' 
                            : ''
                      }`}
                      style={{ 
                        borderColor: isSilent ? '#6b7280' : isPlaying ? '#ffffff' : (note.liveColor || note.color),
                        backgroundColor: isSilent ? '#374151' : isPlaying ? (note.liveColor || note.color) : `${note.liveColor || note.color}40`,
                        transform: isPlaying && !isSilent ? 'scale(1.2)' : 'scale(1)',
                        borderWidth: isPlaying && !isSilent ? '1.5px' : '1px',
                      }}
                    />
                    <span className="text-[0.625rem] text-white font-mono truncate w-full text-center">
                      {isSilent ? 'Silent' : frequencyToNote(note.liveFrequency || note.frequency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center text-slate-400 text-xs py-3">
            Add notes to adjust their velocity.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
