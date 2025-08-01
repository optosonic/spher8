
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, ArrowLeft, ArrowRight, ChevronUp, ChevronDown, GitCommitVertical, Music4 } from 'lucide-react';
import { GuitarChord } from '@/api/entities';

// Standard guitar tuning in MIDI notes (low E to high E)
const GUITAR_STANDARD_TUNING = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4

// Standard pipa tuning in MIDI notes (A, D, E, A from low to high)
const PIPA_STANDARD_TUNING = [45, 50, 52, 57]; // A2, D3, E3, A3

// Guitar chord library - Updated with the new comprehensive database
const GUITAR_CHORD_LIBRARY = [
  {
    "chordName": "E minor (open)",
    "fretPositions": [0, 2, 2, 0, 0, 0],
    "fretSpan": 2,
    "midiNotes": [40, 47, 52, 55, 59, 64],
    "stringsPlayed": 6,
    "description": "Simplest open minor; only 2nd fret on A/D, index/middle fingers—great for beginners, warm tone."
  },
  {
    "chordName": "E major (open)",
    "fretPositions": [0, 2, 2, 1, 0, 0],
    "fretSpan": 2,
    "midiNotes": [40, 47, 52, 56, 59, 64],
    "stringsPlayed": 6,
    "description": "Classic open major; adds 1st fret on G, three fingers, minimal stretch, bright and full."
  },
  {
    "chordName": "A minor (open)",
    "fretPositions": [-1, 0, 2, 2, 1, 0],
    "fretSpan": 2,
    "midiNotes": [45, 52, 57, 60, 64],
    "stringsPlayed": 5,
    "description": "Open, melancholic; 1-2 fret span on D/B, mute low E, easy for small hands."
  },
  {
    "chordName": "A major (open)",
    "fretPositions": [-1, 0, 2, 2, 2, 0],
    "fretSpan": 2,
    "midiNotes": [45, 52, 57, 61, 64],
    "stringsPlayed": 5,
    "description": "Bright open major; 2nd fret on D/G/B, three fingers close together, mute low E."
  },
  {
    "chordName": "D minor (open)",
    "fretPositions": [-1, -1, 0, 2, 3, 1],
    "fretSpan": 3,
    "midiNotes": [50, 57, 62, 65],
    "stringsPlayed": 4,
    "description": "Somber open minor; 1-3 fret span, mute low E/A, index on 1, ring on 3—compact stretch."
  },
  {
    "chordName": "D major (open)",
    "fretPositions": [-1, -1, 0, 2, 3, 2],
    "fretSpan": 3,
    "midiNotes": [50, 57, 62, 66],
    "stringsPlayed": 4,
    "description": "Bright open major; 2-3 fret span, three fingers, mute low E/A, common in folk."
  },
  {
    "chordName": "G major (open)",
    "fretPositions": [3, 2, 0, 0, 0, 3],
    "fretSpan": 3,
    "midiNotes": [43, 47, 50, 55, 59, 67],
    "stringsPlayed": 6,
    "description": "Full open chord; 2-3 fret span on E/A, open D/G/B ease stretch, versatile for rock/pop."
  },
  {
    "chordName": "C major (open)",
    "fretPositions": [-1, 3, 2, 0, 1, 0],
    "fretSpan": 3,
    "midiNotes": [48, 52, 55, 60, 64],
    "stringsPlayed": 5,
    "description": "Clean open major; 1-3 fret span, mute low E, three fingers, widely used in all genres."
  },
  {
    "chordName": "Em7 (open)",
    "fretPositions": [0, 2, 0, 0, 0, 0],
    "fretSpan": 2,
    "midiNotes": [40, 47, 50, 55, 59, 64],
    "stringsPlayed": 6,
    "description": "Mellow open minor 7th; only 2nd fret on A, one finger (index), very easy for beginners."
  },
  {
    "chordName": "Am7 (open)",
    "fretPositions": [-1, 0, 2, 0, 1, 0],
    "fretSpan": 2,
    "midiNotes": [45, 52, 55, 60, 64],
    "stringsPlayed": 5,
    "description": "Soft open minor 7th; 1-2 fret span, mute low E, two fingers, jazzy feel with minimal effort."
  },
  {
    "chordName": "A7 (open)",
    "fretPositions": [-1, 0, 2, 0, 2, 0],
    "fretSpan": 2,
    "midiNotes": [45, 52, 55, 61, 64],
    "stringsPlayed": 5,
    "description": "Bluesy open 7th; 2nd fret on D/B, two fingers, open A/G/E, easy transition from A major."
  },
  {
    "chordName": "D7 (open)",
    "fretPositions": [-1, -1, 0, 2, 1, 2],
    "fretSpan": 2,
    "midiNotes": [50, 57, 60, 66],
    "stringsPlayed": 4,
    "description": "Classic open 7th; 1-2 fret span, mute low E/A, three fingers, great for blues progressions."
  },
  {
    "chordName": "Esus4 (open)",
    "fretPositions": [0, 2, 2, 2, 0, 0],
    "fretSpan": 2,
    "midiNotes": [40, 47, 52, 57, 59, 64],
    "stringsPlayed": 6,
    "description": "Open suspended; 2nd fret on A/D/G, three fingers, open E/B/E add ambiguity, easy shape."
  },
  {
    "chordName": "Asus4 (open)",
    "fretPositions": [-1, 0, 2, 2, 0, 0],
    "fretSpan": 2,
    "midiNotes": [45, 52, 57, 59, 64],
    "stringsPlayed": 5,
    "description": "Bright open suspended; 2nd fret on D/G, two fingers, mute low E, resolves nicely to A major."
  },
  {
    "chordName": "E5 (power, open)",
    "fretPositions": [0, 2, 2, -1, -1, -1],
    "fretSpan": 2,
    "midiNotes": [40, 47, 52],
    "stringsPlayed": 3,
    "description": "Simple power chord; 2nd fret on A/D, two fingers, mute high strings, punchy for rock."
  },
  {
    "chordName": "F major (E-shape barre)",
    "fretPositions": [1, 3, 3, 2, 1, 1],
    "fretSpan": 3,
    "midiNotes": [41, 48, 53, 57, 60, 65],
    "stringsPlayed": 6,
    "description": "Movable barre at low position; index barre at 1, fingers on 2-3, essential for keys like Bb."
  },
  {
    "chordName": "F minor (E-shape barre)",
    "fretPositions": [1, 3, 3, 1, 1, 1],
    "fretSpan": 3,
    "midiNotes": [41, 48, 53, 56, 60, 65],
    "stringsPlayed": 6,
    "description": "Minor barre at low position; index barre at 1, ring on 3, easy variation from F major."
  },
  {
    "chordName": "G major (E-shape barre)",
    "fretPositions": [3, 5, 5, 4, 3, 3],
    "fretSpan": 5,
    "midiNotes": [43, 50, 55, 59, 62, 67],
    "stringsPlayed": 6,
    "description": "Shifted E shape up 3 frets; full body, good for transitioning from open G."
  },
  {
    "chordName": "G minor (E-shape barre)",
    "fretPositions": [3, 5, 5, 3, 3, 3],
    "fretSpan": 5,
    "midiNotes": [43, 50, 55, 58, 62, 67],
    "stringsPlayed": 6,
    "description": "Minor barre at 3; compact, useful in rock and blues."
  },
  {
    "chordName": "A major (E-shape barre)",
    "fretPositions": [5, 7, 7, 6, 5, 5],
    "fretSpan": 7,
    "midiNotes": [45, 52, 57, 61, 64, 69],
    "stringsPlayed": 6,
    "description": "Mid-fretboard major; builds hand strength, brighter than open A."
  },
  {
    "chordName": "A minor (E-shape barre)",
    "fretPositions": [5, 7, 7, 5, 5, 5],
    "fretSpan": 7,
    "midiNotes": [45, 52, 57, 60, 64, 69],
    "stringsPlayed": 6,
    "description": "Mid minor barre; easier on higher frets due to narrower neck."
  },
  {
    "chordName": "Bb major (E-shape barre)",
    "fretPositions": [6, 8, 8, 7, 6, 6],
    "fretSpan": 8,
    "midiNotes": [46, 53, 58, 62, 65, 70],
    "stringsPlayed": 6,
    "description": "Mid-high barre; common in jazz, movable for any major."
  },
  {
    "chordName": "B major (A-shape barre)",
    "fretSpan": 4,
    "fretPositions": [-1, 2, 4, 4, 4, 2],
    "midiNotes": [47, 54, 59, 63, 66],
    "stringsPlayed": 5,
    "description": "Low A shape barre; mute low E, compact for small hands."
  },
  {
    "chordName": "B minor (A-shape barre)",
    "fretSpan": 4,
    "fretPositions": [-1, 2, 4, 4, 3, 2],
    "midiNotes": [47, 54, 59, 62, 66],
    "stringsPlayed": 5,
    "description": "Low minor variant; easier stretch, emotive in songs."
  },
  {
    "chordName": "C major (A-shape barre)",
    "fretSpan": 5,
    "fretPositions": [-1, 3, 5, 5, 5, 3],
    "midiNotes": [48, 55, 60, 64, 67],
    "stringsPlayed": 5,
    "description": "Mid A shape; alternative to open C, fuller sound."
  },
  {
    "chordName": "C minor (E-shape barre)",
    "fretSpan": 10,
    "fretPositions": [8, 10, 10, 8, 8, 8],
    "midiNotes": [48, 55, 60, 63, 67, 72],
    "stringsPlayed": 6,
    "description": "High minor barre; thinner tone at higher frets."
  },
  {
    "chordName": "D major (A-shape barre)",
    "fretSpan": 7,
    "fretPositions": [-1, 5, 7, 7, 7, 5],
    "midiNotes": [50, 57, 62, 66, 69],
    "stringsPlayed": 5,
    "description": "Mid-high A shape; versatile for folk and pop."
  },
  {
    "chordName": "F major (D-shape barre)",
    "fretSpan": 6,
    "fretPositions": [-1, -1, 3, 5, 6, 5],
    "midiNotes": [53, 60, 65, 69],
    "stringsPlayed": 4,
    "description": "Mid D shape; alternative to E shape F, different voicing."
  },
  {
    "chordName": "C major (G-shape barre)",
    "fretSpan": 8,
    "fretPositions": [8, 7, 5, 5, 5, 8],
    "midiNotes": [48, 52, 55, 60, 64, 72],
    "stringsPlayed": 6,
    "description": "Mid G shape for C; unique voicing, pinky on high and low."
  },
  {
    "chordName": "B major (E-shape barre)",
    "fretSpan": 9,
    "fretPositions": [7, 9, 9, 8, 7, 7],
    "midiNotes": [47, 54, 59, 63, 66, 71],
    "stringsPlayed": 6,
    "description": "Mid E shape; standard for B, clean with practice."
  },
  {
    "chordName": "C7 (open)",
    "fretSpan": 3,
    "fretPositions": [-1, 3, 2, 3, 1, 0],
    "midiNotes": [48, 52, 58, 60, 64],
    "stringsPlayed": 5,
    "description": "Open 7th chord; adds flavor to progressions, easy finger placement."
  },
  {
    "chordName": "E7 (open)",
    "fretPositions": [0, 2, 0, 1, 0, 0],
    "fretSpan": 2,
    "midiNotes": [40, 47, 50, 56, 59, 64],
    "stringsPlayed": 6,
    "description": "Bluesy open 7th; simple variation from Em7, great for beginners."
  },
  {
    "chordName": "F#m (E-shape barre)",
    "fretSpan": 4,
    "fretPositions": [2, 4, 4, 2, 2, 2],
    "midiNotes": [42, 49, 54, 57, 61, 66],
    "stringsPlayed": 6,
    "description": "Low minor barre; common in rock, movable shape."
  },
  {
    "chordName": "Dsus4 (open)",
    "fretSpan": 3,
    "fretPositions": [-1, -1, 0, 2, 3, 3],
    "midiNotes": [50, 57, 62, 67],
    "stringsPlayed": 4,
    "description": "Open suspended; adds tension, easy to resolve to D major."
  },
  {
    "chordName": "Gsus4 (open)",
    "fretPositions": [3, 3, 0, 0, 1, 3],
    "midiNotes": [43, 48, 50, 55, 60, 67],
    "stringsPlayed": 6,
    "description": "Open suspended variant; bright and ambiguous sound."
  },
  {
    "chordName": "Edim (partial)",
    "fretSpan": 3,
    "fretPositions": [-1, -1, 1, 0, 3, 0],
    "midiNotes": [51, 55, 62, 64],
    "stringsPlayed": 4,
    "description": "Simple diminished; tense sound, useful in transitions."
  },
  {
    "chordName": "C# major (E-shape barre)",
    "fretSpan": 11,
    "fretPositions": [9, 11, 11, 10, 9, 9],
    "midiNotes": [49, 56, 61, 65, 68, 73],
    "stringsPlayed": 6,
    "description": "High major barre; crisp tone for leads."
  },
  {
    "chordName": "Dm ( (E-shape barre)",
    "fretSpan": 12,
    "fretPositions": [10, 12, 12, 10, 10, 10],
    "midiNotes": [50, 57, 62, 65, 69, 74],
    "stringsPlayed": 6,
    "description": "High minor barre; alternative voicing for depth."
  },
  {
    "chordName": "G major (G-shape high)",
    "fretSpan": 15,
    "fretPositions": [15, 14, 12, 12, 12, 15],
    "midiNotes": [55, 59, 62, 67, 71, 79],
    "stringsPlayed": 6,
    "description": "High G shape; sparkling high register chord."
  },
  {
    "chordName": "A5 (power high)",
    "fretSpan": 14,
    "fretPositions": [-1, 12, 14, -1, -1, -1],
    "midiNotes": [57, 64],
    "stringsPlayed": 2,
    "description": "High power chord; punchy for riffs in upper range."
  },
  {
    "chordName": "A7#11 (flamenco voicing)",
    "fretPositions": [-1, 0, 5, 6, 4, 0],
    "fretSpan": 6,
    "midiNotes": [45, 55, 61, 63, 64],
    "stringsPlayed": 5,
    "description": "Advanced voicing with added #11, commonly used in flamenco for tension."
  },
  {
    "chordName": "B9(11) (flamenco voicing)",
    "fretPositions": [-1, 2, 4, 6, 0, 0],
    "fretSpan": 6,
    "midiNotes": [47, 54, 61, 63, 64],
    "stringsPlayed": 5,
    "description": "Complex ninth chord with eleventh, suitable for intricate progressions."
  },
  {
    "chordName": "Dm/F (flamenco inversion)",
    "fretPositions": [-1, -1, 3, 2, 3, -1],
    "fretSpan": 3,
    "midiNotes": [53, 57, 62],
    "stringsPlayed": 3,
    "description": "First inversion of D minor with F in the bass, used for smooth voice leading in flamenco."
  },
  {
    "chordName": "Fmaj7#11 (flamenco voicing)",
    "fretPositions": [1, 3, 3, 2, 0, 0],
    "fretSpan": 3,
    "midiNotes": [41, 48, 53, 57, 59, 64],
    "stringsPlayed": 6,
    "description": "Advanced major seventh chord with raised eleventh, adding a Spanish flavor."
  },
  {
    "chordName": "G6 (flamenco voicing)",
    "fretPositions": [3, 5, 5, 4, 0, 0],
    "fretSpan": 5,
    "midiNotes": [43, 50, 55, 59, 59, 64],
    "stringsPlayed": 6,
    "description": "Sixth chord, common in flamenco for modal interchange."
  },
  {
    "chordName": "Gm6/9 (gypsy style)",
    "fretPositions": [3, 5, 5, 3, 5, 3],
    "fretSpan": 2,
    "midiNotes": [43, 50, 55, 58, 64, 67],
    "stringsPlayed": 6,
    "description": "Lush minor 6/9 voicing typical in gypsy jazz for melodic depth in swing tunes."
  },
  {
    "chordName": "G6/9 (gypsy style)",
    "fretPositions": [3, 5, 5, 4, 5, 3],
    "fretSpan": 2,
    "midiNotes": [43, 50, 55, 59, 64, 67],
    "stringsPlayed": 6,
    "description": "Major 6/9 chord, essential for gypsy swing rhythm and harmony."
  },
  {
    "chordName": "Cm6 (gypsy style)",
    "fretPositions": [8, 10, 10, 8, 8, -1],
    "fretSpan": 2,
    "midiNotes": [48, 55, 60, 63, 67],
    "stringsPlayed": 5,
    "description": "Minor 6th chord voicing, rich and melodic, often used in gypsy jazz minor progressions."
  },
  {
    "chordName": "C7 (gypsy style)",
    "fretPositions": [8, 10, 8, 9, 8, -1],
    "fretSpan": 2,
    "midiNotes": [48, 55, 58, 64, 67],
    "stringsPlayed": 5,
    "description": "Dominant 7th chord voicing with a swing feel, key for gypsy jazz rhythm 'la pompe'."
  },
  {
    "chordName": "Cdim7 (gypsy style)",
    "fretPositions": [9, 10, 9, 10, -1, -1],
    "fretSpan": 1,
    "midiNotes": [49, 55, 59, 65],
    "stringsPlayed": 4,
    "description": "Diminished 7th chord, providing tension and resolution in gypsy jazz transitions."
  }
];

