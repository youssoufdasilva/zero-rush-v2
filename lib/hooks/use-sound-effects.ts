"use client";

import { useCallback, useEffect, useRef } from "react";

export type SoundName =
  | "cardAdd"
  | "cardRemove"
  | "submitValid"
  | "submitInvalid"
  | "duplicate"
  | "duskFound"
  | "dawnFound"
  | "puzzleComplete"
  | "clear"
  | "newPuzzle";

interface ToneStep {
  frequency: number;
  duration: number;
  volume: number;
  type?: OscillatorType;
  gap?: number;
}

interface ToneConfig {
  steps: ToneStep[];
}

const SOUND_MAP: Record<SoundName, ToneConfig> = {
  cardAdd: {
    steps: [{ frequency: 740, duration: 0.07, volume: 0.08, type: "triangle" }],
  },
  cardRemove: {
    steps: [{ frequency: 520, duration: 0.07, volume: 0.08, type: "triangle" }],
  },
  submitValid: {
    steps: [{ frequency: 880, duration: 0.12, volume: 0.12, type: "sine" }],
  },
  submitInvalid: {
    steps: [{ frequency: 260, duration: 0.14, volume: 0.12, type: "sawtooth" }],
  },
  duplicate: {
    steps: [{ frequency: 320, duration: 0.2, volume: 0.12, type: "sine" }],
  },
  duskFound: {
    steps: [
      { frequency: 640, duration: 0.12, volume: 0.1, type: "sine", gap: 0.02 },
      { frequency: 760, duration: 0.12, volume: 0.1, type: "sine" },
    ],
  },
  dawnFound: {
    steps: [
      { frequency: 760, duration: 0.12, volume: 0.1, type: "sine", gap: 0.02 },
      { frequency: 920, duration: 0.12, volume: 0.1, type: "sine" },
    ],
  },
  puzzleComplete: {
    steps: [
      { frequency: 880, duration: 0.16, volume: 0.12, type: "sine", gap: 0.03 },
      { frequency: 1040, duration: 0.2, volume: 0.12, type: "sine" },
    ],
  },
  clear: {
    steps: [{ frequency: 420, duration: 0.09, volume: 0.08, type: "square" }],
  },
  newPuzzle: {
    steps: [{ frequency: 520, duration: 0.1, volume: 0.08, type: "square" }],
  },
};

function createAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return AudioContextCtor ? new AudioContextCtor() : null;
}

function playTone(context: AudioContext, step: ToneStep, startTime: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const type = step.type ?? "sine";

  oscillator.type = type;
  oscillator.frequency.value = step.frequency;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(step.volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + step.duration
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + step.duration + 0.02);
}

export function useSoundEffects(enabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext();
      }
      const context = audioContextRef.current;
      if (!context) return;

      if (context.state === "suspended") {
        context.resume().catch(() => undefined);
      }

      const config = SOUND_MAP[name];
      if (!config) return;

      let timeCursor = context.currentTime;
      config.steps.forEach((step, index) => {
        playTone(context, step, timeCursor);
        const gap = step.gap ?? 0;
        timeCursor += step.duration + gap;
        if (index === config.steps.length - 1) {
          timeCursor += 0.01;
        }
      });
    },
    [enabled]
  );

  return { play };
}
