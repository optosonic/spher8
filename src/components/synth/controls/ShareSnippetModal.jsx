import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Copy, AlertCircle, Share2 } from 'lucide-react';
import { shareAudioSnippet } from '@/api/functions';

// Helper to create a URL-friendly slug
const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_-]+/g, '-') // collapse whitespace and replace with -
    .replace(/^-+|-+$/g, ''); // remove leading/trailing dashes
};

export default function ShareSnippetModal({ snippet, isOpen, onClose }) {
  const [publicName, setPublicName] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareResult, setShareResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (snippet) {
      setPublicName(snippet.name);
    }
    // Reset state when modal is closed or snippet changes
    setIsLoading(false);
    setError(null);
    setShareResult(null);
    setCopied(false);
  }, [snippet, isOpen]);

  const handleShare = async () => {
    if (!publicName.trim()) {
      setError('Please provide a name for the public file.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setShareResult(null);
    
    const slug = createSlug(publicName);
    const uniqueFilename = `${slug}-${Date.now()}`;

    try {
      const { data, error: apiError } = await shareAudioSnippet({
        audioUrl: snippet.audio_data_url,
        publicFilename: uniqueFilename,
        nickname: nickname.trim(),
      });

      if (apiError || !data.success) {
        throw new Error(apiError?.message || data.error || 'Failed to share snippet.');
      }
      
      setShareResult(data.publicUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-black/50 backdrop-blur-lg border-sky-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sky-400" />
            Share Audio Snippet
          </DialogTitle>
          <DialogDescription>
            Upload this snippet for public sharing on www.spher8.com.
          </DialogDescription>
        </DialogHeader>

        {!shareResult ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="publicName" className="text-right">
                Public Name
              </Label>
              <Input
                id="publicName"
                value={publicName}
                onChange={(e) => setPublicName(e.target.value)}
                className="col-span-3 h-8 text-xs bg-black/20 border-slate-600"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                Nickname
              </Label>
              <Input
                id="nickname"
                placeholder="(Optional)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="col-span-3 h-8 text-xs bg-black/20 border-slate-600"
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Share Successful!</h3>
            <p className="text-sm text-slate-300 mb-4">Your snippet is now public.</p>
            <div className="flex items-center gap-2 p-2 rounded-md bg-black/30 border border-slate-600">
                <Input
                    readOnly
                    value={shareResult}
                    className="flex-1 h-8 text-xs bg-transparent border-0 text-slate-200 focus-visible:ring-0"
                />
                <Button size="icon" className="h-6 w-6" onClick={handleCopyToClipboard}>
                    {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>
          </div>
        )}

        {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
            </div>
        )}

        <DialogFooter>
          {!shareResult ? (
            <Button
              onClick={handleShare}
              disabled={isLoading || !publicName.trim()}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              Share Snippet
            </Button>
          ) : (
            <Button onClick={handleClose} variant="outline" className="border-slate-600 text-slate-600">Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}