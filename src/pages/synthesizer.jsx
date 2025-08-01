
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Scene3D from '../components/synth/Scene3D';
import VerticalSlider from '../components/synth/VerticalSlider';
import VelocityPanel from '../components/synth/VelocityPanel';
import { Note } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { RotateCw, Camera, Music4, Play, Pause, Mic, StopCircle, Music, Volume2 } from 'lucide-react';
import { SCALES, ROOT_NOTES, getFrequencyFromScale, midiToFreq } from '@/components/synth/scales';
import { TUNING_SYSTEMS } from '../components/synth/tuning'; // New import
import AudioEngine, { initAudioContext } from '../components/synth/AudioEngine';
import MidiEngine from '../components/synth/MidiEngine';

// Import new modular control panels
import PlaybackPanel from '../components/synth/controls/PlaybackPanel';
import ScalesPanel from '../components/synth/controls/ScalesPanel';
import NavigationPanel from '../components/synth/controls/NavigationPanel';
import VisualsPanel from '../components/synth/controls/VisualsPanel';
import SphereCountPanel from '../components/synth/controls/SphereCountPanel';
import SceneControlPanel from '../components/synth/controls/SceneControlPanel';
import MolecularChainPanel from '../components/synth/controls/MolecularChainPanel';
import BackgroundPanel from '../components/synth/controls/BackgroundPanel';
import WaveformPanel from '../components/synth/controls/WaveformPanel';
import MolecularShapePanel from '../components/synth/controls/MolecularShapePanel';
import { Preset } from '@/api/entities';
import { MidiSnippet } from '@/api/entities';
import { Sequence } from '@/api/entities';
import { generateMidiFile } from '@/api/functions';
import { incrementNoteCount } from '@/api/functions';
import PresetPanel from '../components/synth/controls/PresetPanel';
import MidiSnippetPanel from '../components/synth/controls/MidiSnippetPanel';
import MidiRecorderPanel from '../components/synth/controls/MidiRecorderPanel';
import { Checkbox } from '@/components/ui/checkbox';
import HudViewfinder from '../components/synth/HudViewfinder';
import AIRhythmPanel from '../components/synth/controls/AIRhythmPanel';
import AIVelocityPanel from '../components/synth/controls/AIVelocityPanel';
import Spher8BrandPanel from '../components/synth/controls/Spher8BrandPanel';
import AIMoodPanel from '../components/synth/controls/AIMoodPanel';
import ChordPanel from '../components/synth/controls/ChordPanel';
import HarmonicSeriesPanel from '../components/synth/controls/HarmonicSeriesPanel';
import PlaybackOrderPanel from '../components/synth/controls/PlaybackOrderPanel';
import AINoteRhythmCyclePanel from '../components/synth/controls/AINoteRhythmCyclePanel';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { User } from '@/api/entities';
import { UserSubscription } from '@/api/entities/UserSubscription';
import NoteCounterHUD from '../components/synth/NoteCounterHUD';
// Import new sequencer panel
import SequencerPanel from '../components/synth/controls/SequencerPanel';
import TuningPanel from '../components/synth/controls/TuningPanel'; // New import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SubscriptionModal from '../components/synth/SubscriptionModal';
import Logo from '@/components/Logo';
import { LogIn } from 'lucide-react';
import EQPanel from '../components/synth/controls/EQPanel';
import EFXPanel from '../components/synth/controls/EFXPanel';
import GuitarPanel from '../components/synth/controls/GuitarPanel';
import AudioRecorderPanel from '../components/synth/controls/AudioRecorderPanel';
import AudioSnippetPanel from '../components/synth/controls/AudioSnippetPanel';
import DodecaphonicPanel from '../components/synth/controls/DodecaphonicPanel';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle database update errors consistently
const handleNoteUpdateError = (error, operation) => {
  try {
    const errorString = String(error?.message || error || '').toLowerCase();
    let errorJson = '';

    try {
      if (error && typeof error === 'object') {
        errorJson = JSON.stringify(error).toLowerCase();
      }
    } catch (jsonError) {
      // If error cannot be stringified to JSON (e.g., circular reference), ignore
      errorJson = '';
    }

    // Check for all variations of "not found" errors
    if (errorString.includes('not found') ||
        errorString.includes('404') ||
        errorString.includes('entity not found') ||
        errorJson.includes('not found') ||
        errorJson.includes('404') ||
        errorJson.includes('entity not found') ||
        // Additional checks for HTTP error responses
        error?.status === 404 ||
        error?.response?.status === 404) {
      // Silently ignore. Note was likely deleted by another process.
      return true; // Indicates error was handled
    }

    // For any other unexpected errors, log them but don't crash
    console.warn(`Non-critical error during ${operation}:`, error);
    return false; // Indicates error was not a "not found" error
  } catch (handlingError) {
    // If error handling itself fails, just log and continue
    console.warn(`Error handling failed for ${operation}:`, handlingError);
    return true; // Consider it handled to prevent further issues
  }
};

// Enhanced safe delete with additional error catching
const safeDeleteNote = async (noteId) => {
  // Skip invalid or temporary IDs
  if (!noteId || typeof noteId !== 'string' ||
      String(noteId).startsWith('temp_') ||
      String(noteId).startsWith('reset_') ||
      String(noteId).startsWith('shape_') ||
      String(noteId).startsWith('scale_')) {
    return;
  }

  try {
    await Note.delete(noteId);
  } catch (error) {
    // Enhanced error handling with multiple fallbacks
    const wasHandled = handleNoteUpdateError(error, `note deletion ${noteId}`);
    
    // If it's still not a recognized "not found" error, try one more check
    if (!wasHandled) {
      // Sometimes the error comes in different formats from the API
      const errorStr = String(error).toLowerCase();
      if (errorStr.includes('not found') || errorStr.includes('404')) {
        // Still handle it silently
        return;
      }
      // Only log truly unexpected errors
      console.warn(`Unexpected error deleting note ${noteId}:`, error);
    }
  }
};

const safeClearAllNotes = async () => {
  try {
    const notesToDelete = await Note.list();
    if (notesToDelete.length === 0) {
      return;
    }
    
    // SEQUENTIAL DELETION to avoid rate-limiting
    // Delete notes one-by-one with a small delay
    for (const note of notesToDelete) {
      await safeDeleteNote(note.id);
      await sleep(25); // 25ms delay between delete calls
    }

  } catch (error) {
    // Enhanced error handling for list operation
    const wasHandled = handleNoteUpdateError(error, 'notes list for deletion');
    if (!wasHandled) {
      console.warn('Failed to retrieve notes for deletion:', error);
    }
  }
};

const midiNoteToHSL = (midiNote) => {
  if (typeof midiNote !== 'number' || !isFinite(midiNote)) return 'hsl(0, 0%, 100%)';
  const noteInOctave = ((midiNote % 12) + 12) % 12;
  const hue = (noteInOctave / 12) * 360;
  return `hsl(${Math.round(hue)}, 80%, 50%)`;
};

const SHAPE_DEFINITIONS = {
  Linear: {
    count: 2,
    positions: [{ x: -2.5, y: 0, z: 0 }, { x: 2.5, y: 0, z: 0 }]
  },
  'Bent': {
    count: 3,
    positions: [
      { x: 0, y: 0, z: 0 },
      { x: -2.0, y: 1.5, z: 0 },
      { x: 2.0, y: 1.5, z: 0 }
    ]
  },
  'Trigonal Planar': {
    count: 4,
    positions: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 2.5 },
      { x: 2.16, y: 0, z: -1.25 },
      { x: -2.16, y: 0, z: -1.25 }
    ]
  },
  Tetrahedral: {
    count: 5,
    positions: [
      { x: 0, y: 2.5, z: 0 },
      { x: 2.35, y: -0.83, z: 0 },
      { x: -1.17, y: -0.83, z: 2.04 },
      { x: -1.17, y: -0.83, z: -2.04 },
      { x: 0, y: 0, z: 0 } // Center point
    ]
  },
  'Trigonal Bipyramidal': {
    count: 6,
    positions: [
      { x: 0, y: 3, z: 0 },
      { x: 0, y: -3, z: 0 },
      { x: 2.5, y: 0, z: 0 },
      { x: -1.25, y: 0, z: 2.16 },
      { x: -1.25, y: 0, z: -2.16 },
      { x: 0, y: 0, z: 0 } // Center point
    ]
  },
  'Square Pyramidal': {
    count: 6,
    positions: [
      { x: 0, y: 2.5, z: 0 },
      { x: 2.0, y: -0.5, z: 0 },
      { x: -2.0, y: -0.5, z: 0 },
      { x: 0, y: -0.5, z: 2.0 },
      { x: 0, y: -0.5, z: -2.0 },
      { x: 0, y: 0, z: 0 } // Center point
    ]
  },
  Octahedral: {
    count: 7,
    positions: [
      { x: 2.5, y: 0, z: 0 }, 
      { x: -2.5, y: 0, z: 0 },
      { x: 0, y: 2.5, z: 0 }, 
      { x: 0, y: -2.5, z: 0 },
      { x: 0, y: 0, z: 2.5 }, 
      { x: 0, y: 0, z: -2.5 },
      { x: 0, y: 0, z: 0 }, // Center point
    ]
  },
  'Pentagonal Bipyramidal': {
    count: 8,
    positions: [
      { x: 0, y: 3, z: 0 },
      { x: 0, y: -3, z: 0 },
      { x: 2.5, y: 0, z: 0 },
      { x: 0.77, y: 0, z: 2.38 },
      { x: -2.02, y: 0, z: 1.47 },
      { x: -2.02, y: 0, z: -1.47 },
      { x: 0.77, y: 0, z: -2.38 },
      { x: 0, y: 0, z: 0 } // Center point
    ]
  }
};

const sanitizeNotes = (notesToSanitize) => {
  if (!Array.isArray(notesToSanitize)) return [];
  return notesToSanitize.map(note => {
    if (!note) return null;
    const sanitizedNote = { ...note };
    if (!sanitizedNote.position || typeof sanitizedNote.position.x !== 'number' || typeof sanitizedNote.position.y !== 'number' || typeof sanitizedNote.position.z !== 'number') {
      sanitizedNote.position = { x: 0, y: 0, z: 0 };
    }
    if (typeof sanitizedNote.midiVelocity !== 'number') {
      sanitizedNote.midiVelocity = 100;
    }
    if (typeof sanitizedNote.rhythmSubdivision !== 'number') {
      sanitizedNote.rhythmSubdivision = 1;
    }
    return sanitizedNote;
  }).filter(Boolean);
};

const reconcileNotesWithDbIds = (tempNotes, dbCreatedNotes) => {
  // If the number of notes doesn't match, it indicates a significant issue
  // or a more complex reconciliation logic is needed (e.g., matching by position, etc.)
  // For simplicity and assuming bulkCreate returns notes in the same order,
  // we'll map them by index.
  if (tempNotes.length !== dbCreatedNotes.length) {
    console.warn(
      `Reconciliation warning: tempNotes length (${tempNotes.length}) does not match dbCreatedNotes length (${dbCreatedNotes.length}).
       Returning notes directly from DB as source of truth for IDs.`
    );
    // In case of mismatch, prioritize the actual notes from the DB,
    // though this might lose some temporary client-side data not persisted.
    return dbCreatedNotes;
  }

  return tempNotes.map((tempNote, index) => {
    const dbNote = dbCreatedNotes[index];
    if (dbNote && dbNote.id) {
      // Replace the temporary ID with the real ID from the database
      return { ...tempNote, id: dbNote.id };
    }
    // This case should ideally not happen if bulkCreate was successful for all notes
    console.warn(`Reconciliation failed for note at index ${index}. Temp ID: ${tempNote.id}. DB Note: ${JSON.stringify(dbNote)}`);
    return tempNote; // Keep the temporary note if real ID is missing
  });
};

