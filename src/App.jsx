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
const MIN_TEMPO = 30;
const MAX_TEMPO = 200;
const DEFAULT_NOTE_COUNT = 4;
const DEFAULT_TEMPO = 50;
const MIN_VOLUME = 0;
const MAX_VOLUME = 100;
const DEFAULT_VOLUME = 50;
const INTERNAL_VOLUME_BOOST = 9.0;
const SOUNDFONT_GAIN_BOOST = 16.0;
const DEFAULT_INSTRUMENT = "piano";
const DEFAULT_INTERVAL_KEYS = ["P4", "P5", "P8"];
const DEFAULT_CLEF_KEYS = ["treble"];
const DEFAULT_DIRECTION_MODE = "random";
const DEFAULT_TRAINER_MODE = "melodic";
const DEFAULT_HARMONIC_RESPONSE_MODE = "givenBass";
const HARMONIC_MIN_PAIRS = 1;
const HARMONIC_MAX_PAIRS = 12;
const SHORT_DIRECTION_OPTIONS = [
  { key: "random", label: "Libre" },
  { key: "ascending", label: "Ascendente" },
  { key: "descending", label: "Descendente" },
  { key: "mixed", label: "Mixto" },
];
const SETTINGS_KEY = "intervalTrainer.settings.v11";
const STATS_KEY = "intervalTrainer.stats.v11";
const MARKS_KEY = "intervalTrainer.marks.v12";
const SOUNDFONT_LIBRARY = "MusyngKite";
const SOUNDFONT_BASE_URL = "https://gleitz.github.io/midi-js-soundfonts";
const PITCH_HISTORY_LEN = 200;
const TUNER_RANGE_CENTS = 50;
const IN_TUNE_THRESHOLD = 10;
const TUNER_HOLD_OPTIONS = [0.5, 1, 1.5, 2, 3, 4];
const TUNER_MICRO_GAP_MS = 300;
const TUNER_COMPLETE_DELAY_MS = 560;
const TUNER_ANALYSIS_INTERVAL_MS = 40;
const TUNER_YIN_THRESHOLD = 0.13;
const PITCH_SMOOTH_ALPHA = 0.35;

const CLEFS = [
  { key: "treble", label: "Clave de Sol", symbol: "𝄞", tag: "", vex: "treble", minMidi: 60, maxMidi: 88, centerMinMidi: 65, centerMaxMidi: 79, staffRefLetter: "E", staffRefOctave: 4, staffRefY: 100 },
  { key: "treble8va", label: "Clave de Sol 8va alta", symbol: "𝄞", tag: "8va", clefAnnotation: "8va", vex: "treble", displayOctaveShift: -1, minMidi: 72, maxMidi: 100, centerMinMidi: 77, centerMaxMidi: 91, staffRefLetter: "E", staffRefOctave: 4, staffRefY: 100 },
  { key: "treble15ma", label: "Clave de Sol 15ma alta", symbol: "𝄞", tag: "15ma", clefAnnotation: "15ma", vex: "treble", displayOctaveShift: -2, minMidi: 84, maxMidi: 108, centerMinMidi: 84, centerMaxMidi: 100, staffRefLetter: "E", staffRefOctave: 4, staffRefY: 100 },
  { key: "soprano", label: "Clave de Do en I", symbol: "𝄡", tag: "I", vex: "soprano", minMidi: 57, maxMidi: 81, centerMinMidi: 62, centerMaxMidi: 74, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 100 },
  { key: "mezzo", label: "Clave de Do en II", symbol: "𝄡", tag: "II", vex: "mezzo-soprano", minMidi: 55, maxMidi: 79, centerMinMidi: 60, centerMaxMidi: 72, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 86 },
  { key: "alto", label: "Clave de Do en III", symbol: "𝄡", tag: "III", vex: "alto", minMidi: 53, maxMidi: 77, centerMinMidi: 58, centerMaxMidi: 70, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 72 },
  { key: "tenor", label: "Clave de Do en IV", symbol: "𝄡", tag: "IV", vex: "tenor", minMidi: 48, maxMidi: 72, centerMinMidi: 53, centerMaxMidi: 65, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 58 },
  { key: "bass", label: "Clave de Fa", symbol: "𝄢", tag: "", vex: "bass", minMidi: 40, maxMidi: 67, centerMinMidi: 45, centerMaxMidi: 58, staffRefLetter: "G", staffRefOctave: 2, staffRefY: 100 },
  { key: "bass8vb", label: "Clave de Fa 8va baja", symbol: "𝄢", tag: "8vb", clefAnnotation: "8vb", vex: "bass", displayOctaveShift: 1, minMidi: 28, maxMidi: 55, centerMinMidi: 33, centerMaxMidi: 46, staffRefLetter: "G", staffRefOctave: 2, staffRefY: 100 },
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
  { value: "voiceOohs", label: "Voz Oohs", soundfont: "voice_oohs", fallback: "voice", sustain: true },
  { value: "synthVoice", label: "Voz sintética", soundfont: "synth_voice", fallback: "voice", sustain: true },
  { value: "churchOrgan", label: "Órgano de iglesia", soundfont: "church_organ", fallback: "organ", sustain: true },
  { value: "drawbarOrgan", label: "Órgano drawbar", soundfont: "drawbar_organ", fallback: "organ", sustain: true },
  { value: "reedOrgan", label: "Órgano de lengüeta", soundfont: "reed_organ", fallback: "organ", sustain: true },
  { value: "strings1", label: "Cuerdas I", soundfont: "string_ensemble_1", fallback: "strings", sustain: true },
  { value: "strings2", label: "Cuerdas II", soundfont: "string_ensemble_2", fallback: "strings", sustain: true },
  { value: "violin", label: "Violín", soundfont: "violin", fallback: "strings", sustain: true },
  { value: "viola", label: "Viola", soundfont: "viola", fallback: "strings", sustain: true },
  { value: "cello", label: "Violonchelo", soundfont: "cello", fallback: "strings", sustain: true },
  { value: "piano", label: "Piano acústico", soundfont: "acoustic_grand_piano", fallback: "piano", sustain: false },
  { value: "electricPiano", label: "Piano eléctrico", soundfont: "electric_piano_1", fallback: "piano", sustain: false },
  { value: "harpsichord", label: "Clave / harpsichord", soundfont: "harpsichord", fallback: "piano", sustain: false },
  { value: "celesta", label: "Celesta", soundfont: "celesta", fallback: "mallet", sustain: false },
  { value: "musicBox", label: "Caja de música", soundfont: "music_box", fallback: "mallet", sustain: false },
  { value: "marimba", label: "Marimba", soundfont: "marimba", fallback: "mallet", sustain: false },
  { value: "vibraphone", label: "Vibráfono", soundfont: "vibraphone", fallback: "mallet", sustain: false },
  { value: "flute", label: "Flauta", soundfont: "flute", fallback: "voice", sustain: true },
];

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

