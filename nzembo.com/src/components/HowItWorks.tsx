"use client";

const steps = [
  {
    num: "1",
    title: "Racontez votre histoire",
    description:
      "Indiquez le prénom, l'occasion et vos anecdotes. Choisissez le genre : Rumba, Afrobeat, Ndombolo, R&B ou Amapiano.",
  },
  {
    num: "2",
    title: "La mélodie et la voix s'enregistrent",
    description:
      "Le studio rédige les strophes, arrange les instruments (guitares, basse, percussions) et pose une voix harmonieuse.",
  },
  {
    num: "3",
    title: "Écoutez et téléchargez",
    description:
      "Votre morceau masterisé est prêt. Écoutez-le directement et téléchargez le fichier audio prêt à être partagé.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Trois étapes, de l'idée au morceau fini
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
            Un déroulé simple, pensé pour écouter et partager sans complication.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-nzembo-card/40 p-6 rounded-2xl border border-slate-200/80 dark:border-nzembo-violet/15 text-left shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-nzembo-violet/20 text-nzembo-violet dark:text-cyan-300 flex items-center justify-center font-bold text-sm mb-4">
                {step.num}
              </div>

              <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">{step.title}</h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
