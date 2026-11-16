import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Nzembo — Crée ta musique avec l'IA",
  description:
    "Transforme tes émotions en musique. Crée des chansons personnalisées pour chaque moment de ta vie grâce à l'intelligence artificielle.",
  keywords:
    "musique, IA, chanson personnalisée, Afrique, Rumba, Afrobeat, Ndombolo, intelligence artificielle, cadeau musical",
  authors: [{ name: "Nzembo" }],
  openGraph: {
    title: "Nzembo — Crée ta musique avec l'IA",
    description:
      "Transforme tes émotions en musique. Crée des chansons personnalisées uniques grâce à l'IA.",
    siteName: "Nzembo",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nzembo — Crée ta musique avec l'IA",
    description:
      "Transforme tes émotions en musique. Crée des chansons personnalisées uniques grâce à l'IA.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased bg-nzembo-night text-nzembo-text">
        {children}
      </body>
    </html>
  );
}
