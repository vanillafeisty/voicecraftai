import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  RefreshCw, 
  Copy, 
  Check, 
  FileAudio,
  Clock,
  Share2,
  RotateCcw,
  RotateCw,
  Upload,
  Zap,
  Power,
  Radio
} from 'lucide-react';
import { VoiceName, MAX_PLUGGED_VOICES, MIN_PLUGGED_VOICES } from '../types';
import { VOICE_OPTIONS, downloadAudioFile, formatTime, downloadServerAudioDirect, stopAllAudio, playExclusiveAudio } from '../utils/audioUtils';
import { ShareAudioModal } from './ShareAudioModal';

interface VoiceWorkshopProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  pluggedVoices?: VoiceName[];
  onPlugVoice?: (voice: VoiceName) => void;
  onUnplugVoice?: (voice: VoiceName) => void;
  onTogglePlugVoice?: (voice: VoiceName) => void;
  initialText?: string;
  initialVoice?: VoiceName;
  autoGenerate?: boolean;
  autoDownload?: boolean;
}

const TEMPLATE_SCRIPTS = [
  {
    title: 'Technology Broadcast',
    category: 'Narration',
    text: 'Artificial intelligence is reshaping acoustic modeling, enabling seamless voice synthesis that adapts dynamically to sentence rhythm, emphasis, and context.',
  },
  {
    title: 'Welcome & Onboarding',
    category: 'Assistant',
    text: 'Welcome to your workspace! Everything is set up and ready to go. You can review your dashboard or start a new synthesis project at your convenience.',
  },
  {
    title: 'Meditation & Focus',
    category: 'Calm',
    text: 'Take a slow, deep breath in. Hold for a moment. Now gently release, allowing your shoulders to relax and your focus to return to the present.',
  },
  {
    title: 'Product Walkthrough',
    category: 'Tutorial',
    text: 'Step one: upload your text script. Step two: select an expressive voice profile. Step three: click generate to receive your studio-quality MP3 export.',
  },
];

