
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Pause, Square, Plus, RotateCcw, Volume2, Move3D, Sun, Music2, BarChart, Hash } from 'lucide-react';
import { SCALES, ROOT_NOTES } from './scales';

const Dial = ({ value, onChange, min = 0, max = 360, label, size = 'large', disabled = false }) => {
  // Define the angular range for the dial's indicator
  const START_ANGLE = -135; // Corresponds to ~7:30 on a clock, for the start of the usable range
  const END_ANGLE = 135;   // Corresponds to ~4:30 on a clock, for the end of the usable range
  const ANGLE_RANGE = END_ANGLE - START_ANGLE; // Total angular span for the value range

  // Maps a given value (within min-max) to an angle (within START_ANGLE-END_ANGLE)
  const valueToAngle = (val) => {
    const percent = (val - min) / (max - min); // Calculate value's position as a percentage of the range
    return START_ANGLE + percent * ANGLE_RANGE; // Map percentage to the angular range
  };

  // Maps an angle (from user interaction) back to a value (within min-max)
  const angleToValue = (angle) => {
    // Clamp the angle to the usable range to prevent indicator from going too far
    const clampedAngle = Math.max(START_ANGLE, Math.min(END_ANGLE, angle));
    // Calculate the percentage based on the clamped angle within the angular range
    const percent = (clampedAngle - START_ANGLE) / ANGLE_RANGE;
    // Map percentage back to the original value range
    return min + percent * (max - min);
  };
  
  // The angle at which the needle will be displayed based on the current value
  const displayAngle = valueToAngle(value);
  
  const handleMouseDown = (e) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const handleMouseMove = (mouseEvent) => {
      const deltaX = mouseEvent.clientX - centerX;
      const deltaY = mouseEvent.clientY - centerY;
      
      // Calculate radians from the center to the mouse position
      const radians = Math.atan2(deltaY, deltaX);
      
      // Convert radians to degrees relative to the 'up' position (0 degrees)
      // and normalize to a -180 to 180 range for easier clamping and mapping
      let degrees = (radians * 180) / Math.PI + 90;
      if (degrees > 180) degrees -= 360; 
      
      // Convert the calculated angle back to the component's value range
      const newValue = angleToValue(degrees);
      onChange(newValue); // Propagate the new value
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
    // Prevent the default touch behavior, like scrolling the page
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleTouchMove = (touchEvent) => {
      // Also prevent default here for consistent behavior during drag
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

    // Use { passive: false } to allow preventDefault to work
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Also handle the initial touch to allow for tapping (e.g. if you want immediate response without drag)
    // The handleTouchMove function can process the initial touch position
    handleTouchMove(e);
  };

  // Determine styling based on the 'size' prop
  const isLarge = size === 'large';
  const dialClasses = isLarge 
    ? "w-12 h-12 border-blue-400 bg-purple-900/30 hover:border-blue-300" 
    : "w-8 h-8 border-green-400 bg-green-900/30 hover:border-green-300";
  const needleClasses = isLarge 
    ? "w-1 h-4 bg-blue-400 top-1" 
    : "w-0.5 h-3 bg-green-400 top-0.5";
  const gradientClasses = isLarge 
    ? "from-blue-500/20 to-purple-500/20" 
    : "from-green-500/20 to-green-500/20";
  const valueColor = isLarge ? "text-blue-400" : "text-green-400";
  
  return (
    <div className="flex flex-col items-center gap-1"> {/* Reduced gap */}
      <div 
        className={`relative rounded-full border-2 transition-colors ${dialClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Needle element, rotated based on displayAngle */}
        <div 
          className={`absolute rounded-full left-1/2 transform -translate-x-1/2 origin-bottom ${needleClasses}`}
          style={{ transform: `translateX(-50%) rotate(${displayAngle}deg)`, transformOrigin: '50% 100%' }}
        />
        {/* Decorative gradient overlay */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradientClasses}`} />
      </div>
      <span className="text-xs text-slate-300">{label}</span>
      {/* Display value, formatted based on size */}
      <span className={`text-xs font-mono ${valueColor}`}>{isLarge ? `${Math.round(value)}` : value.toFixed(1)}</span>
    </div>
  );
};

export default function ControlPanel({ 
  isPlaying, 
  onPlayPause, 
  onStop, 
  onReset,
  isResetting,
  notes,
  masterVolume,
  onMasterVolumeChange,
  bpm,
  onBpmChange,
  rhythm,
  onRhythmChange,
  structureTransform,
  onStructureTransformChange,
  sphereBrightness,
  onSphereBrightnessChange,
  selectedScale,
  onScaleChange,
  rootNote,
  onRootNoteChange,
  sphereCount,
  onSphereCountChange,
  audioMode,
  onAudioModeChange,
  midiSupported,
  midiOutputs
}) {
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

  const rhythmButtons = [
    { value: 1, label: '♩', name: 'Crotchet' },
    { value: 2, label: '♪', name: 'Quaver' },
    { value: 4, label: '♬', name: 'Semi-quaver' }
  ];

  const renderPlaybackOutputCard = () => (
    <Card className="glass-panel border-white/10">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Music2 className="w-4 h-4 text-green-400" />
          Playback & Output
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="flex gap-1">
          <Button
            onClick={() => onAudioModeChange('web-audio')}
            variant={audioMode === 'web-audio' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs h-6 px-3 ${audioMode === 'web-audio' 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Web Audio
          </Button>
          <Button
            onClick={() => onAudioModeChange('midi')}
            variant={audioMode === 'midi' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs h-6 px-3 ${audioMode === 'midi' 
              ? 'bg-purple-500 hover:bg-purple-600' 
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
            disabled={!midiSupported || !midiOutputs || midiOutputs.length === 0}
          >
            MIDI Out
          </Button>
        </div>
        
        <div className="border-b border-white/10 !my-3"></div>

        <div className="flex gap-1">
          <Button
            onClick={onPlayPause}
            size="sm"
            className={`flex-1 transition-colors text-xs h-7 ${
              isPlaying 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button 
            onClick={onStop} 
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white h-7 px-2"
            title="Stop and reset to beginning"
          >
            <Square className="w-3 h-3" />
          </Button>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-slate-300">Master Volume</label>
            <span className="text-xs font-mono text-slate-400">{masterVolume}</span>
          </div>
          <Slider
            value={[masterVolume]}
            onValueChange={(v) => onMasterVolumeChange(v[0])}
            min={0} max={100} step={1}
            className="h-4"
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-300">BPM</label>
              <span className="text-xs font-mono text-slate-400">{bpm}</span>
            </div>
            <Slider
              value={[bpm]}
              onValueChange={(v) => onBpmChange(v[0])}
              min={40} max={240} step={1}
              className="h-4"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300 mb-1 block">Rhythm</label>
            <div className="flex gap-1">
              {rhythmButtons.map((btn) => (
                <Button
                  key={btn.value}
                  onClick={() => onRhythmChange(btn.value)}
                  variant={rhythm === btn.value ? "default" : "outline"}
                  size="sm"
                  className={`w-6 h-6 p-0 text-sm ${
                    rhythm === btn.value 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'border-green-500/50 text-green-400 hover:bg-green-500/20 hover:text-green-300'
                  }`}
                  title={btn.name}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderScalesCard = () => (
    <Card className="glass-panel border-white/10">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <BarChart className="w-4 h-4 text-cyan-400" />
          Scales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-col items-center">
            <label className="text-xs text-slate-300 mb-1 block">Root</label>
            <Dial
              value={rootNote}
              onChange={(value) => onRootNoteChange(Math.round(value))}
              min={0}
              max={11}
              label={ROOT_NOTES[rootNote]}
              size="small"
            />
          </div>
          <div className="flex-1 flex flex-col items-center">
            <label className="text-xs text-slate-300 mb-1 block">Scale</label>
            <Dial
              value={Object.keys(SCALES).indexOf(selectedScale)}
              onChange={(v) => onScaleChange(Object.keys(SCALES)[Math.round(v)])}
              min={0}
              max={Object.keys(SCALES).length - 1}
              label={selectedScale.substring(0, 6)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const render3DNavigationCard = () => (
    <Card className="glass-panel border-white/10">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Move3D className="w-4 h-4 text-violet-400" />
          3D Navigation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-col items-center justify-center">
          <Dial
            value={structureTransform.yTranslation}
            onChange={(value) => onStructureTransformChange({ ...structureTransform, yTranslation: value })}
            min={-10}
            max={10}
            label="Transpose"
            size="large"
            disabled={structureTransform.autoTranspose}
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 mb-2 block">Auto-Transpose</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-transpose"
                className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500 border-sky-500 h-3 w-3"
                checked={structureTransform.autoTranspose || false}
                onCheckedChange={(checked) => onStructureTransformChange({ 
                  ...structureTransform, 
                  autoTranspose: checked 
                })}
              />
              <label htmlFor="auto-transpose" className="text-xs text-slate-300">Enable Auto-Transpose</label>
            </div>
            
            {structureTransform.autoTranspose && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-300">Range</span>
                  <Dial
                    value={structureTransform.autoTransposeRange || 5}
                    onChange={(value) => onStructureTransformChange({ 
                      ...structureTransform, 
                      autoTransposeRange: value 
                    })}
                    min={1}
                    max={10}
                    label="±"
                    size="small"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-300">Speed</span>
                  <Dial
                    value={structureTransform.autoTransposeSpeed || 1}
                    onChange={(value) => onStructureTransformChange({ 
                      ...structureTransform, 
                      autoTransposeSpeed: value 
                    })}
                    min={0.1}
                    max={5}
                    label="x"
                    size="small"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="text-xs text-slate-300 mb-1 block">Rotation Controls</label>
          <div className="flex justify-between items-center gap-2">
            <Dial
              value={structureTransform.xRotation}
              onChange={(value) => onStructureTransformChange({ ...structureTransform, xRotation: value })}
              label="X"
              min={0}
              max={360}
            />
            <Dial
              value={structureTransform.yRotation}
              onChange={(value) => onStructureTransformChange({ ...structureTransform, yRotation: value })}
              label="Y"
              min={0}
              max={360}
            />
            <Dial
              value={structureTransform.zRotation}
              onChange={(value) => onStructureTransformChange({ ...structureTransform, zRotation: value })}
              label="Z"
              min={0}
              max={360}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-300 mb-2 block">Auto-Rotate</label>
          <div className="space-y-2">
            {/* X-Axis Auto-Rotate */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-rotate-x"
                  className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500 border-sky-500 h-3 w-3"
                  checked={structureTransform.autoRotateX || false}
                  onCheckedChange={(checked) => onStructureTransformChange({ 
                    ...structureTransform, 
                    autoRotateX: checked 
                  })}
                />
                <label htmlFor="auto-rotate-x" className="text-xs text-slate-300">X-Axis</label>
              </div>
              <Dial
                value={structureTransform.autoRotateSpeedX || 1}
                onChange={(value) => onStructureTransformChange({ 
                  ...structureTransform, 
                  autoRotateSpeedX: value 
                })}
                min={0}
                max={5}
                label=""
                size="small"
              />
            </div>

            {/* Y-Axis Auto-Rotate */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-rotate-y"
                  className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500 border-sky-500 h-3 w-3"
                  checked={structureTransform.autoRotateY || false}
                  onCheckedChange={(checked) => onStructureTransformChange({ 
                    ...structureTransform, 
                    autoRotateY: checked 
                  })}
                />
                <label htmlFor="auto-rotate-y" className="text-xs text-slate-300">Y-Axis</label>
              </div>
              <Dial
                value={structureTransform.autoRotateSpeedY || 1}
                onChange={(value) => onStructureTransformChange({ 
                  ...structureTransform, 
                  autoRotateSpeedY: value 
                })}
                min={0}
                max={5}
                label=""
                size="small"
              />
            </div>

            {/* Z-Axis Auto-Rotate */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-rotate-z"
                  className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500 border-sky-500 h-3 w-3"
                  checked={structureTransform.autoRotateZ || false}
                  onCheckedChange={(checked) => onStructureTransformChange({ 
                    ...structureTransform, 
                    autoRotateZ: checked 
                  })}
                />
                <label htmlFor="auto-rotate-z" className="text-xs text-slate-300">Z-Axis</label>
              </div>
              <Dial
                value={structureTransform.autoRotateSpeedZ || 1}
                onChange={(value) => onStructureTransformChange({ 
                  ...structureTransform, 
                  autoRotateSpeedZ: value 
                })}
                min={0}
                max={5}
                label=""
                size="small"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVisualsCard = () => (
    <Card className="glass-panel border-white/10">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Sun className="w-4 h-4 text-yellow-400" />
          Visuals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-slate-300">Sphere Brightness</label>
            <span className="text-xs font-mono text-slate-400">{sphereBrightness.toFixed(2)}</span>
          </div>
          <Slider
            value={[sphereBrightness]}
            onValueChange={(value) => onSphereBrightnessChange(value[0])}
            min={0}
            max={1.0}
            step={0.05}
            className="w-full h-4"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderSphereCountCard = () => (
    <Card className="glass-panel border-white/10">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Hash className="w-4 h-4 text-orange-400" />
          Sphere Count
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 p-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onSphereCountChange(Math.max(1, sphereCount - 1))}
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
            disabled={sphereCount <= 1}
          >
            -
          </Button>
          <div className="w-16 text-center">
            <span className="text-2xl font-bold text-orange-400">{sphereCount}</span>
            <div className="text-xs text-slate-400">spheres</div>
          </div>
          <Button
            onClick={() => onSphereCountChange(Math.min(8, sphereCount + 1))}
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
            disabled={sphereCount >= 8}
          >
            +
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSceneControlCard = () => (
    <Card className="glass-panel border-white/10">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4 text-purple-400" />
          Scene Control
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="w-full border-purple-600/50 bg-purple-900/30 text-white hover:bg-purple-800/40 hover:text-white disabled:opacity-50 text-xs h-7"
          disabled={isResetting}
        >
          <RotateCcw className={`w-3 h-3 mr-1 ${isResetting ? 'animate-spin' : ''}`} />
          Reset to 4 Spheres
        </Button>
      </CardContent>
    </Card>
  );

  const renderMolecularChainCard = () => (
    <Card className="glass-panel border-white/10">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          Molecular Chain
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
            {notes.length}/{sphereCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {notes.map((note, index) => (
            <div
              key={note.id || index}
              className="flex items-center justify-between p-2 rounded border border-white/10 bg-white/5"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: note.color }}
                />
                <span className="text-xs text-white font-medium">
                  {frequencyToNote(note.frequency)}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {note.frequency ? `${Math.round(note.frequency)}Hz` : ''}
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="text-center text-slate-400 text-xs py-3">
              No notes added yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-3">
      {renderPlaybackOutputCard()}
      {renderScalesCard()}
      {render3DNavigationCard()}
      {renderVisualsCard()}
      {renderSphereCountCard()}
      {renderSceneControlCard()}
      {renderMolecularChainCard()}
    </div>
  );
}
