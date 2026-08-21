export type VoiceRegion = 'Indian' | 'International';
export type VoiceGender = 'Female' | 'Male';
export type VoiceTone = 'Stern & Firm' | 'Flowing & Warm' | 'Authoritative' | 'Corporate Direct' | 'Smooth Broadcast' | 'Articulate & Gentle';

export type VoiceName = 
  | 'Priya' 
  | 'Kavita' 
  | 'Deepa' 
  | 'Aarav' 
  | 'Vikram' 
  | 'Rohan' 
  | 'Sarah' 
  | 'Eleanor' 
  | 'Kore' 
  | 'Arthur' 
  | 'Fenrir' 
  | 'James';

export type AudioEngine = 'gemini' | 'studio' | 'browser';

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: VoiceGender;
  region: VoiceRegion;
  accent: string;
  description: string;
  styleTag: string;
  tone: VoiceTone;
  sampleLine: string;
  pitch: number; // playback pitch modifier
  rate: number;  // playback rate modifier
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
