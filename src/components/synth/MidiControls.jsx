
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Wifi, WifiOff, Music } from 'lucide-react';

export default function MidiControls({ 
  midiOutputs, 
  selectedMidiOutput, 
  onMidiOutputChange,
  midiChannel,
  onMidiChannelChange,
  isConnected,
  midiSupported 
}) {
  if (!midiSupported) {
    return (
      <Card className="glass-panel border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <WifiOff className="w-4 h-4 text-red-400" />
            MIDI Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-400 text-xs py-3">
            Web MIDI API not supported in this browser
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          MIDI Output
          {isConnected && (
            <Badge className="bg-green-500/20 text-green-300 ml-2 text-xs">
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-slate-300 mb-1 block">MIDI Device</label>
          <Select value={selectedMidiOutput || ''} onValueChange={onMidiOutputChange}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white h-7 text-xs">
              <SelectValue placeholder="Select MIDI output..." />
            </SelectTrigger>
            <SelectContent>
              {midiOutputs.length === 0 ? (
                <SelectItem value={null} disabled>No MIDI devices found</SelectItem>
              ) : (
                midiOutputs.map((output) => (
                  <SelectItem key={output.id} value={output.id}>
                    {output.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {midiOutputs.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">
              Connect a MIDI device or use virtual MIDI ports
            </p>
          )}
        </div>

        <div>
          <label className="text-xs text-slate-300 mb-1 block">MIDI Channel</label>
          <Slider
            value={[midiChannel + 1]}
            onValueChange={(value) => onMidiChannelChange(value[0] - 1)}
            min={1}
            max={16}
            step={1}
            className="w-full h-4 slider-custom"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Ch {midiChannel + 1}</span>
            <span>Channel 1-16</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 space-y-1">
          <p>• Notes sent as MIDI Note On/Off</p>
          <p>• Velocity mapped from spheres</p>
          <p>• Works with DAWs and hardware</p>
        </div>
      </CardContent>
    </Card>
  );
}
