"use client";

const testimonials = [
  {
    quote: "J'ai offert une chanson personnalisée à ma mère pour ses 60 ans. Elle a pleuré de joie en l'écoutant. Nzembo a rendu ce moment magique.",
    name: "Esther M.",
    context: "Anniversaire",
    color: "#7C3AED",
  },
  {
    quote: "Pour notre mariage, on voulait quelque chose d'unique. La chanson créée par Nzembo a ouvert le bal et tous les invités ont adoré.",
    name: "Patrick & Sylvie K.",
    context: "Mariage",
    color: "#06B6D4",
  },
  {
    quote: "Mon fils a reçu son BAC et je voulais le surprendre. En 5 minutes, j'ai créé un son Afrobeat avec son prénom. Il était tellement fier !",
    name: "Jean-Claude B.",
    context: "Réussite",
    color: "#8B5CF6",
  },
  {
    quote: "J'utilise Nzembo pour animer mes événements. Chaque chanson est unique et les clients sont toujours impressionnés.",
    name: "Amina D.",
    context: "Événementiel",
    color: "#14B8A6",
  },
];

export default function Testimonials() {
  return (
    <section id="avis" className="py-24 px-4 bg-nzembo-dark">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ils ont marqué le coup avec{" "}
            <span className="gradient-text">Nzembo</span>
          </h2>
          <p className="text-nzembo-muted text-lg max-w-xl mx-auto">
            Découvrez comment ils ont sublimé leurs moments avec une chanson unique.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="reveal nz-card p-8 relative">
              {/* Quote mark */}
              <div
                className="absolute top-4 right-6 text-6xl font-serif opacity-10"
                style={{ color: t.color }}
              >
                &ldquo;
              </div>

              {/* Context badge */}
              <span
                className="inline-block text-xs px-3 py-1 rounded-full font-medium mb-4"
                style={{ background: `${t.color}20`, color: t.color }}
              >
                {t.context}
              </span>

              {/* Quote */}
              <p className="text-white/90 leading-relaxed mb-6 text-lg italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}
                >
                  {t.name.charAt(0)}
                </div>
                <span className="font-semibold text-white">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
