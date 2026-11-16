"use client";

import React from "react";
import { useToast } from "@/contexts/ToastContext";

const creditPacks = [
  {
    name: "Découverte",
    price: "Gratuit",
    credits: "1 chanson",
    desc: "Parfait pour essayer Nzembo et tester votre premier morceau.",
    popular: false,
    features: ["1 génération complète", "Styles de base inclus", "Écoute en ligne", "Aperçu de 30 secondes"],
    cta: "Pack Actuel",
    disabled: true,
  },
  {
    name: "Pack Créateur",
    price: "9,99€",
    credits: "5 chansons",
    desc: "Le choix idéal pour surprendre vos proches lors de vos événements.",
    popular: true,
    features: [
      "5 chansons personnalisées",
      "Tous les styles musicaux",
      "Téléchargement MP3 Haute Définition",
      "Droits d'usage personnel",
      "Support prioritaire par email",
    ],
    cta: "Recharger 5 Chansons",
    disabled: false,
  },
  {
    name: "Abonnement Illimité",
    price: "24,99€",
    period: "/mois",
    credits: "Illimité",
    desc: "Pour les créateurs, animateurs et mélomanes sans limite.",
    popular: false,
    features: [
      "Créations de chansons illimitées",
      "Tous les styles actuels & futurs",
      "Téléchargement WAV & MP3 Masterisé",
      "Droits d'usage commercial inclus",
      "Accès prioritaire aux nouvelles voix IA",
      "Support VIP 7j/7",
    ],
    cta: "Souscrire à l'Illimité",
    disabled: false,
  },
];

export default function CreditsPage() {
  const { showToast } = useToast();

  const handleBuy = (packName: string) => {
    showToast(`Redirection vers la passerelle de paiement sécurisée pour ${packName}...`, "info");
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header with Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-nzembo-violet/20 via-nzembo-card to-nzembo-cyan/10 border border-nzembo-violet/30">
        <div>
          <span className="text-xs uppercase tracking-wider text-nzembo-cyan font-bold">
            Votre Solde
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">3 Crédits Nzembo</h1>
          <p className="text-sm text-nzembo-muted mt-1">
            Chaque crédit vous permet de générer 1 chanson complète originale.
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-nzembo-violet to-nzembo-cyan flex items-center justify-center text-3xl shadow-lg shadow-nzembo-violet/30">
            💎
          </div>
        </div>
      </div>

      {/* Pricing Packs */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Recharger des crédits</h2>
        <p className="text-sm text-nzembo-muted mb-6">
          Choisissez l&apos;offre adaptée à vos besoins musicaux.
        </p>

        <div className="grid gap-6">
          {creditPacks.map((pack, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl relative transition-all duration-300 ${
                pack.popular
                  ? "bg-gradient-to-b from-nzembo-violet/25 to-nzembo-cyan/10 border-2 border-nzembo-violet/60 shadow-xl shadow-nzembo-violet/20"
                  : "nz-card"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-nzembo-violet to-nzembo-cyan text-white shadow-md">
                  ⭐ Plus Populaire
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{pack.name}</h3>
                  <p className="text-xs text-nzembo-muted mt-0.5">{pack.desc}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-2xl sm:text-3xl font-black text-white">{pack.price}</span>
                  {pack.period && (
                    <span className="text-xs text-nzembo-muted">{pack.period}</span>
                  )}
                  <p className="text-xs font-semibold text-nzembo-cyan mt-0.5">{pack.credits}</p>
                </div>
              </div>

              <ul className="grid sm:grid-cols-2 gap-2.5 my-4 pt-4 border-t border-nzembo-violet/15 text-xs text-white/80">
                {pack.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-nzembo-cyan">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={pack.disabled}
                onClick={() => handleBuy(pack.name)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2 ${
                  pack.disabled
                    ? "bg-nzembo-card/80 text-nzembo-subtle cursor-default"
                    : pack.popular
                    ? "btn-gradient justify-center"
                    : "border border-nzembo-violet/40 hover:bg-nzembo-violet/10 text-white"
                }`}
              >
                {pack.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
