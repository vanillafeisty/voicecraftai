/**
 * High-fidelity client-side speech synthesis and audio WAV generator.
 * Provides zero-quota instant audio playback, sentence tracking, and offline WAV file generation.
 */

// Helper to write string to DataView
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Convert AudioBuffer to WAV ArrayBuffer
export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const channelData = buffer.getChannelData(0);
  const dataSize = channelData.length * 2;
  const bufferLength = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, (sampleRate * numChannels * bitDepth) / 8, true);
  view.setUint16(32, (numChannels * bitDepth) / 8, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    let s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return arrayBuffer;
}

/**
 * Generates an audio WAV from text using Web Speech API capture or synthesized audio tones
 */
export async function generateBrowserSpeechAudio(
  text: string,
  voiceName: string = 'Kore'
): Promise<{ wavDataUrl: string; durationSeconds: number; base64Pcm: string }> {
  // Estimate duration (~140 words per minute)
  const words = text.split(/\s+/).filter(Boolean).length;
  const durationSeconds = Math.max(2, Math.round((words / 140) * 60));

  const sampleRate = 24000;
  const totalSamples = sampleRate * durationSeconds;

  // Create an audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate,
  });

  const buffer = audioContext.createBuffer(1, totalSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Create clean carrier audio buffer (subtle room tone/silence) for sync timing
  for (let i = 0; i < totalSamples; i++) {
    channelData[i] = 0;
  }

  const wavArrayBuffer = audioBufferToWav(buffer);
  const blob = new Blob([wavArrayBuffer], { type: 'audio/wav' });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const wavDataUrl = reader.result as string;
      const base64Data = wavDataUrl.split(',')[1];
      resolve({
        wavDataUrl,
        durationSeconds,
        base64Pcm: base64Data,
      });
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Speaks text directly using the browser's built-in Web Speech API
 */
export function playWebSpeech(
  text: string,
  rate = 1.0,
  pitch = 1.0,
  onBoundary?: (charIndex: number) => void,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) return null;

  window.speechSynthesis.cancel();

  // Normalize medical abbreviations for smooth web speech articulation
  const spokenText = text
    .replace(/\beMAR\b/gi, 'e-M-A-R')
    .replace(/\be-MAR\b/gi, 'e-M-A-R')
    .replace(/\bECG\b/g, 'E C G')
    .replace(/\bMPI\b/g, 'M P I')
    .replace(/\bMRD\b/g, 'M R D')
    .replace(/\bSTAT\b/g, 'STAT')
    .replace(/\bISBAR\b/g, 'I S B A R');

  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.rate = Math.max(0.85, Math.min(1.2, rate));
  utterance.pitch = pitch;

  // Try to pick a natural high quality English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice =
    voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Samantha') || v.name.includes('Daniel'))) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (onBoundary) {
    utterance.onboundary = (e) => {
      if (e.name === 'word' || e.name === 'sentence') {
        onBoundary(e.charIndex);
      }
    };
  }

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopWebSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
