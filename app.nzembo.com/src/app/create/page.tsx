"use client";

import React, { useState, useEffect } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";

const occasions = [
  { id: "anniversaire", label: "Anniversaire", emoji: "🎂", desc: "Célébrer une année de plus" },
  { id: "mariage", label: "Mariage", emoji: "💒", desc: "Le plus beau jour d'une vie" },
  { id: "diplome", label: "Diplôme & Réussite", emoji: "🎓", desc: "Célébrer une victoire" },
  { id: "hommage", label: "Hommage", emoji: "🕊️", desc: "Honorer un être cher" },
  { id: "naissance", label: "Naissance & Baptême", emoji: "👶", desc: "Bienvenue au monde" },
  { id: "amour", label: "Déclaration d'amour", emoji: "❤️", desc: "Des sentiments en musique" },
  { id: "fete", label: "Fête & Célébration", emoji: "🎉", desc: "Ambiance et joie" },
  { id: "autre", label: "Autre occasion", emoji: "✨", desc: "Un moment sur-mesure" },
];

const styles = [
  { id: "rumba", label: "Rumba Congolaise", icon: "🥁", desc: "Douceur, guitare rythmée, poésie" },
  { id: "afrobeat", label: "Afrobeat", icon: "🎺", desc: "Énergie entraînante et moderne" },
  { id: "ndombolo", label: "Ndombolo", icon: "💃", desc: "Chaleur dansante et festive" },
  { id: "rnb", label: "R&B", icon: "🎤", desc: "Sensible, suave et mélodique" },
  { id: "pop", label: "Pop", icon: "🎸", desc: "Refrain accrocheur et lumineux" },
  { id: "acoustique", label: "Acoustique", icon: "🎹", desc: "Intime, guitare et piano doux" },
  { id: "amapiano", label: "Amapiano", icon: "🔊", desc: "Basses profondes et groove posé" },
  { id: "coupe_decale", label: "Coupé-Décalé", icon: "🎶", desc: "Dynamisme pur et ambiance festive" },
];

const relationships = [
  "Mon père",
  "Ma mère",
  "Mon frère",
  "Ma sœur",
  "Mon ami(e)",
  "Mon/Ma partenaire",
  "Mon enfant",
  "Mon collègue",
  "Moi-même",
  "Autre",
];

const languages = [
  "Français",
  "Lingala",
  "Français & Lingala (Mélange)",
  "Anglais",
  "Swahili",
  "Autre",
];

const generatingSteps = [
  "Analyse de votre histoire et de l'émotion...",
  "Composition des paroles originales et des refrains...",
  "Génération de la ligne mélodique et harmonisation...",
  "Enregistrement de la voix et arrangement musical...",
  "Mixage studio et mastering en haute définition...",
];

