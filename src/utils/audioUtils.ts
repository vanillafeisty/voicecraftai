import { VoiceOption, ContextPreset, VoiceName } from '../types';

export const VOICE_OPTIONS: VoiceOption[] = [
  // 🇮🇳 INDIAN VOICES
  {
    id: 'Priya',
    name: 'Priya',
    gender: 'Female',
    region: 'Indian',
    accent: 'Indian English',
    tone: 'Flowing & Warm',
    description: 'Natural, articulate, and warm corporate voice with smooth conversational flow.',
    styleTag: 'Flowing & Warm',
    sampleLine: 'Good morning. Here is the operational summary for our upcoming quarterly milestones.',
    pitch: 1.15,
    rate: 1.0,
  },
  {
    id: 'Kavita',
    name: 'Kavita',
    gender: 'Female',
    region: 'Indian',
    accent: 'Indian English',
    tone: 'Stern & Firm',
    description: 'Crisp, stern, and commanding executive boardroom delivery.',
    styleTag: 'Stern & Executive',
    sampleLine: 'Compliance protocols must be followed strictly across all enterprise deployments without exception.',
    pitch: 1.02,
    rate: 1.04,
  },
  {
    id: 'Deepa',
    name: 'Deepa',
    gender: 'Female',
    region: 'Indian',
    accent: 'Indian English',
    tone: 'Articulate & Gentle',
    description: 'Gentle, soothing, and clear instructional tone for audiobooks and tutorials.',
    styleTag: 'Gentle & Clear',
    sampleLine: 'Please review the following documentation carefully to ensure a seamless onboarding experience.',
    pitch: 1.22,
    rate: 0.95,
  },
  {
    id: 'Aarav',
    name: 'Aarav',
    gender: 'Male',
    region: 'Indian',
    accent: 'Indian English',
    tone: 'Flowing & Warm',
    description: 'Confident, resonant, and natural business narrative voice.',
    styleTag: 'Confident & Resonant',
    sampleLine: 'Our financial forecasts indicate strong, sustainable growth across all digital infrastructure sectors.',
    pitch: 0.88,
    rate: 1.0,
  },
  {
    id: 'Vikram',
    name: 'Vikram',
    gender: 'Male',
    region: 'Indian',
    accent: 'Indian English',
    tone: 'Stern & Firm',
    description: 'Stern, commanding, and disciplined leadership cadence with authoritative delivery.',
    styleTag: 'Stern & Authoritative',
    sampleLine: 'Immediate attention to detail and strict deadline execution are non-negotiable standards.',
    pitch: 0.78,
    rate: 1.03,
  },
  {
    id: 'Rohan',
    name: 'Rohan',
    gender: 'Male',
    region: 'Indian',
    accent: 'Indian English',
    tone: 'Corporate Direct',
    description: 'Modern, upbeat, and articulate presenter for technical walkthroughs.',
    styleTag: 'Modern & Dynamic',
    sampleLine: 'Let us explore the core architecture powering our real-time speech synthesis engine.',
    pitch: 0.92,
    rate: 1.06,
  },

  // 🌐 INTERNATIONAL VOICES
  {
    id: 'Sarah',
    name: 'Sarah',
    gender: 'Female',
    region: 'International',
    accent: 'International English (US)',
    tone: 'Flowing & Warm',
    description: 'Bright, polished, and flowing conversational broadcast voice.',
    styleTag: 'Flowing & Polished',
    sampleLine: 'Welcome to today’s global intelligence briefing covering artificial intelligence breakthroughs.',
    pitch: 1.18,
    rate: 1.0,
  },
  {
    id: 'Eleanor',
    name: 'Eleanor',
    gender: 'Female',
    region: 'International',
    accent: 'British / International (UK)',
    tone: 'Stern & Firm',
    description: 'Stern, crisp, and prestigious corporate director with aristocratic clarity.',
    styleTag: 'Stern & Prestigious',
    sampleLine: 'All regulatory directives take effect immediately and require comprehensive departmental verification.',
    pitch: 1.06,
    rate: 1.02,
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    region: 'International',
    accent: 'International Neutral (CA)',
    tone: 'Corporate Direct',
    description: 'Crisp, articulate neutral studio voice for formal communications.',
    styleTag: 'Neutral Studio',
    sampleLine: 'System diagnostic complete. All parameters are functioning within optimal thresholds.',
    pitch: 1.12,
    rate: 1.0,
  },
  {
    id: 'Arthur',
    name: 'Arthur',
    gender: 'Male',
    region: 'International',
    accent: 'British / International (UK)',
    tone: 'Stern & Firm',
    description: 'Stern, commanding, and authoritative corporate executive director.',
    styleTag: 'Stern & Commanding',
    sampleLine: 'Strict adherence to security governance is required across all operational divisions.',
    pitch: 0.76,
    rate: 1.02,
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    region: 'International',
    accent: 'International English (US)',
    tone: 'Authoritative',
    description: 'Deep, steady, and resonant baritone voice with rich vocal texture.',
    styleTag: 'Deep & Authoritative',
    sampleLine: 'Standing by for mission-critical briefing and strategic deployment parameters.',
    pitch: 0.74,
    rate: 0.96,
  },
  {
    id: 'James',
    name: 'James',
    gender: 'Male',
    region: 'International',
    accent: 'International English (AU)',
    tone: 'Smooth Broadcast',
    description: 'Polished, smooth classic broadcaster baritone for narrations and intros.',
    styleTag: 'Smooth Broadcast',
    sampleLine: 'Reporting live from the economic forum with today’s key market and technology highlights.',
    pitch: 0.84,
    rate: 1.0,
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
