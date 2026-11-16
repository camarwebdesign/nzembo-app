"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SongCard, { SongItem } from "@/components/SongCard";
import AudioPlayer from "@/components/AudioPlayer";

const defaultSampleSongs: SongItem[] = [
  {
    id: "sample-1",
    title: "Joyeux Anniversaire Sarah",
    style: "Afrobeat",
    occasion: "Anniversaire",
    duration: "2:45",
    createdAt: "22/10/2026",
    recipientName: "Sarah",
  },
  {
    id: "sample-2",
    title: "Pour ma bien-aimée Christelle",
    style: "Rumba Congolaise",
    occasion: "Mariage",
    duration: "3:12",
    createdAt: "20/10/2026",
    recipientName: "Christelle",
  },
  {
    id: "sample-3",
    title: "Hommage au Grand-Père Joseph",
    style: "Acoustique",
    occasion: "Hommage",
    duration: "2:50",
    createdAt: "18/10/2026",
    recipientName: "Grand-Père Joseph",
  },
];

export default function SongsPage() {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<SongItem | null>(null);
  const [filterStyle, setFilterStyle] = useState("Tous");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nzembo_user_songs");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSongs([...parsed, ...defaultSampleSongs]);
      } else {
        setSongs(defaultSampleSongs);
      }
    } catch {
      setSongs(defaultSampleSongs);
    }
  }, []);

  const styles = ["Tous", "Afrobeat", "Rumba Congolaise", "Acoustique", "Ndombolo", "R&B"];

  const filteredSongs = filterStyle === "Tous"
    ? songs
    : songs.filter((s) => s.style.toLowerCase().includes(filterStyle.toLowerCase()));

  const handlePlayToggle = (song: SongItem) => {
    if (currentPlayingSong?.id === song.id) {
      setCurrentPlayingSong(null);
    } else {
      setCurrentPlayingSong(song);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Mes Chansons</h1>
          <p className="text-nzembo-muted text-sm mt-1">
            Retrouvez et réécoutez toutes vos créations musicales.
          </p>
        </div>
        <Link href="/create" className="btn-gradient text-sm py-2.5 px-5 self-start">
          ✨ Nouvelle chanson
        </Link>
      </div>

      {/* Currently playing player if selected */}
      {currentPlayingSong && (
        <div className="animate-fade-in-up">
          <AudioPlayer
            title={currentPlayingSong.title}
            style={currentPlayingSong.style}
            duration={180}
            onPlayStateChange={(playing) => {
              if (!playing && currentPlayingSong === null) {
                // stopped
              }
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {styles.map((style) => (
          <button
            key={style}
            onClick={() => setFilterStyle(style)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filterStyle === style
                ? "bg-gradient-to-r from-nzembo-violet to-nzembo-cyan text-white shadow-md shadow-nzembo-violet/20"
                : "bg-nzembo-card text-nzembo-muted hover:text-white"
            }`}
          >
            {style}
          </button>
        ))}
      </div>

      {/* Songs list */}
      {filteredSongs.length > 0 ? (
        <div className="space-y-3">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isPlaying={currentPlayingSong?.id === song.id}
              onPlay={handlePlayToggle}
            />
          ))}
        </div>
      ) : (
        <div className="nz-card p-10 text-center">
          <div className="text-5xl mb-4">🎵</div>
          <h3 className="text-lg font-semibold text-white">Aucune chanson trouvée</h3>
          <p className="text-nzembo-muted text-sm mt-1 mb-6">
            Vous n&apos;avez pas encore créé de chanson dans ce style.
          </p>
          <Link href="/create" className="btn-gradient text-sm py-2.5 px-6">
            Créer ma première chanson
          </Link>
        </div>
      )}
    </div>
  );
}
