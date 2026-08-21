import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Bot, 
  Sliders, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Radio, 
  Share2,
  RefreshCw
} from 'lucide-react';
import { VoiceName, ContextPresetId } from '../types';
import { VOICE_OPTIONS, CONTEXT_PRESETS, downloadAudioFile, formatTime } from '../utils/audioUtils';
import { ShareAudioModal } from './ShareAudioModal';

interface OpeningLandingPageProps {
  onNavigateToConversation: () => void;
  onNavigateToWorkshop: () => void;
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  initialText?: string;
  initialPreset?: ContextPresetId;
  autoGenerate?: boolean;
  autoDownload?: boolean;
}

const SAMPLE_DEMO_TEXTS: Record<ContextPresetId, { text: string; label: string }> = {
  conversational: {
    label: 'Conversational Dialogue',
    text: 'Hello! I can help you transform any written script or dialogue into natural, context-aware spoken audio with expressive pacing.'
  },
  narrator: {
    label: 'Studio Narration',
    text: 'Welcome to VoiceCraft AI. Our high-fidelity neural speech synthesis engine brings precision, depth, and clarity to your multimedia productions.'
  },
  storytelling: {
    label: 'Expressive Storytelling',
    text: 'Deep within the ancient observatory, a faint rhythmic pulse echoed through the crystal lenses, awakening centuries of forgotten knowledge.'
  },
  educational: {
    label: 'Instructional Tutorial',
    text: 'In this module, we will explore the core principles of text-to-speech synthesis, acoustic modeling, and audio waveform generation.'
  },
  announcement: {
    label: 'Formal Announcement',
    text: 'Attention all passengers. Flight 304 to Singapore is now boarding at Gate 12. Please have your boarding passes ready.'
  },
  assistant: {
    label: 'Smart Assistant',
    text: 'Your calendar is clear for this afternoon. Would you like me to schedule your next audio synthesis session now?'
  }
};

