
import React, { useState, useRef, useEffect, useCallback, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, StopCircle, Play, Save, RotateCcw, Loader2, Waves, Pause } from 'lucide-react';
import { UploadFile } from "@/api/integrations";
import { AudioSnippet } from '@/api/entities';

const MAX_RECORDING_TIME_MS = 15000;

const AudioRecorderPanel = React.forwardRef(({ stream, analyser, disabled, onInitAudio, isRecording, setIsRecording }, ref) => {
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [snippetName, setSnippetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [currentAudioSource, setCurrentAudioSource] = useState(null); // Stored AudioBufferSourceNode for playback control

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimeoutRef = useRef(null);
  const recordingStartRef = useRef(0);
  const recordingProgressIntervalRef = useRef(null); // Only for recording progress via setInterval
  const playbackAnimationFrameIdRef = useRef(null); // For playback progress via requestAnimationFrame
  const canvasRef = useRef(null);

  // Waveform display for all times (live audio, recording, playback)
  const drawWaveform = useCallback(() => {
    if (!analyser || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = isRecording ? 'rgb(239, 68, 68)' : 'rgb(56, 189, 248)';
    canvasCtx.beginPath();
    
    const sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;

    // Amplitude multiplier to make the waveform appear louder
    const amplitudeMultiplier = 1.0; // Adjust this value to increase/decrease visual amplitude

    for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] / 128.0 - 1) * amplitudeMultiplier + 1; // Normalize and apply multiplier
        const y = v * canvas.height / 2;
        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }, [isRecording, analyser]);

  // Continuous waveform animation
  useEffect(() => {
    let animationFrameId;
    const render = () => {
        drawWaveform();
        animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [drawWaveform]);

  const handleStopPlayback = useCallback(() => {
    if (currentAudioSource) { // Check for AudioBufferSourceNode
      try {
        currentAudioSource.stop(); // Stop the Web Audio API source
      } catch (e) {
        // Source might have already stopped or errored, catch to prevent crash
        console.warn("Error stopping audio source:", e);
      }
      setCurrentAudioSource(null); // Clear the source
    }
    setIsPlayingRecorded(false);
    if (playbackAnimationFrameIdRef.current) {
      cancelAnimationFrame(playbackAnimationFrameIdRef.current);
      playbackAnimationFrameIdRef.current = null;
    }
    setProgress(0); // Reset progress
  }, [currentAudioSource]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearTimeout(recordingTimeoutRef.current);
    clearInterval(recordingProgressIntervalRef.current); // Clear recording specific interval
    recordingProgressIntervalRef.current = null;
    setIsRecording(false);
    setProgress(0); // Reset progress when recording stops
  }, [setIsRecording]);

  const startRecording = async () => {
    if (disabled || !stream) {
      alert("Recording is disabled or audio stream is not available.");
      return;
    }
    await onInitAudio();
    if (!stream) {
      console.error("Audio stream is not available after init.");
      return;
    }
    
    // Stop any playback and clear any existing progress interval/animation frames
    handleStopPlayback();
    setRecordedBlob(null);
    setRecordedBlobUrl(null);
    setSnippetName('');
    setProgress(0); // Ensure progress is 0 before starting new recording
    
    try {
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recordedChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setRecordedBlobUrl(URL.createObjectURL(blob));
        setDuration((performance.now() - recordingStartRef.current) / 1000);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      recordingStartRef.current = performance.now();
      
      recordingTimeoutRef.current = setTimeout(stopRecording, MAX_RECORDING_TIME_MS);
      
      // Clear any previous interval first for recording progress
      clearInterval(recordingProgressIntervalRef.current);
      recordingProgressIntervalRef.current = setInterval(() => {
        const elapsed = performance.now() - recordingStartRef.current;
        setProgress(Math.min(100, (elapsed / MAX_RECORDING_TIME_MS) * 100));
      }, 100);

    } catch (e) {
      console.error("Failed to start MediaRecorder:", e);
      alert("Could not start recording. Your browser might not support the required format.");
    }
  };

  useImperativeHandle(ref, () => ({
    toggleRecording: () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }));

  // Play recorded audio with progress tracking through Web Audio API
  const handlePlayRecorded = useCallback(async () => {
    if (!recordedBlobUrl || disabled) return;
    
    // Ensure audio context is ready
    await onInitAudio();
    
    if (isPlayingRecorded) {
      // Stop playback if currently playing
      handleStopPlayback();
      return;
    }

    // Clear any lingering animation frame from previous playback attempts/stops
    if (playbackAnimationFrameIdRef.current) {
        cancelAnimationFrame(playbackAnimationFrameIdRef.current);
        playbackAnimationFrameIdRef.current = null;
    }

    try {
      // Load and decode the audio data
      const response = await fetch(recordedBlobUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      // Ensure audioContext is available globally via window.audioContext,
      // as assumed by onInitAudio() initializing it.
      if (!window.audioContext) {
          console.error("AudioContext not initialized. Call onInitAudio() first.");
          return;
      }
      const audioBuffer = await window.audioContext.decodeAudioData(arrayBuffer);
      
      // Create audio source and connect to analyser
      const source = window.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect through analyser so it shows in waveform
      source.connect(analyser);
      // Connect to destination (speakers)
      source.connect(window.audioContext.destination);
      
      setCurrentAudioSource(source); // Store the new source object
      setIsPlayingRecorded(true);
      
      const startTime = window.audioContext.currentTime; // Get current time of the AudioContext
      const audioDuration = audioBuffer.duration;
      
      // Update progress during playback
      const updateProgress = () => {
        // Check if playback has been explicitly stopped or if source no longer exists
        if (!isPlayingRecorded || !currentAudioSource) return;
        
        const elapsed = window.audioContext.currentTime - startTime;
        const progressPercent = Math.min(100, (elapsed / audioDuration) * 100);
        setProgress(progressPercent);
        
        if (elapsed < audioDuration) {
          playbackAnimationFrameIdRef.current = requestAnimationFrame(updateProgress);
        } else {
          // Playback finished naturally
          handleStopPlayback();
        }
      };
      
      source.onended = () => {
        // This event fires when the buffer finishes playing
        handleStopPlayback(); // Ensure state is reset
      };
      
      source.start(0); // Start playback immediately
      playbackAnimationFrameIdRef.current = requestAnimationFrame(updateProgress); // Start initial frame for progress
      
    } catch (error) {
      console.error('Error playing recorded audio:', error);
      handleStopPlayback(); // Ensure state is reset on error
    }
  }, [recordedBlobUrl, disabled, isPlayingRecorded, analyser, onInitAudio, handleStopPlayback, currentAudioSource]);

  const handleSave = async () => {
    if (!recordedBlob || !snippetName.trim() || disabled) return;

    setIsSaving(true);
    try {
      const file = new File([recordedBlob], `${snippetName.trim()}.webm`, { type: 'audio/webm' });
      const { file_url } = await UploadFile({ file });
      await AudioSnippet.create({
        name: snippetName.trim(),
        audio_data_url: file_url,
        duration: duration,
      });
      window.dispatchEvent(new CustomEvent('audioSnippetSaved'));
      handleReset();
    } catch (error) {
      console.error("Failed to save audio snippet:", error);
      alert("Error: Could not save audio snippet.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    stopRecording(); // Ensures recording is stopped and interval cleared
    handleStopPlayback(); // This will also clear progress and reset states
    setRecordedBlob(null);
    setRecordedBlobUrl(null);
    setSnippetName('');
    setDuration(0);
    setProgress(0); // Explicitly reset progress here for a clean slate
  };

  const formattedDuration = duration.toFixed(1);

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)] transition-all duration-300">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <Waves className="w-4 h-4 text-sky-400" />
          Audio Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="relative w-full h-16 bg-black/30 rounded-md overflow-hidden border border-slate-600">
            <canvas ref={canvasRef} className="w-full h-full" width="300" height="64"></canvas>
            {isRecording && (
                <div className="absolute top-1 right-1 text-xs text-red-400 font-mono bg-black/50 px-1 rounded">REC</div>
            )}
        </div>
        
        {/* Progress bar always visible */}
        <div className="w-full bg-slate-700 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all ${
                isPlayingRecorded
                  ? 'bg-green-500'
                  : isRecording
                  ? 'bg-red-500'
                  : 'bg-slate-500' // Neutral color when not active
              }`} 
              style={{ width: `${progress}%` }}
            ></div>
        </div>
        
        <div className="flex gap-2 items-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              size="sm"
              className="h-8 flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={disabled || !stream}
              title="Start Recording (Max 15s)"
            >
              <Mic className="w-4 h-4 mr-2" />
              Record
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              size="sm"
              className="h-8 flex-1 bg-slate-500 hover:bg-slate-600"
              title="Stop Recording"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
          
          {/* Play/Pause button for recorded audio */}
          <Button
            onClick={handlePlayRecorded}
            size="sm"
            className="h-8 w-16 bg-green-600 hover:bg-green-700"
            disabled={!recordedBlobUrl || disabled || isRecording}
            title={isPlayingRecorded ? "Stop Playback" : "Play Recording"}
          >
            {isPlayingRecorded ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>

        <Input
          type="text"
          placeholder={recordedBlob ? `Name your snippet (${formattedDuration}s)` : "Record audio to create snippet"}
          value={snippetName}
          onChange={(e) => setSnippetName(e.target.value)}
          className="h-8 text-xs bg-black/20 border-slate-600 text-white"
          disabled={isSaving || !recordedBlob || isRecording}
        />
        
        {recordedBlobUrl && (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="h-8 flex-1 bg-sky-500 hover:bg-sky-600"
              disabled={!recordedBlob || !snippetName.trim() || isSaving || disabled || isRecording}
              title="Save Audio Snippet"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
            <Button
              onClick={handleReset}
              size="icon"
              variant="outline"
              className="h-8 w-8 border-slate-600 text-slate-400 hover:bg-slate-700"
              disabled={isSaving || isRecording}
              title="Reset Recording"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default AudioRecorderPanel;