// Pipa chord library
// Pipa chord library
const PIPA_CHORD_LIBRARY = [
  {
    "chordName": "A major7 (open voicing)",
    "fretPositions": [4, 6, 0, 0],
    "fretSpan": 6,
    "midiNotes": [49, 56, 52, 57],
    "stringsPlayed": 4,
    "description": "Rich major 7th; frets on low strings for C# and G#, open E and A for resonance, all distinct pitches."
  },
  {
    "chordName": "A minor (partial)",
    "fretPositions": [0, 0, 8, -1],
    "fretSpan": 8,
    "midiNotes": [45, 50, 60],
    "stringsPlayed": 3,
    "description": "Melancholic minor; open A and D, fret 8 on E for C, mute high A to avoid duplicate."
  },
  {
    "chordName": "D minor (open)",
    "fretPositions": [-1, 0, 1, 0],
    "fretSpan": 1,
    "midiNotes": [50, 53, 57],
    "stringsPlayed": 3,
    "description": "Somber open minor; open D, A and fret 1 on E for F, distinct D F A."
  },
  {
    "chordName": "D major (open)",
    "fretPositions": [-1, 0, 2, 0],
    "fretSpan": 2,
    "midiNotes": [50, 54, 57],
    "stringsPlayed": 3,
    "description": "Bright open major; open D, A and fret 2 on E for F#, distinct D F# A."
  },
  {
    "chordName": "E minor (partial)",
    "fretPositions": [7, 5, -1, 2],
    "fretSpan": 7,
    "midiNotes": [52, 55, 59],
    "stringsPlayed": 3,
    "description": "Warm minor; frets for E G B across strings, mute E string, distinct."
  },
  {
    "chordName": "E major (partial)",
    "fretPositions": [7, 6, -1, 4],
    "fretSpan": 7,
    "midiNotes": [52, 56, 61],
    "stringsPlayed": 3,
    "description": "Bright major; frets for E G# B, mute E string, all distinct."
  },
  {
    "chordName": "G major (partial)",
    "fretPositions": [10, 5, 3, -1],
    "fretSpan": 10,
    "midiNotes": [55, 55, 55],
    "stringsPlayed": 3,
    "description": "Full major; frets for G B D, but adjusted to avoid duplicates if possible, here G B D on three strings."
  },
  {
    "chordName": "C major (high)",
    "fretPositions": [-1, 10, 8, 3],
    "fretSpan": 10,
    "midiNotes": [60, 60, 60],
    "stringsPlayed": 3,
    "description": "High C major; but to avoid duplicates, use three strings for C E G."
  },
  {
    "chordName": "Am7 (open)",
    "fretPositions": [0, 10, 8, 10],
    "fretSpan": 10,
    "midiNotes": [45, 60, 60, 67],
    "stringsPlayed": 4,
    "description": "Mellow minor 7th; adjust frets for A C E G, distinct."
  },
  {
    "chordName": "A7 (open)",
    "fretPositions": [0, 0, 6, 10],
    "fretSpan": 10,
    "midiNotes": [45, 50, 58, 67],
    "stringsPlayed": 4,
    "description": "Dominant 7th; frets for A C# E G, distinct pitches for tension."
  },
  {
    "chordName": "D7 (open)",
    "fretPositions": [-1, 0, 2, 3],
    "fretSpan": 3,
    "midiNotes": [50, 54, 60],
    "stringsPlayed": 3,
    "description": "Bluesy 7th; open D, fret 2 on E for F#, 3 on A for C, distinct D F# C."
  },
  {
    "chordName": "E7 (partial)",
    "fretPositions": [7, 2, 3, -1],
    "fretSpan": 7,
    "midiNotes": [52, 52, 55],
    "stringsPlayed": 3,
    "description": "Dominant 7th; frets for E G# D, mute high, distinct."
  },
  {
    "chordName": "Asus4 (open)",
    "fretPositions": [0, 5, 0, 0],
    "fretSpan": 5,
    "midiNotes": [45, 55, 52, 57],
    "stringsPlayed": 4,
    "description": "Suspended; fret 5 on D for G, open others, distinct A D E G."
  },
  {
    "chordName": "Dsus4 (open)",
    "fretPositions": [-1, 0, 3, 0],
    "fretSpan": 3,
    "midiNotes": [50, 55, 57],
    "stringsPlayed": 3,
    "description": "Open suspended; open D A, fret 3 on E for G, distinct D G A."
  },
  {
    "chordName": "A5 (power, open)",
    "fretPositions": [0, -1, 0, 0],
    "fretSpan": 0,
    "midiNotes": [45, 52, 57],
    "stringsPlayed": 3,
    "description": "Power chord; open A E A, but duplicate A, so mute D to avoid extra."
  },
  {
    "chordName": "Bb major (barre)",
    "fretPositions": [1, 1, 9, 1],
    "fretSpan": 9,
    "midiNotes": [46, 51, 61, 58],
    "stringsPlayed": 4,
    "description": "Barre major; adjusted frets for Bb D F Bb, but to distinct, perhaps 3 strings."
  },
  {
    "chordName": "Bb minor (barre)",
    "fretPositions": [1, 1, 6, 4],
    "fretSpan": 6,
    "midiNotes": [46, 51, 58, 61],
    "stringsPlayed": 4,
    "description": "Minor barre; frets for Bb Db F Ab, distinct."
  },
  {
    "chordName": "G major (barre)",
    "fretPositions": [10, 5, 7, 10],
    "fretSpan": 10,
    "midiNotes": [55, 55, 59, 67],
    "stringsPlayed": 4,
    "description": "Barre G major; frets for G B D G, duplicate, add F# for Gmaj7."
  },
  {
    "chordName": "G minor (barre)",
    "fretPositions": [10, 5, 6, 10],
    "fretSpan": 10,
    "midiNotes": [55, 55, 58, 67],
    "stringsPlayed": 4,
    "description": "Minor barre; frets for G Bb D G, duplicate, add F for Gm7."
  },
  {
    "chordName": "C major (barre)",
    "fretPositions": [3, 10, 8, 3],
    "fretSpan": 10,
    "midiNotes": [48, 60, 60, 60],
    "stringsPlayed": 4,
    "description": "duplicate, so use 3 strings for C E G." 
  },
  {
    "chordName": "C minor (barre)",
    "fretPositions": [3, 10, 6, 6],
    "fretSpan": 10,
    "midiNotes": [48, 60, 58, 63],
    "stringsPlayed": 4,
    "description": "C minor; frets for C Eb G Bb for Cm7, distinct."
  },
  {
    "chordName": "Bb major (mid)",
    "fretPositions": [13, 8, 10, 13],
    "fretSpan": 13,
    "midiNotes": [58, 58, 62, 70],
    "stringsPlayed": 4,
    "description": "Mid Bb major; frets for Bb D F Bb, duplicate, add A for Bb maj7."
  },
  {
    "chordName": "B major (barre)",
    "fretPositions": [2, 9, 7, 4],
    "fretSpan": 9,
    "midiNotes": [47, 59, 59, 61],
    "stringsPlayed": 4,
    "description": "B major; frets for B D# F# B, duplicate, adjust."
  },
  {
    "chordName": "B minor (barre)",
    "fretPositions": [2, 9, 5, 5],
    "fretSpan": 9,
    "midiNotes": [47, 59, 57, 62],
    "stringsPlayed": 4,
    "description": "B minor; frets for B D F# A for Bm7, distinct."
  },
  {
    "chordName": "C major (A-shape barre)",
    "fretSpan": 10,
    "fretPositions": [3, 10, 8, 3],
    "midiNotes": [48, 60, 60, 60],
    "stringsPlayed": 4,
    "description": "Alternative C major; use partial to avoid duplicates."
  },
  {
    "chordName": "C minor (high barre)",
    "fretSpan": 10,
    "fretPositions": [15, 10, 8, 13],
    "midiNotes": [60, 60, 60, 70],
    "stringsPlayed": 4,
    "description": "High C minor; adjust for distinct by adding Bb for Cm7."
  },
  {
    "chordName": "D major (mid barre)",
    "fretSpan": 5,
    "fretPositions": [5, 4, 2, 5],
    "midiNotes": [50, 54, 54, 62],
    "stringsPlayed": 4,
    "description": "Mid D major; frets for D F# A D, duplicate, add C# for Dmaj7."
  },
  {
    "chordName": "F major (partial)",
    "fretSpan": 8,
    "fretPositions": [-1, 3, 1, 8],
    "midiNotes": [53, 53, 65],
    "stringsPlayed": 3,
    "description": "F major; frets for F A C, distinct."
  },
  {
    "chordName": "C major (high voicing)",
    "fretSpan": 15,
    "fretPositions": [15, 10, 12, 15],
    "midiNotes": [60, 60, 64, 72],
    "stringsPlayed": 4,
    "description": "High C major; frets for C E G C, duplicate, add B for Cmaj7."
  },
  {
    "chordName": "B major (high barre)",
    "fretSpan": 14,
    "fretPositions": [14, 9, 11, 14],
    "midiNotes": [59, 59, 63, 71],
    "stringsPlayed": 4,
    "description": "High B major; frets for B D# F# B, duplicate, add A# for Bmaj7."
  }
];