export default function CreateSongPage() {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [occasion, setOccasion] = useState(occasions[0].id);
  const [style, setStyle] = useState(styles[0].id);
  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState(relationships[0]);
  const [language, setLanguage] = useState(languages[0]);
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [generatingMessageIndex, setGeneratingMessageIndex] = useState(0);
  const [completedSong, setCompletedSong] = useState<{
    id: string;
    title: string;
    style: string;
    lyrics: string;
    recipientName: string;
    occasion: string;
    date: string;
  } | null>(null);

  // Validation
  const isStep3Valid = recipientName.trim().length > 0;
  const isStep4Valid = description.trim().length >= 20;

  const handleStartGeneration = () => {
    setIsGenerating(true);
    setGeneratingProgress(0);
    setGeneratingMessageIndex(0);

    const interval = setInterval(() => {
      setGeneratingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          finishGeneration();
          return 100;
        }
        const next = prev + 2;
        const msgIndex = Math.min(
          generatingSteps.length - 1,
          Math.floor((next / 100) * generatingSteps.length)
        );
        setGeneratingMessageIndex(msgIndex);
        return next;
      });
    }, 60);
  };

  const finishGeneration = () => {
    const selectedOccasion = occasions.find((o) => o.id === occasion)?.label || "Moment spécial";
    const selectedStyle = styles.find((s) => s.id === style)?.label || "Afrobeat";
    const songTitle = `Chanson pour ${recipientName} — ${selectedOccasion}`;

    const newSong = {
      id: `nz-${Date.now()}`,
      title: songTitle,
      style: selectedStyle,
      occasion: selectedOccasion,
      recipientName,
      date: new Date().toLocaleDateString("fr-FR"),
      lyrics: `[Couplet 1]\nPour toi ${recipientName}, aujourd'hui résonne notre mélodie,\n${description}\nChaque note est un souvenir, une promesse gravée pour la vie.\n\n[Refrain - ${selectedStyle}]\nNzembo ya bolingo, nzembo ya esengo,\nPour ${recipientName}, célébrons ce grand jour avec amour !\nQue le rythme de nos cœurs t'accompagne toujours,\nNzembo na biso, jusqu'à l'aube du jour.\n\n[Couplet 2]\n${keywords ? `Souviens-toi : "${keywords}". ` : ""}Rien ne pourra effacer cette joie qui nous unit.\nChantons ensemble, célébrons la vie !`,
    };

    setCompletedSong(newSong);
    setIsGenerating(false);

    // Save to local storage for My Songs page
    try {
      const existing = JSON.parse(localStorage.getItem("nzembo_user_songs") || "[]");
      localStorage.setItem("nzembo_user_songs", JSON.stringify([newSong, ...existing]));
    } catch {
      // ignore
    }

    showToast("Votre chanson Nzembo a été générée avec succès !", "success");
  };

  const handleDownload = () => {
    showToast("Le téléchargement MP3 haute fidélité est réservé aux forfaits Créateur & Illimité.", "info");
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Lien de partage copié dans le presse-papier !", "success");
    } else {
      showToast("Lien prêt à être partagé !", "success");
    }
  };

  const resetForm = () => {
    setCompletedSong(null);
    setCurrentStep(1);
    setDescription("");
    setRecipientName("");
    setKeywords("");
  };

  // 1. GENERATING STATE
  if (isGenerating) {
    return (
      <div className="py-12 px-4 text-center animate-fade-in-up">
        <div className="w-24 h-24 mx-auto mb-8 relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-nzembo-violet/20 border-t-nzembo-cyan animate-spin" />
          <span className="text-4xl">🎵</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Création de votre chanson en cours...
        </h2>
        <p className="text-nzembo-muted mb-8 max-w-md mx-auto min-h-[48px]">
          {generatingSteps[generatingMessageIndex]}
        </p>

        {/* Progress bar */}
        <div className="max-w-md mx-auto bg-nzembo-card h-3 rounded-full overflow-hidden border border-nzembo-violet/30 mb-4">
          <div
            className="h-full bg-gradient-to-r from-nzembo-violet to-nzembo-cyan transition-all duration-150"
            style={{ width: `${generatingProgress}%` }}
          />
        </div>
        <p className="text-sm font-semibold text-nzembo-cyan">{generatingProgress}%</p>

        {/* Dynamic visual equalizer */}
        <div className="flex items-center justify-center gap-1.5 mt-8 h-12">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-nzembo-violet to-nzembo-cyan rounded-full animate-pulse"
              style={{
                height: `${12 + ((i * 7) % 36)}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // 2. RESULT STATE
  if (completedSong) {
    return (
      <div className="animate-fade-in-up space-y-6">
        {/* Production status banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-nzembo-violet/30 to-nzembo-cyan/20 border border-nzembo-cyan/40 text-center">
          <p className="text-sm font-medium text-white flex items-center justify-center gap-2">
            <span>✨</span>
            <span>
              <strong>Nzembo Studio IA :</strong> Moteur audio haute définition connecté pour la création musicale.
            </span>
          </p>
        </div>

        <div className="text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Votre chanson est prête !
          </h1>
          <p className="text-nzembo-muted mt-1">
            Créée spécialement pour {completedSong.recipientName}
          </p>
        </div>

        {/* Audio Player with waveform */}
        <AudioPlayer
          title={completedSong.title}
          style={completedSong.style}
          duration={195}
        />

        {/* Lyrics preview */}
        <div className="nz-card p-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>📜</span> Paroles composées
          </h3>
          <div className="bg-nzembo-night/70 p-4 rounded-xl border border-nzembo-violet/10 font-mono text-sm text-nzembo-muted whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
            {completedSong.lyrics}
          </div>
        </div>

        {/* Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={handleDownload}
            className="btn-gradient w-full py-3.5 justify-center"
          >
            📥 Télécharger MP3 HD
          </button>
          <button
            onClick={handleShare}
            className="btn-secondary w-full py-3.5 justify-center"
          >
            🔗 Partager la chanson
          </button>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={resetForm}
            className="text-nzembo-muted hover:text-white transition-colors text-sm underline"
          >
            + Créer une autre chanson
          </button>
        </div>
      </div>
    );
  }

  // 3. STEP WIZARD
  return (
    <div className="animate-fade-in-up">
      {/* Step Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-nzembo-muted mb-2">
          <span>Étape {currentStep} sur 5</span>
          <span>
            {currentStep === 1 && "Occasion"}
            {currentStep === 2 && "Style musical"}
            {currentStep === 3 && "Destinataire"}
            {currentStep === 4 && "Votre histoire"}
            {currentStep === 5 && "Confirmation"}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-nzembo-card h-2 rounded-full overflow-hidden border border-nzembo-violet/20">
          <div
            className="h-full bg-gradient-to-r from-nzembo-violet to-nzembo-cyan transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: OCCASION */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Pour quelle occasion ?</h2>
            <p className="text-nzembo-muted text-sm mt-1">
              Sélectionnez le moment que vous souhaitez célébrer.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
            {occasions.map((item) => {
              const isSelected = occasion === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setOccasion(item.id)}
                  type="button"
                  className={`p-4 rounded-xl text-left transition-all duration-200 border ${
                    isSelected
                      ? "bg-gradient-to-br from-nzembo-violet/30 to-nzembo-cyan/20 border-nzembo-cyan shadow-lg shadow-nzembo-violet/20 scale-[1.02]"
                      : "bg-nzembo-card/60 border-nzembo-violet/15 hover:border-nzembo-violet/40"
                  }`}
                >
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">{item.label}</h3>
                  <p className="text-xs text-nzembo-muted mt-0.5 line-clamp-1">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: STYLE */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Quel style musical ?</h2>
            <p className="text-nzembo-muted text-sm mt-1">
              Choisissez le rythme et l&apos;ambiance sonore de votre chanson.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
            {styles.map((item) => {
              const isSelected = style === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setStyle(item.id)}
                  type="button"
                  className={`p-4 rounded-xl text-left transition-all duration-200 border ${
                    isSelected
                      ? "bg-gradient-to-br from-nzembo-violet/30 to-nzembo-cyan/20 border-nzembo-cyan shadow-lg shadow-nzembo-violet/20 scale-[1.02]"
                      : "bg-nzembo-card/60 border-nzembo-violet/15 hover:border-nzembo-violet/40"
                  }`}
                >
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">{item.label}</h3>
                  <p className="text-xs text-nzembo-muted mt-0.5 line-clamp-1">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: RECIPIENT INFO */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Parle-nous de cette personne</h2>
            <p className="text-nzembo-muted text-sm mt-1">
              Ces détails permettent à l&apos;IA de nommer et personnaliser chaque strophe.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Prénom du destinataire <span className="text-nzembo-cyan">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex : Sarah, Patrick, Maman Jeanne..."
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="nz-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Votre lien avec cette personne
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="nz-input cursor-pointer"
              >
                {relationships.map((rel) => (
                  <option key={rel} value={rel} className="bg-nzembo-dark text-white">
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Langue de la chanson
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="nz-input cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang} className="bg-nzembo-dark text-white">
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: DESCRIPTION & ANECDOTES */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Raconte ton histoire</h2>
            <p className="text-nzembo-muted text-sm mt-1">
              Partage les souvenirs, les anecdotes, les qualités ou le message que tu veux transmettre.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white">
                  Message & Anecdotes <span className="text-nzembo-cyan">*</span>
                </label>
                <span
                  className={`text-xs ${
                    description.length < 20 ? "text-nzembo-error" : "text-nzembo-muted"
                  }`}
                >
                  {description.length} / 500 car. (min 20)
                </span>
              </div>
              <textarea
                rows={5}
                maxLength={500}
                placeholder="Ex : Je veux remercier ma mère pour son courage, ses plats délicieux du dimanche, son rire communicatif et la façon dont elle a toujours cru en moi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="nz-input resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Mots-clés ou expressions à inclure (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex : Matondo, Reine de la famille, Courage..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="nz-input"
              />
            </div>

            <div className="p-4 rounded-xl bg-nzembo-violet/10 border border-nzembo-violet/20 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <p className="text-xs text-nzembo-muted leading-relaxed">
                <strong>Conseil Nzembo :</strong> Plus vos détails sont précis et chaleureux, plus les paroles composées par l&apos;IA seront émouvantes et fidèles à votre complicité.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: SUMMARY & GENERATE */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Récapitulatif de votre chanson</h2>
            <p className="text-nzembo-muted text-sm mt-1">
              Vérifiez vos choix avant de lancer la génération musicale.
            </p>
          </div>

          <div className="nz-card p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-nzembo-violet/15">
              <div>
                <span className="text-xs text-nzembo-muted">Occasion</span>
                <p className="text-sm font-semibold text-white">
                  {occasions.find((o) => o.id === occasion)?.emoji}{" "}
                  {occasions.find((o) => o.id === occasion)?.label}
                </p>
              </div>
              <div>
                <span className="text-xs text-nzembo-muted">Style musical</span>
                <p className="text-sm font-semibold text-white">
                  {styles.find((s) => s.id === style)?.icon}{" "}
                  {styles.find((s) => s.id === style)?.label}
                </p>
              </div>
              <div>
                <span className="text-xs text-nzembo-muted">Destinataire</span>
                <p className="text-sm font-semibold text-white">
                  {recipientName} ({relationship})
                </p>
              </div>
              <div>
                <span className="text-xs text-nzembo-muted">Langue</span>
                <p className="text-sm font-semibold text-white">{language}</p>
              </div>
            </div>

            <div>
              <span className="text-xs text-nzembo-muted">Votre message personnalisé</span>
              <p className="text-sm text-white/90 mt-1 italic leading-relaxed">
                &ldquo;{description}&rdquo;
              </p>
              {keywords && (
                <p className="text-xs text-nzembo-cyan mt-2">
                  Mots-clés : {keywords}
                </p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-nzembo-card flex items-center justify-between border border-nzembo-violet/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💎</span>
              <div>
                <p className="text-sm font-semibold text-white">Coût de génération</p>
                <p className="text-xs text-nzembo-muted">Temps estimé : 2 à 3 minutes</p>
              </div>
            </div>
            <span className="text-sm font-bold text-nzembo-cyan">1 Crédit</span>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-nzembo-violet/10">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="btn-secondary text-sm py-3 px-6"
          >
            ← Retour
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            disabled={
              (currentStep === 3 && !isStep3Valid) ||
              (currentStep === 4 && !isStep4Valid)
            }
            onClick={() => setCurrentStep((prev) => prev + 1)}
            className="btn-gradient text-sm py-3 px-8"
          >
            Continuer →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartGeneration}
            className="btn-gradient text-sm py-3.5 px-8 animate-pulse-glow"
          >
            ✨ Générer ma chanson
          </button>
        )}
      </div>
    </div>
  );
}
