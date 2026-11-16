// Music Generation API Integration
// Replace with your actual Nzembo audio engine provider

export interface SongRequest {
  occasion: string;
  style: string;
  recipientName: string;
  relationship: string;
  language: string;
  description: string;
  keywords?: string;
}

export interface SongResult {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  lyrics: string;
  status: "pending" | "generating" | "completed" | "failed";
  createdAt: string;
}

export interface MusicApiConfig {
  apiKey: string;
  baseUrl: string;
  provider: "nzembo-engine" | "custom";
}

// Configure environment variables for external audio engine proxy:
// 1. Set MUSIC_API_KEY in .env.local (server-side only)
// 2. Set MUSIC_API_URL in .env.local
// 3. Set MUSIC_API_PROVIDER in .env.local (nzembo-engine | custom)
// 4. Implement the API calls below

const isDemoMode = () => !process.env.MUSIC_API_KEY;

export async function createSong(
  request: SongRequest
): Promise<{ taskId: string }> {
  if (isDemoMode()) {
    return { taskId: `demo-${Date.now()}` };
  }
  // TODO: Replace with real API call
  // const response = await fetch(`${process.env.MUSIC_API_URL}/generate`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.MUSIC_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(request),
  // });
  // return await response.json();
  throw new Error("Music API not configured");
}

export async function getSongStatus(taskId: string): Promise<SongResult> {
  if (isDemoMode()) {
    return {
      id: taskId,
      title: `Chanson générée`,
      audioUrl: "",
      duration: 195,
      lyrics:
        "♪ Paroles de démonstration ♪\n\nCeci est un aperçu du mode démo.\nConnectez une API musicale pour générer de vraies chansons.",
      status: "completed",
      createdAt: new Date().toISOString(),
    };
  }
  throw new Error("Music API not configured");
}

export function getIsDemoMode(): boolean {
  return isDemoMode();
}
