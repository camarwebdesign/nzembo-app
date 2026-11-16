"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SkeletonStatCard, SkeletonSongCard } from "@/components/Skeleton";

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate real data fetching / authentication check
    const timer = setTimeout(() => {
      setLoading(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* SKELETON LOADING STATE WITH SHIMMER WAVE */}
      {loading ? (
        <div className="space-y-6 animate-pulse-subtle transition-opacity duration-300">
          <div className="space-y-2">
            <div className="shimmer h-8 w-48 rounded-lg"></div>
            <div className="shimmer h-4 w-72 rounded-md"></div>
          </div>

          <div className="shimmer h-16 w-full rounded-2xl"></div>

          <div className="grid grid-cols-2 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>

          <div className="space-y-3 pt-2">
            <div className="shimmer h-4 w-32 rounded"></div>
            <SkeletonSongCard />
            <SkeletonSongCard />
          </div>
        </div>
      ) : (
        /* REAL CONTENT REVEALED WITH FADE-IN */
        <div className="animate-fade-in-up space-y-6">
          {/* Welcome */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Bienvenue sur <span className="gradient-text">Nzembo</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Crée des chansons personnalisées avec l&apos;IA
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 600);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-nzembo-violet/20 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              title="Tester le Skeleton Shimmer Loader"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <span>Recharger</span>
            </button>
          </div>

          {/* Main CTA */}
          <Link
            href="/create"
            className="btn-gradient w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 animate-pulse-glow"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            </svg>
            <span>Créer une chanson</span>
          </Link>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-nzembo-card/50 p-5 rounded-2xl border border-slate-200/80 dark:border-nzembo-violet/15 text-center shadow-sm">
              <span className="text-3xl font-extrabold gradient-text">2</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Chansons créées</p>
            </div>
            <Link
              href="/credits"
              className="bg-white dark:bg-nzembo-card/50 p-5 rounded-2xl border border-slate-200/80 dark:border-nzembo-violet/15 text-center shadow-sm hover:border-nzembo-violet/40 transition-colors"
            >
              <span className="text-3xl font-extrabold text-nzembo-violet dark:text-nzembo-cyan">3</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Crédits disponibles</p>
            </Link>
          </div>

          {/* Recent songs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Dernières créations
              </h2>
              <Link href="/songs" className="text-xs font-semibold text-nzembo-violet dark:text-nzembo-cyan hover:underline">
                Voir tout →
              </Link>
            </div>

            <div className="space-y-3">
              <div className="bg-white dark:bg-nzembo-card/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-nzembo-violet/15 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-nzembo-violet/20 text-nzembo-violet dark:text-nzembo-cyan flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Joyeux Anniversaire Sarah</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Afrobeat • Pour Sarah</p>
                  </div>
                </div>
                <Link href="/songs" className="text-xs font-semibold text-nzembo-violet dark:text-nzembo-cyan hover:underline">
                  Écouter
                </Link>
              </div>

              <div className="bg-white dark:bg-nzembo-card/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-nzembo-violet/15 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-nzembo-cyan/20 text-nzembo-cyan flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Pour ma bien-aimée Christelle</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Rumba Congolaise • Pour Christelle</p>
                  </div>
                </div>
                <Link href="/songs" className="text-xs font-semibold text-nzembo-violet dark:text-nzembo-cyan hover:underline">
                  Écouter
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
