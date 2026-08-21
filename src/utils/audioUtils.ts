import { VoiceOption, ContextPreset, VoiceName, VoiceCategory, VoicePersonalization } from '../types';

export const DEFAULT_PERSONALIZATION: VoicePersonalization = {
  pitch: 1.0,
  speed: 1.0,
  toneStyle: 'natural',
  volume: 1.0,
  emphasis: 'standard',
};

/**
 * Global audio registry to ensure ONLY ONE voice/audio channel plays at any time.
 * Absolutely eliminates double voice / overlapping audio issues.
 */
let currentlyPlayingAudioElement: HTMLAudioElement | null = null;

export function stopAllAudio(): void {
  // 1. Cancel browser speech synthesis immediately
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }

  // 2. Pause and reset any registered playing audio element
  if (currentlyPlayingAudioElement) {
    try {
      currentlyPlayingAudioElement.pause();
      currentlyPlayingAudioElement.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentlyPlayingAudioElement = null;
  }

  // 3. Find and pause all audio elements in the DOM to be 100% foolproof
  if (typeof document !== 'undefined') {
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach((a) => {
      try {
        if (!a.paused) {
          a.pause();
        }
      } catch (e) {
        // ignore
      }
    });
  }
}

/**
 * Plays an audio element exclusively, stopping every other sound in the browser first.
 */
export async function playExclusiveAudio(
  audioEl: HTMLAudioElement,
  src?: string,
  rate = 1.0,
  volume = 1.0
): Promise<void> {
  stopAllAudio();
  if (src && audioEl.src !== src) {
    audioEl.src = src;
  }
  audioEl.playbackRate = Math.max(0.5, Math.min(2.5, rate));
  audioEl.volume = Math.max(0, Math.min(1, volume));
  currentlyPlayingAudioElement = audioEl;
  await audioEl.play();
}

