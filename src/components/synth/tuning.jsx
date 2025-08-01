export const TUNING_SYSTEMS = {
  '12-TET': {
    name: '12-Tone Equal Temperament',
    description: 'Standard modern tuning. Divides the octave into 12 equal steps of 100 cents.',
    // Pitches for C, C#, D, D#, E, F, F#, G, G#, A, A#, B
    pitches: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
  },
  'Pythagorean': {
    name: 'Pythagorean Tuning',
    description: 'Based on stacking pure fifths (3:2 ratio). Creates bright, open fifths but a dissonant "wolf" interval.',
    // Derived from a stack of fifths (C-G-D-A-E-B-F#...) and fourths.
    pitches: [0, 90.2, 203.9, 294.1, 407.8, 498, 611.7, 702, 792.2, 905.9, 996.1, 1109.8],
  },
  'Andean Pentatonic': {
    name: 'Andean Pentatonic (Mapped)',
    description: 'A 5-note minor pentatonic scale mapped to the 12-tone keyboard.',
    // Maps A-C-D-E-G to the chromatic scale
    pitches: [0, 100, 300, 400, 500, 600, 700, 800, 900, 1000, 1100], // C, C#, E, F, F#, G#, A, A#, B mapped to closest pentatonic tones
  },
  'Indian Shruti': {
    name: 'Indian Shruti Tuning',
    description: 'Based on the 22 microtonal shrutis of Indian classical music, mapped to 12 tones using common swara intervals for ragas.',
    // Selected shruti approximations: Sa(0), Re1(112), Re2(204), Ga1(316), Ga2(386), Ma1(498), Ma2(590), Pa(702), Dha1(814), Dha2(906), Ni1(1018), Ni2(1088)
    pitches: [0, 112, 204, 316, 386, 498, 590, 702, 814, 906, 1018, 1088],
  },
  'Indonesian Slendro': {
    name: 'Indonesian Slendro (Mapped)',
    description: 'A 5-note Gamelan scale with nearly equal steps, mapped to the 12-tone keyboard.',
    // Pitches are ~240 cents apart
    pitches: [0, 240, 240, 480, 480, 720, 720, 960, 960, 960, 1200, 1200], // Mapping to closest degree
  },
  'Indonesian Pelog': {
    name: 'Indonesian Pelog (Mapped)',
    description: 'A 7-note Gamelan scale with distinctly unequal steps, mapped to the 12-tone keyboard.',
    pitches: [0, 137, 274, 274, 538, 661, 661, 792, 944, 944, 944, 1088], // Mapping to closest degree
  },
  'African Mbira': {
    name: 'African Mbira Tuning',
    description: 'Based on the near-equal 7-tone scale of Zimbabwean mbira music, mapped to 12 keys with repeated pitches for a polyrhythmic feel.',
    // Approximate 7-TET steps (~171 cents): mapped with groups for 12 keys
    pitches: [0, 171, 171, 343, 514, 514, 686, 686, 857, 1029, 1029, 1200],
  },
  'Arabic Hijaz': {
    name: 'Arabic Hijaz Tuning',
    description: 'Based on the Hijaz maqam, featuring an augmented second and half-flat notes for a tense, modal sound.',
    // C, Db, E, F, G, Ab, B with adjustments for neutrality (e.g., E at 400, Ab at 800, B at 1100)
    pitches: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
  },
  'Just Intonation': {
    name: 'Just Intonation (Ptolemy)',
    description: 'Based on simple integer frequency ratios for maximum consonance.',
    // Ratios from C: 1/1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8
    pitches: [0, 111.7, 203.9, 315.6, 386.3, 498.0, 590.2, 702.0, 813.7, 884.4, 1017.6, 1088.3],
  },
  '10-TET': {
    name: '10-Tone Equal Temperament',
    description: 'Xen-harmonic tuning dividing the octave into 10 equal steps of 120 cents.',
    pitches: [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1080, 1200], // Mapping 10 tones to 12 keys
  },
};