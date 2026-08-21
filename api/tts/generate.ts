// Serverless function handler for Vercel & Node runtimes

interface ApiRequest {
  method?: string;
  body?: any;
  query?: Record<string, string | string[]>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: any) => ApiResponse | void;
  setHeader: (name: string, value: string) => ApiResponse | void;
  send: (body: any) => ApiResponse | void;
}

const VOICE_BACKEND_CONFIGS: Record<string, { langTag: string }> = {
  // 🇮🇳 Indian
  Ananya: { langTag: "en-IN" },
  Kabir: { langTag: "en-IN" },
  Deepa: { langTag: "en-IN" },
  Rohan: { langTag: "en-IN" },
  Aarav: { langTag: "en-IN" },
  Kavita: { langTag: "en-IN" },
  Priya: { langTag: "en-IN" },
  Vikram: { langTag: "en-IN" },

  // 🌐 International
  Oliver: { langTag: "en-US" },
  Eleanor: { langTag: "en-GB" },
  Fenrir: { langTag: "en-US" },
  Sarah: { langTag: "en-US" },
  James: { langTag: "en-AU" },
  Kore: { langTag: "en-CA" },
  Arthur: { langTag: "en-GB" },
};

async function generateStudioVoiceFallback(text: string, voice = "Priya"): Promise<{ audioBuffer: Buffer; mimeType: string; durationSeconds: number }> {
  const config = VOICE_BACKEND_CONFIGS[voice] || VOICE_BACKEND_CONFIGS.Priya;
  const langTag = config.langTag;

  const clean = text
    .replace(/[""“”]/g, '')
    .replace(/[\n\r]+/g, ' ')
    .trim();

  const encodedText = encodeURIComponent(clean || "VoiceCraft AI audio generation ready.");
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langTag}&client=tw-ob`;

  const response = await fetch(ttsUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://translate.google.com/",
      "Accept": "*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Speech synthesis request failed with HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  const wordCount = (clean || "").split(/\s+/).filter(Boolean).length;
  const durationSeconds = Math.max(1.2, Math.round((wordCount / 2.5) * 10) / 10);

  return {
    audioBuffer,
    mimeType: "audio/mp3",
    durationSeconds,
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'Priya' } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Valid text is required' });
    }

    const { audioBuffer, mimeType, durationSeconds } = await generateStudioVoiceFallback(text, voice);
    const base64Audio = audioBuffer.toString('base64');
    const wavDataUrl = `data:${mimeType};base64,${base64Audio}`;

    return res.status(200).json({
      success: true,
      voice,
      durationSeconds,
      wavDataUrl,
    });
  } catch (error: any) {
    console.error('Serverless TTS generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to synthesize audio',
    });
  }
}
