import { VoiceOption, ContextPreset, VoiceName, VoiceCategory } from '../types';

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
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
