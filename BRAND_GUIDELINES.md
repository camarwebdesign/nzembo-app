# 🎵 Nzembo — Brand Guidelines (Mise à Jour)

## 1. Brand Overview

**Name :** Nzembo  
**Origine :** Mot lingala signifiant « sa chanson »  
**Slogan :** « Ta musique. Ton histoire. Avec l'IA. »  
**Mission :** Permettre à chacun de composer des chansons personnalisées et émouvantes grâce à l'intelligence artificielle, en célébrant les moments uniques de la vie (anniversaires, mariages, hommages, diplômes, déclarations).

---

## 2. Palette de Couleurs & Thèmes

### ☀️ Thème par Défaut : Mode Clair (Light Mode)
L'application et la landing page adoptent un **fond blanc moderne, épuré et lumineux par défaut**, apportant un sentiment de clarté, de simplicité et d'élégance :
- **Fond principal :** Blanc pur (`#FFFFFF`) ou blanc cassé subtil (`#FAFAFC` / `#F8FAFC`)
- **Surfaces & Cartes :** Blanc avec bordures fines et discrètes (`border-slate-200/80`) et ombres douces (`shadow-sm`)
- **Accents de cartes :** Teinte violette ou cyan ultra-légère (`#FAF5FF`, `#F0FDFA`)
- **Texte principal :** Ardoise foncée (`#0F172A` / `#1E293B`)
- **Texte secondaire & labels :** Ardoise intermédiaire (`#64748B` / `#475569`)

### 🌙 Thème Secondaire : Mode Nuit (Dark Mode)
Un bouton de bascule (Sun/Moon) permet de passer instantanément en **Mode Studio Nuit** :
- **Fond principal :** Noir nuit profond (`#0F0A1A`)
- **Sections alternées :** Noir studio (`#1A1025`)
- **Surfaces & Cartes :** Gris-violet foncé (`#2D2640` / `rgba(45, 38, 64, 0.5)`)
- **Bordures :** Violet néon translucide (`rgba(124, 58, 237, 0.15)`)
- **Texte :** Blanc pur (`#FFFFFF`) et lilas doux (`#A89EC2`)
- **Persistance :** Mémorisée automatiquement dans le `localStorage` de l'utilisateur.

### 🎨 Couleurs Signatures (Conservées sur tous les boutons & accents)
- **Violet Nzembo :** `#7C3AED`
- **Cyan Nzembo :** `#06B6D4`
- **Dégradé Signature des Boutons :** `linear-gradient(135deg, #7C3AED, #06B6D4)`
- **Pulsation lumineuse (Glow) :** `box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25)`

---

## 3. Système d'Icônes Minimalistes (Style Izimelo)

Pour une ergonomie professionnelle et épurée inspirée d'Izimelo, **les émojis sont proscrits dans la navigation et les interfaces principales**, au profit d'**icônes vectorielles SVG en contours fins (stroke 1.5px / 2px)** :

| Fonctionnalité | Rendu SVG | Description |
|---|---|---|
| **Accueil** | `<svg d="M3 12l2-2m0..."/>` | Maison géométrique épurée |
| **Créer** | `<svg d="M9.813 15.904L9..."/>` | Étoiles de composition / magie IA |
| **Mes chansons** | `<svg d="M9 19V6l12-3..."/>` | Double croche musicale contemporaine |
| **Crédits** | `<svg d="M12 2l8 6-8..."/>` | Diamant facetté stylisé |
| **Profil** | `<svg d="M16 7a4 4 0..."/>` | Silhouette humaine épurée |
| **Occasions & Styles** | SVG contours dédiés | Gâteau, cœur, toge, micro, ondes, guitare |

---

## 4. Skeleton Screen & Animation Shimmer

Pour garantir une expérience utilisateur fluide sans à-coups visuels lors du chargement des données ou de la vérification de session :

1. **Disposition fidèle (Skeleton Layout) :**  
   Les blocs d'attente épousent fidèlement la hauteur, largeur et rayon de courbure des éléments réels (titres, avatars ronds, boutons, cartes de chansons).
2. **Animation Shimmer (Vague brillante) :**  
   Un dégradé animé balaie horizontalement le conteneur :
   - *En mode clair :* Dégradé gris clair (`#E2E8F0`) traversé d'un faisceau blanc lumineux.
   - *En mode sombre :* Dégradé gris studio (`#261E38`) traversé d'une lueur translucide (`rgba(255, 255, 255, 0.08)`).
3. **Transition fluide :**  
   Une fois le chargement terminé, le Skeleton s'efface en fondu (`transition-opacity duration-300`) et le contenu réel apparaît avec un léger effet d'élévation (`animate-fade-in-up`).

---

## 5. Règle de Séparation des Parcours (Règle App)

- **Landing page (`nzembo.com`) :** Contient des boutons d'appel à l'action explicites redirigeant vers `app.nzembo.com`.
- **Application SaaS (`app.nzembo.com`) :** Une fois connecté dans l'application, **aucun lien de retour vers la landing page marketing ne doit être affiché**. L'interface est 100% dédiée à la création, à l'écoute et à la gestion de compte.
