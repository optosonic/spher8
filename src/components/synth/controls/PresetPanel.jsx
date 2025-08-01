
import React, { useState, useEffect } from 'react';
import { Preset } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, FolderDown, Trash2, ListMusic } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PresetPanel({ onSave, onLoad, disabled }) {
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');

  const fetchPresets = async () => {
    const presetList = await Preset.list();
    setPresets(presetList);
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleSave = async () => {
    if (!presetName.trim() || disabled) return;
    await onSave(presetName.trim());
    setPresetName('');
    await fetchPresets();
  };

  const handleDelete = async (id) => {
    if (disabled) return;
    await Preset.delete(id);
    await fetchPresets();
  };

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Save className="w-4 h-4 text-rose-400" />
          Presets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="New preset name..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="h-7 text-xs bg-black/20 border-slate-600 text-white"
            disabled={disabled}
          />
          <Button
            onClick={handleSave}
            size="sm"
            className="h-7 px-2 bg-rose-500 hover:bg-rose-600"
            disabled={!presetName.trim() || disabled}
            title="Save current state as a new preset"
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="h-28">
          <div className="space-y-1 pr-2">
            {presets.length > 0 ? (
              presets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between gap-1 p-1 rounded bg-black/20">
                  <span className="text-xs text-slate-200 truncate flex-1 pl-1">{preset.name}</span>
                  <Button
                    onClick={() => onLoad(preset)}
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 hover:bg-slate-700"
                    disabled={disabled}
                    title={`Load "${preset.name}"`}
                  >
                    <FolderDown className="w-3 h-3 text-slate-400" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(preset.id)}
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 hover:bg-slate-700"
                    disabled={disabled}
                    title={`Delete "${preset.name}"`}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 text-xs py-4">
                No presets saved yet.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
