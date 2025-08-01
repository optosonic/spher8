
import React from 'react';
import RangeSlider from '@/components/ui/range-slider';

export default function ADSREnvelope({ envelope, onChange }) {
  const handleChange = (param, value) => {
    onChange({ ...envelope, [param]: value });
  };

  // Visual envelope rendering
  const renderEnvelope = () => {
    const { a, d, s, r } = envelope;
    const width = 200;
    const height = 80;
    const padding = 10;
    
    const totalTime = a + d + 1 + r; // 1 second for sustain visualization
    const xScale = (width - 2 * padding) / totalTime;
    const yScale = height - 2 * padding;
    
    const points = [
      { x: padding, y: height - padding }, // Start
      { x: padding + a * xScale, y: padding }, // Attack peak
      { x: padding + (a + d) * xScale, y: padding + (1 - s) * yScale }, // Decay to sustain
      { x: padding + (a + d + 1) * xScale, y: padding + (1 - s) * yScale }, // Sustain
      { x: padding + totalTime * xScale, y: height - padding } // Release
    ];
    
    const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} L ${points[4].x} ${points[4].y}`;
    
    return (
      <div className="mb-3 flex justify-center">
        <svg width={width} height={height} className="border border-slate-600 rounded bg-black/20">
          <path
            d={pathData}
            stroke="cyan"
            strokeWidth="1.5"
            fill="none"
            className="drop-shadow-sm"
          />
          <defs>
            <linearGradient id="envelopeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0.1)" />
            </linearGradient>
          </defs>
          <path
            d={`${pathData} L ${points[4].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
            fill="url(#envelopeGradient)"
          />
        </svg>
      </div>
    );
  };

  const leftSliders = [
    { name: 'A', key: 'a', value: envelope.a, max: 2, step: 0.01, units: 's' },
    { name: 'D', key: 'd', value: envelope.d, max: 2, step: 0.01, units: 's' },
  ];

  const rightSliders = [
    { name: 'S', key: 's', value: envelope.s, max: 1, step: 0.01, units: '' },
    { name: 'R', key: 'r', value: envelope.r, max: 2, step: 0.01, units: 's' },
  ];

  return (
    <div>
      {renderEnvelope()}
      <div className="grid grid-cols-2 gap-x-4">
        <div className="space-y-2">
          {leftSliders.map((slider) => (
            <RangeSlider
              key={slider.key}
              label={slider.name}
              value={slider.value}
              onChange={(v) => handleChange(slider.key, v)}
              min={0}
              max={slider.max}
              step={slider.step}
              units={slider.units}
              valueFormatter={(val) => val.toFixed(2)}
              thickness="thin"
              labelSize="text-xs"
              valueSize="text-[12px]"
              unitSize="text-[10px]"
            />
          ))}
        </div>
        <div className="space-y-2">
          {rightSliders.map((slider) => (
            <RangeSlider
              key={slider.key}
              label={slider.name}
              value={slider.value}
              onChange={(v) => handleChange(slider.key, v)}
              min={0}
              max={slider.max}
              step={slider.step}
              units={slider.units}
              valueFormatter={(val) => val.toFixed(2)}
              thickness="thin"
              labelSize="text-xs"
              valueSize="text-[12px]"
              unitSize="text-[10px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
