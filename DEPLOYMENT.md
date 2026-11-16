# 🚀 Guide de Déploiement Séparé — Nzembo

Ce guide explique pas à pas comment déployer de manière totalement indépendante :
1. **La Landing Page Marketing :** `https://nzembo.com` (depuis le dossier `nzembo.com/`)
2. **L'Application Web SaaS :** `https://app.nzembo.com` (depuis le dossier `app.nzembo.com/`)

---

## 🏗️ 1. Architecture des Domaines & DNS

Pour assurer une séparation nette, chaque application possède son propre nom de domaine ou sous-domaine, son propre dépôt Git (ou sous-dossier de monorepo), et ses propres variables d'environnement.

### Enregistrements DNS recommandés chez votre Registrar (Cloudflare, Namecheap, OVH, Hostinger) :

| Type | Nom d'hôte | Valeur / Cible | TTL | Usage |
|---|---|---|---|---|
| **A** ou **CNAME** | `@` (ou `nzembo.com`) | `76.76.21.21` (ou `cname.vercel-dns.com`) | Auto / 3600 | Landing Page |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 3600 | Redirection www vers apex |
| **CNAME** | `app` | `cname.vercel-dns.com` | Auto / 3600 | Application Web SaaS |

---

## ⚡ 2. Déploiement sur Vercel (Recommandé)

Vercel est la plateforme native pour Next.js 15.

### Étape A : Déployer `nzembo.com` (Landing Page)
1. Rendez-vous sur votre dashboard [Vercel](https://vercel.com).
2. Cliquez sur **Add New... > Project** et importez votre dépôt GitHub `nzembo`.
3. Configurez les paramètres du projet :
   - **Project Name :** `nzembo-landing`
   - **Framework Preset :** `Next.js`
   - **Root Directory :** Cliquez sur **Edit** et sélectionnez `nzembo.com`
4. Ajoutez les variables d'environnement de production :
   ```env
   NEXT_PUBLIC_APP_URL=https://app.nzembo.com
   ```
5. Cliquez sur **Deploy**.
6. Une fois déployé, allez dans **Settings > Domains** et ajoutez :
   - `nzembo.com`
   - `www.nzembo.com`

---

### Étape B : Déployer `app.nzembo.com` (Application Web)
1. Sur Vercel, cliquez à nouveau sur **Add New... > Project** et sélectionnez le même dépôt GitHub.
2. Configurez les paramètres :
   - **Project Name :** `nzembo-app`
   - **Framework Preset :** `Next.js`
   - **Root Directory :** Cliquez sur **Edit** et sélectionnez `app.nzembo.com`
3. Ajoutez les variables d'environnement de production :
   ```env
   NEXT_PUBLIC_LANDING_URL=https://nzembo.com
   NEXT_PUBLIC_APP_URL=https://app.nzembo.com
   # Pour la génération musicale en production (optionnel en mode démo) :
   # MUSIC_API_KEY=votre_cle_api_secrete
   # MUSIC_API_URL=https://api.votre-fournisseur.com/v1
   # MUSIC_API_PROVIDER=suno
   ```
4. Cliquez sur **Deploy**.
5. Allez dans **Settings > Domains** et ajoutez :
   - `app.nzembo.com`

---

## 🌐 3. Déploiement sur Netlify

Si vous préférez Netlify :
1. Créez deux sites Netlify reliés au même dépôt.
2. Site 1 (Landing) :
   - Base directory : `nzembo.com`
   - Build command : `npm run build`
   - Publish directory : `.next`
   - Domaine : `nzembo.com`
3. Site 2 (App) :
   - Base directory : `app.nzembo.com`
   - Build command : `npm run build`
   - Publish directory : `.next`
   - Domaine : `app.nzembo.com`

---

## 🔒 4. Gestion des Sessions & Authentification Inter-Domaines

Lorsque vous connecterez une solution d'authentification réelle (NextAuth.js, Supabase Auth ou Clerk) :

### Option 1 : Domaine de cookie partagé (Single Sign-On)
Si vous souhaitez qu'un utilisateur connecté sur `nzembo.com` soit immédiatement reconnu sur `app.nzembo.com` :
- Configurez le cookie de session avec :
  ```javascript
  cookie: {
    domain: ".nzembo.com", // Le point initial permet le partage entre sous-domaines
    secure: true,
    sameSite: "lax",
  }
  ```

### Option 2 : Authentification centralisée sur l'application (Approche Izimelo)
Comme observé sur Izimelo :
- Toute la connexion et l'inscription s'effectuent directement sur `app.nzembo.com/login` et `app.nzembo.com/register`.
- La landing page ne stocke aucune session et reste 100% statique et ultra-rapide (idéal pour le SEO et le CDN).

---

## 🧪 5. Vérification Finale de la Chaîne de Navigation

Avant la mise en ligne, effectuez ces tests :
1. Cliquez sur **« Créer ma chanson »** sur la landing page ➔ Vérifiez l'arrivée sur `https://app.nzembo.com/create`.
2. Cliquez sur **« Connexion »** sur la landing page ➔ Vérifiez l'arrivée sur `https://app.nzembo.com/login`.
3. Cliquez sur **« ← Retour au site »** depuis la sidebar ou le profil de l'application ➔ Vérifiez le retour sur `https://nzembo.com`.
4. Effectuez un parcours complet de création dans l'application ➔ Vérifiez la notification et l'affichage du lecteur audio.
