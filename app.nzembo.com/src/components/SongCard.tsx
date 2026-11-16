"use client";

import React from "react";
import Link from "next/link";

export interface SongItem {
  id: string;
  title: string;
  style: string;
  occasion: string;
  duration: string;
  createdAt: string;
  recipientName: string;
}

interface SongCardProps {
  song: SongItem;
  onPlay?: (song: SongItem) => void;
  isPlaying?: boolean;
}

export default function SongCard({ song, onPlay, isPlaying }: SongCardProps) {
  return (
    <div className="nz-card p-4 sm:p-5 flex items-center justify-between gap-4 group transition-all duration-300 hover:border-nzembo-violet/40">
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={() => onPlay?.(song)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
            isPlaying
              ? "bg-gradient-to-r from-nzembo-violet to-nzembo-cyan shadow-lg shadow-nzembo-violet/30 scale-105"
              : "bg-nzembo-card border border-nzembo-violet/20 group-hover:border-nzembo-violet/50"
          }`}
          aria-label={isPlaying ? "Mettre en pause" : "Écouter"}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="ml-0.5">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </button>

        <div className="min-w-0">
          <Link href={`/songs/${song.id}`}>
            <h3 className="font-semibold text-white truncate hover:text-nzembo-cyan transition-colors">
              {song.title}
            </h3>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-nzembo-violet/20 text-nzembo-muted">
              {song.style}
            </span>
            <span className="text-xs text-nzembo-subtle">• Pour {song.recipientName}</span>
            <span className="text-xs text-nzembo-subtle">• {song.duration}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/songs/${song.id}`}
          className="p-2 text-nzembo-muted hover:text-white transition-colors"
          title="Détails de la chanson"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
