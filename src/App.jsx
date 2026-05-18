import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Soundfont from "soundfont-player";
import * as VF from "vexflow";


function IconBase({ children, className = "h-4 w-4", viewBox = "0 0 24 24" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function EyeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

function EyeOffIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.1A12.5 12.5 0 0 1 12 5c6.5 0 10 7 10 7a18.7 18.7 0 0 1-3.2 4.2" />
      <path d="M6.2 6.3C3.7 8 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.3-.8" />
    </IconBase>
  );
}

function RefreshIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15.5-6.4L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15.5 6.4L3 16" />
    </IconBase>
  );
}

function VolumeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </IconBase>
  );
}

function StopIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </IconBase>
  );
}

function ResetIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 4v6h6" />
      <path d="M20 20v-6h-6" />
      <path d="M20 9A8 8 0 0 0 6.3 5.7L4 8" />
      <path d="M4 15a8 8 0 0 0 13.7 3.3L20 16" />
    </IconBase>
  );
}

function TrashIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </IconBase>
  );
}

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_OFFSETS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACCIDENTAL_ASCII = { [-1]: "b", 0: "", 1: "#" };
const ACCIDENTAL_DISPLAY = { [-1]: "♭", 0: "", 1: "♯" };
const MIN_NOTES = 2;
const MAX_NOTES = 24;
const TWELVE_TONE_MIN_NOTES = 4;
const TWELVE_TONE_MAX_NOTES = 12;
const MIN_TEMPO = 10;
const MAX_TEMPO = 200;
const DEFAULT_NOTE_COUNT = 4;
const DEFAULT_TEMPO = 50;
const DEFAULT_CHORD_TEMPO = 50;
const MIN_VOLUME = 0;
const MAX_VOLUME = 100;
const DEFAULT_VOLUME = 50;
const DEFAULT_VOICE_VOLUME = 100;
const INTERNAL_VOLUME_BOOST = 9.0;
const SOUNDFONT_GAIN_BOOST = 16.0;
const CHORD_SOUNDFONT_GAIN_BOOST = 8.0;
const DEFAULT_INSTRUMENT = "piano";
const DEFAULT_INTERVAL_KEYS = ["P4", "P5", "P8"];
const DEFAULT_CHORD_INTERVAL_KEYS = ["P4", "P5", "P8"];
const DEFAULT_CLEF_KEYS = ["treble"];
const DEFAULT_DIRECTION_MODE = "random";
const DEFAULT_TRAINER_MODE = "melodic";
const DEFAULT_HARMONIC_RESPONSE_MODE = "givenBass";
const DEFAULT_CHORD_ENTRY_MODE = "gradual";
const DEFAULT_CHORD_REPEAT = true;
const DEFAULT_CHORD_GAP_MODE = "withSilence";
const DEFAULT_CHORD_LINK_MODES = ["common1", "common2", "parallel"];
const DEFAULT_CHORD_BASS_INSTRUMENT = "cello";
const DEFAULT_CHORD_MIDDLE_INSTRUMENT = "viola";
const DEFAULT_CHORD_UPPER_INSTRUMENT = "violin";
const DEFAULT_CHORD_INSTRUMENT_PRESET = "custom";
const HARMONIC_MIN_PAIRS = 1;
const HARMONIC_MAX_PAIRS = 12;
const CHORD_MIN_COUNT = 1;
const CHORD_MAX_COUNT = 12;
const SHORT_DIRECTION_OPTIONS = [
  { key: "random", label: "Libre" },
  { key: "ascending", label: "Ascendente" },
  { key: "descending", label: "Descendente" },
  { key: "mixed", label: "Mixto" },
];

const CHORD_LINK_OPTIONS = [
  { key: "common1", label: "1 nota común" },
  { key: "common2", label: "2 notas comunes" },
  { key: "parallel", label: "Paralelo" },
];

const CHORD_INSTRUMENT_PRESETS = [
  { key: "custom", label: "Personalizado", type: "custom" },
  { key: "random", label: "Aleatorio", type: "random" },
  { key: "randomSustained", label: "Aleatorio sostenido", type: "random", pool: "sustained" },
  { key: "randomPercussive", label: "Aleatorio percutido", type: "random", pool: "percussive" },
  { key: "stringsTrio", label: "Cuerdas: cello · viola · violín", bass: "cello", middle: "viola", upper: "violin", family: "sustained" },
  { key: "lowStrings", label: "Cuerdas graves: contrabajo · cello · viola", bass: "contrabass", middle: "cello", upper: "viola", family: "sustained" },
  { key: "woodwinds", label: "Maderas: fagot · clarinete · flauta", bass: "bassoon", middle: "clarinet", upper: "flute", family: "sustained" },
  { key: "doubleReeds", label: "Dobles lengüetas: fagot · corno inglés · oboe", bass: "bassoon", middle: "englishHorn", upper: "oboe", family: "sustained" },
  { key: "brass", label: "Metales: trombón · corno · trompeta", bass: "trombone", middle: "frenchHorn", upper: "trumpet", family: "sustained" },
  { key: "saxes", label: "Saxofones: barítono · tenor · soprano", bass: "baritoneSax", middle: "tenorSax", upper: "sopranoSax", family: "sustained" },
  { key: "voices", label: "Voces: oohs · oohs · oohs", bass: "voiceOohs", middle: "voiceOohs", upper: "voiceOohs", family: "sustained" },
  { key: "pianoSolo", label: "Piano solo", bass: "piano", middle: "piano", upper: "piano", family: "percussive" },
  { key: "nylonGuitarSolo", label: "Guitarra de nylon solo", bass: "nylonGuitar", middle: "nylonGuitar", upper: "nylonGuitar", family: "percussive" },
  { key: "jazzGuitarSolo", label: "Guitarra jazz solo", bass: "jazzGuitar", middle: "jazzGuitar", upper: "jazzGuitar", family: "percussive" },
  { key: "harpSolo", label: "Arpa solo", bass: "orchestralHarp", middle: "orchestralHarp", upper: "orchestralHarp", family: "percussive" },
  { key: "marimbaSolo", label: "Marimba solo", bass: "marimba", middle: "marimba", upper: "marimba", family: "percussive" },
  { key: "vibraphoneSolo", label: "Vibráfono solo", bass: "vibraphone", middle: "vibraphone", upper: "vibraphone", family: "percussive" },
  { key: "celestaSolo", label: "Celesta solo", bass: "celesta", middle: "celesta", upper: "celesta", family: "percussive" },
];

function getChordInstrumentPreset(key) {
  return CHORD_INSTRUMENT_PRESETS.find((preset) => preset.key === key) ?? CHORD_INSTRUMENT_PRESETS[0];
}

function resolveChordInstrumentPreset(key) {
  const preset = getChordInstrumentPreset(key);
  if (!preset || preset.type === "custom") return null;
  if (preset.type === "random") {
    const pool = CHORD_INSTRUMENT_PRESETS.filter((item) => item.bass && item.middle && item.upper && (!preset.pool || item.family === preset.pool));
    return randomItem(pool.length ? pool : CHORD_INSTRUMENT_PRESETS.filter((item) => item.bass));
  }
  return preset;
}
const SETTINGS_KEY = "intervalTrainer.settings.v13";
const STATS_KEY = "intervalTrainer.stats.v11";
const MARKS_KEY = "intervalTrainer.marks.v12";
const SOUNDFONT_LIBRARY = "MusyngKite";
const SOUNDFONT_BASE_URL = "https://gleitz.github.io/midi-js-soundfonts";
const PITCH_HISTORY_LEN = 32;
const TUNER_RANGE_CENTS = 50;
const IN_TUNE_THRESHOLD = 10;
const TUNER_HOLD_OPTIONS = [0.5, 1, 1.5, 2, 3, 4];
const TUNER_MICRO_GAP_MS = 300;
const TUNER_COMPLETE_DELAY_MS = 560;
const TUNER_ANALYSIS_INTERVAL_MS = 40;
const TUNER_YIN_THRESHOLD = 0.13;
const PITCH_SMOOTH_ALPHA = 0.35;

// Registros reales en notación científica: Do central = C4 = MIDI 60.
// Las claves normales no transponen el sonido. Las claves 8va/15ma/8vb sí
// usan un registro sonoro desplazado, pero se escriben en el pentagrama base
// mediante displayOctaveShift para que lo visual y lo auditivo correspondan.
const CLEFS = [
  { key: "treble", label: "Clave de Sol", symbol: "𝄞", tag: "", vex: "treble", minMidi: 55, maxMidi: 84, centerMinMidi: 60, centerMaxMidi: 76, staffRefLetter: "E", staffRefOctave: 4, staffRefY: 100 },
  { key: "treble8va", label: "Clave de Sol 8va alta", symbol: "𝄞", tag: "8va", clefAnnotation: "8va", vex: "treble", displayOctaveShift: -1, minMidi: 67, maxMidi: 96, centerMinMidi: 72, centerMaxMidi: 88, staffRefLetter: "E", staffRefOctave: 4, staffRefY: 100 },
  { key: "treble15ma", label: "Clave de Sol 15ma alta", symbol: "𝄞", tag: "15ma", clefAnnotation: "15ma", vex: "treble", displayOctaveShift: -2, minMidi: 79, maxMidi: 108, centerMinMidi: 84, centerMaxMidi: 100, staffRefLetter: "E", staffRefOctave: 4, staffRefY: 100 },
  { key: "soprano", label: "Clave de Do en I", symbol: "𝄡", tag: "I", vex: "soprano", minMidi: 60, maxMidi: 84, centerMinMidi: 64, centerMaxMidi: 76, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 100 },
  { key: "mezzo", label: "Clave de Do en II", symbol: "𝄡", tag: "II", vex: "mezzo-soprano", minMidi: 57, maxMidi: 81, centerMinMidi: 60, centerMaxMidi: 72, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 86 },
  { key: "alto", label: "Clave de Do en III", symbol: "𝄡", tag: "III", vex: "alto", minMidi: 53, maxMidi: 77, centerMinMidi: 57, centerMaxMidi: 69, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 72 },
  { key: "tenor", label: "Clave de Do en IV", symbol: "𝄡", tag: "IV", vex: "tenor", minMidi: 48, maxMidi: 72, centerMinMidi: 52, centerMaxMidi: 64, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 58 },
  { key: "baritoneF", label: "Clave de Fa en III", symbol: "𝄢", tag: "", vex: "baritone-f", minMidi: 43, maxMidi: 67, centerMinMidi: 47, centerMaxMidi: 60, staffRefLetter: "F", staffRefOctave: 3, staffRefY: 72 },
  { key: "bass", label: "Clave de Fa", symbol: "𝄢", tag: "", vex: "bass", minMidi: 36, maxMidi: 64, centerMinMidi: 40, centerMaxMidi: 55, staffRefLetter: "G", staffRefOctave: 2, staffRefY: 100 },
  { key: "bass8vb", label: "Clave de Fa 8va baja", symbol: "𝄢", tag: "8vb", clefAnnotation: "8vb", vex: "bass", displayOctaveShift: 1, minMidi: 24, maxMidi: 52, centerMinMidi: 28, centerMaxMidi: 43, staffRefLetter: "G", staffRefOctave: 2, staffRefY: 100 },
];

const INTERVAL_DEFINITIONS = [
  { key: "m2", short: "2m", name: "Segunda menor", semitones: 1, diatonicSteps: 1 },
  { key: "M2", short: "2M", name: "Segunda mayor", semitones: 2, diatonicSteps: 1 },
  { key: "m3", short: "3m", name: "Tercera menor", semitones: 3, diatonicSteps: 2 },
  { key: "M3", short: "3M", name: "Tercera mayor", semitones: 4, diatonicSteps: 2 },
  { key: "P4", short: "4J", name: "Cuarta justa", semitones: 5, diatonicSteps: 3 },
  { key: "TT", short: "TT", name: "Tritono", semitones: 6, diatonicSteps: 3, altDiatonicSteps: 4 },
  { key: "P5", short: "5J", name: "Quinta justa", semitones: 7, diatonicSteps: 4 },
  { key: "m6", short: "6m", name: "Sexta menor", semitones: 8, diatonicSteps: 5 },
  { key: "M6", short: "6M", name: "Sexta mayor", semitones: 9, diatonicSteps: 5 },
  { key: "m7", short: "7m", name: "Séptima menor", semitones: 10, diatonicSteps: 6 },
  { key: "M7", short: "7M", name: "Séptima mayor", semitones: 11, diatonicSteps: 6 },
  { key: "P8", short: "8J", name: "Octava justa", semitones: 12, diatonicSteps: 7 },
];

