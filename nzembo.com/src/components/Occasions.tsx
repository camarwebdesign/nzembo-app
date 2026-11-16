"use client";

const occasions = [
  { emoji: "🎂", title: "Anniversaires", desc: "Offre un cadeau musical unique pour célébrer une année de plus." },
  { emoji: "💒", title: "Mariages", desc: "Crée la chanson parfaite pour le plus beau jour de leur vie." },
  { emoji: "🎓", title: "Diplômes & Réussites", desc: "Félicite un accomplissement avec une chanson sur mesure." },
  { emoji: "🕊️", title: "Hommages", desc: "Rends hommage à un être cher avec des mots mis en musique." },
  { emoji: "👶", title: "Naissances & Baptêmes", desc: "Accueille un nouveau-né avec une mélodie pleine de tendresse." },
  { emoji: "❤️", title: "Déclarations d'amour", desc: "Exprime tes sentiments avec une chanson qui vient du cœur." },
];

export default function Occasions() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pour chaque moment qui <span className="gradient-text">compte</span>
          </h2>
          <p className="text-nzembo-muted text-base max-w-xl mx-auto">
            Une mélodie adaptée et des paroles soignées pour chaque événement marquant.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {occasions.map((item, idx) => (
            <div
              key={idx}
              className="reveal nz-card p-8 text-center hover:border-nzembo-violet/40 cursor-default group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {item.emoji}
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-nzembo-muted text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
