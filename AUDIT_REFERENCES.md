# 🔍 Audit des Sites de Référence — Izimelo

**Date d'audit :** 22 Octobre 2026  
**Auditeur :** Antigravity AI  
**Objectif :** Analyser izimelo.com et app.izimelo.com pour inspirer Nzembo

---

## Légende de Vérification

| Statut | Signification |
|--------|---------------|
| ✅ **Observé** | Élément directement visible et vérifié |
| ⚠️ **Partiel** | Élément partiellement accessible ou déduit du HTML |
| ❌ **Non vérifiable** | Élément nécessitant une connexion ou non accessible |
| 🎨 **Décision Nzembo** | Choix de conception original pour Nzembo |

---

## 1. Landing Page — izimelo.com

### 1.1 Structure Générale ✅

La landing page est une single-page application avec les sections suivantes (dans l'ordre) :

1. **Header / Navigation** avec logo, liens d'ancrage (Exemples, Avis, FAQ), bouton Connexion et bouton CTA "Commencer"
2. **Section Hero** — Titre principal "Créer une musique en 3 minutes", sous-titre mentionnant Anniversaires/Mariages/Baptêmes/Hommages, badge "Le n°1 de la création musicale par IA", social proof "7 000+ utilisateurs"
3. **Section Exemples audio** (#playlist) — "Ils ont créé ça avec Izimelo", 4 chansons avec lecteurs audio et tags de style musical
4. **Section Témoignages** (#testimonials) — "Ils ont marqué le coup", 3 témoignages avec noms
5. **Section FAQ** (#faq) — "Questions Fréquentes"
6. **Footer** — Liens légaux (Confidentialité, CGU), email de contact, copyright

### 1.2 Navigation ✅
- Logo Izimelo à gauche
- Liens d'ancrage au centre : Exemples, Avis, FAQ
- Boutons à droite : Connexion (lien vers app.izimelo.com), Commencer (CTA vers app.izimelo.com)
- Tous les CTA redirigent vers `https://app.izimelo.com`

### 1.3 Section Hero ✅
- Badge au-dessus du titre : "Le n°1 de la création musicale par IA"
- Titre H1 principal : "Créer une musique en 3 minutes"
- Sous-titre descriptif avec occasions (Anniversaires, Mariages, Baptêmes, Hommages)
- CTA principal : "Créer ma chanson" → redirige vers l'app
- Social proof : "Utilisé par plus de 7 000 utilisateurs"

### 1.4 Exemples Audio ✅
- Titre de section : "Ils ont créé ça avec Izimelo"
- Sous-titre : "Écoutez des exemples de chansons personnalisées"
- 4 exemples de chansons avec :
  - Nom de chanson
  - Style musical (Afrobeat, Acoustique, Amapiano)
  - Durée
  - Lecteur audio intégré
- CTA en bas : "Créer la mienne"

### 1.5 Témoignages ✅
- 3 témoignages avec :
  - Citation entre guillemets
  - Prénom + initiale du nom
  - Contextes variés (mariage, anniversaire, diplôme)

### 1.6 FAQ ✅
- Titre : "Questions Fréquentes"
- Format accordéon (détails non visibles sans JS)

### 1.7 Footer ✅
- Liens : Confidentialité, CGU
- Email contact : contact@wazzap.ai
- Copyright : © 2026 Izimelo

### 1.8 Design & Couleurs ✅
- Palette chaude : tons orange/crème (bg-background #FDFCF0 observé sur l'app)
- Police : Nunito (observé dans le HTML)
- Style visuel : chaleureux, accessible, afro-moderne

### 1.9 Animations ⚠️
- Des animations d'apparition sont probables (non exécutables sans JS)
- Transitions douces attendues sur les boutons
- Carrousel ou lecteurs audio dynamiques

---

## 2. Application — app.izimelo.com

### 2.1 Architecture Technique ✅
- **Framework :** Next.js (App Router, observé dans le HTML source)
- **Déploiement :** Vercel (dpl_ prefix dans les chunks)
- **Police :** Nunito
- **Fond :** #FDFCF0 (crème/beige clair)
- **Accents :** Orange (orange-100, orange-50 dans le Tailwind)
- **Langue :** Français par défaut, anglais disponible (hreflang)
- **Analytics :** Google Tag Manager + Google Analytics (G-3S25Q7VRG4)

### 2.2 Layout de l'Application ✅
- **Desktop :** Sidebar fixe à gauche (w-64, 16rem) + contenu principal
- **Mobile :** Header sticky en haut + barre de navigation bottom fixe

### 2.3 Sidebar Desktop ✅
- Logo + nom en haut avec bordure orange-100
- 5 liens de navigation (icône + texte) — contenus non lisibles (skeleton/loading)
- Section utilisateur en bas avec avatar rond, nom et email

### 2.4 Header Mobile ✅
- Logo + nom à gauche
- Badge de crédits à droite
- Bouton profil/menu

### 2.5 Bottom Navigation Mobile ✅
- 5 onglets avec icônes et labels
- L'onglet central est proéminent (w-14 h-14, -mt-4) — probablement "Créer"
- Style : fond blanc, bordure grise en haut

### 2.6 Contenu Principal ⚠️
- Zone centrée (max-w-lg sur mobile, max-w-xl sur desktop)
- Le contenu réel nécessite JavaScript (rendu côté client)
- Client-side rendering avec bailout observé dans le HTML

### 2.7 Providers / Architecture ✅ (déduit du code)
- **SessionProvider** — gestion de session
- **AuthProvider** — authentification
- **HeartbeatProvider** — keep-alive/activité
- **LocaleProvider** — internationalisation (fr/en)
- **CurrencyProvider** — gestion des devises/prix
- **ToastProvider** — notifications
- **AppShell** — structure globale de l'app

### 2.8 Fonctionnalités Déduites ⚠️
- Système de crédits pour les générations
- Authentification utilisateur
- Gestion de devises (paiements)
- Multi-langue (fr/en)
- Notifications toast
- Parcours de création de chanson en étapes

### 2.9 Écrans Non Accessibles ❌
- Écran d'accueil authentifié
- Formulaire de création de chanson (étapes)
- Choix d'occasion et de style musical
- Saisie des informations pour personnaliser
- Écran de génération / chargement
- Résultat avec lecteur audio
- Historique des chansons
- Page de profil
- Page de crédits / tarifs
- Pages de connexion / inscription

---

## 3. Synthèse des Observations

### Ce qu'Izimelo fait bien (à s'inspirer)
1. **Clarté du message** : Le hero communique la proposition de valeur en une phrase
2. **Preuve sociale** : Nombre d'utilisateurs + témoignages
3. **Exemples audio** : Montrer avant de vendre
4. **Navigation simple** : Peu de liens, parcours linéaire
5. **Architecture séparée** : Landing page ≠ Application
6. **Mobile-first** : Navigation bottom, design adaptatif
7. **Sidebar desktop** : Navigation claire dans l'app
8. **Bouton central proéminent** : "Créer" est l'action principale

### Différences clés pour Nzembo 🎨
1. **Palette sombre** au lieu de crème/orange → violet/cyan/nuit
2. **Identité congolaise/internationale** au lieu d'uniquement ouest-africaine
3. **Design moderne/tech** avec effets de glow et gradients
4. **Typographie Inter/Space Grotesk** au lieu de Nunito
5. **Styles musicaux élargis** : Rumba, Ndombolo, Afrobeat, Pop, R&B, etc.
6. **Animations** inspirées des ondes sonores et du rythme

---

## 4. Décisions de Conception pour Nzembo 🎨

### Landing Page
- Hero avec animation d'ondes sonores en arrière-plan
- 6 exemples de chansons au lieu de 4
- Section "Comment ça marche" en 3 étapes
- Section "Occasions" avec icônes dédiées
- 4 témoignages originaux
- FAQ avec 6+ questions
- Footer complet avec réseaux sociaux

### Application
- Sidebar avec navigation : Accueil, Créer, Mes chansons, Crédits, Profil
- Parcours de création en 5 étapes : Occasion → Style → Informations → Description → Génération
- Design sombre cohérent avec la landing page
- Lecteur audio avec visualisation d'ondes
- Mode démo clairement identifié
- Pages d'authentification (connexion/inscription)
