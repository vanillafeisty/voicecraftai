// Serverless direct MP3 download endpoint for Vercel & Node runtimes

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[]>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: any) => ApiResponse | void;
  setHeader: (name: string, value: string) => ApiResponse | void;
  send: (body: any) => ApiResponse | void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const textQuery = req.query?.text;
    const voiceQuery = req.query?.voice;

    const text = (Array.isArray(textQuery) ? textQuery[0] : textQuery) || 'VoiceCraft AI Speech Audio';
    const voice = (Array.isArray(voiceQuery) ? voiceQuery[0] : voiceQuery) || 'Priya';

    const isIndianVoice = ['Priya', 'Aarav', 'Deepa', 'Rohan'].includes(voice);
    const langTag = isIndianVoice ? 'en-IN' : 'en';

    const clean = text
      .replace(/[""“”]/g, '')
      .replace(/[\n\r]+/g, ' ')
      .trim();

    const encodedText = encodeURIComponent(clean);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langTag}&client=tw-ob`;

    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to synthesize audio stream' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="VoiceCraft_${voice}_Speech.mp3"`);
    return res.status(200).send(audioBuffer);
  } catch (err: any) {
    console.error('Error generating direct download mp3:', err);
    return res.status(500).json({ error: 'Internal server error processing audio' });
  }
}