export const VOICE_OPTIONS: VoiceOption[] = [
  // 🇮🇳 INDIAN VOICES

  // 1. Storytelling (Ultra-Humanized & Natural)
  {
    id: 'Ananya',
    name: 'Ananya',
    gender: 'Female',
    region: 'Indian',
    category: 'Storytelling',
    accent: 'Indian English',
    tone: 'Ultra-Humanized & Soulful',
    description: 'Ultra-natural human storyteller with warm emotional depth, lifelike breathing nuances, and conversational cadence.',
    styleTag: '✨ Real Humanized',
    sampleLine: 'The old monsoon rains swept through the quiet courtyard, carrying the scent of wet jasmine and long-forgotten memories.',
    pitch: 1.12,
    rate: 0.98,
    isHumanized: true,
  },
  {
    id: 'Kabir',
    name: 'Kabir',
    gender: 'Male',
    region: 'Indian',
    category: 'Storytelling',
    accent: 'Indian English',
    tone: 'Ultra-Humanized & Dramatic',
    description: 'Soulful, evocative male storyteller with dramatic warmth, natural human phrasing, and poetic inflection.',
    styleTag: '✨ Real Humanized',
    sampleLine: 'Beyond the high mountain passes where the wind sings ancient ballads, a solitary traveler paused beneath the starlit sky.',
    pitch: 0.84,
    rate: 0.96,
    isHumanized: true,
  },
  {
    id: 'Deepa',
    name: 'Deepa',
    gender: 'Female',
    region: 'Indian',
    category: 'Storytelling',
    accent: 'Indian English',
    tone: 'Articulate & Gentle',
    description: 'Gentle, soothing, and atmospheric cadence for audiobooks, bedtime stories, and guided reflections.',
    styleTag: 'Bedtime & Audiobook',
    sampleLine: 'Close your eyes and breathe gently as the evening settles peacefully over the silent valley.',
    pitch: 1.24,
    rate: 0.94,
  },
  {
    id: 'Rohan',
    name: 'Rohan',
    gender: 'Male',
    region: 'Indian',
    category: 'Storytelling',
    accent: 'Indian English',
    tone: 'Flowing & Warm',
    description: 'Vibrant, animated, and playful vocal delivery tailored for creative stories and character narration.',
    styleTag: 'Animated Tales',
    sampleLine: 'With a sudden flash of brilliant light, the ancient clockwork gears began turning for the first time in three centuries!',
    pitch: 0.95,
    rate: 1.05,
  },

  // 2. Narrative (Documentary & Broadcast)
  {
    id: 'Aarav',
    name: 'Aarav',
    gender: 'Male',
    region: 'Indian',
    category: 'Narrative',
    accent: 'Indian English',
    tone: 'Authoritative',
    description: 'Deep, resonant, and natural journalistic voice tailored for documentaries, long-form podcasts, and business news.',
    styleTag: 'Documentary Narrator',
    sampleLine: 'Our comprehensive economic investigation traces the evolution of digital finance across emerging markets.',
    pitch: 0.88,
    rate: 1.0,
  },
  {
    id: 'Kavita',
    name: 'Kavita',
    gender: 'Female',
    region: 'Indian',
    category: 'Narrative',
    accent: 'Indian English',
    tone: 'Stern & Firm',
    description: 'Authoritative, commanding, and crisp broadcast journalist for breaking news and corporate governance.',
    styleTag: 'Broadcast Journalist',
    sampleLine: 'Reporting from the national summit on cybersecurity protocols and cross-border regulatory governance.',
    pitch: 1.04,
    rate: 1.02,
  },

  // 3. Descriptive (Explanatory & Briefings)
  {
    id: 'Priya',
    name: 'Priya',
    gender: 'Female',
    region: 'Indian',
    category: 'Descriptive',
    accent: 'Indian English',
    tone: 'Flowing & Warm',
    description: 'Clear, articulate, and structured delivery ideal for product guides, corporate briefings, and walk-throughs.',
    styleTag: 'Crisp Explainer',
    sampleLine: 'The user interface architecture is structured around modular event streams and real-time state synchronizers.',
    pitch: 1.15,
    rate: 1.0,
  },
  {
    id: 'Vikram',
    name: 'Vikram',
    gender: 'Male',
    region: 'Indian',
    category: 'Descriptive',
    accent: 'Indian English',
    tone: 'Stern & Firm',
    description: 'Stern, commanding, and disciplined executive cadence designed for precise procedural overviews.',
    styleTag: 'Executive Briefing',
    sampleLine: 'Standard operating procedures require rigorous verification before launching mission-critical infrastructure.',
    pitch: 0.78,
    rate: 1.04,
  },

  // 🌐 INTERNATIONAL VOICES

  // 1. Storytelling (Ultra-Humanized & Natural)
  {
    id: 'Oliver',
    name: 'Oliver',
    gender: 'Male',
    region: 'International',
    category: 'Storytelling',
    accent: 'International English (US)',
    tone: 'Ultra-Humanized & Warm',
    description: 'Ultra-realistic human storyteller with lifelike breathing pauses, emotional warmth, and cinematic pacing.',
    styleTag: '✨ Real Humanized',
    sampleLine: 'In the quiet stillness of the autumn woods, he found an old wooden cabin that had weathered decades of winter storms.',
    pitch: 0.90,
    rate: 0.96,
    isHumanized: true,
  },
  {
    id: 'Eleanor',
    name: 'Eleanor',
    gender: 'Female',
    region: 'International',
    category: 'Storytelling',
    accent: 'British / International (UK)',
    tone: 'Stern & Firm',
    description: 'Prestigious, expressive classical British literary narrator with dramatic eloquence and theatrical nuance.',
    styleTag: 'Classical Literature',
    sampleLine: 'It is a truth universally acknowledged, that a single thought held with conviction can alter the fate of an empire.',
    pitch: 1.08,
    rate: 0.98,
  },

  // 2. Narrative (Documentary & Broadcast)
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    region: 'International',
    category: 'Narrative',
    accent: 'International English (US)',
    tone: 'Authoritative',
    description: 'Deep, steady, and commanding baritone documentary voice with rich, cinematic vocal texture.',
    styleTag: 'Deep Baritone',
    sampleLine: 'From the depths of uncharted oceans to the outer frontiers of our solar system, humanity continues its relentless pursuit of discovery.',
    pitch: 0.72,
    rate: 0.96,
  },
  {
    id: 'Sarah',
    name: 'Sarah',
    gender: 'Female',
    region: 'International',
    category: 'Narrative',
    accent: 'International English (US)',
    tone: 'Smooth Broadcast',
    description: 'Bright, polished, and engaging broadcast voice for global intelligence briefings and news features.',
    styleTag: 'News Anchor',
    sampleLine: 'Good evening. Tonight’s lead report focuses on major breakthroughs in generative artificial intelligence and neural computing.',
    pitch: 1.16,
    rate: 1.0,
  },
  {
    id: 'James',
    name: 'James',
    gender: 'Male',
    region: 'International',
    category: 'Narrative',
    accent: 'International English (AU)',
    tone: 'Smooth Broadcast',
    description: 'Polished, classic Australian/International broadcaster baritone for cultural commentary and documentaries.',
    styleTag: 'Broadcaster Baritone',
    sampleLine: 'Welcome to this week’s international dispatch, examining ecological preservation across coastal coral reefs.',
    pitch: 0.85,
    rate: 1.0,
  },

  // 3. Descriptive (Explanatory & Briefings)
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    region: 'International',
    category: 'Descriptive',
    accent: 'International Neutral (CA)',
    tone: 'Corporate Direct',
    description: 'Crisp, articulate neutral studio voice tailored for technical documentation and system briefings.',
    styleTag: 'Neutral Studio',
    sampleLine: 'The automated diagnostic cycle has finished. All internal data pipelines are operating within nominal specifications.',
    pitch: 1.12,
    rate: 1.0,
  },
  {
    id: 'Arthur',
    name: 'Arthur',
    gender: 'Male',
    region: 'International',
    category: 'Descriptive',
    accent: 'British / International (UK)',
    tone: 'Stern & Firm',
    description: 'Stern, commanding British executive voice with crisp acoustic definition for analytical reports.',
    styleTag: 'Prestigious Director',
    sampleLine: 'Strict adherence to security governance and risk containment frameworks is mandatory across all global branches.',
    pitch: 0.76,
    rate: 1.02,
  },
];

