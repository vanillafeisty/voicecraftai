export type VoiceRegion = 'Indian' | 'International';
export type VoiceGender = 'Female' | 'Male';
export type VoiceCategory = 'Descriptive' | 'Narrative' | 'Storytelling';
export type VoiceTone = 
  | 'Stern & Firm' 
  | 'Flowing & Warm' 
  | 'Authoritative' 
  | 'Corporate Direct' 
  | 'Smooth Broadcast' 
  | 'Articulate & Gentle'
  | 'Ultra-Humanized & Soulful'
  | 'Ultra-Humanized & Dramatic'
  | 'Ultra-Humanized & Warm';

export type VoiceName = 
  | 'Priya' 
  | 'Kavita' 
  | 'Deepa' 
  | 'Aarav' 
  | 'Vikram' 
  | 'Rohan'
  | 'Ananya'
  | 'Kabir'
  | 'Sarah' 
  | 'Eleanor' 
  | 'Kore' 
  | 'Arthur' 
  | 'Fenrir' 
  | 'James'
  | 'Oliver';

export type AudioEngine = 'gemini' | 'studio' | 'browser';

export interface VoicePersonalization {
  pitch: number; // 0.75 (Deep) to 1.35 (Bright) - Default 1.0
  speed: number; // 0.75x (Relaxed) to 1.75x (Fast) - Default 1.0
  toneStyle: 'natural' | 'storyteller' | 'broadcast' | 'warm' | 'authoritative' | 'soothing';
  volume: number; // 0.1 to 1.0 - Default 1.0
  emphasis: 'standard' | 'expressive' | 'calm' | 'crisp';
}

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: VoiceGender;
  region: VoiceRegion;
  category: VoiceCategory;
  accent: string;
  description: string;
  styleTag: string;
  tone: VoiceTone;
  sampleLine: string;
  pitch: number; // playback pitch modifier
  rate: number;  // playback rate modifier
  isHumanized?: boolean; // Ultra-realistic human cadence (non-computerized)
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
  speed?: number;
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

export const MAX_PLUGGED_VOICES = 3;
export const MIN_PLUGGED_VOICES = 1;
export const DEFAULT_PLUGGED_VOICES: VoiceName[] = ['Priya', 'Aarav', 'Sarah'];

export interface MultiVoiceSettings {
  pluggedVoices: VoiceName[];
  activeVoice: VoiceName;
}

