
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Play, Pause, Save, Repeat, Clock } from 'lucide-react'; // Added Clock import

const RECORDING_WINDOW_MS = 15000;

export default function MidiRecorderPanel({ 
  buffer, 
  onSave, 
  onPlayback, 
  isPlayingBack, 
  referenceTime,
  onInitAudio, // Accept the new prop
}) {
  const [loopRange, setLoopRange] = useState([0, 5]);
  const [isLoopMode, setIsLoopMode] = useState(true); // Set loop mode to be on by default
  const trackRef = useRef(null);
  const dragStateRef = useRef(null); // Ref to hold drag state, preventing stale closures

  const loopStart = loopRange[0];
  const loopEnd = loopRange[1];

  // REMOVED: The problematic useEffect that caused rapid re-triggering is gone.

  const handleSave = () => {
    if (buffer.length === 0) return;
    onSave(loopStart, loopEnd);
  };

  const handlePlayback = async () => {
    if (onInitAudio) {
      await onInitAudio();
    }
    if (buffer.length === 0) return;

    const now = referenceTime || performance.now();
    const bufferStartTime = now - RECORDING_WINDOW_MS;
    
    const snippetStartTimeMs = bufferStartTime + (loopStart * 1000);
    const snippetEndTimeMs = bufferStartTime + (loopEnd * 1000);

    const notesInCurrentRange = buffer.filter(event =>
      event.recordedAt >= snippetStartTimeMs && event.recordedAt <= snippetEndTimeMs
    );

    let effectiveLoopStart = loopStart;
    let effectiveLoopEnd = loopEnd;

    // If the current selection is empty but the buffer is not, auto-adjust.
    if (notesInCurrentRange.length === 0 && buffer.length > 0) {
      const lastNoteTime = Math.max(...buffer.map(e => e.recordedAt));
      const windowStart = (referenceTime || performance.now()) - RECORDING_WINDOW_MS;

      // Calculate a new 5-second window ending at the last note
      const newEndTimeSec = (lastNoteTime - windowStart) / 1000;
      const newStartTimeSec = Math.max(0, newEndTimeSec - 5);

      // We need to check if the new calculated range is valid and update it
      if (newEndTimeSec > newStartTimeSec) {
        effectiveLoopStart = newStartTimeSec;
        effectiveLoopEnd = newEndTimeSec;
        setLoopRange([effectiveLoopStart, effectiveLoopEnd]);
      }
    }
    
    // Call the parent playback function with the effective (possibly auto-adjusted) range.
    onPlayback(effectiveLoopStart, effectiveLoopEnd, isLoopMode, false);
  };

  const getTimeFromX = useCallback((clientX) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    return percent * (RECORDING_WINDOW_MS / 1000);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragStateRef.current) return;
    e.preventDefault();

    const { y, time, initialDuration } = dragStateRef.current;
    
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - y;
    const resizeFactor = -0.04; // Increased sensitivity
    
    const newDuration = Math.max(0.2, initialDuration + deltaY * resizeFactor);
    
    let newStart = time - newDuration / 2;
    let newEnd = time + newDuration / 2;
    
    const maxTime = RECORDING_WINDOW_MS / 1000;
    if (newStart < 0) {
        newStart = 0;
        newEnd = Math.min(maxTime, newDuration);
    }
    if (newEnd > maxTime) {
        newEnd = maxTime;
        newStart = Math.max(0, newEnd - newDuration);
    }

    setLoopRange([newStart, newEnd]);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = null;
    document.removeEventListener('mousemove', handlePointerMove);
    document.removeEventListener('mouseup', handlePointerUp);
    document.removeEventListener('touchmove', handlePointerMove);
    document.removeEventListener('touchend', handlePointerUp);

    // ADDED: Restart the loop with the new range only on mouse release.
    if (isPlayingBack && isLoopMode) {
      onPlayback(loopRange[0], loopRange[1], true, true);
    }
  }, [handlePointerMove, isPlayingBack, isLoopMode, onPlayback, loopRange]);

  const handlePointerDown = useCallback((e) => {
    if (!trackRef.current) return;
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const clickTime = getTimeFromX(clientX);
    
    setLoopRange(currentLoopRange => {
        const currentDuration = currentLoopRange[1] - currentLoopRange[0];
        let newStart = clickTime - currentDuration / 2;
        
        const maxTime = RECORDING_WINDOW_MS / 1000;
        if (newStart < 0) {
            newStart = 0;
        }
        let newEnd = newStart + currentDuration;
        if (newEnd > maxTime) {
            newEnd = maxTime;
            newStart = newEnd - currentDuration;
        }
        newStart = Math.max(0, newStart);
        
        dragStateRef.current = { 
            y: clientY, 
            time: clickTime,
            initialDuration: newEnd - newStart
        };

        return [newStart, newEnd];
    });
    
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handlePointerUp);

  }, [getTimeFromX, handlePointerMove, handlePointerUp]);

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-rose-400" />
          MIDI Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="text-xs text-slate-400 text-center h-4">
          {buffer.length > 0 && `${buffer.length} events recorded`}
        </div>
        
        <div 
          ref={trackRef}
          className="relative pt-2 pb-2 select-none touch-none"
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          style={{ 
            touchAction: 'none',
            cursor: 'pointer'
          }}
        >
          <div className="h-10 md:h-8 bg-black/20 rounded border border-white/10 relative overflow-hidden">
            {buffer.map((event, index) => {
              const now = referenceTime || performance.now();
              const bufferStartTime = now - RECORDING_WINDOW_MS;
              const eventTime = (event.recordedAt - bufferStartTime) / RECORDING_WINDOW_MS;
              const leftPercent = Math.max(0, Math.min(100, eventTime * 100));
              
              return (
                <div
                  key={index}
                  className="absolute top-1 bottom-1 w-0.5 bg-rose-400 opacity-80"
                  style={{ left: `${leftPercent}%` }}
                />
              );
            })}
            
            <div
              className="absolute top-0 bottom-0 bg-blue-500/30 border-l-2 border-r-2 border-blue-400"
              style={{
                left: `${(loopStart / (RECORDING_WINDOW_MS / 1000)) * 100}%`,
                width: `${((loopEnd - loopStart) / (RECORDING_WINDOW_MS / 1000)) * 100}%`,
                cursor: 'ns-resize',
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePlayback}
              variant="outline"
              size="sm"
              className="h-7 text-xs border-slate-600 hover:bg-slate-700"
              disabled={buffer.length === 0}
            >
              {isPlayingBack ? <Pause className="w-3 h-3 mr-1"/> : <Play className="w-3 h-3 mr-1" />}
              {isPlayingBack ? 'Stop' : 'Play'}
            </Button>
            <Button
              onClick={() => setIsLoopMode(!isLoopMode)}
              variant="outline"
              size="sm"
              className={`h-7 w-7 text-xs ${isLoopMode ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-600 text-slate-300'}`}
              title={isLoopMode ? 'Loop enabled' : 'Loop disabled'}
            >
              <Repeat className="w-3 h-3" />
            </Button>
            <div className="text-xs text-slate-400">
              {loopStart.toFixed(1)}s - {loopEnd.toFixed(1)}s
            </div>
          </div>
          <Button
            onClick={handleSave}
            size="sm"
            className="h-7 text-xs bg-rose-600 hover:bg-rose-700"
            disabled={buffer.length === 0}
          >
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
        </div>
        
        <div className="text-xs text-slate-500 text-center h-4">
          Click to position, drag up/down to resize.
        </div>
      </CardContent>
    </Card>
  );
}
