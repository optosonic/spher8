
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MidiSnippet } from '@/api/entities';
import { Download, Trash2, Edit, Save, ListMusic, Music } from 'lucide-react'; // Added Music
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MidiSnippetPanel({ disabled }) {
  const [snippets, setSnippets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const fetchSnippets = async () => {
    try {
      const snippetList = await MidiSnippet.list();
      setSnippets(snippetList);
    } catch (error) {
      console.error("Failed to fetch MIDI snippets:", error);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const handleDownload = (snippet) => {
    try {
      const byteCharacters = atob(snippet.midiData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${snippet.name.replace(/[^a-z0-9]/gi, '_')}.mid`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download MIDI file:", error);
    }
  };

  const handleRename = async (snippetId) => {
    if (!editingName.trim()) return;
    try {
      await MidiSnippet.update(snippetId, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
      fetchSnippets();
    } catch (error) {
      console.error("Failed to rename snippet:", error);
    }
  };

  const handleDelete = async (snippetId) => {
    try {
      await MidiSnippet.delete(snippetId);
      fetchSnippets();
    } catch (error) {
      console.error("Failed to delete snippet:", error);
    }
  };
  
  // This is a placeholder for when the parent component signals a refresh.
  // In a real app, you might use a more robust state management solution.
  useEffect(() => {
    const handleSnippetSaved = () => fetchSnippets();
    window.addEventListener('snippetSaved', handleSnippetSaved);
    return () => window.removeEventListener('snippetSaved', handleSnippetSaved);
  }, []);

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Music className="w-4 h-4 text-rose-400" />
          MIDI Snippets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {snippets.length === 0 ? (
            <p className="text-xs text-center text-slate-400 py-4">No snippets saved yet.</p>
          ) : (
            snippets.map((snippet) => (
              <div key={snippet.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                {editingId === snippet.id ? (
                  <Input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-6 text-xs bg-black/30 border-slate-500"
                    autoFocus
                    onBlur={() => handleRename(snippet.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(snippet.id)}
                  />
                ) : (
                  <span className="text-xs text-white truncate">{snippet.name}</span>
                )}
                <div className="flex items-center gap-1">
                  {editingId !== snippet.id && (
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => { setEditingId(snippet.id); setEditingName(snippet.name); }} disabled={disabled}>
                        <Edit className="w-3 h-3" />
                     </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => handleDownload(snippet)} disabled={disabled}>
                    <Download className="w-3 h-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-400 hover:text-rose-300" disabled={disabled}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the MIDI snippet "{snippet.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(snippet.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
