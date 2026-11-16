"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Comment fonctionne Nzembo ?",
    a: "Nzembo utilise l'intelligence artificielle pour créer des chansons personnalisées. Tu décris ton moment, choisis un style musical, et notre IA compose des paroles et une mélodie uniques en quelques minutes.",
  },
  {
    q: "Combien de temps faut-il pour créer une chanson ?",
    a: "La génération prend entre 2 et 5 minutes. Tu peux écouter et télécharger ta chanson dès qu'elle est prête.",
  },
  {
    q: "Quels styles musicaux sont disponibles ?",
    a: "Nous proposons une grande variété de styles : Rumba Congolaise, Afrobeat, Ndombolo, R&B, Pop, Acoustique, Amapiano, Coupé-Décalé, et bien d'autres. Nous ajoutons régulièrement de nouveaux styles.",
  },
  {
    q: "Puis-je modifier les paroles ?",
    a: "Tu peux guider la création en fournissant des détails, des anecdotes et des mots clés. L'IA s'en inspire pour composer des paroles authentiques et personnalisées.",
  },
  {
    q: "Les chansons m'appartiennent-elles ?",
    a: "Oui, les chansons que tu crées t'appartiennent. Tu peux les télécharger, les partager et les utiliser pour tes événements personnels.",
  },
  {
    q: "Comment contacter le support ?",
    a: "Tu peux nous écrire à contact@nzembo.com. Notre équipe répond généralement sous 24 heures.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-nzembo-violet/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-semibold text-lg pr-4 group-hover:text-nzembo-cyan transition-colors">
          {q}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className={`flex-shrink-0 text-nzembo-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M5 8l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-nzembo-muted leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-24 px-4 bg-nzembo-dark">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Questions <span className="gradient-text">fréquentes</span>
          </h2>
          <p className="text-nzembo-muted text-lg">
            Tout ce que tu dois savoir pour créer ta chanson.
          </p>
        </div>

        <div className="nz-card p-6 sm:p-8">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
