"use client";

import React, { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { config } from "@/lib/config";

export default function ProfilePage() {
  const { showToast } = useToast();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [highQualityAudio, setHighQualityAudio] = useState(true);
  const [preferredLanguage, setPreferredLanguage] = useState("Français");

  const handleSaveSettings = () => {
    showToast("Préférences sauvegardées avec succès !", "success");
  };

  const handleClearData = () => {
    if (confirm("Voulez-vous réinitialiser vos créations locales de démonstration ?")) {
      localStorage.removeItem("nzembo_user_songs");
      showToast("Données locales réinitialisées.", "info");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Mon Profil</h1>
        <p className="text-nzembo-muted text-sm mt-1">
          Gérez vos informations de compte et vos préférences audio.
        </p>
      </div>

      {/* User Card */}
      <div className="nz-card p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-nzembo-violet to-nzembo-cyan flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-nzembo-violet/30 flex-shrink-0">
          U
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-bold text-white">Utilisateur Démo</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-nzembo-violet/20 text-nzembo-cyan border border-nzembo-violet/30 font-medium self-center sm:self-auto">
              Membre Standard
            </span>
          </div>
          <p className="text-sm text-nzembo-muted mt-1">demo@nzembo.com</p>
          <p className="text-xs text-nzembo-subtle mt-1">Inscrit en Octobre 2026</p>
        </div>
      </div>

      {/* Settings */}
      <div className="nz-card p-6 space-y-5">
        <h3 className="text-base font-bold text-white pb-3 border-b border-nzembo-violet/15">
          Préférences & Audio
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Rendu audio haute fidélité</p>
              <p className="text-xs text-nzembo-muted">Active le mixage 320 kbps stéréo</p>
            </div>
            <button
              type="button"
              onClick={() => setHighQualityAudio(!highQualityAudio)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                highQualityAudio ? "bg-nzembo-violet" : "bg-nzembo-card border border-nzembo-violet/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  highQualityAudio ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Notifications de génération prête</p>
              <p className="text-xs text-nzembo-muted">Recevoir un email quand la chanson est disponible</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailNotifs(!emailNotifs)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                emailNotifs ? "bg-nzembo-violet" : "bg-nzembo-card border border-nzembo-violet/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  emailNotifs ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Langue de l&apos;interface
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="nz-input cursor-pointer text-sm"
            >
              <option value="Français" className="bg-nzembo-dark">Français</option>
              <option value="English" className="bg-nzembo-dark">English</option>
              <option value="Lingala" className="bg-nzembo-dark">Lingála</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="btn-gradient text-sm py-2.5 px-6 mt-4"
        >
          Enregistrer les modifications
        </button>
      </div>

      {/* Integration Info Card */}
      <div className="nz-card p-6 bg-gradient-to-br from-nzembo-card/40 to-nzembo-night border border-nzembo-cyan/30">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🔌</span>
          <h3 className="text-base font-bold text-white">Connexion API Musicale IA</h3>
        </div>
        <p className="text-xs text-nzembo-muted leading-relaxed">
          Cette application intègre une couche d&apos;abstraction serveur dans <code className="text-nzembo-cyan">src/lib/music-api.ts</code>. Vous pouvez connecter le moteur Nzembo Studio IA ou votre propre microservice musical via les variables d&apos;environnement sans retoucher l&apos;interface.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="nz-card p-6 border-red-500/20">
        <h3 className="text-sm font-bold text-red-400 mb-3">Zone de maintenance</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleClearData}
            className="text-xs py-2 px-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Effacer les données de démonstration
          </button>
          <a
            href={`${config.landingUrl}`}
            className="text-xs py-2 px-4 rounded-xl border border-nzembo-violet/30 text-nzembo-muted hover:text-white transition-colors text-center"
          >
            Se déconnecter et retourner au site
          </a>
        </div>
      </div>
    </div>
  );
}
