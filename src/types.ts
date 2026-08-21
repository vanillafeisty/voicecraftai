export type VoiceName = 'Priya' | 'Aarav' | 'Deepa' | 'Rohan' | 'Kore' | 'Fenrir';
export type AudioEngine = 'gemini' | 'studio' | 'browser';

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: 'Female' | 'Male';
  accent: string;
  description: string;
  styleTag: string;
}

export type ContextPresetId = 
  | 'narrator'
  | 'conversational'
  | 'announcement'
  | 'storytelling'
  | 'assistant'
  | 'educational';

export interface ContextPreset {
  id: ContextPresetId;
  label: string;
  iconName: string;
  description: string;
  toneGuidance: string;
  suggestedVoice: VoiceName;
  suggestedSpeed: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  audioUrl?: string;
  durationSeconds?: number;
  voice?: VoiceName;
  engine?: AudioEngine;
  isGenerating?: boolean;
  error?: string;
  contextPreset?: ContextPresetId;
}

export interface TextToSpeechRequest {
  text: string;
  voice?: VoiceName;
  speed?: number;
  pitch?: number;
  engine?: AudioEngine;
  contextPreset?: ContextPresetId;
}

export interface TextToSpeechResponse {
  success: boolean;
  wavDataUrl: string;
  durationSeconds: number;
  sampleRate: number;
  voice: string;
  engine: string;
  error?: string;
}
