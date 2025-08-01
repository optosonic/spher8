
export const SCALES = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Locrian': [0, 1, 3, 5, 6, 8, 10],
  'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  'Major Pentatonic': [0, 2, 4, 7, 9],
  'Minor Pentatonic': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
  'Whole Tone': [0, 2, 4, 6, 8, 10],
  'Arabic (Bayati)': [0, 1, 4, 5, 7, 8, 11],
  'Persian': [0, 1, 4, 5, 6, 8, 11],
  'Gypsy': [0, 1, 4, 5, 7, 8, 11],
  'Japanese (Insen)': [0, 1, 5, 7, 10],
  'Egyptian': [0, 2, 5, 7, 10],
  'Flamenco': [0, 1, 4, 5, 7, 8, 11],
  'Sydney Con 110': [0, 3, 4]
};

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFreq(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function getFrequencyFromScale(degree, scale, rootNoteMidi) {
  const intervals = SCALES[scale];
  if (!intervals) return 0;

  const baseOctaveMidi = 24; // Start at C1 for a lower, wider range

  const octaveOffset = Math.floor(degree / intervals.length);
  const scaleDegreeIndex = degree % intervals.length;
  
  let midiNote = baseOctaveMidi + rootNoteMidi + (octaveOffset * 12) + intervals[scaleDegreeIndex];
  
  // Clamp the note to the valid MIDI range 0-127
  midiNote = Math.max(0, Math.min(127, midiNote));
  
  return midiToFreq(midiNote);
}