const guitarPickingTechniques = [
  { key: 'guitar_flamenco_arpeggio', label: 'Classic Flamenco', icon: GitCommitVertical, description: 'Classic Flamenco Arpeggio: 1-2-3-4-5-6-5-4' },
  { key: 'guitar_pinch', label: 'Syncopated Pinch', icon: GitCommitVertical, description: 'Syncopated Bass-Treble Pinch: 1-4-2-(5+4)-1-4-2-(5+4)' },
  { key: 'guitar_asc_anchor', label: 'Ascending Anchor', icon: GitCommitVertical, description: 'Ascending Arpeggio with Bass Anchor: 1-3-4-5-6-2-4-5' },
  { key: 'guitar_desc_pulse', label: 'Descending Pulse', icon: GitCommitVertical, description: 'Descending Treble with Bass Pulse: 6-5-4-1-6-5-4-2' },
  { key: 'guitar_rasgueado', label: 'Rasgueado Hybrid', icon: GitCommitVertical, description: 'Flamenco Rasgueado-Arpeggio Hybrid: 1-2-4-5-(6+5+4)' },
  { key: 'guitar_staggered', label: 'Staggered Alt', icon: GitCommitVertical, description: 'Staggered Bass-Treble Alternation: 1-5-2-4-3-6-2-5' }
];

