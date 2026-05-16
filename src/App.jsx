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

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_OFFSETS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACCIDENTAL_ASCII = { [-1]: "b", 0: "", 1: "#" };
const ACCIDENTAL_DISPLAY = { [-1]: "♭", 0: "", 1: "♯" };

const MIN_INTERVALS = 2;
const MAX_INTERVALS = 24;
const TWELVE_TONE_MIN_INTERVALS = 4;
const TWELVE_TONE_MAX_INTERVALS = 12;
const MIN_TEMPO = 30;
const MAX_TEMPO = 200;
const DEFAULT_INTERVAL_COUNT = 4;
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
const SETTINGS_KEY = "harmonicIntervalTrainer.settings.v1";
const STATS_KEY = "harmonicIntervalTrainer.stats.v1";
const SOUNDFONT_LIBRARY = "MusyngKite";
const SOUNDFONT_BASE_URL = "https://gleitz.github.io/midi-js-soundfonts";

const SHORT_DIRECTION_OPTIONS = [
  { key: "random", label: "Libre" },
  { key: "ascending", label: "Ascendente" },
  { key: "descending", label: "Descendente" },
  { key: "mixed", label: "Mixto" },
];

const CLEFS = [
  { key: "treble", label: "Clave de Sol", vex: "treble", minMidi: 60, maxMidi: 88, centerMinMidi: 65, centerMaxMidi: 77 },
  { key: "treble8va", label: "Clave de Sol 8va alta", vex: "treble", displayOctaveShift: -1, minMidi: 72, maxMidi: 100, centerMinMidi: 77, centerMaxMidi: 89 },
  { key: "treble15ma", label: "Clave de Sol 15ma alta", vex: "treble", displayOctaveShift: -2, minMidi: 84, maxMidi: 108, centerMinMidi: 84, centerMaxMidi: 98 },
  { key: "soprano", label: "Clave de Do en I", vex: "soprano", minMidi: 57, maxMidi: 81, centerMinMidi: 62, centerMaxMidi: 72 },
  { key: "mezzo", label: "Clave de Do en II", vex: "mezzo-soprano", minMidi: 55, maxMidi: 79, centerMinMidi: 60, centerMaxMidi: 70 },
  { key: "alto", label: "Clave de Do en III", vex: "alto", minMidi: 53, maxMidi: 77, centerMinMidi: 58, centerMaxMidi: 68 },
  { key: "tenor", label: "Clave de Do en IV", vex: "tenor", minMidi: 48, maxMidi: 72, centerMinMidi: 53, centerMaxMidi: 64 },
  { key: "bass", label: "Clave de Fa", vex: "bass", minMidi: 40, maxMidi: 67, centerMinMidi: 45, centerMaxMidi: 57 },
  { key: "bass8vb", label: "Clave de Fa 8va baja", vex: "bass", displayOctaveShift: 1, minMidi: 28, maxMidi: 55, centerMinMidi: 33, centerMaxMidi: 45 },
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
  { id: "p4p5", label: "4J → 5J", steps: ["P4", "P5"] },
  { id: "p5p4", label: "5J → 4J", steps: ["P5", "P4"] },
  { id: "thirds", label: "Campo de terceras", steps: ["m3", "M3"] },
  { id: "sixths", label: "Campo de sextas", steps: ["m6", "M6"] },
  { id: "seconds", label: "Campo de segundas", steps: ["m2", "M2"] },
  { id: "sevenths", label: "Campo de séptimas", steps: ["m7", "M7"] },
  { id: "tritone", label: "Tritono integrado", steps: ["TT"] },
  { id: "open", label: "Sonoridades abiertas", steps: ["P4", "P5", "P8"] },
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

const PIANO_KEYS = [
  { pc: 0, display: "Do", type: "white" },
  { pc: 1, display: "Do♯/Re♭", type: "black", left: "9%" },
  { pc: 2, display: "Re", type: "white" },
  { pc: 3, display: "Re♯/Mi♭", type: "black", left: "23.2%" },
  { pc: 4, display: "Mi", type: "white" },
  { pc: 5, display: "Fa", type: "white" },
  { pc: 6, display: "Fa♯/Sol♭", type: "black", left: "51.7%" },
  { pc: 7, display: "Sol", type: "white" },
  { pc: 8, display: "Sol♯/La♭", type: "black", left: "65.9%" },
  { pc: 9, display: "La", type: "white" },
  { pc: 10, display: "La♯/Si♭", type: "black", left: "80.2%" },
  { pc: 11, display: "Si", type: "white" },
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function pitchClassOf(noteOrMidi) {
  const midi = typeof noteOrMidi === "number" ? noteOrMidi : noteOrMidi.midi;
  return ((midi % 12) + 12) % 12;
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

function getDisplayVexKey(note, clef) {
  const shift = clef.displayOctaveShift ?? 0;
  return `${note.letter.toLowerCase()}/${note.octave + shift}`;
}

function noteNameForSoundFont(midi) {
  const names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pc]}${octave}`;
}

function buildAvailableNotes() {
  const notes = [];
  for (let octave = 1; octave <= 8; octave += 1) {
    for (const letter of LETTERS) {
      for (const accidental of [-1, 0, 1]) {
        if (isAwkwardSpelling(letter, accidental)) continue;
        const note = makeNote(letter, octave, accidental);
        if (note.midi >= 28 && note.midi <= 108) notes.push(note);
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
  return { all, central: central.length ? central : all };
}

function getIntervalDefinition(intervalKey) {
  return INTERVAL_DEFINITIONS.find((interval) => interval.key === intervalKey);
}

function sanitizeIntervalSelection(intervalKeys) {
  const unique = [...new Set(intervalKeys || [])].filter((key) => INTERVAL_DEFINITIONS.some((interval) => interval.key === key));
  if (unique.length === 0) return [];
  return INTERVAL_DEFINITIONS.map((item) => item.key).filter((key) => unique.includes(key));
}

function sanitizeClefSelection(clefKeys) {
  const unique = [...new Set(clefKeys || [])].filter((key) => CLEFS.some((clef) => clef.key === key));
  return unique.length ? unique : DEFAULT_CLEF_KEYS;
}

function sanitizeDirectionMode(directionMode, itemCount) {
  if (itemCount >= 4) return "random";
  if (itemCount === 2 && directionMode === "mixed") return "random";
  const valid = SHORT_DIRECTION_OPTIONS.map((option) => option.key);
  return valid.includes(directionMode) ? directionMode : DEFAULT_DIRECTION_MODE;
}

function getDirectionPlan(itemCount, directionMode) {
  const safeMode = sanitizeDirectionMode(directionMode, itemCount);
  if (itemCount >= 4 || safeMode === "random") return null;
  if (itemCount === 2) {
    if (safeMode === "ascending") return [1];
    if (safeMode === "descending") return [-1];
    return null;
  }
  if (itemCount === 3) {
    if (safeMode === "ascending") return [1, 1];
    if (safeMode === "descending") return [-1, -1];
    if (safeMode === "mixed") return randomItem([[1, -1], [-1, 1]]);
  }
  return null;
}

function transposeNote(note, interval, direction, clef) {
  const steps = interval.key === "TT" && Math.random() > 0.5 ? interval.altDiatonicSteps ?? interval.diatonicSteps : interval.diatonicSteps;
  const currentLetterIndex = LETTERS.indexOf(note.letter);
  const currentDiatonicPosition = note.octave * 7 + currentLetterIndex;
  const targetDiatonicPosition = currentDiatonicPosition + direction * steps;
  const targetLetterIndex = ((targetDiatonicPosition % 7) + 7) % 7;
  const targetOctave = Math.floor(targetDiatonicPosition / 7);
  const targetLetter = LETTERS[targetLetterIndex];
  const desiredMidi = note.midi + direction * interval.semitones;
  const naturalMidi = 12 * (targetOctave + 1) + NATURAL_OFFSETS[targetLetter];
  const accidental = desiredMidi - naturalMidi;
  if (Math.abs(accidental) > 1) return null;
  if (isAwkwardSpelling(targetLetter, accidental)) return null;
  const result = makeNote(targetLetter, targetOctave, accidental);
  if (result.midi < clef.minMidi || result.midi > clef.maxMidi) return null;
  return result;
}

function harmonicCandidatesForInterval(intervalKey, clefKey, upperUsedPitchClasses = null) {
  const interval = getIntervalDefinition(intervalKey);
  const clef = getClefConfig(clefKey);
  const { all, central } = getNotesForClef(clefKey);
  const pool = central.length ? central : all;
  if (!interval) return [];
  return pool
    .map((lower) => {
      const upper = transposeNote(lower, interval, 1, clef);
      if (!upper) return null;
      if (upperUsedPitchClasses && upperUsedPitchClasses.has(pitchClassOf(upper))) return null;
      return { lower, upper, intervalKey };
    })
    .filter(Boolean);
}

function buildHarmonicExercise(itemCount, selectedIntervalKeys, selectedClefKeys, directionMode = DEFAULT_DIRECTION_MODE) {
  const safeCount = clamp(itemCount, MIN_INTERVALS, MAX_INTERVALS);
  const intervals = sanitizeIntervalSelection(selectedIntervalKeys).length ? sanitizeIntervalSelection(selectedIntervalKeys) : DEFAULT_INTERVAL_KEYS;
  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const directionPlan = getDirectionPlan(safeCount, directionMode);
  const pairs = [];

  for (let i = 0; i < safeCount; i += 1) {
    const previousUpper = pairs[i - 1]?.upper ?? null;
    const forcedDirection = directionPlan && i > 0 ? directionPlan[i - 1] ?? null : null;
    const intervalOrder = [...intervals].sort(() => Math.random() - 0.5);
    let candidates = [];

    for (const key of intervalOrder) {
      candidates.push(...harmonicCandidatesForInterval(key, clefKey));
    }

    if (previousUpper && typeof forcedDirection === "number") {
      const filteredByMotion = candidates.filter((pair) => (pair.upper.midi - previousUpper.midi) * forcedDirection > 0);
      if (filteredByMotion.length) candidates = filteredByMotion;
    }

    if (previousUpper && candidates.length > 1) {
      const noImmediateRepeat = candidates.filter((pair) => pitchClassOf(pair.upper) !== pitchClassOf(previousUpper));
      if (noImmediateRepeat.length) candidates = noImmediateRepeat;
    }

    pairs.push(randomItem(candidates));
  }

  return {
    id: `${Date.now()}-${Math.random()}`,
    pairs,
    clefKey,
    mode: "harmonic",
    intervalKeys: intervals,
    directionMode: sanitizeDirectionMode(directionMode, safeCount),
  };
}

function buildTwelveToneHarmonicExercise(itemCount, selectedIntervalKeys, selectedClefKeys) {
  const safeCount = clamp(itemCount, TWELVE_TONE_MIN_INTERVALS, TWELVE_TONE_MAX_INTERVALS);
  const intervals = sanitizeIntervalSelection(selectedIntervalKeys).filter((key) => key !== "P8");
  const usableIntervals = intervals.length ? intervals : ["m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7"];
  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const pairs = [];
  const usedUpperPitchClasses = new Set();

  for (let i = 0; i < safeCount; i += 1) {
    let candidates = [];
    for (const key of [...usableIntervals].sort(() => Math.random() - 0.5)) {
      candidates.push(...harmonicCandidatesForInterval(key, clefKey, usedUpperPitchClasses));
    }

    if (!candidates.length) break;
    const chosen = randomItem(candidates);
    pairs.push(chosen);
    usedUpperPitchClasses.add(pitchClassOf(chosen.upper));
  }

  if (pairs.length >= TWELVE_TONE_MIN_INTERVALS) {
    return {
      id: `${Date.now()}-${Math.random()}`,
      pairs: pairs.slice(0, safeCount),
      clefKey,
      mode: "twelveToneHarmonic",
      intervalKeys: usableIntervals,
    };
  }

  return buildHarmonicExercise(safeCount, usableIntervals, [clefKey]);
}

function getIntervalLabels(pairs = []) {
  return pairs.map((pair) => getIntervalDefinition(pair.intervalKey)?.short ?? pair.intervalKey);
}

function detectModelLabels(pairs = []) {
  const keys = pairs.map((pair) => pair.intervalKey);
  const labels = [];
  MODEL_PATTERNS.forEach((pattern) => {
    if (pattern.steps.length === 1) {
      if (keys.includes(pattern.steps[0])) labels.push(pattern.label);
      return;
    }
    for (let start = 0; start <= keys.length - pattern.steps.length; start += 1) {
      const slice = keys.slice(start, start + pattern.steps.length);
      if (slice.every((key, index) => key === pattern.steps[index])) {
        labels.push(pattern.label);
        break;
      }
    }
  });
  return [...new Set(labels)].slice(0, 10);
}

function initialSettings() {
  const defaults = {
    itemCount: DEFAULT_INTERVAL_COUNT,
    tempo: DEFAULT_TEMPO,
    volume: DEFAULT_VOLUME,
    instrument: DEFAULT_INSTRUMENT,
    selectedIntervalKeys: DEFAULT_INTERVAL_KEYS,
    selectedClefKeys: DEFAULT_CLEF_KEYS,
    directionMode: DEFAULT_DIRECTION_MODE,
    useTwelveToneSeries: false,
  };
  try {
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "null");
    if (!stored) return defaults;
    return {
      ...defaults,
      ...stored,
      itemCount: clamp(Number(stored.itemCount ?? defaults.itemCount), MIN_INTERVALS, MAX_INTERVALS),
      tempo: clamp(Number(stored.tempo ?? defaults.tempo), MIN_TEMPO, MAX_TEMPO),
      volume: clamp(Number(stored.volume ?? defaults.volume), MIN_VOLUME, MAX_VOLUME),
      selectedIntervalKeys: sanitizeIntervalSelection(stored.selectedIntervalKeys ?? defaults.selectedIntervalKeys).length ? sanitizeIntervalSelection(stored.selectedIntervalKeys ?? defaults.selectedIntervalKeys) : defaults.selectedIntervalKeys,
      selectedClefKeys: sanitizeClefSelection(stored.selectedClefKeys ?? defaults.selectedClefKeys),
      directionMode: sanitizeDirectionMode(stored.directionMode ?? defaults.directionMode, Number(stored.itemCount ?? defaults.itemCount)),
      instrument: INSTRUMENTS.some((item) => item.value === stored.instrument) ? stored.instrument : DEFAULT_INSTRUMENT,
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
  return <span className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{children}</span>;
}

function SelectionChip({ active, onClick, children, disabled = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`rounded-full border px-3 py-2 text-sm transition ${
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
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
        active
          ? "border-zinc-950 bg-zinc-950 text-white shadow-sm"
          : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500 hover:bg-zinc-50"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function ScoreRenderer({ exercise, attempts }) {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const [renderError, setRenderError] = useState("");

  useLayoutEffect(() => {
    if (!containerRef.current || !exercise?.pairs?.length) return;
    containerRef.current.innerHTML = "";
    setRenderError("");

    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = VF;
      const clef = getClefConfig(exercise.clefKey);
      const viewportWidth = scrollRef.current?.clientWidth ?? 520;
      const noteSpacing = viewportWidth < 520 ? 74 : 92;
      const width = Math.max(viewportWidth, 140 + exercise.pairs.length * noteSpacing);
      const height = viewportWidth < 520 ? 170 : 190;
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();
      const stave = new Stave(18, 28, width - 36);
      stave.addClef(clef.vex);
      stave.setContext(context).draw();

      const attemptByIndex = new Map(attempts.map((attempt) => [attempt.index, attempt]));
      const accidentalState = new Map();
      const vexNotes = exercise.pairs.map((pair, index) => {
        const attempt = attemptByIndex.get(index);
        const visibleUpper = Boolean(attempt);
        const keys = visibleUpper
          ? [getDisplayVexKey(pair.lower, clef), getDisplayVexKey(pair.upper, clef)]
          : [getDisplayVexKey(pair.lower, clef)];
        const note = new StaveNote({ clef: clef.vex, keys, duration: "w", auto_stem: true });

        const notesForAccidentals = visibleUpper ? [pair.lower, pair.upper] : [pair.lower];
        notesForAccidentals.forEach((sourceNote, keyIndex) => {
          const displayOctave = sourceNote.octave + (clef.displayOctaveShift ?? 0);
          const stateKey = `${sourceNote.letter}${displayOctave}`;
          const previousAccidental = accidentalState.get(stateKey) ?? 0;
          if (sourceNote.accidental !== 0) {
            note.addModifier(new Accidental(ACCIDENTAL_ASCII[sourceNote.accidental]), keyIndex);
          } else if (previousAccidental !== 0) {
            note.addModifier(new Accidental("n"), keyIndex);
          }
          accidentalState.set(stateKey, sourceNote.accidental);
        });
        return note;
      });

      const voice = new Voice({ num_beats: vexNotes.length * 4, beat_value: 4 });
      if (typeof voice.setMode === "function" && Voice.Mode) voice.setMode(Voice.Mode.SOFT);
      if (typeof voice.setStrict === "function") voice.setStrict(false);
      voice.addTickables(vexNotes);
      new Formatter().joinVoices([voice]).format([voice], width - 125);
      voice.draw(context, stave);

      const svg = containerRef.current.querySelector("svg");
      const ns = "http://www.w3.org/2000/svg";
      if (svg) {
        if (clef.displayOctaveShift) {
          const tag = document.createElementNS(ns, "text");
          tag.setAttribute("x", "54");
          tag.setAttribute("y", "34");
          tag.setAttribute("font-size", "13");
          tag.setAttribute("font-weight", "700");
          tag.setAttribute("fill", "#52525b");
          tag.textContent = clef.displayOctaveShift < 0 ? (clef.displayOctaveShift === -1 ? "8va" : "15ma") : "8vb";
          svg.appendChild(tag);
        }

        attempts.forEach((attempt) => {
          const vexNote = vexNotes[attempt.index];
          if (!vexNote) return;
          const absoluteX = typeof vexNote.getAbsoluteX === "function" ? vexNote.getAbsoluteX() : 88 + attempt.index * 68;
          const beginX = typeof vexNote.getNoteHeadBeginX === "function" ? vexNote.getNoteHeadBeginX() : null;
          const endX = typeof vexNote.getNoteHeadEndX === "function" ? vexNote.getNoteHeadEndX() : null;
          const noteX = typeof beginX === "number" && typeof endX === "number" ? (beginX + endX) / 2 : absoluteX;
          const ys = typeof vexNote.getYs === "function" ? vexNote.getYs() : [82];
          const topY = Array.isArray(ys) && ys.length ? Math.min(...ys) : 82;
          const color = attempt.status === "correct" ? "#16a34a" : "#dc2626";

          const mark = document.createElementNS(ns, "text");
          mark.setAttribute("x", String(noteX));
          mark.setAttribute("y", String(topY - 26));
          mark.setAttribute("text-anchor", "middle");
          mark.setAttribute("dominant-baseline", "middle");
          mark.setAttribute("font-size", "19");
          mark.setAttribute("font-weight", "800");
          mark.setAttribute("fill", color);
          mark.textContent = attempt.status === "correct" ? "✓" : "×";
          svg.appendChild(mark);

          const underline = document.createElementNS(ns, "line");
          underline.setAttribute("x1", String(noteX - 15));
          underline.setAttribute("x2", String(noteX + 15));
          underline.setAttribute("y1", String(topY + 22));
          underline.setAttribute("y2", String(topY + 22));
          underline.setAttribute("stroke", color);
          underline.setAttribute("stroke-width", "3");
          underline.setAttribute("stroke-linecap", "round");
          svg.appendChild(underline);
        });
      }

      if (scrollRef.current && attempts.length > 0) {
        const lastAttempt = attempts[attempts.length - 1];
        const targetLeft = Math.max(0, 80 + lastAttempt.index * noteSpacing - scrollRef.current.clientWidth * 0.45);
        scrollRef.current.scrollTo({ left: targetLeft, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error al renderizar la partitura:", error);
      setRenderError("Hubo un problema al dibujar la partitura.");
    }
  }, [attempts, exercise]);

  return (
    <div className="space-y-2">
      <div
        ref={scrollRef}
        className="max-w-full touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl bg-white px-2 pt-2 pb-2"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
      >
        <div ref={containerRef} className="w-max min-w-full" />
      </div>
      <p className="px-2 text-[11px] text-zinc-400 sm:hidden">Desliza el pentagrama hacia los lados para ver toda la respuesta.</p>
      {renderError ? <p className="text-sm text-red-600">{renderError}</p> : null}
    </div>
  );
}

function PianoKeyboard({ onPress, disabled = false }) {
  const whiteKeys = PIANO_KEYS.filter((key) => key.type === "white");
  const blackKeys = PIANO_KEYS.filter((key) => key.type === "black");
  return (
    <div className="mx-auto w-full max-w-2xl pt-4">
      <div className="relative h-32 w-full select-none overflow-visible rounded-b-2xl border border-zinc-300 bg-zinc-200 p-2 shadow-sm">
        <div className="flex h-full gap-1">
          {whiteKeys.map((key) => (
            <button
              type="button"
              key={key.pc}
              disabled={disabled}
              onClick={() => onPress(key.pc)}
              className={`relative flex flex-1 items-end justify-center rounded-b-xl border border-zinc-300 bg-white pb-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
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
            className={`absolute top-2 z-10 flex h-[74px] w-[9.5%] items-start justify-center rounded-b-lg bg-zinc-950 px-1 pt-2 text-center text-[9px] font-semibold leading-tight text-white transition hover:bg-zinc-800 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            style={{ left: key.left }}
          >
            <span className="absolute -top-6 left-1/2 w-20 -translate-x-1/2 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold leading-none text-zinc-700 shadow-sm">
              {key.display}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BottomStat({ label, value }) {
  return (
    <div className="min-w-[94px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 md:min-w-0">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="truncate text-base font-bold text-zinc-900">{value}</p>
    </div>
  );
}

export default function HarmonicIntervalTrainerPage() {
  const saved = useMemo(() => (typeof window !== "undefined" ? initialSettings() : null), []);
  const savedStats = useMemo(() => (typeof window !== "undefined" ? initialStats() : null), []);
  const audioContextRef = useRef(null);
  const soundfontCacheRef = useRef(new Map());
  const activeFallbackNodesRef = useRef([]);
  const activePlayersRef = useRef([]);
  const playbackTimeoutRef = useRef(null);

  const [itemCount, setItemCount] = useState(saved?.itemCount ?? DEFAULT_INTERVAL_COUNT);
  const [tempo, setTempo] = useState(saved?.tempo ?? DEFAULT_TEMPO);
  const [volume, setVolume] = useState(saved?.volume ?? DEFAULT_VOLUME);
  const [instrument, setInstrument] = useState(saved?.instrument ?? DEFAULT_INSTRUMENT);
  const [selectedIntervalKeys, setSelectedIntervalKeys] = useState(saved?.selectedIntervalKeys ?? DEFAULT_INTERVAL_KEYS);
  const [selectedClefKeys, setSelectedClefKeys] = useState(saved?.selectedClefKeys ?? DEFAULT_CLEF_KEYS);
  const [directionMode, setDirectionMode] = useState(saved?.directionMode ?? DEFAULT_DIRECTION_MODE);
  const [useTwelveToneSeries, setUseTwelveToneSeries] = useState(saved?.useTwelveToneSeries ?? false);
  const [exercise, setExercise] = useState(() => {
    const count = saved?.useTwelveToneSeries
      ? clamp(saved.itemCount, TWELVE_TONE_MIN_INTERVALS, TWELVE_TONE_MAX_INTERVALS)
      : clamp(saved?.itemCount ?? DEFAULT_INTERVAL_COUNT, MIN_INTERVALS, MAX_INTERVALS);
    return saved?.useTwelveToneSeries
      ? buildTwelveToneHarmonicExercise(count, saved.selectedIntervalKeys, saved.selectedClefKeys)
      : buildHarmonicExercise(count, saved?.selectedIntervalKeys ?? DEFAULT_INTERVAL_KEYS, saved?.selectedClefKeys ?? DEFAULT_CLEF_KEYS, saved?.directionMode ?? DEFAULT_DIRECTION_MODE);
  });
  const [attempts, setAttempts] = useState([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buttonFlash, setButtonFlash] = useState(false);
  const [stats, setStats] = useState(savedStats ?? { totalSeconds: 0, exercises: 0, correct: 0, incorrect: 0 });

  const selectedInstrument = useMemo(() => INSTRUMENTS.find((item) => item.value === instrument) ?? INSTRUMENTS.find((item) => item.value === DEFAULT_INSTRUMENT), [instrument]);
  const hasSelectedIntervals = selectedIntervalKeys.length > 0;
  const hasSelectedClefs = selectedClefKeys.length > 0;
  const twelveToneUsableIntervals = useMemo(() => sanitizeIntervalSelection(selectedIntervalKeys).filter((key) => key !== "P8"), [selectedIntervalKeys]);
  const canGenerate = hasSelectedIntervals && hasSelectedClefs && (!useTwelveToneSeries || twelveToneUsableIntervals.length > 0);
  const safeItemCount = useTwelveToneSeries ? clamp(itemCount, TWELVE_TONE_MIN_INTERVALS, TWELVE_TONE_MAX_INTERVALS) : clamp(itemCount, MIN_INTERVALS, MAX_INTERVALS);
  const exerciseComplete = nextIndex >= exercise.pairs.length;
  const score = scoreFromStats(stats);
  const intervalLabels = useMemo(() => getIntervalLabels(exercise.pairs), [exercise]);
  const modelLabels = useMemo(() => detectModelLabels(exercise.pairs), [exercise]);
  const showAnswerDetails = exerciseComplete;
  const visibleDirectionOptions = useMemo(() => {
    if (useTwelveToneSeries) return [];
    if (itemCount === 2) return SHORT_DIRECTION_OPTIONS.filter((option) => option.key !== "mixed");
    if (itemCount === 3) return SHORT_DIRECTION_OPTIONS;
    return [];
  }, [itemCount, useTwelveToneSeries]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStats((current) => ({ ...current, totalSeconds: current.totalSeconds + 1 }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ itemCount, tempo, volume, instrument, selectedIntervalKeys, selectedClefKeys, directionMode, useTwelveToneSeries }));
  }, [itemCount, tempo, volume, instrument, selectedIntervalKeys, selectedClefKeys, directionMode, useTwelveToneSeries]);

  useEffect(() => {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    setDirectionMode((current) => sanitizeDirectionMode(current, itemCount));
  }, [itemCount]);

  useEffect(() => {
    if (useTwelveToneSeries) {
      setItemCount((current) => clamp(current, TWELVE_TONE_MIN_INTERVALS, TWELVE_TONE_MAX_INTERVALS));
    }
  }, [useTwelveToneSeries]);

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
    if (audioContextRef.current.state === "suspended") await audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

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
    const volumeNorm = clamp(volumeLevel, 0, 100) / 100;
    const masterGain = ctx.createGain();
    const oscillators = [];
    const gains = [];
    const filters = [];

    let attack = 0.04;
    let release = Math.max(0.1, duration * 0.22);
    let peak = 0.14 * volumeNorm * INTERNAL_VOLUME_BOOST;

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
      peak = 0.14 * volumeNorm * INTERNAL_VOLUME_BOOST;
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
      peak = 0.13 * volumeNorm * INTERNAL_VOLUME_BOOST;
      routeOscillator({ type: "sine", level: 0.72 });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.18 });
      routeOscillator({ type: "triangle", multiplier: 0.5, level: 0.12 });
    } else if (fallbackType === "strings") {
      attack = 0.12;
      release = Math.max(0.15, duration * 0.26);
      peak = 0.14 * volumeNorm * INTERNAL_VOLUME_BOOST;
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
      peak = 0.14 * volumeNorm * INTERNAL_VOLUME_BOOST;
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 4200;
      lowPass.connect(masterGain);
      filters.push(lowPass);
      routeOscillator({ type: "sine", level: 0.75, targetNode: lowPass });
      routeOscillator({ type: "triangle", multiplier: 2.01, level: 0.2, targetNode: lowPass });
      routeOscillator({ type: "sine", multiplier: 3.02, level: 0.08, targetNode: lowPass });
    } else {
      attack = 0.012;
      release = Math.max(0.12, duration * 0.36);
      peak = 0.16 * volumeNorm * INTERNAL_VOLUME_BOOST;
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
    if (fallbackType === "piano" || fallbackType === "mallet") {
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

  const playExercise = useCallback(async (targetExercise = exercise) => {
    if (!targetExercise?.pairs?.length || isPlaying) return;
    setIsPlaying(true);
    stopAllAudio();
    try {
      const ctx = await ensureAudioContext();
      const secondsPerBeat = 60 / clamp(tempo, MIN_TEMPO, MAX_TEMPO);
      const step = secondsPerBeat;
      const noteDuration = selectedInstrument?.sustain ? Math.max(0.24, step * 0.96) : Math.max(0.2, step * 0.88);
      const baseTime = ctx.currentTime + 0.08;
      const safeVolume = clamp(volume, 0, 100);
      let sfInstrument = null;

      try {
        sfInstrument = await getSoundfontInstrument(ctx, selectedInstrument);
      } catch (error) {
        console.warn("No se pudo cargar SoundFont. Usando síntesis de respaldo.", error);
      }

      targetExercise.pairs.forEach((pair, index) => {
        const start = baseTime + index * step;
        [pair.lower, pair.upper].forEach((note) => {
          if (sfInstrument) {
            const player = sfInstrument.play(noteNameForSoundFont(note.midi), start, {
              duration: noteDuration,
              gain: Math.min(2.5, (safeVolume / 100) * SOUNDFONT_GAIN_BOOST / 10),
            });
            activePlayersRef.current.push(player);
          } else {
            createFallbackVoice(ctx, midiToFreq(note.midi), selectedInstrument?.fallback ?? "piano", start, noteDuration, safeVolume);
          }
        });
      });

      if (playbackTimeoutRef.current) window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = window.setTimeout(() => {
        setIsPlaying(false);
        playbackTimeoutRef.current = null;
      }, targetExercise.pairs.length * step * 1000 + 450);
    } catch (error) {
      console.error("Error al reproducir el ejercicio:", error);
      setIsPlaying(false);
    }
  }, [createFallbackVoice, ensureAudioContext, exercise, getSoundfontInstrument, isPlaying, selectedInstrument, stopAllAudio, tempo, volume]);

  const createExercise = useCallback((count = safeItemCount) => {
    return useTwelveToneSeries
      ? buildTwelveToneHarmonicExercise(count, selectedIntervalKeys, selectedClefKeys)
      : buildHarmonicExercise(count, selectedIntervalKeys, selectedClefKeys, directionMode);
  }, [directionMode, safeItemCount, selectedClefKeys, selectedIntervalKeys, useTwelveToneSeries]);

  const generateExercise = useCallback(async () => {
    if (!canGenerate) return;
    stopPlayback();
    const nextExercise = createExercise();
    setExercise(nextExercise);
    setAttempts([]);
    setNextIndex(0);
    setStats((current) => ({ ...current, exercises: current.exercises + 1 }));
    setButtonFlash(true);
    window.setTimeout(() => setButtonFlash(false), 220);
    window.setTimeout(() => playExercise(nextExercise), 40);
  }, [canGenerate, createExercise, playExercise, stopPlayback]);

  const toggleInterval = useCallback((intervalKey) => {
    setSelectedIntervalKeys((current) => {
      const exists = current.includes(intervalKey);
      const next = exists ? current.filter((key) => key !== intervalKey) : [...current, intervalKey];
      return sanitizeIntervalSelection(next);
    });
  }, []);

  const toggleClef = useCallback((clefKey) => {
    setSelectedClefKeys((current) => {
      const exists = current.includes(clefKey);
      const next = exists ? current.filter((key) => key !== clefKey) : [...current, clefKey];
      return sanitizeClefSelection(next);
    });
  }, []);

  const handleItemCountChange = useCallback((nextValue) => {
    const min = useTwelveToneSeries ? TWELVE_TONE_MIN_INTERVALS : MIN_INTERVALS;
    const max = useTwelveToneSeries ? TWELVE_TONE_MAX_INTERVALS : MAX_INTERVALS;
    setItemCount(clamp(Number(nextValue), min, max));
  }, [useTwelveToneSeries]);

  const handleDirectionChange = useCallback((mode) => {
    setDirectionMode(sanitizeDirectionMode(mode, itemCount));
  }, [itemCount]);

  const handleKeyboardPress = useCallback((pc) => {
    if (exerciseComplete || !exercise?.pairs?.[nextIndex]) return;
    const expectedPair = exercise.pairs[nextIndex];
    const correct = pc === pitchClassOf(expectedPair.upper);
    setAttempts((current) => [...current, { index: nextIndex, status: correct ? "correct" : "wrong" }]);
    setNextIndex((current) => current + 1);
    setStats((current) => ({
      ...current,
      correct: current.correct + (correct ? 1 : 0),
      incorrect: current.incorrect + (correct ? 0 : 1),
    }));
  }, [exercise, exerciseComplete, nextIndex]);

  const revealFullAnswer = useCallback(() => {
    if (exerciseComplete) return;
    const existing = new Set(attempts.map((attempt) => attempt.index));
    const missing = [];
    for (let i = 0; i < exercise.pairs.length; i += 1) {
      if (!existing.has(i)) missing.push({ index: i, status: "wrong" });
    }
    if (!missing.length) return;
    setAttempts((current) => [...current, ...missing]);
    setNextIndex(exercise.pairs.length);
    setStats((current) => ({ ...current, incorrect: current.incorrect + missing.length }));
  }, [attempts, exercise.pairs.length, exerciseComplete]);

  const resetStats = useCallback(() => {
    setStats({ totalSeconds: 0, exercises: 0, correct: 0, incorrect: 0 });
  }, []);

  useEffect(() => {
    return () => {
      if (playbackTimeoutRef.current) window.clearTimeout(playbackTimeoutRef.current);
      stopAllAudio();
      try { audioContextRef.current?.close(); } catch {}
    };
  }, [stopAllAudio]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-100 px-3 py-4 pb-56 sm:p-6 sm:pb-44 md:p-10 md:pb-32">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Entrenador de intervalos armónicos · Método Aural</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Escucha dos voces simultáneas: la nota inferior aparece como referencia y debes identificar la voz superior en el teclado.
            </p>
          </div>
          <Badge>{selectedInstrument?.label ?? "Instrumento"}</Badge>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Número de intervalos armónicos</span>
                  <Badge>{safeItemCount} intervalo{safeItemCount === 1 ? "" : "s"}</Badge>
                </div>
                <input
                  type="range"
                  min={useTwelveToneSeries ? TWELVE_TONE_MIN_INTERVALS : MIN_INTERVALS}
                  max={useTwelveToneSeries ? TWELVE_TONE_MAX_INTERVALS : MAX_INTERVALS}
                  step={1}
                  value={safeItemCount}
                  onChange={(event) => handleItemCountChange(event.target.value)}
                  className="w-full accent-sky-600"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{useTwelveToneSeries ? TWELVE_TONE_MIN_INTERVALS : MIN_INTERVALS}</span>
                  <span>{useTwelveToneSeries ? TWELVE_TONE_MAX_INTERVALS : MAX_INTERVALS}</span>
                </div>
              </div>

              {visibleDirectionOptions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-zinc-700">Dirección de la voz superior</span>
                    <Badge>{SHORT_DIRECTION_OPTIONS.find((option) => option.key === directionMode)?.label ?? "Libre"}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {visibleDirectionOptions.map((option) => (
                      <SelectionChip key={option.key} active={directionMode === option.key} onClick={() => handleDirectionChange(option.key)}>
                        {option.label}
                      </SelectionChip>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Intervalos armónicos</span>
                  <Badge>{selectedIntervalKeys.length} activo{selectedIntervalKeys.length === 1 ? "" : "s"}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERVAL_DEFINITIONS.map((interval) => (
                    <SelectionChip key={interval.key} active={selectedIntervalKeys.includes(interval.key)} onClick={() => toggleInterval(interval.key)} title={interval.name}>
                      {interval.short}
                    </SelectionChip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <ActionButton active={false} onClick={() => setSelectedIntervalKeys(INTERVAL_DEFINITIONS.map((item) => item.key))}>Seleccionar todos</ActionButton>
                  <ActionButton active={false} onClick={() => setSelectedIntervalKeys([])}>Deseleccionar todos</ActionButton>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Serie dodecafónica</span>
                  <Badge>{useTwelveToneSeries ? "Activa" : "Inactiva"}</Badge>
                </div>
                <SelectionChip active={useTwelveToneSeries} onClick={() => setUseTwelveToneSeries((current) => !current)}>
                  Usar serie dodecafónica
                </SelectionChip>
                <p className="text-xs leading-relaxed text-zinc-500">
                  En este modo no se repite ninguna clase de altura en la voz superior y solo se trabaja entre 4 y 12 intervalos.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Claves</span>
                  <Badge>{selectedClefKeys.length} activa{selectedClefKeys.length === 1 ? "" : "s"}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CLEFS.map((clef) => (
                    <SelectionChip key={clef.key} active={selectedClefKeys.includes(clef.key)} onClick={() => toggleClef(clef.key)}>
                      {clef.label}
                    </SelectionChip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <ActionButton active={false} onClick={() => setSelectedClefKeys(CLEFS.map((item) => item.key))}>Seleccionar todas</ActionButton>
                  <ActionButton active={false} onClick={() => setSelectedClefKeys(DEFAULT_CLEF_KEYS)}>Deseleccionar todas</ActionButton>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-zinc-700">Tempo</span>
                    <Badge>{tempo} BPM</Badge>
                  </div>
                  <input
                    type="range"
                    min={MIN_TEMPO}
                    max={MAX_TEMPO}
                    value={tempo}
                    onChange={(event) => setTempo(Number(event.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-zinc-700">Volumen</span>
                    <Badge>{volume}%</Badge>
                  </div>
                  <input
                    type="range"
                    min={MIN_VOLUME}
                    max={MAX_VOLUME}
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium text-zinc-700">Instrumento</span>
                <select
                  value={instrument}
                  onChange={(event) => setInstrument(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
                >
                  {INSTRUMENTS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ActionButton active={buttonFlash} disabled={!canGenerate} onClick={generateExercise}>
                <RefreshIcon className="h-4 w-4" /> Generar nueva sucesión
              </ActionButton>
              <ActionButton active={isPlaying} onClick={isPlaying ? stopPlayback : () => playExercise(exercise)}>
                {isPlaying ? <StopIcon className="h-4 w-4" /> : <VolumeIcon className="h-4 w-4" />}
                {isPlaying ? "Parar" : "Escuchar"}
              </ActionButton>
              <ActionButton active={exerciseComplete} onClick={revealFullAnswer} disabled={exerciseComplete}>
                <EyeIcon className="h-4 w-4" /> Mostrar respuesta completa
              </ActionButton>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-3">
              <ScoreRenderer exercise={exercise} attempts={attempts} />
              {!exerciseComplete ? (
                <PianoKeyboard onPress={handleKeyboardPress} />
              ) : (
                <div className="flex justify-center pt-4">
                  <ActionButton active={false} disabled={!canGenerate} onClick={generateExercise}>
                    <RefreshIcon className="h-4 w-4" /> Siguiente ejercicio
                  </ActionButton>
                </div>
              )}
            </div>

            {showAnswerDetails && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Intervalos escuchados</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {intervalLabels.map((label, index) => (
                      <span key={`${label}-${index}`} className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">{label}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Modelos reconocibles</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {modelLabels.length ? modelLabels.map((label) => (
                      <span key={label} className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">{label}</span>
                    )) : <span className="text-sm text-zinc-500">Sin modelo reconocible en esta sucesión.</span>}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-3 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.05)] backdrop-blur sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto overscroll-x-contain md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
          <BottomStat label="Tiempo" value={formatTime(stats.totalSeconds)} />
          <BottomStat label="Ejercicios" value={stats.exercises} />
          <BottomStat label="Aciertos" value={stats.correct} />
          <BottomStat label="Errores" value={stats.incorrect} />
          <BottomStat label="Puntuación" value={`${score}/100`} />
          <button type="button" onClick={resetStats} className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-500 hover:bg-zinc-50 md:min-w-0">
            <ResetIcon className="h-4 w-4" /> Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}
