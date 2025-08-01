
import React, { useState, useEffect } from 'react';
import { AudioSnippet } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Play, Trash2, ListMusic, Pause, Edit, Check, X, Loader2, Share2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ShareSnippetModal from './ShareSnippetModal'; // Import the new modal

export default function AudioSnippetPanel({ disabled }) {
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingSnippet, setPlayingSnippet] = useState(null);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [editName, setEditName] = useState('');
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [snippetToShare, setSnippetToShare] = useState(null);

  const fetchSnippets = async () => {
    try {
        setIsLoading(true);
        const snippetList = await AudioSnippet.list('-created_date');
        setSnippets(snippetList);
    } catch(e) {
        console.error("Failed to load audio snippets", e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
    
    const handleUpdate = () => fetchSnippets();
    window.addEventListener('audioSnippetSaved', handleUpdate);
    return () => window.removeEventListener('audioSnippetSaved', handleUpdate);
  }, []);

  const handleShareClick = (snippet) => {
    setSnippetToShare(snippet);
    setIsShareModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (disabled) return;
    if (playingSnippet === id) {
      handleStopPlayback();
    }
    await AudioSnippet.delete(id);
    await fetchSnippets();
  };

  const handlePlayToggle = (snippet) => {
    if (disabled) return;
    
    if (playingSnippet === snippet.id) {
      handleStopPlayback();
    } else {
      handleStartPlayback(snippet);
    }
  };

  const handleStartPlayback = (snippet) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(snippet.audio_data_url);
    audio.onended = () => {
      setPlayingSnippet(null);
      setCurrentAudio(null);
    };
    audio.onerror = () => {
      console.error("Failed to play audio snippet");
      setPlayingSnippet(null);
      setCurrentAudio(null);
    };
    
    setCurrentAudio(audio);
    setPlayingSnippet(snippet.id);
    audio.play().catch(console.error);
  };

  const handleStopPlayback = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setPlayingSnippet(null);
    setCurrentAudio(null);
  };
  
  const handleDownload = (snippet) => {
    const link = document.createElement('a');
    link.href = snippet.audio_data_url;
    link.target = '_blank';
    link.download = `${snippet.name || 'spher8-snippet'}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditStart = (snippet) => {
    setEditingSnippet(snippet.id);
    setEditName(snippet.name);
  };

  const handleEditSave = async () => {
    if (!editName.trim() || disabled) return;
    try {
      await AudioSnippet.update(editingSnippet, { name: editName.trim() });
      await fetchSnippets();
      setEditingSnippet(null);
      setEditName('');
    } catch (error) {
      console.error("Failed to update snippet name:", error);
    }
  };

  const handleEditCancel = () => {
    setEditingSnippet(null);
    setEditName('');
  };

  return (
    <>
      <Card className="bg-black/20 backdrop-blur-sm border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)] transition-all duration-300">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <ListMusic className="w-4 h-4 text-sky-400" />
            Audio Snippets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <ScrollArea className="h-32">
            <div className="space-y-1 pr-2">
              {isLoading ? (
                  <div className="flex justify-center items-center h-24">
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  </div>
              ) : snippets.length > 0 ? (
                snippets.map((snippet) => (
                  <div key={snippet.id} className="p-2 rounded bg-black/30 border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {editingSnippet === snippet.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-6 text-xs bg-black/20 border-slate-600 text-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                              autoFocus
                            />
                            <Button
                              onClick={handleEditSave}
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              disabled={!editName.trim()}
                            >
                              <Check className="w-3 h-3 text-green-500" />
                            </Button>
                            <Button
                              onClick={handleEditCancel}
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-200 truncate" title={`${snippet.name}, ${snippet.duration.toFixed(1)}s`}>
                              {snippet.name}, {snippet.duration.toFixed(1)}s
                            </span>
                            <Button
                              onClick={() => handleEditStart(snippet)}
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 opacity-60 hover:opacity-100"
                              disabled={disabled}
                              title="Edit name"
                            >
                              <Edit className="w-2.5 h-2.5 text-slate-400" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handlePlayToggle(snippet)}
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 hover:bg-slate-700"
                          disabled={disabled}
                          title={playingSnippet === snippet.id ? "Stop" : "Play"}
                        >
                          {playingSnippet === snippet.id ? (
                            <Pause className="w-3 h-3 text-sky-400" />
                          ) : (
                            <Play className="w-3 h-3 text-slate-400" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleShareClick(snippet)}
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 hover:bg-slate-700"
                          disabled={disabled}
                          title={`Share "${snippet.name}"`}
                        >
                          <Share2 className="w-3 h-3 text-sky-400" />
                        </Button>
                        <Button
                          onClick={() => handleDownload(snippet)}
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 hover:bg-slate-700"
                          disabled={disabled}
                          title={`Download "${snippet.name}"`}
                        >
                          <Download className="w-3 h-3 text-slate-400" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(snippet.id)}
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 hover:bg-slate-700"
                          disabled={disabled}
                          title={`Delete "${snippet.name}"`}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 text-xs py-4">
                  No audio snippets saved.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <ShareSnippetModal 
        snippet={snippetToShare}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
