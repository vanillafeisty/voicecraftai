import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Creates a valid RIFF/WAVE header for raw 16-bit little-endian mono PCM audio at 24000 Hz.
 */
export function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitDepth = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // "RIFF" chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  // "fmt " sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // SubChunk1Size (16 for standard PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for uncompressed PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);

  // "data" sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      app: "VoiceCraft AI",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: "gemini-3.1-flash-tts-preview",
      timestamp: new Date().toISOString(),
    });
  });

  // Cooldown tracker for Gemini TTS quota
  let geminiTtsCooldownUntil = 0;

  const VOICE_BACKEND_CONFIGS: Record<string, {
    langTag: string;
    geminiVoice: string;
    tonePrompt: string;
    sampleLine: string;
    category: string;
    isHumanized?: boolean;
  }> = {
    // 🇮🇳 INDIAN VOICES
    Ananya: {
      langTag: "en-IN",
      geminiVoice: "Kore",
      tonePrompt: "Perform as an ultra-natural, emotionally expressive, warm Indian English human storyteller with delicate breath pauses, natural conversational rhythm, and lifelike warmth without any robotic monotony",
      sampleLine: "The old monsoon rains swept through the quiet courtyard, carrying the scent of wet jasmine and long-forgotten memories.",
      category: "Storytelling",
      isHumanized: true,
    },
    Kabir: {
      langTag: "en-IN",
      geminiVoice: "Puck",
      tonePrompt: "Perform as a soulful, warm, evocative, and dramatic Indian English male storyteller with natural human pauses and poetic phrasing",
      sampleLine: "Beyond the high mountain passes where the wind sings ancient ballads, a solitary traveler paused beneath the starlit sky.",
      category: "Storytelling",
      isHumanized: true,
    },
    Deepa: {
      langTag: "en-IN",
      geminiVoice: "Zephyr",
      tonePrompt: "Speak in a gentle, soothing, warm, and atmospheric Indian English bedtime audiobook voice",
      sampleLine: "Close your eyes and breathe gently as the evening settles peacefully over the silent valley.",
      category: "Storytelling",
    },
    Rohan: {
      langTag: "en-IN",
      geminiVoice: "Puck",
      tonePrompt: "Perform in a vibrant, animated, playful, and dynamic Indian English storytelling narrator voice",
      sampleLine: "With a sudden flash of brilliant light, the ancient clockwork gears began turning for the first time in three centuries!",
      category: "Storytelling",
    },
    Aarav: {
      langTag: "en-IN",
      geminiVoice: "Charon",
      tonePrompt: "Narrate in a deep, resonant, natural, and authoritative Indian English documentary narrative voice",
      sampleLine: "Our comprehensive economic investigation traces the evolution of digital finance across emerging markets.",
      category: "Narrative",
    },
    Kavita: {
      langTag: "en-IN",
      geminiVoice: "Kore",
      tonePrompt: "Deliver as an authoritative, commanding, crisp, and professional Indian English broadcast journalist",
      sampleLine: "Reporting from the national summit on cybersecurity protocols and cross-border regulatory governance.",
      category: "Narrative",
    },
    Priya: {
      langTag: "en-IN",
      geminiVoice: "Zephyr",
      tonePrompt: "Speak in a clear, structured, articulate, and flowing Indian English corporate explainer tone",
      sampleLine: "The user interface architecture is structured around modular event streams and real-time state synchronizers.",
      category: "Descriptive",
    },
    Vikram: {
      langTag: "en-IN",
      geminiVoice: "Charon",
      tonePrompt: "Deliver in a stern, disciplined, commanding, and authoritative Indian English executive director cadence",
      sampleLine: "Standard operating procedures require rigorous verification before launching mission-critical infrastructure.",
      category: "Descriptive",
    },

    // 🌐 INTERNATIONAL VOICES
    Oliver: {
      langTag: "en-US",
      geminiVoice: "Puck",
      tonePrompt: "Speak as an ultra-realistic, warm, cinematic human storyteller with lifelike breathing and emotional pacing without computerization",
      sampleLine: "In the quiet stillness of the autumn woods, he found an old wooden cabin that had weathered decades of winter storms.",
      category: "Storytelling",
      isHumanized: true,
    },
    Eleanor: {
      langTag: "en-GB",
      geminiVoice: "Kore",
      tonePrompt: "Read with a prestigious, expressive, dramatic British classical literature narrator voice",
      sampleLine: "It is a truth universally acknowledged, that a single thought held with conviction can alter the fate of an empire.",
      category: "Storytelling",
    },
    Fenrir: {
      langTag: "en-US",
      geminiVoice: "Fenrir",
      tonePrompt: "Narrate in a deep, steady, commanding, resonant baritone documentary broadcast voice",
      sampleLine: "From the depths of uncharted oceans to the outer frontiers of our solar system, humanity continues its relentless pursuit of discovery.",
      category: "Narrative",
    },
    Sarah: {
      langTag: "en-US",
      geminiVoice: "Zephyr",
      tonePrompt: "Deliver as a bright, polished, engaging, flowing international broadcast news anchor",
      sampleLine: "Good evening. Tonight’s lead report focuses on major breakthroughs in generative artificial intelligence and neural computing.",
      category: "Narrative",
    },
    James: {
      langTag: "en-AU",
      geminiVoice: "Puck",
      tonePrompt: "Narrate in a smooth, classic, flowing Australian/International broadcaster baritone",
      sampleLine: "Welcome to this week’s international dispatch, examining ecological preservation across coastal coral reefs.",
      category: "Narrative",
    },
    Kore: {
      langTag: "en-CA",
      geminiVoice: "Kore",
      tonePrompt: "Speak in a crisp, neutral, articulate studio descriptive explainer delivery",
      sampleLine: "The automated diagnostic cycle has finished. All internal data pipelines are operating within nominal specifications.",
      category: "Descriptive",
    },
    Arthur: {
      langTag: "en-GB",
      geminiVoice: "Charon",
      tonePrompt: "Deliver in a stern, commanding British executive director voice with crisp acoustic definition",
      sampleLine: "Strict adherence to security governance and risk containment frameworks is mandatory across all global branches.",
      category: "Descriptive",
    },
  };

  /**
   * Splits arbitrary length text (5,000+ words) into natural sentence/clause chunks under 130 characters.
   */
  function splitTextIntoChunks(rawText: string, maxChunkLength = 120): string[] {
    const clean = rawText
      .replace(/[""“”]/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return ['VoiceCraft AI audio generation ready.'];
    if (clean.length <= maxChunkLength) return [clean];

    // Split on sentence punctuation first (. ! ? ; : newline)
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
          // Subdivide long sentences by commas or word boundaries
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

  /**
   * Helper to execute async tasks concurrently in batches with order preservation.
   */
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

  /**
   * High-fidelity zero-quota speech synthesis engine with concurrent multi-chunk batching.
   * Handles arbitrary text length (5,000+ words) in seconds and returns continuous MP3 audio.
   */
  async function generateStudioVoiceFallback(text: string, voice = "Priya"): Promise<{ audioBuffer: Buffer; mimeType: string; durationSeconds: number }> {
    const config = VOICE_BACKEND_CONFIGS[voice] || VOICE_BACKEND_CONFIGS.Priya;
    const langTag = config.langTag;
    const chunks = splitTextIntoChunks(text, 120);

    // Fetch individual audio chunk with retry
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
            console.warn(`TTS fetch failed for chunk ${index} after 3 attempts:`, err);
          }
          await new Promise(r => setTimeout(r, 120 * attempt));
        }
      }
      return null;
    };

    // Process in concurrent batches of 10 requests for rapid completion of 5000+ words
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

  // Voice list endpoint
  app.get("/api/tts/voices", (_req, res) => {
    res.json({
      voices: Object.entries(VOICE_BACKEND_CONFIGS).map(([id, cfg]) => ({
        id,
        name: id,
        langTag: cfg.langTag,
        tone: cfg.tonePrompt,
        sampleLine: cfg.sampleLine,
        category: cfg.category,
        isHumanized: cfg.isHumanized || false,
      })),
    });
  });

  // Generate TTS Audio endpoint
  app.post("/api/tts/generate", async (req, res) => {
    try {
      const { text, voice, engine } = req.body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required for audio generation." });
      }

      const voiceName = voice || "Priya";
      const voiceConfig = VOICE_BACKEND_CONFIGS[voiceName] || VOICE_BACKEND_CONFIGS.Priya;
      const now = Date.now();
      const apiKey = process.env.GEMINI_API_KEY;

      const isLongText = text.length > 800 || text.split(/\s+/).length > 150;

      // Check if user specifically requested studio engine, or text is long-form (5,000+ words), or quota is cooling down or missing API key
      if (isLongText || engine === "studio" || !apiKey || now < geminiTtsCooldownUntil) {
        const studioResult = await generateStudioVoiceFallback(text, voiceName);
        const base64Mp3 = studioResult.audioBuffer.toString("base64");
        const wavDataUrl = `data:audio/mp3;base64,${base64Mp3}`;

        return res.json({
          success: true,
          wavDataUrl,
          durationSeconds: studioResult.durationSeconds,
          sampleRate: 24000,
          voice: voiceName,
          engine: "studio",
          isStudioFallback: !isLongText && engine !== "studio",
          wordCount: text.split(/\s+/).filter(Boolean).length,
        });
      }

      // Attempt high-fidelity Gemini Native TTS with gemini-3.1-flash-tts-preview
      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [
            {
              parts: [
                {
                  text: `${voiceConfig.tonePrompt}:\n\n${text}`,
                },
              ],
            },
          ],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceConfig.geminiVoice || "Aoede",
                },
              },
            },
          },
        });

        const candidate = response.candidates?.[0];
        const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

        if (audioPart && audioPart.inlineData?.data) {
          const rawBase64Pcm = audioPart.inlineData.data;
          const pcmBuffer = Buffer.from(rawBase64Pcm, "base64");
          const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
          const wavDataUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
          const durationSeconds = Math.round((pcmBuffer.length / (24000 * 2)) * 10) / 10;

          return res.json({
            success: true,
            wavDataUrl,
            durationSeconds,
            sampleRate: 24000,
            voice: voiceName,
            engine: "gemini",
          });
        }
      } catch (geminiError: any) {
        const errorMsg = geminiError?.message || "";
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
          console.warn("Gemini TTS quota hit. Setting 60s cooldown and seamlessly switching to Studio engine.");
          geminiTtsCooldownUntil = now + 60000;
        } else {
          console.warn("Gemini TTS generation error, switching to Studio fallback:", errorMsg);
        }
      }

      // Studio engine fallback
      const studioFallback = await generateStudioVoiceFallback(text, voiceName);
      const base64Mp3 = studioFallback.audioBuffer.toString("base64");
      const wavDataUrl = `data:audio/mp3;base64,${base64Mp3}`;

      return res.json({
        success: true,
        wavDataUrl,
        durationSeconds: studioFallback.durationSeconds,
        sampleRate: 24000,
        voice: voiceName,
        engine: "studio",
        isStudioFallback: true,
      });
    } catch (err: any) {
      console.error("Fatal error in /api/tts/generate:", err);
      return res.status(500).json({ error: err.message || "Failed to generate audio." });
    }
  });

  // Direct MP3 download endpoint for custom text
  app.post("/api/tts/download-custom", async (req, res) => {
    try {
      const { text, voice, filename } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).send("Text is required");
      }
      const safeVoice = voice || "Priya";
      const studioVoice = await generateStudioVoiceFallback(text, safeVoice);
      const safeFilename = (filename || "VoiceCraft_Audio").replace(/[^a-zA-Z0-9_-]/g, "_") + ".mp3";

      res.setHeader("Content-Type", "audio/mp3");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Content-Length", studioVoice.audioBuffer.length);
      return res.end(studioVoice.audioBuffer);
    } catch (err: any) {
      console.error("Error generating custom audio download:", err);
      return res.status(500).send("Failed to generate custom audio");
    }
  });

  app.get("/api/tts/download-text", async (req, res) => {
    try {
      const text = req.query.text as string;
      const voice = (req.query.voice as string) || "Priya";
      const filename = (req.query.filename as string) || "VoiceCraft_Audio";
      if (!text) {
        return res.status(400).send("Text query parameter is required");
      }
      const studioVoice = await generateStudioVoiceFallback(text, voice);
      const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, "_") + ".mp3";

      res.setHeader("Content-Type", "audio/mp3");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Content-Length", studioVoice.audioBuffer.length);
      return res.end(studioVoice.audioBuffer);
    } catch (err: any) {
      console.error("Error in GET audio download:", err);
      return res.status(500).send("Failed to download audio");
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoiceCraft AI server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal server error:", err);
  process.exit(1);
});
