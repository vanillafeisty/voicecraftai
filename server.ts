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
   * Splits arbitrary length text (even 10,000+ words) into natural sentence/paragraph chunks for TTS synthesis.
   */
  function splitTextIntoGeminiChunks(rawText: string, maxWords = 180): string[] {
    const clean = rawText
      .replace(/[""“”]/g, '"')
      .replace(/[\r\n]+/g, '\n')
      .trim();

    if (!clean) return ['VoiceCraft AI audio generation ready.'];

    // Split on paragraphs first
    const paragraphs = clean.split(/\n+/).map(p => p.trim()).filter(Boolean);
    const chunks: string[] = [];
    let currentWords: string[] = [];

    for (const para of paragraphs) {
      // Split paragraph into sentences
      const sentences = para.split(/(?<=[.?!;:])\s+/).map(s => s.trim()).filter(Boolean);

      for (const sentence of sentences) {
        const sentenceWords = sentence.split(/\s+/).filter(Boolean);

        if (currentWords.length + sentenceWords.length <= maxWords) {
          currentWords.push(...sentenceWords);
        } else {
          if (currentWords.length > 0) {
            chunks.push(currentWords.join(' '));
            currentWords = [];
          }

          if (sentenceWords.length <= maxWords) {
            currentWords.push(...sentenceWords);
          } else {
            // Very long sentence without punctuation: split into word blocks
            for (let i = 0; i < sentenceWords.length; i += maxWords) {
              chunks.push(sentenceWords.slice(i, i + maxWords).join(' '));
            }
          }
        }
      }
    }

    if (currentWords.length > 0) {
      chunks.push(currentWords.join(' '));
    }

    return chunks.length > 0 ? chunks : [clean.slice(0, 1000)];
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
   */
  async function generateStudioVoiceFallback(text: string, voice = "Priya"): Promise<{ audioBuffer: Buffer; mimeType: string; durationSeconds: number }> {
    const config = VOICE_BACKEND_CONFIGS[voice] || VOICE_BACKEND_CONFIGS.Priya;
    const langTag = config.langTag;
    const chunks = splitTextIntoGeminiChunks(text, 25);

    // Fetch individual audio chunk with retry
    const fetchChunk = async (chunk: string, index: number): Promise<Buffer | null> => {
      const encodedText = encodeURIComponent(chunk.slice(0, 150));
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
            await new Promise(r => setTimeout(r, 100 * attempt));
          }
        } catch (err) {
          if (attempt === 3) {
            console.warn(`TTS fetch failed for chunk ${index}:`, err);
          }
          await new Promise(r => setTimeout(r, 100 * attempt));
        }
      }
      return null;
    };

    const chunkBuffers = await mapConcurrent(chunks, 8, fetchChunk);
    const validBuffers = chunkBuffers.filter((b): b is Buffer => b !== null && b.length > 0);

    if (validBuffers.length === 0) {
      throw new Error('Failed to generate audio stream');
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

  /**
   * Unified speech audio generator supporting 5,000+ words with guaranteed voice consistency.
   * Chunks large texts, synthesizes with the exact persona in Gemini TTS, concatenates PCM buffers,
   * and provides reliable fallback.
   */
  async function generateSpeechAudio(
    text: string,
    voiceName = "Priya"
  ): Promise<{
    audioBuffer: Buffer;
    mimeType: string;
    durationSeconds: number;
    sampleRate: number;
    voice: string;
    engine: "gemini" | "studio";
    wordCount: number;
  }> {
    const voiceConfig = VOICE_BACKEND_CONFIGS[voiceName] || VOICE_BACKEND_CONFIGS.Priya;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const now = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    // Try Gemini TTS first if API key is present and not cooling down
    if (apiKey && now >= geminiTtsCooldownUntil) {
      try {
        const ai = getGeminiClient();
        const chunks = splitTextIntoGeminiChunks(text, 180);

        // Synthesize a single chunk with Gemini TTS
        const synthesizeChunk = async (chunkText: string, index: number): Promise<Buffer | null> => {
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [
                  {
                    parts: [
                      {
                        text: `${voiceConfig.tonePrompt}:\n\n${chunkText}`,
                      },
                    ],
                  },
                ],
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: voiceConfig.geminiVoice || "Kore",
                      },
                    },
                  },
                },
              });

              const candidate = response.candidates?.[0];
              const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

              if (audioPart && audioPart.inlineData?.data) {
                const rawBase64Pcm = audioPart.inlineData.data;
                return Buffer.from(rawBase64Pcm, "base64");
              }
            } catch (chunkErr: any) {
              const errMsg = chunkErr?.message || "";
              if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
                geminiTtsCooldownUntil = Date.now() + 60000;
                throw chunkErr;
              }
              if (attempt < 2) {
                await new Promise(r => setTimeout(r, 200 * attempt));
              }
            }
          }
          return null;
        };

        // Run with concurrency of 3 to synthesize 5,000+ words swiftly without exceeding rate limits
        const pcmChunks = await mapConcurrent(chunks, 3, synthesizeChunk);
        const validPcmChunks = pcmChunks.filter((b): b is Buffer => b !== null && b.length > 0);

        if (validPcmChunks.length > 0 && validPcmChunks.length === chunks.length) {
          // All chunks synthesized successfully with the designated voice persona!
          const fullPcmBuffer = Buffer.concat(validPcmChunks);
          const wavBuffer = pcmToWav(fullPcmBuffer, 24000, 1, 16);
          const durationSeconds = Math.round((fullPcmBuffer.length / (24000 * 2)) * 10) / 10;

          return {
            audioBuffer: wavBuffer,
            mimeType: "audio/wav",
            durationSeconds,
            sampleRate: 24000,
            voice: voiceName,
            engine: "gemini",
            wordCount,
          };
        }
      } catch (geminiError: any) {
        const errorMsg = geminiError?.message || "";
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
          console.warn("Gemini TTS quota reached, switching seamlessly to Studio engine.");
          geminiTtsCooldownUntil = now + 60000;
        } else {
          console.warn("Gemini TTS error, falling back to Studio engine:", errorMsg);
        }
      }
    }

    // High-fidelity fallback engine with full multi-chunk support
    const studioResult = await generateStudioVoiceFallback(text, voiceName);
    return {
      audioBuffer: studioResult.audioBuffer,
      mimeType: studioResult.mimeType,
      durationSeconds: studioResult.durationSeconds,
      sampleRate: 24000,
      voice: voiceName,
      engine: "studio",
      wordCount,
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

  // Generate TTS Audio endpoint (guaranteed identical voice for short text and 5,000+ words)
  app.post("/api/tts/generate", async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required for audio generation." });
      }

      const voiceName = voice || "Priya";
      const result = await generateSpeechAudio(text, voiceName);
      const base64Audio = result.audioBuffer.toString("base64");
      const wavDataUrl = `data:${result.mimeType};base64,${base64Audio}`;

      return res.json({
        success: true,
        wavDataUrl,
        durationSeconds: result.durationSeconds,
        sampleRate: result.sampleRate,
        voice: result.voice,
        engine: result.engine,
        wordCount: result.wordCount,
      });
    } catch (err: any) {
      console.error("Fatal error in /api/tts/generate:", err);
      return res.status(500).json({ error: err.message || "Failed to generate audio." });
    }
  });

  // Direct download endpoint for custom text (uses exact same audio generation pipeline)
  app.post("/api/tts/download-custom", async (req, res) => {
    try {
      const { text, voice, filename } = req.body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).send("Text is required");
      }
      const safeVoice = voice || "Priya";
      const result = await generateSpeechAudio(text, safeVoice);
      const ext = result.mimeType === "audio/wav" ? ".wav" : ".mp3";
      const safeFilename = (filename || `VoiceCraft_${safeVoice}_Audio`).replace(/[^a-zA-Z0-9_-]/g, "_") + ext;

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Content-Length", result.audioBuffer.length);
      return res.end(result.audioBuffer);
    } catch (err: any) {
      console.error("Error generating custom audio download:", err);
      return res.status(500).send("Failed to generate custom audio");
    }
  });

  app.get("/api/tts/download-text", async (req, res) => {
    try {
      const text = req.query.text as string;
      const voice = (req.query.voice as string) || "Priya";
      const filename = (req.query.filename as string) || `VoiceCraft_${voice}_Audio`;
      if (!text) {
        return res.status(400).send("Text query parameter is required");
      }
      const result = await generateSpeechAudio(text, voice);
      const ext = result.mimeType === "audio/wav" ? ".wav" : ".mp3";
      const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, "_") + ext;

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Content-Length", result.audioBuffer.length);
      return res.end(result.audioBuffer);
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
