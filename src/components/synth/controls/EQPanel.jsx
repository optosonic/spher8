
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import Dial from './Dial';

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const MIN_DB = -24;
const MAX_DB = 24;

// Helper to convert log frequency to a linear X position
const freqToX = (freq, width) => {
  const logFreq = Math.log10(freq);
  const logMin = Math.log10(MIN_FREQ);
  const logMax = Math.log10(MAX_FREQ);
  return ((logFreq - logMin) / (logMax - logMin)) * width;
};

// Helper to convert linear X position back to log frequency
const xToFreq = (x, width) => {
  const logMin = Math.log10(MIN_FREQ);
  const logMax = Math.log10(MAX_FREQ);
  const logFreq = (x / width) * (logMax - logMin) + logMin;
  return Math.pow(10, logFreq);
};

// Helper to convert dB to a linear Y position
const dbToY = (db, height) => {
  return (1 - (db - MIN_DB) / (MAX_DB - MIN_DB)) * height;
};

// Helper to convert linear Y position back to dB
const yToDb = (y, height) => {
  return (1 - y / height) * (MAX_DB - MIN_DB) + MIN_DB;
};

// Helper to find the dB value at a given frequency from a frequency response array
const findDbAtFreq = (freq, response) => {
  if (!response || response.length === 0) return 0;

  // Find two points that bracket the target frequency for linear interpolation
  let p1 = response[0];
  let p2 = response[response.length - 1];

  for (let i = 0; i < response.length - 1; i++) {
    if (response[i].freq <= freq && response[i + 1].freq >= freq) {
      p1 = response[i];
      p2 = response[i + 1];
      break;
    }
  }

  // Linear interpolation
  if (p1.freq === p2.freq) return p1.db; // Avoid division by zero if points are identical
  const ratio = (freq - p1.freq) / (p2.freq - p1.freq);
  return p1.db + ratio * (p2.db - p1.db);
};

