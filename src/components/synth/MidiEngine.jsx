
import { useEffect, useRef, useState } from 'react';

const MidiEngine = ({
  notes,
  isPlaying,
  bpm,
  rhythm,
  onPlayingNotesChange,
  selectedMidiOutput,
  midiChannel = 0,
  isChordMode = false,
  arpeggioDelay = 0,
  onNotePlayed,
  playbackOrder = 'forward',
  playbackSequence = [], // New prop for external sequence control
  rhythmPattern = [],
  cycleLength = 4,
  repeatMode = 'off',
  noteLength = 1.0,
  isPanningEnabled,
  panningWidth = 50.0
}) => {
  const [midiAccess, setMidiAccess] = useState(null);
  const [midiOutputs, setMidiOutputs] = useState([]);
  const [currentOutput, setCurrentOutput] = useState(null);
  const [midiSupported, setMidiSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const engineState = useRef({
    lookahead: 25.0,
    scheduleAheadTime: 0.1,
    nextNoteTime: 0.0,
    currentNote: 0,
    activeNotes: new Set(),
    // playbackSequence is now controlled by the prop, no longer internal state
    flowStepCounter: 0, // Global counter for 'Flow' mode
  }).current;

  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  
  const isChordModeRef = useRef(isChordMode);
  useEffect(() => { isChordModeRef.current = isChordMode; }, [isChordMode]);

  const playbackSequenceRef = useRef(playbackSequence);
  useEffect(() => { playbackSequenceRef.current = playbackSequence; }, [playbackSequence]);

  const playbackOrderRef = useRef(playbackOrder);
  useEffect(() => {
    playbackOrderRef.current = playbackOrder;
  }, [playbackOrder]);

  const bpmRef = useRef(bpm);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  const rhythmRef = useRef(rhythm);
  useEffect(() => { rhythmRef.current = rhythm; }, [rhythm]);

  const arpeggioDelayRef = useRef(arpeggioDelay);
  useEffect(() => { arpeggioDelayRef.current = arpeggioDelay; }, [arpeggioDelay]);

  const rhythmPatternRef = useRef(rhythmPattern);
  useEffect(() => { rhythmPatternRef.current = rhythmPattern; }, [rhythmPattern]);

  const cycleLengthRef = useRef(cycleLength);
  useEffect(() => { cycleLengthRef.current = cycleLength; }, [cycleLength]);

  const repeatModeRef = useRef(repeatMode);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  const noteLengthRef = useRef(noteLength);
  useEffect(() => { noteLengthRef.current = noteLength; }, [noteLength]);

  const isPanningEnabledRef = useRef(isPanningEnabled);
  useEffect(() => { isPanningEnabledRef.current = isPanningEnabled; }, [isPanningEnabled]);

  const panningWidthRef = useRef(panningWidth);
  useEffect(() => { panningWidthRef.current = panningWidth; }, [panningWidth]);

  const timerRef = useRef(null);

  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then(access => {
          setMidiSupported(true);
          setMidiAccess(access);
          const outputs = Array.from(access.outputs.values());
          setMidiOutputs(outputs);
        })
        .catch(err => {
          console.warn('MIDI Access denied or not supported:', err);
          setMidiSupported(false);
        });
    } else {
      console.warn('Web MIDI API not supported in this browser');
      setMidiSupported(false);
    }
  }, []);

  useEffect(() => {
    let outputToSet = null;
    if (selectedMidiOutput) {
      outputToSet = midiOutputs.find(o => o.id === selectedMidiOutput) || null;
    } else if (midiOutputs.length > 0) {
      outputToSet = midiOutputs[0];
    }
    
    setCurrentOutput(outputToSet);
    setIsConnected(outputToSet?.state === 'connected');
  }, [selectedMidiOutput, midiOutputs]);

  // generatePlaybackSequence function removed - now handled by parent via playbackSequence prop

  useEffect(() => {
    // Reset current note when sequence changes from parent
    engineState.currentNote = 0;
  }, [playbackSequence]);

  const sendMidiMessage = (message) => {
    if (currentOutput && currentOutput.state === 'connected') {
      try {
        currentOutput.send(message);
      } catch (error) {
        console.error('Error sending MIDI message:', error);
      }
    }
  };

  const frequencyToMidiNote = (frequency) => {
    if (!frequency || frequency <= 0) return 60;
    const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
    return Math.max(0, Math.min(127, midiNote));
  };

  const sendNoteOn = (frequency, velocity = 100) => {
    const midiNote = [0x90 | midiChannel, frequencyToMidiNote(frequency), Math.max(0, Math.min(127, velocity))];
    sendMidiMessage(midiNote);
    return midiNote[1];
  };

  const sendNoteOff = (midiNote) => {
    const noteOffMessage = [0x80 | midiChannel, midiNote, 0];
    sendMidiMessage(noteOffMessage);
  };

  const sendAllNotesOff = () => {
    const allNotesOffMessage = [0xB0 | midiChannel, 123, 0];
    sendMidiMessage(allNotesOffMessage);
    engineState.activeNotes.clear();
  };

  const sendPanControl = (z) => {
    // Normalize z to a -1 to 1 range (assuming z is roughly -3 to 3)
    let panValue = z / 3;
    // Apply panning width. 100% width = full stereo. 0% width = mono (center).
    panValue *= panningWidthRef.current / 100;
    // Clamp to ensure it stays within -1 to 1 range
    panValue = Math.max(-1, Math.min(1, panValue));

    // Convert from -1..1 range to MIDI 0..127 range
    // -1 -> 0, 0 -> 63.5, 1 -> 127
    const midiPan = Math.round(((panValue + 1) / 2) * 127);

    const panMessage = [0xB0 | midiChannel, 10, midiPan];
    sendMidiMessage(panMessage);
  };

  const scheduleMidiPinch = (pinchIndices, time, durationSec) => {
    if (pinchIndices.length === 0 || !currentOutput) return;
    
    let finalNoteDurationMs = durationSec * 1000 * noteLengthRef.current;
    if (!isFinite(finalNoteDurationMs)) {
      finalNoteDurationMs = durationSec * 1000 * 0.9;
    }
    // CORRECTED: Removed the fixed subtraction.
    finalNoteDurationMs = Math.max(10, finalNoteDurationMs);

    const timeUntilStartMs = Math.max(0, time - performance.now() / 1000) * 1000;
    const notesToPlay = pinchIndices.map(i => notesRef.current[i]).filter(Boolean);

    if (isPanningEnabledRef.current && arpeggioDelayRef.current === 0) {
      let avgZ = 0;
      notesToPlay.forEach(note => { avgZ += (note.liveZPosition ?? note.position?.z ?? 0); });
      avgZ /= notesToPlay.length;
      sendPanControl(avgZ);
    }

    notesToPlay.forEach((noteToPlay, index) => {
      const frequency = noteToPlay.liveFrequency || noteToPlay.frequency;
      if (!frequency) return;
      
      const velocity = typeof noteToPlay.midiVelocity === 'number' ? noteToPlay.midiVelocity : 100;
      if (velocity === 0) return;

      const noteStartTimeMs = timeUntilStartMs + (index * arpeggioDelayRef.current);
      const scheduledPlayTime = performance.now() + noteStartTimeMs;
      if (onNotePlayed) {
        onNotePlayed({ note: noteToPlay, playTime: scheduledPlayTime, duration: durationSec });
      }

      setTimeout(() => {
        if (isPanningEnabledRef.current && arpeggioDelayRef.current > 0) {
          const z = noteToPlay.liveZPosition ?? noteToPlay.position?.z ?? 0;
          sendPanControl(z);
        }
        const midiNote = sendNoteOn(frequency, velocity);
        
        if (onPlayingNotesChange) {
          onPlayingNotesChange(prev => [...prev.filter(id => id !== noteToPlay.id), noteToPlay.id]);
        }
        
        setTimeout(() => {
          sendNoteOff(midiNote);
          if (onPlayingNotesChange) {
            onPlayingNotesChange(prev => prev.filter(id => id !== noteToPlay.id));
          }
        }, finalNoteDurationMs);
      }, noteStartTimeMs);
    });
  };

  const scheduleMidiChord = (time, durationSec) => {
    if (notesRef.current.length === 0 || !currentOutput) return;

    let finalNoteDurationMs = durationSec * 1000 * noteLengthRef.current;
    if (!isFinite(finalNoteDurationMs)) { 
        finalNoteDurationMs = durationSec * 1000 * 0.9; 
    }
    // CORRECTED: Removed the fixed subtraction.
    finalNoteDurationMs = Math.max(10, finalNoteDurationMs);

    const timeUntilChordStartMs = Math.max(0, time - performance.now() / 1000) * 1000;
    
    if (isPanningEnabledRef.current && arpeggioDelayRef.current === 0) {
      let avgZ = 0;
      notesRef.current.forEach(note => { avgZ += (note.liveZPosition ?? note.position?.z ?? 0); });
      avgZ /= notesRef.current.length;
      sendPanControl(avgZ);
    }

    notesRef.current.forEach((noteToPlay, index) => {
      const frequency = noteToPlay.liveFrequency || noteToPlay.frequency;
      if (!frequency) return;
      
      const velocity = typeof noteToPlay.midiVelocity === 'number' ? noteToPlay.midiVelocity : 100;
      if (velocity === 0) return;

      const noteStartTimeMs = timeUntilChordStartMs + (index * arpeggioDelayRef.current);
      const scheduledPlayTime = performance.now() + noteStartTimeMs;
      if (onNotePlayed) {
        onNotePlayed({ note: noteToPlay, playTime: scheduledPlayTime, duration: durationSec });
      }

      setTimeout(() => {
        if (isPanningEnabledRef.current && arpeggioDelayRef.current > 0) {
          const z = noteToPlay.liveZPosition ?? noteToPlay.position?.z ?? 0;
          sendPanControl(z);
        }
        const midiNote = sendNoteOn(frequency, velocity);
        
        if (onPlayingNotesChange) {
          onPlayingNotesChange(prev => [...prev.filter(id => id !== noteToPlay.id), noteToPlay.id]);
        }
        
        setTimeout(() => {
          sendNoteOff(midiNote);
          if (onPlayingNotesChange) {
            onPlayingNotesChange(prev => prev.filter(id => id !== noteToPlay.id));
          }
        }, finalNoteDurationMs);
      }, noteStartTimeMs);
    });
  };

  const scheduleNote = (stepIndex, time) => {
    if (!currentOutput || notesRef.current.length === 0) return;

    const stepRhythm = rhythmPatternRef.current[stepIndex] || rhythmRef.current;
    if (stepRhythm <= 0) return;

    const singleNoteDurationSec = (60.0 / bpmRef.current) / stepRhythm;

    const noteForStep = notesRef.current[stepIndex % notesRef.current.length];
    if (!noteForStep) return;

    const currentTime = performance.now() / 1000;
    const delay = Math.max(0, time - currentTime) * 1000;
    
    const numberOfRepeats = repeatModeRef.current !== 'off' ? Math.max(1, Math.floor(stepRhythm)) : 1;
    const singleNoteDurationMs = singleNoteDurationSec * 1000;

    if (onNotePlayed && numberOfRepeats > 0) {
        onNotePlayed({ note: noteForStep, playTime: performance.now() + delay, duration: singleNoteDurationSec * numberOfRepeats });
    }

    for (let i = 0; i < numberOfRepeats; i++) {
      const subNoteDelay = delay + (i * singleNoteDurationMs);

      let noteToPlayForSubStep = noteForStep;
      if (repeatModeRef.current === 'flow') {
          const flowIndex = engineState.flowStepCounter % notesRef.current.length;
          noteToPlayForSubStep = notesRef.current[flowIndex];
          engineState.flowStepCounter++; // Increment the global counter
      }
      
      if (!noteToPlayForSubStep) continue;
      
      const frequency = noteToPlayForSubStep.liveFrequency || noteToPlayForSubStep.frequency;
      if (!frequency) continue;

      const velocity = typeof noteToPlayForSubStep.midiVelocity === 'number' ? noteToPlayForSubStep.midiVelocity : 100;
      const clampedVelocity = Math.max(0, Math.min(127, velocity));
      
      if (clampedVelocity === 0) continue;

      const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
      const clampedMidiNote = Math.max(0, Math.min(127, midiNote));

      setTimeout(() => {
        if (isPanningEnabledRef.current) {
          const z = noteToPlayForSubStep.liveZPosition ?? noteToPlayForSubStep.position?.z ?? 0;
          sendPanControl(z);
        }
        const noteOnMessage = [0x90 | midiChannel, clampedMidiNote, clampedVelocity];
        currentOutput.send(noteOnMessage);
        
        if (i === 0 && onPlayingNotesChange) {
          onPlayingNotesChange(prev => [...prev.filter(id => id !== noteForStep.id), noteForStep.id]);
        }

        let finalNoteDurationMs = singleNoteDurationMs * noteLengthRef.current;
        if (!isFinite(finalNoteDurationMs)) { 
          finalNoteDurationMs = singleNoteDurationMs * 0.9; 
        }
        // CORRECTED: Removed the fixed subtraction.
        finalNoteDurationMs = Math.max(10, finalNoteDurationMs);

        setTimeout(() => {
          const noteOffMessage = [0x80 | midiChannel, clampedMidiNote, 0];
          currentOutput.send(noteOffMessage);
          
          if (i === numberOfRepeats - 1 && onPlayingNotesChange) {
             onPlayingNotesChange(prev => prev.filter(id => id !== noteForStep.id));
          }
        }, finalNoteDurationMs);
      }, subNoteDelay);
    }
  };

  const scheduler = () => {
    if (!currentOutput) {
      timerRef.current = setTimeout(scheduler, engineState.lookahead);
      return;
    }

    const currentTime = performance.now() / 1000;
    
    while (engineState.nextNoteTime < currentTime + engineState.scheduleAheadTime) {
      if (playbackSequenceRef.current.length > 0) {
        if (isChordModeRef.current) {
          const stepIndex = playbackSequenceRef.current[engineState.currentNote];
          const chordRhythm = rhythmPatternRef.current[stepIndex] || rhythmRef.current;
          if (chordRhythm <= 0) {
              engineState.nextNoteTime += (60.0 / bpmRef.current);
              engineState.currentNote = (engineState.currentNote + 1) % playbackSequenceRef.current.length;
              continue;
          }
          
          const numberOfRepeats = repeatModeRef.current !== 'off' ? Math.max(1, Math.floor(chordRhythm)) : 1;
          const singleChordDuration = (60.0 / bpmRef.current) / chordRhythm;

          for (let i = 0; i < numberOfRepeats; i++) {
              const chordStartTime = engineState.nextNoteTime + (i * singleChordDuration);
              scheduleMidiChord(chordStartTime, singleChordDuration);
          }
          
          const totalStepDuration = singleChordDuration * numberOfRepeats;
          engineState.nextNoteTime += totalStepDuration;

        } else {
          const step = playbackSequenceRef.current[engineState.currentNote];

          // NEW LOGIC TO HANDLE PINCHES
          if (Array.isArray(step)) {
            // If the step is an array, treat it as a pinch (multiple notes played simultaneously or arpeggiated)
            // The rhythm for the pinch is determined by the rhythmPattern for the first index in the pinch
            const stepRhythm = rhythmPatternRef.current[step[0]] || rhythmRef.current;
            const stepDuration = (stepRhythm > 0) ? (60.0 / bpmRef.current) / stepRhythm : 0;
            scheduleMidiPinch(step, engineState.nextNoteTime, stepDuration);
            engineState.nextNoteTime += stepDuration > 0 ? stepDuration : (60.0 / bpmRef.current);
          } else if (typeof step === 'number') {
            // If the step is a number, treat it as a single note index
            const stepIndex = step;
            const stepRhythm = rhythmPatternRef.current[stepIndex] || rhythmRef.current;
            
            scheduleNote(stepIndex, engineState.nextNoteTime);
            
            const numberOfRepeats = repeatModeRef.current !== 'off' ? Math.max(1, Math.floor(stepRhythm)) : 1;
            const singleNoteDuration = (stepRhythm > 0) ? (60.0 / bpmRef.current) / stepRhythm : 0;
            const totalStepDuration = singleNoteDuration * numberOfRepeats;

            engineState.nextNoteTime += totalStepDuration > 0 ? totalStepDuration : (60.0 / bpmRef.current);
          }
        }
      } else {
         engineState.nextNoteTime += (60.0 / bpmRef.current);
      }
      
      if (playbackSequenceRef.current.length > 0) {
        engineState.currentNote = (engineState.currentNote + 1) % playbackSequenceRef.current.length;
        
        if (engineState.currentNote === 0) {
          // Parent component handles sequence generation/changes, so no internal regeneration
        }
      }
    }
    timerRef.current = setTimeout(scheduler, engineState.lookahead);
  };

  useEffect(() => {
    if (isPlaying && currentOutput) {
      sendAllNotesOff();
      
      const currentTime = performance.now() / 1000;
      engineState.currentNote = 0;
      engineState.flowStepCounter = 0; // Reset flow counter on play
      engineState.nextNoteTime = currentTime + 0.1;
      // Sequence is now managed by props, no need to regenerate it here
      // engineState.currentPlaybackOrder = playbackOrderRef.current; // No longer relevant for external playbackSequence
      // engineState.playbackSequence = generatePlaybackSequence(...); // Removed
      scheduler();
    } else {
      clearTimeout(timerRef.current);
      sendAllNotesOff();
      engineState.flowStepCounter = 0; // Reset flow counter on stop
      if (onPlayingNotesChange) {
        onPlayingNotesChange([]);
      }
    }

    return () => {
      clearTimeout(timerRef.current);
      sendAllNotesOff();
    };
  }, [isPlaying, currentOutput, playbackSequence]); // Added playbackSequence to dependency array

  useEffect(() => {
    return () => {
      sendAllNotesOff();
      clearTimeout(timerRef.current);
      engineState.activeNotes.clear();
    };
  }, []);

  return {
    midiOutputs,
    currentOutput,
    midiSupported,
    isConnected
  };
};

export default MidiEngine;
