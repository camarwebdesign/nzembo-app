"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";

interface CreditPack {
  id: string;
  name: string;
  price: string;
  amount: number;
  currency: string;
  period?: string;
  credits: string;
  creditsCount: number;
  desc: string;
  popular: boolean;
  features: string[];
  cta: string;
  disabled: boolean;
}

const creditPacks: CreditPack[] = [
  {
    id: "pack_decouverte",
    name: "Découverte",
    price: "Gratuit",
    amount: 0,
    currency: "EUR",
    credits: "1 chanson",
    creditsCount: 1,
    desc: "Parfait pour essayer Nzembo et tester votre premier morceau.",
    popular: false,
    features: ["1 génération complète", "Styles de base inclus", "Écoute en ligne", "Aperçu de 30 secondes"],
    cta: "Pack Actuel",
    disabled: true,
  },
  {
    id: "pack_createur",
    name: "Pack Créateur",
    price: "9,99€",
    amount: 9.99,
    currency: "EUR",
    credits: "5 chansons",
    creditsCount: 5,
    desc: "Le choix idéal pour surprendre vos proches lors de vos événements.",
    popular: true,
    features: [
      "5 chansons personnalisées",
      "Tous les styles musicaux",
      "Téléchargement MP3 Haute Définition",
      "Droits d'usage personnel",
      "Support prioritaire par email",
    ],
    cta: "Acheter maintenant",
    disabled: false,
  },
  {
    id: "pack_illimite",
    name: "Abonnement Illimité",
    price: "24,99€",
    amount: 24.99,
    currency: "EUR",
    period: "/mois",
    credits: "50 crédits studio",
    creditsCount: 50,
    desc: "Pour les créateurs, animateurs et mélomanes sans limite.",
    popular: false,
    features: [
      "50 créations de chansons incluses",
      "Tous les styles actuels & futurs",
      "Téléchargement WAV & MP3 Masterisé",
      "Droits d'usage commercial inclus",
      "Accès prioritaire aux nouvelles voix IA",
      "Support VIP 7j/7",
    ],
    cta: "Acheter maintenant",
    disabled: false,
  },
];

function getBackendUrl(): string {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000";
  }
  return typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
}

function getActiveUser(): { id: string; email: string; name: string } {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("nzembo_auth_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          return {
            id: String(parsed.id),
            email: String(parsed.email || "client@nzembo.com"),
            name: String(parsed.name || "Créateur Nzembo"),
          };
        }
      }
    } catch {}
  }
  return { id: "usr_84920", email: "demo@nzembo.com", name: "Utilisateur Démo" };
}

export default function CreditsPage() {
  const { showToast } = useToast();
  const [balance, setBalance] = useState<number>(3);
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<boolean>(false);

  useEffect(() => {
    const backendUrl = getBackendUrl();
    const user = getActiveUser();

    fetch(`${backendUrl}/api/users/${encodeURIComponent(user.id)}/credits?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.success && typeof d.credits === "number") {
          setBalance(d.credits);
        }
      })
      .catch(() => {});

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "saspay" && params.get("order_id")) {
      const orderId = params.get("order_id")!;
      setVerifyingPayment(true);
      fetch(`${backendUrl}/api/payments/saspay/verify/${encodeURIComponent(orderId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.verified && data.status === "SUCCESS") {
            const newBalance = typeof data.balance === "number" ? data.balance : balance + (data.credits || 0);
            setBalance(newBalance);
            try {
              localStorage.setItem("nzembo_user_credits", String(newBalance));
            } catch {}
            showToast(
              `Paiement SasPay confirmé ! +${data.credits} crédits ajoutés. Nouveau solde : ${newBalance} crédits.`,
              "success"
            );
            window.history.replaceState(null, "", window.location.pathname);
          } else if (data && data.status === "PENDING") {
            showToast("Paiement en cours de confirmation auprès de SasPay...", "info");
          } else {
            showToast("Le paiement SasPay n'a pas été validé.", "error");
            window.history.replaceState(null, "", window.location.pathname);
          }
        })
        .catch(() => {
          showToast("Impossible de vérifier le statut du paiement pour le moment.", "error");
        })
        .finally(() => setVerifyingPayment(false));
    }
  }, []);

  const handleBuy = async (pack: CreditPack) => {
    if (pack.disabled || loadingPackId) return;
    setLoadingPackId(pack.id);
    showToast(`Initialisation du paiement sécurisé SasPay pour ${pack.name}...`, "info");

    try {
      const backendUrl = getBackendUrl();
      const user = getActiveUser();
      const res = await fetch(`${backendUrl}/api/payments/saspay/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          user_name: user.name,
          pack_id: pack.id,
          pack_name: pack.name,
          credits: pack.creditsCount,
          currency: pack.currency,
          frontend_return_url: `${window.location.origin}${window.location.pathname}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.checkoutUrl) {
        throw new Error(data.error || "Erreur lors de l'initialisation SasPay.");
      }

      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion au serveur de paiement.";
      showToast(msg, "error");
      setLoadingPackId(null);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header with Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-nzembo-violet/20 via-nzembo-card to-nzembo-cyan/10 border border-nzembo-violet/30">
        <div>
          <span className="text-xs uppercase tracking-wider text-nzembo-cyan font-bold">
            Votre Solde
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            {verifyingPayment ? "Vérification..." : `${balance} Crédits Nzembo`}
          </h1>
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
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
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
                disabled={pack.disabled || loadingPackId !== null}
                onClick={() => handleBuy(pack)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2 ${
                  pack.disabled
                    ? "bg-nzembo-card/80 text-nzembo-subtle cursor-default"
                    : pack.popular
                    ? "btn-gradient justify-center"
                    : "border border-nzembo-violet/40 hover:bg-nzembo-violet/10 text-white"
                }`}
              >
                {loadingPackId === pack.id ? "Redirection vers SasPay..." : pack.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