function transitionMatchesModelStep(transition, modelStep) {
  if (!transition || !modelStep) return false;
  if (transition.intervalKey !== modelStep.intervalKey) return false;
  if (typeof modelStep.direction === "number" && transition.direction !== modelStep.direction) return false;
  return true;
}

function detectModelLabels(sequence, allowedIntervalKeys = []) {
  const transitions = getTransitionData(sequence, allowedIntervalKeys);
  const labels = [];
  MODEL_PATTERNS
    .filter((pattern) => pattern.steps.length >= 2)
    .sort((a, b) => b.steps.length - a.steps.length)
    .forEach((pattern) => {
      if (pattern.steps.length > transitions.length) return;
      for (let start = 0; start <= transitions.length - pattern.steps.length; start += 1) {
        const slice = transitions.slice(start, start + pattern.steps.length);
        if (slice.every((transition, index) => transitionMatchesModelStep(transition, pattern.steps[index]))) {
          labels.push(pattern.label);
          break;
        }
      }
    });
  return [...new Set(labels)].slice(0, 12);
}

function patternFitsIntervalSelection(pattern, intervalKeys) {
  const allowed = new Set(sanitizeIntervalSelection(intervalKeys));
  if (!pattern?.steps?.length || pattern.steps.length < 2) return false;
  return pattern.steps.every((step) => allowed.has(step.intervalKey));
}

function patternFitsDirectionPlan(pattern, directionPlan) {
  if (!directionPlan) return true;
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
    const pattern = randomItem(usablePatterns);
    let current = randomItem(central.length ? central : all);
    const sequence = [current];
    let failed = false;

    for (let i = 0; i < pattern.steps.length; i += 1) {
      const modelStep = pattern.steps[i];
      const forcedDirection = directionPlan ? directionPlan[i] ?? null : null;
      const direction = typeof modelStep.direction === "number" ? modelStep.direction : forcedDirection;
      const candidates = getCandidates(current, [modelStep.intervalKey], clefKey, null, direction);
      if (!candidates.length) {
        failed = true;
        break;
      }
      const filtered = candidates.filter((item) => sequence.length < 2 || item.note.id !== sequence[sequence.length - 2].id);
      current = randomItem(filtered.length ? filtered : candidates).note;
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
        current = randomItem(filtered.length ? filtered : candidates).note;
      }
      sequence.push(current);
    }

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
  const modelBased = safeCount >= 3 && Math.random() < 0.68
    ? buildMelodyFromModel(safeCount, intervals, selectedClefKeys, directionMode)
    : null;
  if (modelBased) return modelBased;

  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const { all, central } = getNotesForClef(clefKey);
  const directionPlan = getDirectionPlan(safeCount, directionMode);
  let current = randomItem(central);
  const sequence = [current];

  for (let i = 1; i < safeCount; i += 1) {
    const forcedDirection = directionPlan ? directionPlan[i - 1] ?? null : null;
    const candidates = getCandidates(current, intervals, clefKey, null, forcedDirection);
    if (!candidates.length) {
      current = randomItem(all);
    } else {
      const filtered = candidates.filter((item) => sequence.length < 2 || item.note.id !== sequence[sequence.length - 2].id);
      current = randomItem(filtered.length ? filtered : candidates).note;
    }
    sequence.push(current);
  }

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


