
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, Square, Plus, X, Edit, Save, ChevronUp, ChevronDown, GripVertical, Shuffle, ChevronRight, Trash2 } from 'lucide-react';
import { Sequence } from '@/api/entities';
import { Preset } from '@/api/entities';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// The width of a single cycle on the grid. Changed from BEAT_WIDTH_PX to CYCLE_WIDTH_PX.
const CYCLE_WIDTH_PX = 60; 

// A new, more advanced Step component with resizing capabilities
const ResizableStep = ({ 
  step, 
  index, 
  presetName,
  isActive,
  onDurationChange,
  onRemove,
  totalCyclesBeforeThisStep, // Changed from totalBeatsBeforeThisStep
  currentCycle, // Changed from currentBeat
  onPlayFromHere,
  isPlaying,
  isEditMode
}) => {
  const [tempDuration, setTempDuration] = useState(step.durationBeats); // 'durationBeats' property now represents cycles
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);

  useEffect(() => {
    setTempDuration(step.durationBeats);
  }, [step.durationBeats]);
  
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    const startDuration = step.durationBeats;

    const handleMove = (moveEvent) => {
      const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const dx = currentX - startX;
      // Resizing snaps to CYCLE_WIDTH_PX
      const dCycles = Math.round(dx / CYCLE_WIDTH_PX); 
      const newDuration = Math.max(1, startDuration + dCycles);
      setTempDuration(newDuration);
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      
      setTempDuration(currentTempDuration => {
        if (currentTempDuration !== step.durationBeats) {
          onDurationChange(index, currentTempDuration);
        }
        return currentTempDuration;
      });

      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  const displayDuration = isResizing ? tempDuration : step.durationBeats;
  // Progress calculation now based on currentCycle and totalCyclesBeforeThisStep
  const progress = isActive ? Math.min(1, Math.max(0, (currentCycle - totalCyclesBeforeThisStep) / step.durationBeats)) : 0;

  return (
    <div 
      className={`relative border rounded-lg p-2 transition-all duration-200 flex flex-col justify-between group ${
        isActive 
          ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20' 
          : 'border-cyan-700/50 bg-cyan-900/30 hover:bg-cyan-800/40'
      } ${isEditMode ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-black/50' : ''}`}
      // Width is now based on CYCLE_WIDTH_PX
      style={{ width: `${displayDuration * CYCLE_WIDTH_PX}px`, flexShrink: 0 }}
    >
      {isActive && (
        <div 
          className="absolute top-0 left-0 h-1 bg-cyan-400 transition-all duration-100 ease-linear rounded-t-lg"
          style={{ width: `${progress * 100}%` }}
        />
      )}
      
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-cyan-200 truncate pr-1">
          {presetName || `...`}
        </span>
        <Button
          onClick={() => onRemove(index)}
          size="sm"
          variant="ghost"
          className="w-5 h-5 p-0 text-cyan-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="flex items-center justify-end">
        {/* Changed 'b' for beats to 'c' for cycles */}
        <span className="text-xs text-cyan-300 font-mono">{displayDuration}c</span>
      </div>
      
      {!isPlaying && !isEditMode && (
        <Button
          onClick={() => onPlayFromHere(index)}
          variant="ghost"
          size="icon"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 p-0 text-cyan-200 hover:text-white bg-black/40 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all"
          title="Play from this step"
        >
          <Play className="w-4 h-4" />
        </Button>
      )}

      {/* Drag Handle - Only visible in edit mode */}
      {isEditMode && (
         <div className="absolute top-0 left-0 h-full w-4 flex items-center justify-center cursor-grab active:cursor-grabbing">
           <GripVertical className="w-3 h-3 text-amber-300/70" />
         </div>
      )}

      {/* Resize Handle - Hidden in edit mode to avoid confusion */}
      {!isEditMode && (
        <div
          ref={resizeRef}
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute top-0 right-0 h-full w-3 cursor-ew-resize hover:bg-cyan-400/30 active:bg-cyan-400/50 transition-colors touch-none"
          style={{ touchAction: 'none' }}
          title="Drag to resize (snaps to grid)"
        />
      )}
    </div>
  );
};