const MODEL_PATTERNS = [
  // Nivel I · cuartas, quintas y octavas
  { id: "l1-4j4j", label: "4J + 4J", steps: [{ intervalKey: "P4" }, { intervalKey: "P4" }] },
  { id: "l1-5j5j", label: "5J + 5J", steps: [{ intervalKey: "P5" }, { intervalKey: "P5" }] },
  { id: "l1-5up4down", label: "5J↗ + 4J↘", steps: [{ intervalKey: "P5", direction: 1 }, { intervalKey: "P4", direction: -1 }] },
  { id: "l1-5down4up", label: "5J↘ + 4J↗", steps: [{ intervalKey: "P5", direction: -1 }, { intervalKey: "P4", direction: 1 }] },
  { id: "l1-4up5down", label: "4J↗ + 5J↘", steps: [{ intervalKey: "P4", direction: 1 }, { intervalKey: "P5", direction: -1 }] },
  { id: "l1-4down5up", label: "4J↘ + 5J↗", steps: [{ intervalKey: "P4", direction: -1 }, { intervalKey: "P5", direction: 1 }] },
  { id: "l1-4j4j4j", label: "4J + 4J + 4J", steps: [{ intervalKey: "P4" }, { intervalKey: "P4" }, { intervalKey: "P4" }] },
  { id: "l1-5j5j5j", label: "5J + 5J + 5J", steps: [{ intervalKey: "P5" }, { intervalKey: "P5" }, { intervalKey: "P5" }] },

  // Nivel II · segundas mayores y menores
  { id: "l2-2Mup2Mup", label: "2M↗ + 2M↗", steps: [{ intervalKey: "M2", direction: 1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l2-2Mup2mup", label: "2M↗ + 2m↗", steps: [{ intervalKey: "M2", direction: 1 }, { intervalKey: "m2", direction: 1 }] },
  { id: "l2-2mup2Mup", label: "2m↗ + 2M↗", steps: [{ intervalKey: "m2", direction: 1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l2-2mup2mup", label: "2m↗ + 2m↗", steps: [{ intervalKey: "m2", direction: 1 }, { intervalKey: "m2", direction: 1 }] },
  { id: "l2-2Mup2mdown", label: "2M↗ + 2m↘", steps: [{ intervalKey: "M2", direction: 1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l2-2mup2Mdown", label: "2m↗ + 2M↘", steps: [{ intervalKey: "m2", direction: 1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l2-2Mdown2Mdown", label: "2M↘ + 2M↘", steps: [{ intervalKey: "M2", direction: -1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l2-2Mdown2mdown", label: "2M↘ + 2m↘", steps: [{ intervalKey: "M2", direction: -1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l2-2mdown2Mdown", label: "2m↘ + 2M↘", steps: [{ intervalKey: "m2", direction: -1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l2-2mdown2mdown", label: "2m↘ + 2m↘", steps: [{ intervalKey: "m2", direction: -1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l2-2Mdown2mup", label: "2M↘ + 2m↗", steps: [{ intervalKey: "M2", direction: -1 }, { intervalKey: "m2", direction: 1 }] },
  { id: "l2-2mdown2Mup", label: "2m↘ + 2M↗", steps: [{ intervalKey: "m2", direction: -1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l2-chromatic-up", label: "Escala cromática ↗", steps: [{ intervalKey: "m2", direction: 1 }, { intervalKey: "m2", direction: 1 }, { intervalKey: "m2", direction: 1 }] },
  { id: "l2-chromatic-down", label: "Escala cromática ↘", steps: [{ intervalKey: "m2", direction: -1 }, { intervalKey: "m2", direction: -1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l2-whole-tone-up", label: "Escala de tonos enteros ↗", steps: [{ intervalKey: "M2", direction: 1 }, { intervalKey: "M2", direction: 1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l2-whole-tone-down", label: "Escala de tonos enteros ↘", steps: [{ intervalKey: "M2", direction: -1 }, { intervalKey: "M2", direction: -1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l2-4j2M", label: "4J + 2M", steps: [{ intervalKey: "P4" }, { intervalKey: "M2" }] },
  { id: "l2-4j2m", label: "4J + 2m", steps: [{ intervalKey: "P4" }, { intervalKey: "m2" }] },
  { id: "l2-5j2M", label: "5J + 2M", steps: [{ intervalKey: "P5" }, { intervalKey: "M2" }] },
  { id: "l2-5j2m", label: "5J + 2m", steps: [{ intervalKey: "P5" }, { intervalKey: "m2" }] },
  { id: "l2-4j2m4j", label: "4J + 2m + 4J", steps: [{ intervalKey: "P4" }, { intervalKey: "m2" }, { intervalKey: "P4" }] },
  { id: "l2-5j2m5j", label: "5J + 2m + 5J", steps: [{ intervalKey: "P5" }, { intervalKey: "m2" }, { intervalKey: "P5" }] },
  { id: "l2-4j2M4j", label: "4J + 2M + 4J", steps: [{ intervalKey: "P4" }, { intervalKey: "M2" }, { intervalKey: "P4" }] },
  { id: "l2-5j2M5j", label: "5J + 2M + 5J", steps: [{ intervalKey: "P5" }, { intervalKey: "M2" }, { intervalKey: "P5" }] },
  { id: "l2-4j2M5j", label: "4J + 2M + 5J", steps: [{ intervalKey: "P4" }, { intervalKey: "M2" }, { intervalKey: "P5" }] },
  { id: "l2-4j2m5j", label: "4J + 2m + 5J", steps: [{ intervalKey: "P4" }, { intervalKey: "m2" }, { intervalKey: "P5" }] },

  // Nivel III · terceras mayores y menores
  { id: "l3-3M3M", label: "3M + 3M · aumentado", steps: [{ intervalKey: "M3" }, { intervalKey: "M3" }] },
  { id: "l3-3m3m", label: "3m + 3m · disminuido", steps: [{ intervalKey: "m3" }, { intervalKey: "m3" }] },
  { id: "l3-3Mup3mdown", label: "3M↗ + 3m↘", steps: [{ intervalKey: "M3", direction: 1 }, { intervalKey: "m3", direction: -1 }] },
  { id: "l3-3Mdown3mup", label: "3M↘ + 3m↗", steps: [{ intervalKey: "M3", direction: -1 }, { intervalKey: "m3", direction: 1 }] },
  { id: "l3-3mup3Mdown", label: "3m↗ + 3M↘", steps: [{ intervalKey: "m3", direction: 1 }, { intervalKey: "M3", direction: -1 }] },
  { id: "l3-3mdown3Mup", label: "3m↘ + 3M↗", steps: [{ intervalKey: "m3", direction: -1 }, { intervalKey: "M3", direction: 1 }] },
  { id: "l3-aum4j", label: "aum. + 4J", steps: [{ intervalKey: "M3" }, { intervalKey: "M3" }, { intervalKey: "P4" }] },
  { id: "l3-aum5j", label: "aum. + 5J", steps: [{ intervalKey: "M3" }, { intervalKey: "M3" }, { intervalKey: "P5" }] },
  { id: "l3-dis4j", label: "dis. + 4J", steps: [{ intervalKey: "m3" }, { intervalKey: "m3" }, { intervalKey: "P4" }] },
  { id: "l3-dis5j", label: "dis. + 5J", steps: [{ intervalKey: "m3" }, { intervalKey: "m3" }, { intervalKey: "P5" }] },
  { id: "l3-3m4j3m", label: "3m + 4J + 3m", steps: [{ intervalKey: "m3" }, { intervalKey: "P4" }, { intervalKey: "m3" }] },
  { id: "l3-3m5j3m", label: "3m + 5J + 3m", steps: [{ intervalKey: "m3" }, { intervalKey: "P5" }, { intervalKey: "m3" }] },
  { id: "l3-3M4j3M", label: "3M + 4J + 3M", steps: [{ intervalKey: "M3" }, { intervalKey: "P4" }, { intervalKey: "M3" }] },
  { id: "l3-3M5j3M", label: "3M + 5J + 3M", steps: [{ intervalKey: "M3" }, { intervalKey: "P5" }, { intervalKey: "M3" }] },

  // Nivel IV · tritono
  { id: "l4-tt2mtt", label: "TT + 2m + TT", steps: [{ intervalKey: "TT" }, { intervalKey: "m2" }, { intervalKey: "TT" }] },
  { id: "l4-tt2Mtt", label: "TT + 2M + TT", steps: [{ intervalKey: "TT" }, { intervalKey: "M2" }, { intervalKey: "TT" }] },
  { id: "l4-tt4j", label: "TT + 4J", steps: [{ intervalKey: "TT" }, { intervalKey: "P4" }] },
  { id: "l4-tt5j", label: "TT + 5J", steps: [{ intervalKey: "TT" }, { intervalKey: "P5" }] },
  { id: "l4-ttup5down", label: "TT↗ + 5J↘", steps: [{ intervalKey: "TT", direction: 1 }, { intervalKey: "P5", direction: -1 }] },
  { id: "l4-ttdown5up", label: "TT↘ + 5J↗", steps: [{ intervalKey: "TT", direction: -1 }, { intervalKey: "P5", direction: 1 }] },
  { id: "l4-ttup4down", label: "TT↗ + 4J↘", steps: [{ intervalKey: "TT", direction: 1 }, { intervalKey: "P4", direction: -1 }] },
  { id: "l4-ttdown4up", label: "TT↘ + 4J↗", steps: [{ intervalKey: "TT", direction: -1 }, { intervalKey: "P4", direction: 1 }] },
  { id: "l4-5upTTdown", label: "5J↗ + TT↘", steps: [{ intervalKey: "P5", direction: 1 }, { intervalKey: "TT", direction: -1 }] },
  { id: "l4-5downTTup", label: "5J↘ + TT↗", steps: [{ intervalKey: "P5", direction: -1 }, { intervalKey: "TT", direction: 1 }] },
  { id: "l4-4upTTdown", label: "4J↗ + TT↘", steps: [{ intervalKey: "P4", direction: 1 }, { intervalKey: "TT", direction: -1 }] },
  { id: "l4-4downTTup", label: "4J↘ + TT↗", steps: [{ intervalKey: "P4", direction: -1 }, { intervalKey: "TT", direction: 1 }] },

  // Nivel V · sextas mayores y menores
  { id: "l5-6m6m", label: "6m + 6m · aumentado", steps: [{ intervalKey: "m6" }, { intervalKey: "m6" }] },
  { id: "l5-6M6M", label: "6M + 6M · disminuido", steps: [{ intervalKey: "M6" }, { intervalKey: "M6" }] },
  { id: "l5-6Mup6mdown", label: "6M↗ + 6m↘", steps: [{ intervalKey: "M6", direction: 1 }, { intervalKey: "m6", direction: -1 }] },
  { id: "l5-6Mdown6mup", label: "6M↘ + 6m↗", steps: [{ intervalKey: "M6", direction: -1 }, { intervalKey: "m6", direction: 1 }] },
  { id: "l5-6mup6Mdown", label: "6m↗ + 6M↘", steps: [{ intervalKey: "m6", direction: 1 }, { intervalKey: "M6", direction: -1 }] },
  { id: "l5-6mdown6Mup", label: "6m↘ + 6M↗", steps: [{ intervalKey: "m6", direction: -1 }, { intervalKey: "M6", direction: 1 }] },
  { id: "l5-6m3m", label: "6m + 3m", steps: [{ intervalKey: "m6" }, { intervalKey: "m3" }] },
  { id: "l5-6M3M", label: "6M + 3M", steps: [{ intervalKey: "M6" }, { intervalKey: "M3" }] },
  { id: "l5-6m2m", label: "6m + 2m", steps: [{ intervalKey: "m6" }, { intervalKey: "m2" }] },
  { id: "l5-6m2M", label: "6m + 2M", steps: [{ intervalKey: "m6" }, { intervalKey: "M2" }] },
  { id: "l5-6m4j", label: "6m + 4J", steps: [{ intervalKey: "m6" }, { intervalKey: "P4" }] },
  { id: "l5-6mTT", label: "6m + TT", steps: [{ intervalKey: "m6" }, { intervalKey: "TT" }] },
  { id: "l5-6M2m", label: "6M + 2m", steps: [{ intervalKey: "M6" }, { intervalKey: "m2" }] },
  { id: "l5-6M2M", label: "6M + 2M", steps: [{ intervalKey: "M6" }, { intervalKey: "M2" }] },
  { id: "l5-6M4j", label: "6M + 4J", steps: [{ intervalKey: "M6" }, { intervalKey: "P4" }] },

  // Nivel VI · séptimas mayores y menores
  { id: "l6-7m7m", label: "7m + 7m", steps: [{ intervalKey: "m7" }, { intervalKey: "m7" }] },
  { id: "l6-7M7M", label: "7M + 7M", steps: [{ intervalKey: "M7" }, { intervalKey: "M7" }] },
  { id: "l6-7mup2Mdown", label: "7m↗ + 2M↘", steps: [{ intervalKey: "m7", direction: 1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l6-2Mdown7mup", label: "2M↘ + 7m↗", steps: [{ intervalKey: "M2", direction: -1 }, { intervalKey: "m7", direction: 1 }] },
  { id: "l6-7mup2mdown", label: "7m↗ + 2m↘", steps: [{ intervalKey: "m7", direction: 1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l6-2mdown7mup", label: "2m↘ + 7m↗", steps: [{ intervalKey: "m2", direction: -1 }, { intervalKey: "m7", direction: 1 }] },
  { id: "l6-7Mup2Mdown", label: "7M↗ + 2M↘", steps: [{ intervalKey: "M7", direction: 1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l6-7Mup2mdown", label: "7M↗ + 2m↘", steps: [{ intervalKey: "M7", direction: 1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l6-2mdown7Mup", label: "2m↘ + 7M↗", steps: [{ intervalKey: "m2", direction: -1 }, { intervalKey: "M7", direction: 1 }] },
  { id: "l6-7mdown2Mup", label: "7m↘ + 2M↗", steps: [{ intervalKey: "m7", direction: -1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l6-2Mup7mdown", label: "2M↗ + 7m↘", steps: [{ intervalKey: "M2", direction: 1 }, { intervalKey: "m7", direction: -1 }] },
  { id: "l6-7Mdown2Mup", label: "7M↘ + 2M↗", steps: [{ intervalKey: "M7", direction: -1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l6-2mup7mdown", label: "2m↗ + 7m↘", steps: [{ intervalKey: "m2", direction: 1 }, { intervalKey: "m7", direction: -1 }] },
  { id: "l6-7Mdown2mup", label: "7M↘ + 2m↗", steps: [{ intervalKey: "M7", direction: -1 }, { intervalKey: "m2", direction: 1 }] },
  { id: "l6-2mup7Mdown", label: "2m↗ + 7M↘", steps: [{ intervalKey: "m2", direction: 1 }, { intervalKey: "M7", direction: -1 }] },
  { id: "l6-7mup7Mdown", label: "7m↗ + 7M↘", steps: [{ intervalKey: "m7", direction: 1 }, { intervalKey: "M7", direction: -1 }] },
  { id: "l6-7mdown7Mup", label: "7m↘ + 7M↗", steps: [{ intervalKey: "m7", direction: -1 }, { intervalKey: "M7", direction: 1 }] },
  { id: "l6-7Mup7mdown", label: "7M↗ + 7m↘", steps: [{ intervalKey: "M7", direction: 1 }, { intervalKey: "m7", direction: -1 }] },
  { id: "l6-7Mdown7mup", label: "7M↘ + 7m↗", steps: [{ intervalKey: "M7", direction: -1 }, { intervalKey: "m7", direction: 1 }] },
  { id: "l6-7m2m", label: "7m + 2m", steps: [{ intervalKey: "m7" }, { intervalKey: "m2" }] },
  { id: "l6-7m3m", label: "7m + 3m", steps: [{ intervalKey: "m7" }, { intervalKey: "m3" }] },
  { id: "l6-7m3M", label: "7m + 3M", steps: [{ intervalKey: "m7" }, { intervalKey: "M3" }] },
  { id: "l6-7m4j", label: "7m + 4J", steps: [{ intervalKey: "m7" }, { intervalKey: "P4" }] },
  { id: "l6-7M2M", label: "7M + 2M", steps: [{ intervalKey: "M7" }, { intervalKey: "M2" }] },
  { id: "l6-7M3m", label: "7M + 3m", steps: [{ intervalKey: "M7" }, { intervalKey: "m3" }] },
  { id: "l6-7M3M", label: "7M + 3M", steps: [{ intervalKey: "M7" }, { intervalKey: "M3" }] },
  { id: "l6-7M4j", label: "7M + 4J", steps: [{ intervalKey: "M7" }, { intervalKey: "P4" }] },
];

const INSTRUMENTS = [
  // Voces
  { value: "voiceOohs", label: "Voz Oohs", soundfont: "voice_oohs", fallback: "voice", sustain: true },
  { value: "synthVoice", label: "Voz sintética", soundfont: "synth_voice", fallback: "voice", sustain: true },

  // Teclados
  { value: "piano", label: "Piano acústico", soundfont: "acoustic_grand_piano", fallback: "piano", sustain: false },
  { value: "brightPiano", label: "Piano brillante", soundfont: "bright_acoustic_piano", fallback: "piano", sustain: false },
  { value: "electricPiano1", label: "Piano eléctrico I", soundfont: "electric_piano_1", fallback: "piano", sustain: false },
  { value: "electricPiano2", label: "Piano eléctrico II", soundfont: "electric_piano_2", fallback: "piano", sustain: false },
  { value: "harpsichord", label: "Clave / harpsichord", soundfont: "harpsichord", fallback: "piano", sustain: false },
  { value: "clavinet", label: "Clavinet", soundfont: "clavinet", fallback: "piano", sustain: false },
  { value: "celesta", label: "Celesta", soundfont: "celesta", fallback: "mallet", sustain: false },
  { value: "musicBox", label: "Caja de música", soundfont: "music_box", fallback: "mallet", sustain: false },

  // Órganos populares / de lengüeta
  { value: "drawbarOrgan", label: "Órgano drawbar", soundfont: "drawbar_organ", fallback: "organ", sustain: true },
  { value: "percussiveOrgan", label: "Órgano percusivo", soundfont: "percussive_organ", fallback: "organ", sustain: true },
  { value: "rockOrgan", label: "Órgano rock", soundfont: "rock_organ", fallback: "organ", sustain: true },
  { value: "reedOrgan", label: "Órgano de lengüeta", soundfont: "reed_organ", fallback: "organ", sustain: true },
  { value: "accordion", label: "Acordeón", soundfont: "accordion", fallback: "organ", sustain: true },
  { value: "harmonica", label: "Armónica", soundfont: "harmonica", fallback: "voice", sustain: true },

  // Cuerdas orquestales
  { value: "strings", label: "Cuerdas", soundfont: "string_ensemble_2", fallback: "strings", sustain: true },
  { value: "violin", label: "Violín", soundfont: "violin", fallback: "strings", sustain: true },
  { value: "viola", label: "Viola", soundfont: "viola", fallback: "strings", sustain: true },
  { value: "cello", label: "Violonchelo", soundfont: "cello", fallback: "strings", sustain: true },
  { value: "contrabass", label: "Contrabajo", soundfont: "contrabass", fallback: "strings", sustain: true },
  { value: "pizzicatoStrings", label: "Cuerdas pizzicato", soundfont: "pizzicato_strings", fallback: "mallet", sustain: false },
  { value: "tremoloStrings", label: "Cuerdas trémolo", soundfont: "tremolo_strings", fallback: "strings", sustain: true },
  { value: "orchestralHarp", label: "Arpa orquestal", soundfont: "orchestral_harp", fallback: "piano", sustain: false },

  // Maderas
  { value: "piccolo", label: "Piccolo", soundfont: "piccolo", fallback: "voice", sustain: true },
  { value: "flute", label: "Flauta", soundfont: "flute", fallback: "voice", sustain: true },
  { value: "recorder", label: "Flauta dulce", soundfont: "recorder", fallback: "voice", sustain: true },
  { value: "oboe", label: "Oboe", soundfont: "oboe", fallback: "voice", sustain: true },
  { value: "englishHorn", label: "Corno inglés", soundfont: "english_horn", fallback: "voice", sustain: true },
  { value: "clarinet", label: "Clarinete", soundfont: "clarinet", fallback: "voice", sustain: true },
  { value: "bassoon", label: "Fagot", soundfont: "bassoon", fallback: "voice", sustain: true },
  { value: "sopranoSax", label: "Sax soprano", soundfont: "soprano_sax", fallback: "voice", sustain: true },
  { value: "altoSax", label: "Sax alto", soundfont: "alto_sax", fallback: "voice", sustain: true },
  { value: "tenorSax", label: "Sax tenor", soundfont: "tenor_sax", fallback: "voice", sustain: true },
  { value: "baritoneSax", label: "Sax barítono", soundfont: "baritone_sax", fallback: "voice", sustain: true },

  // Metales
  { value: "trumpet", label: "Trompeta", soundfont: "trumpet", fallback: "organ", sustain: true },
  { value: "trombone", label: "Trombón", soundfont: "trombone", fallback: "organ", sustain: true },
  { value: "tuba", label: "Tuba", soundfont: "tuba", fallback: "organ", sustain: true },
  { value: "frenchHorn", label: "Corno francés", soundfont: "french_horn", fallback: "organ", sustain: true },
  { value: "brassSection", label: "Sección de metales", soundfont: "brass_section", fallback: "organ", sustain: true },
  { value: "mutedTrumpet", label: "Trompeta con sordina", soundfont: "muted_trumpet", fallback: "organ", sustain: true },

  // Percusión afinada
  { value: "timpani", label: "Timbales sinfónicos", soundfont: "timpani", fallback: "mallet", sustain: false },
  { value: "glockenspiel", label: "Glockenspiel", soundfont: "glockenspiel", fallback: "mallet", sustain: false },
  { value: "xylophone", label: "Xilófono", soundfont: "xylophone", fallback: "mallet", sustain: false },
  { value: "marimba", label: "Marimba", soundfont: "marimba", fallback: "mallet", sustain: false },
  { value: "vibraphone", label: "Vibráfono", soundfont: "vibraphone", fallback: "mallet", sustain: false },
  { value: "tubularBells", label: "Campanas tubulares", soundfont: "tubular_bells", fallback: "mallet", sustain: true },

  // Guitarras y bajos populares
  { value: "nylonGuitar", label: "Guitarra de nylon", soundfont: "acoustic_guitar_nylon", fallback: "piano", sustain: false },
  { value: "steelGuitar", label: "Guitarra acústica", soundfont: "acoustic_guitar_steel", fallback: "piano", sustain: false },
  { value: "jazzGuitar", label: "Guitarra jazz", soundfont: "electric_guitar_jazz", fallback: "piano", sustain: false },
  { value: "cleanGuitar", label: "Guitarra eléctrica clean", soundfont: "electric_guitar_clean", fallback: "piano", sustain: false },
  { value: "mutedGuitar", label: "Guitarra eléctrica muted", soundfont: "electric_guitar_muted", fallback: "piano", sustain: false },
  { value: "overdrivenGuitar", label: "Guitarra overdrive", soundfont: "overdriven_guitar", fallback: "piano", sustain: false },
  { value: "distortionGuitar", label: "Guitarra distorsionada", soundfont: "distortion_guitar", fallback: "piano", sustain: false },
  { value: "acousticBass", label: "Bajo acústico", soundfont: "acoustic_bass", fallback: "bass", sustain: false },
  { value: "fingerBass", label: "Bajo eléctrico finger", soundfont: "electric_bass_finger", fallback: "bass", sustain: false },
  { value: "pickBass", label: "Bajo eléctrico pick", soundfont: "electric_bass_pick", fallback: "bass", sustain: false },
  { value: "fretlessBass", label: "Bajo fretless", soundfont: "fretless_bass", fallback: "bass", sustain: false },

  // Otros colores populares / sintéticos
  { value: "panFlute", label: "Flauta de pan", soundfont: "pan_flute", fallback: "voice", sustain: true },
  { value: "ocarina", label: "Ocarina", soundfont: "ocarina", fallback: "voice", sustain: true },
  { value: "leadSaw", label: "Synth lead saw", soundfont: "lead_2_sawtooth", fallback: "organ", sustain: true },
  { value: "warmPad", label: "Pad cálido", soundfont: "pad_2_warm", fallback: "strings", sustain: true },
];

function getInstrumentConfig(value) {
  return INSTRUMENTS.find((item) => item.value === value) ?? INSTRUMENTS.find((item) => item.value === DEFAULT_INSTRUMENT) ?? INSTRUMENTS[0];
}

function sanitizeChordLinkModes(modes) {
  const valid = CHORD_LINK_OPTIONS.map((item) => item.key);
  const cleaned = [...new Set(Array.isArray(modes) ? modes : [])].filter((key) => valid.includes(key));
  return cleaned.length ? cleaned : DEFAULT_CHORD_LINK_MODES;
}

const PIANO_KEYS = [
  { pc: 0, name: "C", display: "Do", type: "white" },
  { pc: 1, name: "C#", display: "Do♯/Re♭", type: "black", left: "9%" },
  { pc: 2, name: "D", display: "Re", type: "white" },
  { pc: 3, name: "Eb", display: "Re♯/Mi♭", type: "black", left: "23.2%" },
  { pc: 4, name: "E", display: "Mi", type: "white" },
  { pc: 5, name: "F", display: "Fa", type: "white" },
  { pc: 6, name: "F#", display: "Fa♯/Sol♭", type: "black", left: "51.7%" },
  { pc: 7, name: "G", display: "Sol", type: "white" },
  { pc: 8, name: "Ab", display: "Sol♯/La♭", type: "black", left: "65.9%" },
  { pc: 9, name: "A", display: "La", type: "white" },
  { pc: 10, name: "Bb", display: "La♯/Si♭", type: "black", left: "80.2%" },
  { pc: 11, name: "B", display: "Si", type: "white" },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickWithOctaveDeprioritized(items, getIntervalKey = (item) => item?.intervalKey ?? item?.key) {
  if (!Array.isArray(items) || !items.length) return undefined;
  const nonOctaveItems = items.filter((item) => getIntervalKey(item) !== "P8");
  if (nonOctaveItems.length && nonOctaveItems.length < items.length) {
    return Math.random() < 0.86 ? randomItem(nonOctaveItems) : randomItem(items);
  }
  return randomItem(items);
}

function pickIntervalDefinition(intervals) {
  return pickWithOctaveDeprioritized(intervals, (interval) => interval?.key);
}

function shuffleWithOctaveDeprioritized(items, getIntervalKey = (item) => item?.intervalKey ?? item?.key) {
  return [...(items ?? [])]
    .map((item) => ({ item, sort: Math.random() + (getIntervalKey(item) === "P8" ? 0.75 : 0) }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function weightedRandomItem(items, getWeight = () => 1) {
  if (!Array.isArray(items) || !items.length) return undefined;
  const weighted = items.map((item) => ({ item, weight: Math.max(0, Number(getWeight(item)) || 0) }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return randomItem(items);
  let cursor = Math.random() * total;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.item;
  }
  return weighted[weighted.length - 1]?.item ?? randomItem(items);
}

function shuffleWeighted(items, getWeight = () => 1) {
  return [...(items ?? [])]
    .map((item) => ({ item, sort: Math.random() / Math.max(0.05, Number(getWeight(item)) || 0.05) }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

const GENERATION_HISTORY = {
  melodic: null,
  harmonic: null,
  chords: null,
};

function noteTransitionIntervalKey(previous, current, allowedIntervalKeys = []) {
  if (!previous || !current) return null;
  const diff = Math.abs(current.midi - previous.midi);
  return getIntervalBySemitones(diff, allowedIntervalKeys)?.key ?? null;
}

function summarizeIntervalCounts(keys = []) {
  const counts = {};
  keys.filter(Boolean).forEach((key) => {
    counts[key] = (counts[key] ?? 0) + 1;
  });
  const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { counts, dominant: ordered[0]?.[0] ?? null };
}

function makeSequenceProfile(sequence, allowedIntervalKeys = []) {
  const keys = [];
  const directions = [];
  for (let i = 1; i < (sequence?.length ?? 0); i += 1) {
    const previous = sequence[i - 1];
    const current = sequence[i];
    keys.push(noteTransitionIntervalKey(previous, current, allowedIntervalKeys));
    directions.push(current?.midi >= previous?.midi ? 1 : -1);
  }
  return { ...summarizeIntervalCounts(keys), directions };
}

function perfectStackFocusActive(intervalKeys = []) {
  const allowed = new Set(sanitizeIntervalSelection(intervalKeys));
  return allowed.has("P4") || allowed.has("P5") || allowed.has("P8");
}

function intervalContrastWeight(intervalKey, previousProfile, amount = 0.35) {
  if (!intervalKey || !previousProfile?.dominant) return 1;
  return intervalKey === previousProfile.dominant ? amount : 1.25;
}

function melodicCandidateWeight(candidate, sequence, previousProfile = null) {
  const key = candidate?.intervalKey;
  if (!key) return 1;
  let weight = key === "P8" ? 0.16 : 1;
  const previousKey = sequence?.length >= 2 ? noteTransitionIntervalKey(sequence[sequence.length - 2], sequence[sequence.length - 1]) : null;
  if ((previousKey === "P4" || previousKey === "P5") && key === previousKey) weight *= 3.2;
  if ((previousKey === "P4" || previousKey === "P5") && (key === "P4" || key === "P5") && key !== previousKey) weight *= 0.58;
  weight *= intervalContrastWeight(key, previousProfile, 0.42);
  return weight;
}

function registerMelodicProfile(sequence, intervalKeys) {
  GENERATION_HISTORY.melodic = makeSequenceProfile(sequence, intervalKeys);
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToFloat(frequency) {
  return 69 + 12 * Math.log2(frequency / 440);
}

function frequencyToNearestMidi(frequency) {
  return Math.round(midiToFloat(frequency));
}

function centsOffFromMidi(frequency, midi) {
  return 1200 * Math.log2(frequency / midiToFreq(midi));
}

function centsOffFromPitchClass(frequency, targetMidi) {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  const detectedCents = 1200 * Math.log2(frequency / 440);
  const targetCents = (targetMidi - 69) * 100;
  let diff = detectedCents - targetCents;
  diff = ((diff + 600) % 1200 + 1200) % 1200 - 600;
  return diff;
}

function centsOffFromNearestChromatic(frequency) {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  const nearestMidi = frequencyToNearestMidi(frequency);
  return centsOffFromMidi(frequency, nearestMidi);
}

function formatDetectedPitch(frequency) {
  if (!Number.isFinite(frequency) || frequency <= 0) return "—";
  const midi = frequencyToNearestMidi(frequency);
  return `${midiToSimpleNote(midi).label} · ${frequency.toFixed(1)} Hz`;
}

function autoCorrelatePitch(buffer, sampleRate, threshold = 0.15) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i += 1) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.008) return null;

  const halfLen = Math.floor(buffer.length / 2);
  const yinBuffer = new Float32Array(halfLen);

  for (let tau = 0; tau < halfLen; tau += 1) {
    let sum = 0;
    for (let i = 0; i < halfLen; i += 1) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfLen; tau += 1) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] = runningSum > 0 ? yinBuffer[tau] * tau / runningSum : 1;
  }

  let tauEstimate = -1;
  for (let tau = 2; tau < halfLen; tau += 1) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < halfLen && yinBuffer[tau + 1] < yinBuffer[tau]) tau += 1;
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) return null;

  let refined = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < halfLen - 1) {
    const y0 = yinBuffer[tauEstimate - 1];
    const y1 = yinBuffer[tauEstimate];
    const y2 = yinBuffer[tauEstimate + 1];
    const denom = y0 + y2 - 2 * y1;
    if (denom !== 0) refined = tauEstimate + (y0 - y2) / (2 * denom);
  }

  const frequency = sampleRate / refined;
  return Number.isFinite(frequency) && frequency > 0 ? frequency : null;
}
function pitchClassOf(noteOrMidi) {
  const midi = typeof noteOrMidi === "number" ? noteOrMidi : noteOrMidi?.midi;
  return ((midi % 12) + 12) % 12;
}

function diatonicIndex(letter, octave) {
  return octave * 7 + LETTERS.indexOf(letter);
}

function isAwkwardSpelling(letter, accidental) {
  return (accidental === 1 && (letter === "E" || letter === "B")) || (accidental === -1 && (letter === "C" || letter === "F"));
}

function makeNote(letter, octave, accidental = 0) {
  const midi = 12 * (octave + 1) + NATURAL_OFFSETS[letter] + accidental;
  return {
    id: `${letter}${ACCIDENTAL_ASCII[accidental]}${octave}`,
    letter,
    octave,
    accidental,
    midi,
    label: `${letter}${ACCIDENTAL_DISPLAY[accidental]}${octave}`,
  };
}

function buildAvailableNotes() {
  const notes = [];
  for (let octave = 0; octave <= 8; octave += 1) {
    for (const letter of LETTERS) {
      for (const accidental of [-1, 0, 1]) {
        if (isAwkwardSpelling(letter, accidental)) continue;
        const note = makeNote(letter, octave, accidental);
        if (note.midi >= 24 && note.midi <= 108) notes.push(note);
      }
    }
  }
  return notes;
}

const AVAILABLE_NOTES = buildAvailableNotes();

function getClefConfig(clefKey) {
  return CLEFS.find((clef) => clef.key === clefKey) ?? CLEFS[0];
}

function getClefDisplay(clef) {
  if (!clef?.tag) return clef?.symbol ?? "𝄞";
  return `${clef.symbol}${clef.tag}`;
}

function noteToVexKey(note, clef) {
  const shift = clef?.displayOctaveShift ?? 0;
  return `${note.letter.toLowerCase()}/${note.octave + shift}`;
}

function getIntervalDefinition(intervalKey) {
  return INTERVAL_DEFINITIONS.find((interval) => interval.key === intervalKey);
}

function noteNameForSoundFont(midi) {
  const names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  const pc = pitchClassOf(midi);
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pc]}${octave}`;
}

function nearestMidiForPitchClass(pc, referenceMidi) {
  let best = pc + 12 * 4;
  let bestDistance = Infinity;
  for (let midi = 36; midi <= 96; midi += 1) {
    if (pitchClassOf(midi) !== pc) continue;
    const distance = Math.abs(midi - referenceMidi);
    if (distance < bestDistance) {
      best = midi;
      bestDistance = distance;
    }
  }
  return best;
}

function midiToSimpleNote(midi) {
  const spellings = [
    ["C", 0], ["C", 1], ["D", 0], ["E", -1], ["E", 0], ["F", 0],
    ["F", 1], ["G", 0], ["A", -1], ["A", 0], ["B", -1], ["B", 0],
  ];
  const [letter, accidental] = spellings[pitchClassOf(midi)];
  const octave = Math.floor(midi / 12) - 1;
  return makeNote(letter, octave, accidental);
}

function transposeNote(note, interval, direction, clef) {
  const currentDiatonic = diatonicIndex(note.letter, note.octave);
  const targetDiatonic = currentDiatonic + direction * interval.diatonicSteps;
  const targetLetter = LETTERS[((targetDiatonic % 7) + 7) % 7];
  const targetOctave = Math.floor(targetDiatonic / 7);
  const desiredMidi = note.midi + direction * interval.semitones;
  const naturalMidi = 12 * (targetOctave + 1) + NATURAL_OFFSETS[targetLetter];
  const accidental = desiredMidi - naturalMidi;
  if (Math.abs(accidental) > 1) return null;
  if (isAwkwardSpelling(targetLetter, accidental)) return null;
  const result = makeNote(targetLetter, targetOctave, accidental);
  if (result.midi < clef.minMidi || result.midi > clef.maxMidi) return null;
  return result;
}

function sanitizeIntervalSelection(keys) {
  const valid = INTERVAL_DEFINITIONS.map((item) => item.key);
  return [...new Set(keys)].filter((key) => valid.includes(key));
}

function intervalKeySetSignature(keys) {
  return sanitizeIntervalSelection(keys).slice().sort().join("|");
}

function sameIntervalKeySet(a, b) {
  return intervalKeySetSignature(a) === intervalKeySetSignature(b);
}

function defaultIntervalKeysForMode(mode) {
  return mode === "chords" ? DEFAULT_CHORD_INTERVAL_KEYS : DEFAULT_INTERVAL_KEYS;
}

function harmonicBassMotionIntervalKeys(selectedIntervalKeys) {
  return [...new Set([...sanitizeIntervalSelection(selectedIntervalKeys), "m2", "M2"])];
}

function sanitizeClefSelection(keys) {
  const valid = CLEFS.map((item) => item.key);
  const cleaned = [...new Set(keys)].filter((key) => valid.includes(key));
  return cleaned.length ? cleaned : DEFAULT_CLEF_KEYS;
}

function sanitizeDirectionMode(directionMode, noteCount) {
  if (noteCount >= 4) return "random";
  if (noteCount === 2 && directionMode === "mixed") return "random";
  return SHORT_DIRECTION_OPTIONS.some((option) => option.key === directionMode) ? directionMode : DEFAULT_DIRECTION_MODE;
}

function getDirectionPlan(noteCount, directionMode) {
  const safeMode = sanitizeDirectionMode(directionMode, noteCount);
  if (noteCount >= 4 || safeMode === "random") return null;
  if (noteCount === 2) {
    if (safeMode === "ascending") return [1];
    if (safeMode === "descending") return [-1];
    return null;
  }
  if (noteCount === 3) {
    if (safeMode === "ascending") return [1, 1];
    if (safeMode === "descending") return [-1, -1];
    if (safeMode === "mixed") return randomItem([[1, -1], [-1, 1]]);
  }
  return null;
}

function getTwelveToneIntervalKeys(keys) {
  return sanitizeIntervalSelection(keys).filter((key) => key !== "P8");
}

function getNotesForClef(clefKey) {
  const clef = getClefConfig(clefKey);
  const all = AVAILABLE_NOTES.filter((note) => note.midi >= clef.minMidi && note.midi <= clef.maxMidi);
  const central = all.filter((note) => note.midi >= clef.centerMinMidi && note.midi <= clef.centerMaxMidi);
  return { all, central: central.length ? central : all };
}

function getCandidates(currentNote, selectedIntervalKeys, clefKey, usedPitchClasses = null, forcedDirection = null) {
  const clef = getClefConfig(clefKey);
  const candidates = [];
  const intervalKeys = sanitizeIntervalSelection(selectedIntervalKeys);

  intervalKeys.forEach((intervalKey) => {
    const interval = getIntervalDefinition(intervalKey);
    if (!interval) return;
    [1, -1].forEach((direction) => {
      if (typeof forcedDirection === "number" && direction !== forcedDirection) return;
      const candidate = transposeNote(currentNote, interval, direction, clef);
      if (!candidate) return;
      if (usedPitchClasses && usedPitchClasses.has(pitchClassOf(candidate))) return;
      candidates.push({ note: candidate, intervalKey, direction });
    });
  });

  return candidates;
}



function getIntervalBySemitones(semitones, allowedIntervalKeys = []) {
  const allowed = new Set(allowedIntervalKeys.length ? allowedIntervalKeys : INTERVAL_DEFINITIONS.map((item) => item.key));
  return INTERVAL_DEFINITIONS.find((interval) => allowed.has(interval.key) && interval.semitones === semitones);
}

function intervalKeyBetweenNotes(lower, upper, allowedIntervalKeys = []) {
  if (!lower || !upper || upper.midi <= lower.midi) return null;
  const semitones = upper.midi - lower.midi;
  if (semitones <= 0 || semitones > 12) return null;
  const diatonicSteps = diatonicIndex(upper.letter, upper.octave) - diatonicIndex(lower.letter, lower.octave);
  const allowed = new Set((allowedIntervalKeys.length ? sanitizeIntervalSelection(allowedIntervalKeys) : INTERVAL_DEFINITIONS.map((item) => item.key)));
  const match = INTERVAL_DEFINITIONS.find((interval) => {
    if (!allowed.has(interval.key) || interval.semitones !== semitones) return false;
    return interval.diatonicSteps === diatonicSteps || (interval.key === "TT" && interval.altDiatonicSteps === diatonicSteps);
  });
  return match?.key ?? null;
}

function intervalShortBetweenNotes(lower, upper, allowedIntervalKeys = []) {
  const key = intervalKeyBetweenNotes(lower, upper, allowedIntervalKeys);
  return key ? getIntervalDefinition(key)?.short : null;
}

function qualityShortFromNumberAndSemitones(intervalNumber, semitones) {
  if (!Number.isFinite(intervalNumber) || !Number.isFinite(semitones) || intervalNumber < 1 || semitones < 0) return null;
  const octaveLayers = Math.floor((intervalNumber - 1) / 7);
  const simpleNumber = ((intervalNumber - 1) % 7) + 1;
  const simpleSemitones = semitones - 12 * octaveLayers;

  const qualityBySimpleNumber = {
    1: { 0: "J", 1: "aum" },
    2: { 0: "dis", 1: "m", 2: "M", 3: "aum" },
    3: { 2: "dis", 3: "m", 4: "M", 5: "aum" },
    4: { 4: "dis", 5: "J", 6: "aum" },
    5: { 6: "dis", 7: "J", 8: "aum" },
    6: { 7: "dis", 8: "m", 9: "M", 10: "aum" },
    7: { 9: "dis", 10: "m", 11: "M" },
  };

  return qualityBySimpleNumber[simpleNumber]?.[simpleSemitones] ?? null;
}

function compoundIntervalShortBetweenNotes(lower, upper) {
  if (!lower || !upper || upper.midi <= lower.midi) return null;
  const semitones = upper.midi - lower.midi;
  const diatonicDistance = diatonicIndex(upper.letter, upper.octave) - diatonicIndex(lower.letter, lower.octave);
  const intervalNumber = diatonicDistance + 1;
  const quality = qualityShortFromNumberAndSemitones(intervalNumber, semitones);
  if (!quality) return `${semitones} st`;
  return `${intervalNumber}${quality}`;
}

function getTransitionData(sequence, allowedIntervalKeys = []) {
  if (!Array.isArray(sequence) || sequence.length < 2) return [];
  return sequence.slice(1).map((note, index) => {
    const previous = sequence[index];
    const diff = Math.abs(note.midi - previous.midi);
    const interval = getIntervalBySemitones(diff, allowedIntervalKeys);
    const direction = note.midi >= previous.midi ? 1 : -1;
    return {
      intervalKey: interval?.key ?? `${diff}`,
      short: interval?.short ?? `${diff}`,
      direction,
    };
  });
}

function getIntervalLabels(sequence, allowedIntervalKeys = []) {
  return getTransitionData(sequence, allowedIntervalKeys).map((transition) => `${transition.short} ${transition.direction > 0 ? "↑" : "↓"}`);
}

function intervalShortForKey(intervalKey) {
  return getIntervalDefinition(intervalKey)?.short ?? intervalKey;
}

function patternHasExplicitDirections(pattern) {
  return Array.isArray(pattern?.steps) && pattern.steps.some((step) => typeof step.direction === "number");
}

function patternDirectionsAreUniform(transitions) {
  if (!Array.isArray(transitions) || !transitions.length) return false;
  return transitions.every((transition) => transition.direction === transitions[0].direction);
}

function transitionMatchesModelStep(transition, modelStep) {
  if (!transition || !modelStep) return false;
  if (transition.intervalKey !== modelStep.intervalKey) return false;
  if (typeof modelStep.direction === "number" && transition.direction !== modelStep.direction) return false;
  return true;
}

function transitionsMatchModelPattern(slice, pattern) {
  if (!Array.isArray(slice) || !pattern?.steps || slice.length !== pattern.steps.length) return false;
  if (!slice.every((transition, index) => transitionMatchesModelStep(transition, pattern.steps[index]))) return false;

  // Los modelos escritos sin flechas en la lista son modelos direccionales: deben ir
  // todos ascendentes o todos descendentes. Así evitamos reconocer, por ejemplo,
  // 4J + 2m si una va hacia arriba y la otra hacia abajo.
  if (!patternHasExplicitDirections(pattern)) {
    return patternDirectionsAreUniform(slice);
  }

  return true;
}

function modelSuffix(pattern) {
  const label = pattern?.label ?? "";
  if (label.includes("·")) return label.split("·").slice(1).join("·").trim();
  const lower = label.toLowerCase();
  if (lower.includes("aumentado")) return "aumentado";
  if (lower.includes("disminuido")) return "disminuido";
  if (lower.startsWith("aum.")) return "aum.";
  if (lower.startsWith("dis.")) return "dis.";
  if (lower.includes("cromática")) return "escala cromática";
  if (lower.includes("tonos enteros")) return "escala de tonos enteros";
  return "";
}

function formatModelLabel(pattern, slice) {
  if (!pattern || !Array.isArray(slice)) return "";

  if (patternHasExplicitDirections(pattern)) {
    return pattern.label;
  }

  const directedSteps = pattern.steps.map((step, index) => {
    const direction = slice[index]?.direction ?? 1;
    return `${intervalShortForKey(step.intervalKey)}${direction > 0 ? "↗" : "↘"}`;
  }).join(" + ");

  const suffix = modelSuffix(pattern);
  return suffix ? `${directedSteps} · ${suffix}` : directedSteps;
}

function detectModelLabels(sequence, allowedIntervalKeys = []) {
  const transitions = getTransitionData(sequence, allowedIntervalKeys);
  if (transitions.length < 2) return [];

  const patterns = MODEL_PATTERNS
    .filter((pattern) => pattern.steps.length >= 2)
    .filter((pattern) => pattern.steps.length <= transitions.length);

  const matches = [];
  for (let start = 0; start < transitions.length; start += 1) {
    const startMatches = [];
    patterns.forEach((pattern) => {
      if (start + pattern.steps.length > transitions.length) return;
      const slice = transitions.slice(start, start + pattern.steps.length);
      if (!transitionsMatchModelPattern(slice, pattern)) return;
      startMatches.push({
        start,
        length: pattern.steps.length,
        label: formatModelLabel(pattern, slice),
      });
    });

    // En una misma posición mostramos primero el modelo más largo, pero el orden
    // general queda determinado por la aparición real dentro del ejercicio.
    startMatches
      .sort((a, b) => b.length - a.length)
      .forEach((match) => matches.push(match));
  }

  const ordered = [];
  const seen = new Set();
  matches.forEach((match) => {
    if (!match.label || seen.has(match.label)) return;
    seen.add(match.label);
    ordered.push(match.label);
  });

  return ordered.slice(0, 12);
}

function undirectedPatternDirectionFromPlan(pattern, directionPlan) {
  if (patternHasExplicitDirections(pattern)) return null;
  if (!Array.isArray(directionPlan)) return null;
  const forced = directionPlan
    .slice(0, pattern.steps.length)
    .filter((direction) => typeof direction === "number");
  if (!forced.length) return null;
  return forced.every((direction) => direction === forced[0]) ? forced[0] : false;
}

function patternFitsIntervalSelection(pattern, intervalKeys) {
  const allowed = new Set(sanitizeIntervalSelection(intervalKeys));
  if (!pattern?.steps?.length || pattern.steps.length < 2) return false;
  return pattern.steps.every((step) => allowed.has(step.intervalKey));
}

function patternFitsDirectionPlan(pattern, directionPlan) {
  if (!directionPlan) return true;

  if (!patternHasExplicitDirections(pattern)) {
    return undirectedPatternDirectionFromPlan(pattern, directionPlan) !== false;
  }

  return pattern.steps.every((step, index) => {
    const forced = directionPlan[index];
    if (typeof forced !== "number") return true;
    return typeof step.direction !== "number" || step.direction === forced;
  });
}

function buildMelodyFromModel(noteCount, selectedIntervalKeys, selectedClefKeys, directionMode = DEFAULT_DIRECTION_MODE) {
  const safeCount = clamp(noteCount, MIN_NOTES, MAX_NOTES);
  if (safeCount < 3) return null;
  const intervals = sanitizeIntervalSelection(selectedIntervalKeys);
  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const { all, central } = getNotesForClef(clefKey);
  const directionPlan = getDirectionPlan(safeCount, directionMode);
  const usablePatterns = MODEL_PATTERNS
    .filter((pattern) => pattern.steps.length <= safeCount - 1)
    .filter((pattern) => patternFitsIntervalSelection(pattern, intervals))
    .filter((pattern) => patternFitsDirectionPlan(pattern, directionPlan));

  if (!usablePatterns.length) return null;

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const previousProfile = GENERATION_HISTORY.melodic;
    const pattern = weightedRandomItem(usablePatterns, (candidatePattern) => {
      let weight = 1;
      const stepKeys = candidatePattern.steps.map((step) => step.intervalKey);
      if (perfectStackFocusActive(intervals)) {
        if (stepKeys[0] === "P4" && stepKeys[1] === "P4") weight *= 5.2;
        if (stepKeys[0] === "P5" && stepKeys[1] === "P5") weight *= 5.2;
        if ((stepKeys[0] === "P4" && stepKeys[1] === "P5") || (stepKeys[0] === "P5" && stepKeys[1] === "P4")) weight *= 0.55;
        if (stepKeys.includes("P8") && stepKeys.some((key) => key !== "P8")) weight *= 0.22;
      }
      const mainKey = stepKeys[0];
      weight *= intervalContrastWeight(mainKey, previousProfile, 0.5);
      return weight;
    });
    const plannedUndirectedDirection = undirectedPatternDirectionFromPlan(pattern, directionPlan);
    const modelDirection = !patternHasExplicitDirections(pattern)
      ? (plannedUndirectedDirection === false ? false : (typeof plannedUndirectedDirection === "number" ? plannedUndirectedDirection : randomItem([1, -1])))
      : null;
    if (modelDirection === false) continue;

    let current = randomItem(central.length ? central : all);
    const sequence = [current];
    let failed = false;

    for (let i = 0; i < pattern.steps.length; i += 1) {
      const modelStep = pattern.steps[i];
      const forcedDirection = directionPlan ? directionPlan[i] ?? null : null;
      const direction = typeof modelStep.direction === "number" ? modelStep.direction : (typeof modelDirection === "number" ? modelDirection : forcedDirection);
      const candidates = getCandidates(current, [modelStep.intervalKey], clefKey, null, direction);
      if (!candidates.length) {
        failed = true;
        break;
      }
      const filtered = candidates.filter((item) => sequence.length < 2 || item.note.id !== sequence[sequence.length - 2].id);
      current = weightedRandomItem(filtered.length ? filtered : candidates, (item) => melodicCandidateWeight(item, sequence, previousProfile))?.note;
      sequence.push(current);
    }

    if (failed) continue;

    while (sequence.length < safeCount) {
      const forcedDirection = directionPlan ? directionPlan[sequence.length - 1] ?? null : null;
      const candidates = getCandidates(current, intervals, clefKey, null, forcedDirection);
      if (!candidates.length) {
        current = randomItem(all);
      } else {
        const filtered = candidates.filter((item) => sequence.length < 2 || item.note.id !== sequence[sequence.length - 2].id);
        current = weightedRandomItem(filtered.length ? filtered : candidates, (item) => melodicCandidateWeight(item, sequence, previousProfile))?.note;
      }
      sequence.push(current);
    }

    registerMelodicProfile(sequence, intervals);
    return {
      id: `${Date.now()}-${Math.random()}`,
      sequence,
      clefKey,
      mode: "intervals",
      intervalKeys: intervals,
      directionMode: sanitizeDirectionMode(directionMode, safeCount),
      startNote: sequence[0]?.label ?? "—",
      preferredModel: pattern.label,
    };
  }

  return null;
}
function buildMelody(noteCount, selectedIntervalKeys, selectedClefKeys, directionMode = DEFAULT_DIRECTION_MODE) {
  const safeCount = clamp(noteCount, MIN_NOTES, MAX_NOTES);
  const intervals = sanitizeIntervalSelection(selectedIntervalKeys);
  const modelBased = safeCount >= 3 && Math.random() < 0.76
    ? buildMelodyFromModel(safeCount, intervals, selectedClefKeys, directionMode)
    : null;
  if (modelBased) return modelBased;

  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const { all, central } = getNotesForClef(clefKey);
  const directionPlan = getDirectionPlan(safeCount, directionMode);
  const previousProfile = GENERATION_HISTORY.melodic;
  let current = randomItem(central);
  const sequence = [current];

  for (let i = 1; i < safeCount; i += 1) {
    const forcedDirection = directionPlan ? directionPlan[i - 1] ?? null : null;
    const candidates = getCandidates(current, intervals, clefKey, null, forcedDirection);
    if (!candidates.length) {
      current = randomItem(all);
    } else {
      const filtered = candidates.filter((item) => sequence.length < 2 || item.note.id !== sequence[sequence.length - 2].id);
      current = weightedRandomItem(filtered.length ? filtered : candidates, (item) => melodicCandidateWeight(item, sequence, previousProfile))?.note;
    }
    sequence.push(current);
  }

  registerMelodicProfile(sequence, intervals);
  return {
    id: `${Date.now()}-${Math.random()}`,
    sequence,
    clefKey,
    mode: "intervals",
    intervalKeys: intervals,
    directionMode: sanitizeDirectionMode(directionMode, safeCount),
    startNote: sequence[0]?.label ?? "—",
  };
}

function buildTwelveToneSeries(noteCount, selectedIntervalKeys, selectedClefKeys) {
  const safeCount = clamp(noteCount, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES);
  const intervals = getTwelveToneIntervalKeys(selectedIntervalKeys);
  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const { central, all } = getNotesForClef(clefKey);
  const startingPool = central.length ? central : all;

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const start = randomItem(startingPool);
    const sequence = [start];
    const used = new Set([pitchClassOf(start)]);

    function backtrack(current) {
      if (sequence.length >= safeCount) return true;
      const candidates = getCandidates(current, intervals, clefKey, used)
        .sort(() => Math.random() - 0.5);
      for (const candidate of candidates) {
        sequence.push(candidate.note);
        used.add(pitchClassOf(candidate.note));
        if (backtrack(candidate.note)) return true;
        used.delete(pitchClassOf(candidate.note));
        sequence.pop();
      }
      return false;
    }

    if (backtrack(start)) {
      return {
        id: `${Date.now()}-${Math.random()}`,
        sequence,
        clefKey,
        mode: "twelveTone",
        intervalKeys: intervals,
        startNote: sequence[0]?.label ?? "—",
      };
    }
  }

  const fallback = buildMelody(safeCount, intervals.length ? intervals : ["m2", "M2", "m3", "M3", "P4", "TT", "P5"], [clefKey]);
  const used = new Set();
  const filtered = [];
  fallback.sequence.forEach((note) => {
    const pc = pitchClassOf(note);
    if (!used.has(pc) && filtered.length < safeCount) {
      used.add(pc);
      filtered.push(note);
    }
  });
  return {
    ...fallback,
    sequence: filtered.length >= TWELVE_TONE_MIN_NOTES ? filtered : fallback.sequence.slice(0, safeCount),
    mode: "twelveTone",
  };
}


function harmonicPairIntervalProfile(pairs = []) {
  const verticalKeys = pairs.map((pair) => pair?.intervalKey).filter(Boolean);
  const bassMotionKeys = pairs.slice(1).map((pair) => pair?.bassMotionKey).filter(Boolean);
  return {
    vertical: summarizeIntervalCounts(verticalKeys),
    bass: summarizeIntervalCounts(bassMotionKeys),
  };
}

function registerHarmonicProfile(pairs) {
  GENERATION_HISTORY.harmonic = harmonicPairIntervalProfile(pairs);
}

function countTrailingStaticBass(pairs = []) {
  let count = 0;
  for (let i = pairs.length - 1; i >= 1; i -= 1) {
    if (pairs[i]?.bassMotionKey !== "static") break;
    count += 1;
  }
  return count;
}

function harmonicBassMoveWeight(move, pairs = [], previousProfile = null) {
  const key = move?.intervalKey;
  let weight = 1;
  if (key === "static") {
    const staticRun = countTrailingStaticBass(pairs);
    if (staticRun >= 3) return 0.01;
    if (staticRun >= 2) return 0.06;
    if (staticRun === 1) return 0.75;
    return 1.25;
  }
  if (key === "m2" || key === "M2") weight = 5.2;
  else if (key === "m3" || key === "M3") weight = 3.2;
  else if (key === "P4" || key === "P5") weight = 2.2;
  else if (key === "TT") weight = 0.5;
  else if (key === "m6" || key === "M6") weight = 0.18;
  else if (key === "m7" || key === "M7") weight = 0.1;
  else if (key === "P8") weight = 0.035;
  const previousPair = pairs[pairs.length - 1];
  if (previousPair?.bassMotionKey === key && previousPair?.bassMotionDirection === move?.direction) weight *= 0.5;
  weight *= intervalContrastWeight(key, previousProfile?.bass, 0.5);
  return weight;
}

function harmonicVerticalIntervalWeight(interval, context = {}) {
  const key = interval?.key;
  if (!key) return 1;
  let weight = key === "P8" ? 0.16 : 1;
  weight *= intervalContrastWeight(key, context.previousProfile?.vertical, 0.55);
  const used = context.intervalCounts?.[key] ?? 0;
  if (used >= 2) weight *= 0.6;
  if (used >= 3) weight *= 0.35;
  return weight;
}

function harmonicPairSignature(pair) {
  if (!pair?.lower || !pair?.upper) return "";
  return `${pair.lower.midi}-${pair.upper.midi}`;
}

function makeHarmonicPairFromLower(lower, selectedIntervalKeys, clef, previousPair = null, context = {}) {
  const intervals = sanitizeIntervalSelection(selectedIntervalKeys).map(getIntervalDefinition).filter(Boolean);
  const usable = intervals.length ? intervals : DEFAULT_INTERVAL_KEYS.map(getIntervalDefinition).filter(Boolean);
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const interval = weightedRandomItem(usable, (item) => harmonicVerticalIntervalWeight(item, context));
    if (!interval) continue;
    const upper = transposeNote(lower, interval, 1, clef);
    if (!upper || upper.midi <= lower.midi) continue;
    if (previousPair) {
      // Evita cruce y solapamiento de voces entre un intervalo y el siguiente:
      // el bajo nuevo no rebasa la voz superior previa y la voz superior nueva
      // no queda por debajo del bajo previo.
      if (lower.midi > previousPair.upper.midi) continue;
      if (upper.midi < previousPair.lower.midi) continue;
    }
    return { lower, upper, intervalKey: interval.key, intervalShort: interval.short };
  }
  return null;
}

function getHarmonicBassMoves(previousPair, selectedIntervalKeys, clef) {
  if (!previousPair?.lower) return [];
  const intervals = harmonicBassMotionIntervalKeys(selectedIntervalKeys).map(getIntervalDefinition).filter(Boolean);
  const usable = intervals.length ? intervals : [...DEFAULT_INTERVAL_KEYS, "m2", "M2"].map(getIntervalDefinition).filter(Boolean);
  const moves = [];
  const seen = new Set();
  const addMove = (note, intervalKey = "static", direction = 0) => {
    if (!note) return;
    if (note.midi < clef.minMidi || note.midi > clef.maxMidi) return;
    if (note.midi > previousPair.upper.midi) return;
    const key = `${note.id}-${intervalKey}-${direction}`;
    if (seen.has(key)) return;
    seen.add(key);
    moves.push({ note, intervalKey, direction });
  };

  addMove(previousPair.lower, "static", 0);
  usable.forEach((interval) => {
    [-1, 1].forEach((direction) => {
      addMove(transposeNote(previousPair.lower, interval, direction, clef), interval.key, direction);
    });
  });
  return moves;
}

function buildHarmonicSequence(pairCount, selectedIntervalKeys, selectedClefKeys) {
  const safeCount = clamp(pairCount, HARMONIC_MIN_PAIRS, HARMONIC_MAX_PAIRS);
  const intervals = sanitizeIntervalSelection(selectedIntervalKeys);
  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const clef = getClefConfig(clefKey);
  const { all, central } = getNotesForClef(clefKey);
  const lowerPool = (central.length ? central : all).filter((note) => note.midi <= clef.maxMidi - 1);
  const fallbackPool = all.filter((note) => note.midi <= clef.maxMidi - 1);
  const pairs = [];
  const usedPairSignatures = new Set();
  const verticalIntervalCounts = {};
  const previousExerciseProfile = GENERATION_HISTORY.harmonic;

  const canUseHarmonicPair = (candidate) => {
    if (!candidate?.lower || !candidate?.upper) return false;
    const sig = harmonicPairSignature(candidate);
    if (!sig || usedPairSignatures.has(sig)) return false;
    return true;
  };

  const registerHarmonicPair = (candidate) => {
    const sig = harmonicPairSignature(candidate);
    if (sig) usedPairSignatures.add(sig);
    if (candidate?.intervalKey) verticalIntervalCounts[candidate.intervalKey] = (verticalIntervalCounts[candidate.intervalKey] ?? 0) + 1;
  };

  for (let i = 0; i < safeCount; i += 1) {
    const previousPair = pairs[pairs.length - 1] ?? null;
    let pair = null;

    if (previousPair) {
      let bassMoves = getHarmonicBassMoves(previousPair, intervals, clef);
      const staticRun = countTrailingStaticBass(pairs);
      if (staticRun >= 2) {
        const nonStaticMoves = bassMoves.filter((move) => move.intervalKey !== "static");
        if (nonStaticMoves.length) bassMoves = nonStaticMoves;
      }
      for (let attempt = 0; attempt < 160 && !pair; attempt += 1) {
        const move = weightedRandomItem(bassMoves, (item) => harmonicBassMoveWeight(item, pairs, previousExerciseProfile));
        if (!move?.note) continue;
        const candidate = makeHarmonicPairFromLower(move.note, intervals, clef, previousPair, { intervalCounts: verticalIntervalCounts, previousProfile: previousExerciseProfile });
        if (!candidate || !canUseHarmonicPair(candidate)) continue;
        pair = {
          ...candidate,
          bassMotionKey: move.intervalKey,
          bassMotionDirection: move.direction,
          bassMotionShort: move.intervalKey === "static" ? "común" : getIntervalDefinition(move.intervalKey)?.short,
        };
      }
    } else {
      for (let attempt = 0; attempt < 120 && !pair; attempt += 1) {
        const lower = randomItem(lowerPool.length ? lowerPool : fallbackPool);
        const candidate = makeHarmonicPairFromLower(lower, intervals, clef, null, { intervalCounts: verticalIntervalCounts, previousProfile: previousExerciseProfile });
        if (canUseHarmonicPair(candidate)) pair = candidate;
      }
    }

    if (!pair) {
      for (let attempt = 0; attempt < 220 && !pair; attempt += 1) {
        const lower = randomItem(lowerPool.length ? lowerPool : fallbackPool);
        const candidate = makeHarmonicPairFromLower(lower, intervals, clef, previousPair, { intervalCounts: verticalIntervalCounts, previousProfile: previousExerciseProfile });
        if (canUseHarmonicPair(candidate)) pair = candidate;
      }
    }

    if (!pair) {
      const fallbackIntervals = (intervals.length ? intervals : DEFAULT_INTERVAL_KEYS)
        .map(getIntervalDefinition)
        .filter(Boolean);
      for (let attempt = 0; attempt < 320 && !pair; attempt += 1) {
        const lower = randomItem(fallbackPool.length ? fallbackPool : lowerPool);
        const fallbackInterval = pickIntervalDefinition(fallbackIntervals) ?? getIntervalDefinition("P5");
        const upper = transposeNote(lower, fallbackInterval, 1, clef);
        const candidate = upper ? { lower, upper, intervalKey: fallbackInterval.key, intervalShort: fallbackInterval.short } : null;
        if (canUseHarmonicPair(candidate)) pair = candidate;
      }
    }

    if (!pair) {
      const fallbackIntervals = (intervals.length ? intervals : DEFAULT_INTERVAL_KEYS)
        .map(getIntervalDefinition)
        .filter(Boolean);
      const lowerCandidates = shuffleWithOctaveDeprioritized((fallbackPool.length ? fallbackPool : lowerPool).filter(Boolean));
      const intervalCandidates = shuffleWithOctaveDeprioritized(fallbackIntervals, (interval) => interval?.key);
      for (const lower of lowerCandidates) {
        for (const fallbackInterval of intervalCandidates) {
          if (!lower || !fallbackInterval) continue;
          const upper = transposeNote(lower, fallbackInterval, 1, clef);
          const candidate = upper ? { lower, upper, intervalKey: fallbackInterval.key, intervalShort: fallbackInterval.short } : null;
          if (!candidate || !canUseHarmonicPair(candidate)) continue;
          if (previousPair && (candidate.lower.midi > previousPair.upper.midi || candidate.upper.midi < previousPair.lower.midi)) continue;
          pair = candidate;
          break;
        }
        if (pair) break;
      }
    }

    if (!pair) {
      // Último recurso: si el registro ya no permite más combinaciones únicas,
      // generamos un intervalo válido aunque pueda repetir. En condiciones normales
      // no se llega aquí, porque se prueban primero todas las combinaciones únicas.
      const lower = randomItem(lowerPool.length ? lowerPool : fallbackPool);
      const fallbackInterval = getIntervalDefinition(intervals.includes("P4") ? "P4" : (intervals[0] ?? "P5")) ?? getIntervalDefinition("P5");
      const upper = transposeNote(lower, fallbackInterval, 1, clef) ?? midiToSimpleNote(clamp(lower.midi + fallbackInterval.semitones, clef.minMidi, clef.maxMidi));
      pair = { lower, upper, intervalKey: fallbackInterval.key, intervalShort: fallbackInterval.short };
    }

    pairs.push(pair);
    registerHarmonicPair(pair);
  }

  registerHarmonicProfile(pairs);
  return {
    id: `${Date.now()}-${Math.random()}`,
    type: "harmonic",
    pairs,
    clefKey,
    mode: "harmonic",
    intervalKeys: intervals,
    startNote: pairs[0]?.lower?.label ?? "—",
  };
}

function sortChordVoices(notes) {
  const sorted = [...notes].sort((a, b) => a.midi - b.midi);
  return { lower: sorted[0], middle: sorted[1], upper: sorted[2] };
}

function adjacentVoicesWithinOctave(chord) {
  if (!chord?.lower || !chord?.middle || !chord?.upper) return false;
  return chord.middle.midi - chord.lower.midi <= 12 && chord.upper.midi - chord.middle.midi <= 12;
}

const CHORD_VOICES = ["lower", "middle", "upper"];
const CHORD_VOICE_LABELS = { lower: "bajo", middle: "medio", upper: "alto" };

function chordVoiceLabel(voice) {
  return CHORD_VOICE_LABELS[voice] ?? voice;
}

const CONTIGUOUS_CHORD_ENTRY_ORDERS = [
  ["lower", "middle", "upper"],
  ["middle", "lower", "upper"],
  ["middle", "upper", "lower"],
  ["upper", "middle", "lower"],
];

function voicesAreContiguous(firstVoice, secondVoice) {
  const firstIndex = CHORD_VOICES.indexOf(firstVoice);
  const secondIndex = CHORD_VOICES.indexOf(secondVoice);
  return firstIndex >= 0 && secondIndex >= 0 && Math.abs(firstIndex - secondIndex) === 1;
}

function normalizeChordEntryOrder(order) {
  if (voicesAreContiguous(order[0], order[1])) return order;
  if (order[0] === "upper") return ["upper", "middle", "lower"];
  if (order[0] === "lower") return ["lower", "middle", "upper"];
  return ["middle", "upper", "lower"];
}

function shuffledChordVoiceOrder() {
  return [...randomItem(CONTIGUOUS_CHORD_ENTRY_ORDERS)];
}

function getChordEntryOrder(chord) {
  const seen = new Set();
  const order = [];
  (Array.isArray(chord?.entryOrder) ? chord.entryOrder : CHORD_VOICES).forEach((voice) => {
    if (!CHORD_VOICES.includes(voice) || seen.has(voice)) return;
    seen.add(voice);
    order.push(voice);
  });
  CHORD_VOICES.forEach((voice) => {
    if (!seen.has(voice)) order.push(voice);
  });
  return normalizeChordEntryOrder(order);
}

function chordSignature(chord) {
  if (!chord?.lower || !chord?.middle || !chord?.upper) return '';
  return [chord.lower.midi, chord.middle.midi, chord.upper.midi].join('-');
}

function chordModelSignature(chord, allowedIntervalKeys = []) {
  if (!chord?.lower || !chord?.middle || !chord?.upper) return '';
  const firstKey = intervalKeyBetweenNotes(chord.lower, chord.middle, allowedIntervalKeys);
  const secondKey = intervalKeyBetweenNotes(chord.middle, chord.upper, allowedIntervalKeys);
  const firstSize = chord.middle.midi - chord.lower.midi;
  const secondSize = chord.upper.midi - chord.middle.midi;
  return `${firstKey ?? firstSize}:${secondKey ?? secondSize}`;
}

function chordIntervals(chord, allowedIntervalKeys = []) {
  const voices = [chord.lower, chord.middle, chord.upper].filter(Boolean);
  if (voices.length < 3) return [];
  const lowerMiddle = voices[1].midi - voices[0].midi;
  const middleUpper = voices[2].midi - voices[1].midi;
  const intervalAKey = intervalKeyBetweenNotes(voices[0], voices[1], allowedIntervalKeys);
  const intervalBKey = intervalKeyBetweenNotes(voices[1], voices[2], allowedIntervalKeys);
  const intervalA = intervalAKey ? getIntervalDefinition(intervalAKey) : getIntervalBySemitones(lowerMiddle % 12 === 0 && lowerMiddle > 0 ? 12 : lowerMiddle, allowedIntervalKeys);
  const intervalB = intervalBKey ? getIntervalDefinition(intervalBKey) : getIntervalBySemitones(middleUpper % 12 === 0 && middleUpper > 0 ? 12 : middleUpper, allowedIntervalKeys);
  const total = compoundIntervalShortBetweenNotes(voices[0], voices[2]);
  const compact = `${intervalA?.short ?? `${lowerMiddle} st`} + ${intervalB?.short ?? `${middleUpper} st`}`;
  return total ? [compact, `total: ${total}`] : [compact];
}

function chordUsesSelectedIntervals(chord, selectedIntervalKeys) {
  if (!adjacentVoicesWithinOctave(chord)) return false;
  const allowed = sanitizeIntervalSelection(selectedIntervalKeys);
  const voices = [chord.lower, chord.middle, chord.upper].filter(Boolean);
  if (voices.length < 3) return false;
  const lowerMiddle = intervalKeyBetweenNotes(voices[0], voices[1], allowed);
  const middleUpper = intervalKeyBetweenNotes(voices[1], voices[2], allowed);
  return Boolean(lowerMiddle && middleUpper);
}

function chordContainsDeprioritizedOctave(chord, selectedIntervalKeys) {
  const allowed = sanitizeIntervalSelection(selectedIntervalKeys);
  if (!allowed.includes("P8") || allowed.every((key) => key === "P8")) return false;
  const voices = [chord.lower, chord.middle, chord.upper].filter(Boolean);
  if (voices.length < 3) return false;
  return [intervalKeyBetweenNotes(voices[0], voices[1], allowed), intervalKeyBetweenNotes(voices[1], voices[2], allowed)].includes("P8");
}

function chordHasAnyOctave(chord, selectedIntervalKeys) {
  const allowed = sanitizeIntervalSelection(selectedIntervalKeys);
  if (!allowed.includes("P8") || allowed.every((key) => key === "P8")) return false;
  const voices = [chord.lower, chord.middle, chord.upper].filter(Boolean);
  if (voices.length < 3) return false;
  return intervalKeyBetweenNotes(voices[0], voices[1], allowed) === "P8"
    || intervalKeyBetweenNotes(voices[1], voices[2], allowed) === "P8"
    || voices[2].midi - voices[0].midi === 12;
}

function chordTransitionIsVoiceBounded(previousChord, nextChord) {
  if (!previousChord || !nextChord) return true;
  const previousLower = previousChord.lower?.midi;
  const previousMiddle = previousChord.middle?.midi;
  const previousUpper = previousChord.upper?.midi;
  const nextLower = nextChord.lower?.midi;
  const nextMiddle = nextChord.middle?.midi;
  const nextUpper = nextChord.upper?.midi;
  if (![previousLower, previousMiddle, previousUpper, nextLower, nextMiddle, nextUpper].every(Number.isFinite)) return false;
  if (!(nextLower < nextMiddle && nextMiddle < nextUpper)) return false;

  // Evita solapamiento entre voces: cada voz puede llegar como máximo
  // hasta la posición previa de la voz contigua, pero no rebasarla.
  if (nextLower > previousMiddle) return false;
  if (nextMiddle < previousLower || nextMiddle > previousUpper) return false;
  if (nextUpper < previousMiddle) return false;
  return true;
}

const CHORD_PARALLEL_MOTION_KEYS = ["m2", "M2", "m3", "M3", "P4", "TT", "P5"];

function chordParallelMotionWeight(interval) {
  if (!interval) return 0;
  if (interval.key === "m2" || interval.key === "M2") return 9;
  if (interval.key === "m3" || interval.key === "M3") return 5;
  if (interval.key === "P4") return 1.15;
  if (interval.key === "TT" || interval.key === "P5") return 0.45;
  return 0;
}

function chordIntervalPairWeight(first, second, selectedIntervalKeys, context = {}) {
  if (!first || !second) return 1;
  let weight = 1;
  if (perfectStackFocusActive(selectedIntervalKeys)) {
    if (first.key === "P4" && second.key === "P4") weight *= 6;
    if (first.key === "P5" && second.key === "P5") weight *= 6;
    if ((first.key === "P4" && second.key === "P5") || (first.key === "P5" && second.key === "P4")) weight *= 0.55;
  }
  if (first.key === "P8" || second.key === "P8") weight *= 0.08;
  const outerSemitones = first.semitones + second.semitones;
  if (outerSemitones === 12) weight *= 0.12;
  weight *= intervalContrastWeight(first.key, context.previousProfile, 0.6);
  weight *= intervalContrastWeight(second.key, context.previousProfile, 0.6);
  const modelKey = `${first.key}+${second.key}`;
  const used = context.modelCounts?.get?.(modelKey) ?? 0;
  if (used >= 1 && first.key !== second.key) weight *= 0.65;
  return weight;
}

function makeChordFromLower(lower, selectedIntervalKeys, clef, context = {}) {
  const intervals = sanitizeIntervalSelection(selectedIntervalKeys).map(getIntervalDefinition).filter(Boolean);
  const usable = intervals.length ? intervals : DEFAULT_CHORD_INTERVAL_KEYS.map(getIntervalDefinition).filter(Boolean);
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const first = weightedRandomItem(usable, (interval) => chordIntervalPairWeight(interval, { key: "_pending", semitones: 0 }, selectedIntervalKeys, context));
    const second = weightedRandomItem(usable, (interval) => chordIntervalPairWeight(first, interval, selectedIntervalKeys, context));
    if (!first || !second) continue;
    const middle = transposeNote(lower, first, 1, clef);
    if (!middle) continue;
    const upper = transposeNote(middle, second, 1, clef);
    if (!upper) continue;
    if (!(lower.midi < middle.midi && middle.midi < upper.midi)) continue;
    if (upper.midi > clef.maxMidi || lower.midi < clef.minMidi) continue;
    const chord = { lower, middle, upper, intervalKeys: [first.key, second.key] };
    if (!chordUsesSelectedIntervals(chord, selectedIntervalKeys)) continue;
    if (chordHasAnyOctave(chord, selectedIntervalKeys) && Math.random() < 0.94) continue;
    return chord;
  }
  return null;
}

function makeRandomChord(clef, selectedIntervalKeys, preferCentral = true, context = {}) {
  const all = AVAILABLE_NOTES.filter((note) => note.midi >= clef.minMidi && note.midi <= clef.maxMidi - 2);
  const central = all.filter((note) => note.midi >= clef.centerMinMidi && note.midi <= Math.min(clef.centerMaxMidi, clef.maxMidi - 2));
  const pool = preferCentral && central.length ? central : all;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const lower = randomItem(pool.length ? pool : all);
    const chord = makeChordFromLower(lower, selectedIntervalKeys, clef, context);
    if (chord) return chord;
  }
  const lower = midiToSimpleNote(clamp(clef.centerMinMidi ?? clef.minMidi, clef.minMidi, clef.maxMidi - 12));
  return { lower, middle: midiToSimpleNote(lower.midi + 5), upper: midiToSimpleNote(lower.midi + 12), intervalKeys: ["P4", "P5"] };
}

function transposeChordParallel(chord, selectedIntervalKeys, clef) {
  // El enlace paralelo traslada el modelo completo, pero con control melódico:
  // predominan 2as y 3as; 4J, TT y 5J solo aparecen esporádicamente.
  // Nunca se usan desplazamientos mayores a 5J.
  const usable = CHORD_PARALLEL_MOTION_KEYS.map(getIntervalDefinition).filter(Boolean);
  for (let attempt = 0; attempt < 260; attempt += 1) {
    const interval = weightedRandomItem(usable, chordParallelMotionWeight);
    const direction = Math.random() > 0.5 ? 1 : -1;
    if (!interval) continue;
    const lower = transposeNote(chord.lower, interval, direction, clef);
    const middle = transposeNote(chord.middle, interval, direction, clef);
    const upper = transposeNote(chord.upper, interval, direction, clef);
    if (!lower || !middle || !upper) continue;
    const next = { lower, middle, upper };
    if (lower.midi < middle.midi
      && middle.midi < upper.midi
      && adjacentVoicesWithinOctave(next)
      && chordTransitionIsVoiceBounded(chord, next)
      && chordUsesSelectedIntervals(next, selectedIntervalKeys)
      && [lower, middle, upper].every((note) => note.midi >= clef.minMidi && note.midi <= clef.maxMidi)) {
      return { ...next, linkMode: "parallel", parallelMotionKey: interval.key, parallelMotionDirection: direction };
    }
  }
  return null;
}

function makeChordWithFixedRoles(fixedRoles, selectedIntervalKeys, clef, context = {}) {
  const pool = AVAILABLE_NOTES.filter((note) => note.midi >= clef.minMidi && note.midi <= clef.maxMidi);
  const lowerPool = fixedRoles.lower ? [fixedRoles.lower] : pool;
  const middlePool = fixedRoles.middle ? [fixedRoles.middle] : pool;
  const upperPool = fixedRoles.upper ? [fixedRoles.upper] : pool;

  for (let attempt = 0; attempt < 2600; attempt += 1) {
    const lower = randomItem(lowerPool);
    const middle = randomItem(middlePool);
    const upper = randomItem(upperPool);
    if (!lower || !middle || !upper) continue;
    if (!(lower.midi < middle.midi && middle.midi < upper.midi)) continue;
    const chord = { lower, middle, upper };
    if (!adjacentVoicesWithinOctave(chord)) continue;
    if (!chordUsesSelectedIntervals(chord, selectedIntervalKeys)) continue;
    if (chordHasAnyOctave(chord, selectedIntervalKeys) && Math.random() < 0.96) continue;
    const modelSig = chordModelSignature(chord, selectedIntervalKeys);
    const used = context.modelCounts?.get?.(modelSig) ?? 0;
    if (used >= 2 && Math.random() < 0.65) continue;
    return chord;
  }
  return null;
}

function makeChordWithCommonNotes(previousChord, selectedIntervalKeys, clef, commonCount = 1, context = {}) {
  const roles = ["lower", "middle", "upper"];
  for (let attempt = 0; attempt < 220; attempt += 1) {
    const keepRoles = [...roles].sort(() => Math.random() - 0.5).slice(0, commonCount);
    const fixed = {};
    keepRoles.forEach((role) => { fixed[role] = previousChord[role]; });
    const generated = makeChordWithFixedRoles(fixed, selectedIntervalKeys, clef, context);
    if (!generated) continue;
    const sameRoleCommons = roles.filter((role) => generated[role]?.midi === previousChord[role]?.midi).length;
    if (sameRoleCommons >= commonCount) return { ...generated, linkMode: commonCount === 2 ? "common2" : "common1" };
  }
  return null;
}

function chordSequenceProfile(chords = [], allowedIntervalKeys = []) {
  const keys = [];
  chords.forEach((chord) => {
    keys.push(intervalKeyBetweenNotes(chord?.lower, chord?.middle, allowedIntervalKeys));
    keys.push(intervalKeyBetweenNotes(chord?.middle, chord?.upper, allowedIntervalKeys));
  });
  return summarizeIntervalCounts(keys);
}

function registerChordProfile(chords, allowedIntervalKeys = []) {
  GENERATION_HISTORY.chords = chordSequenceProfile(chords, allowedIntervalKeys);
}

function buildChordSequence(chordCount, selectedIntervalKeys, selectedClefKeys, selectedLinkModes = DEFAULT_CHORD_LINK_MODES) {
  const safeCount = clamp(chordCount, CHORD_MIN_COUNT, CHORD_MAX_COUNT);
  const sanitizedIntervals = sanitizeIntervalSelection(selectedIntervalKeys);
  const intervals = sanitizedIntervals.length ? sanitizedIntervals : DEFAULT_CHORD_INTERVAL_KEYS;
  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const clef = getClefConfig(clefKey);
  const linkModes = sanitizeChordLinkModes(selectedLinkModes);
  const chords = [];
  const signatureCounts = new Map();
  const modelCounts = new Map();
  const previousExerciseProfile = GENERATION_HISTORY.chords;
  const maxModelRepeats = safeCount <= 3 ? 1 : (safeCount <= 8 ? 2 : 3);
  const maxOctaveChords = intervals.every((key) => key === "P8") ? safeCount : (safeCount <= 8 ? 1 : 2);
  let octaveChordCount = 0;

  const canUseChord = (candidate, options = {}) => {
    if (!candidate) return false;
    const sig = chordSignature(candidate);
    const modelSig = chordModelSignature(candidate, intervals);
    if (!sig || !modelSig) return false;
    if (options.previous && !chordTransitionIsVoiceBounded(options.previous, candidate)) return false;
    // No repetimos exactamente el mismo acorde con las mismas alturas.
    if ((signatureCounts.get(sig) ?? 0) > 0) return false;
    // El mismo modelo interválico puede reaparecer transportado, pero con límite.
    if (!options.relaxModelLimit && (modelCounts.get(modelSig) ?? 0) >= maxModelRepeats) return false;
    if (!options.relaxOctaveLimit && chordHasAnyOctave(candidate, intervals) && octaveChordCount >= maxOctaveChords) return false;
    return true;
  };

  const registerChord = (candidate) => {
    const sig = chordSignature(candidate);
    const modelSig = chordModelSignature(candidate, intervals);
    signatureCounts.set(sig, (signatureCounts.get(sig) ?? 0) + 1);
    modelCounts.set(modelSig, (modelCounts.get(modelSig) ?? 0) + 1);
    if (chordHasAnyOctave(candidate, intervals)) octaveChordCount += 1;
  };

  const decorateChord = (candidate, fallbackLinkMode = null) => ({
    ...candidate,
    linkMode: candidate?.linkMode ?? fallbackLinkMode,
    entryOrder: shuffledChordVoiceOrder(),
  });

  let current = null;
  for (let attempt = 0; attempt < 180 && !current; attempt += 1) {
    const maybe = makeRandomChord(clef, intervals, true, { modelCounts, previousProfile: previousExerciseProfile });
    if (canUseChord(maybe)) current = maybe;
  }
  current = current ?? makeRandomChord(clef, intervals, true, { modelCounts, previousProfile: previousExerciseProfile });
  current = decorateChord(current, 'inicio');
  chords.push(current);
  registerChord(current);

  for (let i = 1; i < safeCount; i += 1) {
    let next = null;
    const mode = randomItem(linkModes);
    const attempts = mode === 'parallel' ? ['parallel', 'common2', 'common1'] : mode === 'common2' ? ['common2', 'common1', 'parallel'] : ['common1', 'common2', 'parallel'];
    for (const candidateMode of attempts) {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const candidate = candidateMode === 'parallel'
          ? transposeChordParallel(current, intervals, clef)
          : makeChordWithCommonNotes(current, intervals, clef, candidateMode === 'common2' ? 2 : 1, { modelCounts, previousProfile: previousExerciseProfile });
        if (canUseChord(candidate, { previous: current })) {
          next = candidate;
          break;
        }
      }
      if (next) break;
    }
    if (!next) {
      for (let attempt = 0; attempt < 160 && !next; attempt += 1) {
        const candidate = { ...makeRandomChord(clef, intervals, false, { modelCounts, previousProfile: previousExerciseProfile }), linkMode: 'libre' };
        if (canUseChord(candidate, { previous: current })) next = candidate;
      }
    }
    if (!next) {
      for (let attempt = 0; attempt < 220 && !next; attempt += 1) {
        const candidate = { ...makeRandomChord(clef, intervals, false, { modelCounts, previousProfile: previousExerciseProfile }), linkMode: 'libre' };
        if (canUseChord(candidate, { previous: current, relaxModelLimit: true, relaxOctaveLimit: true })) next = candidate;
      }
    }
    if (!next) {
      // Último intento sin relajar el control de cruce/solapamiento: preferimos
      // un acorde nuevo y cercano antes que una disposición que rebase voces contiguas.
      for (let attempt = 0; attempt < 320 && !next; attempt += 1) {
        const candidate = { ...makeRandomChord(clef, intervals, false, { modelCounts, previousProfile: previousExerciseProfile }), linkMode: 'libre' };
        if (canUseChord(candidate, { previous: current, relaxModelLimit: true, relaxOctaveLimit: true })) next = candidate;
      }
    }
    next = decorateChord(next ?? { ...current, linkMode: 'libre' }, 'libre');
    chords.push(next);
    registerChord(next);
    current = next;
  }

  registerChordProfile(chords, intervals);
  return {
    id: `${Date.now()}-${Math.random()}`,
    type: 'chords',
    chords,
    clefKey,
    mode: 'chords',
    intervalKeys: intervals,
    linkModes,
    startNote: chords[0]?.[getChordEntryOrder(chords[0])[0]]?.label ?? chords[0]?.lower?.label ?? '—',
  };
}

function makeInitialAttempts(exercise, harmonicResponseMode = DEFAULT_HARMONIC_RESPONSE_MODE) {
  if (exercise?.type === "chords") {
    return (exercise.chords ?? []).map((chord, index) => {
      const firstVoice = getChordEntryOrder(chord)[0] ?? "lower";
      return {
        lower: chord.lower,
        middle: chord.middle,
        upper: chord.upper,
        lowerVisible: index === 0 && firstVoice === "lower",
        middleVisible: index === 0 && firstVoice === "middle",
        upperVisible: index === 0 && firstVoice === "upper",
        lowerStatus: index === 0 && firstVoice === "lower" ? "given" : null,
        middleStatus: index === 0 && firstVoice === "middle" ? "given" : null,
        upperStatus: index === 0 && firstVoice === "upper" ? "given" : null,
      };
    });
  }
  if (exercise?.type === "harmonic") {
    return (exercise.pairs ?? []).map((pair, index) => ({
      lower: pair.lower,
      upper: pair.upper,
      lowerVisible: harmonicResponseMode === "givenBass" || index === 0,
      upperVisible: false,
      lowerStatus: "given",
      upperStatus: null,
    }));
  }
  const first = exercise?.sequence?.[0];
  return first ? [{ note: first, status: "start" }] : [];
}

function firstHarmonicStep(exercise, harmonicResponseMode = DEFAULT_HARMONIC_RESPONSE_MODE) {
  if (!exercise?.pairs?.length) return null;
  return { pairIndex: 0, voice: harmonicResponseMode === "full" ? "upper" : "upper" };
}

function nextHarmonicStepAfter(step, exercise, harmonicResponseMode) {
  if (!step || !exercise?.pairs?.length) return null;
  if (harmonicResponseMode === "givenBass") {
    const nextPair = step.pairIndex + 1;
    return nextPair < exercise.pairs.length ? { pairIndex: nextPair, voice: "upper" } : null;
  }
  if (step.voice === "lower") return { pairIndex: step.pairIndex, voice: "upper" };
  const nextPair = step.pairIndex + 1;
  return nextPair < exercise.pairs.length ? { pairIndex: nextPair, voice: "lower" } : null;
}

function getChordAnswerOrder(chord, chordIndex = 0) {
  // El primer tricorde conserva el orden aleatorio de entrada gradual
  // (puede iniciar por voz baja, media o alta). Desde el segundo tricorde
  // en adelante, las respuestas se piden siempre del bajo hacia arriba.
  return chordIndex === 0 ? getChordEntryOrder(chord) : CHORD_VOICES;
}

function firstChordStep(exercise) {
  if (!exercise?.chords?.length) return null;
  const firstOrder = getChordAnswerOrder(exercise.chords[0], 0);
  return { chordIndex: 0, voice: firstOrder[1] ?? "middle" };
}

function nextChordStepAfter(step, exercise) {
  if (!step || !exercise?.chords?.length) return null;
  const currentOrder = getChordAnswerOrder(exercise.chords[step.chordIndex], step.chordIndex);
  const currentPosition = currentOrder.indexOf(step.voice);
  if (currentPosition >= 0 && currentPosition < currentOrder.length - 1) {
    return { chordIndex: step.chordIndex, voice: currentOrder[currentPosition + 1] };
  }
  const nextChord = step.chordIndex + 1;
  if (nextChord >= exercise.chords.length) return null;
  const nextOrder = getChordAnswerOrder(exercise.chords[nextChord], nextChord);
  return { chordIndex: nextChord, voice: nextOrder[0] ?? "lower" };
}

function getExerciseTuningNotes(exercise) {
  if (exercise?.type === "chords") {
    const tuningNotes = [];
    (exercise.chords ?? []).forEach((chord, index) => {
      if (chord?.lower) tuningNotes.push({ ...chord.lower, tuningRole: `Bajo ${index + 1}` });
      if (chord?.middle) tuningNotes.push({ ...chord.middle, tuningRole: `Medio ${index + 1}` });
      if (chord?.upper) tuningNotes.push({ ...chord.upper, tuningRole: `Superior ${index + 1}` });
    });
    return tuningNotes;
  }
  if (exercise?.type === "harmonic") {
    const tuningNotes = [];
    (exercise.pairs ?? []).forEach((pair, index) => {
      if (pair?.lower) tuningNotes.push({ ...pair.lower, tuningRole: `Bajo ${index + 1}` });
      if (pair?.upper) tuningNotes.push({ ...pair.upper, tuningRole: `Superior ${index + 1}` });
    });
    return tuningNotes;
  }
  return (exercise?.sequence ?? []).map((note, index) => ({ ...note, tuningRole: `${index + 1}` }));
}

function getExerciseIntervalLabels(exercise) {
  if (exercise?.type === "chords") {
    return (exercise.chords ?? []).map((chord, index) => `${index + 1}. ${chordIntervals(chord, exercise.intervalKeys).join(' · ')}`);
  }
  if (exercise?.type === "harmonic") {
    return (exercise.pairs ?? []).map((pair, index) => `${index + 1}. ${pair.intervalShort ?? "—"} armónico`);
  }
  return getIntervalLabels(exercise?.sequence ?? [], exercise?.intervalKeys ?? []);
}

function getExerciseModelLabels(exercise) {
  if (exercise?.type === "chords") return [];
  if (exercise?.type === "harmonic") {
    const signatures = (exercise.pairs ?? []).map((pair) => pair.intervalKey);
    const labels = [];
    for (let i = 0; i < signatures.length - 1; i += 1) {
      if (signatures[i] === signatures[i + 1]) {
        const interval = getIntervalDefinition(signatures[i]);
        if (interval) labels.push(`${interval.short} + ${interval.short}`);
      }
    }
    return [...new Set(labels)].slice(0, 10);
  }
  return detectModelLabels(exercise?.sequence ?? [], exercise?.intervalKeys ?? []);
}
function getPlaybackEventDescriptors(exercise, chordEntryMode = DEFAULT_CHORD_ENTRY_MODE, chordRepeat = DEFAULT_CHORD_REPEAT) {
  if (exercise?.type === "chords") {
    const labels = [];
    (exercise.chords ?? []).forEach((chord, chordIndex) => {
      const n = chordIndex + 1;
      if (chordEntryMode === "gradual" && chordIndex === 0) {
        const order = getChordEntryOrder(chord);
        const firstLabel = chordVoiceLabel(order[0]);
        const partialLabel = `${chordVoiceLabel(order[0])} + ${chordVoiceLabel(order[1])}`;
        labels.push({ label: `Acorde ${n}: ${firstLabel}`, chordIndex, kind: "single" });
        if (chordRepeat) labels.push({ label: `Acorde ${n}: ${firstLabel} · rep.`, chordIndex, kind: "singleRepeat" });
        labels.push({ label: `Acorde ${n}: ${partialLabel}`, chordIndex, kind: "partial" });
        if (chordRepeat) labels.push({ label: `Acorde ${n}: ${partialLabel} · rep.`, chordIndex, kind: "partialRepeat" });
        labels.push({ label: `Acorde ${n}: completo`, chordIndex, kind: "full" });
        if (chordRepeat) labels.push({ label: `Acorde ${n}: completo · rep.`, chordIndex, kind: "fullRepeat" });
      } else {
        labels.push({ label: `Acorde ${n}`, chordIndex, kind: "full" });
        if (chordRepeat) labels.push({ label: `Acorde ${n} · rep.`, chordIndex, kind: "fullRepeat" });
      }
    });
    return labels;
  }
  if (exercise?.type === "harmonic") {
    return (exercise.pairs ?? []).map((pair, index) => ({ label: `Intervalo ${index + 1}`, pairIndex: index }));
  }
  return (exercise?.sequence ?? []).map((note, index) => ({ label: `Nota ${index + 1}`, noteIndex: index }));
}

function initialSettings() {
  const defaults = {
    noteCount: DEFAULT_NOTE_COUNT,
    tempo: DEFAULT_TEMPO,
    volume: DEFAULT_VOLUME,
    instrument: DEFAULT_INSTRUMENT,
    selectedIntervalKeys: defaultIntervalKeysForMode(DEFAULT_TRAINER_MODE),
    selectedClefKeys: DEFAULT_CLEF_KEYS,
    directionMode: DEFAULT_DIRECTION_MODE,
    useTwelveToneSeries: false,
    trainerMode: DEFAULT_TRAINER_MODE,
    harmonicResponseMode: DEFAULT_HARMONIC_RESPONSE_MODE,
    chordEntryMode: DEFAULT_CHORD_ENTRY_MODE,
    chordRepeat: DEFAULT_CHORD_REPEAT,
    chordGapMode: DEFAULT_CHORD_GAP_MODE,
    selectedChordLinkModes: DEFAULT_CHORD_LINK_MODES,
    chordBassInstrument: DEFAULT_CHORD_BASS_INSTRUMENT,
    chordMiddleInstrument: DEFAULT_CHORD_MIDDLE_INSTRUMENT,
    chordUpperInstrument: DEFAULT_CHORD_UPPER_INSTRUMENT,
    chordInstrumentPreset: DEFAULT_CHORD_INSTRUMENT_PRESET,
    harmonicLowerVolume: DEFAULT_VOICE_VOLUME,
    harmonicUpperVolume: DEFAULT_VOICE_VOLUME,
    chordBassVolume: DEFAULT_VOICE_VOLUME,
    chordMiddleVolume: DEFAULT_VOICE_VOLUME,
    chordUpperVolume: DEFAULT_VOICE_VOLUME,
  };
  try {
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "null");
    if (!stored) return defaults;
    const storedMode = ["melodic", "harmonic", "chords"].includes(stored.trainerMode) ? stored.trainerMode : defaults.trainerMode;
    const intervalFallback = defaultIntervalKeysForMode(storedMode);
    return {
      ...defaults,
      ...stored,
      selectedIntervalKeys: sanitizeIntervalSelection(stored.selectedIntervalKeys ?? intervalFallback),
      selectedClefKeys: sanitizeClefSelection(stored.selectedClefKeys ?? defaults.selectedClefKeys),
      directionMode: sanitizeDirectionMode(stored.directionMode ?? defaults.directionMode, Number(stored.noteCount ?? defaults.noteCount)),
      noteCount: clamp(Number(stored.noteCount ?? defaults.noteCount), MIN_NOTES, MAX_NOTES),
      tempo: clamp(Number(stored.tempo ?? defaults.tempo), MIN_TEMPO, MAX_TEMPO),
      volume: clamp(Number(stored.volume ?? defaults.volume), MIN_VOLUME, MAX_VOLUME),
      instrument: INSTRUMENTS.some((item) => item.value === stored.instrument) ? stored.instrument : DEFAULT_INSTRUMENT,
      trainerMode: storedMode,
      harmonicResponseMode: stored.harmonicResponseMode === "full" ? "full" : "givenBass",
      chordEntryMode: stored.chordEntryMode === "direct" ? "direct" : "gradual",
      chordRepeat: typeof stored.chordRepeat === "boolean" ? stored.chordRepeat : DEFAULT_CHORD_REPEAT,
      // La separación de acordes queda fija por ahora: salida gradual + pequeño silencio real.
      chordGapMode: DEFAULT_CHORD_GAP_MODE,
      selectedChordLinkModes: sanitizeChordLinkModes(stored.selectedChordLinkModes ?? DEFAULT_CHORD_LINK_MODES),
      chordBassInstrument: INSTRUMENTS.some((item) => item.value === stored.chordBassInstrument) ? stored.chordBassInstrument : DEFAULT_CHORD_BASS_INSTRUMENT,
      chordMiddleInstrument: INSTRUMENTS.some((item) => item.value === stored.chordMiddleInstrument) ? stored.chordMiddleInstrument : DEFAULT_CHORD_MIDDLE_INSTRUMENT,
      chordUpperInstrument: INSTRUMENTS.some((item) => item.value === stored.chordUpperInstrument) ? stored.chordUpperInstrument : DEFAULT_CHORD_UPPER_INSTRUMENT,
      chordInstrumentPreset: CHORD_INSTRUMENT_PRESETS.some((item) => item.key === stored.chordInstrumentPreset) ? stored.chordInstrumentPreset : DEFAULT_CHORD_INSTRUMENT_PRESET,
      harmonicLowerVolume: clamp(Number(stored.harmonicLowerVolume ?? defaults.harmonicLowerVolume), MIN_VOLUME, MAX_VOLUME),
      harmonicUpperVolume: clamp(Number(stored.harmonicUpperVolume ?? defaults.harmonicUpperVolume), MIN_VOLUME, MAX_VOLUME),
      chordBassVolume: clamp(Number(stored.chordBassVolume ?? defaults.chordBassVolume), MIN_VOLUME, MAX_VOLUME),
      chordMiddleVolume: clamp(Number(stored.chordMiddleVolume ?? defaults.chordMiddleVolume), MIN_VOLUME, MAX_VOLUME),
      chordUpperVolume: clamp(Number(stored.chordUpperVolume ?? defaults.chordUpperVolume), MIN_VOLUME, MAX_VOLUME),
    };
  } catch {
    return defaults;
  }
}

function initialStats() {
  const defaults = { totalSeconds: 0, exercises: 0, correct: 0, incorrect: 0 };
  try {
    const stored = JSON.parse(window.localStorage.getItem(STATS_KEY) || "null");
    return stored ? { ...defaults, ...stored } : defaults;
  } catch {
    return defaults;
  }
}

function initialMarks() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(MARKS_KEY) || "[]");
    return Array.isArray(stored) ? stored.slice(0, 80) : [];
  } catch {
    return [];
  }
}

function formatDateTime(timestamp) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "—";
  }
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function scoreFromStats(stats) {
  const total = stats.correct + stats.incorrect;
  if (!total) return 0;
  return Math.round((stats.correct / total) * 100);
}

function Badge({ children }) {
  return <span className="rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 sm:px-3 sm:text-xs">{children}</span>;
}

function SelectionChip({ active, onClick, children, disabled = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`min-h-[34px] rounded-full border px-2.5 py-1 text-xs transition sm:min-h-[36px] sm:px-3 sm:py-1.5 sm:text-sm ${
        active
          ? "aural-active"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function ActionButton({ active, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border px-4 py-3 text-sm font-semibold transition sm:w-auto sm:px-5 ${
        disabled
          ? "border-zinc-300 bg-white text-zinc-400"
          : active
            ? "aural-black-button"
            : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 hover:bg-zinc-50"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function VoiceVolumeControl({ label, value, onChange }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</span>
        <span className="text-[11px] font-semibold text-zinc-700">{value}%</span>
      </div>
      <input
        type="range"
        min={MIN_VOLUME}
        max={MAX_VOLUME}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-sky-600"
      />
    </div>
  );
}

function ClefChip({ clef, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={clef.label}
      aria-label={clef.label}
      className={`inline-flex min-h-[34px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-normal transition sm:min-h-[38px] sm:px-3.5 sm:py-1.5 sm:text-sm ${
        active
          ? "aural-active"
          : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 hover:bg-zinc-50"
      }`}
    >
      {clef.label}
    </button>
  );
}

function noteY(note, clef) {
  const shift = clef.displayOctaveShift ?? 0;
  const noteIndex = diatonicIndex(note.letter, note.octave + shift);
  const refIndex = diatonicIndex(clef.staffRefLetter, clef.staffRefOctave);
  return clef.staffRefY - (noteIndex - refIndex) * 7;
}

function ledgerLinesForY(x, y) {
  const lines = [];
  for (let lineY = 30; lineY >= y - 1; lineY -= 14) lines.push({ x, y: lineY });
  for (let lineY = 114; lineY <= y + 1; lineY += 14) lines.push({ x, y: lineY });
  return lines;
}

function clefNeedsManual15Annotation(clef) {
  return clef?.key === "treble15ma";
}

function addClefToStave(stave, clef) {
  if (!stave || !clef) return;
  if (clefNeedsManual15Annotation(clef)) {
    stave.addClef(clef.vex);
    return;
  }
  if (clef.clefAnnotation) {
    try {
      stave.addClef(clef.vex, "default", clef.clefAnnotation);
      return;
    } catch {
      // Algunos builds de VexFlow aceptan anotaciones solo para ciertos casos.
    }
  }
  stave.addClef(clef.vex);
}

function appendManualClefAnnotation(svg, clef, x, y) {
  if (!svg || !clefNeedsManual15Annotation(clef)) return;
  const ns = "http://www.w3.org/2000/svg";
  const text = document.createElementNS(ns, "text");
  text.setAttribute("x", String(x));
  text.setAttribute("y", String(y));
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("font-family", "Georgia, 'Times New Roman', serif");
  text.setAttribute("font-size", "15");
  text.setAttribute("font-weight", "700");
  text.setAttribute("letter-spacing", "-0.5");
  text.setAttribute("fill", "#111");
  text.textContent = "15";
  svg.appendChild(text);
}

function MobileClefOverlay({ clefKey }) {
  const clefRef = useRef(null);

  useLayoutEffect(() => {
    const node = clefRef.current;
    if (!node) return;
    node.innerHTML = "";

    try {
      const clef = getClefConfig(clefKey ?? "treble");
      const { Renderer, Stave } = VF;
      // Móvil: esta capa fija funciona como máscara blanca. Oculta notas y líneas
      // adicionales cuando el pentagrama se desliza por debajo, pero redibuja las
      // cinco líneas para que no se perciba un hueco entre la clave fija y el pentagrama.
      const width = 104;
      const height = 206;
      const staveY = 60;
      const renderer = new Renderer(node, Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();
      const stave = new Stave(0, staveY, width);

      if (VF.Barline?.type?.NONE && typeof stave.setBegBarType === "function") {
        stave.setBegBarType(VF.Barline.type.NONE);
      }
      if (VF.Barline?.type?.NONE && typeof stave.setEndBarType === "function") {
        stave.setEndBarType(VF.Barline.type.NONE);
      }

      addClefToStave(stave, clef);

      stave.setContext(context).draw();

      const svg = node.querySelector("svg");
      if (svg) {
        const ns = "http://www.w3.org/2000/svg";
        svg.setAttribute("width", String(width));
        svg.setAttribute("height", String(height));
        svg.setAttribute("style", "display:block; overflow:visible; background:transparent;");

        const topY = typeof stave.getYForLine === "function" ? stave.getYForLine(0) : staveY;
        const bottomY = typeof stave.getYForLine === "function" ? stave.getYForLine(4) : topY + 40;

        // Oculta cualquier barra vertical que VexFlow haya dibujado al final de la
        // clave fija. Luego se redibujan solo las líneas horizontales para que la
        // unión con el pentagrama móvil sea visualmente continua.
        const eraseBar = document.createElementNS(ns, "rect");
        eraseBar.setAttribute("x", String(width - 12));
        eraseBar.setAttribute("y", String(topY - 16));
        eraseBar.setAttribute("width", "18");
        eraseBar.setAttribute("height", String(bottomY - topY + 32));
        eraseBar.setAttribute("fill", "white");
        eraseBar.setAttribute("stroke", "none");
        svg.appendChild(eraseBar);

        for (let line = 0; line <= 4; line += 1) {
          const y = typeof stave.getYForLine === "function" ? stave.getYForLine(line) : topY + line * 10;
          const staffLine = document.createElementNS(ns, "line");
          staffLine.setAttribute("x1", String(width - 12));
          staffLine.setAttribute("x2", String(width));
          staffLine.setAttribute("y1", String(y));
          staffLine.setAttribute("y2", String(y));
          staffLine.setAttribute("stroke", "#111");
          staffLine.setAttribute("stroke-width", "1");
          staffLine.setAttribute("stroke-linecap", "butt");
          svg.appendChild(staffLine);
        }

        appendManualClefAnnotation(svg, clef, 36, topY - 16);
      }
    } catch (error) {
      console.warn("No se pudo dibujar la clave móvil:", error);
    }
  }, [clefKey]);

  return (
    <div
      ref={clefRef}
      aria-hidden="true"
      className="mobile-clef-mask pointer-events-none absolute left-0 top-0 bottom-0 z-20 block w-[104px] overflow-hidden bg-white sm:hidden"
    />
  );
}

function Staff({ exercise, attemptNotes = [], revealFull = false, onNotePress = null, chordEntryMode = DEFAULT_CHORD_ENTRY_MODE }) {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const touchRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const [renderError, setRenderError] = useState("");
  const [scrollMetrics, setScrollMetrics] = useState({ left: 0, max: 0 });

  const updateScrollMetrics = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    setScrollMetrics({ left: node.scrollLeft, max: Math.max(0, node.scrollWidth - node.clientWidth) });
  }, []);

  const scrollStaffBy = useCallback((amount) => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollBy({ left: amount, behavior: "smooth" });
    window.setTimeout(updateScrollMetrics, 220);
  }, [updateScrollMetrics]);

  useLayoutEffect(() => {
    function renderStaff() {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";
      setRenderError("");

      const clef = getClefConfig(exercise?.clefKey ?? "treble");
      const isHarmonic = exercise?.type === "harmonic";
      const isChordExercise = exercise?.type === "chords";
      const target = exercise?.sequence ?? [];
      const fullSlots = isChordExercise
        ? (() => {
            const chordSlots = (exercise?.chords ?? []).map((chord, index) => {
              const attempt = (attemptNotes ?? [])[index] ?? {};
              return {
                lower: attempt.lower ?? chord.lower,
                middle: attempt.middle ?? chord.middle,
                upper: attempt.upper ?? chord.upper,
                lowerVisible: Boolean(attempt.lowerVisible),
                middleVisible: Boolean(attempt.middleVisible),
                upperVisible: Boolean(attempt.upperVisible),
                lowerStatus: attempt.lowerStatus ?? null,
                middleStatus: attempt.middleStatus ?? null,
                upperStatus: attempt.upperStatus ?? null,
              };
            });
            if (chordEntryMode !== "gradual" || !chordSlots.length) return chordSlots;
            const first = chordSlots[0];
            const firstOrder = getChordEntryOrder(exercise?.chords?.[0] ?? first);
            const firstVoice = firstOrder[0] ?? "lower";
            const secondVoice = firstOrder[1] ?? CHORD_VOICES.find((voice) => voice !== firstVoice) ?? "middle";
            const thirdVoice = firstOrder[2] ?? CHORD_VOICES.find((voice) => voice !== firstVoice && voice !== secondVoice) ?? "upper";
            const secondAnswered = revealFull || Boolean(first?.[`${secondVoice}Visible`]);
            const thirdAnswered = revealFull || Boolean(first?.[`${thirdVoice}Visible`]);
            const statusOf = (voice) => first?.[`${voice}Status`] ?? null;
            const makeGradualSlot = (visibleVoices, statusByVoice, visualKind) => ({
              lower: first.lower,
              middle: first.middle,
              upper: first.upper,
              lowerVisible: visibleVoices.includes("lower"),
              middleVisible: visibleVoices.includes("middle"),
              upperVisible: visibleVoices.includes("upper"),
              lowerStatus: statusByVoice.lower ?? null,
              middleStatus: statusByVoice.middle ?? null,
              upperStatus: statusByVoice.upper ?? null,
              visualKind,
            });
            return [
              // 1) Solo la nota inicial — es una nota dada, no muestra acierto ni error.
              makeGradualSlot([firstVoice], {}, "single"),
              // 2) Después de responder la segunda nota, se muestra el bicorde completo,
              // pero solo la nota nueva conserva su acierto/error. La nota fija no cuenta visualmente.
              makeGradualSlot(
                secondAnswered ? [firstVoice, secondVoice] : [],
                secondAnswered ? { [secondVoice]: statusOf(secondVoice) } : {},
                "partial"
              ),
              // 3) Después de responder la tercera nota, se muestra el primer tricorde completo,
              // pero solo la tercera nota conserva su acierto/error. Las dos anteriores ya fueron respondidas.
              makeGradualSlot(
                thirdAnswered ? [firstVoice, secondVoice, thirdVoice] : [],
                thirdAnswered ? { [thirdVoice]: statusOf(thirdVoice) } : {},
                "full"
              ),
              // 4) Desde el siguiente tricorde en adelante, cada acorde muestra sus 3 respuestas.
              ...chordSlots.slice(1),
            ];
          })()
        : isHarmonic
          ? (exercise?.pairs ?? []).map((pair, index) => {
              const attempt = (attemptNotes ?? [])[index] ?? {};
              return {
                lower: attempt.lower ?? pair.lower,
                upper: attempt.upper ?? pair.upper,
                lowerVisible: Boolean(attempt.lowerVisible),
                upperVisible: Boolean(attempt.upperVisible),
                lowerStatus: attempt.lowerStatus ?? null,
                upperStatus: attempt.upperStatus ?? null,
              };
            })
          : (target.length ? target : attemptNotes.map((entry) => entry.note).filter(Boolean)).map((note, index) => {
              const attempt = (attemptNotes ?? [])[index];
              return attempt ? { note: attempt.note ?? note, status: attempt.status, visible: true } : { note, status: "hidden", visible: false };
            });
      const entries = fullSlots;

      if (!entries.length) return;

      try {
        const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, GhostNote } = VF;
        const availableWidth = Math.max(300, scrollRef.current?.clientWidth ?? 650);
        const compact = availableWidth < 560;
        const noteCount = Math.max(1, entries.length);
        // En móvil aprovechamos el scroll horizontal: es preferible hacer el
        // pentagrama más largo antes que comprimir las notas. Esto evita que
        // se empalmen y deja una zona segura antes de la doble barra final.
        const clefReserve = compact ? 122 : 92;
        const finalReserve = compact ? 96 : 42;
        const noteStartPadding = compact ? 58 : 34;
        const compactBaseSpacing = isChordExercise ? 72 : isHarmonic ? 66 : 62;
        const noteSpacing = compact
          ? noteCount <= 2
            ? 92
            : noteCount <= 4
              ? 82
              : compactBaseSpacing
          : noteCount <= 2
            ? 92
            : noteCount <= 4
              ? 80
              : clamp(Math.floor((availableWidth - clefReserve - finalReserve) / Math.max(1, noteCount)), 42, 70);
        const naturalWidth = clefReserve + finalReserve + Math.max(1, noteCount) * noteSpacing;
        let width = noteCount <= 2
          ? Math.min(availableWidth, Math.max(compact ? 300 : 330, naturalWidth))
          : compact
            ? Math.max(Math.min(availableWidth, 360), naturalWidth)
            : Math.min(availableWidth, Math.max(naturalWidth, Math.min(availableWidth, 520)));
        width = Math.max(compact ? 300 : 330, Math.round(width));
        const height = compact ? 190 : 204;
        // En móvil la clave queda fija fuera del SVG desplazable. El pentagrama móvil
        // empieza desde el borde para que sus líneas se unan visualmente con la clave fija
        // y para evitar la doble clave al desplazar horizontalmente.
        const staveX = compact ? 0 : 14;
        const staveY = compact ? 52 : 58;
        const staveRightPadding = compact ? 28 : 28;
        const staveWidth = Math.max(180, width - staveX - staveRightPadding);
        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
        renderer.resize(width, height);
        const context = renderer.getContext();
        const stave = new Stave(staveX, staveY, staveWidth);
        if (VF.Barline?.type?.END && typeof stave.setEndBarType === "function") {
          stave.setEndBarType(VF.Barline.type.END);
        }
        if (!compact) {
          addClefToStave(stave, clef);
        }
        if (typeof stave.getNoteStartX === "function" && typeof stave.setNoteStartX === "function") {
          stave.setNoteStartX(stave.getNoteStartX() + noteStartPadding);
        }
        stave.setContext(context).draw();

        const accidentalState = new Map();
        const noteGroups = entries.map((entry) => {
          if (!isHarmonic && !isChordExercise) return [{ note: entry.note, role: "single", status: entry.status, visible: entry.visible !== false }];
          const group = [];
          if (isChordExercise) {
            if (entry.lowerVisible) group.push({ note: entry.lower, role: "lower", status: entry.lowerStatus, visible: true });
            if (entry.middleVisible) group.push({ note: entry.middle, role: "middle", status: entry.middleStatus, visible: true });
            if (entry.upperVisible) group.push({ note: entry.upper, role: "upper", status: entry.upperStatus, visible: true });
            if (!group.length && entry.lower) group.push({ note: entry.lower, role: "placeholder", status: "hidden", visible: false });
            return group;
          }
          if (entry.lowerVisible) group.push({ note: entry.lower, role: "lower", status: entry.lowerStatus, visible: true });
          if (entry.upperVisible) group.push({ note: entry.upper, role: "upper", status: entry.upperStatus, visible: true });
          if (!group.length && entry.lower) group.push({ note: entry.lower, role: "placeholder", status: "hidden", visible: false });
          return group;
        });

        const vexNotes = noteGroups.map((group) => {
          const allHidden = group.every((item) => item.visible === false);
          if (allHidden && typeof GhostNote === "function") {
            return new GhostNote({ duration: "w" });
          }

          const renderGroup = group;

          const staveNote = new StaveNote({
            clef: clef.vex,
            keys: renderGroup.map(({ note }) => noteToVexKey(note, clef)),
            duration: "w",
          });

          renderGroup.forEach(({ note, visible }, noteIndex) => {
            if (visible === false) return;
            const stateKey = `${note.letter}${note.octave + (clef.displayOctaveShift ?? 0)}`;
            const previousAccidental = accidentalState.get(stateKey) ?? 0;
            if (note.accidental !== 0) {
              staveNote.addModifier(new Accidental(ACCIDENTAL_ASCII[note.accidental]), noteIndex);
            } else if (previousAccidental !== 0) {
              staveNote.addModifier(new Accidental("n"), noteIndex);
            }
            accidentalState.set(stateKey, note.accidental);
          });
          return staveNote;
        });

        const voice = new Voice({ num_beats: entries.length * 4, beat_value: 4 });
        if (typeof voice.setMode === "function" && Voice.Mode) voice.setMode(Voice.Mode.SOFT);
        if (typeof voice.setStrict === "function") voice.setStrict(false);
        voice.addTickables(vexNotes);
        const formatWidth = compact
          ? Math.max(180, Math.max(1, noteCount) * noteSpacing)
          : Math.max(150, width - clefReserve - finalReserve - noteStartPadding);
        new Formatter().joinVoices([voice]).format([voice], formatWidth);

        voice.draw(context, stave);

        const svg = containerRef.current.querySelector("svg");
        const ns = "http://www.w3.org/2000/svg";
        if (svg) {
          svg.setAttribute("style", "display:block; max-width:none; overflow:visible;");
          svg.setAttribute("width", String(width));
          svg.setAttribute("height", String(height));
          if (!compact) {
            const topY = typeof stave.getYForLine === "function" ? stave.getYForLine(0) : staveY;
            appendManualClefAnnotation(svg, clef, staveX + 36, topY - 16);
          }

          const drawFinalDoubleBar = () => {
            const finalX = staveX + staveWidth;
            const topY = typeof stave.getYForLine === "function" ? stave.getYForLine(0) : (compact ? 52 : 58);
            const bottomY = typeof stave.getYForLine === "function" ? stave.getYForLine(4) : topY + 40;
            const cover = document.createElementNS(ns, "rect");
            cover.setAttribute("x", String(finalX - 14));
            cover.setAttribute("y", String(topY - 4));
            cover.setAttribute("width", "18");
            cover.setAttribute("height", String(bottomY - topY + 8));
            cover.setAttribute("fill", "white");
            cover.setAttribute("stroke", "none");
            svg.appendChild(cover);

            for (let line = 0; line <= 4; line += 1) {
              const y = typeof stave.getYForLine === "function" ? stave.getYForLine(line) : topY + line * 10;
              const staffLine = document.createElementNS(ns, "line");
              staffLine.setAttribute("x1", String(finalX - 14));
              staffLine.setAttribute("x2", String(finalX));
              staffLine.setAttribute("y1", String(y));
              staffLine.setAttribute("y2", String(y));
              staffLine.setAttribute("stroke", "#8f8f8f");
              staffLine.setAttribute("stroke-width", "1");
              svg.appendChild(staffLine);
            }

            const thin = document.createElementNS(ns, "line");
            thin.setAttribute("x1", String(finalX - 7));
            thin.setAttribute("x2", String(finalX - 7));
            thin.setAttribute("y1", String(topY));
            thin.setAttribute("y2", String(bottomY));
            thin.setAttribute("stroke", "#111");
            thin.setAttribute("stroke-width", "1.6");
            svg.appendChild(thin);

            const thick = document.createElementNS(ns, "line");
            thick.setAttribute("x1", String(finalX - 1.5));
            thick.setAttribute("x2", String(finalX - 1.5));
            thick.setAttribute("y1", String(topY));
            thick.setAttribute("y2", String(bottomY));
            thick.setAttribute("stroke", "#111");
            thick.setAttribute("stroke-width", "6");
            thick.setAttribute("stroke-linecap", "butt");
            svg.appendChild(thick);
          };

          drawFinalDoubleBar();

          entries.forEach((entry, index) => {
            const vexNote = vexNotes[index];
            const beginX = typeof vexNote.getNoteHeadBeginX === "function" ? vexNote.getNoteHeadBeginX() : null;
            const endX = typeof vexNote.getNoteHeadEndX === "function" ? vexNote.getNoteHeadEndX() : null;
            const absoluteX = typeof vexNote.getAbsoluteX === "function" ? vexNote.getAbsoluteX() : 88 + index * 68;
            const noteX = typeof beginX === "number" && typeof endX === "number" ? (beginX + endX) / 2 : absoluteX;
            const ys = typeof vexNote.getYs === "function" ? vexNote.getYs() : [92];
            const drawMark = (status, y, placement = "above") => {
              if (status !== "correct" && status !== "wrong") return;
              const color = status === "correct" ? "#16a34a" : "#dc2626";
              const mark = document.createElementNS(ns, "text");
              mark.setAttribute("x", String(noteX));
              mark.setAttribute("y", String(placement === "below" ? y + 34 : y - 25));
              mark.setAttribute("text-anchor", "middle");
              mark.setAttribute("dominant-baseline", "middle");
              mark.setAttribute("font-size", "19");
              mark.setAttribute("font-weight", "800");
              mark.setAttribute("fill", color);
              mark.textContent = status === "correct" ? "✓" : "×";
              svg.appendChild(mark);
            };

            const addNoteHitArea = (note, y) => {
              if (typeof onNotePress !== "function" || !note) return;
              const hit = document.createElementNS(ns, "rect");
              hit.setAttribute("x", String(noteX - 24));
              hit.setAttribute("y", String(y - 34));
              hit.setAttribute("width", "48");
              hit.setAttribute("height", "68");
              hit.setAttribute("fill", "rgba(0,0,0,0.001)");
              hit.setAttribute("stroke", "none");
              hit.setAttribute("opacity", "0.001");
              hit.setAttribute("pointer-events", "all");
              hit.setAttribute("style", "cursor:pointer; pointer-events:all;");
              hit.setAttribute("aria-label", `Escuchar ${note.label}`);
              hit.addEventListener("pointerdown", (event) => {
                event.preventDefault();
                event.stopPropagation();
              });
              hit.addEventListener("mousedown", (event) => event.stopPropagation());
              hit.addEventListener("touchstart", (event) => event.stopPropagation(), { passive: true });
              hit.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                onNotePress(note);
              });
              svg.appendChild(hit);
            };

            if (!isHarmonic && !isChordExercise) {
              const y = Array.isArray(ys) && ys.length ? ys[0] : 92;
              if (entry.visible !== false) {
                drawMark(entry.status, y, "above");
                addNoteHitArea(entry.note, y);
              }
            } else {
              const group = noteGroups[index];
              const groupYs = [];
              const visibleGroup = group.map((item, groupIndex) => ({
                ...item,
                y: ys[groupIndex] ?? ys[0] ?? 92,
              })).filter((item) => item.visible !== false);
              visibleGroup.forEach((item) => groupYs.push(item.y));

              if (isChordExercise) {
                const staffTop = typeof stave.getYForLine === "function" ? stave.getYForLine(0) : 34;
                const staffBottom = typeof stave.getYForLine === "function" ? stave.getYForLine(4) : 74;
                const highestNoteY = groupYs.length ? Math.min(...groupYs) : staffTop;
                const lowestNoteY = groupYs.length ? Math.max(...groupYs) : staffBottom;
                const topBaseY = Math.min(staffTop - 22, highestNoteY - 30);
                const bottomMarkY = Math.max(staffBottom + 32, lowestNoteY + 34);
                const topStatusItems = visibleGroup
                  .filter((item) => item.role !== "lower" && (item.status === "correct" || item.status === "wrong"))
                  .sort((a, b) => (a.role === "upper" ? -1 : 1) - (b.role === "upper" ? -1 : 1));

                const drawChordMark = (item, y) => {
                  const color = item.status === "correct" ? "#16a34a" : "#dc2626";
                  const mark = document.createElementNS(ns, "text");
                  mark.setAttribute("x", String(noteX));
                  mark.setAttribute("y", String(y));
                  mark.setAttribute("text-anchor", "middle");
                  mark.setAttribute("dominant-baseline", "middle");
                  mark.setAttribute("font-size", item.role === "middle" ? "17" : "18");
                  mark.setAttribute("font-weight", "800");
                  mark.setAttribute("fill", color);
                  mark.textContent = item.status === "correct" ? "✓" : "×";
                  svg.appendChild(mark);
                };

                visibleGroup.forEach((item) => {
                  if (item.role !== "lower" || (item.status !== "correct" && item.status !== "wrong")) return;
                  drawChordMark(item, bottomMarkY);
                });
                topStatusItems.forEach((item, slotIndex) => {
                  const y = topBaseY - (topStatusItems.length - 1 - slotIndex) * 24;
                  drawChordMark(item, y);
                });
              } else {
                visibleGroup.forEach((item) => {
                  drawMark(item.status, item.y, item.role === "lower" ? "below" : "above");
                });
              }
              const groupNotes = isChordExercise
                ? visibleGroup
                    .filter((item) => CHORD_VOICES.includes(item.role))
                    .map((item) => ({ note: item.note, voice: item.role, sourceMode: "chords" }))
                : group
                    .filter((item) => item.visible !== false)
                    .map((item) => isHarmonic ? { note: item.note, voice: item.role, sourceMode: "harmonic" } : item.note)
                    .filter(Boolean);
              if (typeof onNotePress === "function" && groupNotes.length) {
                const minY = groupYs.length ? Math.min(...groupYs) : 58;
                const maxY = groupYs.length ? Math.max(...groupYs) : 112;
                const hit = document.createElementNS(ns, "rect");
                hit.setAttribute("x", String(noteX - 28));
                hit.setAttribute("y", String(minY - 38));
                hit.setAttribute("width", "56");
                hit.setAttribute("height", String(Math.max(76, maxY - minY + 76)));
                hit.setAttribute("fill", "rgba(0,0,0,0.001)");
                hit.setAttribute("stroke", "none");
                hit.setAttribute("opacity", "0.001");
                hit.setAttribute("pointer-events", "all");
                hit.setAttribute("style", "cursor:pointer; outline:none; pointer-events:all;");
                hit.setAttribute("aria-label", isChordExercise ? "Escuchar acorde" : "Escuchar intervalo armónico");
                hit.addEventListener("pointerdown", (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                });
                hit.addEventListener("mousedown", (event) => event.stopPropagation());
                hit.addEventListener("touchstart", (event) => event.stopPropagation(), { passive: true });
                hit.addEventListener("click", (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onNotePress(groupNotes);
                });
                svg.appendChild(hit);
              }
            }
          });
        }

        window.setTimeout(() => {
          updateScrollMetrics();
        }, 0);
      } catch (error) {
        console.error("Error al renderizar la partitura:", error);
        setRenderError("Hubo un problema al dibujar la partitura.");
      }
    }
    renderStaff();
  }, [attemptNotes, chordEntryMode, exercise, revealFull, onNotePress, updateScrollMetrics]);

  const handlePointerDown = useCallback((event) => {
    const node = scrollRef.current;
    if (!node || node.scrollWidth <= node.clientWidth) return;
    dragRef.current = { active: true, startX: event.clientX, startScrollLeft: node.scrollLeft };
    node.setPointerCapture?.(event.pointerId);
  }, []);
  const handlePointerMove = useCallback((event) => {
    const node = scrollRef.current;
    if (!node || !dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    node.scrollLeft = dragRef.current.startScrollLeft - delta;
    updateScrollMetrics();
  }, [updateScrollMetrics]);
  const stopDrag = useCallback(() => { dragRef.current.active = false; }, []);
  const handleTouchStart = useCallback((event) => {
    const node = scrollRef.current;
    if (!node || node.scrollWidth <= node.clientWidth || !event.touches?.length) return;
    touchRef.current = { active: true, startX: event.touches[0].clientX, startScrollLeft: node.scrollLeft };
  }, []);
  const handleTouchMove = useCallback((event) => {
    const node = scrollRef.current;
    if (!node || !touchRef.current.active || !event.touches?.length) return;
    const delta = event.touches[0].clientX - touchRef.current.startX;
    node.scrollLeft = touchRef.current.startScrollLeft - delta;
    updateScrollMetrics();
  }, [updateScrollMetrics]);
  const stopTouch = useCallback(() => { touchRef.current.active = false; }, []);
  const progress = scrollMetrics.max > 0 ? Math.min(100, Math.max(0, ((scrollMetrics.left + 1) / scrollMetrics.max) * 100)) : 0;

  const currentClef = getClefConfig(exercise?.clefKey ?? "treble");

  return (
    <div className="mx-auto w-full max-w-full min-w-0 space-y-2 overflow-hidden">
      <div className="relative">
        {false ? (
          <div />
        ) : null}
      <div
        ref={scrollRef}
        onScroll={updateScrollMetrics}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopTouch}
        onTouchCancel={stopTouch}
        className="staff-scroll w-full min-w-0 max-w-full cursor-grab touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-xl bg-white px-1 pt-2 pb-2 active:cursor-grabbing sm:px-2"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", touchAction: "pan-x", scrollBehavior: "auto" }}
      >
        <div className="flex w-max min-w-full justify-start px-20 sm:w-full sm:justify-center sm:px-0">
          <div ref={containerRef} className="inline-block flex-none align-top" />
        </div>
      </div>
      <MobileClefOverlay clefKey={exercise?.clefKey ?? "treble"} />
      </div>
      {scrollMetrics.max > 4 ? (
        <div className="flex items-center gap-2 px-1 sm:hidden">
          <button type="button" onClick={() => scrollStaffBy(-180)} className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600">←</button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-zinc-500 transition-all" style={{ width: `${Math.max(16, progress)}%` }} /></div>
          <button type="button" onClick={() => scrollStaffBy(180)} className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600">→</button>
        </div>
      ) : null}
      {renderError ? <p className="text-sm text-red-600">{renderError}</p> : null}
    </div>
  );
}

function TunerStrip({ cents, label, sublabel, micEnabled, active, centsHistoryRef, centsHistoryIdxRef, compact = false, holdProgress = 0, completed = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const xForCents = (value) => w / 2 + (clamp(value, -TUNER_RANGE_CENTS, TUNER_RANGE_CENTS) / TUNER_RANGE_CENTS) * (w / 2 - 7);
    const greenLeft = xForCents(-IN_TUNE_THRESHOLD);
    const greenRight = xForCents(IN_TUNE_THRESHOLD);

    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "rgba(248,113,113,0.11)");
    gradient.addColorStop(0.36, "rgba(248,113,113,0.035)");
    gradient.addColorStop(0.50, "rgba(16,185,129,0.055)");
    gradient.addColorStop(0.64, "rgba(248,113,113,0.035)");
    gradient.addColorStop(1, "rgba(248,113,113,0.11)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = completed ? "rgba(16,185,129,0.34)" : "rgba(16,185,129,0.22)";
    ctx.fillRect(greenLeft, 0, Math.max(2, greenRight - greenLeft), h);

    ctx.strokeStyle = "rgba(15,23,42,0.08)";
    ctx.lineWidth = 1;
    [-50, -25, 0, 25, 50].forEach((mark) => {
      const x = xForCents(mark);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    });

    ctx.strokeStyle = completed ? "rgba(5,150,105,0.75)" : "rgba(15,23,42,0.38)";
    ctx.lineWidth = completed ? 2 : 1.25;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Historial vertical invertido: la lectura más reciente nace en la punta
    // superior de la línea azul/verde actual y las lecturas anteriores se van
    // desplazando hacia abajo. Eje X = cents, eje Y = antigüedad.
    if (active && centsHistoryRef?.current) {
      const buf = centsHistoryRef.current;
      const len = buf.length;
      const idx = centsHistoryIdxRef.current;
      let drawing = false;
      let previousInTune = false;
      for (let i = 0; i < len; i += 1) {
        const j = ((idx - 1 - i) % len + len) % len;
        const value = buf[j];
        if (!Number.isFinite(value)) {
          if (drawing) ctx.stroke();
          drawing = false;
          previousInTune = false;
          continue;
        }
        const x = xForCents(value);
        const y = (i / Math.max(1, len - 1)) * h;
        const isInTune = Math.abs(value) <= IN_TUNE_THRESHOLD;
        if (!drawing) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.strokeStyle = isInTune ? "#047857" : "#0f172a";
          ctx.lineWidth = isInTune ? 2 : 1.45;
          drawing = true;
        } else if (isInTune !== previousInTune) {
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.strokeStyle = isInTune ? "#047857" : "#0f172a";
          ctx.lineWidth = isInTune ? 2 : 1.45;
        } else {
          ctx.lineTo(x, y);
        }
        previousInTune = isInTune;
      }
      if (drawing) ctx.stroke();
    }
  }, [active, cents, centsHistoryIdxRef, centsHistoryRef, completed, micEnabled]);

  const valid = cents !== null && cents !== undefined && !Number.isNaN(cents);
  const clamped = valid ? clamp(cents, -TUNER_RANGE_CENTS, TUNER_RANGE_CENTS) : 0;
  const linePct = 50 + (clamped / TUNER_RANGE_CENTS) * 50;
  const inTune = valid && Math.abs(cents) <= IN_TUNE_THRESHOLD;
  const bandLeft = 50 - (IN_TUNE_THRESHOLD / TUNER_RANGE_CENTS) * 50;
  const bandWidth = (IN_TUNE_THRESHOLD * 2 / TUNER_RANGE_CENTS) * 50;

  return (
    <div className={`rounded-xl border bg-white p-2 transition ${completed ? "border-emerald-400 bg-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.22)]" : inTune ? "border-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]" : "border-zinc-200"}`}>
      <div className="relative h-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 sm:h-[4.75rem]">
        <canvas ref={canvasRef} className="block h-full w-full" />
        <div className="pointer-events-none absolute inset-y-0 rounded-sm bg-emerald-300/28" style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }} />
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-zinc-900/45" />
        {valid ? (
          <div
            className={`pointer-events-none absolute top-0 h-full w-0.5 transition-[left,background-color] duration-75 ease-linear ${inTune ? "bg-emerald-700 shadow-[0_0_8px_rgba(4,120,87,0.45)]" : "bg-sky-500"}`}
            style={{ left: `${clamp(linePct, 0, 100)}%` }}
          />
        ) : null}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full rounded-full transition-[width,background-color] duration-150 ease-linear ${completed ? "bg-emerald-600" : "bg-emerald-500"}`} style={{ width: `${Math.round(holdProgress * 100)}%` }} />
      </div>
    </div>
  );
}

function TunerPanel({ notes = [], visible = false }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const centsHistoryRef = useRef(new Float32Array(PITCH_HISTORY_LEN).fill(NaN));
  const centsHistoryIdxRef = useRef(0);
  const accumulatedHoldMsRef = useRef(0);
  const lastCenteredAtRef = useRef(null);
  const lastDetectionAtRef = useRef(null);
  const completedRef = useRef(new Set());
  const completionTimeoutRef = useRef(null);
  const isCompletingRef = useRef(false);
  const modeRef = useRef("study");
  const targetIndexRef = useRef(0);
  const notesRef = useRef(notes);
  const holdSecondsRef = useRef(1);
  const lastCentsRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState("study");
  const [targetIndex, setTargetIndex] = useState(0);
  const [detectedHz, setDetectedHz] = useState(null);
  const [detectedLabel, setDetectedLabel] = useState("—");
  const [cents, setCents] = useState(null);
  const [holdSeconds, setHoldSeconds] = useState(1);
  const [holdProgress, setHoldProgress] = useState(0);
  const [completedFlash, setCompletedFlash] = useState(false);

  const targetNote = notes[targetIndex] ?? null;
  const detectedMidi = detectedHz ? frequencyToNearestMidi(detectedHz) : null;
  const samePitchClass = mode !== "study" || !targetNote || (detectedMidi != null && pitchClassOf(detectedMidi) === pitchClassOf(targetNote));
  const inTune = Number.isFinite(cents) && Math.abs(cents) <= IN_TUNE_THRESHOLD && samePitchClass;
  const activeNoteName = mode === "study" && targetNote ? targetNote.label : detectedLabel;

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { targetIndexRef.current = targetIndex; }, [targetIndex]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { holdSecondsRef.current = holdSeconds; }, [holdSeconds]);

  useEffect(() => {
    setHoldProgress(Math.min(1, accumulatedHoldMsRef.current / (holdSeconds * 1000)));
  }, [holdSeconds]);

  const resetCurrentTargetProgress = useCallback((clearHistory = false) => {
    if (completionTimeoutRef.current) window.clearTimeout(completionTimeoutRef.current);
    completionTimeoutRef.current = null;
    isCompletingRef.current = false;
    setCompletedFlash(false);
    setHoldProgress(0);
    accumulatedHoldMsRef.current = 0;
    lastCenteredAtRef.current = null;
    if (clearHistory) {
      centsHistoryRef.current.fill(NaN);
      centsHistoryIdxRef.current = 0;
      lastCentsRef.current = null;
    }
  }, []);

  const resetTunerState = useCallback(() => {
    if (completionTimeoutRef.current) window.clearTimeout(completionTimeoutRef.current);
    completionTimeoutRef.current = null;
    isCompletingRef.current = false;
    setTargetIndex(0);
    targetIndexRef.current = 0;
    setDetectedHz(null);
    setDetectedLabel("—");
    setCents(null);
    setHoldProgress(0);
    setCompletedFlash(false);
    completedRef.current = new Set();
    accumulatedHoldMsRef.current = 0;
    lastCenteredAtRef.current = null;
    lastDetectionAtRef.current = null;
    lastCentsRef.current = null;
    centsHistoryRef.current.fill(NaN);
    centsHistoryIdxRef.current = 0;
  }, []);

  useEffect(() => { resetTunerState(); }, [notes, resetTunerState]);

  const stopListening = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (completionTimeoutRef.current) window.clearTimeout(completionTimeoutRef.current);
    completionTimeoutRef.current = null;
    try { sourceRef.current?.disconnect(); } catch {}
    try { streamRef.current?.getTracks()?.forEach((track) => track.stop()); } catch {}
    sourceRef.current = null;
    streamRef.current = null;
    analyserRef.current = null;
    setIsListening(false);
    lastCenteredAtRef.current = null;
    isCompletingRef.current = false;
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  const setTargetManually = useCallback((nextIndex) => {
    const list = notesRef.current ?? [];
    const bounded = clamp(nextIndex, 0, Math.max(0, list.length - 1));
    targetIndexRef.current = bounded;
    setTargetIndex(bounded);
    resetCurrentTargetProgress(false);
  }, [resetCurrentTargetProgress]);

  const advanceTarget = useCallback(() => {
    const list = notesRef.current ?? [];
    completedRef.current.add(targetIndexRef.current);
    const next = targetIndexRef.current < list.length - 1 ? targetIndexRef.current + 1 : targetIndexRef.current;
    targetIndexRef.current = next;
    setTargetIndex(next);
    resetCurrentTargetProgress(false);
  }, [resetCurrentTargetProgress]);

  const completeCurrentTarget = useCallback(() => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    completedRef.current.add(targetIndexRef.current);
    setCompletedFlash(true);
    setHoldProgress(1);
    if (completionTimeoutRef.current) window.clearTimeout(completionTimeoutRef.current);
    completionTimeoutRef.current = window.setTimeout(() => {
      const list = notesRef.current ?? [];
      if (targetIndexRef.current < list.length - 1) {
        advanceTarget();
      } else {
        isCompletingRef.current = false;
        setCompletedFlash(true);
        accumulatedHoldMsRef.current = holdSecondsRef.current * 1000;
        setHoldProgress(1);
      }
    }, TUNER_COMPLETE_DELAY_MS);
  }, [advanceTarget]);

  const adjustHoldSeconds = useCallback((direction) => {
    const current = holdSecondsRef.current;
    let index = TUNER_HOLD_OPTIONS.findIndex((seconds) => seconds === current);
    if (index < 0) {
      index = TUNER_HOLD_OPTIONS.reduce((bestIndex, seconds, candidateIndex) => (
        Math.abs(seconds - current) < Math.abs(TUNER_HOLD_OPTIONS[bestIndex] - current) ? candidateIndex : bestIndex
      ), 0);
    }
    const nextIndex = clamp(index + direction, 0, TUNER_HOLD_OPTIONS.length - 1);
    setHoldSeconds(TUNER_HOLD_OPTIONS[nextIndex]);
  }, []);

  const analyse = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioContextRef.current;
    if (!analyser || !ctx) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    const freq = autoCorrelatePitch(buffer, ctx.sampleRate, TUNER_YIN_THRESHOLD);
    const now = performance.now();
    const activeMode = modeRef.current;
    const list = notesRef.current ?? [];
    const activeTarget = list[targetIndexRef.current] ?? null;

    if (!freq) {
      lastCenteredAtRef.current = null;
      // No borrar la lectura ni el progreso por silencios o microcortes.
      // El trazo se mantiene continuo en lugar de parecer que se reinicia.
      const lastDetection = lastDetectionAtRef.current;
      if (lastDetection && now - lastDetection <= TUNER_MICRO_GAP_MS) return;
      if (Number.isFinite(lastCentsRef.current)) {
        centsHistoryRef.current[centsHistoryIdxRef.current] = lastCentsRef.current;
        centsHistoryIdxRef.current = (centsHistoryIdxRef.current + 1) % PITCH_HISTORY_LEN;
      }
      return;
    }

    lastDetectionAtRef.current = now;

    const nearestMidi = frequencyToNearestMidi(freq);
    let rawCents = null;
    let noteIsRelevant = true;

    if (activeMode === "study" && activeTarget) {
      rawCents = centsOffFromPitchClass(freq, activeTarget.midi);
      noteIsRelevant = pitchClassOf(nearestMidi) === pitchClassOf(activeTarget);
    } else {
      rawCents = centsOffFromNearestChromatic(freq);
      noteIsRelevant = true;
    }

    if (rawCents == null) return;

    lastCentsRef.current = rawCents;
    centsHistoryRef.current[centsHistoryIdxRef.current] = rawCents;
    centsHistoryIdxRef.current = (centsHistoryIdxRef.current + 1) % PITCH_HISTORY_LEN;

    setDetectedHz(freq);
    setDetectedLabel(midiToSimpleNote(nearestMidi).label);
    setCents(rawCents);

    if (activeMode === "study" && activeTarget) {
      if (isCompletingRef.current) return;
      const centered = noteIsRelevant && Math.abs(rawCents) <= IN_TUNE_THRESHOLD;
      if (centered) {
        const last = lastCenteredAtRef.current;
        const delta = last ? Math.min(100, Math.max(0, now - last)) : 0;
        accumulatedHoldMsRef.current += delta;
        lastCenteredAtRef.current = now;
        const progress = Math.min(1, accumulatedHoldMsRef.current / (holdSecondsRef.current * 1000));
        setHoldProgress(progress);
        if (progress >= 1) completeCurrentTarget();
      } else {
        lastCenteredAtRef.current = null;
        setHoldProgress(Math.min(1, accumulatedHoldMsRef.current / (holdSecondsRef.current * 1000)));
      }
    } else {
      lastCenteredAtRef.current = null;
      setHoldProgress(0);
      setCompletedFlash(false);
    }
  }, [completeCurrentTarget]);

  const startListening = useCallback(async () => {
    if (isListening && analyserRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
      if (audioContextRef.current.state === "suspended") await audioContextRef.current.resume();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 }
      });
      const ctx = audioContextRef.current;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      streamRef.current = stream;
      sourceRef.current = source;
      analyserRef.current = analyser;
      setIsListening(true);
      lastDetectionAtRef.current = null;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(analyse, TUNER_ANALYSIS_INTERVAL_MS);
    } catch (error) {
      console.error("No se pudo iniciar el afinador:", error);
      setIsListening(false);
    }
  }, [analyse, isListening]);

  if (!visible || !notes.length) return null;

  return (
    <div className={`mx-auto mt-2 w-full max-w-none rounded-2xl border p-2.5 transition ${completedFlash ? "border-emerald-400 bg-emerald-50/90" : inTune ? "border-emerald-300 bg-emerald-50/70" : "border-zinc-200 bg-zinc-50"}`}>
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
          <button type="button" onClick={() => setMode("study")} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${mode === "study" ? "aural-black-button" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"}`}>Estudio</button>
          <button type="button" onClick={() => setMode("free")} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${mode === "free" ? "aural-black-button" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"}`}>Libre</button>
          {mode === "study" ? <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">{targetIndex + 1}/{notes.length}</span> : null}
        </div>

        <div className="text-center">
          {mode === "study" ? (
            <div className="mb-1 flex min-h-[1.55rem] items-center justify-center">
              {detectedLabel !== "—" ? (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${samePitchClass ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-white text-zinc-700"}`}>
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">detectada</span>
                  <span className="tabular-nums text-zinc-950">{detectedLabel}</span>
                </span>
              ) : null}
            </div>
          ) : null}
          {mode === "study" ? (
            <div className="flex items-center justify-center gap-2">
              <button type="button" onClick={() => setTargetManually(targetIndexRef.current - 1)} className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700">←</button>
              <div className="min-w-[92px] text-center">
                <div className={`text-2xl font-bold leading-none tracking-tight sm:text-3xl ${completedFlash ? "text-emerald-700" : "text-zinc-950"}`}>{activeNoteName}</div>
              </div>
              <button type="button" onClick={() => setTargetManually(targetIndexRef.current + 1)} className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700">→</button>
            </div>
          ) : (
            <div className="min-w-[92px] text-center text-2xl font-bold leading-none tracking-tight text-zinc-950 sm:text-3xl">{activeNoteName}</div>
          )}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-500">
            <span className="tabular-nums">{Number.isFinite(cents) ? `${cents > 0 ? "+" : ""}${cents.toFixed(1)} cents` : "—"}</span>
            {Number.isFinite(detectedHz) ? (
              <>
                <span className="text-zinc-300">·</span>
                <span className="tabular-nums">{detectedHz.toFixed(1)} Hz</span>
              </>
            ) : null}
            {completedFlash ? <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold leading-none text-white">✓</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
          {mode === "study" ? (
            <>
              <div className="flex items-center justify-center gap-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => adjustHoldSeconds(-1)}
                  className="h-8 w-8 rounded-full border border-zinc-300 bg-white text-sm font-bold text-zinc-700"
                  aria-label="Disminuir segundos"
                >
                  −
                </button>
                <span className="min-w-[58px] rounded-full border border-zinc-300 bg-white px-2.5 py-1.5 text-center text-[11px] font-bold text-zinc-800">
                  {holdSeconds}s
                </span>
                <button
                  type="button"
                  onClick={() => adjustHoldSeconds(1)}
                  className="h-8 w-8 rounded-full border border-zinc-300 bg-white text-sm font-bold text-zinc-700"
                  aria-label="Aumentar segundos"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setTargetManually(targetIndexRef.current + 1)}
                  className="rounded-full border border-zinc-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700"
                >
                  Sig.
                </button>
              </div>

              <div className="hidden flex-wrap justify-end gap-1 sm:flex">
                {TUNER_HOLD_OPTIONS.map((seconds) => (
                  <button
                    type="button"
                    key={seconds}
                    onClick={() => setHoldSeconds(seconds)}
                    className={`rounded-full border px-2 py-1 text-[11px] font-semibold transition ${holdSeconds === seconds ? "aural-black-button" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"}`}
                  >
                    {seconds}s
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTargetManually(targetIndexRef.current + 1)}
                  className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:border-zinc-500"
                >
                  Siguiente nota
                </button>
              </div>
            </>
          ) : null}
          {isListening ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Mic activo</span> : <button type="button" onClick={startListening} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-50">Activar micrófono</button>}
        </div>
      </div>

      <TunerStrip
        cents={cents}
        label={mode === "study" ? activeNoteName : detectedLabel}
        sublabel={mode === "study" ? "objetivo · cualquier octava" : "nota más cercana en 12-TET"}
        micEnabled={isListening}
        active={isListening}
        centsHistoryRef={centsHistoryRef}
        centsHistoryIdxRef={centsHistoryIdxRef}
        holdProgress={mode === "study" ? holdProgress : 0}
        completed={completedFlash}
        compact
      />
    </div>
  );
}
function PianoKeyboard({ onPress, disabled = false }) {
  const whiteKeys = PIANO_KEYS.filter((key) => key.type === "white");
  const blackKeys = PIANO_KEYS.filter((key) => key.type === "black");
  return (
    <div className="mx-auto w-full max-w-2xl pt-3 sm:pt-4">
      <div className="relative h-28 w-full select-none overflow-visible rounded-b-2xl border border-zinc-300 bg-zinc-200 p-1.5 shadow-sm sm:h-32 sm:p-2">
        <div className="flex h-full gap-0.5 sm:gap-1">
          {whiteKeys.map((key) => (
            <button
              type="button"
              key={key.pc}
              disabled={disabled}
              onClick={() => onPress(key.pc)}
              className={`relative flex flex-1 items-end justify-center rounded-b-xl border border-zinc-300 bg-white pb-2 text-[10px] font-semibold text-zinc-700 transition hover:bg-zinc-100 sm:pb-3 sm:text-xs ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {key.display}
            </button>
          ))}
        </div>
        {blackKeys.map((key) => (
          <button
            type="button"
            key={key.pc}
            disabled={disabled}
            onClick={() => onPress(key.pc)}
            className={`absolute top-1.5 z-10 flex h-[62px] w-[9.5%] items-start justify-center rounded-b-lg bg-zinc-950 px-1 pt-2 text-center text-[8px] font-semibold leading-tight text-white transition hover:bg-zinc-800 sm:top-2 sm:h-[74px] sm:text-[9px] ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            style={{ left: key.left }}
          >
            <span className="absolute -top-5 left-1/2 w-14 -translate-x-1/2 rounded-full border border-zinc-200 bg-white px-1 py-1 text-[8px] font-semibold leading-none text-zinc-700 shadow-sm sm:-top-6 sm:w-20 sm:px-2 sm:text-[10px]">
              {key.display}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}


function BottomStat({ label, value }) {
  return (
    <div className="min-w-[92px] shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 sm:min-w-0 sm:px-3">
      <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:text-[10px] sm:tracking-[0.16em]">{label}</p>
      <p className="truncate text-sm font-bold text-zinc-900 sm:text-base">{value}</p>
    </div>
  );
}


function AppThemeStyles() {
  return (
    <style>{`
      .app-theme-light {
        --aural-active-bg: #ecfdf5;
        --aural-active-border: #a7f3d0;
        --aural-active-text: #18181b;
        --aural-active-hover: #d1fae5;
        --aural-ring: rgba(16, 185, 129, 0.12);
        --aural-range: #0284c7;
      }
      .aural-active,
      .aural-primary {
        background-color: var(--aural-active-bg) !important;
        border-color: var(--aural-active-border) !important;
        color: var(--aural-active-text) !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.03), 0 0 0 1px var(--aural-ring) !important;
      }
      .aural-active:hover,
      .aural-primary:hover {
        background-color: var(--aural-active-hover) !important;
        border-color: var(--aural-active-border) !important;
      }
      .aural-black-button {
        background-color: #18181b !important;
        border-color: #18181b !important;
        color: #ffffff !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.08) !important;
      }
      .aural-black-button:hover {
        background-color: #27272a !important;
        border-color: #27272a !important;
      }
      .aural-mode-active {
        background-color: #18181b !important;
        border-color: #18181b !important;
        color: #ffffff !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.08) !important;
      }
      .aural-mode-active:hover {
        background-color: #27272a !important;
        border-color: #27272a !important;
      }
      .app-theme-light input[type="range"] {
        accent-color: var(--aural-range);
      }
    `}</style>
  );
}

export default function IntervalTrainerPage() {
  const saved = useMemo(() => (typeof window !== "undefined" ? initialSettings() : null), []);
  const savedStats = useMemo(() => (typeof window !== "undefined" ? initialStats() : null), []);
  const savedMarks = useMemo(() => (typeof window !== "undefined" ? initialMarks() : []), []);
  const audioContextRef = useRef(null);
  const soundfontCacheRef = useRef(new Map());
  const audioOutputRef = useRef(null);
  const activeFallbackNodesRef = useRef([]);
  const activePlayersRef = useRef([]);
  const playbackTimeoutRef = useRef(null);
  const playbackCursorTimeoutsRef = useRef([]);
  const playbackSessionRef = useRef(0);

  const [noteCount, setNoteCount] = useState(saved?.noteCount ?? DEFAULT_NOTE_COUNT);
  const [tempo, setTempo] = useState(saved?.tempo ?? DEFAULT_TEMPO);
  const [volume, setVolume] = useState(saved?.volume ?? DEFAULT_VOLUME);
  const [instrument, setInstrument] = useState(saved?.instrument ?? DEFAULT_INSTRUMENT);
  const [selectedIntervalKeys, setSelectedIntervalKeys] = useState(saved?.selectedIntervalKeys ?? defaultIntervalKeysForMode(saved?.trainerMode ?? DEFAULT_TRAINER_MODE));
  const [selectedClefKeys, setSelectedClefKeys] = useState(saved?.selectedClefKeys ?? DEFAULT_CLEF_KEYS);
  const [directionMode, setDirectionMode] = useState(saved?.directionMode ?? DEFAULT_DIRECTION_MODE);
  const [useTwelveToneSeries, setUseTwelveToneSeries] = useState(saved?.useTwelveToneSeries ?? false);
  const [trainerMode, setTrainerMode] = useState(saved?.trainerMode ?? DEFAULT_TRAINER_MODE);
  const [harmonicResponseMode, setHarmonicResponseMode] = useState(saved?.harmonicResponseMode ?? DEFAULT_HARMONIC_RESPONSE_MODE);
  const [chordEntryMode, setChordEntryMode] = useState(saved?.chordEntryMode ?? DEFAULT_CHORD_ENTRY_MODE);
  const [chordRepeat, setChordRepeat] = useState(saved?.chordRepeat ?? DEFAULT_CHORD_REPEAT);
  const [chordGapMode, setChordGapMode] = useState(saved?.chordGapMode ?? DEFAULT_CHORD_GAP_MODE);
  const [selectedChordLinkModes, setSelectedChordLinkModes] = useState(saved?.selectedChordLinkModes ?? DEFAULT_CHORD_LINK_MODES);
  const [chordBassInstrument, setChordBassInstrument] = useState(saved?.chordBassInstrument ?? DEFAULT_CHORD_BASS_INSTRUMENT);
  const [chordMiddleInstrument, setChordMiddleInstrument] = useState(saved?.chordMiddleInstrument ?? DEFAULT_CHORD_MIDDLE_INSTRUMENT);
  const [chordUpperInstrument, setChordUpperInstrument] = useState(saved?.chordUpperInstrument ?? DEFAULT_CHORD_UPPER_INSTRUMENT);
  const [chordInstrumentPreset, setChordInstrumentPreset] = useState(saved?.chordInstrumentPreset ?? DEFAULT_CHORD_INSTRUMENT_PRESET);
  const [harmonicLowerVolume, setHarmonicLowerVolume] = useState(saved?.harmonicLowerVolume ?? DEFAULT_VOICE_VOLUME);
  const [harmonicUpperVolume, setHarmonicUpperVolume] = useState(saved?.harmonicUpperVolume ?? DEFAULT_VOICE_VOLUME);
  const [chordBassVolume, setChordBassVolume] = useState(saved?.chordBassVolume ?? DEFAULT_VOICE_VOLUME);
  const [chordMiddleVolume, setChordMiddleVolume] = useState(saved?.chordMiddleVolume ?? DEFAULT_VOICE_VOLUME);
  const [chordUpperVolume, setChordUpperVolume] = useState(saved?.chordUpperVolume ?? DEFAULT_VOICE_VOLUME);
  const [exercise, setExercise] = useState(() => {
    const mode = saved?.trainerMode ?? DEFAULT_TRAINER_MODE;
    if (mode === "chords") {
      return buildChordSequence(clamp(saved?.noteCount ?? 4, CHORD_MIN_COUNT, CHORD_MAX_COUNT), saved?.selectedIntervalKeys ?? DEFAULT_CHORD_INTERVAL_KEYS, saved?.selectedClefKeys ?? DEFAULT_CLEF_KEYS, saved?.selectedChordLinkModes ?? DEFAULT_CHORD_LINK_MODES);
    }
    if (mode === "harmonic") {
      return buildHarmonicSequence(clamp(saved?.noteCount ?? 4, HARMONIC_MIN_PAIRS, HARMONIC_MAX_PAIRS), saved?.selectedIntervalKeys ?? DEFAULT_INTERVAL_KEYS, saved?.selectedClefKeys ?? DEFAULT_CLEF_KEYS);
    }
    const count = saved?.useTwelveToneSeries
      ? clamp(saved.noteCount, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES)
      : clamp(saved?.noteCount ?? DEFAULT_NOTE_COUNT, MIN_NOTES, MAX_NOTES);
    return saved?.useTwelveToneSeries
      ? buildTwelveToneSeries(count, saved.selectedIntervalKeys, saved.selectedClefKeys)
      : buildMelody(count, saved?.selectedIntervalKeys ?? DEFAULT_INTERVAL_KEYS, saved?.selectedClefKeys ?? DEFAULT_CLEF_KEYS, saved?.directionMode ?? DEFAULT_DIRECTION_MODE);
  });
  const [attemptNotes, setAttemptNotes] = useState(() => makeInitialAttempts(exercise, saved?.harmonicResponseMode ?? DEFAULT_HARMONIC_RESPONSE_MODE));
  const [nextIndex, setNextIndex] = useState(1);
  const [harmonicStep, setHarmonicStep] = useState(() => firstHarmonicStep(exercise, saved?.harmonicResponseMode ?? DEFAULT_HARMONIC_RESPONSE_MODE));
  const [chordStep, setChordStep] = useState(() => firstChordStep(exercise));
  const [revealFull, setRevealFull] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buttonFlash, setButtonFlash] = useState(false);
  const [stats, setStats] = useState(savedStats ?? { totalSeconds: 0, exercises: 0, correct: 0, incorrect: 0 });
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [timeMarks, setTimeMarks] = useState(savedMarks);
  const [playbackStartIndex, setPlaybackStartIndex] = useState(0);
  const [playbackCursorIndex, setPlaybackCursorIndex] = useState(0);
  const playbackLoopRef = useRef(false);

  const selectedInstrument = useMemo(() => INSTRUMENTS.find((item) => item.value === instrument) ?? INSTRUMENTS.find((item) => item.value === DEFAULT_INSTRUMENT), [instrument]);
  const hasSelectedIntervals = selectedIntervalKeys.length > 0;
  const hasSelectedClefs = selectedClefKeys.length > 0;
  const isHarmonicMode = trainerMode === "harmonic";
  const isChordMode = trainerMode === "chords";
  const twelveToneUsableIntervals = useMemo(() => getTwelveToneIntervalKeys(selectedIntervalKeys), [selectedIntervalKeys]);
  const canGenerate = hasSelectedIntervals && hasSelectedClefs && (!isChordMode || selectedChordLinkModes.length > 0) && (isHarmonicMode || isChordMode || !useTwelveToneSeries || twelveToneUsableIntervals.length > 0);
  const safeNoteCount = isChordMode ? clamp(noteCount, CHORD_MIN_COUNT, CHORD_MAX_COUNT) : (isHarmonicMode ? clamp(noteCount, HARMONIC_MIN_PAIRS, HARMONIC_MAX_PAIRS) : (useTwelveToneSeries ? clamp(noteCount, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES) : clamp(noteCount, MIN_NOTES, MAX_NOTES)));
  const expectedNote = isChordMode && chordStep
    ? exercise.chords?.[chordStep.chordIndex]?.[chordStep.voice]
    : isHarmonicMode && harmonicStep
      ? exercise.pairs?.[harmonicStep.pairIndex]?.[harmonicStep.voice]
      : exercise.sequence?.[nextIndex] ?? null;
  const exerciseComplete = isChordMode ? chordStep == null : (isHarmonicMode ? harmonicStep == null : nextIndex >= (exercise.sequence?.length ?? 0));
  const score = scoreFromStats(stats);
  const savedTotals = useMemo(() => {
    const totals = timeMarks.reduce((acc, mark) => {
      acc.totalSeconds += Number(mark.totalSeconds ?? 0);
      acc.exercises += Number(mark.exercises ?? 0);
      acc.correct += Number(mark.correct ?? 0);
      acc.incorrect += Number(mark.incorrect ?? 0);
      return acc;
    }, { totalSeconds: 0, exercises: 0, correct: 0, incorrect: 0 });
    return {
      ...totals,
      savedCount: timeMarks.length,
      score: scoreFromStats({ correct: totals.correct, incorrect: totals.incorrect }),
    };
  }, [timeMarks]);
  const intervalLabels = useMemo(() => getExerciseIntervalLabels(exercise), [exercise]);
  const modelLabels = useMemo(() => getExerciseModelLabels(exercise), [exercise]);
  const tuningNotes = useMemo(() => getExerciseTuningNotes(exercise), [exercise]);
  const playbackEvents = useMemo(() => getPlaybackEventDescriptors(exercise, chordEntryMode, chordRepeat), [exercise, chordEntryMode, chordRepeat]);
  const visibleDirectionOptions = useMemo(() => {
    if (isHarmonicMode || isChordMode || useTwelveToneSeries) return [];
    if (noteCount === 2) return SHORT_DIRECTION_OPTIONS.filter((option) => option.key !== "mixed");
    if (noteCount === 3) return SHORT_DIRECTION_OPTIONS;
    return [];
  }, [isChordMode, isHarmonicMode, noteCount, useTwelveToneSeries]);

  const getVoiceVolumeScalar = useCallback((voice, sourceMode = null) => {
    let value = DEFAULT_VOICE_VOLUME;
    if (sourceMode === "chords") {
      if (voice === "lower") value = chordBassVolume;
      else if (voice === "middle") value = chordMiddleVolume;
      else if (voice === "upper") value = chordUpperVolume;
    } else if (sourceMode === "harmonic") {
      if (voice === "lower") value = harmonicLowerVolume;
      else if (voice === "upper") value = harmonicUpperVolume;
    }
    return clamp(Number(value), MIN_VOLUME, MAX_VOLUME) / 100;
  }, [chordBassVolume, chordMiddleVolume, chordUpperVolume, harmonicLowerVolume, harmonicUpperVolume]);

  useEffect(() => {
    const maxIndex = Math.max(0, playbackEvents.length - 1);
    setPlaybackStartIndex((current) => clamp(current, 0, maxIndex));
    setPlaybackCursorIndex((current) => clamp(current, 0, maxIndex));
  }, [playbackEvents.length]);

  useEffect(() => {
    if (trainerMode === "chords" && tempo === DEFAULT_TEMPO) {
      setTempo(DEFAULT_CHORD_TEMPO);
    }
  }, [trainerMode, tempo]);

  useEffect(() => {
    if (isTimerPaused) return undefined;
    const timer = window.setInterval(() => {
      setStats((current) => ({ ...current, totalSeconds: current.totalSeconds + 1 }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isTimerPaused]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        noteCount,
        tempo,
        volume,
        instrument,
        selectedIntervalKeys,
        selectedClefKeys,
        directionMode,
        useTwelveToneSeries,
        trainerMode,
        harmonicResponseMode,
        chordEntryMode,
        chordRepeat,
        chordGapMode,
        selectedChordLinkModes,
        chordBassInstrument,
        chordMiddleInstrument,
        chordUpperInstrument,
        chordInstrumentPreset,
        harmonicLowerVolume,
        harmonicUpperVolume,
        chordBassVolume,
        chordMiddleVolume,
        chordUpperVolume,
      }));
    } catch {}
  }, [chordBassInstrument, chordBassVolume, chordEntryMode, chordGapMode, chordInstrumentPreset, chordMiddleInstrument, chordMiddleVolume, chordRepeat, chordUpperInstrument, chordUpperVolume, directionMode, harmonicLowerVolume, harmonicResponseMode, harmonicUpperVolume, instrument, noteCount, selectedChordLinkModes, selectedClefKeys, selectedIntervalKeys, tempo, trainerMode, useTwelveToneSeries, volume]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  }, [stats]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MARKS_KEY, JSON.stringify(timeMarks));
    } catch {}
  }, [timeMarks]);

  useEffect(() => {
    if (useTwelveToneSeries) {
      setNoteCount((current) => clamp(current, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES));
    }
  }, [useTwelveToneSeries]);

  useEffect(() => {
    setDirectionMode((current) => sanitizeDirectionMode(current, noteCount));
  }, [noteCount]);

  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio API no disponible en este navegador");
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === "suspended") await audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

  const stopAllAudio = useCallback(() => {
    activePlayersRef.current.forEach((player) => {
      try { player.stop?.(); } catch {}
    });
    activePlayersRef.current = [];

    activeFallbackNodesRef.current.forEach(({ oscillators, gains, filters, masterGain }) => {
      oscillators.forEach((osc) => {
        try { osc.stop(); } catch {}
      });
      [...oscillators, ...gains, ...filters, masterGain].forEach((node) => {
        try { node.disconnect(); } catch {}
      });
    });
    activeFallbackNodesRef.current = [];
  }, []);

  const stopPlayback = useCallback(() => {
    playbackLoopRef.current = false;
    playbackSessionRef.current += 1;
    if (playbackTimeoutRef.current) {
      window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    playbackCursorTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    playbackCursorTimeoutsRef.current = [];
    stopAllAudio();
    setIsPlaying(false);
  }, [stopAllAudio]);

  const getAudioOutput = useCallback((ctx) => {
    const current = audioOutputRef.current;
    if (current?.context === ctx && current?.input) return current.input;

    // Salida acústica común: mantiene el sonido directo limpio y añade una cola
    // muy corta/de baja ganancia para que el apagado de los samples no produzca
    // un corte seco al inicio de la respiración entre acordes.
    const input = ctx.createGain();
    const dry = ctx.createGain();
    const delay = ctx.createDelay(0.7);
    const feedback = ctx.createGain();
    const wetFilter = ctx.createBiquadFilter();
    const wet = ctx.createGain();

    input.gain.value = 1;
    dry.gain.value = 0.96;
    delay.delayTime.value = 0.075;
    feedback.gain.value = 0.14;
    wet.gain.value = 0.055;
    wetFilter.type = "lowpass";
    wetFilter.frequency.value = 2600;
    wetFilter.Q.value = 0.55;

    input.connect(dry);
    dry.connect(ctx.destination);

    input.connect(delay);
    delay.connect(wetFilter);
    wetFilter.connect(wet);
    wet.connect(ctx.destination);
    delay.connect(feedback);
    feedback.connect(delay);

    audioOutputRef.current = { context: ctx, input, dry, delay, feedback, wetFilter, wet };
    return input;
  }, []);

  const setAudioOutputVolume = useCallback((ctx, volumeLevel = 100) => {
    const output = getAudioOutput(ctx);
    const scalar = clamp(Number(volumeLevel), MIN_VOLUME, MAX_VOLUME) / 100;
    try {
      output.gain.cancelScheduledValues(ctx.currentTime);
      output.gain.setTargetAtTime(scalar, ctx.currentTime, 0.012);
    } catch {
      output.gain.value = scalar;
    }
    return output;
  }, [getAudioOutput]);

  useEffect(() => {
    const current = audioOutputRef.current;
    if (!current?.context || !current?.input) return;
    // En acordes aplicamos el volumen en dos niveles: aquí como ganancia maestra
    // para que responda mientras está sonando, y también en el gain de cada
    // sample al programarlo para evitar depender solo de esta ruta global.
    const scalar = isPlaying && exercise?.type === "chords"
      ? clamp(Number(volume), MIN_VOLUME, MAX_VOLUME) / 100
      : 1;
    try {
      current.input.gain.cancelScheduledValues(current.context.currentTime);
      current.input.gain.setTargetAtTime(scalar, current.context.currentTime, 0.012);
    } catch {
      current.input.gain.value = scalar;
    }
  }, [exercise?.type, isPlaying, volume]);

  const getSoundfontInstrument = useCallback(async (ctx, instrumentConfig) => {
    if (!instrumentConfig?.soundfont) return null;
    const cacheKey = instrumentConfig.soundfont;
    if (soundfontCacheRef.current.has(cacheKey)) return soundfontCacheRef.current.get(cacheKey);
    const sfInstrument = await Soundfont.instrument(ctx, instrumentConfig.soundfont, {
      format: "mp3",
      soundfont: SOUNDFONT_LIBRARY,
      destination: getAudioOutput(ctx),
      nameToUrl: (name, sf, format) => `${SOUNDFONT_BASE_URL}/${sf}/${name}-${format}.js`,
    });
    soundfontCacheRef.current.set(cacheKey, sfInstrument);
    return sfInstrument;
  }, [getAudioOutput]);

  const createFallbackVoice = useCallback((ctx, freq, fallbackType, startTime, duration, volumeLevel) => {
    const volumeNorm = (clamp(volumeLevel, MIN_VOLUME, MAX_VOLUME) / 100) * INTERNAL_VOLUME_BOOST;
    const masterGain = ctx.createGain();
    const oscillators = [];
    const gains = [];
    const filters = [];
    let attack = 0.04;
    let release = Math.max(0.1, duration * 0.22);
    let peak = Math.min(1.6, 0.14 * volumeNorm);

    const routeOscillator = ({ type, multiplier = 1, detune = 0, level = 0.5, targetNode = masterGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * multiplier, startTime);
      osc.detune.setValueAtTime(detune, startTime);
      gain.gain.setValueAtTime(level, startTime);
      osc.connect(gain);
      gain.connect(targetNode);
      oscillators.push(osc);
      gains.push(gain);
      return osc;
    };

    if (fallbackType === "voice") {
      attack = 0.09;
      release = Math.max(0.15, duration * 0.24);
      peak = Math.min(1.6, 0.18 * volumeNorm);
      const formant = ctx.createBiquadFilter();
      formant.type = "bandpass";
      formant.frequency.value = 900;
      formant.Q.value = 1.2;
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 2400;
      formant.connect(lowPass);
      lowPass.connect(masterGain);
      filters.push(formant, lowPass);
      routeOscillator({ type: "sawtooth", detune: -4, level: 0.42, targetNode: formant });
      routeOscillator({ type: "triangle", detune: 4, level: 0.32, targetNode: formant });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.08, targetNode: lowPass });
    } else if (fallbackType === "organ") {
      attack = 0.025;
      release = Math.max(0.1, duration * 0.18);
      peak = Math.min(1.6, 0.17 * volumeNorm);
      routeOscillator({ type: "sine", level: 0.72 });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.18 });
      routeOscillator({ type: "triangle", multiplier: 0.5, level: 0.12 });
    } else if (fallbackType === "strings") {
      attack = 0.12;
      release = Math.max(0.15, duration * 0.26);
      peak = Math.min(1.6, 0.17 * volumeNorm);
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 1900;
      lowPass.connect(masterGain);
      filters.push(lowPass);
      routeOscillator({ type: "sawtooth", detune: -6, level: 0.44, targetNode: lowPass });
      routeOscillator({ type: "sawtooth", detune: 6, level: 0.34, targetNode: lowPass });
      routeOscillator({ type: "triangle", multiplier: 2, level: 0.08, targetNode: lowPass });
    } else if (fallbackType === "mallet") {
      attack = 0.01;
      release = Math.max(0.16, duration * 0.5);
      peak = Math.min(1.6, 0.19 * volumeNorm);
      routeOscillator({ type: "sine", level: 0.75 });
      routeOscillator({ type: "triangle", multiplier: 2.01, level: 0.2 });
      routeOscillator({ type: "sine", multiplier: 3.02, level: 0.08 });
    } else if (fallbackType === "bass") {
      attack = 0.018;
      release = Math.max(0.14, duration * 0.4);
      peak = Math.min(1.6, 0.2 * volumeNorm);
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 900;
      lowPass.connect(masterGain);
      filters.push(lowPass);
      routeOscillator({ type: "triangle", level: 0.85, targetNode: lowPass });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.14, targetNode: lowPass });
    } else {
      attack = 0.012;
      release = Math.max(0.12, duration * 0.36);
      peak = Math.min(1.6, 0.2 * volumeNorm);
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 2900;
      lowPass.connect(masterGain);
      filters.push(lowPass);
      routeOscillator({ type: "triangle", level: 0.9, targetNode: lowPass });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.12, targetNode: lowPass });
    }

    const sustainEnd = Math.max(startTime + attack + 0.02, startTime + duration - release);
    masterGain.gain.setValueAtTime(0.0001, startTime);
    masterGain.gain.linearRampToValueAtTime(peak, startTime + attack);
    if (["piano", "mallet"].includes(fallbackType)) {
      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 0.25), sustainEnd);
    } else {
      masterGain.gain.setValueAtTime(peak, sustainEnd);
    }
    masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    masterGain.connect(getAudioOutput(ctx));

    oscillators.forEach((osc) => {
      osc.start(startTime);
      osc.stop(startTime + duration + 0.06);
    });
    activeFallbackNodesRef.current.push({ oscillators, gains, filters, masterGain });
  }, [getAudioOutput]);

  const createResonanceTail = useCallback((ctx, freq, startTime, duration, volumeLevel) => {
    if (!Number.isFinite(freq) || !Number.isFinite(startTime) || !Number.isFinite(duration) || duration <= 0) return;

    const volumeNorm = (clamp(volumeLevel, MIN_VOLUME, MAX_VOLUME) / 100) * INTERNAL_VOLUME_BOOST;
    const masterGain = ctx.createGain();
    const lowPass = ctx.createBiquadFilter();
    const oscillators = [];
    const gains = [];
    const filters = [lowPass];

    lowPass.type = "lowpass";
    lowPass.frequency.setValueAtTime(1850, startTime);
    lowPass.Q.setValueAtTime(0.45, startTime);
    lowPass.connect(masterGain);

    const routeTailOscillator = ({ type, multiplier = 1, detune = 0, level = 1 }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * multiplier, startTime);
      osc.detune.setValueAtTime(detune, startTime);
      gain.gain.setValueAtTime(level, startTime);
      osc.connect(gain);
      gain.connect(lowPass);
      oscillators.push(osc);
      gains.push(gain);
      return osc;
    };

    routeTailOscillator({ type: "sine", detune: -2, level: 0.82 });
    routeTailOscillator({ type: "triangle", detune: 2, level: 0.28 });

    const peak = Math.min(0.12, 0.018 * volumeNorm);
    const attack = Math.min(0.12, Math.max(0.045, duration * 0.24));
    const hold = Math.min(0.1, Math.max(0.02, duration * 0.18));
    const endTime = startTime + duration;

    masterGain.gain.setValueAtTime(0.0001, startTime);
    masterGain.gain.linearRampToValueAtTime(peak, startTime + attack);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0004, peak * 0.34), Math.min(endTime - 0.02, startTime + attack + hold));
    masterGain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    masterGain.connect(getAudioOutput(ctx));

    oscillators.forEach((osc) => {
      osc.start(startTime);
      osc.stop(endTime + 0.06);
    });
    activeFallbackNodesRef.current.push({ oscillators, gains, filters, masterGain });
  }, [getAudioOutput]);

  const playSoundfontWithManualEnvelope = useCallback((ctx, sfInstrument, note, startTime, options = {}) => {
    if (!ctx || !sfInstrument || !note) return null;

    const eventDuration = Math.max(0.08, Number(options.eventDuration ?? 1));
    const silentTailDuration = Math.max(0, Number(options.silentTailDuration ?? 0));
    const audibleWindow = Math.max(0.05, eventDuration - silentTailDuration);
    const releaseDuration = clamp(Number(options.releaseDuration ?? Math.max(0.02, audibleWindow * 0.1)), 0.012, Math.max(0.012, audibleWindow - 0.02));
    const mainDuration = clamp(Number(options.mainDuration ?? audibleWindow - releaseDuration), 0.04, Math.max(0.04, audibleWindow - releaseDuration));
    const peakGain = Math.max(0.0001, Number(options.envelopeGain ?? options.gain ?? 1));
    const playerGain = Math.max(0, Number(options.playerGain ?? options.gain ?? 1));
    const isChordEvent = Boolean(options.isChordEvent);
    const stopPadding = isChordEvent ? Math.max(0.14, releaseDuration * 0.35) : 0.08;
    const attack = isChordEvent ? Math.min(0.03, Math.max(0.012, eventDuration * 0.004)) : 0.01;
    const fadeStart = startTime + Math.max(attack + 0.02, Math.min(mainDuration, audibleWindow - 0.012));
    const fadeEnd = startTime + Math.min(eventDuration, mainDuration + releaseDuration);
    const playerDuration = Math.max(0.08, fadeEnd - startTime + stopPadding);
    const outputGain = ctx.createGain();
    let cleanupId = null;

    outputGain.gain.cancelScheduledValues(startTime);
    outputGain.gain.setValueAtTime(0.0001, startTime);
    outputGain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    outputGain.gain.setValueAtTime(peakGain, Math.max(startTime + attack, fadeStart - 0.004));
    outputGain.gain.exponentialRampToValueAtTime(0.0001, fadeEnd);
    outputGain.connect(getAudioOutput(ctx));

    const player = sfInstrument.play(noteNameForSoundFont(note.midi), startTime, {
      duration: playerDuration,
      gain: playerGain,
      destination: outputGain,
      attack: 0.001,
      decay: isChordEvent ? 0.05 : 0.06,
      sustain: 1,
      release: 0.015,
      adsr: [0.001, isChordEvent ? 0.05 : 0.06, 1, 0.015],
    });

    const trackedPlayer = {
      stop: () => {
        if (cleanupId) window.clearTimeout(cleanupId);
        try { player?.stop?.(); } catch {}
        try { outputGain.gain.cancelScheduledValues(ctx.currentTime); } catch {}
        try { outputGain.disconnect(); } catch {}
      },
    };

    cleanupId = window.setTimeout(() => {
      try { player?.stop?.(); } catch {}
      try { outputGain.disconnect(); } catch {}
    }, Math.max(0, (fadeEnd + stopPadding + 0.05 - ctx.currentTime) * 1000));

    activePlayersRef.current.push(trackedPlayer);
    return trackedPlayer;
  }, [getAudioOutput]);

  const playExercise = useCallback(async (exerciseToPlay = exercise, startEventIndex = 0, loopFromSelection = false) => {
    const isHarmonic = exerciseToPlay?.type === "harmonic";
    const isChordExercise = exerciseToPlay?.type === "chords";
    const sessionId = playbackSessionRef.current + 1;
    playbackSessionRef.current = sessionId;
    setIsPlaying(true);
    playbackCursorTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    playbackCursorTimeoutsRef.current = [];
    stopAllAudio();

    try {
      const ctx = await ensureAudioContext();
      setAudioOutputVolume(ctx, isChordExercise ? volume : 100);
      const secondsPerBeat = 60 / clamp(tempo, MIN_TEMPO, MAX_TEMPO);
      // En acordes, el tempo se entiende como negra: la redonda completa dura 4 negras.
      // Acordes: cuerpo + salida suave + hueco real, todo dentro de la redonda.
      // A 43 BPM => evento total ≈ 5.58 s; salida ≈ 0.56 s; silencio real ≈ 0.39 s.
      const chordWholeDuration = secondsPerBeat * 4;
      const chordReleaseDuration = chordWholeDuration * 0.10;
      const chordSilenceDuration = chordGapMode === "withSilence" ? chordWholeDuration * 0.07 : 0;
      const chordSoundDuration = Math.max(0.12, chordWholeDuration - chordReleaseDuration - chordSilenceDuration);
      const chordAudibleDuration = chordSoundDuration + chordReleaseDuration;
      const step = isChordExercise ? chordWholeDuration : secondsPerBeat;
      const baseDuration = isChordExercise ? chordAudibleDuration : step * 0.92;
      const fadeTailSeconds = isChordExercise ? chordReleaseDuration + chordSilenceDuration : secondsPerBeat * 0.18;
      playbackLoopRef.current = Boolean(loopFromSelection && isChordExercise);
      const gain = Math.max(
        0,
        (clamp(volume, MIN_VOLUME, MAX_VOLUME) / 100) * (isChordExercise ? CHORD_SOUNDFONT_GAIN_BOOST : SOUNDFONT_GAIN_BOOST)
      );
      const instrumentConfigs = isChordExercise
        ? {
            lower: getInstrumentConfig(chordBassInstrument),
            middle: getInstrumentConfig(chordMiddleInstrument),
            upper: getInstrumentConfig(chordUpperInstrument),
          }
        : { single: selectedInstrument };

      const neededConfigs = isChordExercise
        ? [instrumentConfigs.lower, instrumentConfigs.middle, instrumentConfigs.upper]
        : [selectedInstrument];
      const sfMap = new Map();
      await Promise.all(neededConfigs.map(async (config) => {
        if (!config?.soundfont || sfMap.has(config.value)) return;
        try {
          const sf = await getSoundfontInstrument(ctx, config);
          sfMap.set(config.value, sf);
        } catch (error) {
          console.warn("No se pudo cargar SoundFont. Usando síntesis interna.", error);
          sfMap.set(config.value, null);
        }
      }));

      if (sessionId !== playbackSessionRef.current) return;
      stopAllAudio();
      const baseTime = ctx.currentTime + 0.16;
      const events = [];

      if (isChordExercise) {
        (exerciseToPlay?.chords ?? []).forEach((chord, chordIndex) => {
          const byVoice = {
            lower: { note: chord.lower, instrument: instrumentConfigs.lower, voice: "lower", sourceMode: "chords" },
            middle: { note: chord.middle, instrument: instrumentConfigs.middle, voice: "middle", sourceMode: "chords" },
            upper: { note: chord.upper, instrument: instrumentConfigs.upper, voice: "upper", sourceMode: "chords" },
          };
          const order = getChordEntryOrder(chord);
          const fullChord = CHORD_VOICES.map((voice) => byVoice[voice]).filter((item) => item.note);
          if (chordEntryMode === "gradual" && chordIndex === 0) {
            const single = order.slice(0, 1).map((voice) => byVoice[voice]).filter((item) => item.note);
            const partial = order.slice(0, 2).map((voice) => byVoice[voice]).filter((item) => item.note);
            const full = order.slice(0, 3).map((voice) => byVoice[voice]).filter((item) => item.note);
            events.push(single);
            if (chordRepeat) events.push(single);
            events.push(partial);
            if (chordRepeat) events.push(partial);
            events.push(full);
            if (chordRepeat) events.push(full);
          } else {
            events.push(fullChord);
            if (chordRepeat) events.push(fullChord);
          }
        });
      } else if (isHarmonic) {
        (exerciseToPlay?.pairs ?? []).forEach((pair) => events.push([
          { note: pair.lower, instrument: selectedInstrument, voice: "lower", sourceMode: "harmonic" },
          { note: pair.upper, instrument: selectedInstrument, voice: "upper", sourceMode: "harmonic" },
        ]));
      } else {
        (exerciseToPlay?.sequence ?? []).forEach((note) => events.push([{ note, instrument: selectedInstrument, voice: "single" }]));
      }

      if (!events.length) {
        setIsPlaying(false);
        return;
      }

      const safeStartIndex = clamp(Number(startEventIndex) || 0, 0, Math.max(0, events.length - 1));
      const scheduledEvents = events.slice(safeStartIndex);
      setPlaybackStartIndex(safeStartIndex);
      setPlaybackCursorIndex(safeStartIndex);
      playbackCursorTimeoutsRef.current = scheduledEvents.map((_, index) => window.setTimeout(() => {
        if (sessionId === playbackSessionRef.current) setPlaybackCursorIndex(safeStartIndex + index);
      }, Math.max(0, index * step * 1000)));

      scheduledEvents.forEach((eventNotes, index) => {
        const start = baseTime + index * step;
        eventNotes.forEach(({ note, instrument: instrumentConfig, voice, sourceMode }) => {
          const config = instrumentConfig ?? selectedInstrument;
          const voiceScalar = getVoiceVolumeScalar(voice, sourceMode);
          const noteGain = gain * voiceScalar;
          const noteVolume = clamp(volume * voiceScalar, MIN_VOLUME, MAX_VOLUME);
          const sfInstrument = sfMap.get(config.value);
          const duration = isChordExercise
            ? chordAudibleDuration
            : (config?.sustain ? Math.max(0.24, baseDuration + fadeTailSeconds) : Math.max(0.2, baseDuration + fadeTailSeconds * 0.65));
          const release = isChordExercise ? chordReleaseDuration : Math.max(0.04, fadeTailSeconds * 0.6);
          if (sfInstrument) {
            if (isChordExercise) {
              playSoundfontWithManualEnvelope(ctx, sfInstrument, note, start, {
                eventDuration: chordWholeDuration,
                mainDuration: chordSoundDuration,
                releaseDuration: chordReleaseDuration,
                silentTailDuration: chordSilenceDuration,
                playerGain: noteGain,
                envelopeGain: 1,
                isChordEvent: true,
              });
            } else {
              const player = sfInstrument.play(noteNameForSoundFont(note.midi), start, {
                duration,
                gain: noteGain,
                attack: 0.01,
                decay: 0.06,
                sustain: 1,
                release,
                adsr: [0.01, 0.06, 1, release],
              });
              activePlayersRef.current.push(player);
            }
          } else {
            createFallbackVoice(ctx, midiToFreq(note.midi), config?.fallback ?? "piano", start, duration, noteVolume);
          }
        });
      });

      if (playbackTimeoutRef.current) window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = window.setTimeout(() => {
        if (sessionId === playbackSessionRef.current) {
          playbackTimeoutRef.current = null;
          if (playbackLoopRef.current && isChordExercise) {
            playExercise(exerciseToPlay, safeStartIndex, true);
          } else {
            setIsPlaying(false);
          }
        }
      }, scheduledEvents.length * step * 1000 + fadeTailSeconds * 1000 + 650);
    } catch (error) {
      console.error("Error al reproducir:", error);
      if (sessionId === playbackSessionRef.current) setIsPlaying(false);
    }
  }, [chordBassInstrument, chordEntryMode, chordGapMode, chordMiddleInstrument, chordRepeat, chordUpperInstrument, createFallbackVoice, ensureAudioContext, exercise, getSoundfontInstrument, getVoiceVolumeScalar, playSoundfontWithManualEnvelope, selectedInstrument, setAudioOutputVolume, stopAllAudio, tempo, volume]);

  const selectPlaybackPoint = useCallback((index) => {
    const safeIndex = clamp(Number(index) || 0, 0, Math.max(0, playbackEvents.length - 1));
    setPlaybackStartIndex(safeIndex);
    setPlaybackCursorIndex(safeIndex);
    if (isPlaying && (trainerMode === "chords" || trainerMode === "harmonic") && playbackEvents.length > 1) {
      playExercise(exercise, safeIndex, false);
    }
  }, [exercise, isPlaying, playExercise, playbackEvents.length, trainerMode]);

  useEffect(() => {
    const handleSpacePlayback = (event) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase?.() ?? "";
      if (["input", "textarea", "select", "button"].includes(tagName) || target?.isContentEditable) return;
      if (!((trainerMode === "chords" || trainerMode === "harmonic") && playbackEvents.length > 1)) return;
      event.preventDefault();
      if (isPlaying) {
        stopPlayback();
      } else {
        playExercise(exercise, playbackStartIndex, false);
      }
    };
    window.addEventListener("keydown", handleSpacePlayback);
    return () => window.removeEventListener("keydown", handleSpacePlayback);
  }, [exercise, isPlaying, playbackEvents.length, playbackStartIndex, playExercise, stopPlayback, trainerMode]);

  const playSingleNote = useCallback(async (noteOrNotes) => {
    const rawItems = Array.isArray(noteOrNotes) ? noteOrNotes.filter(Boolean) : [noteOrNotes].filter(Boolean);
    if (!rawItems.length) return;
    const items = rawItems.map((item) => {
      if (item?.note) return item;
      return { note: item, voice: "single" };
    }).filter((item) => item.note);
    const sessionId = playbackSessionRef.current + 1;
    playbackSessionRef.current = sessionId;
    stopAllAudio();
    setIsPlaying(false);
    try {
      const ctx = await ensureAudioContext();
      const isChordPreview = items.some((item) => item.sourceMode === "chords");
      setAudioOutputVolume(ctx, isChordPreview ? volume : 100);
      const gain = Math.max(
        0,
        (clamp(volume, MIN_VOLUME, MAX_VOLUME) / 100) * (isChordPreview ? CHORD_SOUNDFONT_GAIN_BOOST : SOUNDFONT_GAIN_BOOST)
      );
      const configs = items.map((item) => {
        if (item.sourceMode === "chords") {
          if (item.voice === "lower") return getInstrumentConfig(chordBassInstrument);
          if (item.voice === "middle") return getInstrumentConfig(chordMiddleInstrument);
          if (item.voice === "upper") return getInstrumentConfig(chordUpperInstrument);
        }
        return selectedInstrument;
      });
      const sfMap = new Map();
      await Promise.all(configs.map(async (config) => {
        if (!config?.soundfont || sfMap.has(config.value)) return;
        try {
          const sf = await getSoundfontInstrument(ctx, config);
          sfMap.set(config.value, sf);
        } catch (error) {
          console.warn("No se pudo cargar SoundFont para nota aislada. Usando síntesis interna.", error);
          sfMap.set(config.value, null);
        }
      }));
      if (sessionId !== playbackSessionRef.current) return;
      const secondsPerBeat = 60 / clamp(tempo, MIN_TEMPO, MAX_TEMPO);
      const chordWholeDuration = secondsPerBeat * 4;
      const chordPreviewReleaseDuration = chordWholeDuration * 0.10;
      const chordPreviewSilenceDuration = chordGapMode === "withSilence" ? chordWholeDuration * 0.07 : 0;
      const chordPreviewSoundDuration = Math.max(0.12, chordWholeDuration - chordPreviewReleaseDuration - chordPreviewSilenceDuration);
      const chordPreviewDuration = chordWholeDuration;
      const chordPreviewAudibleDuration = chordPreviewSoundDuration + chordPreviewReleaseDuration;
      const start = ctx.currentTime + 0.06;
      items.forEach((item, index) => {
        const note = item.note;
        const config = configs[index] ?? selectedInstrument;
        const voiceScalar = getVoiceVolumeScalar(item.voice, item.sourceMode);
        const noteGain = gain * voiceScalar;
        const noteVolume = clamp(volume * voiceScalar, MIN_VOLUME, MAX_VOLUME);
        const duration = isChordPreview ? chordPreviewAudibleDuration : (config?.sustain ? 1.15 : 0.95);
        const sfInstrument = sfMap.get(config.value);
        if (sfInstrument) {
          if (isChordPreview) {
            playSoundfontWithManualEnvelope(ctx, sfInstrument, note, start, {
              eventDuration: chordPreviewDuration,
              mainDuration: chordPreviewSoundDuration,
              releaseDuration: chordPreviewReleaseDuration,
              silentTailDuration: chordPreviewSilenceDuration,
              playerGain: noteGain,
              envelopeGain: 1,
              isChordEvent: true,
            });
          } else {
            const player = sfInstrument.play(noteNameForSoundFont(note.midi), start, {
              duration,
              gain: noteGain,
              attack: 0.01,
              decay: 0.06,
              sustain: 1,
              release: 0.05,
              adsr: [0.01, 0.06, 1, 0.05],
            });
            activePlayersRef.current.push(player);
          }
        } else {
          createFallbackVoice(ctx, midiToFreq(note.midi), config?.fallback ?? "piano", start, duration, noteVolume);
        }
      });
    } catch (error) {
      console.error("Error al reproducir la nota:", error);
    }
  }, [chordBassInstrument, chordGapMode, chordMiddleInstrument, chordUpperInstrument, createFallbackVoice, ensureAudioContext, getSoundfontInstrument, getVoiceVolumeScalar, playSoundfontWithManualEnvelope, selectedInstrument, setAudioOutputVolume, stopAllAudio, tempo, volume]);

  const startExercise = useCallback(() => {
    if (!canGenerate) return;
    const count = isChordMode
      ? clamp(noteCount, CHORD_MIN_COUNT, CHORD_MAX_COUNT)
      : (isHarmonicMode ? clamp(noteCount, HARMONIC_MIN_PAIRS, HARMONIC_MAX_PAIRS) : (useTwelveToneSeries ? clamp(noteCount, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES) : clamp(noteCount, MIN_NOTES, MAX_NOTES)));
    const nextExercise = isChordMode
      ? buildChordSequence(count, selectedIntervalKeys, selectedClefKeys, selectedChordLinkModes)
      : (isHarmonicMode
        ? buildHarmonicSequence(count, selectedIntervalKeys, selectedClefKeys)
        : (useTwelveToneSeries
          ? buildTwelveToneSeries(count, selectedIntervalKeys, selectedClefKeys)
          : buildMelody(count, selectedIntervalKeys, selectedClefKeys, directionMode)));
    setExercise(nextExercise);
    setAttemptNotes(makeInitialAttempts(nextExercise, harmonicResponseMode));
    setNextIndex(1);
    setHarmonicStep(firstHarmonicStep(nextExercise, harmonicResponseMode));
    setChordStep(firstChordStep(nextExercise));
    setRevealFull(false);
    setPlaybackStartIndex(0);
    setPlaybackCursorIndex(0);
    setStats((current) => ({ ...current, exercises: current.exercises + 1 }));
    setButtonFlash(true);
    window.setTimeout(() => setButtonFlash(false), 420);
    playExercise(nextExercise);
  }, [canGenerate, directionMode, harmonicResponseMode, isChordMode, isHarmonicMode, noteCount, playExercise, selectedChordLinkModes, selectedClefKeys, selectedIntervalKeys, useTwelveToneSeries]);

  const handleKeyboardPress = useCallback((pc) => {
    if (!expectedNote || revealFull) return;
    const correct = pitchClassOf(expectedNote) === pc;
    if (isChordMode && chordStep) {
      setAttemptNotes((current) => current.map((entry, index) => {
        if (index !== chordStep.chordIndex) return entry;
        const next = { ...entry };
        if (chordStep.voice === "lower") {
          next.lowerVisible = true;
          next.lowerStatus = correct ? "correct" : "wrong";
        } else if (chordStep.voice === "middle") {
          next.middleVisible = true;
          next.middleStatus = correct ? "correct" : "wrong";
        } else {
          next.upperVisible = true;
          next.upperStatus = correct ? "correct" : "wrong";
        }
        return next;
      }));
      setChordStep(nextChordStepAfter(chordStep, exercise));
      setStats((current) => ({ ...current, correct: current.correct + (correct ? 1 : 0), incorrect: current.incorrect + (correct ? 0 : 1) }));
      return;
    }
    if (isHarmonicMode && harmonicStep) {
      setAttemptNotes((current) => current.map((entry, index) => {
        if (index !== harmonicStep.pairIndex) return entry;
        const next = { ...entry };
        if (harmonicStep.voice === "lower") {
          next.lowerVisible = true;
          next.lowerStatus = correct ? "correct" : "wrong";
        } else {
          next.upperVisible = true;
          next.upperStatus = correct ? "correct" : "wrong";
        }
        return next;
      }));
      setHarmonicStep(nextHarmonicStepAfter(harmonicStep, exercise, harmonicResponseMode));
      setStats((current) => ({ ...current, correct: current.correct + (correct ? 1 : 0), incorrect: current.incorrect + (correct ? 0 : 1) }));
      return;
    }
    if (correct) {
      setAttemptNotes((current) => [...current, { note: expectedNote, status: "correct" }]);
      setNextIndex((current) => current + 1);
      setStats((current) => ({ ...current, correct: current.correct + 1 }));
    } else {
      setAttemptNotes((current) => [...current, { note: expectedNote, status: "wrong" }]);
      setNextIndex((current) => current + 1);
      setStats((current) => ({ ...current, incorrect: current.incorrect + 1 }));
    }
  }, [chordStep, expectedNote, exercise, harmonicResponseMode, harmonicStep, isChordMode, isHarmonicMode, revealFull]);

  const handleRevealFullAnswer = useCallback(() => {
    if (revealFull) return;
    if (isChordMode) {
      let addedErrors = 0;
      setAttemptNotes((current) => current.map((entry) => {
        const next = { ...entry };
        if (!next.lowerVisible) { next.lowerVisible = true; next.lowerStatus = "wrong"; addedErrors += 1; }
        if (!next.middleVisible) { next.middleVisible = true; next.middleStatus = "wrong"; addedErrors += 1; }
        if (!next.upperVisible) { next.upperVisible = true; next.upperStatus = "wrong"; addedErrors += 1; }
        return next;
      }));
      setChordStep(null);
      if (addedErrors > 0) setStats((current) => ({ ...current, incorrect: current.incorrect + addedErrors }));
      setRevealFull(true);
      return;
    }
    if (isHarmonicMode) {
      let addedErrors = 0;
      setAttemptNotes((current) => current.map((entry) => {
        const next = { ...entry };
        if (!next.lowerVisible) { next.lowerVisible = true; next.lowerStatus = "wrong"; addedErrors += 1; }
        if (!next.upperVisible) { next.upperVisible = true; next.upperStatus = "wrong"; addedErrors += 1; }
        return next;
      }));
      setHarmonicStep(null);
      if (addedErrors > 0) setStats((current) => ({ ...current, incorrect: current.incorrect + addedErrors }));
      setRevealFull(true);
      return;
    }
    const remainingEntries = (exercise.sequence ?? []).slice(nextIndex).map((note) => ({ note, status: "wrong" }));
    if (remainingEntries.length > 0) {
      setAttemptNotes((current) => [...current, ...remainingEntries]);
      setNextIndex(exercise.sequence.length);
      setStats((current) => ({ ...current, incorrect: current.incorrect + remainingEntries.length }));
    }
    setRevealFull(true);
  }, [exercise, isChordMode, isHarmonicMode, nextIndex, revealFull]);

  const toggleInterval = useCallback((intervalKey) => {
    setSelectedIntervalKeys((current) => {
      const exists = current.includes(intervalKey);
      return exists ? current.filter((key) => key !== intervalKey) : sanitizeIntervalSelection([...current, intervalKey]);
    });
  }, []);

  const toggleClef = useCallback((clefKey) => {
    setSelectedClefKeys((current) => {
      const exists = current.includes(clefKey);
      const next = exists ? current.filter((key) => key !== clefKey) : [...current, clefKey];
      return next.length ? sanitizeClefSelection(next) : [];
    });
  }, []);

  const selectAllIntervals = useCallback(() => setSelectedIntervalKeys(INTERVAL_DEFINITIONS.map((item) => item.key)), []);
  const deselectAllIntervals = useCallback(() => setSelectedIntervalKeys([]), []);
  const selectAllClefs = useCallback(() => setSelectedClefKeys(CLEFS.map((item) => item.key)), []);
  const deselectAllClefs = useCallback(() => setSelectedClefKeys([]), []);
  const toggleChordLinkMode = useCallback((modeKey) => {
    setSelectedChordLinkModes((current) => {
      const exists = current.includes(modeKey);
      const next = exists ? current.filter((key) => key !== modeKey) : sanitizeChordLinkModes([...current, modeKey]);
      return next;
    });
  }, []);
  const selectAllChordLinkModes = useCallback(() => setSelectedChordLinkModes(CHORD_LINK_OPTIONS.map((item) => item.key)), []);
  const deselectAllChordLinkModes = useCallback(() => setSelectedChordLinkModes([]), []);

  const applyChordInstrumentPreset = useCallback((presetKey) => {
    const resolved = resolveChordInstrumentPreset(presetKey);
    setChordInstrumentPreset(presetKey);
    if (!resolved) return;
    setChordBassInstrument(resolved.bass);
    setChordMiddleInstrument(resolved.middle);
    setChordUpperInstrument(resolved.upper);
  }, []);

  const addTimeMark = useCallback((label = "Marca de estudio") => {
    setTimeMarks((current) => {
      const nextMark = {
        id: `${Date.now()}-${Math.random()}`,
        label,
        timestamp: Date.now(),
        totalSeconds: stats.totalSeconds,
        exercises: stats.exercises,
        correct: stats.correct,
        incorrect: stats.incorrect,
        score: scoreFromStats(stats),
        trainerMode,
        noteCount: safeNoteCount,
        tempo,
        instrument,
        intervals: selectedIntervalKeys,
        clefs: selectedClefKeys,
      };
      return [nextMark, ...current].slice(0, 80);
    });
    setShowProgressPanel(true);
  }, [instrument, noteCount, safeNoteCount, selectedClefKeys, selectedIntervalKeys, stats, tempo, trainerMode]);

  const clearTimeMarks = useCallback(() => {
    setTimeMarks([]);
    try { window.localStorage.removeItem(MARKS_KEY); } catch {}
  }, []);

  const deleteTimeMark = useCallback((markId) => {
    setTimeMarks((current) => current.filter((mark) => mark.id !== markId));
  }, []);

  const resetScores = useCallback(() => {
    setStats({ totalSeconds: 0, exercises: 0, correct: 0, incorrect: 0 });
    try {
      window.localStorage.removeItem(STATS_KEY);
    } catch {}
  }, []);

  const resetEverything = useCallback(() => {
    stopPlayback();
    const mode = trainerMode;
    const freshIntervals = defaultIntervalKeysForMode(mode);
    const freshExercise = mode === "chords"
      ? buildChordSequence(DEFAULT_NOTE_COUNT, freshIntervals, DEFAULT_CLEF_KEYS, DEFAULT_CHORD_LINK_MODES)
      : mode === "harmonic"
        ? buildHarmonicSequence(DEFAULT_NOTE_COUNT, freshIntervals, DEFAULT_CLEF_KEYS)
        : buildMelody(DEFAULT_NOTE_COUNT, freshIntervals, DEFAULT_CLEF_KEYS, DEFAULT_DIRECTION_MODE);
    setNoteCount(DEFAULT_NOTE_COUNT);
    setTempo(DEFAULT_TEMPO);
    setVolume(DEFAULT_VOLUME);
    setInstrument(DEFAULT_INSTRUMENT);
    setSelectedIntervalKeys(freshIntervals);
    setSelectedClefKeys(DEFAULT_CLEF_KEYS);
    setDirectionMode(DEFAULT_DIRECTION_MODE);
    setUseTwelveToneSeries(false);
    setTrainerMode(mode);
    setHarmonicResponseMode(DEFAULT_HARMONIC_RESPONSE_MODE);
    setChordEntryMode(DEFAULT_CHORD_ENTRY_MODE);
    setChordRepeat(DEFAULT_CHORD_REPEAT);
    setChordGapMode(DEFAULT_CHORD_GAP_MODE);
    setSelectedChordLinkModes(DEFAULT_CHORD_LINK_MODES);
    setChordBassInstrument(DEFAULT_CHORD_BASS_INSTRUMENT);
    setChordMiddleInstrument(DEFAULT_CHORD_MIDDLE_INSTRUMENT);
    setChordUpperInstrument(DEFAULT_CHORD_UPPER_INSTRUMENT);
    setChordInstrumentPreset(DEFAULT_CHORD_INSTRUMENT_PRESET);
    setHarmonicLowerVolume(DEFAULT_VOICE_VOLUME);
    setHarmonicUpperVolume(DEFAULT_VOICE_VOLUME);
    setChordBassVolume(DEFAULT_VOICE_VOLUME);
    setChordMiddleVolume(DEFAULT_VOICE_VOLUME);
    setChordUpperVolume(DEFAULT_VOICE_VOLUME);
    setExercise(freshExercise);
    setAttemptNotes(makeInitialAttempts(freshExercise, DEFAULT_HARMONIC_RESPONSE_MODE));
    setNextIndex(1);
    setHarmonicStep(firstHarmonicStep(freshExercise, DEFAULT_HARMONIC_RESPONSE_MODE));
    setChordStep(firstChordStep(freshExercise));
    setRevealFull(false);
  }, [stopPlayback, trainerMode]);

  useEffect(() => {
    if (trainerMode === "harmonic") {
      setUseTwelveToneSeries(false);
      setNoteCount((current) => clamp(current, HARMONIC_MIN_PAIRS, HARMONIC_MAX_PAIRS));
    } else if (trainerMode === "chords") {
      setUseTwelveToneSeries(false);
      setNoteCount((current) => clamp(current, CHORD_MIN_COUNT, CHORD_MAX_COUNT));
      setTempo((current) => current === DEFAULT_TEMPO ? DEFAULT_CHORD_TEMPO : current);
    }
  }, [trainerMode]);

  const changeTrainerMode = useCallback((nextMode) => {
    setSelectedIntervalKeys((current) => {
      const currentModeDefault = defaultIntervalKeysForMode(trainerMode);
      const nextModeDefault = defaultIntervalKeysForMode(nextMode);
      if (sameIntervalKeySet(current, currentModeDefault)) return nextModeDefault;
      return current;
    });
    setTrainerMode(nextMode);
  }, [trainerMode]);

  const instrumentMountRef = useRef(false);
  useEffect(() => {
    if (!instrumentMountRef.current) {
      instrumentMountRef.current = true;
      return;
    }
    stopPlayback();
  }, [instrument, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      try { audioContextRef.current?.close(); } catch {}
    };
  }, [stopPlayback]);

  return (
    <>
      <AppThemeStyles />
      <div className="min-h-screen overflow-x-hidden bg-zinc-100 px-3 py-4 pb-56 text-zinc-950 sm:px-6 sm:py-6 sm:pb-44 md:px-10 md:py-10 md:pb-36 app-theme-light">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500 sm:text-sm">MÉTODO AURAL</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">Entrenador de intervalos</h1>
            </div>
            <div className="flex rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm"><button type="button" onClick={() => changeTrainerMode("melodic")} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${trainerMode === "melodic" ? "aural-mode-active" : "text-zinc-600 hover:bg-zinc-100"}`}>Melódicos</button><button type="button" onClick={() => changeTrainerMode("harmonic")} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${trainerMode === "harmonic" ? "aural-mode-active" : "text-zinc-600 hover:bg-zinc-100"}`}>Armónicos</button><button type="button" onClick={() => changeTrainerMode("chords")} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${trainerMode === "chords" ? "aural-mode-active" : "text-zinc-600 hover:bg-zinc-100"}`}>Acordes</button></div>
          </div>
        </header>

        <section className="grid gap-4 sm:gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="space-y-5 sm:space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">{isChordMode ? "Número de acordes" : (isHarmonicMode ? "Número de pares" : "Número de notas")}</span>
                  <Badge>{safeNoteCount} {isChordMode ? "acordes" : (isHarmonicMode ? "pares" : "notas")}</Badge>
                </div>
                <input
                  type="range"
                  min={isChordMode ? CHORD_MIN_COUNT : (isHarmonicMode ? HARMONIC_MIN_PAIRS : (useTwelveToneSeries ? TWELVE_TONE_MIN_NOTES : MIN_NOTES))}
                  max={isChordMode ? CHORD_MAX_COUNT : (isHarmonicMode ? HARMONIC_MAX_PAIRS : (useTwelveToneSeries ? TWELVE_TONE_MAX_NOTES : MAX_NOTES))}
                  step={1}
                  value={safeNoteCount}
                  onChange={(event) => setNoteCount(Number(event.target.value))}
                  className="w-full accent-sky-600"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{isChordMode ? 1 : (isHarmonicMode ? 1 : (useTwelveToneSeries ? 4 : 2))}</span>
                  <span>{isChordMode ? 12 : (isHarmonicMode ? 12 : (useTwelveToneSeries ? 12 : 24))}</span>
                </div>
              </div>

              {visibleDirectionOptions.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-700">Dirección para ejercicios cortos</span>
                    <Badge>{SHORT_DIRECTION_OPTIONS.find((option) => option.key === directionMode)?.label ?? "Libre"}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {visibleDirectionOptions.map((option) => (
                      <SelectionChip
                        key={option.key}
                        active={directionMode === option.key}
                        onClick={() => setDirectionMode(option.key)}
                      >
                        {option.label}
                      </SelectionChip>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-700">Intervalos del ejercicio</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={selectAllIntervals} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500">Seleccionar todos</button>
                    <button type="button" onClick={deselectAllIntervals} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500">Deseleccionar todos</button>
                    <Badge>{selectedIntervalKeys.length} activos</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERVAL_DEFINITIONS.map((interval) => (
                    <SelectionChip key={interval.key} active={selectedIntervalKeys.includes(interval.key)} onClick={() => toggleInterval(interval.key)} title={interval.name}>
                      {interval.short}
                    </SelectionChip>
                  ))}
                </div>
                {isChordMode ? (
                  <div className="space-y-3 border-t border-zinc-100 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SelectionChip active={chordEntryMode === "gradual"} onClick={() => setChordEntryMode("gradual")}>Entrada gradual</SelectionChip>
                      <SelectionChip active={chordEntryMode === "direct"} onClick={() => setChordEntryMode("direct")}>Entrada directa</SelectionChip>
                      <SelectionChip active={chordRepeat} onClick={() => setChordRepeat((current) => !current)}>{chordRepeat ? "Con repetición" : "Sin repetición"}</SelectionChip>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Enlace entre acordes</span>
                        <div className="flex gap-2"><button type="button" onClick={selectAllChordLinkModes} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500">Todos</button><button type="button" onClick={deselectAllChordLinkModes} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500">Ninguno</button></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CHORD_LINK_OPTIONS.map((option) => <SelectionChip key={option.key} active={selectedChordLinkModes.includes(option.key)} onClick={() => toggleChordLinkMode(option.key)}>{option.label}</SelectionChip>)}
                      </div>
                    </div>
                  </div>
                ) : !isHarmonicMode ? (<div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                  <SelectionChip active={useTwelveToneSeries} onClick={() => setUseTwelveToneSeries((current) => !current)} title="Serie dodecafónica">Serie dodecafónica</SelectionChip>
                  <span className="text-xs text-zinc-500">Sin repetir clases de altura; disponible de 4 a 12 notas.</span>
                </div>) : (<div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3"><SelectionChip active={harmonicResponseMode === "givenBass"} onClick={() => setHarmonicResponseMode("givenBass")}>Bajo dado</SelectionChip><SelectionChip active={harmonicResponseMode === "full"} onClick={() => setHarmonicResponseMode("full")}>Solo bajo inicial</SelectionChip><span className="text-xs text-zinc-500">Responde siempre de inferior a superior.</span></div>)}
                {!hasSelectedIntervals ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Selecciona al menos un intervalo para generar.</p>
                ) : isChordMode && selectedChordLinkModes.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Selecciona al menos un tipo de enlace entre acordes.</p>
                ) : useTwelveToneSeries && twelveToneUsableIntervals.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">La 8J no puede funcionar sola en serie dodecafónica porque repite la misma clase de altura.</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-700">Claves</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={selectAllClefs} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500">Seleccionar todas</button>
                    <button type="button" onClick={deselectAllClefs} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500">Deseleccionar todas</button>
                    <Badge>{selectedClefKeys.length} activas</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CLEFS.map((clef) => (
                    <ClefChip key={clef.key} clef={clef} active={selectedClefKeys.includes(clef.key)} onClick={() => toggleClef(clef.key)} />
                  ))}
                </div>
                {!hasSelectedClefs ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Selecciona al menos una clave para generar.</p> : null}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Tempo</span><Badge>{tempo} BPM</Badge></div>
                  <input type="range" min={MIN_TEMPO} max={MAX_TEMPO} step={1} value={tempo} onChange={(event) => setTempo(Number(event.target.value))} className="w-full accent-sky-600" />
                  <div className="flex justify-between text-xs text-zinc-500"><span>{MIN_TEMPO} BPM</span><span>{MAX_TEMPO} BPM</span></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Volumen</span><Badge>{volume}%</Badge></div>
                  <input type="range" min={MIN_VOLUME} max={MAX_VOLUME} step={1} value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-full accent-sky-600" />
                  <div className="flex justify-between text-xs text-zinc-500"><span>0%</span><span>100%</span></div>
                </div>
              </div>

              {isChordMode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Combinación de instrumentos</span><Badge>{getChordInstrumentPreset(chordInstrumentPreset)?.label}</Badge></div>
                    <select
                      value={chordInstrumentPreset}
                      onChange={(event) => applyChordInstrumentPreset(event.target.value)}
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-500"
                    >
                      {CHORD_INSTRUMENT_PRESETS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Bajo</span><Badge>{getInstrumentConfig(chordBassInstrument)?.label}</Badge></div>
                      <select value={chordBassInstrument} onChange={(event) => { setChordInstrumentPreset("custom"); setChordBassInstrument(event.target.value); }} className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">{INSTRUMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                      <VoiceVolumeControl label="Vol. bajo" value={chordBassVolume} onChange={setChordBassVolume} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Voz media</span><Badge>{getInstrumentConfig(chordMiddleInstrument)?.label}</Badge></div>
                      <select value={chordMiddleInstrument} onChange={(event) => { setChordInstrumentPreset("custom"); setChordMiddleInstrument(event.target.value); }} className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">{INSTRUMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                      <VoiceVolumeControl label="Vol. medio" value={chordMiddleVolume} onChange={setChordMiddleVolume} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Voz alta</span><Badge>{getInstrumentConfig(chordUpperInstrument)?.label}</Badge></div>
                      <select value={chordUpperInstrument} onChange={(event) => { setChordInstrumentPreset("custom"); setChordUpperInstrument(event.target.value); }} className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">{INSTRUMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                      <VoiceVolumeControl label="Vol. alto" value={chordUpperVolume} onChange={setChordUpperVolume} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Instrumento</span><Badge>{selectedInstrument?.label}</Badge></div>
                    <select value={instrument} onChange={(event) => setInstrument(event.target.value)} className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">
                      {INSTRUMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    {isHarmonicMode ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <VoiceVolumeControl label="Vol. bajo" value={harmonicLowerVolume} onChange={setHarmonicLowerVolume} />
                        <VoiceVolumeControl label="Vol. alto" value={harmonicUpperVolume} onChange={setHarmonicUpperVolume} />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
                <ActionButton active={buttonFlash} onClick={startExercise} disabled={!canGenerate}>
                  <RefreshIcon className="h-4 w-4" /> Generar nueva sucesión
                </ActionButton>
                <ActionButton active={isPlaying} onClick={() => (isPlaying ? stopPlayback() : playExercise(exercise))}>
                  {isPlaying ? <StopIcon className="h-4 w-4" /> : <VolumeIcon className="h-4 w-4" />}
                  {isPlaying ? "Parar" : "Escuchar"}
                </ActionButton>
                <ActionButton active={revealFull} onClick={handleRevealFullAnswer} disabled={revealFull}>
                  {revealFull ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  {revealFull ? "Respuesta completa mostrada" : "Mostrar respuesta completa"}
                </ActionButton>
                {exerciseComplete || revealFull ? (
                  <ActionButton active={buttonFlash} onClick={startExercise} disabled={!canGenerate}>
                    <RefreshIcon className="h-4 w-4" /> Siguiente ejercicio
                  </ActionButton>
                ) : null}
              </div>

              {(isChordMode || isHarmonicMode) && playbackEvents.length > 1 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 shadow-sm sm:px-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Línea de reproducción</p>
                      <p className="text-sm font-semibold text-zinc-800">{playbackEvents[isPlaying ? playbackCursorIndex : playbackStartIndex]?.label ?? 'Inicio'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => isPlaying ? stopPlayback() : playExercise(exercise, playbackStartIndex, false)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${isPlaying ? "aural-black-button" : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 hover:bg-zinc-50"}`}
                      >
                        {isPlaying ? "Detener" : "Escuchar desde aquí"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="relative pt-1 pb-3">
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, playbackEvents.length - 1)}
                        step={1}
                        value={isPlaying ? playbackCursorIndex : playbackStartIndex}
                        onChange={(event) => {
                          selectPlaybackPoint(Number(event.target.value));
                        }}
                        className="relative z-20 w-full"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3">
                        {playbackEvents.map((event, index) => {
                          const left = playbackEvents.length <= 1 ? 0 : (index / (playbackEvents.length - 1)) * 100;
                          const isCurrent = index === (isPlaying ? playbackCursorIndex : playbackStartIndex);
                          const isChordStart = event.kind === "single" || (event.kind === "full" && (index === 0 || playbackEvents[index - 1]?.chordIndex !== event.chordIndex));
                          return (
                            <span
                              key={`playback-tick-${index}`}
                              className={`absolute top-0 -translate-x-1/2 rounded-full ${isCurrent ? "h-4 w-2 bg-zinc-950" : isChordStart ? "h-4 w-[3px] bg-zinc-950" : "h-3.5 w-[2px] bg-zinc-900"}`}
                              style={{ left: `${left}%` }}
                              aria-hidden="true"
                            />
                          );
                        })}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 z-10 h-5">
                        {playbackEvents.map((event, index) => {
                          const left = playbackEvents.length <= 1 ? 0 : (index / (playbackEvents.length - 1)) * 100;
                          return (
                            <button
                              key={`playback-select-${index}`}
                              type="button"
                              aria-label={`Seleccionar ${event.label}`}
                              title={event.label}
                              onClick={() => selectPlaybackPoint(index)}
                              className="absolute top-0 h-5 w-5 -translate-x-1/2 rounded-full bg-transparent"
                              style={{ left: `${left}%` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>1</span>
                      <span>{playbackEvents.length}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm sm:p-2">
                <Staff exercise={exercise} attemptNotes={attemptNotes} revealFull={revealFull} onNotePress={playSingleNote} chordEntryMode={chordEntryMode} />
                <div className="border-t border-zinc-100 px-2 pb-3 pt-1">
                  <TunerPanel notes={tuningNotes} visible={exerciseComplete || revealFull} />
                  {exerciseComplete || revealFull ? null : (
                    <PianoKeyboard onPress={handleKeyboardPress} disabled={false} />
                  )}
                </div>
              </div>

              {exerciseComplete || revealFull ? (
                <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
                  {(!isHarmonicMode && !isChordMode) ? (
                    <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4">
                      <p className="text-sm font-medium text-zinc-500">Modelos reconocibles en la sucesión</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {modelLabels.length > 0 ? (
                          modelLabels.map((label) => <Badge key={label}>{label}</Badge>)
                        ) : (
                          <span className="text-xs text-zinc-500">Sin modelo reconocible en esta sucesión.</span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4">
                    <p className="text-sm font-medium text-zinc-500">{isChordMode ? "Intervalos de los acordes escuchados" : (isHarmonicMode ? "Intervalos armónicos escuchados" : "Saltos entre notas consecutivas")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {intervalLabels.map((item, index) => <Badge key={`${item}-${index}`}>{item}</Badge>)}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {showProgressPanel ? (
        <div className="fixed inset-x-0 top-0 bottom-[92px] z-40 overflow-hidden bg-white/95 p-3 backdrop-blur sm:bottom-[108px] sm:p-5">
          <div className="mx-auto flex h-full max-w-[1800px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Progreso local</p>
                <p className="text-sm text-zinc-600">Datos guardados en este ordenador o teléfono.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={clearTimeMarks} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100">Borrar marcas</button>
                <button type="button" onClick={() => setShowProgressPanel(false)} className="aural-mode-active rounded-xl border px-3 py-2 text-xs font-semibold">Cerrar</button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-6">
              <BottomStat label="Guardados" value={savedTotals.savedCount} />
              <BottomStat label="Tiempo total" value={formatTime(savedTotals.totalSeconds)} />
              <BottomStat label="Ejercicios" value={savedTotals.exercises} />
              <BottomStat label="Aciertos" value={savedTotals.correct} />
              <BottomStat label="Errores" value={savedTotals.incorrect} />
              <BottomStat label="Puntuación" value={`${savedTotals.score}/100`} />
            </div>
            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {timeMarks.length > 0 ? timeMarks.map((mark) => (
                <div key={mark.id} className="group rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-zinc-500">
                        <span>{formatDateTime(mark.timestamp)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-zinc-600">
                        <span>Tiempo: {formatTime(mark.totalSeconds)}</span>
                        <span>Ejercicios: {mark.exercises}</span>
                        <span>Aciertos: {mark.correct}</span>
                        <span>Errores: {mark.incorrect}</span>
                        <span>Puntuación: {mark.score}/100</span>
                        <span>Modo: {mark.trainerMode === "chords" ? "Acordes" : (mark.trainerMode === "harmonic" ? "Armónicos" : "Melódicos")}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTimeMark(mark.id)}
                      aria-label="Eliminar puntaje guardado"
                      title="Eliminar puntaje guardado"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <p className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500">Todavía no hay puntajes guardados. Usa “Guardar puntaje” en la barra inferior para guardar un corte de tu sesión.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-0 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:px-4 sm:py-3">
        <div className="mx-auto flex w-full max-w-full flex-nowrap items-stretch justify-start gap-2 overflow-x-auto overscroll-x-contain px-3 pb-2 pr-10 [-webkit-overflow-scrolling:touch] sm:w-fit sm:justify-center sm:gap-3 sm:px-0 sm:pb-0 sm:pr-0 md:gap-4">
          <BottomStat label="Tiempo" value={formatTime(stats.totalSeconds)} />
          <button
            type="button"
            onClick={() => setIsTimerPaused((current) => !current)}
            className={`inline-flex min-w-[104px] shrink-0 items-center justify-center whitespace-normal rounded-xl border px-3 py-2 text-center text-xs font-semibold leading-tight transition ${isTimerPaused ? "aural-black-button" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100"}`}
          >
            {isTimerPaused ? <span>Reanudar<br />tiempo</span> : <span>Pausar<br />tiempo</span>}
          </button>
          <BottomStat label="Ejercicios" value={stats.exercises} />
          <BottomStat label="Aciertos" value={stats.correct} />
          <BottomStat label="Errores" value={stats.incorrect} />
          <BottomStat label="Puntuación" value={`${score}/100`} />
          <button
            type="button"
            onClick={() => addTimeMark("Puntaje guardado")}
            className="inline-flex min-w-[108px] shrink-0 items-center justify-center gap-2 whitespace-normal rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold leading-tight text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100"
          >
            <span>Guardar<br />puntaje</span>
          </button>
          <button
            type="button"
            onClick={() => setShowProgressPanel((current) => !current)}
            className={`inline-flex min-w-[92px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition ${showProgressPanel ? "aural-black-button" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100"}`}
          >
            Progreso
          </button>
          <button
            type="button"
            onClick={resetScores}
            className="inline-flex min-w-[118px] shrink-0 items-center justify-center gap-2 whitespace-normal rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold leading-tight text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100"
          >
            <ResetIcon className="h-4 w-4 shrink-0" /> <span>Reiniciar<br />puntaje</span>
          </button>
          <button
            type="button"
            onClick={resetEverything}
            className="inline-flex min-w-[118px] shrink-0 items-center justify-center gap-2 whitespace-normal rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold leading-tight text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100"
          >
            <ResetIcon className="h-4 w-4 shrink-0" /> <span>Reiniciar<br />parámetros</span>
          </button>
        </div>
      </div>
      </div>
    </>

  );
}
