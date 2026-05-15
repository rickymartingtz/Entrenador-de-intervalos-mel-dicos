import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_OFFSETS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACCIDENTAL_ASCII = { [-1]: "b", 0: "", 1: "#" };
const ACCIDENTAL_DISPLAY = { [-1]: "♭", 0: "", 1: "♯" };

const SOUNDFONT_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/soundfont-player@0.15.7/dist/soundfont-player.min.js";
const SOUNDFONT_LIBRARY = "MusyngKite";
const SOUNDFONT_BASE_URL = "https://gleitz.github.io/midi-js-soundfonts";

const MIN_NOTES = 2;
const MAX_NOTES = 24;
const MIN_TEMPO = 30;
const MAX_TEMPO = 200;
const DEFAULT_TEMPO = 72;
const DEFAULT_VOLUME = 70;

const INSTRUMENTS = [
  { value: "human", label: "Voz / coro", soundfont: "choir_aahs", fallback: "voice", sustain: true },
  { value: "voiceOohs", label: "Voz oohs", soundfont: "voice_oohs", fallback: "voice", sustain: true },
  { value: "organ", label: "Órgano", soundfont: "church_organ", fallback: "organ", sustain: true },
  { value: "strings", label: "Cuerdas", soundfont: "string_ensemble_1", fallback: "strings", sustain: true },
  { value: "cello", label: "Violonchelo", soundfont: "cello", fallback: "strings", sustain: true },
  { value: "piano", label: "Piano acústico", soundfont: "acoustic_grand_piano", fallback: "piano", sustain: false },
  { value: "brightPiano", label: "Piano brillante", soundfont: "bright_acoustic_piano", fallback: "piano", sustain: false },
  { value: "marimba", label: "Marimba", soundfont: "marimba", fallback: "mallet", sustain: false },
  { value: "vibraphone", label: "Vibráfono", soundfont: "vibraphone", fallback: "mallet", sustain: false },
  { value: "glockenspiel", label: "Glockenspiel", soundfont: "glockenspiel", fallback: "mallet", sustain: false },
  { value: "bass", label: "Bajo acústico", soundfont: "acoustic_bass", fallback: "bass", sustain: false },
];

const INTERVALS = [
  { key: "m2", short: "2m", semitones: 1 },
  { key: "M2", short: "2M", semitones: 2 },
  { key: "m3", short: "3m", semitones: 3 },
  { key: "M3", short: "3M", semitones: 4 },
  { key: "P4", short: "4J", semitones: 5 },
  { key: "TT", short: "TT", semitones: 6 },
  { key: "P5", short: "5J", semitones: 7 },
  { key: "m6", short: "6m", semitones: 8 },
  { key: "M6", short: "6M", semitones: 9 },
  { key: "m7", short: "7m", semitones: 10 },
  { key: "M7", short: "7M", semitones: 11 },
  { key: "P8", short: "8J", semitones: 12 },
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

function midiToNoteName(midi) {
  const names = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pc]}${octave}`;
}

function noteNameForSoundFont(midi) {
  const names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pc]}${octave}`;
}