export const CONTEXT_PRESETS: ContextPreset[] = [
  {
    id: 'conversational',
    label: 'Conversational AI',
    iconName: 'MessageSquare',
    description: 'Natural dialogue flow with realistic cadence and responsive inflection.',
    toneGuidance: 'Friendly, helpful, and natural conversation flow.',
    suggestedVoice: 'Priya',
    suggestedSpeed: 1.0,
  },
  {
    id: 'narrator',
    label: 'Studio Narrator',
    iconName: 'Mic',
    description: 'Professional, articulate voice-over pacing for videos, audiobooks, and modules.',
    toneGuidance: 'Crisp, measured, authoritative broadcast voice.',
    suggestedVoice: 'Aarav',
    suggestedSpeed: 1.0,
  },
  {
    id: 'storytelling',
    label: 'Storytelling & Expressive',
    iconName: 'Sparkles',
    description: 'Vivid emotion, dynamic pitch shifts, and expressive pauses for dramatic reading.',
    toneGuidance: 'Engaging, expressive, and atmospheric storytelling.',
    suggestedVoice: 'Deepa',
    suggestedSpeed: 0.95,
  },
  {
    id: 'educational',
    label: 'Educational & Tutorial',
    iconName: 'GraduationCap',
    description: 'Patient, highly intelligible teaching cadence ideal for lectures and learning.',
    toneGuidance: 'Clear, patient, structured instructional delivery.',
    suggestedVoice: 'Rohan',
    suggestedSpeed: 1.0,
  },
  {
    id: 'announcement',
    label: 'Formal Announcement',
    iconName: 'Megaphone',
    description: 'Direct, clear, and confident tone for public announcements and alerts.',
    toneGuidance: 'Crisp, formal, and authoritative broadcast announcement.',
    suggestedVoice: 'Fenrir',
    suggestedSpeed: 1.05,
  },
  {
    id: 'assistant',
    label: 'Smart Assistant',
    iconName: 'Bot',
    description: 'Concise, upbeat, and quick assistance for productivity and hands-free voice tasks.',
    toneGuidance: 'Quick, helpful, precise smart assistant feedback.',
    suggestedVoice: 'Kore',
    suggestedSpeed: 1.1,
  },
];

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Downloads audio file directly from backend via POST for arbitrary large text payloads
 */
