import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  Sparkles, 
  Volume2, 
  Gauge, 
  Music, 
  Play, 
  Pause, 
  Check, 
  RotateCcw,
  Zap,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { VoiceName, VoiceOption, VoicePersonalization } from '../types';
import { VOICE_OPTIONS, playExclusiveAudio, stopAllAudio, speakBrowserSpeech } from '../utils/audioUtils';

interface VoicePersonalizationPanelProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  personalization: VoicePersonalization;
  onUpdatePersonalization: (settings: Partial<VoicePersonalization>) => void;
  onResetPersonalization?: () => void;
  compact?: boolean;
}

export const VoicePersonalizationPanel: React.FC<VoicePersonalizationPanelProps> = ({
  selectedVoice,
  onSelectVoice,
  personalization,
  onUpdatePersonalization,
  onResetPersonalization,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [isTestingAudio, setIsTestingAudio] = useState<boolean>(false);
  const audioTestRef = useRef<HTMLAudioElement | null>(null);

  const activeVoiceOption = VOICE_OPTIONS.find((v) => v.id === selectedVoice) || VOICE_OPTIONS[0];

  const handleTestVoice = async () => {
    if (isTestingAudio) {
      stopAllAudio();
      setIsTestingAudio(false);
      return;
    }

    // Stop all other audio first - guarantee single voice stream
    stopAllAudio();
    setIsTestingAudio(true);

    const testLine = `${activeVoiceOption.sampleLine}`;

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testLine,
          voice: selectedVoice,
        }),
      });

      const data = await res.json();
      if (data.success && data.wavDataUrl && audioTestRef.current) {
        const audio = audioTestRef.current;
        const effectiveRate = activeVoiceOption.rate * personalization.speed;
        await playExclusiveAudio(audio, data.wavDataUrl, effectiveRate, personalization.volume);
      } else {
        // High quality speech fallback if server tts fails
        const effectiveRate = activeVoiceOption.rate * personalization.speed;
        await speakBrowserSpeech(
          testLine, 
          selectedVoice, 
          effectiveRate, 
          personalization.pitch, 
          personalization.volume
        );
        setIsTestingAudio(false);
      }
    } catch (err) {
      console.warn('Test audio fallback:', err);
      const effectiveRate = activeVoiceOption.rate * personalization.speed;
      await speakBrowserSpeech(
        testLine, 
        selectedVoice, 
        effectiveRate, 
        personalization.pitch, 
        personalization.volume
      );
      setIsTestingAudio(false);
    }
  };

  const handlePlugInVoice = (voiceId: VoiceName) => {
    stopAllAudio();
    onSelectVoice(voiceId);
    const targetVoice = VOICE_OPTIONS.find((v) => v.id === voiceId);
    if (targetVoice) {
      // Intelligently sync base pitch / tone
      onUpdatePersonalization({
        pitch: targetVoice.pitch || 1.0,
        speed: 1.0,
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-teal-500/30 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm transition-all">
      {/* Hidden test audio player */}
      <audio
        ref={audioTestRef}
        onEnded={() => setIsTestingAudio(false)}
        onError={() => setIsTestingAudio(false)}
      />

      {/* Top Header Strip: Active Plugged-in Voice & Collapse Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold shadow-inner">
            <Zap className="w-5 h-5 text-teal-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                Single Plugged-In Voice
              </span>
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {activeVoiceOption.name} ({activeVoiceOption.region} • {activeVoiceOption.gender})
              </span>
              {activeVoiceOption.isHumanized && (
                <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ✨ Ultra-Humanized
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {activeVoiceOption.tone} — {activeVoiceOption.description}
            </p>
          </div>
        </div>

        {/* Quick Actions: Test Voice & Toggle Panel */}
        <div className="flex items-center gap-2">
          <button
            id="test-plugged-voice-btn"
            onClick={handleTestVoice}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
              isTestingAudio
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-teal-500/20'
            }`}
            title="Listen to this personalized voice sample"
          >
            {isTestingAudio ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Voice</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Personalization' : 'Personalize Voice Settings'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Personalization Studio */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-slate-800/90 space-y-5 animate-in fade-in duration-200">
          {/* 1. Voice Plug-in Switcher */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                Choose Which Voice to Plug In (Strict Single Channel)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Only the plugged-in voice will generate and play audio
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {VOICE_OPTIONS.map((v) => {
                const isPlugged = v.id === selectedVoice;
                return (
                  <button
                    key={v.id}
                    onClick={() => handlePlugInVoice(v.id)}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                      isPlugged
                        ? 'bg-teal-950/90 border-teal-400 text-white shadow-md shadow-teal-500/20 ring-1 ring-teal-400/50'
                        : 'bg-slate-950/60 hover:bg-slate-850/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{v.name}</span>
                      {isPlugged ? (
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                      ) : (
                        <span className="text-[10px] text-slate-500">{v.gender[0]}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {v.region === 'Indian' ? '🇮🇳 Indian' : '🌐 Intl'} • {v.category}
                    </div>
                    {isPlugged && (
                      <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-teal-300">
                        <Check className="w-2.5 h-2.5 text-teal-400" />
                        <span>Plugged In</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Sliders & Personalization Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            {/* Pitch Tuning */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-teal-400" />
                  Pitch Tuning
                </span>
                <span className="text-teal-300 font-mono font-bold text-[11px]">
                  {personalization.pitch < 0.95 ? 'Deep' : personalization.pitch > 1.1 ? 'Bright' : 'Natural'} ({personalization.pitch.toFixed(2)}x)
                </span>
              </div>

              <input
                type="range"
                min="0.75"
                max="1.35"
                step="0.02"
                value={personalization.pitch}
                onChange={(e) => onUpdatePersonalization({ pitch: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <button
                  onClick={() => onUpdatePersonalization({ pitch: 0.82 })}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${personalization.pitch <= 0.85 ? 'bg-teal-500/20 text-teal-300' : 'hover:text-white'}`}
                >
                  Deep
                </button>
                <button
                  onClick={() => onUpdatePersonalization({ pitch: 1.0 })}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${Math.abs(personalization.pitch - 1.0) < 0.05 ? 'bg-teal-500/20 text-teal-300' : 'hover:text-white'}`}
                >
                  Natural
                </button>
                <button
                  onClick={() => onUpdatePersonalization({ pitch: 1.22 })}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${personalization.pitch >= 1.2 ? 'bg-teal-500/20 text-teal-300' : 'hover:text-white'}`}
                >
                  Bright
                </button>
              </div>
            </div>

            {/* Speech Cadence / Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Pacing & Cadence
                </span>
                <span className="text-cyan-300 font-mono font-bold text-[11px]">
                  {personalization.speed.toFixed(2)}x Speed
                </span>
              </div>

              <input
                type="range"
                min="0.75"
                max="1.75"
                step="0.05"
                value={personalization.speed}
                onChange={(e) => onUpdatePersonalization({ speed: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <button
                  onClick={() => onUpdatePersonalization({ speed: 0.85 })}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${personalization.speed <= 0.88 ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'}`}
                >
                  Relaxed
                </button>
                <button
                  onClick={() => onUpdatePersonalization({ speed: 1.0 })}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${Math.abs(personalization.speed - 1.0) < 0.05 ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'}`}
                >
                  1.0x Normal
                </button>
                <button
                  onClick={() => onUpdatePersonalization({ speed: 1.25 })}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${personalization.speed >= 1.2 ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'}`}
                >
                  1.25x Fast
                </button>
              </div>
            </div>

            {/* Tone Style Delivery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Tone Profile
                </span>
                <span className="text-teal-300 font-medium text-[11px] capitalize">
                  {personalization.toneStyle}
                </span>
              </div>

              <select
                value={personalization.toneStyle}
                onChange={(e) => onUpdatePersonalization({ toneStyle: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
              >
                <option value="natural">Natural Conversational</option>
                <option value="storyteller">Soulful Storyteller</option>
                <option value="broadcast">News & Broadcast Anchor</option>
                <option value="warm">Warm & Empathetic</option>
                <option value="authoritative">Authoritative Executive</option>
                <option value="soothing">Gentle Bedtime / Relaxation</option>
              </select>

              <p className="text-[10px] text-slate-400 truncate">
                Modulates prosody and emotional cadence
              </p>
            </div>

            {/* Volume & Reset */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Acoustic Volume
                </span>
                <span className="text-emerald-300 font-mono font-bold text-[11px]">
                  {Math.round(personalization.volume * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={personalization.volume}
                onChange={(e) => onUpdatePersonalization({ volume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300"
              />

              <div className="flex items-center justify-end pt-0.5">
                <button
                  onClick={() => {
                    stopAllAudio();
                    if (onResetPersonalization) {
                      onResetPersonalization();
                    } else {
                      onUpdatePersonalization({
                        pitch: activeVoiceOption.pitch || 1.0,
                        speed: 1.0,
                        toneStyle: 'natural',
                        volume: 1.0,
                      });
                    }
                  }}
                  className="text-[11px] text-slate-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                  title="Reset to Voice Default Settings"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
