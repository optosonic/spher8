
import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

// audioContext will now be managed directly on the window object
// masterLimiter removed as it's now managed within AudioEngine as masterGainRef
// let masterLimiter = null;

// Helper to create a synthetic reverb impulse response
const createReverbIR = (audioContext, duration = 2.5, decay = 2.0) => {
  if (!audioContext) return null;
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate); // Stereo buffer

  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const p = i / length; // Normalized position (0 to 1)
    const e = Math.exp(-decay * p); // Exponential decay
    left[i] = (Math.random() * 2 - 1) * e;
    right[i] = (Math.random() * 2 - 1) * e;
  }
  return impulse;
};

// FIXED & UPGRADED: Using the reliable Salamander Grand Piano samples from a stable source.
const PIANO_SAMPLES = {
  21: 'https://tonejs.github.io/audio/salamander/A0.mp3',
  24: 'https://tonejs.github.io/audio/salamander/C1.mp3',
  27: 'https://tonejs.github.io/audio/salamander/Ds1.mp3',
  30: 'https://tonejs.github.io/audio/salamander/Fs1.mp3',
  33: 'https://tonejs.github.io/audio/salamander/A1.mp3',
  36: 'https://tonejs.github.io/audio/salamander/C2.mp3',
  39: 'https://tonejs.github.io/audio/salamander/Ds2.mp3',
  42: 'https://tonejs.github.io/audio/salamander/Fs2.mp3',
  45: 'https://tonejs.github.io/audio/salamander/A2.mp3',
  48: 'https://tonejs.github.io/audio/salamander/C3.mp3',
  51: 'https://tonejs.github.io/audio/salamander/Ds3.mp3',
  54: 'https://tonejs.github.io/audio/salamander/Fs3.mp3',
  57: 'https://tonejs.github.io/audio/salamander/A3.mp3',
  60: 'https://tonejs.github.io/audio/salamander/C4.mp3',
  63: 'https://tonejs.github.io/audio/salamander/Ds4.mp3',
  66: 'https://tonejs.github.io/audio/salamander/Fs4.mp3',
  69: 'https://tonejs.github.io/audio/salamander/A4.mp3',
  72: 'https://tonejs.github.io/audio/salamander/C5.mp3',
  75: 'https://tonejs.github.io/audio/salamander/Ds5.mp3',
  78: 'https://tonejs.github.io/audio/salamander/Fs5.mp3',
  81: 'https://tonejs.github.io/audio/salamander/A5.mp3',
  84: 'https://tonejs.github.io/audio/salamander/C6.mp3',
  87: 'https://tonejs.github.io/audio/salamander/Ds6.mp3',
  90: 'https://tonejs.github.io/audio/salamander/Fs6.mp3',
  93: 'https://tonejs.github.io/audio/salamander/A6.mp3',
  96: 'https://tonejs.github.io/audio/salamander/C7.mp3',
  99: 'https://tonejs.github.io/audio/salamander/Ds7.mp3',
  102: 'https://tonejs.github.io/audio/salamander/Fs7.mp3',
  105: 'https://tonejs.github.io/audio/salamander/A7.mp3',
  108: 'https://tonejs.github.io/audio/salamander/C8.mp3'
};