export async function downloadServerAudioDirect(text: string, voice: string, filename?: string): Promise<void> {
  try {
    const res = await fetch('/api/tts/download-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice,
        filename: filename || `VoiceCraft_${voice}_Audio`,
      }),
    });

    if (!res.ok) throw new Error('Download request failed');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || `VoiceCraft_${voice}_Audio`}.mp3`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (err) {
    console.error('Direct audio download error:', err);
  }
}

/**
 * Converts a base64 data: URL to a binary Blob and triggers download via object URL.
 * Works seamlessly across Chrome, Edge, Safari, Firefox, and iframe environments.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  try {
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'audio/mp3';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      }, 2000);
      return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    }, 2000);
  } catch (err) {
    console.error('Error in downloadDataUrl:', err);
    // Direct trigger fallback
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }
}

export function downloadAudioFile(dataUrl: string, baseName: string): void {
  const isMp3 = dataUrl.startsWith('data:audio/mp3') || dataUrl.startsWith('data:audio/mpeg');
  const ext = isMp3 ? '.mp3' : '.wav';
  const cleanBase = baseName.replace(/\.(wav|mp3)$/i, '');
  const filename = `${cleanBase}${ext}`;
  downloadDataUrl(dataUrl, filename);
}

export function downloadText(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Generate a client-side audio tone/speech buffer as a zero-failure fallback
 */
export function generateClientAudioDataUrl(durationSeconds = 3, freq = 440): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // Write WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Synthesize mild vocal harmonic formant
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, Math.min(t * 10, (durationSeconds - t) * 5));
    const sample = (
      Math.sin(2 * Math.PI * freq * t) * 0.5 +
      Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.25 +
      Math.sin(2 * Math.PI * (freq * 2) * t) * 0.15
    ) * env * 0.4;
    const s = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Speaks text using the browser SpeechSynthesis engine if available.
 * Guaranteed to stop any existing audio stream first.
 */
export function speakBrowserSpeech(
  text: string, 
  voiceName: string, 
  rate = 1.0, 
  pitch = 1.0, 
  volume = 1.0
): Promise<boolean> {
  return new Promise((resolve) => {
    stopAllAudio();
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(false);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.5, Math.min(2.0, rate));
      utterance.pitch = Math.max(0.5, Math.min(1.8, pitch));
      utterance.volume = Math.max(0, Math.min(1, volume));

      const voices = window.speechSynthesis.getVoices();
      const voiceOption = VOICE_OPTIONS.find(v => v.id === voiceName);
      
      if (voiceOption) {
        const matchingVoice = voices.find(v => {
          if (voiceOption.region === 'Indian') {
            return v.lang.includes('IN') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('hindi');
          }
          if (voiceOption.accent.includes('UK') || voiceOption.accent.includes('British')) {
            return v.lang.includes('GB') || v.name.toLowerCase().includes('uk') || v.name.toLowerCase().includes('british');
          }
          if (voiceOption.accent.includes('AU')) {
            return v.lang.includes('AU') || v.name.toLowerCase().includes('australia');
          }
          return v.lang.includes('US') || v.lang.includes('en');
        });

        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      resolve(false);
    }
  });
}
