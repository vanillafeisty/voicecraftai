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

function splitTextIntoChunks(rawText: string, maxChunkLength = 120): string[] {
  const clean = rawText
    .replace(/[""“”]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return ['VoiceCraft AI audio generation ready.'];
  if (clean.length <= maxChunkLength) return [clean];

  const sentenceParts = clean.split(/(?<=[.?!;:\n])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const part of sentenceParts) {
    if ((currentChunk + ' ' + part).trim().length <= maxChunkLength) {
      currentChunk = (currentChunk + ' ' + part).trim();
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      if (part.length <= maxChunkLength) {
        currentChunk = part;
      } else {
        const words = part.split(/\s+/);
        let subChunk = '';
        for (const w of words) {
          if ((subChunk + ' ' + w).trim().length <= maxChunkLength) {
            subChunk = (subChunk + ' ' + w).trim();
          } else {
            if (subChunk) chunks.push(subChunk);
            subChunk = w;
          }
        }
        if (subChunk) {
          currentChunk = subChunk;
        }
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [clean.slice(0, maxChunkLength)];
}

async function generateStudioVoiceFallback(text: string, voice = "Priya"): Promise<{ audioBuffer: Buffer; mimeType: string; durationSeconds: number }> {
  const config = VOICE_BACKEND_CONFIGS[voice] || VOICE_BACKEND_CONFIGS.Priya;
  const langTag = config.langTag;
  const chunks = splitTextIntoChunks(text, 120);

  async function mapConcurrent<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T, index: number) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((item, idx) => fn(item, i + idx))
      );
      for (let j = 0; j < batchResults.length; j++) {
        results[i + j] = batchResults[j];
      }
    }
    return results;
  }

  const fetchChunk = async (chunk: string, index: number): Promise<Buffer | null> => {
    const encodedText = encodeURIComponent(chunk);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langTag}&client=tw-ob`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(ttsUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://translate.google.com/",
            "Accept": "*/*",
          },
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }

        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 120 * attempt));
        }
      } catch (err) {
        if (attempt === 3) {
          console.warn(`TTS chunk error ${index}:`, err);
        }
        await new Promise(r => setTimeout(r, 120 * attempt));
      }
    }
    return null;
  };

  const chunkBuffers = await mapConcurrent(chunks, 10, fetchChunk);
  const validBuffers = chunkBuffers.filter((b): b is Buffer => b !== null && b.length > 0);

  if (validBuffers.length === 0) {
    throw new Error('Failed to generate studio audio stream');
  }

  const combinedBuffer = Buffer.concat(validBuffers);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const durationSeconds = Math.max(1.2, Math.round((wordCount / 2.6) * 10) / 10);

  return {
    audioBuffer: combinedBuffer,
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
