
import React, { useCallback } from 'react';

export default function Dial({ value, onChange, min = 0, max = 100, step = 1, label, size = "medium", unit = "", disabled = false, scale }) {
  // Helper functions for logarithmic conversion
  const getLogarithmicValue = useCallback((linearPos, minValue, maxValue) => {
    if (minValue <= 0 || maxValue <= 0) {
      // Fallback to linear if min/max are not suitable for log scale
      return linearPos * (maxValue - minValue) + minValue;
    }
    const logMin = Math.log(minValue);
    const logMax = Math.log(maxValue);
    const logValue = logMin + (logMax - logMin) * linearPos;
    return Math.exp(logValue);
  }, []);

  const getLinearPosition = useCallback((logValue, minValue, maxValue) => {
    if (minValue <= 0 || maxValue <= 0) {
      // Fallback to linear if min/max are not suitable for log scale
      return (logValue - minValue) / (maxValue - minValue);
    }
    // Ensure logValue is positive for Math.log
    if (logValue <= 0) logValue = 0.001; // Smallest positive value
    const logMin = Math.log(minValue);
    const logMax = Math.log(maxValue);
    const linearPos = (Math.log(logValue) - logMin) / (logMax - logMin);
    return Math.max(0, Math.min(1, linearPos)); // Clamp to 0-1 range
  }, []);

  // Modify valueToAngle to handle logarithmic scale
  const valueToAngle = (val) => {
    let normalizedPos;
    if (scale === 'log') {
      normalizedPos = getLinearPosition(val, min, max);
    } else {
      normalizedPos = (val - min) / (max - min);
    }
    // The dial covers 270 degrees (-135 to +135)
    return (normalizedPos * 270) - 135;
  };

  // Modify angleToValue to handle logarithmic scale
  const angleToValue = (angle) => {
    // Normalize angle from -135..135 to 0..270
    const normalizedAngle = angle + 135;
    // Convert 0..270 to a linear position 0..1
    const linearPos = normalizedAngle / 270;

    let calculatedValue;
    if (scale === 'log') {
      calculatedValue = getLogarithmicValue(linearPos, min, max);
    } else {
      calculatedValue = linearPos * (max - min) + min;
    }

    // Apply step to the calculated value, if provided
    if (step) {
      calculatedValue = Math.round(calculatedValue / step) * step;
    }

    // Clamp value to min/max range
    return Math.max(min, Math.min(max, calculatedValue));
  };
  
  const displayAngle = valueToAngle(value);
  
  const handleMouseDown = (e) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const handleMouseMove = (mouseEvent) => {
      const deltaX = mouseEvent.clientX - centerX;
      const deltaY = mouseEvent.clientY - centerY;
      
      const radians = Math.atan2(deltaY, deltaX);
      
      let degrees = (radians * 180) / Math.PI + 90;
      // Adjust degrees to be within -180 to 180 range, aligning with dial's -135 to 135
      if (degrees > 180) degrees -= 360; 
      
      const newValue = angleToValue(degrees);
      onChange(newValue);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleTouchStart = (e) => {
    if (disabled) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleTouchMove = (touchEvent) => {
      touchEvent.preventDefault();
      
      const touch = touchEvent.touches[0];
      const deltaX = touch.clientX - centerX;
      const deltaY = touch.clientY - centerY;

      const radians = Math.atan2(deltaY, deltaX);
      let degrees = (radians * 180) / Math.PI + 90;
      if (degrees > 180) degrees -= 360;

      const newValue = angleToValue(degrees);
      onChange(newValue);
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    handleTouchMove(e); // Trigger immediately to set initial value if needed
  };

  const isLarge = size === 'large';
  const isXSmall = size === 'xsmall';

  const dialClasses = isLarge
    ? "w-12 h-12 border-blue-400 bg-purple-900/30 hover:border-blue-300"
    : isXSmall
      ? "w-6 h-6 border-indigo-400 bg-indigo-900/30 hover:border-indigo-300"
      : "w-8 h-8 border-green-400 bg-green-900/30 hover:border-green-300";

  const needleClasses = isLarge
    ? "w-1 h-4 bg-blue-400 top-1"
    : isXSmall
      ? "w-1 h-2.5 bg-indigo-400 top-0.4"
      : "w-1 h-3 bg-green-400 top-0.5";
      
  const gradientClasses = isLarge
    ? "from-blue-500/20 to-purple-500/20"
    : isXSmall
      ? "from-indigo-500/20 to-purple-500/20"
      : "from-green-500/20 to-green-500/20";
      
  const valueColor = isLarge ? "text-blue-400" : isXSmall ? "text-indigo-300" : "text-green-400";
  const labelStyle = isXSmall ? "text-[10px] font-thin" : "text-xs";
  const valueStyle = isXSmall ? "text-[10px] font-light" : "text-xs";

  // Determine decimal places for display based on step prop
  const getDecimalPlaces = (stepValue) => {
    if (stepValue === undefined || stepValue === null) return 0;
    const stepString = stepValue.toString();
    const decimalIndex = stepString.indexOf('.');
    return decimalIndex === -1 ? 0 : stepString.length - decimalIndex - 1;
  };

  const displayValue = value.toFixed(getDecimalPlaces(step)) + unit;
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`relative rounded-full border-2 transition-colors ${dialClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div 
          className={`absolute rounded-full left-1/2 transform -translate-x-1/2 origin-bottom ${needleClasses}`}
          style={{ transform: `translateX(-50%) rotate(${displayAngle}deg)`, transformOrigin: '50% 100%' }}
        />
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradientClasses}`} />
      </div>
      <span className={`text-slate-300 ${labelStyle}`}>{label}</span>
      <span className={`font-mono w-12 text-center ${valueColor} ${valueStyle}`}>{displayValue}</span>
    </div>
  );
}
