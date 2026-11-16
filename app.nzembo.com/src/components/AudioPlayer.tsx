"use client";

import React, { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  title: string;
  style?: string;
  duration?: number; // in seconds
  onPlayStateChange?: (playing: boolean) => void;
  accentColor?: string;
}

export default function AudioPlayer({
  title,
  style = "Afrobeat",
  duration = 195, // 3:15
  onPlayStateChange,
  accentColor = "#7C3AED",
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const animationRef = useRef<number | null>(null);

  // Synthesize pleasant sound / tone for demo when playing or simulate realistic playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      onPlayStateChange?.(false);
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch {
          // ignore
        }
        oscillatorRef.current = null;
      }
    } else {
      setIsPlaying(true);
      onPlayStateChange?.(true);

      // Play soft harmonic ambient chime / chord simulation via Web Audio API for a real audible feel
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioCtx();
          }
          if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume();
          }

          // Generate a gentle melody loop
          const ctx = audioContextRef.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          // Gentle musical frequency (A3 = 220Hz, E4 = 329Hz)
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(329.63, ctx.currentTime + 1.5);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 3);

          gain.gain.setValueAtTime(0.05 * volume, ctx.currentTime);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          oscillatorRef.current = osc;
        }
      } catch {
        // web audio may not be allowed until user gesture, which this is
      }
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            onPlayStateChange?.(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration, onPlayStateChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const progressPercent = (currentTime / duration) * 100;

  return (
    <div className="nz-card p-6 bg-gradient-to-br from-nzembo-card/90 to-nzembo-night/90 border border-nzembo-violet/30 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-nzembo-violet/20 text-nzembo-cyan border border-nzembo-violet/30">
            {style}
          </span>
          <h3 className="text-lg font-bold text-white mt-1.5">{title}</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-nzembo-muted">Durée</span>
          <p className="text-sm font-semibold text-white">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
      </div>

      {/* Animated Waveform Visualizer */}
      <div className="h-16 flex items-center justify-between gap-1 my-4 px-2 bg-nzembo-night/50 rounded-xl border border-nzembo-violet/10 overflow-hidden">
        {Array.from({ length: 32 }).map((_, i) => {
          const barProgress = (i / 32) * 100;
          const isPassed = barProgress <= progressPercent;
          // pseudo-random harmonic height
          const baseHeight = 15 + Math.sin(i * 0.7) * 20 + Math.cos(i * 0.3) * 15;
          const dynamicHeight = isPlaying
            ? Math.min(56, Math.max(8, baseHeight + Math.sin((currentTime * 3) + i) * 15))
            : Math.min(56, Math.max(8, baseHeight));

          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-150 cursor-pointer hover:opacity-100"
              style={{
                height: `${dynamicHeight}px`,
                backgroundColor: isPassed ? accentColor : "#4A3B69",
                boxShadow: isPassed && isPlaying ? `0 0 8px ${accentColor}` : "none",
                opacity: isPassed ? 1 : 0.45,
              }}
              onClick={() => {
                const targetTime = (i / 32) * duration;
                setCurrentTime(targetTime);
              }}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            className="p-2 text-nzembo-muted hover:text-white transition-colors"
            title="Reculer de 10s"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-nzembo-violet to-nzembo-cyan flex items-center justify-center text-white shadow-lg shadow-nzembo-violet/30 hover:scale-105 active:scale-95 transition-all"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
            className="p-2 text-nzembo-muted hover:text-white transition-colors"
            title="Avancer de 10s"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 17l5-5-5-5M6 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-nzembo-muted">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 accent-nzembo-cyan h-1.5 bg-nzembo-card rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