export const OpeningLandingPage: React.FC<OpeningLandingPageProps> = ({
  onNavigateToConversation,
  onNavigateToWorkshop,
  selectedVoice,
  onSelectVoice,
  initialText,
  initialPreset = 'narrator',
  autoGenerate = false,
  autoDownload = false,
}) => {
  // Sandbox State
  const [sandboxPreset, setSandboxPreset] = useState<ContextPresetId>(initialPreset);
  const [sandboxText, setSandboxText] = useState<string>(
    initialText || SAMPLE_DEMO_TEXTS[initialPreset]?.text || SAMPLE_DEMO_TEXTS.narrator.text
  );
  const [sandboxVoice, setSandboxVoice] = useState<VoiceName>(selectedVoice || 'Priya');
  const [isGeneratingSandbox, setIsGeneratingSandbox] = useState<boolean>(false);
  const [sandboxAudioUrl, setSandboxAudioUrl] = useState<string | null>(null);
  const [isPlayingSandbox, setIsPlayingSandbox] = useState<boolean>(false);
  const [sandboxCurrentTime, setSandboxCurrentTime] = useState<number>(0);
  const [sandboxDuration, setSandboxDuration] = useState<number>(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Active Voice Showcase preview card state
  const [previewingVoice, setPreviewingVoice] = useState<VoiceName | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoRunRef = useRef<boolean>(false);

  const handleSelectPreset = (presetId: ContextPresetId) => {
    setSandboxPreset(presetId);
    setSandboxText(SAMPLE_DEMO_TEXTS[presetId].text);
    const presetObj = CONTEXT_PRESETS.find(p => p.id === presetId);
    if (presetObj) {
      setSandboxVoice(presetObj.suggestedVoice);
      onSelectVoice(presetObj.suggestedVoice);
    }
  };

  const handleGenerateSandboxAudio = async (textToUse?: string, voiceToUse?: VoiceName) => {
    const text = (textToUse !== undefined ? textToUse : sandboxText).trim();
    const voice = voiceToUse || sandboxVoice;
    if (!text) return;
    setIsGeneratingSandbox(true);

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice,
          engine: 'studio',
        }),
      });

      const data = await res.json();
      if (data.success && data.wavDataUrl) {
        setSandboxAudioUrl(data.wavDataUrl);
        setSandboxDuration(data.durationSeconds || 3);

        // Auto play generated preview
        if (audioRef.current) {
          audioRef.current.src = data.wavDataUrl;
          audioRef.current.play().then(() => setIsPlayingSandbox(true)).catch(() => {});
        }

        if (autoDownload) {
          downloadAudioFile(data.wavDataUrl, `VoiceCraft_${voice}_Speech`);
        }
      }
    } catch (err) {
      console.error('Error generating sandbox audio:', err);
    } finally {
      setIsGeneratingSandbox(false);
    }
  };

  // Check if loaded with autoGenerate parameter
  useEffect(() => {
    if (autoGenerate && !hasAutoRunRef.current && initialText) {
      hasAutoRunRef.current = true;
      handleGenerateSandboxAudio(initialText, selectedVoice);
    }
  }, [autoGenerate, initialText, selectedVoice]);

  const handleTogglePlay = () => {
    if (!audioRef.current || !sandboxAudioUrl) return;
    if (isPlayingSandbox) {
      audioRef.current.pause();
      setIsPlayingSandbox(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingSandbox(true)).catch(() => {});
    }
  };

  const handleVoiceShowcasePlay = async (voiceId: VoiceName) => {
    if (previewingVoice === voiceId && isPlayingSandbox) {
      audioRef.current?.pause();
      setIsPlayingSandbox(false);
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(voiceId);
    setSandboxVoice(voiceId);
    onSelectVoice(voiceId);
    setIsGeneratingSandbox(true);

    try {
      const sampleText = `Hello, I am ${voiceId}. VoiceCraft AI provides high fidelity speech synthesis with natural inflection.`;
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voice: voiceId,
          engine: 'studio',
        }),
      });

      const data = await res.json();
      if (data.success && data.wavDataUrl) {
        setSandboxAudioUrl(data.wavDataUrl);
        setSandboxDuration(data.durationSeconds || 3);

        if (audioRef.current) {
          audioRef.current.src = data.wavDataUrl;
          audioRef.current.play().then(() => setIsPlayingSandbox(true)).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error previewing voice:', err);
    } finally {
      setIsGeneratingSandbox(false);
    }
  };

  return (
    <div className="space-y-16 max-w-6xl mx-auto">
      {/* Hidden Global Audio Element for Preview */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setSandboxCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setSandboxDuration(e.currentTarget.duration || 3)}
        onEnded={() => {
          setIsPlayingSandbox(false);
          setPreviewingVoice(null);
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 lg:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Next-Generation Context-Aware Text-to-Audio Studio</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turn Any Text into <br />
            <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Lifelike Spoken Audio
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Craft expressive speech with natural inflections, authentic accents, and real-time audio playback. Generate, share customized audio URLs, and download high-quality MP3s instantly.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              id="hero-launch-studio-btn"
              onClick={onNavigateToConversation}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold px-7 py-3.5 rounded-2xl text-sm flex items-center gap-2.5 shadow-xl shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Launch Conversational Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-open-workshop-btn"
              onClick={onNavigateToWorkshop}
              className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold px-6 py-3.5 rounded-2xl text-sm flex items-center gap-2 transition-all hover:border-slate-600 active:scale-95 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>Voice Workshop</span>
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80 text-left">
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Voices</p>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">6 Expressive Profiles</p>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Context Modes</p>
              <p className="text-base sm:text-lg font-bold text-teal-300 mt-0.5">6 Adaptive Tones</p>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Sample Quality</p>
              <p className="text-base sm:text-lg font-bold text-cyan-300 mt-0.5">24 kHz Crystal Clear</p>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Instant Export</p>
              <p className="text-base sm:text-lg font-bold text-emerald-300 mt-0.5">Direct MP3 & Share Links</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Sandbox */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive Sandbox & Sharer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Try Speech Generation in Real-Time
          </h2>
          <p className="text-sm text-slate-400">
            Select a tone preset, adjust your text or voice, generate speech, and share with anyone.
          </p>
        </div>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6 max-w-4xl mx-auto">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Context Preset:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {CONTEXT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`sandbox-preset-${preset.id}`}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    sandboxPreset === preset.id
                      ? 'bg-teal-500/15 border-teal-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold text-xs truncate">{preset.label.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.suggestedVoice}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="sandbox-text-input" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Text to Speak:
              </label>
              <span className="text-[11px] text-slate-500">
                {sandboxText.length} characters
              </span>
            </div>
            <textarea
              id="sandbox-text-input"
              rows={3}
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              placeholder="Enter any text you want to synthesize into spoken audio..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm resize-y leading-relaxed font-sans"
            />
          </div>

          {/* Controls Bar: Voice Select + Generate Button + Audio Player */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            {/* Voice Dropdown */}
            <div className="flex items-center gap-3">
              <label htmlFor="sandbox-voice-select" className="text-xs text-slate-400 font-medium">
                Voice:
              </label>
              <div className="relative">
                <select
                  id="sandbox-voice-select"
                  value={sandboxVoice}
                  onChange={(e) => {
                    setSandboxVoice(e.target.value as VoiceName);
                    onSelectVoice(e.target.value as VoiceName);
                  }}
                  className="appearance-none bg-slate-800 hover:bg-slate-750 text-teal-300 text-xs font-bold pl-3 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.accent} - {v.gender})
                    </option>
                  ))}
                </select>
                <Volume2 className="w-3.5 h-3.5 text-teal-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Share Button */}
              <button
                id="sandbox-share-btn"
                onClick={() => setIsShareModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-750 text-teal-300 hover:text-white border border-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Generate a customized shareable URL for this text & voice"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Share Link</span>
              </button>

              <button
                id="sandbox-generate-audio-btn"
                onClick={() => handleGenerateSandboxAudio()}
                disabled={isGeneratingSandbox || !sandboxText.trim()}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-teal-500/20 transition-all cursor-pointer active:scale-95"
              >
                {isGeneratingSandbox ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Audio</span>
                  </>
                )}
              </button>

              {sandboxAudioUrl && (
                <button
                  id="sandbox-download-mp3-btn"
                  onClick={() => downloadAudioFile(sandboxAudioUrl, `VoiceCraft_${sandboxVoice}_Speech`)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Download MP3"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Download .MP3</span>
                </button>
              )}
            </div>
          </div>

          {/* Sandbox Audio Player Strip */}
          {sandboxAudioUrl && (
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex items-center gap-4">
              <button
                onClick={handleTogglePlay}
                className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md"
              >
                {isPlayingSandbox ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                    {sandboxVoice} • Synthesized Audio
                  </span>
                  <span>{formatTime(sandboxCurrentTime)} / {formatTime(sandboxDuration)}</span>
                </div>
                
                {/* Visualizer bars */}
                <div className="flex items-center gap-1 h-5 py-0.5">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPlayingSandbox 
                          ? 'bg-gradient-to-t from-teal-500 to-cyan-400' 
                          : 'bg-slate-800'
                      }`}
                      style={{
                        height: isPlayingSandbox ? `${Math.max(20, Math.sin((i + sandboxCurrentTime * 5)) * 100)}%` : '20%',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Voice Showcase Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Radio className="w-3.5 h-3.5" />
            <span>Voice Roster</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Explore Voice Personalities
          </h2>
          <p className="text-sm text-slate-400">
            Click any profile to test instant voice synthesis and vocal characteristics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VOICE_OPTIONS.map((voice) => {
            const isCurrentVoice = previewingVoice === voice.id && isPlayingSandbox;

            return (
              <div
                key={voice.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm border border-slate-700 group-hover:border-teal-500/40 transition-colors">
                        {voice.name[0]}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                          {voice.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">{voice.accent} • {voice.gender}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-750">
                      {voice.styleTag}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {voice.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <button
                    id={`preview-voice-btn-${voice.id}`}
                    onClick={() => handleVoiceShowcasePlay(voice.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCurrentVoice
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                    }`}
                  >
                    {isCurrentVoice ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Playing Voice...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Sample Voice</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSandboxVoice(voice.id);
                      onSelectVoice(voice.id);
                    }}
                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                  >
                    Use in Studio &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Share Modal */}
      <ShareAudioModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        text={sandboxText}
        voice={sandboxVoice}
        preset={sandboxPreset}
        tab="overview"
        audioUrl={sandboxAudioUrl || undefined}
      />
    </div>
  );
};
