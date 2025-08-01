import React, { useRef, useCallback } from 'react';

const RangeSlider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  valueFormatter = (v) => v,
  thickness = 'medium',
  labelSize = 'text-sm',
  valueSize = 'text-base'
}) => {
  const sliderRef = useRef(null);
  const isDraggingRef = useRef(false);

  const thicknessClasses = {
    thin: 'h-1',
    medium: 'h-1.5',
    thick: 'h-2'
  };

  const handleValueChange = useCallback((clientX) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = offsetX / rect.width;
    
    let newValue = min + percentage * (max - min);

    // Snap to the nearest step
    newValue = Math.round(newValue / step) * step;
    
    // Clamp the value within min/max bounds
    newValue = Math.max(min, Math.min(max, newValue));

    if (newValue !== value) {
      onChange(newValue);
    }
  }, [min, max, step, onChange, value]);

  const handlePointerMove = useCallback((event) => {
    if (!isDraggingRef.current) return;
    
    // Prevent scrolling on touch devices, which interrupts dragging
    if (event.type === 'touchmove') {
        event.preventDefault();
    }
    
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    handleValueChange(clientX);
  }, [handleValueChange]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    // Clean up event listeners from the document
    document.removeEventListener('mousemove', handlePointerMove);
    document.removeEventListener('touchmove', handlePointerMove);
    document.removeEventListener('mouseup', handlePointerUp);
    document.removeEventListener('touchend', handlePointerUp);
    
    // Restore default body styles
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [handlePointerMove]);

  const handlePointerDown = useCallback((event) => {
    // For touch events, prevent default to stop scrolling/zooming
    if (event.type === 'touchstart') {
        event.preventDefault();
    }
    
    isDraggingRef.current = true;
    
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    handleValueChange(clientX);
    
    // Add listeners to the entire document to capture movement anywhere on the page
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchend', handlePointerUp);
    
    // Prevent text selection and change cursor during drag
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

  }, [handleValueChange, handlePointerMove, handlePointerUp]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-baseline">
        <label className={`${labelSize} font-medium text-slate-300`}>{label}</label>
        <span className={`${valueSize} font-mono text-white`}>{valueFormatter(value)}</span>
      </div>
      <div
        ref={sliderRef}
        className="w-full relative cursor-pointer py-2" // Added padding for easier touch
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        style={{ touchAction: 'none' }} // Prevents default touch actions like scrolling
      >
        <div className={`w-full bg-slate-800 rounded-full ${thicknessClasses[thickness]}`} />
        <div
          className={`absolute top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full ${thicknessClasses[thickness]}`}
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow border-2 border-blue-300"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default RangeSlider;