//Piano Forest samples from spher8 website - only up to note 66
const PIANO_FOREST_SAMPLES = {
  24: 'https://optosonic.github.io/piano-forest/A_00.mp3',
  25: 'https://optosonic.github.io/piano-forest/A_01.mp3',
  26: 'https://optosonic.github.io/piano-forest/A_02.mp3',
  27: 'https://optosonic.github.io/piano-forest/A_03.mp3',
  28: 'https://optosonic.github.io/piano-forest/A_04.mp3',
  29: 'https://optosonic.github.io/piano-forest/A_05.mp3',
  30: 'https://optosonic.github.io/piano-forest/A_06.mp3',
  31: 'https://optosonic.github.io/piano-forest/A_07.mp3',
  32: 'https://optosonic.github.io/piano-forest/A_08.mp3',
  33: 'https://optosonic.github.io/piano-forest/A_09.mp3',
  34: 'https://optosonic.github.io/piano-forest/A_10.mp3',
  35: 'https://optosonic.github.io/piano-forest/A_11.mp3',
  36: 'https://optosonic.github.io/piano-forest/A_12.mp3',
  37: 'https://optosonic.github.io/piano-forest/A_13.mp3',
  38: 'https://optosonic.github.io/piano-forest/A_14.mp3',
  39: 'https://optosonic.github.io/piano-forest/A_15.mp3',
  40: 'https://optosonic.github.io/piano-forest/A_16.mp3',
  41: 'https://optosonic.github.io/piano-forest/A_17.mp3',
  42: 'https://optosonic.github.io/piano-forest/A_18.mp3',
  43: 'https://optosonic.github.io/piano-forest/A_19.mp3',
  44: 'https://optosonic.github.io/piano-forest/A_20.mp3',
  45: 'https://optosonic.github.io/piano-forest/A_21.mp3',
  46: 'https://optosonic.github.io/piano-forest/A_22.mp3',
  47: 'https://optosonic.github.io/piano-forest/A_23.mp3',
  48: 'https://optosonic.github.io/piano-forest/A_24.mp3',
  49: 'https://optosonic.github.io/piano-forest/A_25.mp3',
  50: 'https://optosonic.github.io/piano-forest/A_26.mp3',
  51: 'https://optosonic.github.io/piano-forest/A_27.mp3',
  52: 'https://optosonic.github.io/piano-forest/A_28.mp3',
  53: 'https://optosonic.github.io/piano-forest/A_29.mp3',
  54: 'https://optosonic.github.io/piano-forest/A_30.mp3',
  55: 'https://optosonic.github.io/piano-forest/A_31.mp3',
  56: 'https://optosonic.github.io/piano-forest/A_32.mp3',
  57: 'https://optosonic.github.io/piano-forest/A_33.mp3',
  58: 'https://optosonic.github.io/piano-forest/A_34.mp3',
  59: 'https://optosonic.github.io/piano-forest/A_35.mp3',
  60: 'https://optosonic.github.io/piano-forest/A_36.mp3',
  61: 'https://optosonic.github.io/piano-forest/A_37.mp3',
  62: 'https://optosonic.github.io/piano-forest/A_38.mp3',
  63: 'https://optosonic.github.io/piano-forest/A_39.mp3',
  64: 'https://optosonic.github.io/piano-forest/A_40.mp3',
  65: 'https://optosonic.github.io/piano-forest/A_41.mp3',
  66: 'https://optosonic.github.io/piano-forest/A_42.mp3',
  67: 'https://optosonic.github.io/piano-forest/A_43.mp3',
  68: 'https://optosonic.github.io/piano-forest/A_44.mp3',
  69: 'https://optosonic.github.io/piano-forest/A_45.mp3',
  70: 'https://optosonic.github.io/piano-forest/A_46.mp3',
  71: 'https://optosonic.github.io/piano-forest/A_47.mp3',
  72: 'https://optosonic.github.io/piano-forest/A_48.mp3',
  73: 'https://optosonic.github.io/piano-forest/A_49.mp3',
  74: 'https://optosonic.github.io/piano-forest/A_50.mp3',
  75: 'https://optosonic.github.io/piano-forest/A_51.mp3',
  76: 'https://optosonic.github.io/piano-forest/A_52.mp3',
  77: 'https://optosonic.github.io/piano-forest/A_53.mp3',
  78: 'https://optosonic.github.io/piano-forest/A_54.mp3',
  79: 'https://optosonic.github.io/piano-forest/A_55.mp3',
  80: 'https://optosonic.github.io/piano-forest/A_56.mp3',
  81: 'https://optosonic.github.io/piano-forest/A_57.mp3',
  82: 'https://optosonic.github.io/piano-forest/A_58.mp3',
  83: 'https://optosonic.github.io/piano-forest/A_59.mp3',
  84: 'https://optosonic.github.io/piano-forest/A_60.mp3',
  85: 'https://optosonic.github.io/piano-forest/A_61.mp3',
  86: 'https://optosonic.github.io/piano-forest/A_62.mp3',
  87: 'https://optosonic.github.io/piano-forest/A_63.mp3',
  88: 'https://optosonic.github.io/piano-forest/A_64.mp3',
  89: 'https://optosonic.github.io/piano-forest/A_65.mp3',
  90: 'https://optosonic.github.io/piano-forest/A_66.mp3'
};

// Dynamic sampler keys based on current sound source
const getCurrentSamplerKeys = (soundSource) => {
  if (soundSource === 'sampler2') {
    return Object.keys(PIANO_FOREST_SAMPLES).map(Number);
  }
  return Object.keys(PIANO_SAMPLES).map(Number);
};

const getCurrentSamples = (soundSource) => {
  if (soundSource === 'sampler2') {
    // The URLs are now fixed, so we can return the correct samples.
    return PIANO_FOREST_SAMPLES;
  }
  return PIANO_SAMPLES;
};

// Helper function to convert MIDI note number to frequency
const midiToFreq = (midiNote) => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

// New exported function to initialize the AudioContext on a user gesture
export const initAudioContext = async () => {
  // If context doesn't exist or is closed, create a new one.
  if (!window.audioContext || window.audioContext.state === 'closed') {
    try {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // Master limiter (DynamicsCompressorNode) is now managed within AudioEngine component
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.", e);
      return; // Exit if creation fails
    }
  }

  // If context is suspended, resume it. This is the key for user gesture activation.
  // This check should happen *after* potentially creating a new context, as a newly created
  // context might start in 'suspended' state depending on the browser.
  if (window.audioContext.state === 'suspended') {
    try {
      await window.audioContext.resume();
    } catch (e) {
      console.error("Error resuming AudioContext:", e);
      // If resume fails, it might remain suspended, so we don't dispatch ready event.
      return;
    }
  }

  // Dispatch event when context is ready (i.e., state is 'running')
  if (window.audioContext.state === 'running') {
    window.dispatchEvent(new CustomEvent('audioContextReady'));
  }
};

