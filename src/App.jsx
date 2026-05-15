import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SoundfontPlayer from "soundfont-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

function MusicIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
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

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_OFFSETS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACCIDENTAL_ASCII = { [-1]: "b", 0: "", 1: "#" };
const ACCIDENTAL_DISPLAY = { [-1]: "♭", 0: "", 1: "♯" };
const MIN_NOTES = 2;
const MAX_NOTES = 24;
const MIN_TEMPO = 30;
const MAX_TEMPO = 200;
const DEFAULT_NOTE_COUNT = 4;
const DEFAULT_TEMPO = 50;
const MIN_VOLUME = 0;
const MAX_VOLUME = 100;
const DEFAULT_VOLUME = 50;
const INTERNAL_VOLUME_BOOST = 6.0;
const SOUNDFONT_GAIN_BOOST = 9.5;
const DEFAULT_INSTRUMENT = "piano";
const SOUNDFONT_LIBRARY = "MusyngKite";
const SOUNDFONT_BASE_URL = "https://gleitz.github.io/midi-js-soundfonts";
const STAFF_BASE_WIDTH = 260;
const STAFF_NOTE_WIDTH = 86;
const DEFAULT_INTERVAL_KEYS = ["P4", "P5", "P8"];
const DEFAULT_CLEF_KEYS = ["treble"];
const DEFAULT_DIRECTION_MODE = "random";

const CLEFS = [
  { key: "treble", label: "Clave de sol", vex: "treble", minMidi: 60, maxMidi: 88, centerMinMidi: 65, centerMaxMidi: 79 },
  { key: "treble8va", label: "Clave de sol 8va alta", vex: "treble", annotation: "8va", displayOctaveShift: -1, minMidi: 72, maxMidi: 100, centerMinMidi: 77, centerMaxMidi: 91 },
  { key: "treble15ma", label: "Clave de sol 15ma alta", vex: "treble", annotation: "15ma", displayOctaveShift: -2, minMidi: 84, maxMidi: 108, centerMinMidi: 84, centerMaxMidi: 100 },
  { key: "soprano", label: "Clave de do en 1ra", vex: "soprano", minMidi: 57, maxMidi: 81, centerMinMidi: 62, centerMaxMidi: 74 },
  { key: "mezzo", label: "Clave de do en 2da", vex: "mezzo-soprano", minMidi: 55, maxMidi: 79, centerMinMidi: 60, centerMaxMidi: 72 },
  { key: "alto", label: "Clave de do en 3ra", vex: "alto", minMidi: 53, maxMidi: 77, centerMinMidi: 58, centerMaxMidi: 70 },
  { key: "tenor", label: "Clave de do en 4ta", vex: "tenor", minMidi: 48, maxMidi: 72, centerMinMidi: 53, centerMaxMidi: 65 },
  { key: "bass", label: "Clave de fa", vex: "bass", minMidi: 40, maxMidi: 67, centerMinMidi: 45, centerMaxMidi: 58 },
  { key: "bass8vb", label: "Clave de fa 8va baja", vex: "bass", annotation: "8vb", displayOctaveShift: 1, minMidi: 28, maxMidi: 55, centerMinMidi: 33, centerMaxMidi: 46 },
];

const INTERVAL_DEFINITIONS = [
  { key: "m2", short: "2m", name: "Segunda menor", variants: [{ semitones: 1, diatonicSteps: 1 }] },
  { key: "M2", short: "2M", name: "Segunda mayor", variants: [{ semitones: 2, diatonicSteps: 1 }] },
  { key: "m3", short: "3m", name: "Tercera menor", variants: [{ semitones: 3, diatonicSteps: 2 }] },
  { key: "M3", short: "3M", name: "Tercera mayor", variants: [{ semitones: 4, diatonicSteps: 2 }] },
  { key: "P4", short: "4J", name: "Cuarta justa", variants: [{ semitones: 5, diatonicSteps: 3 }] },
  { key: "TT", short: "TT", name: "Tritono", variants: [{ semitones: 6, diatonicSteps: 3 }, { semitones: 6, diatonicSteps: 4 }] },
  { key: "P5", short: "5J", name: "Quinta justa", variants: [{ semitones: 7, diatonicSteps: 4 }] },
  { key: "m6", short: "6m", name: "Sexta menor", variants: [{ semitones: 8, diatonicSteps: 5 }] },
  { key: "M6", short: "6M", name: "Sexta mayor", variants: [{ semitones: 9, diatonicSteps: 5 }] },
  { key: "m7", short: "7m", name: "Séptima menor", variants: [{ semitones: 10, diatonicSteps: 6 }] },
  { key: "M7", short: "7M", name: "Séptima mayor", variants: [{ semitones: 11, diatonicSteps: 6 }] },
  { key: "P8", short: "8J", name: "Octava justa", variants: [{ semitones: 12, diatonicSteps: 7 }] },
];