export default function Synthesizer() {
  const [notes, setNotes] = useState([]);
  const notesRef = useRef(notes); // Ref to hold the latest notes state
  useEffect(() => { notesRef.current = notes; }, [notes]); // Keep the ref updated with the latest notes

  const [isScenePlaying, setIsScenePlaying] = useState(false);
  const [isSequencerPlaying, setIsSequencerPlaying] = useState(false);
  const [lineConnectionMode, setLineConnectionMode] = useState('mesh'); // New state for line drawing mode
  // NEW: Add loading states to prevent premature interactions
  const [isNotesLoaded, setIsNotesLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // RE-ARCHITECTED LOCK: This lock is now the single source of truth for all major DB operations.
  const isBusy = useRef(false);

  const [masterVolume, setMasterVolume] = useState(70);
  const [bpm, setBpm] = useState(120);
  const [rhythm, setRhythm] = useState(2);
  const [playingNotes, setPlayingNotes] = useState([]);
  const [isResetting, setIsResetting] = useState(false);
  const [structureTransform, setStructureTransform] = useState({
    yTranslation: 0, xRotation: 0, yRotation: 0, zRotation: 0,
    autoRotateX: false, autoRotateY: true, autoRotateZ: false,
    autoRotateSpeedX: 1, autoRotateSpeedY: 1, autoRotateSpeedZ: 1,
    autoTranspose: false, autoTransposeRange: 12, autoTransposeSpeed: 1,
  });
  const [cameraY, setCameraY] = useState(-1.1);
  const [yAxisMusicalScale, setYAxisMusicalScale] = useState(1.0);
  const [sphereBrightness, setSphereBrightness] = useState(0.5);
  const [selectedScale, setSelectedScale] = useState(Object.keys(SCALES)[0]);
  const [rootNote, setRootNote] = useState(0);
  const [sphereCount, setSphereCount] = useState(5); // Changed initial state to 5 for Tetrahedral
  const MAX_NOTES = 8;
  const resetCameraRef = useRef(null);
  const debounceTimers = useRef({});
  const isInitialMount = useRef(true);
  const userRef = useRef(null); // Ref to store user data
  const updateCountTimeoutRef = useRef(null); // Ref for debouncing DB updates
  // NEW: Refs for batching velocity updates to prevent overwhelming the server
  const velocityUpdateQueue = useRef({});
  const velocityFlushTimer = useRef(null);

  // Ref to manage debouncing for note sequence creation (e.g., from guitar chords)
  const noteSequenceTimeoutRef = useRef(null);
  const chordRequestVersion = useRef(0); // NEW: Version counter for chord requests

  // NEW: Refs for batching rhythm updates
  const rhythmUpdateQueue = useRef({});

  const rhythmFlushTimer = useRef(null);

  // Ref to batch note increments
  const noteIncrementBatch = useRef(0);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false); // New lockout state
  const [isAuthenticated, setIsAuthenticated] = useState(null); // New state for auth check
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [recordingNodes, setRecordingNodes] = useState(null); // Add missing state for recording nodes

  const audioEngineRef = useRef(null); // Ref for AudioEngine component instance
  const audioRecorderRef = useRef(null);

  // Add back the missing state variables
  const [noteCount, setNoteCount] = useState(0);
  const [isHudVisible, setIsHudVisible] = useState(true);

  // New states for Sequencer
  const [sequences, setSequences] = useState([]);
  const [presets, setPresets] = useState([]);
  const presetMap = useRef(new Map());

  const [currentSequence, setCurrentSequence] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [newSequenceName, setNewSequenceName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(''); // Initialize with useState
  const [newStepDuration, setNewStepDuration] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoopMode, setIsLoopMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [processingShape, setProcessingShape] = useState(null);

  const chordPanelRef = useRef(null);
  const velocityPanelRefLg = useRef(null);
  const velocityPanelRefMobile = useRef(null);
  const hasTuningSetChromatic = useRef(false); // Add ref to track tuning change

  // Sampler states
  const [soundSource, setSoundSource] = useState('sampler'); // 'oscillator' or 'sampler'
  const [isSamplerLoading, setIsSamplerLoading] = useState(false);

  const [selectedMidiOutput, setSelectedMidiOutput] = useState(null);
  const [midiChannel, setMidiChannel] = useState(0);
  const [audioMode, setAudioMode] = useState('web-audio');
  const [selectedBackground, setSelectedBackground] = useState('linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)');
  const [waveform, setWaveform] = useState('sine');
  const [envelope, setEnvelope] = useState({ a: 0.00, d: 0.6, s: 0.6, r: 0.3 });
  const [eq, setEq] = useState({
    lowGain: 0,
    lowFreq: 200,
    lowFilterType: 'lowshelf', // Added
    midGain: 0,
    midFreq: 1000,
    midQ: 1,
    highGain: 0,
    highFreq: 5000,
    highFilterType: 'highshelf' // Added
  });
  const [arpeggioDelay, setArpeggioDelay] = useState(15);
  const [isPanningEnabled, setIsPanningEnabled] = useState(true);
  const [panningWidth, setPanningWidth] = useState(100); // Add panningWidth state

  const [isChordMode, setIsChordMode] = useState(false);
  const [playbackOrder, setPlaybackOrder] = useState('forward');
  const [playbackSequence, setPlaybackSequence] = useState([]);
  const [noteLength, setNoteLength] = useState(1.0);

  const [rhythmPattern, setRhythmPattern] = useState([1, 1, 1, 1]);
  const [cycleLength, setCycleLength] = useState(4);
  const [repeatMode, setRepeatMode] = useState('off');

  const [efx, setEfx] = useState({
    delayOn: false,
    delayTime: 0.5,
    delayFeedback: 0.4,
    delayMix: 0.35,
    reverbOn: false,
    reverbDry: 0.8, // New: Default dry level
    reverbWet: 0.35, // New: Default wet level
    reverbSize: 2.5,
    reverbDecay: 2.0,
  });

  const Y_MIN = -4, Y_MAX = 4;

  const [sceneHeight, setSceneHeight] = useState(() => {
    // Calculate initial height correctly to avoid flash of incorrect size
    if (typeof window === 'undefined') {
      return 500; // Sensible default for SSR or build environments
    }
    const viewportHeight = window.innerHeight;
    const isMobile = window.innerWidth < 768;
    // Set ratio: 50% for desktop, 40% for mobile
    const ratio = isMobile ? 0.40 : 0.50; 
    return viewportHeight * ratio;
  });
  const containerRef = useRef(null);
  const topPanelRef = useRef(null);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const startCameraY = useRef(1.0);

  // MIDI Recorder State
  const midiBufferRef = useRef([]);
  const [displayedBuffer, setDisplayedBuffer] = useState([]);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const playbackTimeoutRef = useRef(null);
  const individualPlaybackTimersRef = useRef([]);
  const recordingEndTimeRef = useRef(null);
  const RECORDING_WINDOW_MS = 15000;

  // For reliable double-click detection (throttling specific actions)
  const resetLastClickTime = useRef(0);
  const RESET_DEBOUNCE_TIME = 500;

  const saveSnippetLastClickTime = useRef(0);
  const SAVE_SNIPPET_DEBOUNCE_TIME = 1000;

  const [activeTuning, setActiveTuning] = useState('12-TET'); // New state for tuning

  // Sync recorder state with main playback (now scene playback)
  useEffect(() => {
    if (isScenePlaying) {
      recordingEndTimeRef.current = null;
    } else {
      if (recordingEndTimeRef.current === null && midiBufferRef.current.length > 0) {
        recordingEndTimeRef.current = performance.now();
      }
      setIsPlaybackActive(false);
      clearTimeout(playbackTimeoutRef.current);
      individualPlaybackTimersRef.current = [];
    }
  }, [isScenePlaying]);

  // Update display buffer for UI visualization
  useEffect(() => {
    let intervalId;
    if (isScenePlaying) {
      intervalId = setInterval(() => {
        const now = performance.now();
        const cutoffTime = now - RECORDING_WINDOW_MS;

        // Filter out old events, but only if recordingEndTimeRef has not been set (i.e. if recording is ongoing)
        // If recordingEndTimeRef.current is set, it means recording has stopped, and we keep the full buffer
        if (recordingEndTimeRef.current === null) {
          midiBufferRef.current = midiBufferRef.current.filter(e => e.recordedAt >= cutoffTime);
        }
        setDisplayedBuffer([...midiBufferRef.current]);
      }, 250);
    } else {
      setDisplayedBuffer([...midiBufferRef.current]);
    }
    return () => clearInterval(intervalId);
  }, [isScenePlaying]);

  const handleQuickRecordToggle = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.toggleRecording();
    }
  };

  const handleScrollToPanel = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleVelocityScroll = () => {
    // Check which ref belongs to the currently visible element
    if (velocityPanelRefLg.current?.offsetParent) { // offsetParent is null for hidden elements
      handleScrollToPanel(velocityPanelRefLg);
    } else if (velocityPanelRefMobile.current?.offsetParent) {
      handleScrollToPanel(velocityPanelRefMobile);
    }
  }

  // The main handler for capturing notes
  const handleNotePlayed = useCallback((noteEvent) => {
    if (isScenePlaying) {
      const now = performance.now();
      const cutoffTime = now - RECORDING_WINDOW_MS;

      const trimmedBuffer = midiBufferRef.current.filter(e => e.recordedAt >= cutoffTime);
      trimmedBuffer.push({ ...noteEvent, recordedAt: now });
      midiBufferRef.current = trimmedBuffer;
    }

    // Increment local note count for immediate UI feedback
    setNoteCount(prevCount => {
      const newCount = prevCount + 1;
      
      // Batch increments to send to the backend
      noteIncrementBatch.current += 1;
      
      // Debounce the call to the backend function to avoid rate-limiting
      if (updateCountTimeoutRef.current) {
        clearTimeout(updateCountTimeoutRef.current);
      }
      
      updateCountTimeoutRef.current = setTimeout(() => {
        if (noteIncrementBatch.current > 0) {
          try {
            // RESILIENCE FIX: Wrap the call in a try/catch block.
            // If the backend fails, log a warning but DO NOT crash the app.
            incrementNoteCount({ incrementBy: noteIncrementBatch.current })
              .then(() => {
                // Also update local user data when batch is sent successfully
                if (userRef.current) {
                  userRef.current.note_count = (userRef.current.note_count || 0) + noteIncrementBatch.current;
                }
              })
              .catch(error => {
                console.warn("Failed to update global note count. This is a non-critical error.", error);
              });
            noteIncrementBatch.current = 0; // Reset batch after sending
          } catch (error) {
            console.warn("Failed to initiate global note count update. This is a non-critical error.", error);
          }
        }
      }, 3000); // Wait 3 seconds after the last note played to send the update

      // Debug logging with more detail
      console.log('Note count:', newCount);
      console.log('Full userRef.current:', userRef.current);
      console.log('User plan:', userRef.current?.plan);
      console.log('Session flag:', sessionStorage.getItem('subscriptionModalShown'));

      // Simple, direct check - no async calls to complicate things
      // UPDATED: Check lockout condition based on cumulative count for free users
      if (newCount >= 5000) {
        console.log('COUNT REACHED 5000!');
        
        // Check if we have user data at all
        if (!userRef.current) {
          console.log('No user data available!');
          return newCount;
        }
        
        const plan = userRef.current.plan || 'free';
        console.log('User plan check:', plan, 'Type:', typeof plan);
        
        // Lock out free and cancelled users at 5000 notes
        if (plan === 'free' || plan === 'cancelled') {
          console.log('USER IS ON FREE OR CANCELLED PLAN - LOCKING OUT AT 5000 NOTES!');
          
          // Stop playback immediately
          setIsScenePlaying(false);
          setIsSequencerPlaying(false);
          setPlayingNotes([]);
          
          setIsLockedOut(true);
          
          if (!sessionStorage.getItem('subscriptionModalShown')) {
            console.log('MODAL NOT SHOWN YET - TRIGGERING NOW!');
            
            // Show subscription modal
            setIsSubscriptionModalOpen(true);
            sessionStorage.setItem('subscriptionModalShown', 'true');
            
            console.log('PLAYBACK STOPPED, USER LOCKED OUT, AND MODAL OPENED!');
          } else {
            console.log('Modal already shown this session, but user is now locked out');
          }
        } else {
          console.log('User is not on free/cancelled plan:', plan);
        }
      }
      
      return newCount;
    });

  }, [isScenePlaying, setIsLockedOut, setIsSubscriptionModalOpen]);

  useEffect(() => {
    const generateSequence = (order, len, cycleLen) => {
      if (cycleLen === 0) return [];
      
      const indices = Array.from({ length: len }, (_, i) => i % len);
      const cycleIndices = Array.from({ length: cycleLen }, (_, i) => i % len);

      switch (order) {
        case 'forward':
          return cycleIndices;
        case 'reverse':
          return [...cycleIndices].reverse();
        case 'boomerang':
          if (cycleIndices.length < 2) return cycleIndices;
          const forwardPart = cycleIndices;
          const backwardPart = [...cycleIndices.slice(0, -1)].reverse();
          return [...forwardPart, ...backwardPart];
        case 'sequential':
          const sequential = [];
          if (cycleIndices.length > 0) {
            for (let i = 1; i < cycleIndices.length; i++) {
              sequential.push(cycleIndices[0], cycleIndices[i]);
            }
            sequential.push(cycleIndices[0]); // Ensure the root is played at the end of cycle.
          }
          return sequential.length > 0 ? sequential : [cycleIndices[0] || 0];
        case 'random':
          const shuffled = [...cycleIndices];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        // Guitar Picking Patterns (0-indexed)
        case 'guitar_flamenco_arpeggio': return [0, 1, 2, 3, 4, 5, 4, 3].filter(i => i < len);
        case 'guitar_pinch': return [0, 3, 1, [4, 3]].map(s => Array.isArray(s) ? s.filter(i => i < len) : s).filter(s => (Array.isArray(s) ? s.length > 0 : s < len));
        case 'guitar_asc_anchor': return [0, 2, 3, 4, 5, 1, 3, 4].filter(i => i < len);
        case 'guitar_desc_pulse': return [5, 4, 3, 0, 5, 4, 3, 1].filter(i => i < len);
        case 'guitar_rasgueado': return [0, 1, 3, 4, [5, 4, 3]].map(s => Array.isArray(s) ? s.filter(i => i < len) : s).filter(s => (Array.isArray(s) ? s.length > 0 : s < len));
        case 'guitar_staggered': return [0, 4, 1, 3, 2, 5, 1, 4].filter(i => i < len);
        
        // PIPA PICKING PATTERNS (0-indexed, max len is 4)
        case 'pipa_roll': return [0, 1, 2, 3, 2, 1, 0, 1].filter(i => i < len);
        case 'pipa_tremolo': return [0, 0, 1, 1, [1, 2], [1, 2], [2, 3], [2, 3]]
            .map(s => Array.isArray(s) ? s.filter(i => i < len) : s) // Filter elements within arrays
            .filter(s => (Array.isArray(s) ? s.length > 0 : s < len)); // Filter out empty arrays or single invalid numbers
        case 'pipa_bounce': return [0, 2, 1, 3, 0, 2, 1, 3].filter(i => i < len);
        case 'pipa_sweep': return [0, 1, 2, 3, 3, 2, 1, 0].filter(i => i < len);
        case 'pipa_alternating': return [0, 3, 1, 2, 0, 3, 1, 2].filter(i => i < len);
        case 'pipa_cascade': return [3, 2, 1, 0, 1, 2, 3, 2].filter(i => i < len);
        
        default:
          return cycleIndices;
      }
    };
    
    setPlaybackSequence(generateSequence(playbackOrder, notes.length, cycleLength));
  }, [notes.length, playbackOrder, cycleLength]);


  const handleSaveMidiSnippet = async (loopStartSec, loopEndSec) => {
    const now = performance.now();
    if (now - saveSnippetLastClickTime.current < SAVE_SNIPPET_DEBOUNCE_TIME) {
      return;
    }
    saveSnippetLastClickTime.current = now;

    if (isLockedOut) {
      alert("Cannot save MIDI snippet: User is locked out.");
      return;
    }

    const nowReference = recordingEndTimeRef.current || performance.now();
    const bufferStartTime = nowReference - RECORDING_WINDOW_MS;

    const snippetStartTime = bufferStartTime + (loopStartSec * 1000);
    const snippetEndTime = bufferStartTime + (loopEndSec * 1000);

    const notesInSnippet = midiBufferRef.current.filter(event =>
      event.recordedAt >= snippetStartTime && event.recordedAt <= snippetEndTime
    );

    if (notesInSnippet.length === 0) {
      alert("No notes in selected loop to save.");
      return;
    }

    const firstNoteTime = Math.min(...notesInSnippet.map(n => n.recordedAt));

    const notesForApi = notesInSnippet.map(event => {
      const frequency = event.note.liveFrequency || event.note.frequency;
      const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);

      const recordedDuration = event.duration || ((60.0 / bpm) / rhythm);

      return {
        midiNote: Math.max(0, Math.min(127, midiNote)),
        velocity: Math.max(1, Math.min(127, event.note.midiVelocity || 100)),
        startTime: (event.recordedAt - firstNoteTime) / 1000,
        duration: recordedDuration,
      };
    });

    try {
      const { data } = await generateMidiFile({
        notes: notesForApi,
        tempo: bpm
      });
      if (data.midiData) {
        const newName = `Snippet ${new Date().toLocaleString()}`;
        await MidiSnippet.create({
          name: newName,
          midiData: data.midiData,
          duration: loopEndSec - loopStartSec,
        });
        window.dispatchEvent(new CustomEvent('snippetSaved'));
      }
    } catch (error) {
      console.error("Failed to generate or save MIDI file:", error);
      alert("Error: Could not save MIDI snippet.");
    }
  };

  const handleRecorderPlayback = async (loopStartSec, loopEndSec, isLoopMode = false, isDynamicUpdate = false) => {
    await initAudioContext(); // Moved here to ensure context is resumed on user interaction
    if (isLockedOut) {
      if (!isDynamicUpdate) {
        alert("Cannot playback MIDI: User is locked out.");
      }
      return;
    }
    if (!isDynamicUpdate && isPlaybackActive) {
      setIsPlaybackActive(false);
      clearTimeout(playbackTimeoutRef.current);
      individualPlaybackTimersRef.current = [];
      return;
    }

    if (isDynamicUpdate && !isPlaybackActive) {
      return;
    }

    if (isPlaybackActive) {
      clearTimeout(playbackTimeoutRef.current);
      individualPlaybackTimersRef.current = [];
    }

    const nowReference = recordingEndTimeRef.current || performance.now();
    const bufferStartTime = nowReference - RECORDING_WINDOW_MS;

    const snippetStartTime = bufferStartTime + (loopStartSec * 1000);
    const snippetEndTime = bufferStartTime + (loopEndSec * 1000);

    const notesInSnippet = midiBufferRef.current.filter(event =>
      event.recordedAt >= snippetStartTime && event.recordedAt <= snippetEndTime
    );

    if (notesInSnippet.length === 0) {
      if (!isDynamicUpdate) {
        setIsPlaybackActive(false);
      }
      return;
    }

    const playSequence = () => {
      if (!isDynamicUpdate) {
        setIsPlaybackActive(true);
      }

      individualPlaybackTimersRef.current.forEach(id => clearTimeout(id));
      individualPlaybackTimersRef.current = [];

      const firstNoteTime = Math.min(...notesInSnippet.map(n => n.recordedAt));

      notesInSnippet.forEach(event => {
        const delay = event.recordedAt - firstNoteTime;
        const recordedDuration = event.duration || ((60.0 / bpm) / rhythm);

        const timeoutId = setTimeout(() => {
          if (audioMode === 'midi' && midiEngine.currentOutput) {
            const frequency = event.note.liveFrequency || event.note.frequency;
            if (!frequency) return;

            const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);

            const clampedMidiNote = Math.max(0, Math.min(127, midiNote));
            const velocity = typeof event.note.midiVelocity === 'number' ? event.note.midiVelocity : 100;
            const clampedVelocity = Math.max(0, Math.min(127, velocity));

            if (clampedVelocity === 0) return;

            const noteOnMessage = [0x90 | midiChannel, clampedMidiNote, clampedVelocity];
            midiEngine.currentOutput.send(noteOnMessage);

            const durationMs = recordedDuration * 1000 * noteLength;
            setTimeout(() => {
              if (!midiEngine.currentOutput) return;
              const noteOffMessage = [0x80 | midiChannel, clampedMidiNote, 0];
              midiEngine.currentOutput.send(noteOffMessage);
            }, durationMs);

          } else {
            // Web Audio playback - use AudioEngine's playSingleChord for consistency
            if (audioEngineRef.current && audioEngineRef.current.playSingleChord) {
              // Create a single-note array to play through AudioEngine
              // Re-process the note through getLiveNoteProperties to ensure tunedFrequency is available
              const noteToPlayProcessed = getLiveNoteProperties(event.note);
              const noteToPlay = [{
                ...noteToPlayProcessed, // Now includes tunedFrequency
                midiVelocity: event.note.midiVelocity || 80 // Keep original velocity
              }];
              
              // Use the current sound source setting (sampler or oscillator)
              audioEngineRef.current.playSingleChord(noteToPlay, soundSource);
            } else {
              // Fallback: Create oscillator directly if AudioEngine not available
              if (!window.audioContext) return;

              try {
                // Re-process the note through getLiveNoteProperties to ensure tunedFrequency is available
                const noteToPlayProcessed = getLiveNoteProperties(event.note);
                const frequency = noteToPlayProcessed.tunedFrequency; // Use tuned frequency here

                if (!frequency || !isFinite(frequency) || frequency <= 0) return;

                const osc = window.audioContext.createOscillator();
                const gainNode = window.audioContext.createGain();
                
                osc.connect(gainNode);
                gainNode.connect(window.audioContext.destination);

                osc.type = waveform;
                osc.frequency.value = frequency;
                
                const velocity = event.note.midiVelocity || 100;
                const baseVolume = (masterVolume / 100) * (velocity / 127) * 0.3;
                
                const { a, d, s, r } = envelope;
                const duration = recordedDuration * noteLength;
                const currentTime = window.audioContext.currentTime;
                
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(baseVolume, currentTime + a);
                gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, baseVolume * s), currentTime + a + d);
                gainNode.gain.setValueAtTime(Math.max(0.001, baseVolume * s), currentTime + duration - r);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

                osc.start(currentTime);
                osc.stop(currentTime + duration + 0.1);
                
              } catch (error) {
                console.error('Error playing retroactive note:', error);
              }
            }
          }
        }, delay);
        individualPlaybackTimersRef.current.push(timeoutId);
      });

      const loopDuration = (loopEndSec - loopStartSec) * 1000;

      clearTimeout(playbackTimeoutRef.current);

      if (isLoopMode) {
        playbackTimeoutRef.current = setTimeout(playSequence, loopDuration);
      } else {
        playbackTimeoutRef.current = setTimeout(() => {
          setIsPlaybackActive(false);
        }, loopDuration);
      }
    };

    playSequence();
  };

  useEffect(() => {
    if (isPlaybackActive) {
      clearTimeout(playbackTimeoutRef.current);
      individualPlaybackTimersRef.current = [];
    }
  }, [isPlaybackActive]);

  useEffect(() => {
    const handleResize = () => {
      // Use the same logic as initial state for consistency on resize
      if (containerRef.current) {
        const viewportHeight = window.innerHeight;
        const isMobile = window.innerWidth < 768;
        const ratio = isMobile ? 0.40 : 0.50;
        const newHeight = viewportHeight * ratio;
        setSceneHeight(newHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = useCallback((e) => {
    isResizing.current = true;
    startY.current = e.clientY;
    startHeight.current = topPanelRef.current.offsetHeight;
    startCameraY.current = cameraY;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
  }, [cameraY]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const deltaY = e.clientY - startY.current;
    let newHeight = startHeight.current + deltaY;

    const minTopHeight = 150;
    const minBottomHeight = 300;

    if (containerRef.current) {
      const totalHeight = containerRef.current.offsetHeight;
      const splitterHeight = 8;
      const maxTopHeight = totalHeight - minBottomHeight - splitterHeight;
      newHeight = Math.max(minTopHeight, newHeight);
      newHeight = Math.min(maxTopHeight, newHeight);
    } else {
      newHeight = Math.max(minTopHeight, newHeight);
    }

    const heightChangePx = newHeight - startHeight.current;
    const cameraYOffset = heightChangePx / 100.0;
    const adjustedCameraY = startCameraY.current + cameraYOffset;

    setSceneHeight(newHeight);
    setCameraY(adjustedCameraY);
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    document.body.style.pointerEvents = 'auto';
  }, [handleMouseMove]);

  const handleTouchMove = useCallback((e) => {
    if (!isResizing.current) return;
    const clientY = e.touches[0].clientY;
    const deltaY = clientY - startY.current;
    let newHeight = startHeight.current + deltaY;

    const minTopHeight = 150;
    const minBottomHeight = 200;

    if (containerRef.current) {
      const totalHeight = containerRef.current.offsetHeight;
      const splitterHeight = 8;
      const maxTopHeight = totalHeight - minBottomHeight - splitterHeight;
      newHeight = Math.max(minTopHeight, newHeight);
      newHeight = Math.min(maxTopHeight, newHeight);
    } else {
      newHeight = Math.max(minTopHeight, newHeight);
    }

    const heightChangePx = newHeight - startHeight.current;
    const cameraYOffset = heightChangePx / 100.0;
    const adjustedCameraY = startCameraY.current + cameraYOffset;

    setSceneHeight(newHeight);
    setCameraY(adjustedCameraY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.body.style.userSelect = 'auto';
    document.body.style.pointerEvents = 'auto';
  }, []); // Remove the handleTouchMove dependency to break circular dependency

  const handleTouchStart = useCallback((e) => {
    isResizing.current = true;
    startY.current = e.touches[0].clientY;
    startHeight.current = topPanelRef.current.offsetHeight;
    startCameraY.current = cameraY;
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
  }, [cameraY, handleTouchMove, handleTouchEnd]);

  // NEW: Function to flush rhythm updates to the database in a staggered way
  const flushRhythmUpdates = useCallback(async () => {
    if (isBusy.current || Object.keys(rhythmUpdateQueue.current).length === 0) return;

    const updatesToProcess = { ...rhythmUpdateQueue.current };
    rhythmUpdateQueue.current = {}; // Clear queue immediately

    isBusy.current = true;
    try {
      const currentNotesSnapshot = notesRef.current;
      
      // Process updates sequentially with a delay to avoid rate limiting
      for (const noteId in updatesToProcess) {
        // More rigorous validation for noteId
        if (noteId && 
            typeof noteId === 'string' && 
            noteId.length >= 20 &&
            !String(noteId).startsWith('temp_') && 
            !String(noteId).startsWith('reset_') && 
            !String(noteId).startsWith('shape_') && 
            !String(noteId).startsWith('scale_')) {

          const noteStillExists = currentNotesSnapshot.some(note => note.id === noteId);
          if (noteStillExists) {
            try {
              await Note.update(noteId, updatesToProcess[noteId]);
              await sleep(50); // Delay of 50ms between each API call
            } catch (error) {
              const wasHandled = handleNoteUpdateError(error, `batch rhythm update ${noteId}`);
              if (!wasHandled) {
                console.error(`Unhandled error updating note rhythm ${noteId}:`, error);
              }
            }
          } else {
            console.log(`Note ${noteId} no longer exists, skipping rhythm update in flush`);
          }
        }
      }
    } catch (error) {
      console.error("Error during batch rhythm update flush:", error);
    } finally {
      isBusy.current = false;
    }
  }, []);

  // Critical cleanup for animation frame and timers
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
      debounceTimers.current = {};

      clearTimeout(playbackTimeoutRef.current);
      individualPlaybackTimersRef.current.forEach(id => clearTimeout(id));
      individualPlaybackTimersRef.current = [];
      clearTimeout(velocityFlushTimer.current); // Clear velocity flush timer on unmount
      clearTimeout(rhythmFlushTimer.current); // Clear rhythm flush timer on unmount
      if (noteSequenceTimeoutRef.current) { // Add cleanup for the new ref
        clearTimeout(noteSequenceTimeoutRef.current);
      }
    };
  }, []);

  // Clean up MIDI buffer periodically to prevent memory buildup
  useEffect(() => {
    if (!isScenePlaying) {
      const timeoutId = setTimeout(() => {
        if (midiBufferRef.current.length > 100) {
          midiBufferRef.current = midiBufferRef.current.slice(-50);
          setDisplayedBuffer([...midiBufferRef.current]);
        }
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [isScenePlaying]);

  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now(); // Track actual time for consistent speed

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Use actual elapsed time for consistent rotation speed regardless of frame rate
      const timeMultiplier = deltaTime / 16.67; // Normalize to 60fps baseline (16.67ms per frame)

      setStructureTransform(prevTransform => {
        const newTransform = { ...prevTransform };
        let hasChanged = false;

        if (newTransform.autoRotateX) {
          const speed = (newTransform.autoRotateSpeedX || 1) * 0.2 * timeMultiplier;
          newTransform.xRotation = (newTransform.xRotation + speed) % 360;
          hasChanged = true;
        }
        if (newTransform.autoRotateY) {
          const speed = (newTransform.autoRotateSpeedY || 1) * 0.2 * timeMultiplier;
          newTransform.yRotation = (newTransform.yRotation + speed) % 360;
          hasChanged = true;
        }
        if (newTransform.autoRotateZ) {
          const speed = (newTransform.autoRotateSpeedZ || 1) * 0.2 * timeMultiplier;
          newTransform.zRotation = (newTransform.zRotation + speed) % 360;
          hasChanged = true;
        }

        if (newTransform.autoTranspose) {
          const time = currentTime * 0.001; // Use actual performance time
          const speed = (newTransform.autoTransposeSpeed || 1) * 0.5;
          const range = (newTransform.autoTransposeRange || 12);
          newTransform.yTranslation = Math.sin(time * speed) * range;
          hasChanged = true;
        }

        if (hasChanged) return newTransform;
        return prevTransform;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // New useEffect to listen for custom camera reset event
  useEffect(() => {
    const handleResetCameraEvent = () => {
      handleResetCamera();
    };

    window.addEventListener('resetCameraView', handleResetCameraEvent);
    return () => {
      window.removeEventListener('resetCameraView', handleResetCameraEvent);
    };
  }, []);

  const calculateNoteProps = useCallback((yPosition, scale, rootNoteMidi, transposeSemitones = 0, musicalScale = 1.0) => {
    const intervals = SCALES[scale];
    if (!intervals) return { scaleDegree: 0, frequency: 440, color: '#ffffff', midiNote: 69 };

    const baseMidiNote = 60;

    // NEW: Round transposeSemitones to discrete semitone values for audio calculations
    const discreteTransposeSemitones = Math.round(transposeSemitones);

    if (musicalScale === 0) {
      const flatMidiNote = baseMidiNote + rootNoteMidi + discreteTransposeSemitones;
      const clampedMidiNote = Math.max(0, Math.min(127, flatMidiNote));
      const frequency = midiToFreq(clampedMidiNote);
      const color = midiNoteToHSL(clampedMidiNote);
      return { scaleDegree: 0, frequency, color, midiNote: clampedMidiNote };
    }

    const semitonesFromCenter = (yPosition * 6 * musicalScale);

    const targetMidi = baseMidiNote + semitonesFromCenter + rootNoteMidi + discreteTransposeSemitones;

    const octaveOffset = Math.floor((targetMidi - baseMidiNote - rootNoteMidi) / 12);
    const noteInOctave = ((targetMidi - baseMidiNote - rootNoteMidi) % 12 + 12) % 12;

    const closestInterval = intervals.reduce((closest, current) =>
      Math.abs(noteInOctave - current) < Math.abs(noteInOctave - closest) ? current : closest
    );

    const scaleDegreeIndex = intervals.indexOf(closestInterval);
    const finalMidiNote = baseMidiNote + rootNoteMidi + (octaveOffset * 12) + closestInterval + discreteTransposeSemitones;

    const color = midiNoteToHSL(finalMidiNote);

    const clampedMidiNote = Math.max(0, Math.min(127, finalMidiNote));
    const frequency = midiToFreq(clampedMidiNote);

    const totalScaleDegree = (octaveOffset * intervals.length) + scaleDegreeIndex;

    // The frequency returned here is always 12-TET with discrete semitone transposition
    return { scaleDegree: totalScaleDegree, frequency, color, midiNote: clampedMidiNote };
  }, []);

  const getLiveNoteProperties = useCallback((note) => {
    if (!note || !note.position) return note;

    const { xRotation, yRotation, zRotation, yTranslation } = structureTransform;

    const rx = xRotation * (Math.PI / 180);
    const ry = yRotation * (Math.PI / 180);
    const rz = zRotation * (Math.PI / 180);

    let p = { ...note.position };

    let p1 = { x: p.x, y: p.y * Math.cos(rx) - p.z * Math.sin(rx), z: p.y * Math.sin(rx) + p.z * Math.cos(rx) };
    let p2 = { x: p1.x * Math.cos(ry) + p1.z * Math.sin(ry), y: p1.y, z: -p1.x * Math.sin(ry) + p1.z * Math.cos(ry) };
    let transformedPosition = { x: p2.x * Math.cos(rz) - p2.y * Math.sin(rz), y: p2.x * Math.sin(rz) + p2.y * Math.cos(rz), z: p2.z };
    
    // Calculate the standard 12-TET note properties for visuals and MIDI.
    const { scaleDegree, frequency: standardFrequency, color, midiNote: standardMidiNote } = calculateNoteProps(transformedPosition.y, selectedScale, rootNote, yTranslation, yAxisMusicalScale);

    // --- NEW & CORRECTED TUNING LOGIC ---
    let tunedFrequency = standardFrequency; // Default to standard pitch.

    if (activeTuning !== '12-TET' && standardMidiNote >= 0 && standardMidiNote <= 127) { // Ensure valid MIDI note for pitch class calculation
        const tuningData = TUNING_SYSTEMS[activeTuning];
        if (tuningData && tuningData.pitches) {
            // Determine the pitch class (0-11) of the standard MIDI note.
            const pitchClass = standardMidiNote % 12;

            // Find the MIDI note number of the octave's root (C).
            const octaveRootMidi = standardMidiNote - pitchClass;
            // Calculate the frequency of that root C.
            const octaveRootFreq = midiToFreq(octaveRootMidi);

            // Get the cents deviation for this pitch class from the active tuning system.
            const centsInTuning = tuningData.pitches[pitchClass];

            // Calculate the final tuned frequency based on the octave root and the tuning's cents value.
            tunedFrequency = octaveRootFreq * Math.pow(2, centsInTuning / 1200);
        }
    }
    // --- END NEW TUNING LOGIC ---

    return { 
        ...note, 
        liveFrequency: standardFrequency, // Used for MIDI and as a fallback
        tunedFrequency: tunedFrequency, // Used for Web Audio playback
        liveColor: color, 
        liveScaleDegree: scaleDegree,
        liveXPosition: transformedPosition.x, // Expose transformed X position for panning
        liveZPosition: transformedPosition.z // Expose transformed Z position for panning
    };
  }, [calculateNoteProps, selectedScale, rootNote, structureTransform, yAxisMusicalScale, activeTuning]);

  const liveNotes = React.useMemo(() => {
    return notes.map(note => getLiveNoteProperties(note));
  }, [notes, getLiveNoteProperties]);

  const midiEngine = MidiEngine({
    notes: liveNotes,
    isPlaying: isScenePlaying && audioMode === 'midi',
    bpm, rhythm, onPlayingNotesChange: setPlayingNotes, selectedMidiOutput, midiChannel,
    isChordMode,
    arpeggioDelay,
    onNotePlayed: handleNotePlayed,
    playbackSequence, // Use playbackSequence for MidiEngine
    rhythmPattern,
    cycleLength,
    rhythm, // Add rhythm to midiEngine dependencies
    repeatMode,
    noteLength,
    isPanningEnabled,
    panningWidth, // Add panningWidth to midiEngine
  });

  // Set the default MIDI output when devices are first detected
  useEffect(() => {
    if (midiEngine.midiOutputs && midiEngine.midiOutputs.length > 0 && !selectedMidiOutput) {
      setSelectedMidiOutput(midiEngine.midiOutputs[0].id);
    }
  }, [midiEngine.midiOutputs, selectedMidiOutput]);

  const handleRhythmSettingsChange = useCallback((settings) => {
    if (settings.bpm !== undefined) {
      setBpm(settings.bpm);
    }
    if (settings.rhythm !== undefined) {
      setRhythm(settings.rhythm);
    }
  }, []);

  const handleChordPlay = useCallback(async () => {
    await initAudioContext(); // Moved here to ensure context is resumed on user interaction
    if (isLockedOut) {
      alert("Cannot play chord: User is locked out.");
      return;
    }

    if (audioMode === 'web-audio' && audioEngineRef.current && audioEngineRef.current.playSingleChord) {
      // FIXED: Explicitly tell the AudioEngine which sound source to use
      audioEngineRef.current.playSingleChord(liveNotes, soundSource);
    } else if (audioMode === 'midi' && midiEngine.currentOutput) {
      const noteDurationMs = ((60.0 / bpm) / rhythm) * 1000 * 0.9;

      liveNotes.forEach((note, index) => {
        const frequency = note.liveFrequency || note.frequency; // MIDI uses the 12-TET frequency
        if (!frequency) return;

        const noteStartTimeMs = index * arpeggioDelay;

        setTimeout(() => {
          const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
          const clampedMidiNote = Math.max(0, Math.min(127, midiNote));
          const velocity = typeof note.midiVelocity === 'number' ? note.midiVelocity : 100;
          const clampedVelocity = Math.max(0, Math.min(127, velocity));

          if (clampedVelocity === 0) return;

          const noteOnMessage = [0x90 | midiChannel, clampedMidiNote, clampedVelocity];
          midiEngine.currentOutput.send(noteOnMessage);

          setTimeout(() => {
            const noteOffMessage = [0x80 | midiChannel, clampedMidiNote, 0];
            midiEngine.currentOutput.send(noteOffMessage);
          }, noteDurationMs);
        }, noteStartTimeMs);
      });
    }
  }, [liveNotes, arpeggioDelay, audioMode, midiEngine.currentOutput, midiChannel, bpm, rhythm, soundSource, audioEngineRef, isLockedOut]); // Add isLockedOut to dependency array

  const generateRandomNotes = useCallback((count) => {
    return Array.from({ length: count }, () => {
      const position = {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 4, // Increased Y range for more variety
        z: (Math.random() - 0.5) * 6
      };
      const { frequency, color, midiNote } = calculateNoteProps(position.y, selectedScale, rootNote, 0, yAxisMusicalScale);
      const validFrequency = (frequency && isFinite(frequency) && frequency > 0) ? frequency : 440;
      return { position: position, frequency: validFrequency, color, radius: 0.4, midiVelocity: 80 + Math.floor(Math.random() * 47), rhythmSubdivision: rhythm, midiNote };
    });
  }, [calculateNoteProps, selectedScale, rootNote, yAxisMusicalScale, rhythm]);

  const initializeNotes = useCallback(async () => {
    // Prevent re-initialization if already busy
    if (isBusy.current) return;
    isBusy.current = true;

    setIsResetting(true);
    setIsInitializing(true);
    setIsNotesLoaded(false);
    setLineConnectionMode('mesh');

    try {
      // 1. Set initial visual and audio parameters
      setStructureTransform({
        yTranslation: 0, xRotation: 0, yRotation: 0, zRotation: 0,
        autoRotateX: true, autoRotateY: true, autoRotateZ: false,
        autoRotateSpeedX: 1, autoRotateSpeedY: 1, autoRotateSpeedZ: 1,
        autoTranspose: false, autoTransposeRange: 12, autoTransposeSpeed: 1,
      });

      const shape = SHAPE_DEFINITIONS['Tetrahedral'];
      if (!shape) throw new Error("Tetrahedral shape definition not found.");

      // 2. Generate notes for an OPTIMISTIC UI UPDATE
      const newNoteData = shape.positions.map((pos, index) => {
        const { frequency, color, midiNote } = calculateNoteProps(pos.y, selectedScale, rootNote, 0, yAxisMusicalScale);
        return {
          position: pos, frequency, color, radius: 0.4, midiVelocity: 80,
          rhythmSubdivision: rhythm, midiNote,
          id: `init_${Date.now()}_${index}` // Use temporary IDs for local state
        };
      });

      // 3. Update the UI IMMEDIATELY with the correct shape
      setNotes(sanitizeNotes(newNoteData));
      setSphereCount(shape.count);
      setCycleLength(shape.count);
      setRhythmPattern(Array(shape.count).fill(rhythm));
      setIsNotesLoaded(true);

      // 4. Perform database synchronization in the background
      await safeClearAllNotes();
      const notesToCreateForDb = newNoteData.map(({ id, ...rest }) => rest);
      const createdNotesFromDb = await Note.bulkCreate(notesToCreateForDb);
      // Reconcile with real DB IDs
      setNotes(sanitizeNotes(reconcileNotesWithDbIds(newNoteData, createdNotesFromDb)));

    } catch (error) {
      console.error('Error initializing notes:', error);
      setNotes([]); // On error, start with an empty scene
    } finally {
      setIsResetting(false);
      setIsInitializing(false);
      isBusy.current = false;
    }
  }, [calculateNoteProps, selectedScale, rootNote, yAxisMusicalScale, rhythm]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // **FIXED**: Simplified to only fetch the user object.
        // The `plan` property on this object is now the source of truth.
        const currentUser = await User.me();
        setIsAuthenticated(true);
        userRef.current = currentUser;
        
        console.log('User loaded in Synthesizer:', currentUser.email, 'with plan:', currentUser.plan);
        
        // UPDATED: Set initial note count to cumulative total
        setNoteCount(currentUser.note_count || 0);
        
        const plan = currentUser.plan || 'free';
        // UPDATED: Check if user should be locked out at 5000 notes for free users
        if ((plan === 'free' || plan === 'cancelled') && (currentUser.note_count || 0) >= 5000) {
          setIsLockedOut(true);
          console.log('User is locked out on initial load - plan:', plan, 'notes:', currentUser.note_count);
        }
        
        initializeNotes();
      } catch (error) {
        console.warn("User not authenticated:", error);
        setIsAuthenticated(false);
        initializeNotes(); // Initialize with default notes even if not logged in
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load sequences and presets on mount, and listen for preset updates
  const loadSequences = useCallback(async () => {
    try {
      const sequenceList = await Sequence.list('-updated_date');
      setSequences(sequenceList);
    } catch (error) { console.error('Failed to load sequences:', error); }
  }, []);

  const loadPresets = useCallback(async () => {
    try {
      const presetList = await Preset.list();
      setPresets(presetList);
    } catch (error) { console.error('Failed to load presets:', error); }
  }, []);

  useEffect(() => {
    // Only load sequences and presets if authenticated
    if (isAuthenticated) {
      loadSequences();
      loadPresets();

      const handlePresetUpdate = () => loadPresets();
      window.addEventListener('presetSaved', handlePresetUpdate);
      return () => {
        window.removeEventListener('presetSaved', handlePresetUpdate);
      };
    }
  }, [isAuthenticated, loadSequences, loadPresets]);

  useEffect(() => {
    presetMap.current = new Map(presets.map(p => [p.id, p.name]));
  }, [presets]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setNotes(currentNotes => {
      const updatedNotes = currentNotes.map(note => {
        // Recalculate note properties to update frequency, color, etc. based on scale/root
        const { scaleDegree, frequency, color, midiNote } = calculateNoteProps(note.position.y, selectedScale, rootNote, 0, yAxisMusicalScale);
        return { ...note, scaleDegree, frequency, color, midiNote };
      });
      return sanitizeNotes(updatedNotes);
    });
  }, [selectedScale, rootNote, calculateNoteProps, yAxisMusicalScale]);

  const handleScenePlayPause = async () => {
    await initAudioContext(); // Moved here to ensure context is resumed on user interaction
    if (isLockedOut) {
      alert("Cannot play: User is locked out.");
      return;
    }
    const newIsPlaying = !isScenePlaying || isSequencerPlaying;

    if (newIsPlaying) {
      setIsSequencerPlaying(false);
    }
    setIsScenePlaying(newIsPlaying);
  };

  const handleSceneStop = useCallback(() => {
    setIsScenePlaying(false);
    setIsSequencerPlaying(false);
    setPlayingNotes([]);
  }, [setIsScenePlaying, setIsSequencerPlaying, setPlayingNotes]);

  const handleSequencerPlayPause = useCallback(async () => {
    await initAudioContext(); // Moved here to ensure context is resumed on user interaction
    if (isLockedOut) {
      alert("Cannot play sequencer: User is locked out.");
      return;
    }
    const newIsSequencerPlaying = !isSequencerPlaying;

    setIsSequencerPlaying(newIsSequencerPlaying);
    setIsScenePlaying(newIsSequencerPlaying);
  }, [isLockedOut, isSequencerPlaying, setIsScenePlaying, setIsSequencerPlaying]);

  useEffect(() => {
    if (isSequencerPlaying && isScenePlaying) {
    }
  }, [notes, isSequencerPlaying, isScenePlaying]);

  // Add keyboard shortcuts for playback
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore shortcuts if the user is typing in an input field
      // This is a common pattern for accessible shortcuts to prevent interference with text input
      if (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'p':
          event.preventDefault(); // Prevent default browser behavior (e.g., print)
          handleSequencerPlayPause();
          break;
        case 'o':
          event.preventDefault(); // Prevent default browser behavior
          handleSceneStop();
          break;
        case 'k':
          event.preventDefault(); // Prevent default browser behavior
          handleChordPlay();
          break;
        case 'g':
          event.preventDefault(); // Prevent default browser behavior
          // Trigger guitar chord apply (assuming this is handled by an external event listener)
          window.dispatchEvent(new CustomEvent('triggerGuitarChord'));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSequencerPlayPause, handleSceneStop, handleChordPlay]);


  const handleReset = useCallback(async () => {
    const now = performance.now();
    if (now - resetLastClickTime.current < RESET_DEBOUNCE_TIME) return;
    resetLastClickTime.current = now;

    if (isLockedOut) {
      alert("Cannot reset: User is locked out.");
      return;
    }
    
    if (isBusy.current) return; // Prevent action if another is in progress
    isBusy.current = true; // Lock immediately
    setIsResetting(true);

    setLineConnectionMode('chain'); // Resetting creates a sequential chain

    // 1. Generate local notes with temporary IDs for an instant UI update
    const resetNotes = Array.from({ length: 4 }, (_, index) => {
      const position = {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 6
      };
      const { frequency, color, midiNote } = calculateNoteProps(position.y, selectedScale, rootNote, 0, yAxisMusicalScale);
      const validFrequency = (frequency && isFinite(frequency) && frequency > 0) ? frequency : 440;

      return {
        position: position,
        frequency: validFrequency,
        color,
        radius: 0.4,
        midiVelocity: 80 + Math.floor(Math.random() * 47),
        rhythmSubdivision: rhythm, // **FIXED**: Use current rhythm instead of 1
        midiNote,
        id: `reset_${Date.now()}_${index}` // Temporary ID
      };
    });

    // 2. Update UI state immediately. This is the "optimistic" update.
    setNotes(sanitizeNotes(resetNotes));
    setSphereCount(4);
    setCycleLength(4);
    setRhythmPattern(Array(4).fill(rhythm)); // **FIXED**: Use current rhythm
    setCameraY(-1.1);
    setYAxisMusicalScale(1.0);
    if (resetCameraRef.current) { resetCameraRef.current(); }

    // 3. Sync with database in the background without blocking the UI.
    setTimeout(async () => {
      try {
        await safeClearAllNotes();
        // Create notes in DB without their temporary IDs
        const notesToCreate = resetNotes.map(({ id, ...rest }) => rest);
        const createdNotesFromDb = await Note.bulkCreate(notesToCreate);
        setNotes(sanitizeNotes(reconcileNotesWithDbIds(resetNotes, createdNotesFromDb))); // Reconcile here
      } catch (error) {
        console.error("Background reset sync failed:", error);
      } finally {
        isBusy.current = false; // Unlock after sync is complete
        setIsResetting(false);
      }
    }, 50);
  }, [calculateNoteProps, selectedScale, rootNote, yAxisMusicalScale, rhythm, isLockedOut]);

  const handleSavePreset = async (presetName) => {
    if (isLockedOut) {
      alert("Cannot save preset: User is locked out.");
      return;
    }
    if (!presetName) return;
    const notesToSave = notes.map(n => {
      const { id, liveFrequency, tunedFrequency, liveColor, liveScaleDegree, created_date, updated_date, liveXPosition, liveZPosition, ...rest } = n;
      return rest;
    });

    const configuration = {
      masterVolume, bpm, rhythm, structureTransform, cameraY, yAxisMusicalScale, sphereBrightness,
      selectedScale, rootNote, sphereCount, selectedBackground, waveform, envelope, eq,
      audioMode, selectedMidiOutput, midiChannel, rhythmPattern, cycleLength,
      repeatMode,
      noteLength,
      soundSource,
      activeTuning,
      efx, // efx now includes reverbDry and reverbWet
      isPanningEnabled,
      panningWidth,
    };

    try {
      await Preset.create({ name: presetName, configuration, notes: notesToSave });
      window.dispatchEvent(new CustomEvent('presetSaved'));
    } catch (error) {
      console.error("Failed to save preset:", error);
    }
  };

  const handleLoadPreset = async (preset) => {
    if (isBusy.current) return;
    isBusy.current = true; // ACQUIRE LOCK
    setLineConnectionMode('mesh');

    Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    debounceTimers.current = {};
    clearTimeout(velocityFlushTimer.current); // Clear any pending velocity updates
    clearTimeout(rhythmFlushTimer.current); // Clear any pending rhythm updates

    try {
      const { configuration, notes: presetNotes } = preset;
      setMasterVolume(configuration.masterVolume);
      setBpm(configuration.bpm);
      setRhythm(configuration.rhythm);
      setStructureTransform(configuration.structureTransform || { yTranslation: 0, xRotation: 0, yRotation: 0, zRotation: 0, autoRotateX: false, autoRotateY: false, autoRotateZ: false, autoRotateSpeedX: 1, autoRotateSpeedY: 1, autoRotateSpeedZ: 1, autoTranspose: false, autoTransposeRange: 12, autoTransposeSpeed: 1 });
      setCameraY(configuration.cameraY);
      setYAxisMusicalScale(configuration.yAxisMusicalScale || 1.0);
      setSphereBrightness(configuration.sphereBrightness);
      setSelectedScale(configuration.selectedScale);
      setRootNote(configuration.rootNote);
      setSphereCount(configuration.sphereCount);
      setSelectedBackground(configuration.selectedBackground);
      setWaveform(configuration.waveform);
      setEnvelope(configuration.envelope);
      setEq(configuration.eq ? {
        lowGain: configuration.eq.lowGain || 0,
        lowFreq: configuration.eq.lowFreq || 200,
        lowFilterType: configuration.eq.lowFilterType || 'lowshelf', // Load or default
        midGain: configuration.eq.midGain || 0,
        midFreq: configuration.eq.midFreq || 1000,
        midQ: configuration.eq.midQ || 1,
        highGain: configuration.eq.highGain || 0,
        highFreq: configuration.eq.highFreq || 5000,
        highFilterType: configuration.eq.highFilterType || 'highshelf' // Load or default
      } : {
        lowGain: 0,
        lowFreq: 200,
        lowFilterType: 'lowshelf',
        midGain: 0,
        midFreq: 1000,
        midQ: 1,
        highGain: 0,
        highFreq: 5000,
        highFilterType: 'highshelf'
      });
      setAudioMode(configuration.audioMode || 'web-audio');
      setSelectedMidiOutput(configuration.selectedMidiOutput || null);
      setMidiChannel(configuration.midiChannel || 0);
      setRhythmPattern(configuration.rhythmPattern || Array(configuration.cycleLength || 4).fill(configuration.rhythm || 1));
      setCycleLength(configuration.cycleLength || 4);
      setRepeatMode(configuration.repeatMode || 'off');
      setNoteLength(configuration.noteLength || 1.0);
      // Load simplified sound source state
      setSoundSource(configuration.soundSource || 'sampler');
      setActiveTuning(configuration.activeTuning || '12-TET'); // Load active tuning
      setEfx(configuration.efx ? { // Load EFX settings
        delayOn: configuration.efx.delayOn ?? false,
        delayTime: configuration.efx.delayTime ?? 0.5,
        delayFeedback: configuration.efx.delayFeedback ?? 0.4,
        delayMix: configuration.efx.delayMix ?? 0.35,
        reverbOn: configuration.efx.reverbOn ?? false,
        reverbDry: configuration.efx.reverbDry ?? 0.8, // Load or default
        reverbWet: configuration.efx.reverbWet ?? 0.35, // Load or default
        reverbSize: configuration.efx.reverbSize ?? 2.5,
        reverbDecay: configuration.efx.reverbDecay ?? 2.0,
      } : {
        delayOn: false,
        delayTime: 0.5,
        delayFeedback: 0.4,
        delayMix: 0.35,
        reverbOn: false,
        reverbDry: 0.8, // Default if not in preset
        reverbWet: 0.35, // Default if not in preset
        reverbSize: 2.5,
        reverbDecay: 2.0,
      });
      setIsPanningEnabled(configuration.isPanningEnabled ?? true);
      setPanningWidth(configuration.panningWidth ?? 100); // Load panning width

      const notesToCreateForDb = presetNotes.map(({ id, created_date, updated_date, ...rest }) => rest);

      // Delete all existing notes from the database
      await safeClearAllNotes();

      // Create new notes from the preset
      if (notesToCreateForDb.length > 0) {
        const createdNotes = await Note.bulkCreate(notesToCreateForDb);
        setNotes(sanitizeNotes(createdNotes));
        setSphereCount(createdNotes.length); // Update sphere count to match preset notes
        setCycleLength(createdNotes.length);
        setRhythmPattern(Array(createdNotes.length).fill(configuration.rhythm || 1)); // Use preset rhythm
      } else {
        setNotes([]);
        setSphereCount(0); // If preset has no notes, set to 0
        setCycleLength(0);
        setRhythmPattern([]);
      }
    } catch (error) {
      console.error("Failed to load preset:", error);
      // Attempt to re-sync notes with current DB state if an occurs
      const currentDbNotes = await Note.list();
      setNotes(sanitizeNotes(currentDbNotes));
      setSphereCount(currentDbNotes.length);
      setCycleLength(currentDbNotes.length);
      setRhythmPattern(Array(currentDbNotes.length).fill(rhythm)); // Fallback to current rhythm if error
    } finally {
      isBusy.current = false; // RELEASE LOCK
    }
  };

  const handleCreateNoteSequence = useCallback((noteDataOrArray, resetSequence = true, preserveRhythmPattern = false) => {
    if (isLockedOut) {
      alert("Cannot create note sequence: User is locked out.");
      return;
    }

    // --- ROBUSTNESS FIX: VERSIONING ---
    // Increment the version for this specific request.
    const currentRequestVersion = ++chordRequestVersion.current;
    // --- END FIX ---

    // Cancel any pending DB sync from a previous rapid click
    if (noteSequenceTimeoutRef.current) {
      clearTimeout(noteSequenceTimeoutRef.current);
    }

    setLineConnectionMode('chain'); // Scales and Chords always create sequential chains
    const notesToProcess = Array.isArray(noteDataOrArray) ? noteDataOrArray : [noteDataOrArray];

    // Use the ref to get the most up-to-date 'notes' state before this operation.
    const previousNotes = notesRef.current;

    // Store the current rhythm pattern if we want to preserve it
    const currentPattern = preserveRhythmPattern ? rhythmPattern : null;

    const finalNotes = notesToProcess.map((noteData, index) => {
      const clampedMidi = Math.max(0, Math.min(127, noteData.midiNote));
      const yPos = (clampedMidi - 60) / (6 * (yAxisMusicalScale || 1));
      
      const { frequency, color, midiNote } = calculateNoteProps(yPos, 'Chromatic', rootNote, 0, yAxisMusicalScale);

      // Always try to inherit velocity from the note at the same index in the previous sequence.
      // If no note existed at that index (e.g., adding more notes), default to 100.
      const preservedVelocity = previousNotes[index]?.midiVelocity || 100;
      
      // Use preserved rhythm pattern if available, otherwise use inherited or default rhythm
      const rhythmToUse = preserveRhythmPattern && currentPattern && currentPattern[index] !== undefined
        ? currentPattern[index]
        : (previousNotes[index]?.rhythmSubdivision || rhythm);
      
      return {
        position: { ...noteData.position, y: yPos },
        frequency, color, radius: 0.4, 
        midiVelocity: preservedVelocity, // Use the inherited or default velocity
        rhythmSubdivision: rhythmToUse, // Use preserved or inherited rhythm
        midiNote, id: `scale_${Date.now()}_${index}`
      };
    });

    // Optimistic UI Update (BATCHED)
    if (resetSequence) {
      // Start new sequence - single update with all new state
      const newCount = finalNotes.length;
      setNotes(sanitizeNotes(finalNotes));
      setCycleLength(newCount);
      
      // Only reset rhythm pattern if we're not preserving it
      if (!preserveRhythmPattern) {
        setRhythmPattern(Array(newCount).fill(rhythm));
      } else if (currentPattern) {
        // Extend or trim the current pattern to match the new note count
        const adjustedPattern = Array(newCount).fill(rhythm).map((defaultRhythm, index) => 
          currentPattern[index] !== undefined ? currentPattern[index] : defaultRhythm
        );
        setRhythmPattern(adjustedPattern);
      }
    } else {
      // Add to existing sequence - single batched update
      setNotes(prevNotes => {
        const combined = [...prevNotes, ...finalNotes];
        const limited = combined.slice(0, sphereCount);
        const newCount = limited.length;

        // Batch these updates with the notes update using React's automatic batching
        setCycleLength(newCount);
        if (!preserveRhythmPattern) {
          setRhythmPattern(Array(newCount).fill(rhythm));
        }

        return sanitizeNotes(limited);
      });
    }

    // Debounced and Version-Checked Background DB Sync
    noteSequenceTimeoutRef.current = setTimeout(async () => {
      // At execution time, check if this is still the latest request.
      if (chordRequestVersion.current !== currentRequestVersion) {
        return; // Abort if this is a stale request.
      }

      if (isBusy.current) {
        console.warn("Note sequence creation skipped: another operation is in progress.");
        return;
      }
      isBusy.current = true; // ACQUIRE LOCK for this operation
      try {
        const notesToCreateForDb = finalNotes.map(({ id, ...rest }) => rest);

        if (resetSequence) {
          await safeClearAllNotes();
          const createdNotesFromDb = await Note.bulkCreate(notesToCreateForDb);
          // Final check before setting state from DB result.
          if (chordRequestVersion.current === currentRequestVersion) {
            setNotes(sanitizeNotes(reconcileNotesWithDbIds(finalNotes, createdNotesFromDb)));
          }
        } else {
          const currentDbNotes = await Note.list();
          const canAdd = Math.max(0, sphereCount - currentDbNotes.length);
          if (canAdd > 0) {
            await Note.bulkCreate(notesToCreateForDb.slice(0, canAdd));
          }
        }
      } catch (error) {
        console.error("Background scales sync failed:", error);
      } finally {
        isBusy.current = false; // RELEASE LOCK
        noteSequenceTimeoutRef.current = null; // Clear the timeout reference after execution
      }
    }, 250); // Increased delay from 150ms to 250ms

  }, [calculateNoteProps, rootNote, yAxisMusicalScale, sphereCount, rhythm, rhythmPattern, isLockedOut]);

  const handleShapeChange = useCallback((shapeName) => {
    if (isLockedOut) {
      alert("Cannot change molecular shape: User is locked out.");
      return;
    }
    
    if (isBusy.current) return; // Prevent action if another is in progress
    isBusy.current = true; // Lock immediately
    setProcessingShape(shapeName);

    // Defer heavy processing to the next frame to allow the UI to respond to the click first
    requestAnimationFrame(() => {
      setLineConnectionMode('mesh'); // Molecular Geometry uses a fully connected mesh
      const shape = SHAPE_DEFINITIONS[shapeName];
      if (!shape) {
        console.error("Shape not found:", shapeName);
        isBusy.current = false; // Unlock if shape is not found
        setProcessingShape(null); // Clear loading state
        return;
      }

      const newNoteData = shape.positions.map((pos, index) => {
        const { frequency, color, midiNote } = calculateNoteProps(pos.y, selectedScale, rootNote, 0, yAxisMusicalScale);
        return {
          position: pos, frequency, color, radius: 0.4, midiVelocity: 80,
          rhythmSubdivision: rhythm, midiNote,
          id: `shape_${Date.now()}_${index}`
        };
      });

      // Immediate UI update
      setNotes(sanitizeNotes(newNoteData));
      setSphereCount(shape.count);
      setCycleLength(shape.count);
      setRhythmPattern(Array(shape.count).fill(rhythm));
      setCameraY(-1.1); // Reset camera Y for new shape perspective

      // Background DB sync
      setTimeout(async () => {
        try {
          await safeClearAllNotes();
          const notesToCreate = newNoteData.map(({ id, ...rest }) => rest);
          const createdNotesFromDb = await Note.bulkCreate(notesToCreate);
          // Reconcile with real DB IDs
          setNotes(sanitizeNotes(reconcileNotesWithDbIds(newNoteData, createdNotesFromDb)));
        } catch (err) {
          console.error('Error syncing shape change:', err);
          const currentDbNotes = await Note.list();
          setNotes(sanitizeNotes(currentDbNotes));
          setSphereCount(currentDbNotes.length);
          setCycleLength(currentDbNotes.length);
          setRhythmPattern(Array(currentDbNotes.length).fill(rhythm));
        } finally {
          isBusy.current = false; // Unlock after sync is complete
          setProcessingShape(null);
        }
      }, 50);
    });
  }, [calculateNoteProps, selectedScale, rootNote, yAxisMusicalScale, rhythm, isLockedOut]);

  const flushVelocityUpdates = useCallback(async () => {
    if (isBusy.current || Object.keys(velocityUpdateQueue.current).length === 0) return;

    const updatesToProcess = { ...velocityUpdateQueue.current };
    velocityUpdateQueue.current = {}; // Clear queue immediately to prevent race conditions

    // Use a general busy flag to prevent other major operations
    isBusy.current = true;
    try {
      // STRENGTHENED validation: check if notes still exist before processing updates
      const currentNotesSnapshot = notesRef.current;
      const validUpdates = {};
      
      Object.entries(updatesToProcess).forEach(([noteId, payload]) => {
        // More rigorous validation
        if (noteId && 
            typeof noteId === 'string' && 
            noteId.length >= 20 &&
            !String(noteId).startsWith('temp_') && 
            !String(noteId).startsWith('reset_') && 
            !String(noteId).startsWith('shape_') && 
            !String(noteId).startsWith('scale_')) {
          
          const noteStillExists = currentNotesSnapshot.some(note => note.id === noteId);
          if (noteStillExists) {
            validUpdates[noteId] = payload;
          } else {
            console.log(`Note ${noteId} no longer exists, skipping velocity update`);
          }
        }
      });

      // Process only valid updates
      const updatePromises = Object.entries(validUpdates).map(async ([noteId, payload]) => {
        try {
          await Note.update(noteId, payload);
        } catch (error) {
          const wasHandled = handleNoteUpdateError(error, `batch velocity update ${noteId}`);
          if (!wasHandled) {
            console.error(`Unhandled error updating note velocity ${noteId}:`, error);
          }
        }
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error during batch velocity update:", error);
    } finally {
      isBusy.current = false;
    }
  }, []);

  const handleSphereCountChange = useCallback(async (newCount) => {
    if (isLockedOut) {
      alert("Cannot change sphere count: User is locked out.");
      return;
    }
    const validCount = Math.max(1, Math.min(MAX_NOTES, Math.round(newCount)));
    
    const timerKey = 'sphereCount';
    if (debounceTimers.current[timerKey]) { clearTimeout(debounceTimers.current[timerKey]); }

    setLineConnectionMode('chain');

    // --- INSTANT & COMPLETE UI UPDATE ---
    setSphereCount(validCount);
    setCycleLength(validCount);
    setRhythmPattern(Array(validCount).fill(rhythm));

    setNotes(currentNotes => {
      const currentLocalCount = currentNotes.length;
      if (validCount > currentLocalCount) {
        const notesToAddCount = validCount - currentLocalCount;
        const newNoteData = generateRandomNotes(notesToAddCount).map((note, index) => ({
          ...note,
          rhythmSubdivision: rhythm,
          id: `temp_${Date.now()}_${index}`
        }));
        return sanitizeNotes([...currentNotes, ...newNoteData]);
      } else if (validCount < currentLocalCount) {
        return currentNotes.slice(0, validCount);
      }
      return currentNotes;
    });

    // --- RE-ARCHITECTED DEBOUNCED DB SYNC ---
    debounceTimers.current[timerKey] = setTimeout(async () => {
      // Check the lock AT THE TIME OF EXECUTION.
      if (isBusy.current) {
        console.warn("Sphere count DB update skipped: another operation is in progress.");
        return;
      }
      isBusy.current = true; // ACQUIRE LOCK for this operation
      try {
        const dbNotes = await Note.list();
        const dbCount = dbNotes.length;

        if (validCount > dbCount) {
          const notesToAddCount = validCount - dbCount;
          const newNoteData = generateRandomNotes(notesToAddCount).map(note => ({ ...note, rhythmSubdivision: rhythm }));
          if (newNoteData.length > 0) {
            const createdNotesFromDb = await Note.bulkCreate(newNoteData);
            setNotes(prevNotes => sanitizeNotes([...prevNotes.filter(n => !n.id.startsWith('temp_')), ...createdNotesFromDb]));
          }
        } else if (validCount < dbCount) {
          const notesToRemove = dbNotes.slice(validCount);
          // Use Promise.allSettled for batched deletion within the lock
          await Promise.allSettled(notesToRemove.map(note => safeDeleteNote(note.id)));
          // After deletion, re-sync notes to accurately reflect DB state
          const freshNotes = await Note.list('-created_date');
          setNotes(sanitizeNotes(freshNotes));
        }
      } catch (error) {
        console.error("Error adjusting sphere count:", error);
        // Fallback to re-sync state on error
        const freshNotes = await Note.list('-created_date');
        setNotes(sanitizeNotes(freshNotes));
        const finalCount = freshNotes.length;
        setSphereCount(finalCount);
        setCycleLength(finalCount);
        setRhythmPattern(Array(finalCount).fill(rhythm));
      } finally {
        delete debounceTimers.current[timerKey];
        isBusy.current = false; // RELEASE LOCK
      }
    }, 400); // Slightly increased debounce time for safety
  }, [generateRandomNotes, MAX_NOTES, rhythm, isLockedOut]);

  const handleNotePositionChange = useCallback((index, newPosition) => {
    // Local state updates for immediate feedback, even if DB is busy with another operation.
    // The actual DB call is debounced and checks isBusy.current before proceeding.
    setNotes(currentNotes => {
      const noteToUpdate = currentNotes[index];
      if (!noteToUpdate) return currentNotes;

      const { scaleDegree, frequency, color, midiNote, liveXPosition, liveZPosition } = calculateNoteProps(newPosition.y, selectedScale, rootNote, 0, yAxisMusicalScale);
      const updatedMusicalProps = { scaleDegree, frequency, color, midiNote, liveXPosition, liveZPosition }; // Include midiNote, liveXPosition and liveZPosition

      const updatedNotes = [...currentNotes];
      updatedNotes[index] = { ...updatedNotes[index], position: newPosition, ...updatedMusicalProps };

      const noteId = noteToUpdate.id;
      // STRENGTHENED validation: check if note still exists in current notes array AND has valid ID
      if (noteId && 
          typeof noteId === 'string' && 
          noteId.length >= 20 &&
          !String(noteId).startsWith('temp_') && 
          !String(noteId).startsWith('reset_') && 
          !String(noteId).startsWith('shape_') && 
          !String(noteId).startsWith('scale_') && 
          // Additional check: ensure note still exists in current state
          updatedNotes.some(note => note.id === noteId)) {
        
        const timerKey = `pos_${noteId}`;
        if (debounceTimers.current[timerKey]) { 
          clearTimeout(debounceTimers.current[timerKey]); 
        }
        
        debounceTimers.current[timerKey] = setTimeout(async () => {
          try {
            // Ensure we don't proceed with DB write if a major operation (like reset) started while debouncing
            if (isBusy.current) return;
            
            // Double-check note still exists before updating
            const currentNotesSnapshot = notesRef.current;
            const noteStillExists = currentNotesSnapshot.some(note => note.id === noteId);
            
            if (!noteStillExists) {
              console.log(`Note ${noteId} no longer exists, skipping position update`);
              return;
            }
            
            await Note.update(noteId, { position: newPosition, ...updatedMusicalProps });
          } catch (error) {
            const wasHandled = handleNoteUpdateError(error, `note position update ${noteId}`);
            if (!wasHandled) {
              console.error(`Unhandled error updating note position ${noteId}:`, error);
            }
          } finally {
            delete debounceTimers.current[timerKey];
          }
        }, 400);
      }
      return updatedNotes;
    });
  }, [calculateNoteProps, selectedScale, rootNote, yAxisMusicalScale]);

  const handleVelocityChange = useCallback((index, newVelocity) => {
    // Perform an optimistic UI update for instant feedback
    setNotes(currentNotes => {
      const updatedNotes = [...currentNotes];
      const noteToUpdate = updatedNotes[index];
      
      if (!noteToUpdate) return currentNotes;
      
      updatedNotes[index] = { ...noteToUpdate, midiVelocity: newVelocity };
      
      const noteId = noteToUpdate.id;
      // STRENGTHENED validation: check if note still exists in current notes array AND has valid ID
      if (noteId && 
          typeof noteId === 'string' && 
          noteId.length >= 20 &&
          !String(noteId).startsWith('temp_') && 
          !String(noteId).startsWith('reset_') && 
          !String(noteId).startsWith('shape_') && 
          !String(noteId).startsWith('scale_') && 
          // Additional check: ensure note still exists in current state
          updatedNotes.some(note => note.id === noteId)) {
        
        // Add the change to a queue instead of sending it immediately
        velocityUpdateQueue.current[noteId] = { midiVelocity: newVelocity };

        // Debounce the function that will flush the queue to the database
        if (velocityFlushTimer.current) clearTimeout(velocityFlushTimer.current);
        velocityFlushTimer.current = setTimeout(flushVelocityUpdates, 500); // Wait 500ms after the last change
      }
      
      return updatedNotes;
    });
  }, [flushVelocityUpdates]);

  const handleNoteRhythmChange = useCallback((index, newRhythm) => {
    // Perform an optimistic UI update for instant feedback
    setNotes(currentNotes => {
      const updatedNotes = [...currentNotes];
      const noteToUpdate = updatedNotes[index];
      
      if (!noteToUpdate) return currentNotes;
      
      updatedNotes[index] = { ...noteToUpdate, rhythmSubdivision: newRhythm };
      
      const noteId = noteToUpdate.id;
      // Re-using robust validation to ensure we only update real, existing notes
      if (noteId && 
          typeof noteId === 'string' && 
          noteId.length >= 20 &&
          !String(noteId).startsWith('temp_') && 
          !String(noteId).startsWith('reset_') && 
          !String(noteId).startsWith('shape_') && 
          !String(noteId).startsWith('scale_') && 
          updatedNotes.some(note => note.id === noteId)) {
        
        // Add the change to the queue instead of sending it immediately
        rhythmUpdateQueue.current[noteId] = { rhythmSubdivision: newRhythm };

        // Debounce the function that will flush the queue to the database
        if (rhythmFlushTimer.current) clearTimeout(rhythmFlushTimer.current);
        rhythmFlushTimer.current = setTimeout(flushRhythmUpdates, 500); // Wait 500ms after the last change
      }
      
      return updatedNotes;
    });
  }, [flushRhythmUpdates]);

  const handleResetCamera = () => {
    setCameraY(-1.1);
    setYAxisMusicalScale(1.0);

    setStructureTransform({
      yTranslation: 0,
      xRotation: 0,
      yRotation: 0,
      zRotation: 0,
      autoRotateX: false,
      autoRotateY: false,
      autoRotateZ: false,
      autoRotateSpeedX: 1,
      autoRotateSpeedY: 1,
      autoRotateSpeedZ: 1,
      autoTranspose: false,
      autoTransposeRange: 12,
      autoTransposeSpeed: 1,
    });

    if (resetCameraRef.current) { resetCameraRef.current(); }
  };

  const handleMidiOutputChange = (outputId) => {
    setSelectedMidiOutput(outputId);
    if (outputId) {
      setAudioMode('midi');
    } else {
      setAudioMode('web-audio');
    }
  };

  const handleMoodSettingsChange = (moodSettings) => {
    // These controls are already disabled by their respective panels if isLockedOut
    setBpm(moodSettings.bpm);
    setRhythm(moodSettings.rhythm);
    setSelectedScale(moodSettings.selectedScale);
    setRootNote(moodSettings.rootNote);

    handleSphereCountChange(moodSettings.sphereCount);

    setStructureTransform({
      yTranslation: moodSettings.yTranslation,
      xRotation: moodSettings.xRotation,
      yRotation: moodSettings.yRotation,
      zRotation: moodSettings.zRotation,
      autoRotateX: moodSettings.autoRotateX,
      autoRotateY: moodSettings.autoRotateY,
      autoRotateZ: moodSettings.autoRotateZ,
      autoRotateSpeedX: moodSettings.autoRotateSpeedX,
      autoRotateSpeedY: moodSettings.autoRotateSpeedY,
      autoRotateSpeedZ: moodSettings.autoRotateSpeedZ,
      autoTranspose: moodSettings.autoTranspose,
      autoTransposeRange: moodSettings.autoTransposeRange,
      autoTransposeSpeed: moodSettings.autoTransposeSpeed,
    });

    setWaveform(moodSettings.waveform);
    setEnvelope(moodSettings.envelope);
    setIsChordMode(moodSettings.isChordMode);
    setArpeggioDelay(moodSettings.arpeggioDelay);

    setSphereBrightness(moodSettings.sphereBrightness);
    setSelectedBackground(moodSettings.selectedBackground);

    if (moodSettings.rhythmPattern) {
      setRhythmPattern(moodSettings.rhythmPattern);
    }
    if (moodSettings.cycleLength) {
      setCycleLength(moodSettings.cycleLength);
    }
    if (moodSettings.repeatMode !== undefined) {
      setRepeatMode(moodSettings.repeatMode);
    }
  };

  const handleTuningChange = (newTuning) => {
    // Set the active tuning regardless
    setActiveTuning(newTuning);

    // Automatically set scale to Chromatic ONLY on the first application of a non-standard tuning
    if (newTuning !== '12-TET' && !hasTuningSetChromatic.current) {
      setSelectedScale('Chromatic');
      hasTuningSetChromatic.current = true;
    }
  };

  const starfieldStyles = `
    @keyframes animStar {
      from { transform: translateY(0px); }
      to { transform: translateY(-2000px); }
    }
    @keyframes animStar2 {
      from { transform: translateY(0px); }
      to { transform: translateY(-4000px); }
    }
    .star-layer {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      display: block;
      pointer-events: none;
      overflow: hidden;
      z-index: 0;
    }
    .star-layer > div {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    .star-layer::after {
        content: '';
        position: absolute;
        top: 50%;
        left: -50%;
        width: 200vw;
        height: 200px;
        background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.03) 30%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.03) 70%, transparent 100%);
        border-radius: 50%;
        transform: translateY(-50%) rotate(25deg);
        filter: blur(25px);
        opacity: 0.7;
    }
    #stars1 {
      height: 1px; width: 1px; background: transparent; border-radius: 50%;
      box-shadow: 796px 1630px #FFF,1269px 748px #FFF,326px 1238px #FFF,1485px 1297px #FFF,1156px 675px #FFF,1374px 1473px #FFF,811px 1868px #FFF,153px 1801px #FFF,1493px 899px #FFF,1416px 197px #FFF,34px 1735px #FFF,608px 843px #FFF,178px 104px #FFF,1024px 1017px #FFF,184px 1857px #FFF,121px 1239px #FFF,1097px 1583px #FFF,882px 1477px #FFF,1794px 310px #FFF,246px 1436px #FFF,1824px 899px #FFF,1735px 1416px #FFF,999px 34px #FFF,843px 1735px #FFF,104px 608px #FFF,1017px 178px #FFF,1857px 1024px #FFF,1239px 184px #FFF,1583px 121px #FFF,1477px 1097px #FFF,310px 882px #FFF,1436px 1794px #FFF,500px 500px #FFF,1500px 1500px #FFF,200px 1800px #FFF,1800px 200px #FFF,950px 1050px #FFF,1050px 950px #FFF,333px 666px #FFF,1333px 1666px #FFF,431px 962px #FFF,1285px 127px #FFF,1176px 1547px #FFF,48px 104px #FFF,1579px 233px #FFF,887px 921px #FFF,171px 1319px #FFF,1458px 958px #FFF,1250px 1195px #FFF,1802px 1357px #FFF,618px 456px #FFF,1588px 1080px #FFF,1292px 1550px #FFF,101px 1139px #FFF,93px 1389px #FFF,1399px 299px #FFF,1412px 1341px #FFF,1529px 1589px #FFF,1786px 83px #FFF,1102px 1832px #FFF,1184px 1792px #FFF,373px 1606px #FFF,1935px 1146px #FFF,1105px 1739px #FFF,1218px 25px #FFF,173px 880px #FFF,1276px 1205px #FFF,1498px 1020px #FFF,1294px 1860px #FFF,1738px 1362px #FFF,1486px 1888px #FFF;
      animation: animStar 150s linear infinite;
    }
    #stars2 {
      height: 2px; width: 2px; background: transparent; border-radius: 50%;
      box-shadow: 1729px 127px #FFF,1326px 1055px #FFF,1238px 1092px #FFF,135px 1008px #FFF,1114px 1814px #FFF,1421px 1629px #FFF,1099px 1318px #FFF,1506px 1098px #FFF,1215px 119px #FFF,502px 1357px #FFF,672px 1139px #FFF,1251px 537px #FFF,172px 145px #FFF,471px 653px #FFF,180px 109px #FFF,229px 1927px #FFF,1826px 55px #FFF,238px 92px #FFF,835px 18px #FFF,114px 814px #FFF,121px 629px #FFF,99px 318px #FFF,106px 198px #FFF,215px 1919px #FFF,502px 357px #FFF,672px 139px #FFF,251px 1537px #FFF,1172px 45px #FFF,471px 1653px #FFF,1180px 1109px #FFF,754px 1736px #FFF,1515px 1886px #FFF,332px 1555px #FFF,1249px 871px #FFF,1361px 64px #FFF,73px 1863px #FFF,1018px 439px #FFF,303px 1313px #FFF,1048px 144px #FFF,164px 85px #FFF,1271px 873px #FFF,1275px 233px #FFF,1924px 628px #FFF,1599px 1705px #FFF,903px 1727px #FFF,607px 1160px #FFF;
      animation: animStar 100s linear infinite;
    }
    #stars3 {
      height: 3px; width: 3px; background: transparent; border-radius: 50%;
      box-shadow: 1014px 1898px #FFF,497px 146px #FFF,110px 1310px #FFF,1205px 1329px #FFF,1222px 1481px #FFF,1429px 496px #FFF,1813px 1463px #FFF,762px 1140px #FFF,1559px 1176px #FFF,571px 449px #FFF,14px 898px #FFF,1497px 1146px #FFF,1110px 310px #FFF,205px 329px #FFF,222px 481px #FFF,429px 1496px #FFF,813px 463px #FFF,1762px 140px #FFF,559px 176px #FFF,1571px 1449px #FFF, 888px 50px #FFF, 1900px 900px #FFF, 200px 300px #FFF;
      animation: animStar2 50s linear infinite;
    }
  `;

  // Conditional Rendering based on Authentication Status
  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)' }}>
        <div className="animate-spin w-12 h-12 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
        <p className="text-sm">Initializing Spher8...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
       <div className="h-screen w-screen flex flex-col items-center justify-center text-white p-4 text-center" style={{ background: 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)' }}>
          <div className="mb-8">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold mt-8 mb-4">Authentication Required</h1>
          <p className="text-slate-300 mb-8 max-w-sm">Please sign in to access the Spher8 synthesizer and start creating music.</p>
          <Button
            size="lg"
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={() => User.login()}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In with Google
          </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen flex flex-col overflow-hidden" style={{ background: selectedBackground !== 'stars' ? selectedBackground : '#000' }}>
      {selectedBackground === 'stars' && (
        <div className="star-layer">
          <style>{starfieldStyles}</style>
          <div id="stars1"></div>
          <div id="stars2"></div>
          <div id="stars3"></div>
        </div>
      )}
      <AudioEngine
        ref={audioEngineRef} // Add ref to AudioEngine
        notes={liveNotes}
        isPlaying={isScenePlaying && audioMode === 'web-audio'}
        masterVolume={masterVolume} bpm={bpm} rhythm={rhythm}
        onPlayingNotesChange={setPlayingNotes}
        waveform={waveform}
        envelope={envelope}
        eq={eq}
        efx={efx}
        isChordMode={isChordMode}
        arpeggioDelay={arpeggioDelay}
        onNotePlayed={handleNotePlayed}
        playbackSequence={playbackSequence}
        rhythmPattern={rhythmPattern}
        cycleLength={cycleLength}
        repeatMode={repeatMode}
        noteLength={noteLength}
        soundSource={soundSource}
        onLoadingChange={setIsSamplerLoading}
        onRecordingNodesReady={setRecordingNodes}
        isPanningEnabled={isPanningEnabled}
        panningWidth={panningWidth} // Add panningWidth to AudioEngine
      />

      <div ref={topPanelRef} className="w-full relative overflow-hidden flex-shrink-0" style={{ height: `${sceneHeight}px`, minHeight: '150px', background: 'transparent' }}>
        {isNotesLoaded && (
          <Scene3D
            notes={liveNotes}
            onNotePositionChange={handleNotePositionChange}
            playingNotes={playingNotes}
            structureTransform={structureTransform}
            onStructureTransformChange={setStructureTransform}
            onCameraReady={(resetFn) => { resetCameraRef.current = resetFn; }}
            cameraY={cameraY}
            sphereBrightness={sphereBrightness}
            lineConnectionMode={lineConnectionMode}
            Y_MIN={Y_MIN} Y_MAX={Y_MAX}
            selectedScale={selectedScale} rootNote={rootNote}
            calculateNoteProps={calculateNoteProps}
            disabled={isLockedOut || isResetting}
          />
        )}

        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
              <p className="text-sm">Initializing Spher8...</p>
            </div>
          </div>
        )}

        <NoteCounterHUD 
          count={noteCount} 
          userPlan={userRef.current?.plan || 'free'} 
        />
        <HudViewfinder isVisible={isHudVisible} />

        {isNotesLoaded && (
          <>
            <VerticalSlider
              value={cameraY}
              onChange={setCameraY}
              min={-5} max={10} step={0.1}
              disabled={false}
              position="left"
              icon={Camera}
            />
            <VerticalSlider
              value={yAxisMusicalScale}
              onChange={setYAxisMusicalScale}
              min={0} max={3.0} step={0.05}
              disabled={false}
              position="right"
              icon={Music4}
            />
          </>
        )}

        <div className="absolute bottom-4 left-4 text-slate-400 text-xs p-2 rounded-lg bg-black/30 backdrop-blur-sm pointer-events-none">
          <p>Left Click + Drag: Orbit</p>
          <p>Right Click + Drag: Pan</p>
          <p>Scroll: Zoom</p>
        </div>
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
          <div className="flex items-center space-x-1 rounded-lg p-1 px-2 h-6">
            <Checkbox
              id="hud-toggle"
              checked={isHudVisible}
              onCheckedChange={setIsHudVisible}
              className="h-3 w-3 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500 border-slate-400"
            />
            <label htmlFor="hud-toggle" className="text-xs text-slate-300 font-medium cursor-pointer">HUD</label>
          </div>
          <Button
            onClick={handleResetCamera}
            className="h-8 w-8 p-1 text-slate-300 bg-black/40 backdrop-blur-sm rounded-lg hover:bg-white/20 hover:text-white transition-all"
            title="Reset Camera View"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} className="h-3 bg-white/20 hover:bg-white/30 cursor-row-resize transition-colors duration-200 relative group flex-shrink-0 border-y border-white/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-1.5 bg-white/50 group-hover:bg-white/70 rounded-full transition-colors duration-200"></div>
        </div>
      </div>

      <div className="w-full px-4 py-2 bg-black/20 flex gap-2 flex-shrink-0">
        <Button
            onClick={handleScenePlayPause}
            size="sm"
            className={`h-6 flex-1 text-white font-bold transition-colors relative overflow-hidden text-xs ${isScenePlaying ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-700 hover:bg-green-600'} ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLockedOut}
            title={isLockedOut ? 'Upgrade to play' : (isScenePlaying ? 'Pause Playback' : 'Start Playback')}
        >
            {isScenePlaying ? <Pause className="w-3 h-3 mr-1.5" /> : <Play className="w-3 h-3 mr-1.5" />}
            {isScenePlaying ? 'Pause' : 'Play'}
        </Button>
        <Button
            onClick={handleQuickRecordToggle}
            size="sm"
            className={`h-6 flex-1 text-white font-bold transition-colors relative overflow-hidden text-xs ${isAudioRecording ? 'bg-slate-500 hover:bg-slate-600' : 'bg-red-700 hover:bg-red-600'} ${isLockedOut || isResetting || !recordingNodes?.stream ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLockedOut || isResetting || !recordingNodes?.stream}
            title={isAudioRecording ? 'Stop Recording' : 'Start Recording (Max 15s)'}
        >
            {isAudioRecording ? <StopCircle className="w-3 h-3 mr-1.5" /> : <Mic className="w-3 h-3 mr-1.5" />}
            {isAudioRecording ? 'Stop' : 'Record'}
        </Button>
        <Button
            size="sm"
            className="h-6 flex-1 bg-cyan-700 hover:bg-cyan-600 text-white font-bold transition-colors relative overflow-hidden text-xs"
            onClick={() => handleScrollToPanel(chordPanelRef)}
            title="Scroll to Chord Panel"
        >
            <Music className="w-3 h-3 mr-1.5" />
            Chord
        </Button>
        <Button
            size="sm"
            className="h-6 flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-colors relative overflow-hidden text-xs"
            onClick={handleVelocityScroll}
            title="Scroll to Velocity Panel"
        >
            <Volume2 className="w-3 h-3 mr-1.5" />
            Velocity
        </Button>
      </div>

      <div className="w-full px-4 py-2 bg-black/20 border-b border-white/10 flex-shrink-0">
        <SequencerPanel
          onLoadPreset={handleLoadPreset}
          currentBpm={bpm}
          disabled={isResetting}
          isPlaying={isSequencerPlaying}
          onPlayPause={handleSequencerPlayPause}
          isLockedOut={isLockedOut}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto glass-panel" style={{ minHeight: '300px' }}>
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Column 1 */}
            <div className="flex-1 space-y-4">
              <PlaybackPanel
                isPlaying={isScenePlaying && !isSequencerPlaying}
                onPlayPause={isLockedOut ? () => alert("Cannot play: User is locked out.") : handleScenePlayPause}
                onStop={handleSceneStop}
                masterVolume={masterVolume}
                onMasterVolumeChange={setMasterVolume}
                bpm={bpm}
                onBpmChange={setBpm}
                rhythm={rhythm}
                onRhythmChange={setRhythm}
                audioMode={audioMode}
                onAudioModeChange={setAudioMode}
                soundSource={soundSource}
                onSoundSourceChange={setSoundSource}
                isSamplerLoading={isSamplerLoading}
                midiSupported={midiEngine.midiSupported}
                midiOutputs={midiEngine.midiOutputs}
                onChordPlay={isLockedOut ? () => alert("Cannot play chord: User is locked out.") : handleChordPlay}
                arpeggioDelay={arpeggioDelay}
                onArpeggioDelayChange={setArpeggioDelay}
                onIsChordModeChange={setIsChordMode}
                isChordMode={isChordMode}
                selectedMidiOutput={selectedMidiOutput}
                onMidiOutputChange={handleMidiOutputChange}
                midiChannel={midiChannel}
                onMidiChannelChange={setMidiChannel}
                isConnected={midiEngine.isConnected}
                noteLength={noteLength}
                onNoteLengthChange={setNoteLength}
                rhythmPattern={rhythmPattern}
                onRhythmPatternChange={setRhythmPattern}
                cycleLength={cycleLength}
                notes={liveNotes}
                onNoteRhythmChange={handleNoteRhythmChange}
                isLockedOut={isLockedOut}
                isPanningEnabled={isPanningEnabled}
                onIsPanningChange={setIsPanningEnabled}
                panningWidth={panningWidth}
                onPanningWidthChange={setPanningWidth}
              />

              <PlaybackOrderPanel
                selectedMode={playbackOrder}
                onModeChange={setPlaybackOrder}
                disabled={isLockedOut}
              />
              <AIMoodPanel
                onMoodSettingsChange={handleMoodSettingsChange}
                currentSettings={{
                  bpm,
                  selectedScale,
                  sphereCount,
                  yTranslation: structureTransform.yTranslation
                }}
                disabled={isLockedOut || isResetting}
                isLockedOut={isLockedOut}
              />
              <div className="block lg:hidden">
                <NavigationPanel
                  structureTransform={structureTransform}
                  onStructureTransformChange={setStructureTransform}
                />
              </div>
              <AIRhythmPanel
                onRhythmChange={handleRhythmSettingsChange}
                currentBpm={bpm}
                disabled={isLockedOut || isResetting}
                isLockedOut={isLockedOut}
              />
              <AIVelocityPanel
                notes={liveNotes}
                onVelocityChange={handleVelocityChange}
                disabled={isLockedOut || isResetting}
                isLockedOut={isLockedOut}
              />
              <GuitarPanel
                onCreateNoteSequence={handleCreateNoteSequence}
                onScaleChange={setSelectedScale}
                onStructureTransformChange={setStructureTransform} // Pass the setter
                structureTransform={structureTransform} // Pass the current state
                disabled={isLockedOut}
                onPlaybackOrderChange={setPlaybackOrder}
                currentPlaybackOrder={playbackOrder}
              />
              <PresetPanel
                onSave={handleSavePreset}
                onLoad={handleLoadPreset}
                disabled={isLockedOut || isResetting}
              />
            </div>

            {/* Column 2 */}
            <div className="flex-1 space-y-4">
              <Spher8BrandPanel />
              <ScalesPanel
                selectedScale={selectedScale}
                onScaleChange={setSelectedScale}
                rootNote={rootNote}
                onRootNoteChange={setRootNote}
                onCreateNoteSequence={handleCreateNoteSequence}
                sphereCount={sphereCount}
                disabled={isLockedOut}
              />
              <SphereCountPanel
                sphereCount={sphereCount}
                onSphereCountChange={handleSphereCountChange}
                disabled={isLockedOut || isResetting}
              />
              <MolecularShapePanel
                onShapeSelect={handleShapeChange}
                disabled={isLockedOut || isResetting}
                processingShape={processingShape}
              />
              <SceneControlPanel
                onReset={handleReset}
                isResetting={isResetting}
                disabled={isLockedOut || isResetting}
              />
              <div ref={chordPanelRef}>
                <ChordPanel
                  onCreateNoteSequence={handleCreateNoteSequence}
                  rootNote={rootNote}
                  onRootNoteChange={setRootNote}
                  selectedScale={selectedScale}
                  forceToScale={yAxisMusicalScale > 0}
                  disabled={isLockedOut}
                />
              </div>
              <TuningPanel
                activeTuning={activeTuning}
                onTuningChange={handleTuningChange}
                disabled={isLockedOut}
              />
              <HarmonicSeriesPanel
                onCreateNoteSequence={handleCreateNoteSequence}
                disabled={isLockedOut}
              />
              <DodecaphonicPanel
                onCreateNoteSequence={handleCreateNoteSequence}
                disabled={isLockedOut}
                onFirstCreate={() => setSelectedScale('Chromatic')}
              />
              <WaveformPanel
                waveform={waveform}
                onWaveformChange={setWaveform}
                envelope={envelope}
                onEnvelopeChange={setEnvelope}
              />
              <EQPanel
                eq={eq}
                onEQChange={setEq}
              />
              {/* EFX Panel for mobile */}
              <div className="block lg:hidden">
                <EFXPanel
                  efx={efx}
                  onEfxChange={setEfx}
                  disabled={isLockedOut || isResetting}
                />
              </div>
              <div className="block lg:hidden">
                <AINoteRhythmCyclePanel
                  notes={liveNotes}
                  onNoteRhythmChange={handleNoteRhythmChange}
                  currentBpm={bpm}
                  disabled={isLockedOut || isResetting}
                  rhythmPattern={rhythmPattern}
                  onRhythmPatternChange={setRhythmPattern}
                  cycleLength={cycleLength}
                  onCycleLengthChange={setCycleLength}
                  repeatMode={repeatMode}
                  onRepeatModeChange={setRepeatMode}
                  isLockedOut={isLockedOut}
                />
              </div>
              <div className="block lg:hidden">
                <MidiRecorderPanel
                  buffer={displayedBuffer}
                  onSave={handleSaveMidiSnippet}
                  onPlayback={handleRecorderPlayback}
                  isPlayingBack={isPlaybackActive}
                  isMainPlaybackActive={isScenePlaying}
                  referenceTime={recordingEndTimeRef.current}
                  disabled={isLockedOut}
                  onInitAudio={initAudioContext}
                />
              </div>
              <div className="block lg:hidden">
                <MidiSnippetPanel disabled={isLockedOut || isResetting} />
              </div>
              <div className="block lg:hidden">
                <AudioRecorderPanel
                    ref={audioRecorderRef}
                    isRecording={isAudioRecording}
                    setIsRecording={setIsAudioRecording}
                    stream={recordingNodes?.stream}
                    analyser={recordingNodes?.analyser}
                    disabled={isLockedOut || isResetting}
                    onInitAudio={initAudioContext}
                />
              </div>
              <div className="block lg:hidden">
                <AudioSnippetPanel disabled={isLockedOut || isResetting} />
              </div>
              <div className="block lg:hidden" ref={velocityPanelRefMobile}>
                <VelocityPanel notes={liveNotes} onVelocityChange={handleVelocityChange} playingNotes={playingNotes} disabled={isLockedOut || isResetting} />
              </div>
              <div className="block lg:hidden">
                <MolecularChainPanel
                  notes={liveNotes}
                  sphereCount={sphereCount}
                  playingNotes={playingNotes}
                />
              </div>
            </div>

            {/* Column 3 - Only visible on large screens (lg+) */}
            <div className="flex-1 space-y-4 hidden lg:block">
              <NavigationPanel
                structureTransform={structureTransform}
                onStructureTransformChange={setStructureTransform}
              />
              <EFXPanel
                efx={efx}
                onEfxChange={setEfx}
                disabled={isLockedOut || isResetting}
              />
              <MidiRecorderPanel
                buffer={displayedBuffer}
                onSave={handleSaveMidiSnippet}
                onPlayback={handleRecorderPlayback}
                isPlayingBack={isPlaybackActive}
                isMainPlaybackActive={isScenePlaying}
                referenceTime={recordingEndTimeRef.current}
                disabled={isLockedOut}
                onInitAudio={initAudioContext}
              />
              <MidiSnippetPanel disabled={isLockedOut || isResetting} />
              <AudioRecorderPanel
                ref={audioRecorderRef}
                isRecording={isAudioRecording}
                setIsRecording={setIsAudioRecording}
                stream={recordingNodes?.stream}
                analyser={recordingNodes?.analyser}
                disabled={isLockedOut || isResetting}
                onInitAudio={initAudioContext}
              />
              <AudioSnippetPanel disabled={isLockedOut || isResetting} />
              <AINoteRhythmCyclePanel
                notes={liveNotes}
                onNoteRhythmChange={handleNoteRhythmChange}
                currentBpm={bpm}
                disabled={isLockedOut || isResetting}
                rhythmPattern={rhythmPattern}
                onRhythmPatternChange={setRhythmPattern}
                cycleLength={cycleLength}
                onCycleLengthChange={setCycleLength}
                repeatMode={repeatMode}
                onRepeatModeChange={setRepeatMode}
                isLockedOut={isLockedOut}
              />
              <div ref={velocityPanelRefLg}>
                <VelocityPanel notes={liveNotes} onVelocityChange={handleVelocityChange} playingNotes={playingNotes} disabled={isLockedOut || isResetting} />
              </div>
              <MolecularChainPanel
                notes={liveNotes}
                sphereCount={sphereCount}
                playingNotes={playingNotes}
              />
              <VisualsPanel
                sphereBrightness={sphereBrightness}
                onSphereBrightnessChange={setSphereBrightness}
              />
              <BackgroundPanel
                selectedBackground={selectedBackground}
                onBackgroundChange={setSelectedBackground}
              />
            </div>

            {/* Mobile-only panels - Show background panel on mobile */}
            <div className="block lg:hidden">
              <div className="space-y-4">
                <VisualsPanel
                  sphereBrightness={sphereBrightness}
                  onSphereBrightnessChange={setSphereBrightness}
                />
                <BackgroundPanel
                  selectedBackground={selectedBackground}
                  onBackgroundChange={setSelectedBackground}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          // Ensure user remains locked out if still on free plan and over limit
          if (userRef.current?.plan === 'free' && noteCount >= 5000) {
            setIsLockedOut(true);
          }
        }}
      />
    </div>
  );
}
