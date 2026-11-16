"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import { useToast } from "@/contexts/ToastContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SingleSongPage({ params }: PageProps) {
  const { id } = use(params);
  const { showToast } = useToast();

  const [song, setSong] = useState({
    id,
    title: "Chanson Personnalisée Nzembo",
    style: "Afrobeat",
    occasion: "Anniversaire",
    recipientName: "Sarah",
    date: "22/10/2026",
    lyrics: `[Couplet 1]\nUne mélodie pour toi qui illumine nos journées,\nChaque sourire partagé est un trésor à préserver.\nLe chemin parcouru ensemble nous rend si fiers,\nAujourd'hui la musique résonne sur toute la terre.\n\n[Refrain - Afrobeat & Lingala]\nNzembo ya bolingo, nzembo ya esengo,\nPour Sarah, célébrons ce grand jour avec amour !\nQue le rythme de nos cœurs t'accompagne toujours,\nNzembo na biso, jusqu'à l'aube du jour.\n\n[Couplet 2]\nQue la joie t'accompagne à chaque pas,\nCe cadeau musical restera à jamais auprès de toi.`,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nzembo_user_songs");
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = parsed.find((s: { id: string }) => s.id === id);
        if (found) {
          setSong(found);
        }
      }
    } catch {
      // ignore
    }
  }, [id]);

  const handleDownload = () => {
    showToast("Le téléchargement MP3 haute fidélité est réservé aux forfaits Créateur & Illimité.", "info");
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Lien de la chanson copié !", "success");
    } else {
      showToast("Lien prêt à être partagé !", "success");
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <Link
          href="/songs"
          className="text-xs font-medium text-nzembo-muted hover:text-white transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Retour à mes chansons
        </Link>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-nzembo-violet/20 text-nzembo-cyan border border-nzembo-violet/30 font-medium">
            {song.style}
          </span>
          <span className="text-xs text-nzembo-muted">• {song.occasion}</span>
          <span className="text-xs text-nzembo-subtle">• Créée le {song.date}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{song.title}</h1>
      </div>

      {/* Audio Player */}
      <AudioPlayer title={song.title} style={song.style} duration={195} />

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleDownload}
          className="btn-gradient py-3 justify-center text-sm"
        >
          📥 Télécharger MP3
        </button>
        <button
          onClick={handleShare}
          className="btn-secondary py-3 justify-center text-sm"
        >
          🔗 Partager
        </button>
      </div>

      {/* Lyrics */}
      <div className="nz-card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📜</span> Paroles de la chanson
        </h3>
        <div className="bg-nzembo-night/70 p-5 rounded-xl border border-nzembo-violet/10 font-mono text-sm text-nzembo-muted whitespace-pre-line leading-relaxed">
          {song.lyrics}
        </div>
      </div>
    </div>
  );
}