export default function EQPanel({ eq, onEQChange }) {
  const canvasRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const dragPointIdRef = useRef(null); // Stores 'low', 'mid', 'high' for the currently dragged band

  // Refs to keep latest props/state in event listeners
  const eqRef = useRef(eq);
  const onEQChangeRef = useRef(onEQChange);

  // Update refs when props change
  useEffect(() => {
    eqRef.current = eq;
  }, [eq]);

  useEffect(() => {
    onEQChangeRef.current = onEQChange;
  }, [onEQChange]);

  const resetEQ = () => {
    // Use ref for onEQChange to ensure latest callback
    onEQChangeRef.current({
      lowGain: 0,
      lowFreq: 200,
      lowFilterType: 'lowshelf',
      midGain: 0,
      midFreq: 1000,
      midQ: 1,
      highGain: 0,
      highFreq: 5000,
      highFilterType: 'highshelf'
    });
  };

  const getCombinedFrequencyResponse = useCallback((eqSettings) => {
    if (!window.audioContext) return [];
    const audioContext = window.audioContext;

    const freqs = new Float32Array(128);
    for (let i = 0; i < freqs.length; i++) {
      freqs[i] = xToFreq(i, freqs.length - 1);
    }

    const magResponse = new Float32Array(freqs.length);
    const phaseResponse = new Float32Array(freqs.length);
    const totalMag = new Float32Array(freqs.length).fill(1);

    // Low Shelf (or Highpass)
    const lowFilter = audioContext.createBiquadFilter();
    lowFilter.type = eqSettings.lowFilterType || 'lowshelf';
    lowFilter.frequency.value = eqSettings.lowFreq;
    lowFilter.gain.value = eqSettings.lowGain;
    lowFilter.getFrequencyResponse(freqs, magResponse, phaseResponse);
    for (let i = 0; i < totalMag.length; i++) totalMag[i] *= magResponse[i];

    // Mid Peak
    const midFilter = audioContext.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = eqSettings.midFreq;
    midFilter.gain.value = eqSettings.midGain;
    midFilter.Q.value = eqSettings.midQ;
    midFilter.getFrequencyResponse(freqs, magResponse, phaseResponse);
    for (let i = 0; i < totalMag.length; i++) totalMag[i] *= magResponse[i];

    // High Shelf (or Lowpass)
    const highFilter = audioContext.createBiquadFilter();
    highFilter.type = eqSettings.highFilterType || 'highshelf';
    highFilter.frequency.value = eqSettings.highFreq;
    highFilter.gain.value = eqSettings.highGain;
    highFilter.getFrequencyResponse(freqs, magResponse, phaseResponse);
    for (let i = 0; i < totalMag.length; i++) totalMag[i] *= magResponse[i];
    
    const dbResponse = [];
    for (let i = 0; i < totalMag.length; i++) {
      dbResponse.push({
        freq: freqs[i],
        db: 20 * Math.log10(totalMag[i])
      });
    }

    return dbResponse;
  }, [eq]); // eq is a dependency here, which means getCombinedFrequencyResponse itself changes when eq changes.

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !window.audioContext) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensionsRef.current;
    
    if (width <= 0 || height <= 0) return;
    
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.fillStyle = 'rgba(10, 5, 20, 0.4)';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
    ctx.lineWidth = 0.5;
    const logFrequencies = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
    logFrequencies.forEach(freq => {
      const x = freqToX(freq, width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });
    const dbLevels = [-20, -10, 0, 10, 20];
    dbLevels.forEach(db => {
      const y = dbToY(db, height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    const zeroY = dbToY(0, height);
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();

    const response = getCombinedFrequencyResponse(eqRef.current); // Use eqRef.current to get the latest eq
    if (response.length === 0) return;
    
    ctx.strokeStyle = '#0ea5e9'; // Galactic Blue
    ctx.lineWidth = 2;
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    const firstPoint = response[0];
    ctx.moveTo(freqToX(firstPoint.freq, width), dbToY(firstPoint.db, height));
    response.forEach(point => {
      ctx.lineTo(freqToX(point.freq, width), dbToY(point.db, height));
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    const points = {
      low: { x: freqToX(eqRef.current.lowFreq, width), y: dbToY(findDbAtFreq(eqRef.current.lowFreq, response), height), color: '#f43f5e' },
      mid: { x: freqToX(eqRef.current.midFreq, width), y: dbToY(findDbAtFreq(eqRef.current.midFreq, response), height), color: '#34d399' },
      high: { x: freqToX(eqRef.current.highFreq, width), y: dbToY(findDbAtFreq(eqRef.current.highFreq, response), height), color: '#a78bfa' },
    };

    Object.values(points).forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(10, 5, 20, 0.8)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = point.color;
      ctx.stroke();
    });
  }, [getCombinedFrequencyResponse]); // Dependency on getCombinedFrequencyResponse ensures re-draw when eq changes

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      dimensionsRef.current = { width, height };
      draw();
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.unobserve(canvas);
  }, [draw]);

  useEffect(() => {
    const handleContextReady = () => {
      setTimeout(draw, 50);
    };
    window.addEventListener('audioContextReady', handleContextReady);
    
    if (window.audioContext) {
      draw();
    }

    return () => {
      window.removeEventListener('audioContextReady', handleContextReady);
    };
  }, [draw]);

  // Refs to hold the mutable event handlers, avoiding stale closures
  const handlePointerMoveRef = useRef();
  const handlePointerUpRef = useRef();

  // Define mutable event handler logic within useEffect
  useEffect(() => {
    // Common cleanup logic for both up/end events
    const commonCleanup = () => {
        setIsDragging(false);
        dragPointIdRef.current = null; // Reset the dragged point ID
        
        // Restore body scrolling
        document.body.style.overflow = '';
        document.body.style.touchAction = ''; // Reset touch-action as well
        
        // Remove unified event listeners
        document.removeEventListener('pointermove', handlePointerMoveRef.current);
        document.removeEventListener('pointerup', handlePointerUpRef.current);
    };

    handlePointerUpRef.current = () => {
      commonCleanup();
    };

    // Unified pointer move handler for both mouse and touch
    handlePointerMoveRef.current = (e) => {
        // Prevent page scroll/zoom during drag
        e.preventDefault();

        const canvas = canvasRef.current;
        const dragged = dragPointIdRef.current; // Get the currently dragged point ID from ref
        if (!canvas || !dragged) return;

        const rect = canvas.getBoundingClientRect();
        
        // e.clientX/Y works for both mouse and touch PointerEvents
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const currentEq = eqRef.current; // Get latest EQ settings from ref
        const currentOnEQChange = onEQChangeRef.current; // Get latest onEQChange callback from ref

        const currentResponse = getCombinedFrequencyResponse(currentEq); // Recompute response with latest eq
        if (currentResponse.length === 0) return;

        const newFreq = xToFreq(x, dimensionsRef.current.width);
        const newGainDbAtPointer = yToDb(y, dimensionsRef.current.height);
        
        const newEq = { ...currentEq };
        
        let currentBandFreq;
        let currentBandGain;
        let minFreqBound;
        let maxFreqBound;

        if (dragged === 'low') {
            currentBandFreq = currentEq.lowFreq;
            currentBandGain = currentEq.lowGain;
            minFreqBound = MIN_FREQ;
            maxFreqBound = 1000;
        } else if (dragged === 'mid') {
            currentBandFreq = currentEq.midFreq;
            currentBandGain = currentEq.midGain;
            minFreqBound = 200;
            maxFreqBound = 10000;
        } else if (dragged === 'high') {
            currentBandFreq = currentEq.highFreq;
            currentBandGain = currentEq.highGain;
            minFreqBound = 1000;
            maxFreqBound = MAX_FREQ;
        }

        const dbAtCurrentBandFreqOnCurve = findDbAtFreq(currentBandFreq, currentResponse);
        const gainDelta = newGainDbAtPointer - dbAtCurrentBandFreqOnCurve;

        const clampedNewFreq = Math.round(Math.max(minFreqBound, Math.min(newFreq, maxFreqBound)));
        const clampedNewGain = parseFloat(Math.max(MIN_DB, Math.min(currentBandGain + gainDelta, MAX_DB)).toFixed(1));

        if (dragged === 'low') {
            newEq.lowFreq = clampedNewFreq;
            newEq.lowGain = clampedNewGain;
        } else if (dragged === 'mid') {
            newEq.midFreq = clampedNewFreq;
            newEq.midGain = clampedNewGain;
        } else if (dragged === 'high') {
            newEq.highFreq = clampedNewFreq;
            newEq.highGain = clampedNewGain;
        }

        currentOnEQChange(newEq); // Use latest onEQChange callback
    };
  }, [getCombinedFrequencyResponse]); // This useEffect depends on getCombinedFrequencyResponse

  const handlePointerDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // e.clientX/Y works for both mouse and touch PointerEvents
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const currentEq = eqRef.current; // Use ref for current eq
    const currentResponse = getCombinedFrequencyResponse(currentEq); // Calculate response based on current eq

    const points = {
      low: { x: freqToX(currentEq.lowFreq, dimensionsRef.current.width), y: dbToY(findDbAtFreq(currentEq.lowFreq, currentResponse), dimensionsRef.current.height) },
      mid: { x: freqToX(currentEq.midFreq, dimensionsRef.current.width), y: dbToY(findDbAtFreq(currentEq.midFreq, currentResponse), dimensionsRef.current.height) },
      high: { x: freqToX(currentEq.highFreq, dimensionsRef.current.width), y: dbToY(findDbAtFreq(currentEq.highFreq, currentResponse), dimensionsRef.current.height) },
    };

    const hitRadius = 25; // Larger hit radius for better mobile interaction
    let pointHit = null;
    for (const [name, pos] of Object.entries(points)) {
      const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (dist < hitRadius) {
        pointHit = name;
        break;
      }
    }

    if (pointHit) {
      // Only prevent default and start drag if a point was hit
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true); // Set dragging state
      dragPointIdRef.current = pointHit; // Store the ID of the dragged point
      
      // Prevent scrolling on the whole page during drag
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      // Add unified listeners to the document
      document.addEventListener('pointermove', handlePointerMoveRef.current, { passive: false });
      document.addEventListener('pointerup', handlePointerUpRef.current);
    }
  }, [getCombinedFrequencyResponse]); // Dependencies updated to reflect refs and global functions being used

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all duration-300">
      <CardHeader 
        className="py-2 px-4"
      >
        <CardTitle className="text-white flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            Equalizer
          </div>
          <button
            onClick={resetEQ}
            className="w-6 h-6 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 hover:border-slate-400 flex items-center justify-center transition-colors"
            title="Reset EQ"
          >
            <RotateCcw className="w-3 h-3 text-slate-300" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
          <div 
            className="h-32 w-full rounded border border-white/20 bg-black/30 touch-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0.3) 100%)'
            }}
          >
            <canvas 
              ref={canvasRef}
              className="w-full h-full rounded"
              onPointerDown={handlePointerDown}
              style={{ touchAction: 'none' }} // Crucial for PointerEvents on touch devices
            ></canvas>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {/* Low Band */}
            <div className="flex flex-col items-center gap-2 p-1 bg-black/10 rounded">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-400">LOW</span>
                <button
                  onClick={() => onEQChange({ ...eq, lowFilterType: eq.lowFilterType === 'lowshelf' ? 'highpass' : 'lowshelf' })}
                  className="w-7 h-4 flex items-center justify-center text-[10px] font-thin bg-indigo-800/50 border border-indigo-600/70 rounded text-indigo-200 hover:bg-indigo-700/60 transition-colors"
                >
                  {eq.lowFilterType === 'lowshelf' ? 'SHF' : 'HPF'}
                </button>
              </div>
              <Dial value={eq.lowGain} onChange={(v) => onEQChange({ ...eq, lowGain: v })} min={-24} max={24} label="Gain" size="small" step={0.1} unit="dB" />
              <Dial value={eq.lowFreq} onChange={(v) => onEQChange({ ...eq, lowFreq: v })} scale="log" min={20} max={1000} size="small" step={1} unit="Hz" />
            </div>
            {/* Mid Band */}
            <div className="flex flex-col items-center gap-2 p-1 bg-black/10 rounded">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400">MID</span>
              </div>
              <Dial value={eq.midGain} onChange={(v) => onEQChange({ ...eq, midGain: v })} min={-24} max={24} label="Gain" size="small" step={0.1} unit="dB" />
              <div className="flex items-center ml-8">
                <Dial value={eq.midFreq} onChange={(v) => onEQChange({ ...eq, midFreq: v })} scale="log" min={200} max={10000} size="small" step={1} unit="Hz" />
                <Dial className="-ml-12" value={eq.midQ} onChange={(v) => onEQChange({ ...eq, midQ: v })} min={0.1} max={18.0} label="Q" size="xsmall" step={0.1} />
              </div>
            </div>
            {/* High Band */}
            <div className="flex flex-col items-center gap-2 p-1 bg-black/10 rounded">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-violet-400">HIGH</span>
                <button
                  onClick={() => onEQChange({ ...eq, highFilterType: eq.highFilterType === 'highshelf' ? 'lowpass' : 'highshelf' })}
                  className="w-7 h-4 flex items-center justify-center text-[10px] font-thin bg-indigo-800/50 border border-indigo-600/70 rounded text-indigo-200 hover:bg-indigo-700/60 transition-colors"
                >
                  {eq.highFilterType === 'highshelf' ? 'SHF' : 'LPF'}
                </button>
              </div>
              <Dial value={eq.highGain} onChange={(v) => onEQChange({ ...eq, highGain: v })} min={-24} max={24} label="Gain" size="small" step={0.1} unit="dB" />
              <Dial value={eq.highFreq} onChange={(v) => onEQChange({ ...eq, highFreq: v })} scale="log" min={1000} max={20000} size="small" step={1} unit="Hz" />
            </div>
          </div>
        </CardContent>
    </Card>
  );
}
