"use client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.nzembo.com";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-24 pb-16 px-4 bg-white dark:bg-nzembo-night transition-colors">
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge concret de métier */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-200 dark:border-nzembo-violet/30 bg-purple-50/60 dark:bg-nzembo-violet/10 mb-6">
          <span className="w-2 h-2 rounded-full bg-nzembo-violet dark:bg-cyan-400" />
          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
            Studio de composition • Rumba, Afrobeat, Amapiano & R&B
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-5 text-slate-900 dark:text-white">
          Composez une vraie chanson pour vos proches
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
          Anniversaire, mariage, hommage ou dédicace. Racontez votre moment, choisissez un genre musical et recevez un morceau chanté et arrangé avec soin.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
          <a
            href={APP_URL}
            className="btn-gradient text-base py-3.5 px-7 rounded-xl font-bold flex items-center justify-center w-full sm:w-auto shadow-sm"
          >
            Démarrer un morceau
          </a>
          <a
            href="#exemples"
            className="text-base py-3.5 px-7 rounded-xl font-semibold border border-slate-300 dark:border-nzembo-violet/40 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-nzembo-violet/10 transition-colors w-full sm:w-auto text-center"
          >
            Écouter des extraits
          </a>
        </div>

        {/* Informations concrètes sur les voix et langues */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1.5 px-3.5 rounded-xl bg-slate-50 dark:bg-nzembo-card/50 border border-slate-200/60 dark:border-purple-900/30">
          <span>Voix soliste et chœurs</span>
          <span>•</span>
          <span>Lingála, Français, Swahili, Anglais</span>
          <span>•</span>
          <span>Fichier audio HD téléchargeable</span>
        </div>
      </div>
    </section>
  );
}
