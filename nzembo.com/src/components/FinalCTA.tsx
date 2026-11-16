"use client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.nzembo.com";

export default function FinalCTA() {
  return (
    <section className="py-20 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 text-slate-900 dark:text-white">
          Prêt à composer une chanson pour un proche ?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-base mb-7">
          Racontez votre histoire en quelques lignes et écoutez la mélodie prendre vie.
        </p>
        <a
          href={APP_URL}
          className="btn-gradient px-8 py-3.5 rounded-xl font-bold text-base inline-flex items-center gap-2 shadow-sm"
        >
          Accéder au studio Nzembo
        </a>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
          Inscription rapide par e-mail ou compte Google.
        </p>
      </div>
    </section>
  );
}
