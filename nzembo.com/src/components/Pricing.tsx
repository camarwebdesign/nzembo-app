"use client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.nzembo.com";

export default function Pricing() {
  return (
    <section id="tarifs" className="py-20 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-900 dark:text-white">
          Tarification claire : 0,80 $ par crédit
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-sm">
          Pas d&apos;abonnement mensuel caché. Vous achetez uniquement les crédits dont vous avez besoin : <strong>1 crédit = 0,80 $ USD</strong> (~2 280 CDF ou ~500 FCFA).
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-nzembo-card/70 p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-purple-800/40 shadow-sm text-left">
          <div className="text-center pb-5 border-b border-slate-100 dark:border-purple-900/30">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Paiement à l&apos;usage</p>
            <div className="flex items-baseline justify-center gap-1.5 mt-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">0,80 $</span>
              <span className="text-xs font-bold text-nzembo-violet dark:text-cyan-400 uppercase">/ crédit</span>
            </div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
              ~2 280 Francs Congolais (CDF) • ~500 FCFA
            </p>
          </div>

          <div className="py-5 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
              <span><strong>Chanson complète :</strong> paroles rédigées, arrangement instrumental (Rumba, Afrobeat, Amapiano, etc.) et voix chantée.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
              <span><strong>Boîte à outils studio :</strong> Reprises, Remix de style, voix sur instrumental, génération vidéo MP4 avec paroles et export WAV.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
              <span><strong>Fichier MP3 HD téléchargeable :</strong> prêt pour écoute sur baffle ou envoi direct sur WhatsApp.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
              <span><strong>Crédits sans date d&apos;expiration :</strong> utilisez votre solde à votre propre rythme.</span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`${APP_URL}#credits`}
              className="btn-gradient w-full py-3.5 rounded-xl font-bold text-center text-sm block shadow-sm"
            >
              Accéder à la recharge de crédits
            </a>
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2.5">
              Règlement par Mobile Money (M-Pesa, Orange, Airtel, MTN, Wave) ou carte bancaire.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
