
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Move } from 'lucide-react'; // Changed from Move3D to RotateCw
import Dial from './Dial';

export default function NavigationPanel({ structureTransform, onStructureTransformChange }) {
  return (
    <Card className="bg-black/20 backdrop-blur-sm border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Move className="w-4 h-4 text-sky-400" /> {/* Icon changed to RotateCw and color to fuchsia-400 */}
          3D Navigation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-3">
        {/* Transpose Section - Single Row */}
        <div className="flex justify-evenly items-center gap-3">
          {/* Main Transpose Dial */}
          <Dial
            value={structureTransform.yTranslation}
            onChange={(value) => onStructureTransformChange({ ...structureTransform, yTranslation: Math.round(value) })}
            min={-36}
            max={36}
            label="Transpose"
            size="large"
            disabled={false}
          />
          
          {/* Auto Checkbox */}
          <div className="flex items-center space-x-1">
            <Checkbox
              id="auto-transpose"
              className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500 border-sky-500 h-3 w-3"
              checked={structureTransform.autoTranspose || false}
              onCheckedChange={(checked) => onStructureTransformChange({ 
                ...structureTransform, 
                autoTranspose: checked 
              })}
            />
            <label htmlFor="auto-transpose" className="text-xs text-slate-300">Auto</label>
          </div>
          
          {/* Range Dial */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-slate-300">Range</span>
            <Dial
              value={structureTransform.autoTransposeRange || 12}
              onChange={(value) => onStructureTransformChange({ 
                ...structureTransform, 
                autoTransposeRange: Math.round(value)
              })}
              min={1}
              max={24}
              label=""
              size="small"
            />
          </div>
          
          {/* Speed Dial */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-slate-300">Speed</span>
            <Dial
              value={structureTransform.autoTransposeSpeed || 1}
              onChange={(value) => onStructureTransformChange({ 
                ...structureTransform, 
                autoTransposeSpeed: value 
              })}
              min={0}
              max={10}
              label=""
              size="small"
              step={0.1}
            />
          </div>
        </div>
        
        <div className="border-t border-white/10"></div>
        
        {/* Rotation Section */}
        <div>
          <label className="text-xs text-slate-300 mb-2 block">Rotation Controls</label>
          
          {/* Blue Rotation Dials */}
          <div className="flex justify-evenly items-center gap-2 mb-2">
            <Dial
              value={structureTransform.xRotation}
              onChange={(value) => {
                console.log('X Rotation dial changed to:', value); // Debug log
                onStructureTransformChange({ ...structureTransform, xRotation: value });
              }}
              label="X"
              min={0}
              max={360}
              size="large"
            />
            <Dial
              value={structureTransform.yRotation}
              onChange={(value) => {
                console.log('Y Rotation dial changed to:', value); // Debug log
                onStructureTransformChange({ ...structureTransform, yRotation: value });
              }}
              label="Y"
              min={0}
              max={360}
              size="large"
            />
            <Dial
              value={structureTransform.zRotation}
              onChange={(value) => {
                console.log('Z Rotation dial changed to:', value); // Debug log
                onStructureTransformChange({ ...structureTransform, zRotation: value });
              }}
              label="Z"
              min={0}
              max={360}
              size="large"
            />
          </div>

          {/* Auto-Rotate Checkboxes */}
          <div className="flex justify-evenly items-center gap-2 mb-2">
            <div className="flex items-center space-x-1">
              <Checkbox
                id="auto-rotate-x"
                className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500 border-sky-500 h-3 w-3"
                checked={structureTransform.autoRotateX || false}
                onCheckedChange={(checked) => onStructureTransformChange({ ...structureTransform, autoRotateX: checked })}
              />
              <label htmlFor="auto-rotate-x" className="text-xs text-slate-300">X-Axis</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="auto-rotate-y"
                className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500 border-sky-500 h-3 w-3"
                checked={structureTransform.autoRotateY || false}
                onCheckedChange={(checked) => onStructureTransformChange({ ...structureTransform, autoRotateY: checked })}
              />
              <label htmlFor="auto-rotate-y" className="text-xs text-slate-300">Y-Axis</label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="auto-rotate-z"
                className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500 border-sky-500 h-3 w-3"
                checked={structureTransform.autoRotateZ || false}
                onCheckedChange={(checked) => onStructureTransformChange({ ...structureTransform, autoRotateZ: checked })}
              />
              <label htmlFor="auto-rotate-z" className="text-xs text-slate-300">Z-Axis</label>
            </div>
          </div>

          {/* Green Speed Dials */}
          <div className="flex justify-evenly items-center gap-2">
            <Dial
              value={structureTransform.autoRotateSpeedX || 1}
              onChange={(value) => onStructureTransformChange({ ...structureTransform, autoRotateSpeedX: value })}
              min={1} max={10} label="" size="small" step={0.1}
            />
            <Dial
              value={structureTransform.autoRotateSpeedY || 1}
              onChange={(value) => onStructureTransformChange({ ...structureTransform, autoRotateSpeedY: value })}
              min={1} max={10} label="" size="small" step={0.1}
            />
            <Dial
              value={structureTransform.autoRotateSpeedZ || 1}
              onChange={(value) => onStructureTransformChange({ ...structureTransform, autoRotateSpeedZ: value })}
              min={1} max={10} label="" size="small" step={0.1}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
