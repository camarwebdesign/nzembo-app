# 🎵 Nzembo — Plateforme SaaS de Création Musicale par IA

> **« Ta musique. Ton histoire. Avec l'IA. »**  
> *Inspiré du mot lingala signifiant « sa chanson ».*

---

## 📋 Table des Matières

1. [Vue d'Ensemble & Mission](#vue-densemble--mission)
2. [Architecture du Projet](#architecture-du-projet)
3. [Identité de Marque & Design Original](#identité-de-marque--design-original)
4. [Synthèse de l'Audit des Références](#synthèse-de-laudit-des-références)
5. [Démarrage Rapide & URLs Locales](#démarrage-rapide--urls-locales)
6. [Connexion & Redirections entre les Projets](#connexion--redirections-entre-les-projets)
7. [Intégration d'une API Musicale Réelle](#intégration-dune-api-musicale-réelle)
8. [Guide de Déploiement en Production](#guide-de-déploiement-en-production)
9. [Matrice des Fonctionnalités](#matrice-des-fonctionnalités)

---

## 1. Vue d'Ensemble & Mission

**Nzembo** est une solution SaaS complète et indépendante dédiée à la création de chansons personnalisées générées par intelligence artificielle pour tous les moments forts de la vie (anniversaires, mariages, baptêmes, réussites, hommages, déclarations d'amour).

Le projet s'inspire de l'ergonomie, de la clarté et de la simplicité observées sur les références [Izimelo](https://www.izimelo.com/) et [App Izimelo](https://app.izimelo.com/), tout en développant :
- Une **identité visuelle 100% originale** (palette sombre violet profond `#7C3AED` et cyan vibrant `#06B6D4`).
- Un **logo vectoriel SVG exclusif** combinant un `N` stylisé et la propagation d'ondes sonores harmoniques.
- Des **textes, styles musicaux (Rumba Congolaise, Afrobeat, Ndombolo, R&B, Amapiano, etc.) et témoignages totalement originaux**.
- Une **architecture découplée** en deux sous-projets indépendants reliés par des variables d'environnement.

---

## 2. Architecture du Projet

Le dépôt est scindé en deux répertoires de travail distincts à la racine :

```text
nzembo/
├── BRAND_GUIDELINES.md          # Charte graphique complète & règles de marque
├── AUDIT_REFERENCES.md          # Audit exhaustif d'izimelo.com et app.izimelo.com
├── README.md                    # Documentation centrale et guide opérationnel
│
├── nzembo.com/                  # 🌐 Site Marketing & Landing Page (Port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout avec polices Inter & Space Grotesk
│   │   │   ├── page.tsx         # Assemblage dynamique avec Intersection Observer
│   │   │   └── globals.css      # Thème Tailwind v4, animations & glassmorphism
│   │   └── components/
│   │       ├── NzemboLogo.tsx   # Composant Logo SVG adaptatif (sm, md, lg, icône)
│   │       ├── Header.tsx       # Navigation sticky avec flou glass & CTA connectés
│   │       ├── Hero.tsx         # Hero section avec ondes sonores et CTA pulse
│   │       ├── HowItWorks.tsx   # Parcours en 3 étapes numérotées
│   │       ├── SongExamples.tsx # 6 lecteurs audio interactifs avec animations d'ondes
│   │       ├── Occasions.tsx    # Grille de 6 occasions de célébration
│   │       ├── Testimonials.tsx # 4 avis originaux et authentiques
│   │       ├── Pricing.tsx      # Grille tarifaire (Découverte, Créateur, Illimité)
│   │       ├── FAQ.tsx          # Accordéon interactif complet (6 questions/réponses)
│   │       ├── FinalCTA.tsx     # Appel à l'action final avec halo lumineux
│   │       └── Footer.tsx       # Liens légaux, réseaux sociaux et copyright
│   ├── .env.local               # URL de l'app en local (http://localhost:3001)
│   ├── .env.production          # URL de l'app en prod (https://app.nzembo.com)
│   └── package.json
│
└── app.nzembo.com/              # 🎧 Application SaaS Musicale (Port 3001)
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx       # Layout avec ToastProvider et AppShell unifié
    │   │   ├── page.tsx         # Dashboard d'accueil & statistiques
    │   │   ├── create/
    │   │   │   └── page.tsx     # Wizard de création en 5 étapes + génération animée
    │   │   ├── songs/
    │   │   │   ├── page.tsx     # Bibliothèque de chansons & filtrage par style
    │   │   │   └── [id]/
    │   │   │       └── page.tsx # Fiche chanson avec lecteur audio, waveform & paroles
    │   │   ├── credits/
    │   │   │   └── page.tsx     # Gestion du solde et recharge de crédits
    │   │   ├── profile/
    │   │   │   └── page.tsx     # Préférences audio, langue, notifications & zone de maintenance
    │   │   ├── login/
    │   │   │   └── page.tsx     # Écran d'authentification connecté au thème Nzembo
    │   │   └── register/
    │   │       └── page.tsx     # Écran d'inscription avec cadeau de bienvenue
    │   ├── components/
    │   │   ├── AppShell.tsx     # Sidebar desktop (w-64) + Bottom nav mobile responsive
    │   │   ├── AudioPlayer.tsx  # Lecteur audio interactif avec waveform dynamique Web Audio
    │   │   ├── SongCard.tsx     # Carte chanson avec lecture directe et lien détail
    │   │   └── NzemboLogo.tsx   # Logo SVG vectoriel
    │   ├── contexts/
    │   │   └── ToastContext.tsx # Système de notifications toast fluide (succès, info, erreur)
    │   └── lib/
    │       ├── config.ts        # Configuration centralisée des URLs
    │       └── music-api.ts     # Couche d'abstraction serveur prête pour Suno/Udio/IA
    ├── .env.local               # Configuration locale des deux domaines
    ├── .env.production          # Configuration de production
    └── package.json
```

---

## 3. Identité de Marque & Design Original

L'identité Nzembo est documentée en détail dans [`BRAND_GUIDELINES.md`](./BRAND_GUIDELINES.md).

- **Couleurs Principales :**
  - **Violet Nzembo (`#7C3AED`)** : Noblesse, inspiration, profondeur émotionnelle.
  - **Cyan Nzembo (`#06B6D4`)** : Modernité technologique, clarté, vibration de la voix.
  - **Fonds sombres (`#0F0A1A`, `#1A1025`, `#2D2640`)** : Ambiance studio haut de gamme favorisant la mise en valeur des ondes sonores.
- **Logo Vectoriel SVG :**
  - Lettre `N` géométrique aux lignes épurées.
  - 3 ondes sonores concentriques rayonnant vers la droite.
  - Dégradé linéaire 135° violet-cyan.
  - Déclinaisons : Complète avec typographie *Space Grotesk*, Icône isolée pour favicon et avatar, et version monochrome.
- **Typographie :**
  - Titres de marque : *Space Grotesk* (audacieuse, musicale).
  - Corps et interface : *Inter* (lisibilité maximale et fluidité).

---

## 4. Synthèse de l'Audit des Références

L'audit détaillé est consigné dans [`AUDIT_REFERENCES.md`](./AUDIT_REFERENCES.md).

| Domaine | Observé sur Izimelo | Décision de Conception Nzembo |
|---|---|---|
| **Palette visuelle** | Tons beiges/orangés chauds (`#FDFCF0`) | Ambiance studio nocturne violet/cyan (`#0F0A1A`) |
| **Structure Landing** | Hero, Playlist 4 titres, Avis, FAQ, Footer | Hero étendu, 6 titres avec ondes, 6 occasions, 4 avis, Tarifs, FAQ 6 questions |
| **Lecteur Audio** | Barre de lecture simple | Lecteur audio avec waveform dynamique réactive et synthèse sonore Web Audio |
| **Parcours de Création** | Formulaire d'étapes (déduit du skeleton Next.js) | Wizard interactif complet en 5 étapes avec validation temps réel et estimation de durée |
| **Navigation App** | Sidebar desktop fixe (w-64) + barre mobile | AppShell moderne avec bouton central surélevé « Créer » sur mobile et badge de crédits |
| **Génération Audio** | Traitement en tâche de fond | Écran de génération immersif avec égaliseur animé, messages de progression cycliques et sauvegarde locale |

---

## 5. Démarrage Rapide & URLs Locales

### Prérequis
- Node.js version 18 ou supérieure
- NPM ou PNPM

### 1. Lancer la Landing Page (Site Marketing)
```bash
cd nzembo.com
npm install
npm run dev
```
> 🌐 Accessible sur : **http://localhost:3000**

### 2. Lancer l'Application Web (Plateforme de Création)
Ouvrez un second terminal :
```bash
cd app.nzembo.com
npm install
npm run dev
```
> 🎧 Accessible sur : **http://localhost:3001**

---

## 6. Connexion & Redirections entre les Projets

Tous les boutons d'action de la landing page pointent de manière centralisée vers l'application :

| Élément Landing Page | Destination en Développement | Destination en Production |
|---|---|---|
| **Commencer** (Header) | `http://localhost:3001` | `https://app.nzembo.com` |
| **Connexion** (Header) | `http://localhost:3001/login` | `https://app.nzembo.com/login` |
| **Créer ma chanson** (Hero) | `http://localhost:3001/create` | `https://app.nzembo.com/create` |
| **Créer la mienne** (Exemples) | `http://localhost:3001/create` | `https://app.nzembo.com/create` |
| **Boutons Tarifs** (Pricing) | `http://localhost:3001/credits` | `https://app.nzembo.com/credits` |
| **Commencer gratuitement** (CTA Final) | `http://localhost:3001/register` | `https://app.nzembo.com/register` |
| **← Retour au site** (App Sidebar/Nav) | `http://localhost:3000` | `https://nzembo.com` |

Pour modifier ces cibles, éditez simplement :
- `nzembo.com/.env.local` et `nzembo.com/.env.production`
- `app.nzembo.com/.env.local` et `app.nzembo.com/.env.production`

---

## 7. Intégration d'une API Musicale Réelle

Le fichier `app.nzembo.com/src/lib/music-api.ts` contient la couche d'abstraction :

```typescript
export interface SongRequest {
  occasion: string;
  style: string;
  recipientName: string;
  relationship: string;
  language: string;
  description: string;
  keywords?: string;
}
```

### Pour connecter une API (ex: Suno API, Udio ou votre propre backend) :
1. Ajoutez les variables dans `app.nzembo.com/.env.local` :
   ```env
   MUSIC_API_KEY="votre_cle_secrete_ici"
   MUSIC_API_URL="https://api.votre-fournisseur.com/v1"
   MUSIC_API_PROVIDER="suno"
   ```
2. Implémentez la fonction `createSong()` côté serveur pour poster la tâche de génération.
3. Implémentez `getSongStatus()` pour interroger l'avancement via le `taskId` ou configurer un webhook de retour.
4. **Sécurité :** `MUSIC_API_KEY` n'a pas de préfixe `NEXT_PUBLIC_` et ne sera jamais exposée au navigateur.

---

## 8. Guide de Déploiement en Production

Chaque projet est conçu pour être déployé sur un domaine distinct :

### Déploiement sur Vercel
1. Créez deux projets distincts dans votre tableau de bord Vercel :
   - Projet 1 : Root Directory = `nzembo.com` ➔ Domaine associé = `nzembo.com`
   - Projet 2 : Root Directory = `app.nzembo.com` ➔ Domaine associé = `app.nzembo.com`
2. Configurez les variables d'environnement de production :
   - Sur Projet 1 : `NEXT_PUBLIC_APP_URL=https://app.nzembo.com`
   - Sur Projet 2 : `NEXT_PUBLIC_LANDING_URL=https://nzembo.com` et `NEXT_PUBLIC_APP_URL=https://app.nzembo.com`
3. Configuration DNS chez votre registrar :
   - `A` / `CNAME` pour `@` pointant vers `cname.vercel-dns.com`
   - `CNAME` pour `app` pointant vers `cname.vercel-dns.com`

---

## 9. Matrice des Fonctionnalités

| Composant / Écran | Statut | Remarques |
|---|---|---|
| **Logo Nzembo Vectoriel** | ✅ Opérationnel | SVG responsive avec ondes et dégradé violet-cyan |
| **Landing Page Marketing** | ✅ Opérationnelle | 10 sections complètes, animations, responsive |
| **Lecteur Audio Exemples** | ✅ Opérationnel | Simulation de lecture avec barres d'égaliseur |
| **Sidebar Desktop App** | ✅ Opérationnelle | Navigation w-64 avec liens actifs et profil démo |
| **Navigation Mobile App** | ✅ Opérationnelle | Bottom bar avec bouton surélevé "Créer" |
| **Wizard de Création (5 étapes)** | ✅ Opérationnel | Validation dynamique, sélection d'occasions & styles |
| **Moteur de Génération Simulé** | ✅ Opérationnel | Visualiseur animé, génération de paroles et sauvegarde |
| **Lecteur Audio Avancé App** | ✅ Opérationnel | Waveform interactive et son harmonique Web Audio |
| **Page Mes Chansons** | ✅ Opérationnelle | Filtres par style, lecture directe, stockage local |
| **Fiche Détail Chanson** | ✅ Opérationnelle | Route dynamique `/songs/[id]` avec paroles complètes |
| **Page Crédits & Packs** | ✅ Opérationnelle | Présentation des tarifs et feedback toast |
| **Page Profil & Réglages** | ✅ Opérationnelle | Toggles qualité, langue, notifications |
| **Authentification (Login/Register)** | ✅ Opérationnelle | Écrans dédiés prêts pour NextAuth ou Supabase |
| **API Musicale Réelle** | ⏳ Prête à brancher | Structure d'interface définie dans `src/lib/music-api.ts` |