export const VoiceWorkshop: React.FC<VoiceWorkshopProps> = ({
  selectedVoice,
  onSelectVoice,
  pluggedVoices = ['Priya', 'Aarav', 'Sarah'],
  onPlugVoice,
  onUnplugVoice,
  onTogglePlugVoice,
  initialText,
  initialVoice,
  autoGenerate = false,
  autoDownload = false,
}) => {
  const [scriptText, setScriptText] = useState<string>(initialText || TEMPLATE_SCRIPTS[0].text);
  const [activeVoice, setActiveVoice] = useState<VoiceName>(initialVoice || selectedVoice || 'Priya');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoRunRef = useRef<boolean>(false);

  // Sync active voice when prop changes
  useEffect(() => {
    if (selectedVoice && selectedVoice !== activeVoice) {
      setActiveVoice(selectedVoice);
    }
  }, [selectedVoice]);

  // Approximate metrics
  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / (2.5 * playbackSpeed)) * 10) / 10);

  const handleGenerateAudio = async (textToUse?: string, voiceToUse?: VoiceName) => {
    const text = (textToUse !== undefined ? textToUse : scriptText).trim();
    const voice = voiceToUse || activeVoice;
    if (!text) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice,
        }),
      });

      const data = await res.json();
      if (data.success && data.wavDataUrl) {
        setGeneratedAudioUrl(data.wavDataUrl);
        setDurationSeconds(data.durationSeconds || estimatedSeconds);

        if (audioRef.current) {
          audioRef.current.src = data.wavDataUrl;
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }

        if (autoDownload) {
          downloadAudioFile(data.wavDataUrl, `VoiceCraft_${voice}_Script`);
        }
      }
    } catch (err) {
      console.error('Error generating audio:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && !hasAutoRunRef.current && initialText) {
      hasAutoRunRef.current = true;
      handleGenerateAudio(initialText, initialVoice || selectedVoice);
    }
  }, [autoGenerate, initialText, initialVoice, selectedVoice]);

  const handleTogglePlay = () => {
    if (!audioRef.current || !generatedAudioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(audioRef.current.duration || durationSeconds, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleDownload = () => {
    const filename = `VoiceCraft_${activeVoice}_Speech_${Date.now()}`;
    if (generatedAudioUrl && generatedAudioUrl.startsWith('data:')) {
      downloadAudioFile(generatedAudioUrl, filename);
    } else {
      downloadServerAudioDirect(scriptText, activeVoice, filename);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDurationSeconds(e.currentTarget.duration || durationSeconds)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-400">
            <Sliders className="w-3.5 h-3.5" />
            <span>Power Studio • 2–3 Plugged Voices</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Voice Workshop & Speech Synthesizer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Fine-tune custom scripts, manage plugged-in voice profiles, adjust playback speed, share URLs, and download studio MP3 files.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-750 text-teal-300 hover:text-white border border-slate-700 font-semibold px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            title="Create a shareable link for this script"
          >
            <Share2 className="w-4 h-4 text-teal-400" />
            <span>Share Link</span>
          </button>

          <button
            id="workshop-generate-main-btn"
            onClick={() => handleGenerateAudio()}
            disabled={isGenerating || !scriptText.trim()}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-teal-500/20 transition-all cursor-pointer active:scale-95"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Voice...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Speech Audio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Script Editor & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Script Editor Card */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="workshop-script-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-teal-400" />
                <span>Script Text Editor</span>
              </label>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  ~{estimatedSeconds}s est.
                </span>
                <span>{wordCount} words</span>
                <button
                  onClick={handleCopyScript}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Script"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <textarea
              id="workshop-script-input"
              rows={7}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste or write your full script here to generate audio..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm leading-relaxed font-sans resize-y"
            />

            {/* Template Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Quick Template Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEMPLATE_SCRIPTS.map((t, idx) => (
                  <button
                    key={idx}
                    id={`template-btn-${idx}`}
                    onClick={() => setScriptText(t.text)}
                    className="p-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-750 text-left transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-slate-200 group-hover:text-teal-300 truncate">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.category}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Audio Player & Visualizer */}
          {generatedAudioUrl && (
            <div className="bg-slate-900 rounded-3xl border border-teal-500/30 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                  <span>Audio Ready • Voice: {activeVoice}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="bg-slate-800 hover:bg-slate-750 text-teal-300 hover:text-white border border-slate-700 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    title="Share this audio"
                  >
                    <Share2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Share</span>
                  </button>

                  <button
                    id="workshop-download-mp3-btn"
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .MP3</span>
                  </button>
                </div>
              </div>

              {/* Player UI */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    id="workshop-play-pause-btn"
                    onClick={handleTogglePlay}
                    className="w-12 h-12 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  <button
                    onClick={() => handleSkip(-15)}
                    className="p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                    title="Skip Back 15s"
                  >
                    <RotateCcw className="w-4 h-4 text-teal-400" />
                  </button>

                  <button
                    onClick={() => handleSkip(15)}
                    className="p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                    title="Skip Forward 15s"
                  >
                    <RotateCw className="w-4 h-4 text-teal-400" />
                  </button>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">Voice: {activeVoice}</span>
                      <span className="font-mono text-teal-300 font-semibold">{formatTime(currentTime)} / {formatTime(durationSeconds)}</span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={durationSeconds || 10}
                      step="0.1"
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300"
                      title="Seek Audio"
                    />
                  </div>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Playback Cadence:</span>
                  <div className="flex items-center gap-1.5">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          playbackSpeed === rate
                            ? 'bg-teal-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Voice Selection & Settings */}
        <div className="space-y-6">
          {/* Plugged Voices Rack in Workshop */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Plugged-In Voices ({pluggedVoices.length}/{MAX_PLUGGED_VOICES})</span>
              </h2>
              <span className="text-[10px] text-teal-300 font-bold">Active Slots</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {pluggedVoices.map((vId) => {
                const v = VOICE_OPTIONS.find(vo => vo.id === vId);
                const isCurrentActive = activeVoice === vId;

                return (
                  <div
                    key={vId}
                    onClick={() => {
                      setActiveVoice(vId);
                      onSelectVoice(vId);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrentActive
                        ? 'bg-teal-500/20 border-teal-500 text-white shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isCurrentActive ? 'border-teal-400 bg-teal-500' : 'border-slate-600'
                      }`}>
                        {isCurrentActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">{v?.name || vId}</div>
                        <div className="text-[10px] text-slate-400">{v?.gender} • {v?.accent}</div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTogglePlugVoice) onTogglePlugVoice(vId);
                      }}
                      disabled={pluggedVoices.length <= MIN_PLUGGED_VOICES}
                      className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                        pluggedVoices.length <= MIN_PLUGGED_VOICES
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-400 hover:text-rose-400'
                      }`}
                      title="Disable / Unplug voice"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Voice Library Selector */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Full Voice Library</span>
            </h2>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {VOICE_OPTIONS.map((voice) => {
                const isSelected = activeVoice === voice.id;
                const isPlugged = pluggedVoices.includes(voice.id);

                return (
                  <div
                    key={voice.id}
                    id={`select-voice-${voice.id}`}
                    onClick={() => {
                      setActiveVoice(voice.id);
                      onSelectVoice(voice.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500 text-white shadow-md'
                        : isPlugged
                        ? 'bg-slate-900 border-teal-500/40 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{voice.name}</span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                          {voice.gender}
                        </span>
                        {isPlugged && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold">
                            Plugged
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{voice.accent}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTogglePlugVoice) onTogglePlugVoice(voice.id);
                        }}
                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isPlugged
                            ? 'bg-teal-500/20 text-teal-300 hover:bg-rose-950/40 hover:text-rose-300'
                            : 'bg-slate-800 text-slate-400 hover:bg-teal-950/50 hover:text-teal-300'
                        }`}
                        title={isPlugged ? 'Disable voice' : 'Enable & Plug in voice'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-teal-400 bg-teal-500 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Share Modal */}
      <ShareAudioModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        text={scriptText}
        voice={activeVoice}
        tab="workshop"
        audioUrl={generatedAudioUrl || undefined}
      />
    </div>
  );
};