function loadScriptOnce(src) {
  if (typeof window === "undefined") return Promise.reject(new Error("Window no disponible"));
  if (window.Soundfont) return Promise.resolve();
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function buildMelody(count, selectedIntervals) {
  const safeCount = clamp(count, MIN_NOTES, MAX_NOTES);
  const pool = selectedIntervals.length ? selectedIntervals : ["P4", "P5", "P8"];
  const allowed = INTERVALS.filter((item) => pool.includes(item.key));
  let current = 60 + Math.floor(Math.random() * 13); // C4 to C5
  const notes = [current];
  const intervalLabels = [];

  for (let i = 1; i < safeCount; i += 1) {
    let next = current;
    let chosen = null;
    for (let attempt = 0; attempt < 24; attempt += 1) {
      chosen = randomItem(allowed);
      const direction = Math.random() > 0.5 ? 1 : -1;
      next = current + chosen.semitones * direction;
      if (next >= 48 && next <= 84) {
        intervalLabels.push(`${chosen.short} ${direction > 0 ? "↑" : "↓"}`);
        break;
      }
    }
    current = clamp(next, 48, 84);
    notes.push(current);
  }

  return { notes, intervalLabels };
}

function Chip({ active, children, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm transition ${
        active
          ? "border-stone-950 bg-stone-950 text-white"
          : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function IconButton({ children, onClick, variant = "dark", disabled }) {
  const classes = variant === "dark"
    ? "bg-stone-950 text-white hover:bg-stone-800"
    : "border border-stone-300 bg-white text-stone-900 hover:border-stone-500";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${classes} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      {children}
    </button>
  );
}

export default function IntervalTrainerSoundfontPreview() {
  const audioContextRef = useRef(null);
  const soundfontCacheRef = useRef(new Map());
  const activeFallbackNodesRef = useRef([]);
  const activePlayersRef = useRef([]);
  const playbackTimeoutRef = useRef(null);

  const [noteCount, setNoteCount] = useState(8);
  const [tempo, setTempo] = useState(DEFAULT_TEMPO);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [instrument, setInstrument] = useState("human");
  const [selectedIntervals, setSelectedIntervals] = useState(["P4", "P5", "P8"]);
  const [melody, setMelody] = useState(() => buildMelody(8, ["P4", "P5", "P8"]));
  const [revealed, setRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioStatus, setAudioStatus] = useState("Los sonidos reales se cargan al presionar Escuchar.");

  const selectedInstrument = useMemo(
    () => INSTRUMENTS.find((item) => item.value === instrument) ?? INSTRUMENTS[0],
    [instrument]
  );

  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
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
    if (soundfontCacheRef.current.has(cacheKey)) {
      return soundfontCacheRef.current.get(cacheKey);
    }

    await loadScriptOnce(SOUNDFONT_SCRIPT_URL);
    if (!window.Soundfont?.instrument) throw new Error("Soundfont-player no disponible");

    setAudioStatus(`Cargando ${instrumentConfig.label}…`);
    const sfInstrument = await window.Soundfont.instrument(ctx, instrumentConfig.soundfont, {
      format: "mp3",
      soundfont: SOUNDFONT_LIBRARY,
      nameToUrl: (name, sf, format) => `${SOUNDFONT_BASE_URL}/${sf}/${name}-${format}.js`,
    });
    soundfontCacheRef.current.set(cacheKey, sfInstrument);
    setAudioStatus(`${instrumentConfig.label}: muestras cargadas.`);
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

    if (fallbackType === "voice") {
      attack = 0.09;
      release = Math.max(0.15, duration * 0.24);
      peak = 0.18 * volumeNorm;
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
      peak = 0.17 * volumeNorm;
      routeOscillator({ type: "sine", level: 0.72 });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.18 });
      routeOscillator({ type: "triangle", multiplier: 0.5, level: 0.12 });
    } else if (fallbackType === "strings") {
      attack = 0.12;
      release = Math.max(0.15, duration * 0.26);
      peak = 0.17 * volumeNorm;
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
      peak = 0.19 * volumeNorm;
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 4200;
      lowPass.connect(masterGain);
      filters.push(lowPass);
      routeOscillator({ type: "sine", level: 0.75, targetNode: lowPass });
      routeOscillator({ type: "triangle", multiplier: 2.01, level: 0.2, targetNode: lowPass });
      routeOscillator({ type: "sine", multiplier: 3.02, level: 0.08, targetNode: lowPass });
    } else if (fallbackType === "bass") {
      attack = 0.018;
      release = Math.max(0.14, duration * 0.4);
      peak = 0.2 * volumeNorm;
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value = 1000;
      lowPass.connect(masterGain);
      filters.push(lowPass);
      routeOscillator({ type: "triangle", level: 0.85, targetNode: lowPass });
      routeOscillator({ type: "sine", multiplier: 2, level: 0.14, targetNode: lowPass });
    } else {
      attack = 0.012;
      release = Math.max(0.12, duration * 0.36);
      peak = 0.2 * volumeNorm;
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
    if (fallbackType === "piano" || fallbackType === "mallet" || fallbackType === "bass") {
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

  const generateNew = useCallback(() => {
    stopPlayback();
    setMelody(buildMelody(noteCount, selectedIntervals));
    setRevealed(false);
  }, [noteCount, selectedIntervals, stopPlayback]);

  const toggleInterval = useCallback((key) => {
    setSelectedIntervals((current) => {
      const exists = current.includes(key);
      const next = exists ? current.filter((item) => item !== key) : [...current, key];
      if (!next.length || (next.length === 1 && next[0] === "TT")) return ["P4", "P5", "P8"];
      return INTERVALS.map((item) => item.key).filter((item) => next.includes(item));
    });
  }, []);

  const playSequence = useCallback(async () => {
    if (!melody?.notes?.length || isPlaying) return;
    setIsPlaying(true);
    stopAllAudio();

    try {
      const ctx = await ensureAudioContext();
      const secondsPerBeat = 60 / clamp(tempo, MIN_TEMPO, MAX_TEMPO);
      const step = secondsPerBeat;
      const noteDuration = selectedInstrument.sustain ? Math.max(0.24, step * 0.96) : Math.max(0.2, step * 0.88);
      const baseTime = ctx.currentTime + 0.08;
      const safeVolume = clamp(volume, 0, 100);

      let sfInstrument = null;
      try {
        sfInstrument = await getSoundfontInstrument(ctx, selectedInstrument);
      } catch (error) {
        console.warn("No se pudo cargar SoundFont. Usando síntesis de respaldo.", error);
        setAudioStatus(`No se pudo cargar ${selectedInstrument.label}. Usando síntesis de respaldo.`);
      }

      melody.notes.forEach((midi, index) => {
        const start = baseTime + index * step;
        if (sfInstrument) {
          const player = sfInstrument.play(noteNameForSoundFont(midi), start, {
            duration: noteDuration,
            gain: safeVolume / 100,
          });
          activePlayersRef.current.push(player);
        } else {
          createFallbackVoice(ctx, midiToFreq(midi), selectedInstrument.fallback, start, noteDuration, safeVolume);
        }
      });

      if (playbackTimeoutRef.current) window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = window.setTimeout(() => {
        setIsPlaying(false);
        playbackTimeoutRef.current = null;
      }, melody.notes.length * step * 1000 + 450);
    } catch (error) {
      console.error(error);
      setAudioStatus("Hubo un problema al reproducir el audio.");
      setIsPlaying(false);
    }
  }, [createFallbackVoice, ensureAudioContext, getSoundfontInstrument, isPlaying, melody, selectedInstrument, stopAllAudio, tempo, volume]);

  useEffect(() => {
    setMelody(buildMelody(noteCount, selectedIntervals));
  }, [selectedIntervals]);

  useEffect(() => {
    return () => {
      if (playbackTimeoutRef.current) window.clearTimeout(playbackTimeoutRef.current);
      stopAllAudio();
      try { audioContextRef.current?.close(); } catch {}
    };
  }, [stopAllAudio]);

  return (
    <div className="min-h-screen bg-[#FAFAF7] px-5 py-8 text-stone-950">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div className="mx-auto max-w-6xl space-y-6" style={{ fontFamily: "DM Sans, sans-serif" }}>
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">Vista previa</p>
            <h1 className="mt-2 text-4xl font-semibold italic tracking-tight md:text-6xl" style={{ fontFamily: "Cormorant Garamond, serif" }}>
              Entrenador de intervalos melódicos
            </h1>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-sm text-stone-600 shadow-sm">
            Sonidos reales vía SoundFont + respaldo sintético.
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Configuración</h2>
              <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">{noteCount} notas</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Número de notas</span>
                  <span>{noteCount}</span>
                </div>
                <input
                  type="range"
                  min={MIN_NOTES}
                  max={MAX_NOTES}
                  step={1}
                  value={noteCount}
                  onChange={(event) => setNoteCount(Number(event.target.value))}
                  className="w-full accent-stone-950"
                />
                <div className="flex justify-between text-xs text-stone-500"><span>2</span><span>24</span></div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Intervalos</span>
                  <span>{selectedIntervals.length} activos</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERVALS.map((interval) => (
                    <Chip key={interval.key} active={selectedIntervals.includes(interval.key)} onClick={() => toggleInterval(interval.key)}>
                      {interval.short}
                    </Chip>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-stone-500">
                  En esta vista previa se generan saltos aleatorios con los intervalos seleccionados. El archivo completo conserva la lógica más avanzada de ortografía y modelos internos.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium"><span>Tempo</span><span>{tempo} BPM</span></div>
                  <input
                    type="range"
                    min={MIN_TEMPO}
                    max={MAX_TEMPO}
                    step={1}
                    value={tempo}
                    onChange={(event) => setTempo(Number(event.target.value))}
                    className="w-full accent-stone-950"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium"><span>Volumen</span><span>{volume}%</span></div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    className="w-full accent-stone-950"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Fuente de sonido</span>
                  <span>{selectedInstrument.label}</span>
                </div>
                <select
                  value={instrument}
                  onChange={(event) => setInstrument(event.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-700"
                >
                  {INSTRUMENTS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <p className="rounded-2xl bg-stone-100 px-4 py-3 text-xs leading-relaxed text-stone-600">{audioStatus}</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <IconButton onClick={generateNew}>Generar nueva sucesión</IconButton>
                <IconButton variant="light" onClick={isPlaying ? stopPlayback : playSequence}>{isPlaying ? "Parar" : "Escuchar"}</IconButton>
                <IconButton variant="light" onClick={() => setRevealed((prev) => !prev)}>{revealed ? "Ocultar respuesta" : "Mostrar respuesta"}</IconButton>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Sucesión actual</h2>
              <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">
                Inicio: {midiToNoteName(melody.notes[0])}
              </span>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-[#FAFAF7] p-5">
              <div className="mb-3 flex h-28 items-end gap-2 overflow-hidden border-b border-stone-300 pb-4">
                {melody.notes.map((midi, index) => {
                  const height = 22 + (midi - 48) * 1.65;
                  return (
                    <div key={`${midi}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <div
                        className="w-full max-w-10 rounded-t-xl bg-stone-950 transition-all"
                        style={{ height: `${height}px`, opacity: 0.35 + index / Math.max(8, melody.notes.length) }}
                        title={midiToNoteName(midi)}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-stone-500">Representación visual aproximada de altura; en el archivo completo aparece la partitura con VexFlow.</p>
            </div>

            {!revealed ? (
              <div className="mt-5 rounded-2xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">
                Presiona “Mostrar respuesta” para ver las notas e intervalos.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-stone-200 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Notas</p>
                  <div className="flex flex-wrap gap-2">
                    {melody.notes.map((midi, index) => (
                      <span key={`${midi}-${index}`} className="rounded-xl bg-stone-950 px-3 py-1 text-sm font-semibold text-white">
                        {midiToNoteName(midi)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-stone-200 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Saltos</p>
                  <div className="flex flex-wrap gap-2">
                    {melody.intervalLabels.map((item, index) => (
                      <span key={`${item}-${index}`} className="rounded-xl bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