export default function SequencerPanel({ 
  onLoadPreset,
  currentBpm,
  disabled,
  isPlaying,
  onPlayPause,
  isLockedOut = false // New prop
}) {
  const [isSequencerOpen, setIsSequencerOpen] = useState(false);
  const [sequences, setSequences] = useState([]);
  const [presets, setPresets] = useState([]);
  const [currentSequence, setCurrentSequence] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0); // Changed from currentBeat to currentCycle
  const [newSequenceName, setNewSequenceName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [newStepDuration, setNewStepDuration] = useState(1); // Duration now in cycles, default to 1 cycle
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoopMode, setIsLoopMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const presetMap = useRef(new Map());
  const onLoadPresetRef = useRef(onLoadPreset);
  const previousIsPlaying = useRef(isPlaying);

  // New ref to hold the most up-to-date sequence for the animation loop
  const sequenceRef = useRef(currentSequence);
  useEffect(() => {
    // This effect runs on every render, ensuring sequenceRef.current is always fresh.
    sequenceRef.current = currentSequence;
  });

  useEffect(() => {
    onLoadPresetRef.current = onLoadPreset;
  }, [onLoadPreset]);

  // When playback stops, reset the sequencer's position to the start
  // This is a "soft" reset, it doesn't interrupt the user's view until they play again.
  useEffect(() => {
    if (!isPlaying) {
      setCurrentStepIndex(0);
      setCurrentCycle(0); // Changed from setCurrentBeat(0)
      startTimeRef.current = 0;
    }
  }, [isPlaying]);

  useEffect(() => {
    loadSequences();
    loadPresets();
    
    // Listen for custom event to reload presets when a new one is saved
    const handlePresetUpdate = () => loadPresets();
    window.addEventListener('presetSaved', handlePresetUpdate);
    return () => {
      window.removeEventListener('presetSaved', handlePresetUpdate);
    };
  }, []);
  
  useEffect(() => {
    presetMap.current = new Map(presets.map(p => [p.id, p.name]));
  }, [presets]);

  const loadSequences = async () => {
    try {
      const sequenceList = await Sequence.list('-updated_date');
      setSequences(sequenceList);
    } catch (error) { console.error('Failed to load sequences:', error); }
  };

  const loadPresets = async () => {
    try {
      const presetList = await Preset.list('-updated_date');
      setPresets(presetList);
      if (presetList.length > 0 && !selectedPresetId) {
        setSelectedPresetId(presetList[0].id);
      }
    } catch (error) { console.error('Failed to load presets:', error); }
  };

  const createNewSequence = async () => {
    if (!newSequenceName.trim()) return;
    try {
      const newSequence = await Sequence.create({ name: newSequenceName, steps: [] });
      setSequences(prev => [newSequence, ...prev]);
      setCurrentSequence(newSequence);
      setNewSequenceName('');
    } catch (error) { console.error('Failed to create sequence:', error); }
  };
  
  const deleteSequence = async (e, sequenceId) => {
    e.stopPropagation();
    if (disabled) return;
    
    try {
      await Sequence.delete(sequenceId);
      
      if (currentSequence?.id === sequenceId) {
        setCurrentSequence(null);
      }
      
      await loadSequences();
    } catch (error) {
      console.error('Failed to delete sequence:', error);
    }
  };

  const deleteCurrentSequence = async () => {
    if (!currentSequence || disabled) return;
    
    try {
      await Sequence.delete(currentSequence.id);
      setCurrentSequence(null);
      await loadSequences();
    } catch (error) {
      console.error('Failed to delete sequence:', error);
    }
  };

  const updateSequenceSteps = async (newSteps) => {
    if (!currentSequence) return;
    
    const updatedSequence = { ...currentSequence, steps: newSteps };
    setCurrentSequence(updatedSequence);
    setHasUnsavedChanges(true); // Mark as unsaved
    
    // Only persist to DB, don't trigger playback logic from here directly
    try {
      await Sequence.update(currentSequence.id, { steps: newSteps });
      setHasUnsavedChanges(false); // Clear unsaved status on successful save
    } catch (error) {
      console.error('Failed to update sequence in DB:', error);
    }
  };

  const saveCurrentSequence = async () => {
    if (!currentSequence || !hasUnsavedChanges) return;
    
    try {
      await Sequence.update(currentSequence.id, { steps: currentSequence.steps });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save sequence:', error);
    }
  };

  const addStepToSequence = async () => {
    if (!currentSequence || !selectedPresetId) return;
    // newStepDuration now represents cycles
    const newStep = { presetId: selectedPresetId, durationBeats: Math.max(1, newStepDuration) };
    updateSequenceSteps([...currentSequence.steps, newStep]);
  };

  const removeStepFromSequence = async (stepIndex) => {
    const updatedSteps = currentSequence.steps.filter((_, index) => index !== stepIndex);
    updateSequenceSteps(updatedSteps);
  };

  const updateStepDuration = async (stepIndex, newDuration) => {
    const updatedSteps = [...currentSequence.steps];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], durationBeats: newDuration };
    updateSequenceSteps(updatedSteps);
  };

  const startSequencePlayback = (startIndex = 0) => {
    if (!currentSequence || currentSequence.steps.length === 0) return;
    
    // Ensure the player stops before attempting to seek or restart
    if (isPlaying) {
      onPlayPause(); // Stop playback first
      // The useEffect for `isPlaying` will reset currentCycle, currentStepIndex etc.
      // We will then handle the specific seek after the state has settled.
      // This is a bit tricky due to async state updates.
      // For now, let's simplify: if playing, just stop.
      // If paused, or after stopping, then seek.
      // This might introduce a slight delay but ensures consistent state.
      setTimeout(() => _seekAndPlay(startIndex), 50); // Small delay to allow state to reset
    } else {
      _seekAndPlay(startIndex);
    }
  };

  const _seekAndPlay = (startIndex) => {
    if (!currentSequence || currentSequence.steps.length === 0) return;

    // Calculate current cycle duration based on the starting step's preset
    const startingStep = currentSequence.steps[startIndex];
    const startingStepPreset = presets.find(p => p.id === startingStep.presetId);
    
    // Fallback values if preset not found or config missing
    const startPresetBpm = startingStepPreset?.configuration?.bpm || currentBpm;
    const startSphereCount = startingStepPreset?.configuration?.sphereCount || 4;
    const startCycleLength = startingStepPreset?.configuration?.cycleLength || startSphereCount;
    const startBeatDurationMs = (60 / startPresetBpm) * 1000;
    const startCycleDurationMs = startBeatDurationMs * startCycleLength;

    // Calculate the total cycles accumulated before this step
    const startingCycle = currentSequence.steps.slice(0, startIndex).reduce((sum, step) => sum + step.durationBeats, 0); // durationBeats now means cycles
    
    setCurrentStepIndex(startIndex);
    setCurrentCycle(startingCycle); // Changed from setCurrentBeat
    // Initialize startTimeRef correctly based on starting cycles and calculated cycle duration
    startTimeRef.current = performance.now() - (startingCycle * startCycleDurationMs); 
    
    const presetToLoad = presets.find(p => p.id === currentSequence.steps[startIndex].presetId);
    if (presetToLoad) {
      onLoadPresetRef.current(presetToLoad);
    }
    
    if (!isPlaying) { // Only call onPlayPause if not already playing
      onPlayPause();
    }
  }


  const handlePlayPauseClick = () => {
    if (onPlayPause) {
      onPlayPause();
      
      if (isPlaying) {
        window.dispatchEvent(new CustomEvent('resetCameraView'));
      }
    }
  };

  const shuffleSequence = async () => {
    if (!currentSequence || currentSequence.steps.length <= 1) return;
    
    const shuffledSteps = [...currentSequence.steps];
    
    for (let i = shuffledSteps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSteps[i], shuffledSteps[j]] = [shuffledSteps[j], shuffledSteps[i]];
    }
    
    await updateSequenceSteps(shuffledSteps);
  };

  useEffect(() => {
    // The main playback tick loop
    if (!isPlaying) {
      cancelAnimationFrame(animationFrameRef.current);
      return;
    }
    
    const currentSequenceFromRef = sequenceRef.current;
    if (!currentSequenceFromRef || currentSequenceFromRef.steps.length === 0) {
      cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    // Get the current preset to determine sphere count and BPM for this step
    const currentStep = currentSequenceFromRef.steps[currentStepIndex];
    const currentPreset = presets.find(p => p.id === currentStep?.presetId);
    if (!currentPreset) {
      cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const presetBpm = currentPreset.configuration?.bpm || currentBpm;
    const sphereCount = currentPreset.configuration?.sphereCount || 4;
    const cycleLength = currentPreset.configuration?.cycleLength || sphereCount; // Assuming cycleLength defaults to sphereCount beats
    
    // Calculate one complete cycle duration based on the preset's settings
    const beatDurationMs = (60 / presetBpm) * 1000;
    const cycleDurationMs = beatDurationMs * cycleLength; // One cycle = cycleLength beats
    
    if (cycleDurationMs <= 0) {
      cancelAnimationFrame(animationFrameRef.current);
      return;
    }
    
    if (startTimeRef.current === 0) {
      // If playback just started or sequence changed, set startTimeRef based on currentCycle
      startTimeRef.current = performance.now() - (currentCycle * cycleDurationMs);
    }
    
    const tick = () => {
      if (!isPlaying || !sequenceRef.current || sequenceRef.current.steps.length === 0) {
        cancelAnimationFrame(animationFrameRef.current);
        return;
      }

      // Recalculate cycleDurationMs in case BPM/preset changes during a tick
      // This ensures smooth transition if sequence changes quickly
      const currentTickStep = sequenceRef.current.steps[currentStepIndex];
      const currentTickPreset = presets.find(p => p.id === currentTickStep?.presetId);
      const tickPresetBpm = currentTickPreset?.configuration?.bpm || currentBpm;
      const tickSphereCount = currentTickPreset?.configuration?.sphereCount || 4;
      const tickCycleLength = tickPresetBpm === 0 ? 1 : (currentTickPreset?.configuration?.cycleLength || tickSphereCount); // Avoid division by zero
      const tickBeatDurationMs = (60 / tickPresetBpm) * 1000;
      const currentCycleDurationMs = tickBeatDurationMs * tickCycleLength;

      // Handle case where cycle duration might become zero
      if (currentCycleDurationMs <= 0) {
        cancelAnimationFrame(animationFrameRef.current);
        return;
      }

      const totalElapsedMs = performance.now() - startTimeRef.current;
      const totalCyclesElapsed = totalElapsedMs / currentCycleDurationMs; // Elapsed time divided by current cycle duration
      setCurrentCycle(totalCyclesElapsed); // Update currentCycle state
      
      // Calculate which step we should be in based on cycles (not beats)
      let cumulativeCycles = 0;
      let nextStepIndex = -1;

      for (let i = 0; i < sequenceRef.current.steps.length; i++) {
        // Each step duration is now measured in cycles, not beats (durationBeats property is reused)
        cumulativeCycles += sequenceRef.current.steps[i].durationBeats; 
        if (totalCyclesElapsed < cumulativeCycles) {
          nextStepIndex = i;
          break;
        }
      }
      
      if (nextStepIndex === -1) {
        const totalSequenceDurationCycles = sequenceRef.current.steps.reduce((sum, step) => sum + step.durationBeats, 0);
        if (isLoopMode && totalSequenceDurationCycles > 0) {
          // Loop mode: restart the sequence by adjusting startTimeRef
          const loopedCycles = totalCyclesElapsed % totalSequenceDurationCycles;
          startTimeRef.current = performance.now() - (loopedCycles * currentCycleDurationMs);
        } else {
          // Play once mode: stop playback
          onPlayPause();
          return;
        }
      } else if (nextStepIndex !== currentStepIndex) {
        setCurrentStepIndex(nextStepIndex);
        const nextPreset = presets.find(p => p.id === sequenceRef.current.steps[nextStepIndex].presetId);
        if (nextPreset && onLoadPresetRef.current) {
          onLoadPresetRef.current(nextPreset);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentBpm, presets, currentStepIndex, isLoopMode, onPlayPause]);


  // When playback stops, reset startTimeRef
  useEffect(() => {
    if (!isPlaying) {
      startTimeRef.current = 0;
    }
  }, [isPlaying]);

  const onDragEnd = (result) => {
    if (!result.destination || !currentSequence) return;
    const items = Array.from(currentSequence.steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    updateSequenceSteps(items);
  };

  const calculateTimelineWidth = () => {
    if (!currentSequence || !currentSequence.steps || currentSequence.steps.length === 0) {
      return '100%'; 
    }
    // Total duration is now in cycles
    const totalDurationInCycles = currentSequence.steps.reduce((sum, step) => sum + step.durationBeats, 0); 
    // Width calculated using CYCLE_WIDTH_PX, add some padding
    return `${(totalDurationInCycles + 4) * CYCLE_WIDTH_PX}px`; 
  };

  return (
    <Card className="bg-black/20 backdrop-blur-sm border border-indigo-500/30 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all duration-300 overflow-hidden w-full">
      <CardHeader
        className="py-2 px-4 flex flex-row justify-between items-center cursor-pointer hover:bg-indigo-900/20 transition-colors"
        onClick={() => setIsSequencerOpen(!isSequencerOpen)}
      >
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          {isSequencerOpen ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-indigo-400" />}
          Preset Sequencer
        </CardTitle>
      </CardHeader>
      
      {isSequencerOpen && (
        <CardContent className="p-2 border-t border-cyan-500/20">
          <div className="space-y-2">
            <div className="flex gap-1">
              <Input type="text" placeholder="New sequence name..." value={newSequenceName} onChange={(e) => setNewSequenceName(e.target.value)} className="flex-1 h-7 text-xs bg-cyan-900/20 border-cyan-700/50 text-cyan-100 placeholder:text-cyan-400/50 focus:ring-cyan-800" disabled={disabled}/>
              <Button onClick={createNewSequence} disabled={!newSequenceName.trim() || disabled} size="sm" className="h-7 px-3 text-xs bg-cyan-600 hover:bg-cyan-700">New</Button>
            </div>
            
            <div className="flex items-center gap-1">
              <div className="flex gap-1 flex-wrap flex-1">
                {sequences.map((seq) => (
                  <Button 
                    key={seq.id}
                    onClick={() => setCurrentSequence(seq)} 
                    variant="outline" 
                    size="sm" 
                    className={`text-xs h-6 px-2 transition-colors ${ currentSequence?.id === seq.id ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 border-cyan-500' : 'border-cyan-700/50 bg-cyan-900/30 text-cyan-200 hover:bg-cyan-800/40'}`} 
                    disabled={disabled}
                  >
                    {seq.name}
                  </Button>
                ))}
              </div>
              
              {currentSequence && (
                <Button
                  onClick={deleteCurrentSequence}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-cyan-500 hover:text-red-400 transition-colors"
                  disabled={disabled}
                  title={`Delete sequence "${currentSequence.name}"`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>

            <div className="border-t border-cyan-700/50 pt-2 space-y-2">
              <div className="flex gap-2 items-center h-7">
                <Button
                  onClick={handlePlayPauseClick}
                  size="sm"
                  className={`${
                    isPlaying 
                      ? 'bg-yellow-500 hover:bg-yellow-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''} text-white w-20 text-xs h-7`}
                  disabled={!currentSequence || (currentSequence && currentSequence.steps.length === 0) || isEditMode || isLockedOut}
                  title={isLockedOut ? 'Upgrade to continue playing sequences' : (isPlaying ? 'Pause Sequence' : 'Play Sequence')}
                >
                  {isPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button onClick={() => setIsEditMode(!isEditMode)} disabled={!currentSequence || disabled} size="sm" className={`w-20 text-xs h-7 ${ isEditMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-cyan-800/70 hover:bg-cyan-700/70 text-cyan-100'}`}>
                  <Edit className="w-3 h-3 mr-1" />
                  {isEditMode ? 'Done' : 'Edit'}
                </Button>
                {currentSequence && currentSequence.steps.length > 1 && (
                  <Button
                    onClick={shuffleSequence}
                    disabled={disabled || isPlaying}
                    size="sm"
                    variant="ghost"
                    className="w-8 h-7 p-0 text-cyan-400 hover:text-purple-400 transition-colors"
                    title="Shuffle sequence order"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                )}
                {(!currentSequence || currentSequence.steps.length <= 1) && (
                  <Button
                    disabled={true}
                    size="sm"
                    variant="ghost"
                    className="w-8 h-7 p-0 text-cyan-700 cursor-not-allowed"
                    title="Shuffle sequence order (need multiple steps)"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => setIsLoopMode(!isLoopMode)}
                  disabled={!currentSequence || disabled}
                  size="sm"
                  className={`w-16 text-xs h-7 ${ isLoopMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-cyan-800/70 hover:bg-cyan-700/70 text-cyan-100'}`}
                  title="Toggle loop mode"
                >
                  Loop
                </Button>
                {hasUnsavedChanges && (
                  <Button
                    onClick={saveCurrentSequence}
                    disabled={disabled}
                    size="sm"
                    className="w-16 text-xs h-7 bg-orange-600 hover:bg-orange-700"
                    title="Save changes to sequence"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                )}
                <div className="text-xs text-cyan-400 truncate flex-1 text-right">
                  {currentSequence ? (
                    <>
                      Step {currentStepIndex + 1}/{currentSequence.steps.length || 0} | Cycle: {Math.floor(currentCycle)}
                      {hasUnsavedChanges && <span className="text-orange-400 ml-2">•</span>}
                    </>
                  ) : (
                    'No sequence selected'
                  )}
                </div>
              </div>
              
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sequencer-steps" direction="horizontal">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-full pb-2 rounded-md relative"
                      style={{
                        overflowX: currentSequence && isEditMode ? 'hidden' : 'auto',
                        backgroundColor: 'rgba(0, 40, 60, 0.3)',
                        backgroundSize: `${CYCLE_WIDTH_PX}px 100%`,
                        backgroundImage: `repeating-linear-gradient(to right, rgba(0, 191, 255, 0.2) 0px, rgba(0, 191, 255, 0.2) 1px, transparent 1px, transparent ${CYCLE_WIDTH_PX}px)`
                      }}
                    >
                      <div className="h-20 relative" style={{ minWidth: calculateTimelineWidth() }}>
                        {currentSequence && currentSequence.steps.map((step, index) => {
                          const totalCyclesBefore = currentSequence.steps.slice(0, index).reduce((sum, s) => sum + s.durationBeats, 0);
                          const leftPosition = totalCyclesBefore * CYCLE_WIDTH_PX;
                          
                          return (
                            <Draggable key={step.presetId + '-' + index} draggableId={step.presetId + '-' + index} index={index} isDragDisabled={!isEditMode || isPlaying}>
                              {(provided, snapshot) => {
                                const style = {
                                  ...provided.draggableProps.style,
                                };

                                if (!snapshot.isDragging) {
                                  style.position = 'absolute';
                                  style.left = `${leftPosition}px`;
                                  style.top = '50%';
                                  style.transform = 'translateY(-50%)';
                                } else {
                                  style.opacity = 0.7;
                                  style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
                                  style.zIndex = 1000;
                                }

                                return (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={style}
                                  >
                                    <ResizableStep
                                      step={step}
                                      index={index}
                                      presetName={presetMap.current.get(step.presetId)}
                                      isActive={isPlaying && currentStepIndex === index}
                                      onDurationChange={updateStepDuration}
                                      onRemove={removeStepFromSequence}
                                      totalCyclesBeforeThisStep={totalCyclesBefore}
                                      currentCycle={currentCycle}
                                      onPlayFromHere={startSequencePlayback}
                                      isPlaying={isPlaying}
                                      isEditMode={isEditMode}
                                    />
                                  </div>
                                );
                              }}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <div className="flex gap-1 border-t border-cyan-700/50 pt-2 h-7">
                <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)} className="flex-1 h-7 text-xs bg-cyan-900/20 border border-cyan-700/50 rounded text-cyan-100" disabled={!currentSequence || disabled}>
                  {presets.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
                <Input type="number" min="1" max="64" value={newStepDuration} onChange={(e) => setNewStepDuration(e.target.value === '' ? 1 : Number(e.target.value))} className="w-16 h-7 text-xs bg-cyan-900/20 border-cyan-700/50 text-cyan-100" disabled={!currentSequence || disabled} />
                <Button onClick={addStepToSequence} disabled={!selectedPresetId || !currentSequence || disabled} size="sm" className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