const MODEL_PATTERNS = [
  { id: "l1-4j4j", label: "4J + 4J", steps: [{ intervalKey: "P4" }, { intervalKey: "P4" }] },
  { id: "l1-5j5j", label: "5J + 5J", steps: [{ intervalKey: "P5" }, { intervalKey: "P5" }] },
  { id: "l1-5up4down", label: "5J↗ + 4J↘", steps: [{ intervalKey: "P5", direction: 1 }, { intervalKey: "P4", direction: -1 }] },
  { id: "l1-5down4up", label: "5J↘ + 4J↗", steps: [{ intervalKey: "P5", direction: -1 }, { intervalKey: "P4", direction: 1 }] },
  { id: "l1-4up5down", label: "4J↗ + 5J↘", steps: [{ intervalKey: "P4", direction: 1 }, { intervalKey: "P5", direction: -1 }] },
  { id: "l1-4down5up", label: "4J↘ + 5J↗", steps: [{ intervalKey: "P4", direction: -1 }, { intervalKey: "P5", direction: 1 }] },
  { id: "l1-4j4j4j", label: "4J + 4J + 4J", steps: [{ intervalKey: "P4" }, { intervalKey: "P4" }, { intervalKey: "P4" }] },
  { id: "l1-5j5j5j", label: "5J + 5J + 5J", steps: [{ intervalKey: "P5" }, { intervalKey: "P5" }, { intervalKey: "P5" }] },

  { id: "l2-2M2M-up", label: "2M↗ + 2M↗", steps: [{ intervalKey: "M2", direction: 1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l2-2M2m-up", label: "2M↗ + 2m↗", steps: [{ intervalKey: "M2", direction: 1 }, { intervalKey: "m2", direction: 1 }] },
  { id: "l2-2m2M-up", label: "2m↗ + 2M↗", steps: [{ intervalKey: "m2", direction: 1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l2-2m2m-up", label: "2m↗ + 2m↗", steps: [{ intervalKey: "m2", direction: 1 }, { intervalKey: "m2", direction: 1 }] },
  { id: "l2-2M2m-mix", label: "2M↗ + 2m↘", steps: [{ intervalKey: "M2", direction: 1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l2-2m2M-mix", label: "2m↗ + 2M↘", steps: [{ intervalKey: "m2", direction: 1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l2-2M2M-down", label: "2M↘ + 2M↘", steps: [{ intervalKey: "M2", direction: -1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l2-2M2m-down", label: "2M↘ + 2m↘", steps: [{ intervalKey: "M2", direction: -1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l2-2m2M-down", label: "2m↘ + 2M↘", steps: [{ intervalKey: "m2", direction: -1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l2-2m2m-down", label: "2m↘ + 2m↘", steps: [{ intervalKey: "m2", direction: -1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l2-chromatic", label: "Escala cromática", steps: [{ intervalKey: "m2" }, { intervalKey: "m2" }, { intervalKey: "m2" }, { intervalKey: "m2" }] },
  { id: "l2-whole-tone", label: "Escala de tonos enteros", steps: [{ intervalKey: "M2" }, { intervalKey: "M2" }, { intervalKey: "M2" }, { intervalKey: "M2" }] },
  { id: "l2-4j-2M", label: "4J + 2M", steps: [{ intervalKey: "P4" }, { intervalKey: "M2" }] },
  { id: "l2-4j-2m", label: "4J + 2m", steps: [{ intervalKey: "P4" }, { intervalKey: "m2" }] },
  { id: "l2-5j-2M", label: "5J + 2M", steps: [{ intervalKey: "P5" }, { intervalKey: "M2" }] },
  { id: "l2-5j-2m", label: "5J + 2m", steps: [{ intervalKey: "P5" }, { intervalKey: "m2" }] },
  { id: "l2-4j-2m-4j", label: "4J + 2m + 4J", steps: [{ intervalKey: "P4" }, { intervalKey: "m2" }, { intervalKey: "P4" }] },
  { id: "l2-5j-2m-5j", label: "5J + 2m + 5J", steps: [{ intervalKey: "P5" }, { intervalKey: "m2" }, { intervalKey: "P5" }] },
  { id: "l2-4j-2M-4j", label: "4J + 2M + 4J", steps: [{ intervalKey: "P4" }, { intervalKey: "M2" }, { intervalKey: "P4" }] },
  { id: "l2-5j-2M-5j", label: "5J + 2M + 5J", steps: [{ intervalKey: "P5" }, { intervalKey: "M2" }, { intervalKey: "P5" }] },
  { id: "l2-4j-2M-5j", label: "4J + 2M + 5J", steps: [{ intervalKey: "P4" }, { intervalKey: "M2" }, { intervalKey: "P5" }] },
  { id: "l2-4j-2m-5j", label: "4J + 2m + 5J", steps: [{ intervalKey: "P4" }, { intervalKey: "m2" }, { intervalKey: "P5" }] },

  { id: "l3-3M3M", label: "3M + 3M", steps: [{ intervalKey: "M3" }, { intervalKey: "M3" }] },
  { id: "l3-3m3m", label: "3m + 3m", steps: [{ intervalKey: "m3" }, { intervalKey: "m3" }] },
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

  { id: "l4-tt4j", label: "TT + 4J", steps: [{ intervalKey: "TT" }, { intervalKey: "P4" }] },
  { id: "l4-tt5j", label: "TT + 5J", steps: [{ intervalKey: "TT" }, { intervalKey: "P5" }] },
  { id: "l4-tt2mtt", label: "TT + 2m + TT", steps: [{ intervalKey: "TT" }, { intervalKey: "m2" }, { intervalKey: "TT" }] },
  { id: "l4-tt2Mtt", label: "TT + 2M + TT", steps: [{ intervalKey: "TT" }, { intervalKey: "M2" }, { intervalKey: "TT" }] },
  { id: "l4-ttup5down", label: "TT↗ + 5J↘", steps: [{ intervalKey: "TT", direction: 1 }, { intervalKey: "P5", direction: -1 }] },
  { id: "l4-ttdown5up", label: "TT↘ + 5J↗", steps: [{ intervalKey: "TT", direction: -1 }, { intervalKey: "P5", direction: 1 }] },
  { id: "l4-ttup4down", label: "TT↗ + 4J↘", steps: [{ intervalKey: "TT", direction: 1 }, { intervalKey: "P4", direction: -1 }] },
  { id: "l4-ttdown4up", label: "TT↘ + 4J↗", steps: [{ intervalKey: "TT", direction: -1 }, { intervalKey: "P4", direction: 1 }] },
  { id: "l4-5up-ttdown", label: "5J↗ + TT↘", steps: [{ intervalKey: "P5", direction: 1 }, { intervalKey: "TT", direction: -1 }] },
  { id: "l4-5down-ttup", label: "5J↘ + TT↗", steps: [{ intervalKey: "P5", direction: -1 }, { intervalKey: "TT", direction: 1 }] },
  { id: "l4-4up-ttdown", label: "4J↗ + TT↘", steps: [{ intervalKey: "P4", direction: 1 }, { intervalKey: "TT", direction: -1 }] },
  { id: "l4-4down-ttup", label: "4J↘ + TT↗", steps: [{ intervalKey: "P4", direction: -1 }, { intervalKey: "TT", direction: 1 }] },

  { id: "l5-6m6m", label: "6m + 6m", steps: [{ intervalKey: "m6" }, { intervalKey: "m6" }] },
  { id: "l5-6M6M", label: "6M + 6M", steps: [{ intervalKey: "M6" }, { intervalKey: "M6" }] },
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

  { id: "l6-7m", label: "7m", steps: [{ intervalKey: "m7" }] },
  { id: "l6-7M", label: "7M", steps: [{ intervalKey: "M7" }] },
  { id: "l6-7m7m", label: "7m + 7m", steps: [{ intervalKey: "m7" }, { intervalKey: "m7" }] },
  { id: "l6-7M7M", label: "7M + 7M", steps: [{ intervalKey: "M7" }, { intervalKey: "M7" }] },
  { id: "l6-7mup2Mdown", label: "7m↗ + 2M↘", steps: [{ intervalKey: "m7", direction: 1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l6-2Mdown7mup", label: "2M↘ + 7m↗", steps: [{ intervalKey: "M2", direction: -1 }, { intervalKey: "m7", direction: 1 }] },
  { id: "l6-7mup2mdown", label: "7m↗ + 2m↘", steps: [{ intervalKey: "m7", direction: 1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l6-2mdown7mup", label: "2m↘ + 7m↗", steps: [{ intervalKey: "m2", direction: -1 }, { intervalKey: "m7", direction: 1 }] },
  { id: "l6-7Mup2Mdown", label: "7M↗ + 2M↘", steps: [{ intervalKey: "M7", direction: 1 }, { intervalKey: "M2", direction: -1 }] },
  { id: "l6-7Mup2mdown", label: "7M↗ + 2m↘", steps: [{ intervalKey: "M7", direction: 1 }, { intervalKey: "m2", direction: -1 }] },
  { id: "l6-7mdown2Mup", label: "7m↘ + 2M↗", steps: [{ intervalKey: "m7", direction: -1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l6-2Mup7mdown", label: "2M↗ + 7m↘", steps: [{ intervalKey: "M2", direction: 1 }, { intervalKey: "m7", direction: -1 }] },
  { id: "l6-7Mdown2Mup", label: "7M↘ + 2M↗", steps: [{ intervalKey: "M7", direction: -1 }, { intervalKey: "M2", direction: 1 }] },
  { id: "l6-7Mdown2mup", label: "7M↘ + 2m↗", steps: [{ intervalKey: "M7", direction: -1 }, { intervalKey: "m2", direction: 1 }] },
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
  { value: "choir", label: "Coro Aahs", soundfont: "choir_aahs", fallback: "voice", sustain: true },
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

const SHORT_DIRECTION_OPTIONS = [
  { key: "random", label: "Libre" },
  { key: "ascending", label: "Ascendente" },
  { key: "descending", label: "Descendente" },
  { key: "mixed", label: "Mixto" },
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function accidentalCategory(note) {
  if (note.accidental > 0) return "sharp";
  if (note.accidental < 0) return "flat";
  return "natural";
}

function choosePalette() {
  const palettes = [
    ["natural"],
    ["natural", "sharp"],
    ["natural", "flat"],
    ["natural", "sharp", "flat"],
    ["sharp"],
    ["flat"],
  ];
  const weights = [1, 3, 3, 4, 1, 1];
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;

  for (let i = 0; i < palettes.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return palettes[i];
  }

  return palettes[palettes.length - 1];
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function pitchClassOf(noteOrMidi) {
  const midi = typeof noteOrMidi === "number" ? noteOrMidi : noteOrMidi?.midi;
  return ((midi % 12) + 12) % 12;
}

function shuffleItems(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isAwkwardSpelling(letter, accidental) {
  return (accidental === 1 && (letter === "E" || letter === "B")) || (accidental === -1 && (letter === "C" || letter === "F"));
}

function makeNote(letter, octave, accidental) {
  const midi = 12 * (octave + 1) + NATURAL_OFFSETS[letter] + accidental;
  return {
    id: `${letter}${ACCIDENTAL_ASCII[accidental]}${octave}`,
    letter,
    octave,
    accidental,
    midi,
    label: `${letter}${ACCIDENTAL_DISPLAY[accidental]}${octave}`,
    vexKey: `${letter.toLowerCase()}/${octave}`,
  };
}

function buildAvailableNotes() {
  const notes = [];
  for (let octave = 1; octave <= 8; octave += 1) {
    for (const letter of LETTERS) {
      for (const accidental of [-1, 0, 1]) {
        if (isAwkwardSpelling(letter, accidental)) continue;
        const note = makeNote(letter, octave, accidental);
        if (note.midi >= 28 && note.midi <= 108) {
          notes.push(note);
        }
      }
    }
  }
  return notes;
}

const AVAILABLE_NOTES = buildAvailableNotes();

function getClefConfig(clefKey) {
  return CLEFS.find((clef) => clef.key === clefKey) ?? CLEFS[0];
}

function getNotesForClef(clefKey) {
  const clef = getClefConfig(clefKey);
  const all = AVAILABLE_NOTES.filter((note) => note.midi >= clef.minMidi && note.midi <= clef.maxMidi);
  const central = all.filter((note) => note.midi >= clef.centerMinMidi && note.midi <= clef.centerMaxMidi);
  return { all, central: central.length > 0 ? central : all };
}

function getIntervalDefinition(intervalKey) {
  return INTERVAL_DEFINITIONS.find((interval) => interval.key === intervalKey);
}

function getIntervalDefinitionBySemitones(semitones, allowedIntervalKeys = []) {
  const allowedSet = new Set(allowedIntervalKeys.length > 0 ? allowedIntervalKeys : INTERVAL_DEFINITIONS.map((item) => item.key));
  return INTERVAL_DEFINITIONS.find((interval) => allowedSet.has(interval.key) && interval.variants.some((variant) => variant.semitones === semitones));
}

function getModelPatternsForSelection(selectedIntervalKeys) {
  const allowedSet = new Set(sanitizeIntervalSelection(selectedIntervalKeys));
  return MODEL_PATTERNS.filter((pattern) => pattern.steps.every((step) => allowedSet.has(step.intervalKey)));
}

function sequenceToKey(sequence) {
  return sequence.map((note) => note.id).join("|");
}

function countCategoryInRecentWindow(sequence, category, size = 6) {
  return sequence.slice(-size).filter((note) => accidentalCategory(note) === category).length;
}

function repeatedTailSize(sequence, candidateNote) {
  const nextSequence = [...sequence, candidateNote];
  const maxCheck = Math.min(4, Math.floor(nextSequence.length / 2));

  for (let size = maxCheck; size >= 2; size -= 1) {
    const tail = nextSequence.slice(-size);
    const previous = nextSequence.slice(-(size * 2), -size);
    if (tail.length === previous.length && sequenceToKey(tail) === sequenceToKey(previous)) {
      return size;
    }
  }

  return 0;
}

function createsABAPattern(sequence, candidateNote) {
  if (sequence.length < 2) return false;
  return sequence[sequence.length - 2].id === candidateNote.id;
}

function createsMirrorBounce(sequence, candidateNote) {
  if (sequence.length < 3) return false;
  return sequence[sequence.length - 3].id === candidateNote.id && sequence[sequence.length - 1].id !== candidateNote.id;
}

function recentUniqueRatio(sequence) {
  if (!sequence.length) return 1;
  const recent = sequence.slice(-6);
  return new Set(recent.map((note) => note.id)).size / recent.length;
}

function transposeNote(note, intervalVariant, direction, minMidi, maxMidi) {
  const currentLetterIndex = LETTERS.indexOf(note.letter);
  const currentDiatonicPosition = note.octave * 7 + currentLetterIndex;
  const targetDiatonicPosition = currentDiatonicPosition + direction * intervalVariant.diatonicSteps;
  const targetLetterIndex = ((targetDiatonicPosition % 7) + 7) % 7;
  const targetOctave = Math.floor(targetDiatonicPosition / 7);
  const targetLetter = LETTERS[targetLetterIndex];
  const desiredMidi = note.midi + direction * intervalVariant.semitones;
  const naturalMidi = 12 * (targetOctave + 1) + NATURAL_OFFSETS[targetLetter];
  const accidental = desiredMidi - naturalMidi;

  if (Math.abs(accidental) > 1) return null;
  if (isAwkwardSpelling(targetLetter, accidental)) return null;

  const result = makeNote(targetLetter, targetOctave, accidental);
  if (result.midi < minMidi || result.midi > maxMidi) return null;
  return result;
}

function getIntervalDirectionLabel(fromNote, toNote) {
  return toNote.midi >= fromNote.midi ? "↑" : "↓";
}

function getStaffWidth(noteCount) {
  return STAFF_BASE_WIDTH + noteCount * STAFF_NOTE_WIDTH;
}

function getDisplayedVexKey(note, clef) {
  const displayOctave = note.octave + (clef.displayOctaveShift ?? 0);
  return `${note.letter.toLowerCase()}/${displayOctave}`;
}

function getDisplayedAccidentalStateKey(note, clef) {
  const displayOctave = note.octave + (clef.displayOctaveShift ?? 0);
  return `${note.letter}${displayOctave}`;
}

function getInstrumentConfig(value) {
  return INSTRUMENTS.find((item) => item.value === value) ?? INSTRUMENTS.find((item) => item.value === DEFAULT_INSTRUMENT) ?? INSTRUMENTS[0];
}

function getInstrumentLabel(value) {
  return getInstrumentConfig(value)?.label ?? "Instrumento";
}

function getInstrumentFallback(value) {
  return getInstrumentConfig(value)?.fallback ?? value;
}

function getSoundfontUrl(name, soundfont = SOUNDFONT_LIBRARY, format = "mp3") {
  return `${SOUNDFONT_BASE_URL}/${soundfont}/${name}-${format}.js`;
}

function getSoundfontPlayerModule() {
  return SoundfontPlayer?.default ?? SoundfontPlayer;
}

function midiToAsciiNoteName(midi) {
  const names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pitchClass]}${octave}`;
}

function getSoundfontNoteName(note) {
  return note?.id ?? midiToAsciiNoteName(note.midi);
}

function getClefLabel(value) {
  return getClefConfig(value).label;
}

function sanitizeIntervalSelection(intervalKeys) {
  const unique = [...new Set(intervalKeys)].filter((key) => INTERVAL_DEFINITIONS.some((interval) => interval.key === key));
  if (unique.length === 0) return [];
  if (unique.length === 1 && unique[0] === "TT") return DEFAULT_INTERVAL_KEYS;
  return INTERVAL_DEFINITIONS.map((item) => item.key).filter((key) => unique.includes(key));
}

function sanitizeClefSelection(clefKeys) {
  return [...new Set(clefKeys)].filter((key) => CLEFS.some((clef) => clef.key === key));
}

function sanitizeDirectionMode(directionMode, noteCount) {
  if (noteCount >= 4) return "random";
  if (noteCount === 2 && directionMode === "mixed") return "random";
  const validKeys = SHORT_DIRECTION_OPTIONS.map((option) => option.key);
  return validKeys.includes(directionMode) ? directionMode : DEFAULT_DIRECTION_MODE;
}

function validateSequence(sequence, allowedIntervalKeys = []) {
  if (!Array.isArray(sequence)) return false;
  if (sequence.length < MIN_NOTES || sequence.length > MAX_NOTES) return false;

  const allowedSet = new Set(allowedIntervalKeys.length > 0 ? allowedIntervalKeys : INTERVAL_DEFINITIONS.map((item) => item.key));

  for (let i = 0; i < sequence.length; i += 1) {
    const note = sequence[i];
    if (!note || typeof note.midi !== "number" || typeof note.letter !== "string" || typeof note.octave !== "number") {
      return false;
    }
  }

  for (let i = 1; i < sequence.length; i += 1) {
    const diff = Math.abs(sequence[i].midi - sequence[i - 1].midi);
    const matched = INTERVAL_DEFINITIONS.some((interval) => allowedSet.has(interval.key) && interval.variants.some((variant) => variant.semitones === diff));
    if (!matched) return false;
  }

  return true;
}

function getDirectionPlan(noteCount, directionMode) {
  const sanitized = sanitizeDirectionMode(directionMode, noteCount);
  if (noteCount >= 4 || sanitized === "random") return null;
  if (noteCount === 2) {
    if (sanitized === "ascending") return [1];
    if (sanitized === "descending") return [-1];
    return null;
  }
  if (noteCount === 3) {
    if (sanitized === "ascending") return [1, 1];
    if (sanitized === "descending") return [-1, -1];
    if (sanitized === "mixed") return randomItem([[1, -1], [-1, 1]]);
  }
  return null;
}

function transitionMatchesModelStep(transition, modelStep) {
  if (!transition || !modelStep) return false;
  if (transition.intervalKey !== modelStep.intervalKey) return false;
  if (typeof modelStep.direction === "number" && transition.direction !== modelStep.direction) return false;
  return true;
}

function getModelBiasScore(recentTransitions, candidateTransition, modelPatterns) {
  if (!modelPatterns.length) return 0;
  const combined = [...recentTransitions.slice(-4), candidateTransition];
  let best = 0;

  modelPatterns.forEach((pattern) => {
    const maxLen = Math.min(pattern.steps.length, combined.length);
    for (let len = 1; len <= maxLen; len += 1) {
      const suffix = combined.slice(-len);
      const prefix = pattern.steps.slice(0, len);
      const matches = suffix.every((transition, index) => transitionMatchesModelStep(transition, prefix[index]));
      if (matches) {
        const exact = len === pattern.steps.length ? 2 : 0;
        best = Math.max(best, len * 2.4 + exact);
      }
    }
  });

  return best;
}

function getCandidates(currentNote, previousNote, selectedIntervalKeys, clefKey, forcedDirection = null) {
  const clef = getClefConfig(clefKey);
  const rawCandidates = [];

  sanitizeIntervalSelection(selectedIntervalKeys).forEach((intervalKey) => {
    const interval = getIntervalDefinition(intervalKey);
    if (!interval) return;

    interval.variants.forEach((variant) => {
      [1, -1].forEach((direction) => {
        if (typeof forcedDirection === "number" && direction !== forcedDirection) return;
        const candidate = transposeNote(currentNote, variant, direction, clef.minMidi, clef.maxMidi);
        if (candidate) {
          rawCandidates.push({
            note: candidate,
            intervalKey: interval.key,
            intervalShort: interval.short,
            intervalName: interval.name,
            direction,
          });
        }
      });
    });
  });

  const deduped = [];
  const seen = new Set();
  rawCandidates.forEach((item) => {
    const dedupeKey = `${item.note.id}-${item.intervalKey}-${item.direction}`;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      deduped.push(item);
    }
  });

  let usable = deduped;
  if (previousNote) {
    const withoutImmediateReturn = usable.filter((item) => item.note.id !== previousNote.id);
    if (withoutImmediateReturn.length > 0) usable = withoutImmediateReturn;
  }

  return usable;
}

function chooseCandidate(candidates, sequence, palette, recentTransitions, modelPatterns) {
  const targetPalette = palette.length ? palette : ["natural", "sharp", "flat"];
  const accidentalCounts = {
    natural: countCategoryInRecentWindow(sequence, "natural"),
    sharp: countCategoryInRecentWindow(sequence, "sharp"),
    flat: countCategoryInRecentWindow(sequence, "flat"),
  };

  const scored = candidates.map((item) => {
    let score = 0;
    const category = accidentalCategory(item.note);
    const repeatedTail = repeatedTailSize(sequence, item.note);
    const candidateTransition = { intervalKey: item.intervalKey, direction: item.direction };

    if (targetPalette.includes(category)) {
      score += 5;
      score += Math.max(0, 4 - accidentalCounts[category]);
    } else {
      score -= 7;
    }

    if (targetPalette.length > 1 && category !== accidentalCategory(sequence[sequence.length - 1])) {
      score += 2.5;
    }

    if (recentUniqueRatio(sequence) < 0.7 && !sequence.slice(-6).some((note) => note.id === item.note.id)) {
      score += 4;
    }

    if (createsABAPattern(sequence, item.note)) score -= 7;
    if (createsMirrorBounce(sequence, item.note)) score -= 5;
    if (repeatedTail > 0) score -= repeatedTail * 6;
    if (sequence.slice(-4).filter((note) => note.id === item.note.id).length > 0) score -= 3.5;

    const recentSignatures = recentTransitions.slice(-6).map((transition) => `${transition.intervalKey}:${transition.direction}`);
    const currentSignature = `${item.intervalKey}:${item.direction}`;
    const intervalUsage = recentSignatures.filter((value) => value === currentSignature).length;
    score -= intervalUsage * 1.2;

    if (recentSignatures.length >= 2) {
      const last = recentSignatures[recentSignatures.length - 1];
      const previous = recentSignatures[recentSignatures.length - 2];
      if (last === currentSignature) score -= 1.5;
      if (last === currentSignature && previous === currentSignature) score -= 6;
    }

    if (item.note.midi >= 52 && item.note.midi <= 80) score += 1.5;
    score += getModelBiasScore(recentTransitions, candidateTransition, modelPatterns);

    return { ...item, score };
  });

  const bestScore = Math.max(...scored.map((item) => item.score));
  const best = scored.filter((item) => item.score >= bestScore - 1.4);
  return randomItem(best);
}

function getTwelveToneIntervalKeys(selectedIntervalKeys) {
  return sanitizeIntervalSelection(selectedIntervalKeys).filter((intervalKey) => {
    const interval = getIntervalDefinition(intervalKey);
    if (!interval) return false;
    return interval.variants.some((variant) => variant.semitones % 12 !== 0);
  });
}

function getTwelveToneCandidates(currentNote, selectedIntervalKeys, clefKey, usedPitchClasses) {
  const allowedSet = new Set(getTwelveToneIntervalKeys(selectedIntervalKeys));
  if (allowedSet.size === 0) return [];

  return getCandidates(currentNote, null, [...allowedSet], clefKey)
    .filter((item) => allowedSet.has(item.intervalKey))
    .filter((item) => !usedPitchClasses.has(pitchClassOf(item.note)))
    .filter((item) => Math.abs(item.note.midi - currentNote.midi) % 12 !== 0);
}

function buildTwelveToneSeries(noteCount, selectedIntervalKeys, selectedClefKeys) {
  const safeCount = clamp(noteCount, 4, 12);
  const sanitizedIntervals = sanitizeIntervalSelection(selectedIntervalKeys);
  const usableIntervals = getTwelveToneIntervalKeys(sanitizedIntervals);
  const sanitizedClefs = sanitizeClefSelection(selectedClefKeys);
  const clefKey = randomItem(sanitizedClefs.length > 0 ? sanitizedClefs : DEFAULT_CLEF_KEYS);
  const { all, central } = getNotesForClef(clefKey);

  if (sanitizedIntervals.length === 0) {
    return {
      id: `${Date.now()}-${Math.random()}`,
      sequence: [],
      intervals: [],
      startNote: "",
      palette: [],
      clefKey,
      intervalKeys: [],
      directionMode: "random",
      modelLabels: [],
      mode: "twelveTone",
      generationError: "Selecciona al menos un intervalo para crear la serie dodecafónica.",
    };
  }

  if (usableIntervals.length === 0) {
    return {
      id: `${Date.now()}-${Math.random()}`,
      sequence: [],
      intervals: [],
      startNote: "",
      palette: [],
      clefKey,
      intervalKeys: sanitizedIntervals,
      directionMode: "random",
      modelLabels: [],
      mode: "twelveTone",
      generationError: "En modo dodecafónico, la 8J no puede ser el único intervalo porque repite la misma clase de altura.",
    };
  }

  const startingPool = shuffleItems(central.length > 0 ? central : all);
  const maxStarts = Math.min(40, startingPool.length);

  for (let startIndex = 0; startIndex < maxStarts; startIndex += 1) {
    const start = startingPool[startIndex];
    const sequence = [start];
    const transitions = [];
    const usedPitchClasses = new Set([pitchClassOf(start)]);

    function search(currentNote) {
      if (sequence.length === safeCount) return true;

      const candidates = shuffleItems(getTwelveToneCandidates(currentNote, usableIntervals, clefKey, usedPitchClasses))
        .sort((a, b) => {
          const aCentral = a.note.midi >= getClefConfig(clefKey).centerMinMidi && a.note.midi <= getClefConfig(clefKey).centerMaxMidi ? 0 : 1;
          const bCentral = b.note.midi >= getClefConfig(clefKey).centerMinMidi && b.note.midi <= getClefConfig(clefKey).centerMaxMidi ? 0 : 1;
          return aCentral - bCentral;
        });

      for (const candidate of candidates) {
        const pc = pitchClassOf(candidate.note);
        if (usedPitchClasses.has(pc)) continue;

        sequence.push(candidate.note);
        transitions.push({ intervalKey: candidate.intervalKey, direction: candidate.direction, short: candidate.intervalShort });
        usedPitchClasses.add(pc);

        if (search(candidate.note)) return true;

        usedPitchClasses.delete(pc);
        transitions.pop();
        sequence.pop();
      }

      return false;
    }

    if (search(start)) {
      const intervals = sequence.slice(1).map((note, index) => {
        const prev = sequence[index];
        const diff = Math.abs(note.midi - prev.midi);
        const interval = getIntervalDefinitionBySemitones(diff, usableIntervals);
        return `${interval?.short ?? diff} ${getIntervalDirectionLabel(prev, note)}`;
      });

      return {
        id: `${Date.now()}-${Math.random()}`,
        sequence,
        intervals,
        startNote: sequence[0]?.label ?? "",
        palette: ["twelveTone"],
        clefKey,
        intervalKeys: sanitizedIntervals,
        directionMode: "random",
        modelLabels: [],
        mode: "twelveTone",
        generationError: "",
      };
    }
  }

  return {
    id: `${Date.now()}-${Math.random()}`,
    sequence: [],
    intervals: [],
    startNote: "",
    palette: [],
    clefKey,
    intervalKeys: sanitizedIntervals,
    directionMode: "random",
    modelLabels: [],
    mode: "twelveTone",
    generationError: "No fue posible crear una serie sin repetición con esa combinación de intervalos. Prueba agregar más intervalos.",
  };
}

function buildMelody(noteCount, selectedIntervalKeys, selectedClefKeys, directionMode) {
  const safeCount = clamp(noteCount, MIN_NOTES, MAX_NOTES);
  const sanitizedIntervals = sanitizeIntervalSelection(selectedIntervalKeys);
  const sanitizedClefs = sanitizeClefSelection(selectedClefKeys);

  if (sanitizedIntervals.length === 0) {
    return {
      id: `${Date.now()}-${Math.random()}`,
      sequence: [],
      intervals: [],
      startNote: "",
      palette: [],
      clefKey: sanitizedClefs[0] ?? "treble",
      intervalKeys: [],
      directionMode: sanitizeDirectionMode(directionMode, safeCount),
      modelLabels: [],
      mode: "intervals",
      generationError: "Selecciona al menos un intervalo para generar una sucesión.",
    };
  }
  const sanitizedDirectionMode = sanitizeDirectionMode(directionMode, safeCount);
  const directionPlan = getDirectionPlan(safeCount, sanitizedDirectionMode);
  const clefKey = randomItem(sanitizedClefs);
  const palette = choosePalette();
  const modelPatterns = getModelPatternsForSelection(sanitizedIntervals);
  const { all, central } = getNotesForClef(clefKey);
  const startingPool = central.filter((note) => palette.includes(accidentalCategory(note)));
  let current = randomItem(startingPool.length > 0 ? startingPool : central.length > 0 ? central : all);
  const sequence = [current];
  const recentTransitions = [];
  const usedModelLabels = [];

  for (let i = 1; i < safeCount; i += 1) {
    const previous = sequence[i - 2] ?? null;
    const forcedDirection = directionPlan ? directionPlan[i - 1] ?? null : null;
    const candidates = getCandidates(current, previous, sanitizedIntervals, clefKey, forcedDirection);

    if (candidates.length === 0) {
      const fallbackPool = central.filter((note) => note.id !== current.id && palette.includes(accidentalCategory(note)));
      current = randomItem(fallbackPool.length > 0 ? fallbackPool : central.length > 0 ? central : all);
      sequence.push(current);
      continue;
    }

    const chosen = chooseCandidate(candidates, sequence, palette, recentTransitions, modelPatterns);
    current = chosen.note;
    const transition = { intervalKey: chosen.intervalKey, direction: chosen.direction, short: chosen.intervalShort };
    recentTransitions.push(transition);
    sequence.push(current);

    const completedModels = modelPatterns
      .filter((pattern) => pattern.steps.length <= recentTransitions.length)
      .filter((pattern) => {
        const tail = recentTransitions.slice(-pattern.steps.length);
        return tail.every((item, index) => transitionMatchesModelStep(item, pattern.steps[index]));
      })
      .map((pattern) => pattern.label);

    completedModels.forEach((label) => {
      if (usedModelLabels.length < 8) usedModelLabels.push(label);
    });
  }

  const intervals = sequence.slice(1).map((note, index) => {
    const prev = sequence[index];
    const diff = Math.abs(note.midi - prev.midi);
    const interval = getIntervalDefinitionBySemitones(diff, sanitizedIntervals);
    return `${interval?.short ?? diff} ${getIntervalDirectionLabel(prev, note)}`;
  });

  return {
    id: `${Date.now()}-${Math.random()}`,
    sequence,
    intervals,
    startNote: sequence[0]?.label ?? "",
    palette,
    clefKey,
    intervalKeys: sanitizedIntervals,
    directionMode: sanitizedDirectionMode,
    modelLabels: [...new Set(usedModelLabels)],
    mode: "intervals",
    generationError: "",
  };
}

function runSelfTests() {
  const gSharp = makeNote("G", 4, 1);
  const treble = getClefConfig("treble");

  const upFourth = transposeNote(gSharp, { semitones: 5, diatonicSteps: 3 }, 1, treble.minMidi, treble.maxMidi);
  console.assert(upFourth?.label === "C♯5", "La cuarta ascendente desde sol sostenido debe escribirse como do sostenido");

  const downFourth = transposeNote(gSharp, { semitones: 5, diatonicSteps: 3 }, -1, treble.minMidi, treble.maxMidi);
  console.assert(downFourth?.label === "D♯4", "La cuarta descendente desde sol sostenido debe escribirse como re sostenido");

  const downFifth = transposeNote(gSharp, { semitones: 7, diatonicSteps: 4 }, -1, treble.minMidi, treble.maxMidi);
  console.assert(downFifth?.label === "C♯4", "La quinta descendente desde sol sostenido debe escribirse como do sostenido");

  const bFlat = makeNote("B", 4, -1);
  const upFourthFromBFlat = transposeNote(bFlat, { semitones: 5, diatonicSteps: 3 }, 1, treble.minMidi, treble.maxMidi);
  console.assert(upFourthFromBFlat?.label === "E♭5", "La cuarta desde si bemol debe escribirse como mi bemol");

  const sampleSequence = [makeNote("C", 4, 0), makeNote("G", 4, 0), makeNote("C", 4, 0), makeNote("G", 4, 0)];
  console.assert(repeatedTailSize(sampleSequence.slice(0, 3), sampleSequence[3]) === 2, "Debe detectar repetición de cola de tamaño 2");
  console.assert(createsABAPattern([makeNote("C", 4, 0), makeNote("G", 4, 0)], makeNote("C", 4, 0)) === true, "Debe detectar patrón ABA");
  console.assert(sanitizeIntervalSelection(["TT"]).join(",") === DEFAULT_INTERVAL_KEYS.join(","), "El tritono no debe quedar como única selección");
  console.assert(sanitizeClefSelection([]).length === 0, "Debe permitir deseleccionar todas las claves");
  console.assert(getDirectionPlan(2, "ascending")[0] === 1, "Debe existir plan ascendente para 2 notas");
  console.assert(getDirectionPlan(3, "descending").join(",") === "-1,-1", "Debe existir plan descendente para 3 notas");

  [2, 3, 4, 5, 8, 13, 24].forEach((count) => {
    const melody = buildMelody(count, ["m2", "M2", "P4", "P5", "P8"], ["treble", "alto", "bass"], count <= 3 ? "ascending" : "random");
    console.assert(melody.sequence.length === count, `La melodía debe tener ${count} notas`);
    console.assert(validateSequence(melody.sequence, melody.intervalKeys), `La melodía de ${count} notas debe ser válida`);
    console.assert(typeof melody.startNote === "string" && melody.startNote.length > 0, "Debe existir nota inicial");
    console.assert(Array.isArray(melody.palette) && melody.palette.length > 0, "Debe existir una paleta de alteraciones");
    console.assert(["treble", "alto", "bass"].includes(melody.clefKey), "La clave generada debe ser válida");
  });

  const selectedPatterns = getModelPatternsForSelection(["P4", "P5", "P8"]);
  console.assert(selectedPatterns.some((pattern) => pattern.id === "l1-4j4j"), "Deben estar presentes los modelos del nivel I");
  console.assert(getModelPatternsForSelection(["TT", "P4", "P5"]).some((pattern) => pattern.id === "l4-tt4j"), "Deben estar presentes los modelos del nivel IV");

  const paletteSamples = new Set();
  for (let i = 0; i < 40; i += 1) {
    paletteSamples.add(choosePalette().join("-"));
  }
  console.assert(paletteSamples.size >= 3, "La selección de paletas debe variar");
  console.assert(clamp(10, MIN_TEMPO, MAX_TEMPO) === 30, "El tempo mínimo debe respetarse");
  console.assert(clamp(240, MIN_TEMPO, MAX_TEMPO) === 200, "El tempo máximo debe respetarse");
  console.assert(clamp(-5, MIN_VOLUME, MAX_VOLUME) === 0, "El volumen mínimo debe respetarse");
  console.assert(clamp(220, MIN_VOLUME, MAX_VOLUME) === 100, "El volumen máximo debe respetarse");
  console.assert(getStaffWidth(24) > getStaffWidth(4), "El pentagrama debe crecer con más notas");
  console.assert(getInstrumentConfig("marimba")?.soundfont === "marimba", "Debe existir la fuente de sonido de marimba");
  console.assert(getInstrumentConfig("piano")?.soundfont === "acoustic_grand_piano", "El piano acústico debe ser el instrumento por defecto disponible");
  console.assert(!INSTRUMENTS.some((item) => item.value === "brightPiano"), "El piano brillante debe estar retirado de la lista");
  const twelveTone = buildTwelveToneSeries(12, ["P4", "P5", "m2", "M2"], ["treble"]);
  console.assert(twelveTone.sequence.length === 12, "Debe poder crear una serie dodecafónica de 12 notas");
  console.assert(new Set(twelveTone.sequence.map((note) => pitchClassOf(note))).size === twelveTone.sequence.length, "La serie dodecafónica no debe repetir clases de altura");
  console.assert(CLEFS.some((clef) => clef.key === "treble15ma"), "Debe existir la clave de sol dos octavas alta");
  console.assert(CLEFS.some((clef) => clef.key === "bass8vb"), "Debe existir la clave de fa una octava baja");
}

if (typeof window !== "undefined") {
  runSelfTests();
}

function SelectionChip({ active, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-2 text-sm transition ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function ActionButton({ active = false, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function ScoreRenderer({ notes, clefKey, allowedIntervalKeys }) {
  const containerRef = useRef(null);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    let disposed = false;

    async function renderScore() {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";
      setRenderError("");

      if (!notes?.length || !validateSequence(notes, allowedIntervalKeys)) {
        setRenderError("No se pudo generar una partitura válida para esta sucesión.");
        return;
      }

      try {
        const VF = await import("vexflow");
        if (disposed || !containerRef.current) return;

        const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = VF;
        const width = getStaffWidth(notes.length);
        const height = 170;
        const accidentalState = new Map();
        const clef = getClefConfig(clefKey);

        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
        renderer.resize(width, height);
        const context = renderer.getContext();
        const stave = new Stave(20, 20, width - 40);
        try {
          stave.addClef(clef.vex, "default", clef.annotation);
        } catch {
          stave.addClef(clef.vex);
        }
        stave.setContext(context).draw();

        const vexNotes = notes.map((note) => {
          const staveNote = new StaveNote({
            clef: clef.vex,
            keys: [getDisplayedVexKey(note, clef)],
            duration: "w",
          });

          const stateKey = getDisplayedAccidentalStateKey(note, clef);
          const previousAccidental = accidentalState.get(stateKey) ?? 0;

          if (note.accidental !== 0) {
            staveNote.addModifier(new Accidental(ACCIDENTAL_ASCII[note.accidental]), 0);
          } else if (previousAccidental !== 0) {
            staveNote.addModifier(new Accidental("n"), 0);
          }

          accidentalState.set(stateKey, note.accidental);
          return staveNote;
        });

        const voice = new Voice({ num_beats: notes.length * 4, beat_value: 4 });
        if (typeof voice.setMode === "function" && Voice.Mode) voice.setMode(Voice.Mode.SOFT);
        if (typeof voice.setStrict === "function") voice.setStrict(false);

        voice.addTickables(vexNotes);
        new Formatter().joinVoices([voice]).format([voice], width - 130);
        voice.draw(context, stave);
      } catch (error) {
        console.error("Error al renderizar la partitura:", error);
        setRenderError("Hubo un problema al dibujar la partitura.");
      }
    }

    renderScore();
    return () => {
      disposed = true;
    };
  }, [notes, clefKey, allowedIntervalKeys]);

  return (
    <div className="space-y-3">
      <div className="w-full overflow-x-auto rounded-2xl border bg-white p-3">
        <div ref={containerRef} />
      </div>
      {renderError ? <p className="text-sm text-red-600">{renderError}</p> : null}
    </div>
  );
}

export default function IntervalTrainerPage() {
  const audioContextRef = useRef(null);
  const playbackTimeoutRef = useRef(null);
  const generatePulseTimeoutRef = useRef(null);
  const activeNodesRef = useRef([]);
  const sampleNodesRef = useRef([]);
  const soundfontCacheRef = useRef(new Map());

  const [noteCount, setNoteCount] = useState(DEFAULT_NOTE_COUNT);
  const [tempo, setTempo] = useState(DEFAULT_TEMPO);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [instrument, setInstrument] = useState(DEFAULT_INSTRUMENT);
  const [selectedIntervalKeys, setSelectedIntervalKeys] = useState(DEFAULT_INTERVAL_KEYS);
  const [useTwelveToneSeries, setUseTwelveToneSeries] = useState(false);
  const [selectedClefKeys, setSelectedClefKeys] = useState(DEFAULT_CLEF_KEYS);
  const [directionMode, setDirectionMode] = useState(DEFAULT_DIRECTION_MODE);
  const [exercise, setExercise] = useState(() => buildMelody(DEFAULT_NOTE_COUNT, DEFAULT_INTERVAL_KEYS, DEFAULT_CLEF_KEYS, DEFAULT_DIRECTION_MODE));
  const [revealed, setRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioStatus, setAudioStatus] = useState("");
  const [generatePulse, setGeneratePulse] = useState(false);

  const noteSummary = useMemo(() => `${noteCount} nota${noteCount === 1 ? "" : "s"}`, [noteCount]);
  const tempoSummary = useMemo(() => `${tempo} BPM`, [tempo]);
  const volumeSummary = useMemo(() => `${volume}%`, [volume]);
  const instrumentSummary = useMemo(() => getInstrumentLabel(instrument), [instrument]);
  const startNoteSummary = useMemo(() => exercise?.startNote || "—", [exercise]);
  const activeClefLabel = useMemo(() => getClefLabel(exercise?.clefKey || "treble"), [exercise]);
  const visibleDirectionOptions = useMemo(() => {
    if (noteCount === 2) return SHORT_DIRECTION_OPTIONS.filter((option) => option.key !== "mixed");
    if (noteCount === 3) return SHORT_DIRECTION_OPTIONS;
    return [];
  }, [noteCount]);
  const twelveToneUsableIntervals = useMemo(() => getTwelveToneIntervalKeys(selectedIntervalKeys), [selectedIntervalKeys]);
  const noteRangeMin = useTwelveToneSeries ? 4 : MIN_NOTES;
  const noteRangeMax = useTwelveToneSeries ? 12 : MAX_NOTES;
  const hasSelectedIntervals = selectedIntervalKeys.length > 0;
  const hasSelectedClefs = selectedClefKeys.length > 0;
  const canGenerate = hasSelectedIntervals && hasSelectedClefs && (!useTwelveToneSeries || twelveToneUsableIntervals.length > 0);

  const stopAllAudio = useCallback(() => {
    sampleNodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch {}
      try {
        node.disconnect?.();
      } catch {}
    });
    sampleNodesRef.current = [];

    activeNodesRef.current.forEach(({ oscillators = [], gains = [], filters = [], masterGain }) => {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {}
      });
      [...oscillators, ...gains, ...filters, masterGain].filter(Boolean).forEach((node) => {
        try {
          node.disconnect();
        } catch {}
      });
    });
    activeNodesRef.current = [];
  }, []);

  const stopPlayback = useCallback(() => {
    if (playbackTimeoutRef.current) {
      window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    stopAllAudio();
    setIsPlaying(false);
  }, [stopAllAudio]);

  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio API no disponible en este navegador");
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const ensureSoundfontPlayer = useCallback(() => {
    const Soundfont = getSoundfontPlayerModule();
    if (!Soundfont?.instrument) {
      throw new Error("No se pudo inicializar soundfont-player desde npm");
    }
    return Soundfont;
  }, []);

  const loadSampleInstrument = useCallback(async (ctx, instrumentValue) => {
    const config = getInstrumentConfig(instrumentValue);
    if (!config?.soundfont) return null;

    const cacheKey = `${SOUNDFONT_LIBRARY}:${config.soundfont}`;
    if (!soundfontCacheRef.current.has(cacheKey)) {
      const Soundfont = ensureSoundfontPlayer();
      const promise = Soundfont.instrument(ctx, config.soundfont, {
        format: "mp3",
        soundfont: SOUNDFONT_LIBRARY,
        nameToUrl: (name, soundfont, format) => getSoundfontUrl(name, soundfont, format),
      });
      soundfontCacheRef.current.set(cacheKey, promise);
    }

    return soundfontCacheRef.current.get(cacheKey);
  }, [ensureSoundfontPlayer]);

  const createInstrumentVoice = useCallback((ctx, freq, instrumentType, startTime, duration, volumeLevel) => {
    const masterGain = ctx.createGain();
    const oscillators = [];
    const gains = [];
    const filters = [];
    const volumeNorm = (clamp(volumeLevel, MIN_VOLUME, MAX_VOLUME) / 100) * INTERNAL_VOLUME_BOOST;
    const fallbackFamily = getInstrumentFallback(instrumentType);

    let attack = 0.04;
    let release = Math.max(0.1, duration * 0.22);
    let peak = 0.14 * volumeNorm;

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

    if (fallbackFamily === "voice") {
      attack = 0.09;
      release = Math.max(0.15, duration * 0.24);
      peak = 0.18 * volumeNorm;
      const formant1 = ctx.createBiquadFilter();
      formant1.type = "bandpass";
      formant1.frequency.value = 800;
      formant1.Q.value = 1.3;
      const formant2 = ctx.createBiquadFilter();
      formant2.type = "bandpass";
      formant2.frequency.value = 1150;
      formant2.Q.value = 1.2;
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 2400;
      lowPass.Q.value = 0.7;
      formant1.connect(lowPass);
      formant2.connect(lowPass);
      lowPass.connect(masterGain);
      filters.push(formant1, formant2, lowPass);
      routeOscillator({ type: "sawtooth", detune: -4, level: 0.46, targetNode: formant1 });
      routeOscillator({ type: "triangle", detune: 3, level: 0.3, targetNode: formant2 });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.08, targetNode: lowPass });
    } else if (fallbackFamily === "organ") {
      attack = 0.03;
      release = Math.max(0.1, duration * 0.18);
      peak = 0.17 * volumeNorm;
      routeOscillator({ type: "sine", level: 0.74 });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.18 });
      routeOscillator({ type: "triangle", multiplier: 0.5, level: 0.12 });
    } else if (fallbackFamily === "strings") {
      attack = 0.12;
      release = Math.max(0.15, duration * 0.26);
      peak = 0.17 * volumeNorm;
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 1900;
      lowPass.Q.value = 0.8;
      lowPass.connect(masterGain);
      filters.push(lowPass);
      routeOscillator({ type: "sawtooth", detune: -5, level: 0.42, targetNode: lowPass });
      routeOscillator({ type: "sawtooth", detune: 5, level: 0.34, targetNode: lowPass });
      routeOscillator({ type: "triangle", multiplier: 2, level: 0.08, targetNode: lowPass });
    } else if (fallbackFamily === "mallet") {
      attack = 0.006;
      release = Math.max(0.08, duration * 0.42);
      peak = 0.18 * volumeNorm;
      const highPass = ctx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 180;
      highPass.Q.value = 0.4;
      highPass.connect(masterGain);
      filters.push(highPass);
      routeOscillator({ type: "sine", level: 0.68, targetNode: highPass });
      routeOscillator({ type: "triangle", multiplier: 2, level: 0.18, targetNode: highPass });
      routeOscillator({ type: "sine", multiplier: 3, level: 0.08, targetNode: highPass });
    } else if (fallbackFamily === "bass") {
      attack = 0.02;
      release = Math.max(0.1, duration * 0.28);
      peak = 0.2 * volumeNorm;
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 900;
      lowPass.Q.value = 0.8;
      lowPass.connect(masterGain);
      filters.push(lowPass);
      routeOscillator({ type: "sine", level: 0.72, targetNode: lowPass });
      routeOscillator({ type: "triangle", multiplier: 2, level: 0.18, targetNode: lowPass });
    } else {
      attack = 0.012;
      release = Math.max(0.12, duration * 0.36);
      peak = 0.2 * volumeNorm;
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 2900;
      lowPass.Q.value = 0.7;
      lowPass.connect(masterGain);
      filters.push(lowPass);
      routeOscillator({ type: "triangle", level: 0.9, targetNode: lowPass });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.12, targetNode: lowPass });
    }

    const sustainEnd = Math.max(startTime + attack + 0.02, startTime + duration - release);
    masterGain.gain.setValueAtTime(0.0001, startTime);
    masterGain.gain.linearRampToValueAtTime(peak, startTime + attack);
    if (fallbackFamily === "piano" || fallbackFamily === "mallet" || fallbackFamily === "bass") {
      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 0.25), sustainEnd);
    } else {
      masterGain.gain.setValueAtTime(peak, sustainEnd);
    }
    masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    masterGain.connect(ctx.destination);

    oscillators.forEach((osc) => {
      osc.start(startTime);
      osc.stop(startTime + duration + 0.04);
    });

    activeNodesRef.current.push({ oscillators, gains, filters, masterGain });

    const cleanup = () => {
      activeNodesRef.current = activeNodesRef.current.filter((entry) => entry.masterGain !== masterGain);
      [...oscillators, ...gains, ...filters, masterGain].forEach((node) => {
        try {
          node.disconnect();
        } catch {}
      });
    };

    if (oscillators[0]) oscillators[0].onended = cleanup;
  }, []);

  const generateExercise = useCallback((count, nextDirectionMode = directionMode) => {
    stopPlayback();
    if (selectedIntervalKeys.length === 0 || selectedClefKeys.length === 0) return;
    const safeCount = useTwelveToneSeries ? clamp(count, 4, 12) : count;
    const nextExercise = useTwelveToneSeries
      ? buildTwelveToneSeries(safeCount, selectedIntervalKeys, selectedClefKeys)
      : buildMelody(safeCount, selectedIntervalKeys, selectedClefKeys, nextDirectionMode);
    setExercise(nextExercise);
    setRevealed(false);
  }, [directionMode, selectedIntervalKeys, selectedClefKeys, stopPlayback, useTwelveToneSeries]);

  const toggleInterval = useCallback((intervalKey) => {
    setSelectedIntervalKeys((current) => {
      const exists = current.includes(intervalKey);
      const next = exists ? current.filter((key) => key !== intervalKey) : [...current, intervalKey];
      return sanitizeIntervalSelection(next);
    });
  }, []);

  const selectAllIntervals = useCallback(() => {
    setSelectedIntervalKeys(INTERVAL_DEFINITIONS.map((interval) => interval.key));
  }, []);

  const deselectAllIntervals = useCallback(() => {
    setSelectedIntervalKeys([]);
  }, []);

  const toggleTwelveToneSeries = useCallback(() => {
    setUseTwelveToneSeries((current) => {
      const next = !current;
      if (next) {
        setNoteCount((count) => clamp(count, 4, 12));
        setDirectionMode("random");
      }
      return next;
    });
  }, []);

  const toggleClef = useCallback((clefKey) => {
    setSelectedClefKeys((current) => {
      const exists = current.includes(clefKey);
      const next = exists ? current.filter((key) => key !== clefKey) : [...current, clefKey];
      return sanitizeClefSelection(next);
    });
  }, []);

  const selectAllClefs = useCallback(() => {
    setSelectedClefKeys(CLEFS.map((clef) => clef.key));
  }, []);

  const deselectAllClefs = useCallback(() => {
    setSelectedClefKeys([]);
  }, []);

  const handleDirectionChange = useCallback((mode) => {
    const sanitized = sanitizeDirectionMode(mode, noteCount);
    setDirectionMode(sanitized);
  }, [noteCount]);

  const playSequence = useCallback(async () => {
    if (!exercise?.sequence?.length || !canGenerate || isPlaying) return;
    setIsPlaying(true);

    try {
      const ctx = await ensureAudioContext();
      const safeTempo = clamp(tempo, MIN_TEMPO, MAX_TEMPO);
      const safeVolume = clamp(volume, MIN_VOLUME, MAX_VOLUME);
      const instrumentConfig = getInstrumentConfig(instrument);
      const secondsPerBeat = 60 / safeTempo;
      const step = secondsPerBeat;
      const noteDuration = instrumentConfig?.sustain ? Math.max(0.24, step * 1.02) : Math.max(0.18, step * 0.98);
      let baseTime = ctx.currentTime + 0.05;
      let sampleInstrument = null;

      stopAllAudio();

      if (instrumentConfig?.soundfont) {
        try {
          setAudioStatus(`Cargando ${instrumentConfig.label}...`);
          sampleInstrument = await loadSampleInstrument(ctx, instrument);
          baseTime = ctx.currentTime + 0.05;
          setAudioStatus(`Sonido SoundFont activo: ${instrumentConfig.label}.`);
        } catch (soundfontError) {
          console.warn("No se pudo cargar el SoundFont; se usará síntesis interna:", soundfontError);
          setAudioStatus(`No se pudo cargar el SoundFont de ${instrumentConfig.label}. Usando síntesis interna de respaldo.`);
        }
      }

      if (sampleInstrument) {
        const sampleGain = Math.max(0.0001, Math.min(12, (safeVolume / 100) * SOUNDFONT_GAIN_BOOST));
        exercise.sequence.forEach((note, index) => {
          const node = sampleInstrument.play(getSoundfontNoteName(note), baseTime + index * step, {
            duration: noteDuration,
            gain: sampleGain,
          });
          if (node) sampleNodesRef.current.push(node);
        });
      } else {
        exercise.sequence.forEach((note, index) => {
          createInstrumentVoice(ctx, midiToFreq(note.midi), instrument, baseTime + index * step, noteDuration, safeVolume);
        });
      }

      if (playbackTimeoutRef.current) window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = window.setTimeout(() => {
        setIsPlaying(false);
        playbackTimeoutRef.current = null;
      }, exercise.sequence.length * step * 1000 + 450);
    } catch (error) {
      console.error("Error al reproducir la sucesión:", error);
      setAudioStatus("Hubo un problema al reproducir el audio.");
      setIsPlaying(false);
    }
  }, [canGenerate, createInstrumentVoice, ensureAudioContext, exercise, instrument, isPlaying, loadSampleInstrument, stopAllAudio, tempo, volume]);

  const handleGenerateButton = useCallback(() => {
    if (!canGenerate) return;
    generateExercise(noteCount, directionMode);
    setGeneratePulse(true);
    if (generatePulseTimeoutRef.current) window.clearTimeout(generatePulseTimeoutRef.current);
    generatePulseTimeoutRef.current = window.setTimeout(() => {
      setGeneratePulse(false);
      generatePulseTimeoutRef.current = null;
    }, 650);
  }, [canGenerate, directionMode, generateExercise, noteCount]);

  const handlePlayButton = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playSequence();
    }
  }, [isPlaying, playSequence, stopPlayback]);

  useEffect(() => {
    setDirectionMode((current) => sanitizeDirectionMode(current, noteCount));
  }, [noteCount]);

  useEffect(() => {
    setNoteCount((current) => clamp(current, noteRangeMin, noteRangeMax));
  }, [noteRangeMin, noteRangeMax]);

  useEffect(() => {
    generateExercise(noteCount, directionMode);
  }, [selectedIntervalKeys, selectedClefKeys, directionMode, useTwelveToneSeries]);

  useEffect(() => {
    return () => {
      if (playbackTimeoutRef.current) window.clearTimeout(playbackTimeoutRef.current);
      if (generatePulseTimeoutRef.current) window.clearTimeout(generatePulseTimeoutRef.current);
      stopAllAudio();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stopAllAudio]);

  return (
    <div className="min-h-screen bg-zinc-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Entrenador de intervalos melódicos · Método Aural</h1>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-zinc-700">Número de notas</span>
                <Badge variant="secondary" className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-700">{noteSummary}</Badge>
              </div>
              <input
                type="range"
                min={noteRangeMin}
                max={noteRangeMax}
                step={1}
                value={noteCount}
                onChange={(event) => setNoteCount(clamp(Number(event.target.value), noteRangeMin, noteRangeMax))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{noteRangeMin}</span>
                <span>{noteRangeMax}</span>
              </div>
            </div>

            {visibleDirectionOptions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Dirección para ejercicios cortos</span>
                  <Badge variant="secondary" className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-700">{SHORT_DIRECTION_OPTIONS.find((option) => option.key === directionMode)?.label ?? "Libre"}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {visibleDirectionOptions.map((option) => (
                    <SelectionChip
                      key={option.key}
                      active={directionMode === option.key}
                      onClick={() => handleDirectionChange(option.key)}
                    >
                      {option.label}
                    </SelectionChip>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">
                  Para 2 o 3 notas puedes fijar la dirección. A partir de 4 notas la dirección vuelve a ser libre y se resuelve por azar y por modelos internos.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-700">Intervalos del ejercicio</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllIntervals}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500"
                  >
                    Seleccionar todos
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllIntervals}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500"
                  >
                    Deseleccionar todos
                  </button>
                  <Badge variant="secondary" className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-700">{selectedIntervalKeys.length} activos</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERVAL_DEFINITIONS.map((interval) => (
                  <SelectionChip
                    key={interval.key}
                    active={selectedIntervalKeys.includes(interval.key)}
                    onClick={() => toggleInterval(interval.key)}
                  >
                    {interval.short}
                  </SelectionChip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                <SelectionChip active={useTwelveToneSeries} onClick={toggleTwelveToneSeries}>
                  Serie dodecafónica
                </SelectionChip>
                <span className="text-xs text-zinc-500">
                  Sin repetir clases de altura; disponible de 4 a 12 notas.
                </span>
              </div>
              {!hasSelectedIntervals ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Selecciona al menos un intervalo para generar y escuchar una sucesión.
                </p>
              ) : useTwelveToneSeries && twelveToneUsableIntervals.length === 0 ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  En serie dodecafónica, la 8J no puede funcionar sola porque repite la misma clase de altura. Agrega otros intervalos.
                </p>
              ) : useTwelveToneSeries ? (
                <p className="text-xs text-zinc-500">
                  La serie usa solo los intervalos seleccionados y no repite clases de altura. La 8J se ignora en este modo porque conserva la misma nota.
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  El generador no usa solo intervalos aislados: también favorece plantillas como 4J+4J, 5J+5J, 4J+2M, 3M+3M, TT+4J, 6M+3M, 7m+2m y otras combinaciones base.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-700">Claves permitidas</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllClefs}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500"
                  >
                    Seleccionar todas
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllClefs}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500"
                  >
                    Deseleccionar todas
                  </button>
                  <Badge variant="secondary" className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-700">{selectedClefKeys.length} activas</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {CLEFS.map((clef) => (
                  <SelectionChip
                    key={clef.key}
                    active={selectedClefKeys.includes(clef.key)}
                    onClick={() => toggleClef(clef.key)}
                  >
                    {clef.label}
                  </SelectionChip>
                ))}
              </div>
              {!hasSelectedClefs ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Selecciona al menos una clave para generar y escuchar una sucesión.
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  Si activas varias claves, cada nueva sucesión puede salir en cualquiera de ellas.
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Tempo</span>
                  <Badge variant="secondary" className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-700">{tempoSummary}</Badge>
                </div>
                <input
                  type="range"
                  min={MIN_TEMPO}
                  max={MAX_TEMPO}
                  step={1}
                  value={tempo}
                  onChange={(event) => setTempo(Number(event.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>30 BPM</span>
                  <span>200 BPM</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Volumen</span>
                  <Badge variant="secondary" className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-700">{volumeSummary}</Badge>
                </div>
                <input
                  type="range"
                  min={MIN_VOLUME}
                  max={MAX_VOLUME}
                  step={1}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Instrumento</span>
                  <Badge variant="secondary" className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-700">{instrumentSummary}</Badge>
                </div>
                <select
                  value={instrument}
                  onChange={(event) => setInstrument(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-400"
                >
                  {INSTRUMENTS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Clave actual</span>
                  <Badge variant="secondary" className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-700">{activeClefLabel}</Badge>
                </div>
                <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-700">
                  Esta sucesión está escrita en <span className="font-semibold">{activeClefLabel}</span>.
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Nota inicial</span>
                  <Badge variant="secondary" className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-700">{startNoteSummary}</Badge>
                </div>
                <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-700">
                  La sucesión actual comienza en <span className="font-semibold">{startNoteSummary}</span>.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionButton onClick={handleGenerateButton} disabled={!canGenerate} active={generatePulse}>
                <RefreshIcon className="mr-2 h-4 w-4" /> Generar nueva sucesión
              </ActionButton>
              <ActionButton onClick={handlePlayButton} disabled={!canGenerate} active={isPlaying}>
                {isPlaying ? <StopIcon className="mr-2 h-4 w-4" /> : <VolumeIcon className="mr-2 h-4 w-4" />}
                {isPlaying ? "Parar" : "Escuchar"}
              </ActionButton>
              <ActionButton onClick={() => setRevealed((prev) => !prev)} active={revealed}>
                {revealed ? <EyeOffIcon className="mr-2 h-4 w-4" /> : <EyeIcon className="mr-2 h-4 w-4" />}
                {revealed ? "Ocultar respuesta" : "Mostrar respuesta"}
              </ActionButton>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Respuesta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercise?.generationError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                {exercise.generationError}
              </div>
            ) : null}
            {!revealed && (
              <div className="rounded-2xl border bg-white p-6 text-zinc-600">
                Presiona “Mostrar respuesta” para ver la melodía escrita en partitura.
              </div>
            )}

            {revealed && exercise?.sequence?.length > 0 && (
              <>
                <ScoreRenderer notes={exercise.sequence} clefKey={exercise.clefKey} allowedIntervalKeys={exercise.intervalKeys} />
                {exercise.modelLabels?.length > 0 && (
                  <div className="rounded-2xl border bg-white p-5">
                    <p className="text-sm text-zinc-500">Modelos reconocibles en la sucesión</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {exercise.modelLabels.slice(0, 8).map((label) => (
                        <Badge key={label} variant="secondary" className="rounded-xl px-3 py-1">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-2xl border bg-white p-5">
                  <p className="text-sm text-zinc-500">Saltos entre notas consecutivas</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {exercise.intervals.map((item, index) => (
                      <Badge key={`${item}-${index}`} variant="secondary" className="rounded-xl px-3 py-1">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
