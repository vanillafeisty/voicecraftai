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
  ChevronUp,
  Power,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { VoiceName, VoiceOption, VoicePersonalization, MAX_PLUGGED_VOICES, MIN_PLUGGED_VOICES } from '../types';
import { VOICE_OPTIONS, playExclusiveAudio, stopAllAudio, speakBrowserSpeech } from '../utils/audioUtils';

interface VoicePersonalizationPanelProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  pluggedVoices?: VoiceName[];
  onPlugVoice?: (voice: VoiceName) => void;
  onUnplugVoice?: (voice: VoiceName) => void;
  onTogglePlugVoice?: (voice: VoiceName) => void;
  personalization: VoicePersonalization;
  onUpdatePersonalization: (settings: Partial<VoicePersonalization>) => void;
  onResetPersonalization?: () => void;
  compact?: boolean;
}

export const VoicePersonalizationPanel: React.FC<VoicePersonalizationPanelProps> = ({
  selectedVoice,
  onSelectVoice,
  pluggedVoices = ['Priya', 'Aarav', 'Sarah'],
  onPlugVoice,
  onUnplugVoice,
  onTogglePlugVoice,
  personalization,
  onUpdatePersonalization,
  onResetPersonalization,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [testingVoiceId, setTestingVoiceId] = useState<VoiceName | null>(null);
  const [activeSlotVoice, setActiveSlotVoice] = useState<VoiceName>(selectedVoice);
  const audioTestRef = useRef<HTMLAudioElement | null>(null);

  const activeVoiceOption = VOICE_OPTIONS.find((v) => v.id === selectedVoice) || VOICE_OPTIONS[0];

  const handleTestSpecificVoice = async (voiceId: VoiceName, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (testingVoiceId === voiceId) {
      stopAllAudio();
      setTestingVoiceId(null);
      return;
    }

    stopAllAudio();
    setTestingVoiceId(voiceId);

    const voiceOpt = VOICE_OPTIONS.find(v => v.id === voiceId) || VOICE_OPTIONS[0];
    const testLine = `${voiceOpt.sampleLine}`;

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testLine,
          voice: voiceId,
        }),
      });

      const data = await res.json();
      if (data.success && data.wavDataUrl && audioTestRef.current) {
        const audio = audioTestRef.current;
        const effectiveRate = (voiceOpt.rate || 1.0) * (personalization.speed || 1.0);
        await playExclusiveAudio(audio, data.wavDataUrl, effectiveRate, personalization.volume);
      } else {
        const effectiveRate = (voiceOpt.rate || 1.0) * (personalization.speed || 1.0);
        await speakBrowserSpeech(
          testLine, 
          voiceId, 
          effectiveRate, 
          personalization.pitch, 
          personalization.volume
        );
        setTestingVoiceId(null);
      }
    } catch (err) {
      console.warn('Test audio fallback:', err);
      const effectiveRate = (voiceOpt.rate || 1.0) * (personalization.speed || 1.0);
      await speakBrowserSpeech(
        testLine, 
        voiceId, 
        effectiveRate, 
        personalization.pitch, 
        personalization.volume
      );
      setTestingVoiceId(null);
    }
  };

  const handleSelectActiveVoice = (voiceId: VoiceName) => {
    stopAllAudio();
    onSelectVoice(voiceId);
    setActiveSlotVoice(voiceId);
    const targetVoice = VOICE_OPTIONS.find((v) => v.id === voiceId);
    if (targetVoice) {
      onUpdatePersonalization({
        pitch: targetVoice.pitch || 1.0,
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-teal-500/30 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm transition-all">
      {/* Hidden test audio player */}
      <audio
        ref={audioTestRef}
        onEnded={() => setTestingVoiceId(null)}
        onError={() => setTestingVoiceId(null)}
      />

      {/* Top Header Strip: Active Plugged-in Voices Rack Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold shadow-inner">
            <Zap className="w-5 h-5 text-teal-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                Multi-Voice Plug-in Rack
              </span>
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {pluggedVoices.length}/{MAX_PLUGGED_VOICES} Voices Plugged In
              </span>
              <span className="text-slate-400 text-xs">
                Active Speaking Voice: <strong className="text-teal-300">{activeVoiceOption.name}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Keep 2–3 voices plugged in simultaneously. Enable or disable voices anytime to switch or alternate dialogue seamlessly.
            </p>
          </div>
        </div>

        {/* Quick Actions: Test Active Voice & Expand/Collapse */}
        <div className="flex items-center gap-2">
          <button
            id="test-plugged-voice-btn"
            onClick={() => handleTestSpecificVoice(selectedVoice)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
              testingVoiceId === selectedVoice
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-teal-500/20'
            }`}
            title="Listen to active voice sample"
          >
            {testingVoiceId === selectedVoice ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Stop Sample</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test {selectedVoice}</span>
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

      {/* 2-3 Plugged-in Voice Slots Grid (Always Visible) */}
      <div className="mt-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Plugged-in Voice Slots (2–3 Active Channels)
          </span>
          <span className="text-[11px] text-slate-400">
            Click slot to switch active speaking voice • Toggle power icon to disable/unplug
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((slotIdx) => {
            const voiceId = pluggedVoices[slotIdx];
            if (!voiceId) {
              return (
                <div
                  key={`empty-slot-${slotIdx}`}
                  className="p-3.5 rounded-2xl border-2 border-dashed border-slate-800/90 bg-slate-950/40 flex flex-col items-center justify-center text-center space-y-2 min-h-[100px]"
                >
                  <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    Voice Slot #{slotIdx + 1} Available
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Enable any voice below to plug into this slot
                  </p>
                </div>
              );
            }

            const targetVoiceId = voiceId as VoiceName;
            const vOpt = VOICE_OPTIONS.find(v => v.id === targetVoiceId) || VOICE_OPTIONS[0];
            const isSelected = targetVoiceId === selectedVoice;
            const isPlayingThis = testingVoiceId === targetVoiceId;

            return (
              <div
                key={targetVoiceId}
                onClick={() => handleSelectActiveVoice(targetVoiceId)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-gradient-to-br from-teal-950/70 to-slate-900 border-teal-400 text-teal-100 shadow-md shadow-teal-500/20 ring-1 ring-teal-400/50'
                    : 'bg-slate-950/70 hover:bg-slate-850/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                      isSelected ? 'bg-teal-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{slotIdx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white group-hover:text-teal-300">
                          {vOpt.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          vOpt.gender === 'Female' ? 'bg-pink-950/70 text-pink-300' : 'bg-blue-950/70 text-blue-300'
                        }`}>
                          {vOpt.gender}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {vOpt.region === 'Indian' ? '🇮🇳 Indian' : '🌐 Intl'} • {vOpt.tone}
                      </p>
                    </div>
                  </div>

                  {/* Disable / Unplug Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUnplugVoice) onUnplugVoice(targetVoiceId);
                      else if (onTogglePlugVoice) onTogglePlugVoice(targetVoiceId);
                    }}
                    disabled={pluggedVoices.length <= MIN_PLUGGED_VOICES}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      pluggedVoices.length <= MIN_PLUGGED_VOICES
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40'
                    }`}
                    title={
                      pluggedVoices.length <= MIN_PLUGGED_VOICES
                        ? 'At least 1 voice must remain plugged in'
                        : `Disable and unplug ${vOpt.name}`
                    }
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Controls inside slot card */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
                  <button
                    onClick={(e) => handleTestSpecificVoice(targetVoiceId, e)}
                    className={`px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      isPlayingThis
                        ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800'
                    }`}
                    title="Play sample for this plugged voice"
                  >
                    {isPlayingThis ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                    <span>{isPlayingThis ? 'Playing' : 'Sample'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {isSelected ? (
                      <span className="text-teal-300 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-teal-400" />
                        <span>Active Speaker</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 group-hover:text-teal-400">
                        Click to Switch
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Personalization Controls */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-slate-800/90 space-y-5 animate-in fade-in duration-200">
          {/* 1. Voice Library Plug/Unplug Toggles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>Voice Library • Enable / Disable Voices (Up to 3 Plugged In)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Click any voice to plug in and set active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {VOICE_OPTIONS.map((v) => {
                const isPlugged = pluggedVoices.includes(v.id);
                const isSelected = v.id === selectedVoice;

                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectActiveVoice(v.id)}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-950/90 border-teal-400 text-white shadow-md shadow-teal-500/20 ring-1 ring-teal-400/50'
                        : isPlugged
                        ? 'bg-slate-900/90 border-teal-500/50 text-slate-200 shadow-sm'
                        : 'bg-slate-950/60 hover:bg-slate-850/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs group-hover:text-teal-300">{v.name}</span>
                      
                      {/* Enable/Disable Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTogglePlugVoice) {
                            onTogglePlugVoice(v.id);
                          } else if (isPlugged && onUnplugVoice) {
                            onUnplugVoice(v.id);
                          } else if (!isPlugged && onPlugVoice) {
                            onPlugVoice(v.id);
                          }
                        }}
                        className={`p-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isPlugged
                            ? 'bg-teal-500/20 text-teal-300 hover:bg-rose-950/40 hover:text-rose-300'
                            : 'bg-slate-800 text-slate-400 hover:bg-teal-950/50 hover:text-teal-300'
                        }`}
                        title={isPlugged ? 'Click to Disable / Unplug voice' : 'Click to Enable & Plug in voice'}
                      >
                        <Power className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 truncate mt-1">
                      {v.region === 'Indian' ? '🇮🇳 Indian' : '🌐 Intl'} • {v.category}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[9px] pt-1 border-t border-slate-800/80">
                      {isSelected ? (
                        <span className="font-bold text-teal-300 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 text-teal-400" />
                          Active
                        </span>
                      ) : isPlugged ? (
                        <span className="font-semibold text-teal-400">Plugged In</span>
                      ) : (
                        <span className="text-slate-500 group-hover:text-slate-300">Disabled</span>
                      )}

                      <button
                        onClick={(e) => handleTestSpecificVoice(v.id, e)}
                        className="text-slate-400 hover:text-teal-300 flex items-center gap-0.5"
                        title="Quick preview"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Sliders & Personalization Controls for Active Voice */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                <span>Acoustic Fine-Tuning for Active Voice: <strong className="text-teal-300">{activeVoiceOption.name}</strong></span>
              </span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Volume */}
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

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <button
                    onClick={() => onUpdatePersonalization({ volume: 0.5 })}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${personalization.volume <= 0.6 ? 'bg-emerald-500/20 text-emerald-300' : 'hover:text-white'}`}
                  >
                    50%
                  </button>
                  <button
                    onClick={() => onUpdatePersonalization({ volume: 0.8 })}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${Math.abs(personalization.volume - 0.8) < 0.1 ? 'bg-emerald-500/20 text-emerald-300' : 'hover:text-white'}`}
                  >
                    80%
                  </button>
                  <button
                    onClick={() => onUpdatePersonalization({ volume: 1.0 })}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${personalization.volume >= 0.95 ? 'bg-emerald-500/20 text-emerald-300' : 'hover:text-white'}`}
                  >
                    100% Max
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
