"use client";

import { useState, useRef } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.nzembo.com";

interface Song {
  title: string;
  style: string;
  duration: string;
  color: string;
}

const songs: Song[] = [
  { title: "Joyeux Anniversaire Maman", style: "Rumba Congolaise", duration: "3:15", color: "#7C3AED" },
  { title: "Pour mon Frère David", style: "Afrobeat", duration: "2:50", color: "#06B6D4" },
  { title: "Notre Amour", style: "R&B", duration: "3:30", color: "#8B5CF6" },
  { title: "Hommage à Papa", style: "Acoustique", duration: "3:05", color: "#14B8A6" },
  { title: "Félicitations Grâce", style: "Ndombolo", duration: "2:45", color: "#A855F7" },
  { title: "Bienvenue Bébé", style: "Pop Africaine", duration: "2:55", color: "#0EA5E9" },
];

function SongCard({ song, index }: { song: Song; index: number }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setPlaying(true);
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            setPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return p + 0.5;
        });
      }, 100);
    }
  };

  return (
    <div className="reveal nz-card p-5 flex items-center gap-4 group" style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Play Button */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{ background: `linear-gradient(135deg, ${song.color}, ${song.color}99)` }}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <path d="M4 2l10 6-10 6V2z" />
          </svg>
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white truncate">{song.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${song.color}20`, color: song.color }}
          >
            {song.style}
          </span>
          <span className="text-xs text-nzembo-subtle">{song.duration}</span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-nzembo-card rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${song.color}, ${song.color}88)`,
            }}
          />
        </div>
      </div>

      {/* Waveform visualization */}
      <div className="hidden sm:flex items-end gap-0.5 h-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-300"
            style={{
              background: song.color,
              height: playing
                ? `${8 + Math.sin((Date.now() / 200 + i) * 0.8) * 12 + 12}px`
                : `${6 + Math.sin(i * 0.7) * 4 + 4}px`,
              opacity: playing ? 0.8 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SongExamples() {
  return (
    <section id="exemples" className="py-24 px-4 bg-nzembo-dark">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Extraits de morceaux composés sur Nzembo
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
            Écoutez le rendu des guitares, des rythmiques et des voix selon les styles.
          </p>
        </div>

        <div className="grid gap-3.5">
          {songs.map((song, idx) => (
            <SongCard key={idx} song={song} index={idx} />
          ))}
        </div>

        <div className="text-center mt-8">
          <a href={APP_URL} className="btn-gradient text-sm font-bold py-3 px-6 rounded-xl inline-flex items-center gap-2">
            Ouvrir le studio pour créer
          </a>
        </div>
      </div>
    </section>
  );
}