const pipaPickingTechniques = [
  { key: 'pipa_roll', label: 'Roll', icon: GitCommitVertical, description: 'Traditional pipa roll: 1-2-3-4-3-2-1' },
  { key: 'pipa_tremolo', label: 'Tremolo', icon: GitCommitVertical, description: 'Rapid tremolo picking: 1-1-2-2-(2+3)-(2+3)-(3+4)-(3+4)' },
  { key: 'pipa_bounce', label: 'Bounce', icon: GitCommitVertical, description: 'Bouncing technique: 1-3-2-4-1-3-2-4' },
  { key: 'pipa_sweep', label: 'Sweep', icon: GitCommitVertical, description: 'Sweeping across strings: 1-2-3-4-4-3-2-1' },
  { key: 'pipa_alternating', label: 'Alternating', icon: GitCommitVertical, description: 'Alternating bass-treble: 1-4-2-3-1-4-2-3' },
  { key: 'pipa_cascade', label: 'Cascade', icon: GitCommitVertical, description: 'Cascading pattern: 4-3-2-1-2-3-4-3' }
];

export default function GuitarPanel({ onCreateNoteSequence, disabled, onScaleChange, onStructureTransformChange, structureTransform, onPlaybackOrderChange, currentPlaybackOrder }) {
  const [selectedInstrument, setSelectedInstrument] = useState('guitar');
  const [selectedChordIndex, setSelectedChordIndex] = useState(0);
  const [fretOffset, setFretOffset] = useState(0);
  const [hasSetChromaticOnce, setHasSetChromaticOnce] = useState(false);

  // Get the current chord library and picking techniques based on selected instrument
  const currentChordLibrary = selectedInstrument === 'guitar' ? GUITAR_CHORD_LIBRARY : PIPA_CHORD_LIBRARY;
  const currentPickingTechniques = selectedInstrument === 'guitar' ? guitarPickingTechniques : pipaPickingTechniques;
  
  // This is the core logic for creating the sound.
  // It now takes explicit chordIndex and offset parameters.
  const applyChord = useCallback(async (chordIndex, offset, explicitInstrument = null) => {
    const instrument = explicitInstrument || selectedInstrument;
    const chordLibrary = instrument === 'guitar' ? GUITAR_CHORD_LIBRARY : PIPA_CHORD_LIBRARY;
    const tuning = instrument === 'guitar' ? GUITAR_STANDARD_TUNING : PIPA_STANDARD_TUNING;
    
    const chordToApply = chordLibrary[chordIndex];
    if (disabled || !chordToApply) {
        return;
    }

    // Set scale to Chromatic ONLY on the first chord application
    if (onScaleChange && !hasSetChromaticOnce) {
      onScaleChange('Chromatic');
      setHasSetChromaticOnce(true);
    }
    // Disable auto-rotation on Y-axis and reset Y rotation
    if (onStructureTransformChange && structureTransform) {
      onStructureTransformChange(prevTransform => ({
        ...prevTransform,
        yRotation: 0, // Reset manual Y rotation
        autoRotateY: false, // Disable auto Y rotation
      }));
    }
    
    // Calculate transposed MIDI notes based on fret offset
    const baseMidiNotes = chordToApply.midiNotes.map(note => note + offset);
    const baseFretPositions = chordToApply.fretPositions.map(fret => fret === -1 ? -1 : fret + offset);
    
    // Map instrument strings to X positions: (e.g., String 6 (low E) to String 1 (high E) for guitar)
    const stringXPositions = instrument === 'guitar'
      ? [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5] // 6 strings
      : [-1.5, -0.5, 0.5, 1.5]; // 4 strings for pipa
    
    const noteData = [];
    let noteIndex = 0; // Index for midiNotes array which only contains played notes
    
    // Process each string for the current instrument
    for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
      const fretPosition = baseFretPositions[stringIndex];
      
      // Skip muted strings (-1)
      if (fretPosition !== -1) {
        const midiNote = baseMidiNotes[noteIndex];
        
        // Calculate Y position based on MIDI note (similar to existing scale logic)
        const baseMidiNote = 60; // Middle C
        const yPosition = (midiNote - baseMidiNote) / 12; // Spread over octaves
        
        noteData.push({
          position: {
            x: stringXPositions[stringIndex],
            y: yPosition,
            z: stringXPositions[stringIndex] // Assign Z based on X for panning test
          },
          midiNote: midiNote
        });
        
        noteIndex++;
      }
    }
    
    // Apply the chord to the scene with rhythm pattern preservation
    // Pass true as the third parameter to preserve the current rhythm pattern
    onCreateNoteSequence(noteData, true, true);
  }, [
    disabled, onCreateNoteSequence, onScaleChange, 
    hasSetChromaticOnce, onStructureTransformChange, structureTransform, 
    selectedInstrument // Keep selectedInstrument as a dependency because it's the default
  ]);

  // Changed to handle instrument application, not switching
  const handleInstrumentApply = useCallback((instrument) => {
    // Always set the instrument and apply its chord
    setSelectedInstrument(instrument);
    
    // Update picking technique for the selected instrument
    const pickingTechniques = instrument === 'guitar' ? guitarPickingTechniques : pipaPickingTechniques;
    if (pickingTechniques.length > 0) {
      onPlaybackOrderChange(pickingTechniques[0].key); // Set the first picking technique for the new instrument
    }
    
    // Apply the current chord for this instrument
    setTimeout(() => applyChord(selectedChordIndex, fretOffset, instrument), 50);
  }, [selectedChordIndex, fretOffset, onPlaybackOrderChange, applyChord]);

  // Handler for changing chord index (used by Select component)
  const handleChordChange = useCallback((newIndexStr) => {
    const newIndex = Number(newIndexStr);
    const clampedIndex = Math.max(0, Math.min(currentChordLibrary.length - 1, newIndex));
    setSelectedChordIndex(clampedIndex);
    setTimeout(() => applyChord(clampedIndex, fretOffset), 50);
  }, [fretOffset, applyChord, currentChordLibrary.length]);

  // Handlers for navigating chords with arrow buttons
  const handleNextChord = useCallback(() => {
    const newIndex = (selectedChordIndex + 1) % currentChordLibrary.length;
    setSelectedChordIndex(newIndex);
    setTimeout(() => applyChord(newIndex, fretOffset), 50);
  }, [selectedChordIndex, currentChordLibrary.length, fretOffset, applyChord]);

  const handlePrevChord = useCallback(() => {
    const newIndex = (selectedChordIndex - 1 + currentChordLibrary.length) % currentChordLibrary.length;
    setSelectedChordIndex(newIndex);
    setTimeout(() => applyChord(newIndex, fretOffset), 50);
  }, [selectedChordIndex, currentChordLibrary.length, fretOffset, applyChord]);
  
  // Handle fret offset change
  const handleFretOffsetChange = useCallback((direction) => {
    const newOffset = Math.max(-12, Math.min(12, fretOffset + direction));
    setFretOffset(newOffset);
    setTimeout(() => applyChord(selectedChordIndex, newOffset), 50);
  }, [selectedChordIndex, fretOffset, applyChord]);

  // Handle picking technique change (now directly uses onPlaybackOrderChange)
  const handlePickingTechniqueChange = useCallback((key) => {
    onPlaybackOrderChange(key);
  }, [onPlaybackOrderChange]);

  // Transposed chord logic for display purposes (now an IIFE)
  const transposedChordForDisplay = (() => {
    const chord = currentChordLibrary[selectedChordIndex];
    if (!chord) return null;
    return {
      ...chord,
      fretPositions: chord.fretPositions.map(fret => fret === -1 ? -1 : fret + fretOffset)
    };
  })();

  // Dynamically determine the current tuning for display in Chord Info
  const currentTuningForDisplay = selectedInstrument === 'guitar' ? GUITAR_STANDARD_TUNING : PIPA_STANDARD_TUNING;


  return (
    <Card className="bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.1)] transition-all duration-300 overflow-hidden">
      <CardHeader className="py-2 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-orange-300 flex items-center gap-2 text-xs font-normal uppercase tracking-wider">
            <Music4 className="w-4 h-4 text-orange-400" />
            Chord Builder
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-3">
        {/* Instrument Selection Buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={() => handleInstrumentApply('guitar')}
              variant={selectedInstrument === 'guitar' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 h-8 text-xs font-medium ${
                selectedInstrument === 'guitar'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-amber-900/30 border-amber-500/50 text-amber-400 hover:bg-amber-600/30 hover:text-amber-300'
              }`}
              disabled={disabled}
            >
              Guitar
            </Button>
            <Button
              onClick={() => handleInstrumentApply('pipa')}
              variant={selectedInstrument === 'pipa' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 h-8 text-xs font-medium ${
                selectedInstrument === 'pipa'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-amber-900/30 border-amber-500/50 text-amber-400 hover:bg-amber-600/30 hover:text-amber-300'
              }`}
              disabled={disabled}
            >
              Pipa
            </Button>
          </div>
        </div>

        {/* Chord Selection Controls */}
        <div className="flex items-center justify-between gap-2">
          <Button onClick={handlePrevChord} variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full bg-black/20 border-orange-500/50 text-orange-400 hover:bg-orange-900/50 hover:text-orange-300" disabled={disabled || selectedChordIndex === 0}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Select value={String(selectedChordIndex)} onValueChange={handleChordChange} disabled={disabled}>
            <SelectTrigger className="w-full text-xs h-8 bg-black/20 border-orange-500/50 text-orange-300 focus:ring-orange-500">
              <SelectValue placeholder="Select chord..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-orange-500/50 text-orange-300">
              {currentChordLibrary.map((chord, index) => (
                <SelectItem key={`${selectedInstrument}-${index}`} value={String(index)} className="text-xs focus:bg-orange-800 focus:text-orange-100">{chord.chordName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleNextChord} variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full bg-black/20 border-orange-500/50 text-orange-400 hover:bg-orange-900/50 hover:text-orange-300" disabled={disabled || selectedChordIndex >= currentChordLibrary.length - 1}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Fret Offset Controls */}
        <div className="flex items-center justify-between gap-2">
          <Button onClick={() => handleFretOffsetChange(-1)} variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full bg-black/20 border-orange-500/50 text-orange-400 hover:bg-orange-900/50 hover:text-orange-300" disabled={disabled || fretOffset <= -12}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="flex-grow text-center">
            <div className="text-xs text-slate-300">Fret Offset</div>
            <div className="text-lg font-bold text-slate-100">{fretOffset > 0 ? '+' : ''}{fretOffset}</div>
          </div>
          <Button onClick={() => handleFretOffsetChange(1)} variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full bg-black/20 border-orange-500/50 text-orange-400 hover:bg-orange-900/50 hover:text-orange-300" disabled={disabled || fretOffset >= 12}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Picking Technique Section */}
        <div>
          <label className="text-xs text-orange-300/80 mb-2 block">
            {selectedInstrument === 'guitar' ? 'Picking Technique' : 'Playing Technique'}
          </label>
          <div className="grid grid-cols-6 gap-2">
            {currentPickingTechniques.map((mode) => {
              const IconComponent = mode.icon;
              const isSelected = currentPlaybackOrder === mode.key;
              
              return (
                <div key={mode.key} className="flex flex-col items-center">
                  <Button
                    onClick={() => handlePickingTechniqueChange(mode.key)}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${
                      isSelected
                        ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-orange-500/30'
                        : 'bg-black/20 border-orange-500/50 text-orange-400 hover:bg-orange-900/50 hover:text-orange-300'
                    }`}
                    title={mode.label}
                    disabled={disabled}
                  >
                    <IconComponent className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-orange-200/80 text-center mt-2 p-2 bg-black/30 rounded">
            {currentPickingTechniques.find(m => m.key === currentPlaybackOrder)?.description || 'Select a playing pattern'}
          </div>
        </div>

        {/* Chord Info Display */}
        {transposedChordForDisplay && (
          <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
            <div className="text-sm text-slate-300">
              <strong>Strings played:</strong> {transposedChordForDisplay.stringsPlayed}/{currentTuningForDisplay.length}
            </div>
            <div className="text-sm text-slate-300">
              <strong>Fret span:</strong> {transposedChordForDisplay.fretSpan} frets
            </div>
            <div className="text-xs text-slate-400">
              {transposedChordForDisplay.description}
            </div>
            
            {/* Fret positions display */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-slate-400">Frets:</span>
              {transposedChordForDisplay.fretPositions.map((fret, index) => (
                <span 
                  key={index}
                  className={`px-1 rounded ${fret === -1 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {fret === -1 ? 'X' : fret}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