function buildHarmonicSequence(pairCount, selectedIntervalKeys, selectedClefKeys) {
  const safeCount = clamp(pairCount, HARMONIC_MIN_PAIRS, HARMONIC_MAX_PAIRS);
  const intervals = sanitizeIntervalSelection(selectedIntervalKeys);
  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const clef = getClefConfig(clefKey);
  const { all, central } = getNotesForClef(clefKey);
  const lowerPool = (central.length ? central : all).filter((note) => note.midi <= clef.maxMidi - 1);
  const pairs = [];

  for (let i = 0; i < safeCount; i += 1) {
    let pair = null;
    for (let attempt = 0; attempt < 80 && !pair; attempt += 1) {
      const lower = randomItem(lowerPool.length ? lowerPool : all);
      const interval = getIntervalDefinition(randomItem(intervals.length ? intervals : DEFAULT_INTERVAL_KEYS));
      if (!interval) continue;
      const upper = transposeNote(lower, interval, 1, clef);
      if (!upper || upper.midi <= lower.midi) continue;
      pair = { lower, upper, intervalKey: interval.key, intervalShort: interval.short };
    }

    if (!pair) {
      const lower = randomItem(lowerPool.length ? lowerPool : all);
      const upperMidi = clamp(lower.midi + 7, clef.minMidi, clef.maxMidi);
      pair = { lower, upper: midiToSimpleNote(upperMidi), intervalKey: "P5", intervalShort: "5J" };
    }
    pairs.push(pair);
  }

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

function makeInitialAttempts(exercise, harmonicResponseMode = DEFAULT_HARMONIC_RESPONSE_MODE) {
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

function getExerciseTuningNotes(exercise) {
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
  if (exercise?.type === "harmonic") {
    return (exercise.pairs ?? []).map((pair, index) => `${index + 1}. ${pair.intervalShort ?? "—"}`);
  }
  return getIntervalLabels(exercise?.sequence ?? [], exercise?.intervalKeys ?? []);
}

function getExerciseModelLabels(exercise) {
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
function initialSettings() {
  const defaults = {
    noteCount: DEFAULT_NOTE_COUNT,
    tempo: DEFAULT_TEMPO,
    volume: DEFAULT_VOLUME,
    instrument: DEFAULT_INSTRUMENT,
    selectedIntervalKeys: DEFAULT_INTERVAL_KEYS,
    selectedClefKeys: DEFAULT_CLEF_KEYS,
    directionMode: DEFAULT_DIRECTION_MODE,
    useTwelveToneSeries: false,
    trainerMode: DEFAULT_TRAINER_MODE,
    harmonicResponseMode: DEFAULT_HARMONIC_RESPONSE_MODE,
  };
  try {
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "null");
    if (!stored) return defaults;
    return {
      ...defaults,
      ...stored,
      selectedIntervalKeys: sanitizeIntervalSelection(stored.selectedIntervalKeys ?? defaults.selectedIntervalKeys),
      selectedClefKeys: sanitizeClefSelection(stored.selectedClefKeys ?? defaults.selectedClefKeys),
      directionMode: sanitizeDirectionMode(stored.directionMode ?? defaults.directionMode, Number(stored.noteCount ?? defaults.noteCount)),
      noteCount: clamp(Number(stored.noteCount ?? defaults.noteCount), MIN_NOTES, MAX_NOTES),
      tempo: clamp(Number(stored.tempo ?? defaults.tempo), MIN_TEMPO, MAX_TEMPO),
      volume: clamp(Number(stored.volume ?? defaults.volume), MIN_VOLUME, MAX_VOLUME),
      instrument: INSTRUMENTS.some((item) => item.value === stored.instrument) ? stored.instrument : DEFAULT_INSTRUMENT,
      trainerMode: stored.trainerMode === "harmonic" ? "harmonic" : "melodic",
      harmonicResponseMode: stored.harmonicResponseMode === "full" ? "full" : "givenBass",
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
      className={`min-h-[38px] rounded-full border px-2.5 py-1.5 text-xs transition sm:px-3 sm:py-2 sm:text-sm ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
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
        active
          ? "border-zinc-950 bg-zinc-950 text-white shadow-sm"
          : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 hover:bg-zinc-100"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function ClefChip({ clef, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={clef.label}
      aria-label={clef.label}
      className={`inline-flex min-h-[38px] items-center justify-center rounded-full border px-3 py-2 text-xs font-medium transition sm:min-h-[42px] sm:px-4 sm:text-sm ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
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

function Staff({ exercise, attemptNotes = [], revealFull = false, onNotePress = null }) {
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
      const target = exercise?.sequence ?? [];
      const fullSlots = isHarmonic
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
        const clefReserve = compact ? 76 : 92;
        const finalReserve = compact ? 34 : 42;
        const noteStartPadding = compact ? 26 : 34;
        const noteSpacing = noteCount <= 2
          ? (compact ? 68 : 92)
          : noteCount <= 4
            ? (compact ? 58 : 80)
            : clamp(Math.floor((availableWidth - clefReserve - finalReserve) / Math.max(1, noteCount)), compact ? 34 : 42, compact ? 54 : 70);
        const naturalWidth = clefReserve + finalReserve + Math.max(1, noteCount) * noteSpacing;
        let width = noteCount <= 2
          ? Math.min(availableWidth, Math.max(compact ? 260 : 330, naturalWidth))
          : compact
            ? Math.max(Math.min(availableWidth, 360), naturalWidth)
            : Math.min(availableWidth, Math.max(naturalWidth, Math.min(availableWidth, 520)));
        width = Math.max(compact ? 260 : 330, Math.round(width));
        const height = compact ? 158 : 168;
        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
        renderer.resize(width, height);
        const context = renderer.getContext();
        const stave = new Stave(compact ? 8 : 14, compact ? 30 : 34, width - (compact ? 16 : 28));
        if (VF.Barline?.type?.END && typeof stave.setEndBarType === "function") {
          stave.setEndBarType(VF.Barline.type.END);
        }
        if (clef.clefAnnotation) {
          try {
            stave.addClef(clef.vex, "default", clef.clefAnnotation);
          } catch {
            stave.addClef(clef.vex);
          }
        } else {
          stave.addClef(clef.vex);
        }
        if (typeof stave.getNoteStartX === "function" && typeof stave.setNoteStartX === "function") {
          stave.setNoteStartX(stave.getNoteStartX() + noteStartPadding);
        }
        stave.setContext(context).draw();

        const accidentalState = new Map();
        const noteGroups = entries.map((entry) => {
          if (!isHarmonic) return [{ note: entry.note, role: "single", status: entry.status, visible: entry.visible !== false }];
          const group = [];
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
        const formatWidth = Math.max(150, width - clefReserve - finalReserve - noteStartPadding);
        new Formatter().joinVoices([voice]).format([voice], formatWidth);

        voice.draw(context, stave);

        const svg = containerRef.current.querySelector("svg");
        const ns = "http://www.w3.org/2000/svg";
        if (svg) {
          svg.setAttribute("style", "display:block; max-width:none;");
          svg.setAttribute("width", String(width));
          svg.setAttribute("height", String(height));

          const drawFinalDoubleBar = () => {
            const finalX = (compact ? 8 : 14) + (width - (compact ? 16 : 28));
            const topY = typeof stave.getYForLine === "function" ? stave.getYForLine(0) : (compact ? 30 : 34);
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

            if (!isHarmonic) {
              const y = Array.isArray(ys) && ys.length ? ys[0] : 92;
              if (entry.visible !== false) {
                drawMark(entry.status, y, "above");
                addNoteHitArea(entry.note, y);
              }
            } else {
              const group = noteGroups[index];
              const groupYs = [];
              group.forEach((item, groupIndex) => {
                const y = ys[groupIndex] ?? ys[0] ?? 92;
                if (item.visible !== false) {
                  groupYs.push(y);
                  drawMark(item.status, y, item.role === "lower" ? "below" : "above");
                }
              });
              const groupNotes = group.filter((item) => item.visible !== false).map((item) => item.note).filter(Boolean);
              if (typeof onNotePress === "function" && groupNotes.length) {
                const minY = Math.min(...groupYs, 58);
                const maxY = Math.max(...groupYs, 112);
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
                hit.setAttribute("aria-label", "Escuchar intervalo armónico");
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
  }, [attemptNotes, exercise, revealFull, onNotePress, updateScrollMetrics]);

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
        <div className="flex min-w-full justify-center">
          <div ref={containerRef} className="inline-block align-top" />
        </div>
      </div>
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

    // El historial baja verticalmente: eje X = cents, eje Y = tiempo.
    // Así la línea que se dibuja queda alineada con el indicador actual.
    if (active && centsHistoryRef?.current) {
      const buf = centsHistoryRef.current;
      const len = buf.length;
      const idx = centsHistoryIdxRef.current;
      let drawing = false;
      let previousInTune = false;
      for (let i = 0; i < len; i += 1) {
        const j = (idx + i) % len;
        const value = buf[j];
        if (!Number.isFinite(value)) {
          if (drawing) ctx.stroke();
          drawing = false;
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
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate font-semibold leading-none ${compact ? "text-xl" : "text-2xl"} ${valid || micEnabled ? "text-zinc-950" : "text-zinc-400"}`}>{label || "—"}</p>
          {sublabel ? <p className="mt-1 truncate text-[10px] font-medium text-zinc-500">{sublabel}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {completed ? <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">✓</span> : null}
          <p className={`text-xs font-semibold tabular-nums ${inTune ? "text-emerald-700" : valid ? "text-zinc-500" : "text-zinc-300"}`}>{valid ? `${cents >= 0 ? "+" : ""}${cents.toFixed(1)}¢` : "—"}</p>
        </div>
      </div>

      <div className="relative h-12 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
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
  const holdSecondsRef = useRef(2);
  const lastCentsRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState("study");
  const [targetIndex, setTargetIndex] = useState(0);
  const [detectedHz, setDetectedHz] = useState(null);
  const [detectedLabel, setDetectedLabel] = useState("—");
  const [cents, setCents] = useState(null);
  const [holdSeconds, setHoldSeconds] = useState(2);
  const [holdProgress, setHoldProgress] = useState(0);
  const [completedFlash, setCompletedFlash] = useState(false);

  const targetNote = notes[targetIndex] ?? null;
  const detectedMidi = detectedHz ? frequencyToNearestMidi(detectedHz) : null;
  const samePitchClass = mode !== "study" || !targetNote || (detectedMidi != null && pitchClassOf(detectedMidi) === pitchClassOf(targetNote));
  const inTune = Number.isFinite(cents) && Math.abs(cents) <= IN_TUNE_THRESHOLD && samePitchClass;
  const activeNoteName = mode === "study" && targetNote ? targetNote.label : detectedLabel;
  const activeTuningRole = mode === "study" && targetNote?.tuningRole ? targetNote.tuningRole : "";

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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setMode("study")} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${mode === "study" ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-300 bg-white text-zinc-700"}`}>Estudio</button>
          <button type="button" onClick={() => setMode("free")} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${mode === "free" ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-300 bg-white text-zinc-700"}`}>Libre</button>
          {mode === "study" ? <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">{targetIndex + 1}/{notes.length}</span> : null}
        </div>

        <div className="text-center">
          {mode === "study" ? (
            <div className="flex items-center justify-center gap-2">
              <button type="button" onClick={() => setTargetManually(targetIndexRef.current - 1)} className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700">←</button>
              <div className="min-w-[92px] text-center">
                <div className={`text-2xl font-bold leading-none tracking-tight sm:text-3xl ${completedFlash ? "text-emerald-700" : "text-zinc-950"}`}>{activeNoteName}</div>
                {activeTuningRole ? <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{activeTuningRole}</div> : null}
              </div>
              <button type="button" onClick={() => setTargetManually(targetIndexRef.current + 1)} className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700">→</button>
            </div>
          ) : (
            <div className="min-w-[92px] text-center text-2xl font-bold leading-none tracking-tight text-zinc-950 sm:text-3xl">{activeNoteName}</div>
          )}
          <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-medium text-zinc-500">
            <span>{Number.isFinite(cents) ? `${cents > 0 ? "+" : ""}${cents.toFixed(1)} cents` : "—"}</span>
            {mode === "study" && detectedLabel !== "—" ? <span className="text-zinc-400">detectada: {detectedLabel}</span> : null}
            {completedFlash ? <span className="font-bold text-emerald-700">✓</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {mode === "study" ? (
            <div className="flex flex-wrap justify-end gap-1">
              {TUNER_HOLD_OPTIONS.map((seconds) => (
                <button
                  type="button"
                  key={seconds}
                  onClick={() => setHoldSeconds(seconds)}
                  className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${holdSeconds === seconds ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-300 bg-white text-zinc-700"}`}
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
          ) : null}
          {isListening ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Mic activo</span> : <button type="button" onClick={startListening} className="rounded-full border border-zinc-950 bg-zinc-950 px-3 py-1 text-[11px] font-semibold text-white">Activar micrófono</button>}
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
    <div className="min-w-[92px] rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 sm:min-w-0 sm:px-3">
      <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:text-[10px] sm:tracking-[0.16em]">{label}</p>
      <p className="truncate text-sm font-bold text-zinc-900 sm:text-base">{value}</p>
    </div>
  );
}

export default function IntervalTrainerPage() {
  const saved = useMemo(() => (typeof window !== "undefined" ? initialSettings() : null), []);
  const savedStats = useMemo(() => (typeof window !== "undefined" ? initialStats() : null), []);
  const savedMarks = useMemo(() => (typeof window !== "undefined" ? initialMarks() : []), []);
  const audioContextRef = useRef(null);
  const soundfontCacheRef = useRef(new Map());
  const activeFallbackNodesRef = useRef([]);
  const activePlayersRef = useRef([]);
  const playbackTimeoutRef = useRef(null);
  const playbackSessionRef = useRef(0);

  const [noteCount, setNoteCount] = useState(saved?.noteCount ?? DEFAULT_NOTE_COUNT);
  const [tempo, setTempo] = useState(saved?.tempo ?? DEFAULT_TEMPO);
  const [volume, setVolume] = useState(saved?.volume ?? DEFAULT_VOLUME);
  const [instrument, setInstrument] = useState(saved?.instrument ?? DEFAULT_INSTRUMENT);
  const [selectedIntervalKeys, setSelectedIntervalKeys] = useState(saved?.selectedIntervalKeys ?? DEFAULT_INTERVAL_KEYS);
  const [selectedClefKeys, setSelectedClefKeys] = useState(saved?.selectedClefKeys ?? DEFAULT_CLEF_KEYS);
  const [directionMode, setDirectionMode] = useState(saved?.directionMode ?? DEFAULT_DIRECTION_MODE);
  const [useTwelveToneSeries, setUseTwelveToneSeries] = useState(saved?.useTwelveToneSeries ?? false);
  const [trainerMode, setTrainerMode] = useState(saved?.trainerMode ?? DEFAULT_TRAINER_MODE);
  const [harmonicResponseMode, setHarmonicResponseMode] = useState(saved?.harmonicResponseMode ?? DEFAULT_HARMONIC_RESPONSE_MODE);
  const [exercise, setExercise] = useState(() => {
    const mode = saved?.trainerMode ?? DEFAULT_TRAINER_MODE;
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
  const [revealFull, setRevealFull] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buttonFlash, setButtonFlash] = useState(false);
  const [stats, setStats] = useState(savedStats ?? { totalSeconds: 0, exercises: 0, correct: 0, incorrect: 0 });
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [timeMarks, setTimeMarks] = useState(savedMarks);

  const selectedInstrument = useMemo(() => INSTRUMENTS.find((item) => item.value === instrument) ?? INSTRUMENTS.find((item) => item.value === DEFAULT_INSTRUMENT), [instrument]);
  const hasSelectedIntervals = selectedIntervalKeys.length > 0;
  const hasSelectedClefs = selectedClefKeys.length > 0;
  const isHarmonicMode = trainerMode === "harmonic";
  const twelveToneUsableIntervals = useMemo(() => getTwelveToneIntervalKeys(selectedIntervalKeys), [selectedIntervalKeys]);
  const canGenerate = hasSelectedIntervals && hasSelectedClefs && (isHarmonicMode || !useTwelveToneSeries || twelveToneUsableIntervals.length > 0);
  const safeNoteCount = isHarmonicMode ? clamp(noteCount, HARMONIC_MIN_PAIRS, HARMONIC_MAX_PAIRS) : (useTwelveToneSeries ? clamp(noteCount, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES) : clamp(noteCount, MIN_NOTES, MAX_NOTES));
  const expectedNote = isHarmonicMode && harmonicStep ? exercise.pairs?.[harmonicStep.pairIndex]?.[harmonicStep.voice] : exercise.sequence?.[nextIndex] ?? null;
  const exerciseComplete = isHarmonicMode ? harmonicStep == null : nextIndex >= (exercise.sequence?.length ?? 0);
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
  const visibleDirectionOptions = useMemo(() => {
    if (isHarmonicMode || useTwelveToneSeries) return [];
    if (noteCount === 2) return SHORT_DIRECTION_OPTIONS.filter((option) => option.key !== "mixed");
    if (noteCount === 3) return SHORT_DIRECTION_OPTIONS;
    return [];
  }, [isHarmonicMode, noteCount, useTwelveToneSeries]);

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
      }));
    } catch {}
  }, [directionMode, harmonicResponseMode, instrument, noteCount, selectedClefKeys, selectedIntervalKeys, tempo, trainerMode, useTwelveToneSeries, volume]);

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
    playbackSessionRef.current += 1;
    if (playbackTimeoutRef.current) {
      window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    stopAllAudio();
    setIsPlaying(false);
  }, [stopAllAudio]);

  const getSoundfontInstrument = useCallback(async (ctx, instrumentConfig) => {
    if (!instrumentConfig?.soundfont) return null;
    const cacheKey = instrumentConfig.soundfont;
    if (soundfontCacheRef.current.has(cacheKey)) return soundfontCacheRef.current.get(cacheKey);
    const sfInstrument = await Soundfont.instrument(ctx, instrumentConfig.soundfont, {
      format: "mp3",
      soundfont: SOUNDFONT_LIBRARY,
      nameToUrl: (name, sf, format) => `${SOUNDFONT_BASE_URL}/${sf}/${name}-${format}.js`,
    });
    soundfontCacheRef.current.set(cacheKey, sfInstrument);
    return sfInstrument;
  }, []);

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
    masterGain.connect(ctx.destination);

    oscillators.forEach((osc) => {
      osc.start(startTime);
      osc.stop(startTime + duration + 0.06);
    });
    activeFallbackNodesRef.current.push({ oscillators, gains, filters, masterGain });
  }, []);

  const playExercise = useCallback(async (exerciseToPlay = exercise) => {
    const isHarmonic = exerciseToPlay?.type === "harmonic";
    const playableGroups = isHarmonic
      ? (exerciseToPlay?.pairs ?? []).map((pair) => [pair.lower, pair.upper])
      : (exerciseToPlay?.sequence ?? []).map((note) => [note]);
    if (!playableGroups.length) return;
    const sessionId = playbackSessionRef.current + 1;
    playbackSessionRef.current = sessionId;
    setIsPlaying(true);
    stopAllAudio();
    try {
      const ctx = await ensureAudioContext();
      const secondsPerBeat = 60 / clamp(tempo, MIN_TEMPO, MAX_TEMPO);
      const step = secondsPerBeat;
      const noteDuration = selectedInstrument?.sustain ? Math.max(0.24, step * 0.99) : Math.max(0.2, step * 0.92);
      const baseTime = ctx.currentTime + 0.08;
      const gain = Math.max(0, (clamp(volume, MIN_VOLUME, MAX_VOLUME) / 100) * SOUNDFONT_GAIN_BOOST);
      let sfInstrument = null;
      try {
        sfInstrument = await getSoundfontInstrument(ctx, selectedInstrument);
      } catch (error) {
        console.warn("No se pudo cargar SoundFont. Usando síntesis interna.", error);
      }
      if (sessionId !== playbackSessionRef.current) return;
      stopAllAudio();

      playableGroups.forEach((group, index) => {
        const start = baseTime + index * step;
        group.forEach((note) => {
          if (sfInstrument) {
            const player = sfInstrument.play(noteNameForSoundFont(note.midi), start, { duration: noteDuration, gain });
            activePlayersRef.current.push(player);
          } else {
            createFallbackVoice(ctx, midiToFreq(note.midi), selectedInstrument?.fallback ?? "piano", start, noteDuration, volume);
          }
        });
      });

      if (playbackTimeoutRef.current) window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = window.setTimeout(() => {
        if (sessionId === playbackSessionRef.current) {
          setIsPlaying(false);
          playbackTimeoutRef.current = null;
        }
      }, playableGroups.length * step * 1000 + 550);
    } catch (error) {
      console.error("Error al reproducir:", error);
      if (sessionId === playbackSessionRef.current) setIsPlaying(false);
    }
  }, [createFallbackVoice, ensureAudioContext, exercise, getSoundfontInstrument, selectedInstrument, stopAllAudio, tempo, volume]);

  const playSingleNote = useCallback(async (noteOrNotes) => {
    const notesToPlay = Array.isArray(noteOrNotes) ? noteOrNotes.filter(Boolean) : [noteOrNotes].filter(Boolean);
    if (!notesToPlay.length) return;
    const sessionId = playbackSessionRef.current + 1;
    playbackSessionRef.current = sessionId;
    stopAllAudio();
    setIsPlaying(false);
    try {
      const ctx = await ensureAudioContext();
      const start = ctx.currentTime + 0.04;
      const duration = selectedInstrument?.sustain ? 1.15 : 0.95;
      const gain = Math.max(0, (clamp(volume, MIN_VOLUME, MAX_VOLUME) / 100) * SOUNDFONT_GAIN_BOOST);
      let sfInstrument = null;
      try {
        sfInstrument = await getSoundfontInstrument(ctx, selectedInstrument);
      } catch (error) {
        console.warn("No se pudo cargar SoundFont para nota aislada. Usando síntesis interna.", error);
      }
      if (sessionId !== playbackSessionRef.current) return;
      notesToPlay.forEach((note) => {
        if (sfInstrument) {
          const player = sfInstrument.play(noteNameForSoundFont(note.midi), start, { duration, gain });
          activePlayersRef.current.push(player);
        } else {
          createFallbackVoice(ctx, midiToFreq(note.midi), selectedInstrument?.fallback ?? "piano", start, duration, volume);
        }
      });
    } catch (error) {
      console.error("Error al reproducir la nota:", error);
    }
  }, [createFallbackVoice, ensureAudioContext, getSoundfontInstrument, selectedInstrument, stopAllAudio, volume]);

  const startExercise = useCallback(() => {
    if (!canGenerate) return;
    const count = isHarmonicMode ? clamp(noteCount, HARMONIC_MIN_PAIRS, HARMONIC_MAX_PAIRS) : (useTwelveToneSeries ? clamp(noteCount, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES) : clamp(noteCount, MIN_NOTES, MAX_NOTES));
    const nextExercise = isHarmonicMode
      ? buildHarmonicSequence(count, selectedIntervalKeys, selectedClefKeys)
      : (useTwelveToneSeries
        ? buildTwelveToneSeries(count, selectedIntervalKeys, selectedClefKeys)
        : buildMelody(count, selectedIntervalKeys, selectedClefKeys, directionMode));
    setExercise(nextExercise);
    setAttemptNotes(makeInitialAttempts(nextExercise, harmonicResponseMode));
    setNextIndex(1);
    setHarmonicStep(firstHarmonicStep(nextExercise, harmonicResponseMode));
    setRevealFull(false);
    setStats((current) => ({ ...current, exercises: current.exercises + 1 }));
    setButtonFlash(true);
    window.setTimeout(() => setButtonFlash(false), 420);
    playExercise(nextExercise);
  }, [canGenerate, directionMode, harmonicResponseMode, isHarmonicMode, noteCount, playExercise, selectedClefKeys, selectedIntervalKeys, useTwelveToneSeries]);

  const handleKeyboardPress = useCallback((pc) => {
    if (!expectedNote || revealFull) return;
    const correct = pitchClassOf(expectedNote) === pc;
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
  }, [expectedNote, exercise, harmonicResponseMode, harmonicStep, isHarmonicMode, revealFull]);

  const handleRevealFullAnswer = useCallback(() => {
    if (revealFull) return;
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
  }, [exercise.sequence, isHarmonicMode, nextIndex, revealFull]);

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
    const freshExercise = buildMelody(DEFAULT_NOTE_COUNT, DEFAULT_INTERVAL_KEYS, DEFAULT_CLEF_KEYS, DEFAULT_DIRECTION_MODE);
    setNoteCount(DEFAULT_NOTE_COUNT);
    setTempo(DEFAULT_TEMPO);
    setVolume(DEFAULT_VOLUME);
    setInstrument(DEFAULT_INSTRUMENT);
    setSelectedIntervalKeys(DEFAULT_INTERVAL_KEYS);
    setSelectedClefKeys(DEFAULT_CLEF_KEYS);
    setDirectionMode(DEFAULT_DIRECTION_MODE);
    setUseTwelveToneSeries(false);
    setTrainerMode(DEFAULT_TRAINER_MODE);
    setHarmonicResponseMode(DEFAULT_HARMONIC_RESPONSE_MODE);
    setExercise(freshExercise);
    setAttemptNotes(makeInitialAttempts(freshExercise, DEFAULT_HARMONIC_RESPONSE_MODE));
    setNextIndex(1);
    setHarmonicStep(firstHarmonicStep(freshExercise, DEFAULT_HARMONIC_RESPONSE_MODE));
    setRevealFull(false);
    try {
      window.localStorage.removeItem(SETTINGS_KEY);
    } catch {}
  }, [stopPlayback]);

  useEffect(() => {
    if (trainerMode === "harmonic") {
      setUseTwelveToneSeries(false);
      setNoteCount((current) => clamp(current, HARMONIC_MIN_PAIRS, HARMONIC_MAX_PAIRS));
    }
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
    <div className="min-h-screen overflow-x-hidden bg-zinc-100 px-3 py-4 pb-56 text-zinc-950 sm:px-6 sm:py-6 sm:pb-44 md:px-10 md:py-10 md:pb-36">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Entrenador de intervalos · Método Aural</h1><div className="flex rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm"><button type="button" onClick={() => setTrainerMode("melodic")} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${trainerMode === "melodic" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>Melódicos</button><button type="button" onClick={() => setTrainerMode("harmonic")} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${trainerMode === "harmonic" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>Armónicos</button></div></div>
        </header>

        <section className="grid gap-4 sm:gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="space-y-5 sm:space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">{isHarmonicMode ? "Número de pares" : "Número de notas"}</span>
                  <Badge>{safeNoteCount} {isHarmonicMode ? "pares" : "notas"}</Badge>
                </div>
                <input
                  type="range"
                  min={isHarmonicMode ? HARMONIC_MIN_PAIRS : (useTwelveToneSeries ? TWELVE_TONE_MIN_NOTES : MIN_NOTES)}
                  max={isHarmonicMode ? HARMONIC_MAX_PAIRS : (useTwelveToneSeries ? TWELVE_TONE_MAX_NOTES : MAX_NOTES)}
                  step={1}
                  value={safeNoteCount}
                  onChange={(event) => setNoteCount(Number(event.target.value))}
                  className="w-full accent-sky-600"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{isHarmonicMode ? 1 : (useTwelveToneSeries ? 4 : 2)}</span>
                  <span>{isHarmonicMode ? 12 : (useTwelveToneSeries ? 12 : 24)}</span>
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
                {!isHarmonicMode ? (<div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                  <SelectionChip active={useTwelveToneSeries} onClick={() => setUseTwelveToneSeries((current) => !current)} title="Serie dodecafónica">Serie dodecafónica</SelectionChip>
                  <span className="text-xs text-zinc-500">Sin repetir clases de altura; disponible de 4 a 12 notas.</span>
                </div>) : (<div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3"><SelectionChip active={harmonicResponseMode === "givenBass"} onClick={() => setHarmonicResponseMode("givenBass")}>Bajo dado</SelectionChip><SelectionChip active={harmonicResponseMode === "full"} onClick={() => setHarmonicResponseMode("full")}>Solo bajo inicial</SelectionChip><span className="text-xs text-zinc-500">Responde siempre de inferior a superior.</span></div>)}
                {!hasSelectedIntervals ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Selecciona al menos un intervalo para generar.</p>
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
                  <div className="flex justify-between text-xs text-zinc-500"><span>30 BPM</span><span>200 BPM</span></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Volumen</span><Badge>{volume}%</Badge></div>
                  <input type="range" min={MIN_VOLUME} max={MAX_VOLUME} step={1} value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-full accent-sky-600" />
                  <div className="flex justify-between text-xs text-zinc-500"><span>0%</span><span>100%</span></div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Instrumento</span><Badge>{selectedInstrument?.label}</Badge></div>
                  <select value={instrument} onChange={(event) => setInstrument(event.target.value)} className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">
                    {INSTRUMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              </div>

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

              <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm sm:p-2">
                <Staff exercise={exercise} attemptNotes={attemptNotes} revealFull={revealFull} onNotePress={playSingleNote} />
                <div className="border-t border-zinc-100 px-2 pb-3 pt-1">
                  <TunerPanel notes={tuningNotes} visible={exerciseComplete || revealFull} />
                  {exerciseComplete || revealFull ? null : (
                    <PianoKeyboard onPress={handleKeyboardPress} disabled={false} />
                  )}
                </div>
              </div>

              {exerciseComplete || revealFull ? (
                <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
                  {!isHarmonicMode ? (
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
                    <p className="text-sm font-medium text-zinc-500">{isHarmonicMode ? "Intervalos armónicos escuchados" : "Saltos entre notas consecutivas"}</p>
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
                <button type="button" onClick={() => setShowProgressPanel(false)} className="rounded-xl border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white">Cerrar</button>
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
                        <span>Modo: {mark.trainerMode === "harmonic" ? "Armónicos" : "Melódicos"}</span>
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

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-3 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:px-4 sm:py-3">
        <div className="mx-auto flex w-fit max-w-full flex-nowrap items-stretch justify-center gap-3 overflow-x-auto pb-1 sm:pb-0 md:gap-4">
          <BottomStat label="Tiempo" value={formatTime(stats.totalSeconds)} />
          <button
            type="button"
            onClick={() => setIsTimerPaused((current) => !current)}
            className={`inline-flex min-w-[104px] items-center justify-center whitespace-normal rounded-xl border px-3 py-2 text-center text-xs font-semibold leading-tight transition ${isTimerPaused ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100"}`}
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
            className="inline-flex min-w-[108px] items-center justify-center gap-2 whitespace-normal rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold leading-tight text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100"
          >
            <span>Guardar<br />puntaje</span>
          </button>
          <button
            type="button"
            onClick={() => setShowProgressPanel((current) => !current)}
            className={`inline-flex min-w-[92px] items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition ${showProgressPanel ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100"}`}
          >
            Progreso
          </button>
          <button
            type="button"
            onClick={resetScores}
            className="inline-flex min-w-[118px] items-center justify-center gap-2 whitespace-normal rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold leading-tight text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100"
          >
            <ResetIcon className="h-4 w-4 shrink-0" /> <span>Reiniciar<br />puntaje</span>
          </button>
          <button
            type="button"
            onClick={resetEverything}
            className="inline-flex min-w-[118px] items-center justify-center gap-2 whitespace-normal rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-xs font-semibold leading-tight text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100"
          >
            <ResetIcon className="h-4 w-4 shrink-0" /> <span>Reiniciar<br />parámetros</span>
          </button>
        </div>
      </div>
    </div>

  );
}
