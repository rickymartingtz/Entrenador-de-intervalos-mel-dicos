import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Soundfont from "soundfont-player";

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
const SETTINGS_KEY = "intervalTrainer.settings.v6";
const STATS_KEY = "intervalTrainer.stats.v6";
const SOUNDFONT_LIBRARY = "MusyngKite";
const SOUNDFONT_BASE_URL = "https://gleitz.github.io/midi-js-soundfonts";

const CLEFS = [
  { key: "treble", label: "Clave de sol", symbol: "𝄞", tag: "", vex: "treble", minMidi: 60, maxMidi: 88, centerMinMidi: 65, centerMaxMidi: 79, staffRefLetter: "E", staffRefOctave: 4, staffRefY: 100 },
  { key: "treble8va", label: "Clave de sol 8va alta", symbol: "𝄞", tag: "8va", vex: "treble", displayOctaveShift: -1, minMidi: 72, maxMidi: 100, centerMinMidi: 77, centerMaxMidi: 91, staffRefLetter: "E", staffRefOctave: 4, staffRefY: 100 },
  { key: "treble15ma", label: "Clave de sol 15ma alta", symbol: "𝄞", tag: "15ma", vex: "treble", displayOctaveShift: -2, minMidi: 84, maxMidi: 108, centerMinMidi: 84, centerMaxMidi: 100, staffRefLetter: "E", staffRefOctave: 4, staffRefY: 100 },
  { key: "soprano", label: "Clave de do en 1ra", symbol: "𝄡", tag: "I", vex: "soprano", minMidi: 57, maxMidi: 81, centerMinMidi: 62, centerMaxMidi: 74, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 100 },
  { key: "mezzo", label: "Clave de do en 2da", symbol: "𝄡", tag: "II", vex: "mezzo-soprano", minMidi: 55, maxMidi: 79, centerMinMidi: 60, centerMaxMidi: 72, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 86 },
  { key: "alto", label: "Clave de do en 3ra", symbol: "𝄡", tag: "III", vex: "alto", minMidi: 53, maxMidi: 77, centerMinMidi: 58, centerMaxMidi: 70, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 72 },
  { key: "tenor", label: "Clave de do en 4ta", symbol: "𝄡", tag: "IV", vex: "tenor", minMidi: 48, maxMidi: 72, centerMinMidi: 53, centerMaxMidi: 65, staffRefLetter: "C", staffRefOctave: 4, staffRefY: 58 },
  { key: "bass", label: "Clave de fa", symbol: "𝄢", tag: "", vex: "bass", minMidi: 40, maxMidi: 67, centerMinMidi: 45, centerMaxMidi: 58, staffRefLetter: "G", staffRefOctave: 2, staffRefY: 100 },
  { key: "bass8vb", label: "Clave de fa 8va baja", symbol: "𝄢", tag: "8vb", vex: "bass", displayOctaveShift: 1, minMidi: 28, maxMidi: 55, centerMinMidi: 33, centerMaxMidi: 46, staffRefLetter: "G", staffRefOctave: 2, staffRefY: 100 },
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
  { pc: 0, name: "C", display: "Do", type: "white" },
  { pc: 1, name: "C#", display: "Do♯", type: "black", left: "9%" },
  { pc: 2, name: "D", display: "Re", type: "white" },
  { pc: 3, name: "Eb", display: "Mi♭", type: "black", left: "23.2%" },
  { pc: 4, name: "E", display: "Mi", type: "white" },
  { pc: 5, name: "F", display: "Fa", type: "white" },
  { pc: 6, name: "F#", display: "Fa♯", type: "black", left: "51.7%" },
  { pc: 7, name: "G", display: "Sol", type: "white" },
  { pc: 8, name: "Ab", display: "La♭", type: "black", left: "65.9%" },
  { pc: 9, name: "A", display: "La", type: "white" },
  { pc: 10, name: "Bb", display: "Si♭", type: "black", left: "80.2%" },
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

function getTwelveToneIntervalKeys(keys) {
  return sanitizeIntervalSelection(keys).filter((key) => key !== "P8");
}

function getNotesForClef(clefKey) {
  const clef = getClefConfig(clefKey);
  const all = AVAILABLE_NOTES.filter((note) => note.midi >= clef.minMidi && note.midi <= clef.maxMidi);
  const central = all.filter((note) => note.midi >= clef.centerMinMidi && note.midi <= clef.centerMaxMidi);
  return { all, central: central.length ? central : all };
}

function getCandidates(currentNote, selectedIntervalKeys, clefKey, usedPitchClasses = null) {
  const clef = getClefConfig(clefKey);
  const candidates = [];
  const intervalKeys = sanitizeIntervalSelection(selectedIntervalKeys);

  intervalKeys.forEach((intervalKey) => {
    const interval = getIntervalDefinition(intervalKey);
    if (!interval) return;
    [1, -1].forEach((direction) => {
      const candidate = transposeNote(currentNote, interval, direction, clef);
      if (!candidate) return;
      if (usedPitchClasses && usedPitchClasses.has(pitchClassOf(candidate))) return;
      candidates.push({ note: candidate, intervalKey, direction });
    });
  });

  return candidates;
}

function buildMelody(noteCount, selectedIntervalKeys, selectedClefKeys) {
  const safeCount = clamp(noteCount, MIN_NOTES, MAX_NOTES);
  const intervals = sanitizeIntervalSelection(selectedIntervalKeys);
  const clefKey = randomItem(sanitizeClefSelection(selectedClefKeys));
  const { all, central } = getNotesForClef(clefKey);
  let current = randomItem(central);
  const sequence = [current];

  for (let i = 1; i < safeCount; i += 1) {
    const candidates = getCandidates(current, intervals, clefKey);
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

function initialSettings() {
  const defaults = {
    noteCount: DEFAULT_NOTE_COUNT,
    tempo: DEFAULT_TEMPO,
    volume: DEFAULT_VOLUME,
    instrument: DEFAULT_INSTRUMENT,
    selectedIntervalKeys: DEFAULT_INTERVAL_KEYS,
    selectedClefKeys: DEFAULT_CLEF_KEYS,
    useTwelveToneSeries: false,
  };
  try {
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "null");
    if (!stored) return defaults;
    return {
      ...defaults,
      ...stored,
      selectedIntervalKeys: sanitizeIntervalSelection(stored.selectedIntervalKeys ?? defaults.selectedIntervalKeys),
      selectedClefKeys: sanitizeClefSelection(stored.selectedClefKeys ?? defaults.selectedClefKeys),
      noteCount: clamp(Number(stored.noteCount ?? defaults.noteCount), MIN_NOTES, MAX_NOTES),
      tempo: clamp(Number(stored.tempo ?? defaults.tempo), MIN_TEMPO, MAX_TEMPO),
      volume: clamp(Number(stored.volume ?? defaults.volume), MIN_VOLUME, MAX_VOLUME),
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
  return <span className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">{children}</span>;
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
      className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
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
      className={`relative flex h-16 min-w-20 items-center justify-center rounded-2xl border px-4 transition ${
        active ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500"
      }`}
    >
      <span className="font-serif text-4xl leading-none">{clef.symbol}</span>
      {clef.tag ? <span className="absolute right-2 top-2 rounded-full text-[10px] font-bold tracking-wide">{clef.tag}</span> : null}
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

function Staff({ exercise, attemptNotes = [], revealFull = false }) {
  const clef = getClefConfig(exercise?.clefKey ?? "treble");
  const target = exercise?.sequence ?? [];
  const notes = revealFull
    ? target.map((note, index) => ({ note, status: index === 0 ? "start" : "answer" }))
    : attemptNotes;
  const width = Math.max(520, 150 + notes.length * 62);
  const staffLeft = 88;
  const staffRight = width - 25;

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-4">
      <svg width={width} height="165" viewBox={`0 0 ${width} 165`} role="img" aria-label="Pentagrama del ejercicio">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={staffLeft} x2={staffRight} y1={44 + i * 14} y2={44 + i * 14} stroke="#18181b" strokeWidth="1.2" />
        ))}
        <text x="22" y="91" className="font-serif" fontSize="58" fill="#18181b">{clef.symbol}</text>
        {clef.tag ? <text x="52" y="42" fontSize="13" fontWeight="700" fill="#52525b">{clef.tag}</text> : null}
        {notes.map((entry, index) => {
          const x = staffLeft + 40 + index * 62;
          const y = noteY(entry.note, clef);
          const ledger = ledgerLinesForY(x, y);
          const isWrong = entry.status === "wrong";
          const isCorrect = entry.status === "correct";
          const isStart = entry.status === "start";
          const color = isWrong ? "#dc2626" : isCorrect ? "#16a34a" : "#18181b";
          return (
            <g key={`${entry.note.id}-${index}-${entry.status}`}>
              {ledger.map((line, lineIndex) => (
                <line key={lineIndex} x1={line.x - 14} x2={line.x + 14} y1={line.y} y2={line.y} stroke="#18181b" strokeWidth="1.1" />
              ))}
              {entry.note.accidental !== 0 ? (
                <text x={x - 27} y={y + 5} fontSize="18" fill={color}>{ACCIDENTAL_DISPLAY[entry.note.accidental]}</text>
              ) : null}
              <ellipse cx={x} cy={y} rx="10.5" ry="7" fill={color} transform={`rotate(-18 ${x} ${y})`} />
              {isCorrect || isWrong ? (
                <>
                  <text x={x - 8} y={y - 22} fontSize="20" fontWeight="800" fill={color}>{isCorrect ? "✓" : "×"}</text>
                  <line x1={x - 15} x2={x + 15} y1={y + 17} y2={y + 17} stroke={color} strokeWidth="3" strokeLinecap="round" />
                </>
              ) : null}
              {isStart ? <text x={x - 16} y="145" fontSize="11" fill="#71717a">inicio</text> : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PianoKeyboard({ onPress, disabled = false, expectedPc = null }) {
  const whiteKeys = PIANO_KEYS.filter((key) => key.type === "white");
  const blackKeys = PIANO_KEYS.filter((key) => key.type === "black");
  return (
    <div className="relative mx-auto h-36 w-full max-w-2xl select-none rounded-b-2xl border border-zinc-300 bg-zinc-200 p-2 shadow-sm">
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
            {expectedPc === key.pc ? <span className="absolute bottom-8 h-1 w-8 rounded-full bg-zinc-900 opacity-20" /> : null}
          </button>
        ))}
      </div>
      {blackKeys.map((key) => (
        <button
          type="button"
          key={key.pc}
          disabled={disabled}
          onClick={() => onPress(key.pc)}
          className={`absolute top-2 z-10 flex h-20 w-[9.5%] items-end justify-center rounded-b-lg bg-zinc-950 pb-2 text-[10px] font-semibold text-white transition hover:bg-zinc-800 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          style={{ left: key.left }}
        >
          {key.display}
          {expectedPc === key.pc ? <span className="absolute bottom-7 h-1 w-6 rounded-full bg-white opacity-30" /> : null}
        </button>
      ))}
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

export default function IntervalTrainerPage() {
  const saved = useMemo(() => (typeof window !== "undefined" ? initialSettings() : null), []);
  const savedStats = useMemo(() => (typeof window !== "undefined" ? initialStats() : null), []);
  const audioContextRef = useRef(null);
  const soundfontCacheRef = useRef(new Map());
  const activeFallbackNodesRef = useRef([]);
  const activePlayersRef = useRef([]);
  const playbackTimeoutRef = useRef(null);

  const [noteCount, setNoteCount] = useState(saved?.noteCount ?? DEFAULT_NOTE_COUNT);
  const [tempo, setTempo] = useState(saved?.tempo ?? DEFAULT_TEMPO);
  const [volume, setVolume] = useState(saved?.volume ?? DEFAULT_VOLUME);
  const [instrument, setInstrument] = useState(saved?.instrument ?? DEFAULT_INSTRUMENT);
  const [selectedIntervalKeys, setSelectedIntervalKeys] = useState(saved?.selectedIntervalKeys ?? DEFAULT_INTERVAL_KEYS);
  const [selectedClefKeys, setSelectedClefKeys] = useState(saved?.selectedClefKeys ?? DEFAULT_CLEF_KEYS);
  const [useTwelveToneSeries, setUseTwelveToneSeries] = useState(saved?.useTwelveToneSeries ?? false);
  const [exercise, setExercise] = useState(() => {
    const count = saved?.useTwelveToneSeries
      ? clamp(saved.noteCount, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES)
      : clamp(saved?.noteCount ?? DEFAULT_NOTE_COUNT, MIN_NOTES, MAX_NOTES);
    return saved?.useTwelveToneSeries
      ? buildTwelveToneSeries(count, saved.selectedIntervalKeys, saved.selectedClefKeys)
      : buildMelody(count, saved?.selectedIntervalKeys ?? DEFAULT_INTERVAL_KEYS, saved?.selectedClefKeys ?? DEFAULT_CLEF_KEYS);
  });
  const [attemptNotes, setAttemptNotes] = useState(() => [{ note: exercise.sequence[0], status: "start" }]);
  const [nextIndex, setNextIndex] = useState(1);
  const [revealFull, setRevealFull] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buttonFlash, setButtonFlash] = useState(false);
  const [stats, setStats] = useState(savedStats ?? { totalSeconds: 0, exercises: 0, correct: 0, incorrect: 0 });

  const selectedInstrument = useMemo(() => INSTRUMENTS.find((item) => item.value === instrument) ?? INSTRUMENTS.find((item) => item.value === DEFAULT_INSTRUMENT), [instrument]);
  const hasSelectedIntervals = selectedIntervalKeys.length > 0;
  const hasSelectedClefs = selectedClefKeys.length > 0;
  const twelveToneUsableIntervals = useMemo(() => getTwelveToneIntervalKeys(selectedIntervalKeys), [selectedIntervalKeys]);
  const canGenerate = hasSelectedIntervals && hasSelectedClefs && (!useTwelveToneSeries || twelveToneUsableIntervals.length > 0);
  const safeNoteCount = useTwelveToneSeries ? clamp(noteCount, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES) : clamp(noteCount, MIN_NOTES, MAX_NOTES);
  const expectedNote = exercise.sequence[nextIndex] ?? null;
  const exerciseComplete = nextIndex >= exercise.sequence.length;
  const score = scoreFromStats(stats);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStats((current) => ({ ...current, totalSeconds: current.totalSeconds + 1 }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        noteCount,
        tempo,
        volume,
        instrument,
        selectedIntervalKeys,
        selectedClefKeys,
        useTwelveToneSeries,
      }));
    } catch {}
  }, [instrument, noteCount, selectedClefKeys, selectedIntervalKeys, tempo, useTwelveToneSeries, volume]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  }, [stats]);

  useEffect(() => {
    if (useTwelveToneSeries) {
      setNoteCount((current) => clamp(current, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES));
    }
  }, [useTwelveToneSeries]);

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
    if (!exerciseToPlay?.sequence?.length) return;
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

      exerciseToPlay.sequence.forEach((note, index) => {
        const start = baseTime + index * step;
        if (sfInstrument) {
          const player = sfInstrument.play(noteNameForSoundFont(note.midi), start, {
            duration: noteDuration,
            gain,
          });
          activePlayersRef.current.push(player);
        } else {
          createFallbackVoice(ctx, midiToFreq(note.midi), selectedInstrument?.fallback ?? "piano", start, noteDuration, volume);
        }
      });

      if (playbackTimeoutRef.current) window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = window.setTimeout(() => {
        setIsPlaying(false);
        playbackTimeoutRef.current = null;
      }, exerciseToPlay.sequence.length * step * 1000 + 550);
    } catch (error) {
      console.error("Error al reproducir:", error);
      setIsPlaying(false);
    }
  }, [createFallbackVoice, ensureAudioContext, exercise, getSoundfontInstrument, selectedInstrument, stopAllAudio, tempo, volume]);

  const startExercise = useCallback(() => {
    if (!canGenerate) return;
    const count = useTwelveToneSeries ? clamp(noteCount, TWELVE_TONE_MIN_NOTES, TWELVE_TONE_MAX_NOTES) : clamp(noteCount, MIN_NOTES, MAX_NOTES);
    const nextExercise = useTwelveToneSeries
      ? buildTwelveToneSeries(count, selectedIntervalKeys, selectedClefKeys)
      : buildMelody(count, selectedIntervalKeys, selectedClefKeys);
    setExercise(nextExercise);
    setAttemptNotes([{ note: nextExercise.sequence[0], status: "start" }]);
    setNextIndex(1);
    setRevealFull(false);
    setStats((current) => ({ ...current, exercises: current.exercises + 1 }));
    setButtonFlash(true);
    window.setTimeout(() => setButtonFlash(false), 420);
    playExercise(nextExercise);
  }, [canGenerate, noteCount, playExercise, selectedClefKeys, selectedIntervalKeys, useTwelveToneSeries]);

  const handleKeyboardPress = useCallback((pc) => {
    if (!expectedNote || revealFull) return;
    const correct = pitchClassOf(expectedNote) === pc;
    if (correct) {
      setAttemptNotes((current) => [...current, { note: expectedNote, status: "correct" }]);
      setNextIndex((current) => current + 1);
      setStats((current) => ({ ...current, correct: current.correct + 1 }));
    } else {
      const wrongMidi = nearestMidiForPitchClass(pc, expectedNote.midi);
      setAttemptNotes((current) => [...current, { note: midiToSimpleNote(wrongMidi), status: "wrong" }]);
      setStats((current) => ({ ...current, incorrect: current.incorrect + 1 }));
    }
  }, [expectedNote, revealFull]);

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

  const resetEverything = useCallback(() => {
    stopPlayback();
    const freshExercise = buildMelody(DEFAULT_NOTE_COUNT, DEFAULT_INTERVAL_KEYS, DEFAULT_CLEF_KEYS);
    setNoteCount(DEFAULT_NOTE_COUNT);
    setTempo(DEFAULT_TEMPO);
    setVolume(DEFAULT_VOLUME);
    setInstrument(DEFAULT_INSTRUMENT);
    setSelectedIntervalKeys(DEFAULT_INTERVAL_KEYS);
    setSelectedClefKeys(DEFAULT_CLEF_KEYS);
    setUseTwelveToneSeries(false);
    setExercise(freshExercise);
    setAttemptNotes([{ note: freshExercise.sequence[0], status: "start" }]);
    setNextIndex(1);
    setRevealFull(false);
    setStats({ totalSeconds: 0, exercises: 0, correct: 0, incorrect: 0 });
    try {
      window.localStorage.removeItem(SETTINGS_KEY);
      window.localStorage.removeItem(STATS_KEY);
    } catch {}
  }, [stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      try { audioContextRef.current?.close(); } catch {}
    };
  }, [stopPlayback]);

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-5 text-zinc-950 md:p-8">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500;1,600;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="mx-auto max-w-7xl space-y-6" style={{ fontFamily: "DM Sans, sans-serif" }}>
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Método Aural</p>
            <h1 className="mt-2 text-4xl font-semibold italic tracking-tight md:text-6xl" style={{ fontFamily: "Cormorant Garamond, serif" }}>
              Entrenador de intervalos melódicos
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <StatBox label="Tiempo" value={formatTime(stats.totalSeconds)} />
            <StatBox label="Ejercicios" value={stats.exercises} />
            <StatBox label="Aciertos" value={stats.correct} />
            <StatBox label="Errores" value={stats.incorrect} />
            <StatBox label="Puntuación" value={`${score}/100`} />
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-zinc-700">Número de notas</span>
                  <Badge>{safeNoteCount} notas</Badge>
                </div>
                <input
                  type="range"
                  min={useTwelveToneSeries ? TWELVE_TONE_MIN_NOTES : MIN_NOTES}
                  max={useTwelveToneSeries ? TWELVE_TONE_MAX_NOTES : MAX_NOTES}
                  step={1}
                  value={safeNoteCount}
                  onChange={(event) => setNoteCount(Number(event.target.value))}
                  className="w-full accent-zinc-950"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{useTwelveToneSeries ? 4 : 2}</span>
                  <span>{useTwelveToneSeries ? 12 : 24}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-700">Intervalos</span>
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
                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                  <SelectionChip active={useTwelveToneSeries} onClick={() => setUseTwelveToneSeries((current) => !current)} title="Serie dodecafónica">
                    Serie dodecafónica
                  </SelectionChip>
                  <span className="text-xs text-zinc-500">Sin repetir clases de altura; disponible de 4 a 12 notas.</span>
                </div>
                {!hasSelectedIntervals ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Selecciona al menos un intervalo para generar.</p>
                ) : useTwelveToneSeries && twelveToneUsableIntervals.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">La 8J no puede funcionar sola en serie dodecafónica porque repite la misma clase de altura.</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-700">Claves permitidas</span>
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
                  <input type="range" min={MIN_TEMPO} max={MAX_TEMPO} step={1} value={tempo} onChange={(event) => setTempo(Number(event.target.value))} className="w-full accent-zinc-950" />
                  <div className="flex justify-between text-xs text-zinc-500"><span>30 BPM</span><span>200 BPM</span></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Volumen</span><Badge>{volume}%</Badge></div>
                  <input type="range" min={MIN_VOLUME} max={MAX_VOLUME} step={1} value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-full accent-zinc-950" />
                  <div className="flex justify-between text-xs text-zinc-500"><span>0%</span><span>100%</span></div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Instrumento</span><Badge>{selectedInstrument?.label}</Badge></div>
                  <select value={instrument} onChange={(event) => setInstrument(event.target.value)} className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">
                    {INSTRUMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-zinc-700">Clave actual</span><Badge>{getClefConfig(exercise.clefKey).label}</Badge></div>
                  <div className="flex h-[50px] items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-700">
                    <span className="mr-3 font-serif text-3xl">{getClefConfig(exercise.clefKey).symbol}</span>{getClefConfig(exercise.clefKey).label}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-5">
                <ActionButton active={buttonFlash} onClick={startExercise} disabled={!canGenerate}>Generar nueva sucesión</ActionButton>
                <ActionButton active={isPlaying} onClick={() => (isPlaying ? stopPlayback() : playExercise(exercise))}>Escuchar</ActionButton>
                <ActionButton active={revealFull} onClick={() => setRevealFull((current) => !current)}>Mostrar respuesta completa</ActionButton>
                <ActionButton active={false} onClick={resetEverything}>Reiniciar todo</ActionButton>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900">Ejercicio actual</h2>
                  <p className="mt-1 text-sm text-zinc-500">La primera nota aparece desde el inicio. Toca en el teclado la nota que crees que sigue.</p>
                </div>
                <Badge>{exercise.mode === "twelveTone" ? "Serie dodecafónica" : "Intervalos"}</Badge>
              </div>

              <Staff exercise={exercise} attemptNotes={attemptNotes} revealFull={revealFull} />

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-zinc-800">
                    {exerciseComplete ? "Ejercicio completo." : `Siguiente nota: ${nextIndex + 1} de ${exercise.sequence.length}`}
                  </p>
                  <span className="text-xs text-zinc-500">El teclado evalúa clases de altura en una octava.</span>
                </div>
                <PianoKeyboard onPress={handleKeyboardPress} disabled={exerciseComplete || revealFull} expectedPc={expectedNote ? pitchClassOf(expectedNote) : null} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Resumen</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatBox label="Inicio" value={exercise.startNote} />
                <StatBox label="Notas vistas" value={`${Math.min(nextIndex, exercise.sequence.length)}/${exercise.sequence.length}`} />
                <StatBox label="Modo" value={exercise.mode === "twelveTone" ? "Dodecafónico" : "Intervalos"} />
                <StatBox label="Puntaje" value={`${score}/100`} />
              </div>
              {revealFull ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {exercise.sequence.map((note, index) => (
                    <span key={`${note.id}-${index}`} className="rounded-xl bg-zinc-950 px-3 py-1 text-sm font-semibold text-white">{note.label}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
