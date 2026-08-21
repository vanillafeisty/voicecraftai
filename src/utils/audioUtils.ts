import { VoiceOption, ContextPreset, VoiceName } from '../types';

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'Priya',
    name: 'Priya',
    gender: 'Female',
    accent: 'Indian English',
    description: 'Natural, articulate, and friendly with warm pacing and crisp articulation.',
    styleTag: 'Warm & Natural',
  },
  {
    id: 'Aarav',
    name: 'Aarav',
    gender: 'Male',
    accent: 'Indian English',
    description: 'Confident, clear, and resonant voice suitable for narrations and presentations.',
    styleTag: 'Confident & Clear',
  },
  {
    id: 'Deepa',
    name: 'Deepa',
    gender: 'Female',
    accent: 'Indian English',
    description: 'Gentle, soothing tone with deliberate clarity for storytelling and explanations.',
    styleTag: 'Gentle & Calm',
  },
  {
    id: 'Rohan',
    name: 'Rohan',
    gender: 'Male',
    accent: 'Indian English',
    description: 'Upbeat, modern, and engaging cadence for tutorials and walkthroughs.',
    styleTag: 'Dynamic & Modern',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    accent: 'International English',
    description: 'Crisp, articulate neutral studio voice for formal communications.',
    styleTag: 'Neutral Studio',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    accent: 'International English',
    description: 'Deep, steady, and authoritative voice with rich vocal texture.',
    styleTag: 'Deep & Authoritative',
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
