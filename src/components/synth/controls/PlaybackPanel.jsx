
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import RangeSlider from '@/components/ui/range-slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, Music2, Music, Timer, Loader2, Piano, SlidersHorizontal, HelpCircle } from 'lucide-react';
import MidiControls from '../MidiControls';
import { Dial } from './Dial';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function PlaybackPanel({
  isPlaying,
  onPlayPause,
  onStop,
  masterVolume,
  onMasterVolumeChange,
  bpm,
  onBpmChange,
  rhythm,
  onRhythmChange,
  audioMode,
  onAudioModeChange,
  soundSource,
  onSoundSourceChange,
  isSamplerLoading,
  midiSupported,
  midiOutputs,
  onChordPlay,
  arpeggioDelay,
  onArpeggioDelayChange,
  isChordMode,
  onIsChordModeChange,
  selectedMidiOutput,
  onMidiOutputChange,
  midiChannel,
  onMidiChannelChange,
  isConnected,
  noteLength,
  onNoteLengthChange,
  rhythmPattern,
  onRhythmPatternChange,
  cycleLength,
  notes,
  onNoteRhythmChange,
  isLockedOut = false,
  isPanningEnabled,
  onIsPanningChange,
  panningWidth, // Added prop for panning width
  onPanningWidthChange // Added prop for panning width change handler
}) {
  const [showMidiDevices, setShowMidiDevices] = React.useState(false);
  const [showMidiHelp, setShowMidiHelp] = React.useState(false);

  const rhythmButtons = [
    { value: 1, label: '♩', name: 'Crotchet' },    // Quarter note
    { value: 2, label: '♪', name: 'Quaver' },      // Eighth note
    { value: 4, label: '♬', name: 'Semi-quaver' }, // Sixteenth note
    { value: 3, label: '♪₃', name: 'Triplet' }    // Eighth note triplet
  ];

  const handleRhythmButtonClick = (rhythmValue) => {
    onRhythmChange(rhythmValue);
    const effectiveCycleLength = typeof cycleLength === 'number' && cycleLength > 0 ? cycleLength : 1;
    const newPattern = Array(effectiveCycleLength).fill(rhythmValue);
    onRhythmPatternChange(newPattern);
    
    if (notes && onNoteRhythmChange) {
      notes.forEach((note, index) => {
        onNoteRhythmChange(index, rhythmValue);
      });
    }
  };

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all duration-300">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <Play className="w-4 h-4 text-indigo-400" />
            Playback & Output
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-3">
          <div className="flex gap-1">
            <Button
              onClick={() => onAudioModeChange('web-audio')}
              variant={audioMode === 'web-audio' ? 'default' : 'outline'}
              size="sm"
              className={`text-xs h-6 px-3 ${audioMode === 'web-audio'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Web Audio
            </Button>
            
            <Button
              onClick={() => onAudioModeChange('midi')}
              size="sm"
              className={`text-xs h-6 px-3 ${
                audioMode === 'midi'
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                  : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              disabled={!midiSupported}
            >
              MIDI Out
            </Button>
            
            <Button
              onClick={() => setShowMidiDevices(!showMidiDevices)}
              size="sm"
              variant="outline"
              className={`text-xs h-6 px-3 ${showMidiDevices ? 'bg-slate-600 text-white' : 'border-slate-600 bg-slate-700 text-slate-300'} hover:bg-slate-400`}
              disabled={!midiSupported}
            >
              Devices
            </Button>

            <Button
              onClick={() => setShowMidiHelp(!showMidiHelp)}
              size="sm"
              variant="outline"
              className={`text-xs h-6 px-2 ${showMidiHelp ? 'bg-slate-600 text-white' : 'border-slate-600 bg-slate-700 text-slate-300'} hover:bg-slate-400`}
            >
              <HelpCircle className="w-3 h-3" />
            </Button>
          </div>

          {showMidiDevices && midiSupported && (
            <div className="mt-2">
              <MidiControls
                midiOutputs={midiOutputs}
                selectedMidiOutput={selectedMidiOutput}
                onMidiOutputChange={onMidiOutputChange}
                midiChannel={midiChannel}
                onMidiChannelChange={onMidiChannelChange}
                isConnected={isConnected}
                midiSupported={midiSupported}
              />
            </div>
          )}

          {showMidiHelp && (
            <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
              <h4 className="text-sm font-semibold text-white mb-2">MIDI DAW Integration</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Open your favorite DAW and create a new track set to receive MIDI input. 
                When you enable MIDI Out in Spher8, it will send notes directly to your DAW 
                where you can record them into your tracks for further production.
              </p>
            </div>
          )}

          { audioMode === 'web-audio' && (
            <>
              <div className="border-b border-white/10 !my-2"></div>
              <div>
                <Label className="text-xs text-slate-300">Sound Source</Label>
                <RadioGroup value={soundSource} onValueChange={onSoundSourceChange} className="flex gap-4 items-center">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oscillator" id="oscillator" className="w-3 h-3 border-slate-500 text-sky-400" />
                    <Label htmlFor="oscillator" className="text-xs text-slate-200 flex items-center gap-1.5"><SlidersHorizontal className="w-3 h-3 text-sky-400" /> Oscillators</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sampler" id="sampler" className="w-3 h-3 border-slate-500 text-emerald-400" />
                    <Label htmlFor="sampler" className="text-xs text-slate-200 flex items-center gap-1.5">
                      {isSamplerLoading && soundSource === 'sampler' ? <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" /> : <Piano className="w-3 h-3 text-emerald-400" />}
                      {isSamplerLoading && soundSource === 'sampler' ? 'Loading...' : 'Piano'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sampler2" id="sampler2" className="w-3 h-3 border-slate-500 text-emerald-400" />
                    <Label htmlFor="sampler2" className="text-xs text-slate-200 flex items-center gap-1.5">
                      {isSamplerLoading && soundSource === 'sampler2' ? <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" /> : <Piano className="w-3 h-3 text-emerald-400" />}
                      {isSamplerLoading && soundSource === 'sampler2' ? 'Loading...' : 'Piano Forest'}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          <div className="text-xs text-slate-500 text-center h-4">
            Click MIDI Out to connect external DAW.
          </div>

          <div className="border-b border-white/10 !my-3"></div>

          <div className="flex gap-1">
            <Button
              onClick={onPlayPause}
              size="lg"
              className={`w-48 h-10 ${
                isPlaying 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''} text-white font-bold transition-colors relative overflow-hidden`}
              disabled={isLockedOut}
              title={isLockedOut ? 'Upgrade to continue playing notes' : (isPlaying ? 'Pause Playback' : 'Start Playback')}
            >
              {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Button
              onClick={onStop}
              size="lg"
              variant="outline"
              className={`h-10 ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''} border-slate-600 bg-slate-700 text-slate-400 hover:bg-slate-400 hover:text-white`}
              disabled={isLockedOut}
              title={isLockedOut ? 'Upgrade to continue playing notes' : 'Stop Playback'}
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </div>
          
          {/* MASTER VOLUME SLIDER REPLACEMENT */}
          <RangeSlider
            label="Master Volume"
            value={masterVolume}
            onChange={onMasterVolumeChange}
            min={0}
            max={100}
            step={1}
            units="%"
            thickness="thick"
            labelSize = 'text-sm'
            valueSize = 'text-xs'
            boldLabel={true}
          />
          
          {/* BPM SLIDER REPLACEMENT */}
          <RangeSlider
            label="BPM"
            value={bpm}
            onChange={onBpmChange}
            min={40}
            max={240}
            step={1}
            units="BPM"
            thickness="thick"
            labelSize = 'text-sm'
            valueSize = 'text-xs'
            boldLabel={true}
          />
          
          <div className="flex items-end gap-3">
            <div className="w-full">
              <label className="text-xs text-slate-300 mb-1 block">Rhythm</label>
              <div className="flex justify-between px-4 mb-6">
                {rhythmButtons.map((btn) => (
                  <Button
                    key={btn.value}
                    onClick={() => handleRhythmButtonClick(btn.value)}
                    variant={rhythm === btn.value ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 text-sm ${
                      rhythm === btn.value
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-green-500/20 border-green-500/50 text-white hover:bg-white hover:text-green-500'
                    }`}
                    title={`Set all notes to ${btn.name} rhythm`}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center space-y-1 pt-1">
                <label className="text-xs text-slate-300 -mb-1"><Timer className="w-3 h-3"/></label>
                <Dial
                    value={noteLength * 100}
                    onChange={(v) => onNoteLengthChange(v / 100)}
                    min={20}
                    max={100}
                    step={1}
                    size={32}
                    aria-label="Note Length"
                />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div>
              <Button
                onClick={() => onIsChordModeChange(!isChordMode)}
                size="sm"
                className={`h-8 px-4 text-s transition-colors ${
                  isChordMode
                    ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                Chord
              </Button>
            </div>
            <div>
              <Button
                onClick={onChordPlay}
                size="sm"
                variant="outline"
                className={`h-8 px-4 ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''} border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-400 hover:text-white`}
                disabled={isLockedOut}
                title={isLockedOut ? 'Upgrade to continue playing notes' : 'Play all notes once as a chord/arpeggio'}
              >
                <Play className="w-3 h-3 mr-1" />
                Play Once
              </Button>
            </div>
            <RangeSlider
              label="Arp"
              value={arpeggioDelay}
              onChange={(v) => onArpeggioDelayChange(v)}
              min={0}
              max={100}
              units="ms"
              thickness="medium"
              labelSize="text-xs"
              valueSize="text-xs"
              boldLabel={true}
            />
          </div>
          
          <div className="flex items-center gap-x-2">
            <Label htmlFor="panning-toggle" className="text-xs text-slate-200 flex flex-col leading-none space-y-0">
                  <span>Z-Axis</span>
                  <span>Panning</span>
                </Label>
            <Switch 
              id="panning-toggle" 
              checked={isPanningEnabled} 
              onCheckedChange={onIsPanningChange}
              className="data-[state=unchecked]:bg-sky-400/80 data-[state=checked]:bg-sky-400/30 [&>span]:bg-white data-[state=checked]:shadow-[0_0_10px_theme(colors.sky.400/80)] border border-sky-300"
            />
            <div className={`transition-opacity duration-300 flex-1 ${!isPanningEnabled || isLockedOut ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <RangeSlider
                label="Pan Width"
                value={panningWidth}
                onChange={onPanningWidthChange}
                min={0}
                max={100}
                step={1}
                units="%"
                thickness="medium"
                labelSize="text-xs"
                valueSize="text-xs"
                boldLabel={true}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