const AudioEngine = forwardRef((props, ref) => {
  const {
    notes,
    isPlaying,
    masterVolume,
    bpm,
    rhythm,
    onPlayingNotesChange,
    waveform,
    envelope,
    eq,
    isChordMode,
    arpeggioDelay,
    onNotePlayed,
    playbackSequence = [],
    rhythmPattern = [],
    cycleLength = 4,
    repeatMode = 'off',
    noteLength = 1.0,
    soundSource,
    onLoadingChange,
    onRecordingNodesReady,
    efx, // NEW EFX PROP
    isPanningEnabled,
    panningWidth // FIX: Add panningWidth to props destructuring
  } = props;

  const engineState = useRef({
    lookahead: 25.0,
    scheduleAheadTime: 0.1,
    nextNoteTime: 0.0,
    currentNote: 0,
    currentPlaybackOrder: 'forward',
    flowStepCounter: 0,
  }).current;

  const samplerCache = useRef({});
  const soundSourceRef = useRef(soundSource);
  useEffect(() => { soundSourceRef.current = soundSource; }, [soundSource]);
  
  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  const masterVolumeRef = useRef(masterVolume);
  useEffect(() => { masterVolumeRef.current = masterVolume; }, [masterVolume]);

  const playbackOrderRef = useRef(playbackSequence);
  useEffect(() => { playbackOrderRef.current = playbackSequence; }, [playbackSequence]);

  const waveformRef = useRef(waveform);
  useEffect(() => { waveformRef.current = waveform; }, [waveform]);

  const envelopeRef = useRef(envelope);
  useEffect(() => { envelopeRef.current = envelope; }, [envelope]);

  const eqRef = useRef(eq);
  useEffect(() => { eqRef.current = eq; }, [eq]);
  
  const bpmRef = useRef(bpm);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  const playbackSequenceRef = useRef(playbackSequence);
  useEffect(() => { playbackSequenceRef.current = playbackSequence; }, [playbackSequence]);

  const rhythmRef = useRef(rhythm);
  useEffect(() => { rhythmRef.current = rhythm; }, [rhythm]);

  const isChordModeRef = useRef(isChordMode);
  useEffect(() => { isChordModeRef.current = isChordMode; }, [isChordMode]);

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

  // NEW: Refs for audio context and master gain
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);

  // NEW: Refs for recording and analysis nodes (renamed for consistency)
  const mediaStreamDestinationRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const nodesReady = useRef(false);

  // NEW: Ref for onNotePlayed callback
  const onNotePlayedRef = useRef(onNotePlayed);
  useEffect(() => { onNotePlayedRef.current = onNotePlayed; }, [onNotePlayed]);

  // NEW: Refs for persistent EQ nodes
  const eqNodesRef = useRef(null);

  // NEW: Refs for EFX nodes
  const delayNodesRef = useRef(null);
  const reverbNodeRef = useRef(null);
  const efxRef = useRef(efx);
  useEffect(() => { efxRef.current = efx; }, [efx]);

  // NEW: Ref for previous reverb parameters for conditional IR regeneration
  const prevReverbParams = useRef({});

  // NEW: UseCallback for initializing audio nodes and setting up the graph
  const initAudio = useCallback(() => {
    // Only proceed if AudioContext is running and nodes haven't been set up yet
    if (window.audioContext && window.audioContext.state === 'running' && !nodesReady.current) {
      audioContextRef.current = window.audioContext; // Assign the global context

      // 1. Create Master Gain
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.setValueAtTime(1, audioContextRef.current.currentTime);

      // 2. Create Analyser and MediaStreamDestination
      analyserNodeRef.current = audioContextRef.current.createAnalyser();
      analyserNodeRef.current.fftSize = 2048;
      mediaStreamDestinationRef.current = audioContextRef.current.createMediaStreamDestination();

      // 3. Create persistent EQ Nodes
      eqNodesRef.current = {
          low: audioContextRef.current.createBiquadFilter(),
          mid: audioContextRef.current.createBiquadFilter(),
          high: audioContextRef.current.createBiquadFilter(),
      };
      // Set initial EQ values from props
      eqNodesRef.current.low.type = eqRef.current.lowFilterType || 'lowshelf';
      eqNodesRef.current.low.frequency.value = eqRef.current.lowFreq;
      eqNodesRef.current.low.gain.value = eqRef.current.lowGain;

      eqNodesRef.current.mid.type = 'peaking';
      eqNodesRef.current.mid.frequency.value = eqRef.current.midFreq;
      eqNodesRef.current.mid.gain.value = eqRef.current.midGain;
      eqNodesRef.current.mid.Q.value = eqRef.current.midQ;

      eqNodesRef.current.high.type = eqRef.current.highFilterType || 'highshelf';
      eqNodesRef.current.high.frequency.value = eqRef.current.highFreq;
      eqNodesRef.current.high.gain.value = eqRef.current.highGain;

      // 4. Create Delay Nodes (now with dry/wet internal routing)
      delayNodesRef.current = {
          input: audioContextRef.current.createGain(),
          dry: audioContextRef.current.createGain(),    // For bypass/dry signal
          wet: audioContextRef.current.createGain(),    // For wet signal
          delayL: audioContextRef.current.createDelay(2.0),
          delayR: audioContextRef.current.createDelay(2.0),
          feedback: audioContextRef.current.createGain(),
          merger: audioContextRef.current.createChannelMerger(2),
      };
      // Set initial delay values (will be updated by efx useEffect)
      delayNodesRef.current.delayL.delayTime.value = 0;
      delayNodesRef.current.delayR.delayTime.value = 0;
      delayNodesRef.current.feedback.gain.value = 0;
      delayNodesRef.current.dry.gain.value = 1; // Default to full dry
      delayNodesRef.current.wet.gain.value = 0; // Default to no wet

      // 5. Create Reverb Nodes (now with its own input and dry/wet)
      reverbNodeRef.current = {
          input: audioContextRef.current.createGain(),  // New input for the whole module
          dryGain: audioContextRef.current.createGain(),
          convolver: audioContextRef.current.createConvolver(),
          wetGain: audioContextRef.current.createGain(),
      };
      // Initial IR (re-generated on param change)
      const initialReverbIR = createReverbIR(audioContextRef.current, efxRef.current.reverbSize, efxRef.current.reverbDecay);
      if (initialReverbIR) {
          reverbNodeRef.current.convolver.buffer = initialReverbIR;
          prevReverbParams.current = { size: efxRef.current.reverbSize, decay: efxRef.current.reverbDecay };
      }
      reverbNodeRef.current.dryGain.gain.value = 1; // Default to full dry
      reverbNodeRef.current.wetGain.gain.value = 0; // Default to no wet

      // --- 6. Connect the new SERIES audio graph ---
      
      // -- A: EQ Section --
      eqNodesRef.current.low.connect(eqNodesRef.current.mid);
      eqNodesRef.current.mid.connect(eqNodesRef.current.high);

      // -- B: Delay Section --
      // EQ output feeds the Delay input
      eqNodesRef.current.high.connect(delayNodesRef.current.input);
      
      // Delay input splits into its internal dry and wet paths
      delayNodesRef.current.input.connect(delayNodesRef.current.dry);
      delayNodesRef.current.input.connect(delayNodesRef.current.delayL);
      delayNodesRef.current.input.connect(delayNodesRef.current.delayR);
      
      // Delay wet path processing
      delayNodesRef.current.delayL.connect(delayNodesRef.current.merger, 0, 0);
      delayNodesRef.current.delayR.connect(delayNodesRef.current.merger, 0, 1);
      delayNodesRef.current.merger.connect(delayNodesRef.current.feedback);
      delayNodesRef.current.feedback.connect(delayNodesRef.current.delayL); // Feedback loop L
      delayNodesRef.current.feedback.connect(delayNodesRef.current.delayR); // Feedback loop R
      delayNodesRef.current.merger.connect(delayNodesRef.current.wet);
      
      // Delay dry and wet outputs feed the Reverb input
      delayNodesRef.current.dry.connect(reverbNodeRef.current.input);
      delayNodesRef.current.wet.connect(reverbNodeRef.current.input);

      // -- C: Reverb Section --
      // Reverb input splits into its internal dry and wet paths
      reverbNodeRef.current.input.connect(reverbNodeRef.current.dryGain);
      reverbNodeRef.current.input.connect(reverbNodeRef.current.convolver);
      reverbNodeRef.current.convolver.connect(reverbNodeRef.current.wetGain);

      // Reverb dry and wet outputs feed the Master Gain
      reverbNodeRef.current.dryGain.connect(masterGainRef.current);
      reverbNodeRef.current.wetGain.connect(masterGainRef.current);

      // -- D: Master Output --
      // Master Gain connects to Analyser and then to hardware destinations
      masterGainRef.current.connect(analyserNodeRef.current);
      analyserNodeRef.current.connect(audioContextRef.current.destination);
      analyserNodeRef.current.connect(mediaStreamDestinationRef.current);

      if (onRecordingNodesReady) {
          onRecordingNodesReady({
              stream: mediaStreamDestinationRef.current.stream,
              analyser: analyserNodeRef.current,
          });
      }
      nodesReady.current = true;
      window.removeEventListener('audioContextReady', initAudio);
    }
  }, [eqRef, efxRef, onRecordingNodesReady]);

  // Effect to set up recording, analysis, EQ and EFX nodes when audio context is ready
  useEffect(() => {
    window.addEventListener('audioContextReady', initAudio);
    initAudio(); // Call immediately in case context is already ready

    return () => {
        window.removeEventListener('audioContextReady', initAudio);
        // Disconnect nodes to prevent memory leaks/dangling connections if the component unmounts
        if (nodesReady.current) {
            if (eqNodesRef.current && eqNodesRef.current.high) {
                eqNodesRef.current.high.disconnect(delayNodesRef.current.input);
            }
            if (delayNodesRef.current) {
                delayNodesRef.current.input.disconnect(delayNodesRef.current.dry);
                delayNodesRef.current.input.disconnect(delayNodesRef.current.delayL);
                delayNodesRef.current.input.disconnect(delayNodesRef.current.delayR);

                delayNodesRef.current.delayL.disconnect(delayNodesRef.current.merger);
                delayNodesRef.current.delayR.disconnect(delayNodesRef.current.merger);

                delayNodesRef.current.merger.disconnect(delayNodesRef.current.feedback);
                delayNodesRef.current.merger.disconnect(delayNodesRef.current.wet);

                delayNodesRef.current.feedback.disconnect(delayNodesRef.current.delayL);
                delayNodesRef.current.feedback.disconnect(delayNodesRef.current.delayR);

                delayNodesRef.current.dry.disconnect(reverbNodeRef.current.input);
                delayNodesRef.current.wet.disconnect(reverbNodeRef.current.input);
            }
            if (reverbNodeRef.current) {
                reverbNodeRef.current.input.disconnect(reverbNodeRef.current.dryGain);
                reverbNodeRef.current.input.disconnect(reverbNodeRef.current.convolver);

                reverbNodeRef.current.convolver.disconnect(reverbNodeRef.current.wetGain);

                reverbNodeRef.current.dryGain.disconnect(masterGainRef.current);
                reverbNodeRef.current.wetGain.disconnect(masterGainRef.current);
            }
            // Disconnect masterGainRef and analyserNodeRef
            if (masterGainRef.current) {
              masterGainRef.current.disconnect(analyserNodeRef.current);
            }
            if (analyserNodeRef.current) {
                analyserNodeRef.current.disconnect(audioContextRef.current.destination);
                analyserNodeRef.current.disconnect(mediaStreamDestinationRef.current);
            }
            nodesReady.current = false;
        }
    };
  }, [initAudio]);

  // FIXED & UPGRADED: Auto-load piano samples immediately when sound source is sampler
  useEffect(() => {
    // If we switch away from samplers, clear the cache completely and exit.
    if (soundSource !== 'sampler' && soundSource !== 'sampler2') {
      samplerCache.current = {};
      return;
    }
    
    // Check if the correct sample set is already loaded. If so, do nothing.
    if (samplerCache.current.loadedSource === soundSource) {
      return;
    }

    // If we're here, it means we need to load a new set. Clear the old one first.
    samplerCache.current = {};

    const initAndLoadSamples = async () => {
      await initAudioContext(); // Use the global initAudioContext
      
      if (!window.audioContext) return;

      onLoadingChange(true);
      console.log(`AudioEngine: Loading ${soundSource === 'sampler2' ? 'Piano Forest' : 'Piano'} samples...`);

      // Choose the correct sample set based on sound source
      const samplesToLoad = getCurrentSamples(soundSource);

      const loadPromises = Object.entries(samplesToLoad).map(([key, url]) =>
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.arrayBuffer();
          })
          .then(arrayBuffer => window.audioContext.decodeAudioData(arrayBuffer))
          .then(audioBuffer => {
            // Store the audio buffer along with its original frequency for pitch shifting
            const originalMidiNote = parseInt(key);
            const originalFrequency = midiToFreq(originalMidiNote);
            samplerCache.current[key] = { buffer: audioBuffer, originalFrequency: originalFrequency };
          })
          .catch(err => {
            console.error(`Failed to load ${soundSource === 'sampler2' ? 'Piano Forest' : 'Piano'} sample ${key} from ${url}:`, err);
            // FALLBACK: Use a simple sine wave if sample fails to load
            const fallbackBuffer = window.audioContext.createBuffer(1, window.audioContext.sampleRate * 2, window.audioContext.sampleRate);
            const data = fallbackBuffer.getChannelData(0);
            const freq = midiToFreq(parseInt(key)); // Use the intended midi note's frequency for fallback
            for (let i = 0; i < data.length; i++) {
              data[i] = Math.sin(2 * Math.PI * freq * i / window.audioContext.sampleRate) * Math.exp(-i / window.audioContext.sampleRate * 2);
            }
            samplerCache.current[key] = { buffer: fallbackBuffer, originalFrequency: freq };
          })
      );

      Promise.all(loadPromises).then(() => {
        onLoadingChange(false);
        // CRITICAL: Mark the cache with the source we just loaded.
        samplerCache.current.loadedSource = soundSource;
        console.log(`AudioEngine: ${soundSource === 'sampler2' ? 'Piano Forest' : 'Piano'} samples auto-loaded successfully!`);
      });
    };

    // Start loading immediately
    initAndLoadSamples();
  }, [soundSource, onLoadingChange]);

  useEffect(() => {
    // Reset current note when sequence changes from parent
    engineState.currentNote = 0;
  }, [playbackSequence]);

  // NEW: Effect to update EQ parameters dynamically
  useEffect(() => {
    if (!audioContextRef.current || !eqNodesRef.current) return;
    const { currentTime } = audioContextRef.current;
    
    // Update Low Shelf
    eqNodesRef.current.low.type = eq.lowFilterType || 'lowshelf';
    eqNodesRef.current.low.frequency.setTargetAtTime(eq.lowFreq, currentTime, 0.01);
    eqNodesRef.current.low.gain.setTargetAtTime(eq.lowGain, currentTime, 0.01);
    
    // Update Mid Peaking
    eqNodesRef.current.mid.frequency.setTargetAtTime(eq.midFreq, currentTime, 0.01);
    eqNodesRef.current.mid.gain.setTargetAtTime(eq.midGain, currentTime, 0.01);
    eqNodesRef.current.mid.Q.setTargetAtTime(eq.midQ, currentTime, 0.01);
    
    // Update High Shelf
    eqNodesRef.current.high.type = eq.highFilterType || 'highshelf';
    eqNodesRef.current.high.frequency.setTargetAtTime(eq.highFreq, currentTime, 0.01);
    eqNodesRef.current.high.gain.setTargetAtTime(eq.highGain, currentTime, 0.01);

  }, [eq]); // Dependency on the `eq` prop

  // NEW: Effect to update EFX parameters dynamically with SERIES logic
  useEffect(() => {
    if (!audioContextRef.current || !delayNodesRef.current || !reverbNodeRef.current || !efx) return;
    const { currentTime } = audioContextRef.current;
    
    // --- Delay Parameters (Series Logic) ---
    const quarterNoteTime = 60.0 / bpmRef.current;
    delayNodesRef.current.delayL.delayTime.setTargetAtTime(quarterNoteTime * efx.delayTime, currentTime, 0.01);
    delayNodesRef.current.delayR.delayTime.setTargetAtTime(quarterNoteTime * efx.delayTime, currentTime, 0.01);
    delayNodesRef.current.feedback.gain.setTargetAtTime(efx.delayOn ? efx.delayFeedback : 0, currentTime, 0.01);

    if (efx.delayOn) {
      // When ON, dry/wet mix is applied
      delayNodesRef.current.dry.gain.setTargetAtTime(1 - efx.delayMix, currentTime, 0.02);
      delayNodesRef.current.wet.gain.setTargetAtTime(efx.delayMix, currentTime, 0.02);
    } else {
      // When OFF, it's a perfect bypass (dry is full, wet is silent)
      delayNodesRef.current.dry.gain.setTargetAtTime(1, currentTime, 0.02);
      delayNodesRef.current.wet.gain.setTargetAtTime(0, currentTime, 0.02);
    }

    // --- Reverb Parameters (Series Logic) ---
    if (efx.reverbOn) {
      // When ON, apply user's separate Dry and Wet levels
      reverbNodeRef.current.dryGain.gain.setTargetAtTime(efx.reverbDry, currentTime, 0.02);
      reverbNodeRef.current.wetGain.gain.setTargetAtTime(efx.reverbWet, currentTime, 0.02);
    } else {
      // When OFF, it's a perfect bypass (dry is full, wet is silent)
      reverbNodeRef.current.dryGain.gain.setTargetAtTime(1, currentTime, 0.02);
      reverbNodeRef.current.wetGain.gain.setTargetAtTime(0, currentTime, 0.02);
    }
    
    // Regenerate IR only if size/decay changes AND reverb is active
    if (efx.reverbOn && (efx.reverbSize !== prevReverbParams.current.size || efx.reverbDecay !== prevReverbParams.current.decay)) {
        const newIR = createReverbIR(audioContextRef.current, efx.reverbSize, efx.reverbDecay);
        if (newIR) {
            reverbNodeRef.current.convolver.buffer = newIR;
            prevReverbParams.current = { size: efx.reverbSize, decay: efx.reverbDecay };
        }
    }

  }, [efx, bpmRef, audioContextRef]); // Dependencies on `efx` prop and `bpmRef`, audioContextRef

  // Consolidated function for playing a single note (oscillator or sampler)
  const playOscillatorOrSamplerNote = useCallback((noteObj, scheduledTime, duration, volumeFactor = 1) => {
    if (!audioContextRef.current || !eqNodesRef.current) return;

    // Ensure scheduledTime is not in the past
    const currentTime = audioContextRef.current.currentTime;
    scheduledTime = Math.max(scheduledTime, currentTime);

    // Common note properties
    const frequency = noteObj.tunedFrequency || noteObj.liveFrequency || noteObj.frequency;
    const velocity = typeof noteObj.midiVelocity === 'number' ? noteObj.midiVelocity : 100;
    if (!frequency || !isFinite(frequency) || frequency <= 0 || !isFinite(velocity) || velocity === 0) return;

    let sourceNode;
    const gainNode = audioContextRef.current.createGain(); // Create gain node for ADSR
    
    // Determine effective duration based on noteLengthRef
    let effectiveDuration = duration * noteLengthRef.current;
    if (!isFinite(effectiveDuration)) {
        effectiveDuration = duration * 0.9;
    }

    // ADSR envelope parameters from envelopeRef.current
    const { a: orig_a, d: orig_d, s, r: orig_r } = envelopeRef.current; 
    const a = orig_a * noteLengthRef.current;
    const d = orig_d * noteLengthRef.current;
    const r = orig_r * noteLengthRef.current;
    const sustainTime = Math.max(0.01, effectiveDuration - a - d - r);
    const totalTime = a + d + sustainTime + r;

    // Common peak volume
    const peakVolume = (masterVolumeRef.current / 100) * (velocity / 127) * volumeFactor;

    if (soundSourceRef.current === 'sampler' || soundSourceRef.current === 'sampler2') {
      const currentSamplerKeys = getCurrentSamplerKeys(soundSourceRef.current);
      const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
      const closestKey = currentSamplerKeys.reduce((prev, curr) => Math.abs(curr - midiNote) < Math.abs(prev - midiNote) ? curr : prev);
      const sampleData = samplerCache.current[closestKey];

      if (!sampleData || !sampleData.buffer) {
          console.warn(`No sampler data for MIDI ${midiNote}, closest ${closestKey}.`);
          return;
      }
      sourceNode = audioContextRef.current.createBufferSource();
      sourceNode.buffer = sampleData.buffer;
      sourceNode.playbackRate.value = frequency / sampleData.originalFrequency;
      sourceNode.connect(gainNode); // Sampler connects to gainNode

    } else { // Oscillator logic
      sourceNode = audioContextRef.current.createOscillator();
      sourceNode.type = waveformRef.current;
      sourceNode.frequency.value = frequency; // Use the common 'frequency' variable
      sourceNode.connect(gainNode); // Oscillator connects to gainNode
    }

    // Apply ADSR envelope (common for both)
    gainNode.gain.cancelScheduledValues(scheduledTime);
    gainNode.gain.setValueAtTime(0.001, scheduledTime); // Start slightly above 0 to avoid clicks
    gainNode.gain.linearRampToValueAtTime(peakVolume, scheduledTime + a);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, peakVolume * s), scheduledTime + a + d);
    gainNode.gain.setValueAtTime(Math.max(0.001, peakVolume * s), scheduledTime + a + d + sustainTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, scheduledTime + totalTime);

    // Start and stop the source, allowing for potential overrun
    sourceNode.start(scheduledTime);
    sourceNode.stop(scheduledTime + Math.max(effectiveDuration, totalTime) + 0.1);

    // Dynamic Panning Logic (3D Panner)
    const pannerNode = audioContextRef.current.createPanner();
    pannerNode.panningModel = 'HRTF';
    pannerNode.distanceModel = 'inverse';
    pannerNode.refDistance = 1;
    pannerNode.maxDistance = 10000;
    pannerNode.rolloffFactor = 1;
    pannerNode.coneInnerAngle = 360;
    pannerNode.coneOuterAngle = 0;
    pannerNode.coneOuterGain = 0;

    if (isPanningEnabledRef.current && noteObj.position) {
        const panX = (noteObj.liveXPosition ?? noteObj.position.x ?? 0) * (panningWidthRef.current / 100);
        const panZ = (noteObj.liveZPosition ?? noteObj.position.z ?? 0) * (panningWidthRef.current / 100);
        // Assuming Y-position is always 0 for 2D panning representation on a horizontal plane
        pannerNode.positionX.setValueAtTime(panX, audioContextRef.current.currentTime);
        pannerNode.positionY.setValueAtTime(0, audioContextRef.current.currentTime); 
        pannerNode.positionZ.setValueAtTime(panZ, audioContextRef.current.currentTime);
    } else {
        pannerNode.positionX.setValueAtTime(0, audioContextRef.current.currentTime);
        pannerNode.positionY.setValueAtTime(0, audioContextRef.current.currentTime);
        pannerNode.positionZ.setValueAtTime(0, audioContextRef.current.currentTime);
    }
    
    // Connect the gainNode to the panner, and the panner to the EQ
    gainNode.connect(pannerNode);
    pannerNode.connect(eqNodesRef.current.low);

  }, [soundSourceRef, masterVolumeRef, envelopeRef, noteLengthRef, eqNodesRef, audioContextRef, isPanningEnabledRef, panningWidthRef, waveformRef]);

  const schedulePinch = (pinchIndices, time, duration) => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running' || !eqNodesRef.current) return;
    const notesToPlay = pinchIndices.map(i => notesRef.current[i]).filter(Boolean);
    if (notesToPlay.length === 0) return;

    const volumeFactor = notesToPlay.length > 1 ? 1 / Math.sqrt(notesToPlay.length) : 1;

    notesToPlay.forEach((note, index) => {
        const scheduledPlayTime = time + (index * (arpeggioDelayRef.current / 1000));
        playOscillatorOrSamplerNote(note, scheduledPlayTime, duration, volumeFactor); // Pass original duration, let playOscillatorOrSamplerNote handle noteLength
        if (onNotePlayedRef.current) {
            onNotePlayedRef.current({ note, playTime: scheduledPlayTime, duration: duration * noteLengthRef.current });
        }
    });
  };

  const scheduleChord = (time, duration) => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running' || notesRef.current.length === 0 || !eqNodesRef.current) return;
    const volumeFactor = notesRef.current.length > 1 ? 1 / Math.sqrt(notesRef.current.length) : 1;

    notesRef.current.forEach((note, index) => {
        const scheduledPlayTime = time + (index * (arpeggioDelayRef.current / 1000));
        playOscillatorOrSamplerNote(note, scheduledPlayTime, duration, volumeFactor); // Pass original duration
        if (onNotePlayedRef.current) {
            onNotePlayedRef.current({ note, playTime: scheduledPlayTime, duration: duration * noteLengthRef.current });
        }
    });
  };

  const scheduleNote = (noteObj, time) => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running' || !eqNodesRef.current) return;
    const stepRhythm = noteObj.rhythmSubdivision || rhythmRef.current;
    if (stepRhythm <= 0) return;
    const singleNoteDuration = (60.0 / bpmRef.current) / stepRhythm;
    const currentTime = audioContextRef.current.currentTime;
    const delay = Math.max(0, time - currentTime);
    const numberOfRepeats = repeatModeRef.current !== 'off' ? Math.max(1, Math.floor(stepRhythm)) : 1;

    if (onNotePlayedRef.current && numberOfRepeats > 0) {
        onNotePlayedRef.current({ note: noteObj, playTime: time, duration: singleNoteDuration * numberOfRepeats });
    }

    for (let i = 0; i < numberOfRepeats; i++) {
        const subNoteDelay = delay + (i * singleNoteDuration);
        let noteToPlayForSubStep = noteObj;
        if (repeatModeRef.current === 'flow') {
            const flowIndex = engineState.flowStepCounter % notesRef.current.length;
            noteToPlayForSubStep = notesRef.current[flowIndex];
            engineState.flowStepCounter++;
        }
        if (!noteToPlayForSubStep) continue;
        const scheduledTime = currentTime + subNoteDelay;
        // playOscillatorOrSamplerNote will handle noteLengthRef.current internally
        playOscillatorOrSamplerNote(noteToPlayForSubStep, scheduledTime, singleNoteDuration);
    }
  };

  const scheduler = () => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
        return;
    }
    
    while (engineState.nextNoteTime < audioContextRef.current.currentTime + engineState.scheduleAheadTime) {
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
            scheduleChord(chordStartTime, singleChordDuration);
          }

          const totalStepDuration = singleChordDuration * numberOfRepeats;

          if (onPlayingNotesChange && totalStepDuration > 0) {
            const allNoteIds = notesRef.current.map(n => n.id);
            onPlayingNotesChange(allNoteIds);
            setTimeout(() => onPlayingNotesChange([], totalStepDuration * 1000 * 0.9));
          }
          
          engineState.nextNoteTime += totalStepDuration;

        } else { // Not in chord mode, can be single note or pinch
          const step = playbackSequenceRef.current[engineState.currentNote];

          let totalStepDuration = 0;
          let notesToHighlight = [];

          // NEW LOGIC TO HANDLE PINCHES
          if (Array.isArray(step)) { // It's a pinch (array of note indices)
            const firstNoteIndex = step[0]; // Use the first note's index for rhythm pattern lookup
            const stepRhythm = rhythmPatternRef.current[firstNoteIndex] || rhythmRef.current;
            const singlePinchDuration = (stepRhythm > 0) ? (60.0 / bpmRef.current) / stepRhythm : 0;
            
            schedulePinch(step, engineState.nextNoteTime, singlePinchDuration);
            totalStepDuration = singlePinchDuration;
            notesToHighlight = step.map(idx => notesRef.current[idx]).filter(Boolean).map(n => n.id);
          } else if (typeof step === 'number') { // It's a single note (index)
            const stepIndex = step;
            const correspondingNote = notesRef.current[stepIndex % notesRef.current.length];
            if (correspondingNote) {
              const stepRhythm = correspondingNote.rhythmSubdivision || rhythmRef.current;
              
              scheduleNote(correspondingNote, engineState.nextNoteTime);
              
              const numberOfRepeats = repeatModeRef.current !== 'off' ? Math.max(1, Math.floor(stepRhythm)) : 1;
              const singleNoteDuration = (stepRhythm > 0) ? (60.0 / bpmRef.current) / stepRhythm : 0;
              totalStepDuration = singleNoteDuration * numberOfRepeats;

              notesToHighlight = [correspondingNote.id];
            } else {
              // If note doesn't exist, advance time by a default step duration
              totalStepDuration = (60.0 / bpmRef.current);
            }
          }

          if (onPlayingNotesChange && totalStepDuration > 0 && notesToHighlight.length > 0) {
            const visualDurationMs = totalStepDuration * 1000;
            onPlayingNotesChange(prev => {
              const newPlaying = new Set([...prev]);
              notesToHighlight.forEach(id => newPlaying.add(id));
              return Array.from(newPlaying);
            });
            setTimeout(() => onPlayingNotesChange(prev => prev.filter(id => !notesToHighlight.includes(id)), visualDurationMs * 0.9));
          }
          
          engineState.nextNoteTime += totalStepDuration > 0 ? totalStepDuration : (60.0 / bpmRef.current);
        }
      } else {
        engineState.nextNoteTime += (60.0 / bpmRef.current);
      }

      if (playbackSequenceRef.current.length > 0) {
        engineState.currentNote = (engineState.currentNote + 1) % playbackSequenceRef.current.length;
        
        // Logic for re-generating random sequences or changing playback order
        // is now handled by the parent component passing a new playbackSequence prop.
        // The engine simply plays the sequence it's given.
      }
    }
    timerRef.current = setTimeout(scheduler, engineState.lookahead);
  };
  
  useEffect(() => {
    if (isPlaying) {
      if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
        console.warn('AudioContext not ready. Playback blocked. Please click "Play" again.');
        return;
      }
      
      engineState.currentNote = 0;
      engineState.flowStepCounter = 0;
      engineState.nextNoteTime = audioContextRef.current.currentTime + 0.1; 
      onPlayingNotesChange([]);
      scheduler();
    } else {
      clearTimeout(timerRef.current);
      onPlayingNotesChange([]);
      engineState.flowStepCounter = 0;
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [isPlaying, onPlayingNotesChange, audioContextRef]);

  // Expose a function to play a one-shot chord, respecting the chosen sound source
  useImperativeHandle(ref, () => ({
    playSingleChord: (notesToPlay) => { // Removed `source` param, as soundSourceRef.current is used
      if (!audioContextRef.current || audioContextRef.current.state !== 'running' || !eqNodesRef.current || notesToPlay.length === 0) return;

      const noteDuration = (60.0 / bpmRef.current) / rhythmRef.current;
      const volumeFactor = notesToPlay.length > 1 ? 1 / Math.sqrt(notesToPlay.length) : 1;

      notesToPlay.forEach((note, index) => {
        const scheduledTime = audioContextRef.current.currentTime + (index * (arpeggioDelayRef.current / 1000));
        playOscillatorOrSamplerNote(note, scheduledTime, noteDuration, volumeFactor);
      });

      if (onNotePlayedRef.current) {
        notesToPlay.forEach(note => {
          onNotePlayedRef.current({ note: note, playTime: audioContextRef.current.currentTime, duration: noteDuration });
        });
      }
    },
    getRecordingNodes: () => {
      // Return the correct refs used in this component
      if (!mediaStreamDestinationRef.current || !analyserNodeRef.current) return null;
      return { stream: mediaStreamDestinationRef.current.stream, analyser: analyserNodeRef.current };
    }
  }));

  return null;
});

export default AudioEngine;
