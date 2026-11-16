# 🎶 Guide d'Intégration d'une API Musicale IA — Nzembo

Ce document explique comment brancher un véritable moteur d'intelligence artificielle de génération musicale dans l'application **Nzembo** (`app.nzembo.com`).

---

## 🎯 1. Principes d'Architecture & Sécurité

Pour garantir la sécurité et la flexibilité de Nzembo :
1. **Les clés secrètes d'API (`MUSIC_API_KEY`) restent EXCLUSIVEMENT côté serveur.**
   - Aucun appel direct n'est effectué depuis le navigateur de l'utilisateur vers le fournisseur d'IA.
   - Les variables sensibles ne portent JAMAIS le préfixe `NEXT_PUBLIC_`.
2. **Architecture asynchrone par Tâches (Task IDs) :**
   - La génération d'une chanson par IA dure généralement entre **60 et 180 secondes**.
   - Le serveur enregistre la demande, retourne un `taskId` et interroge périodiquement le statut (polling) ou reçoit un appel via Webhook.
3. **Neutralité du fournisseur :**
   - Le code UI de Nzembo ne dépend d'aucun fournisseur en particulier. Il utilise l'interface standardisée définie dans `src/lib/music-api.ts`.

---

## 🔌 2. Schéma d'Échange

```text
[Utilisateur sur App Nzembo]
         │
         │ 1. POST /api/generate (occasion, style, prénom, message)
         ▼
[Serveur Route API Next.js / Server Action]
         │
         │ 2. Appel sécurisé avec Bearer MUSIC_API_KEY
         ▼
[Fournisseur IA Musicale (Suno / Udio / ElevenLabs / Microservice)]
         │
         │ 3. Retourne taskId immédiat ("task_abc123", status: "queued")
         ▼
[Serveur Next.js Nzembo] ─── Status: "generating" ───▶ [Client UI : Écran de chargement]
         │
         ├─── Polling GET /status?taskId=xxx (toutes les 5 secondes)
         │    OU Réception du Webhook POST /api/webhooks/music
         ▼
[Fournisseur IA : Génération terminée]
         │
         │ 4. Retourne audioUrl (MP3), duration, lyrics
         ▼
[Client UI Nzembo] ─── Affiche le lecteur AudioPlayer + Waveform + Bouton Télécharger
```

---

## 🛠️ 3. Fournisseurs Compatibles

### Option A : Suno AI (via API officielle ou Gateway)
- **Points forts :** Excellente musicalité, chants en plusieurs langues, arrangements riches (Afrobeat, R&B, Pop).
- **Format du prompt recommandé :**
  ```json
  {
    "prompt": "Style: [Style choisi, ex: Afrobeat Lingala]. Thème: [Message de l'utilisateur]. Ambiance festive et chaleureuse.",
    "tags": "afrobeat, lingala, female vocals, uplifting",
    "title": "Chanson pour [Destinataire]",
    "make_instrumental": false
  }
  ```

### Option B : Udio API
- **Points forts :** Haute fidélité audio, transitions subtiles, qualité vocale impressionnante.
- **Paramètres :** `prompt`, `lyrics_mode: "custom"` ou `"generate"`, `duration_seconds: 180`.

### Option C : ElevenLabs Music API
- **Points forts :** Génération de voix personnalisées et de courtes mélodies de haute qualité.

### Option D : Microservice Custom (FastAPI + GPU Dédié)
Si vous hébergez vos propres modèles open-source (ex: AudioCraft / MusicGen de Meta fine-tuné sur des rythmes africains et de la Rumba) :
- Déployez un conteneur Docker avec FastAPI sur RunPod, Replicate ou AWS ECS.

---

## 💻 4. Implémentation Concrète dans Next.js

Créez le fichier de route API serveur :  
`app.nzembo.com/src/app/api/songs/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.MUSIC_API_KEY;
    const apiUrl = process.env.MUSIC_API_URL;

    if (!apiKey) {
      // Mode Démo actif
      return NextResponse.json({
        taskId: `demo-${Date.now()}`,
        status: "demo",
        message: "Mode Démo : Configurez MUSIC_API_KEY pour générer de vraies chansons.",
      });
    }

    // Appel réel au fournisseur
    const response = await fetch(`${apiUrl}/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `${body.style} song for ${body.recipientName}. ${body.description}`,
        tags: body.style,
        title: `Chanson pour ${body.recipientName}`,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Échec de génération" }, { status: 500 });
  }
}
```

---

## 🛡️ 5. Mode Démonstration Intégré

Lorsque aucune variable `MUSIC_API_KEY` n'est définie :
- L'application Nzembo s'exécute en **Mode Démonstration**.
- Un bandeau clair informe l'utilisateur :  
  `« Mode Démonstration Nzembo : L'architecture est prête pour brancher l'API musicale en production. »`
- Les paroles sont générées dynamiquement en fonction du prénom, de l'occasion, du style et du message saisis.
- Le lecteur interactif simule la lecture avec animations d'ondes sonores et synthèse harmonique Web Audio.
- Aucune fausse affirmation n'est faite sur la génération d'un véritable MP3 studio sans clé configurée.
