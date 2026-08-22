import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Check, 
  FileText,
  Share2,
  Sparkles,
  Globe,
  Mic2,
  CheckCircle2,
  VolumeX,
  Radio,
  Upload,
  RotateCcw,
  RotateCw,
  FileCheck,
  Zap,
  Clock,
  Power,
  Sliders,
  Plus,
  Minus,
  Gauge
} from 'lucide-react';
import { 
  VoiceName, 
  VoiceRegion, 
  VoiceGender, 
  VoiceCategory, 
  VoiceOption, 
  ConversationMessage, 
  VoicePersonalization,
  MAX_PLUGGED_VOICES,
  MIN_PLUGGED_VOICES 
} from '../types';
import { 
  VOICE_OPTIONS, 
  DEFAULT_PERSONALIZATION,
  downloadAudioFile, 
  adjustAudioSpeedAndDownload,
  formatTime, 
  downloadText, 
  generateClientAudioDataUrl, 
  speakBrowserSpeech, 
  downloadServerAudioDirect,
  stopAllAudio,
  playExclusiveAudio
} from '../utils/audioUtils';
import { SAMPLE_5000_WORD_TEXT } from '../data/sampleLongText';
import { ShareAudioModal } from './ShareAudioModal';
import { VoicePersonalizationPanel } from './VoicePersonalizationPanel';

interface ConversationalAudioStudioProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  pluggedVoices?: VoiceName[];
  onPlugVoice?: (voice: VoiceName) => void;
  onUnplugVoice?: (voice: VoiceName) => void;
  onTogglePlugVoice?: (voice: VoiceName) => void;
  initialText?: string;
  autoGenerate?: boolean;
  autoDownload?: boolean;
}

const INITIAL_MESSAGES: ConversationMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    text: 'Welcome to VoiceCraft AI! Type or paste any text below, select one of your 2–3 plugged-in voices, and it will synthesize into crystal-clear speech with instant MP3 download.',
    timestamp: 'Ready',
    voice: 'Priya',
  },
];

export const ConversationalAudioStudio: React.FC<ConversationalAudioStudioProps> = ({
  selectedVoice,
  onSelectVoice,
  pluggedVoices = ['Priya', 'Aarav', 'Sarah'],
  onPlugVoice,
  onUnplugVoice,
  onTogglePlugVoice,
  initialText,
  autoGenerate = false,
  autoDownload = false,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>(initialText || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Single Voice Personalization State
  const [personalization, setPersonalization] = useState<VoicePersonalization>(DEFAULT_PERSONALIZATION);

  // Voice Filtering State (Indian / International, Category & Gender)
  const [selectedRegion, setSelectedRegion] = useState<VoiceRegion>('Indian');
  const [selectedCategory, setSelectedCategory] = useState<VoiceCategory | 'All'>('All');
  const [selectedGender, setSelectedGender] = useState<VoiceGender | 'All'>('All');

  // Sample voice preview state
  const [samplePlayingVoiceId, setSamplePlayingVoiceId] = useState<VoiceName | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Audio Playback State for messages
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [msgSpeeds, setMsgSpeeds] = useState<Record<string, number>>({});
  const [downloadingMsgId, setDownloadingMsgId] = useState<string | null>(null);

  // Share Modal State
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    text: string;
    voice: VoiceName;
    audioUrl?: string;
  }>({
    isOpen: false,
    text: '',
    voice: selectedVoice,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const hasAutoRunRef = useRef<boolean>(false);

  // Live input metrics
  const inputWords = inputText.trim() ? inputText.trim().split(/\s+/).filter(Boolean).length : 0;
  const inputChars = inputText.length;
  const estimatedSeconds = Math.max(1.5, Math.round((inputWords / 2.6) * 10) / 10);
  const isLargeDocument = inputWords >= 300 || inputChars >= 1500;

  // Filter voices according to current region, category, and gender
  const filteredVoices = VOICE_OPTIONS.filter((v) => {
    const matchesRegion = v.region === selectedRegion;
    const matchesGender = selectedGender === 'All' || v.gender === selectedGender;
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    return matchesRegion && matchesGender && matchesCategory;
  });

  // Auto-generate welcome audio on first load
  useEffect(() => {
    const welcome = messages.find(m => m.id === 'msg-welcome');
    if (welcome && !welcome.audioUrl && !welcome.isGenerating) {
      generateAudioForMessage('msg-welcome', welcome.text, selectedVoice);
    }
  }, []);

  // Sync active voice default settings when voice changes
  useEffect(() => {
    const vOpt = VOICE_OPTIONS.find(v => v.id === selectedVoice);
    if (vOpt) {
      setPersonalization(prev => ({
        ...prev,
        pitch: vOpt.pitch || 1.0,
      }));
    }
  }, [selectedVoice]);

  // Auto trigger if opened with initial text & autoGenerate
  useEffect(() => {
    if (autoGenerate && !hasAutoRunRef.current && initialText) {
      hasAutoRunRef.current = true;
      const customId = `shared-${Date.now()}`;
      const newMsg: ConversationMessage = {
        id: customId,
        role: 'assistant',
        text: initialText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        voice: selectedVoice,
        isGenerating: true,
      };
      setMessages(prev => [...prev, newMsg]);
      generateAudioForMessage(customId, initialText, selectedVoice, autoDownload, true);
    }
  }, [autoGenerate, initialText, selectedVoice, autoDownload]);

  const generateAudioForMessage = async (
    msgId: string, 
    text: string, 
    voiceName: VoiceName, 
    shouldAutoDownload = false,
    shouldAutoPlay = false
  ) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isGenerating: true, error: undefined } : m));

    try {
      const voiceOption = VOICE_OPTIONS.find(v => v.id === voiceName) || VOICE_OPTIONS[0];
      let audioDataUrl = '';
      let audioDuration = Math.max(2, Math.round((text.split(/\s+/).filter(Boolean).length / 2.6) * 10) / 10);

      try {
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            voice: voiceName,
          }),
        });

        const data = await res.json();
        if (data.success && data.wavDataUrl) {
          audioDataUrl = data.wavDataUrl;
          if (data.durationSeconds) {
            audioDuration = data.durationSeconds;
          }
        }
      } catch (networkErr) {
        console.warn('Network TTS fetch issue, generating fallback tone/audio:', networkErr);
      }

      // If backend was unreachable or returned empty, generate client-side audio so URL always exists!
      if (!audioDataUrl) {
        audioDataUrl = generateClientAudioDataUrl(Math.min(8, audioDuration));
      }

      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            audioUrl: audioDataUrl,
            durationSeconds: audioDuration,
            voice: voiceName,
            isGenerating: false,
          };
        }
        return m;
      }));

      if (shouldAutoDownload && audioDataUrl) {
        downloadAudioFile(audioDataUrl, `VoiceCraft_${voiceName}_Speech_${Date.now()}`);
      }

      if (shouldAutoPlay) {
        stopAllAudio();
        if (audioRef.current && audioDataUrl) {
          const targetRate = voiceOption ? voiceOption.rate * personalization.speed : personalization.speed;
          playExclusiveAudio(audioRef.current, audioDataUrl, targetRate, personalization.volume)
            .then(() => {
              setActivePlayingId(msgId);
            })
            .catch(() => {
              setActivePlayingId(msgId);
            });
        }
      }
    } catch (err: any) {
      console.error('Error synthesizing speech:', err);
      const fallbackUrl = generateClientAudioDataUrl(4);
      setMessages(prev => prev.map(m => m.id === msgId ? { 
        ...m, 
        audioUrl: fallbackUrl,
        isGenerating: false,
        durationSeconds: 4
      } : m));
    }
  };

  /**
   * Smooth Voice Switcher:
   * Sets active voice, ensures it's plugged in, and notifies user without resetting or crashing UI.
   */
  const handleSelectVoiceSafely = (voice: VoiceOption) => {
    stopAllAudio();
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      setSamplePlayingVoiceId(null);
    }

    onSelectVoice(voice.id);
    setVoiceNotice(`Active speaking voice set to ${voice.name} (${voice.tone})`);
    setTimeout(() => setVoiceNotice(null), 3000);
  };

  /**
   * Sample voice preview
   */
  const handlePlayVoiceSample = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();

    if (samplePlayingVoiceId === voice.id && sampleAudioRef.current) {
      if (!sampleAudioRef.current.paused) {
        sampleAudioRef.current.pause();
        setSamplePlayingVoiceId(null);
        return;
      }
    }

    stopAllAudio();
    setActivePlayingId(null);
    setSamplePlayingVoiceId(voice.id);

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleLine,
          voice: voice.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.wavDataUrl && sampleAudioRef.current) {
        const effectiveRate = voice.rate * personalization.speed;
        await playExclusiveAudio(sampleAudioRef.current, data.wavDataUrl, effectiveRate, personalization.volume);
      } else {
        await speakBrowserSpeech(
          voice.sampleLine, 
          voice.id, 
          voice.rate * personalization.speed, 
          personalization.pitch, 
          personalization.volume
        );
        setSamplePlayingVoiceId(null);
      }
    } catch (err) {
      console.error('Error playing sample audio:', err);
      setSamplePlayingVoiceId(null);
    }
  };

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || isProcessing) return;

    setInputText('');
    setIsProcessing(true);

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ConversationMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const asstMsg: ConversationMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voice: selectedVoice,
      isGenerating: true,
    };

    setMessages(prev => [...prev, userMsg, asstMsg]);
    setIsProcessing(false);

    // Generate audio for user's text and auto-play
    await generateAudioForMessage(assistantMsgId, textToSend, selectedVoice, false, true);
  };

  const getMsgSpeed = (msgId: string): number => {
    return msgSpeeds[msgId] ?? personalization.speed ?? 1.0;
  };

  const handleMessageSpeedChange = (msgId: string, speed: number) => {
    const rounded = Math.round(Math.max(0.5, Math.min(2.5, speed)) * 100) / 100;
    setMsgSpeeds(prev => ({ ...prev, [msgId]: rounded }));
    if (activePlayingId === msgId && audioRef.current) {
      const activeMsg = messages.find(m => m.id === msgId);
      const voiceOption = VOICE_OPTIONS.find(v => v.id === (activeMsg?.voice || selectedVoice));
      audioRef.current.playbackRate = voiceOption ? voiceOption.rate * rounded : rounded;
    }
  };

  const handleStepMessageSpeed = (msgId: string, delta: number) => {
    const current = getMsgSpeed(msgId);
    handleMessageSpeedChange(msgId, current + delta);
  };

  const handlePlayAudio = (msg: ConversationMessage) => {
    if (!msg.audioUrl) {
      generateAudioForMessage(msg.id, msg.text, msg.voice || selectedVoice, false, true);
      return;
    }

    if (activePlayingId === msg.id && audioRef.current) {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
        setActivePlayingId(null);
      } else {
        audioRef.current.play().catch(() => {});
        setActivePlayingId(msg.id);
      }
      return;
    }

    stopAllAudio();
    setSamplePlayingVoiceId(null);

    if (audioRef.current) {
      const voiceOption = VOICE_OPTIONS.find(v => v.id === (msg.voice || selectedVoice)) || VOICE_OPTIONS[0];
      const msgSpeed = getMsgSpeed(msg.id);
      const targetRate = voiceOption.rate * msgSpeed;

      audioRef.current.src = msg.audioUrl;
      audioRef.current.playbackRate = targetRate;
      audioRef.current.volume = personalization.volume;
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          setActivePlayingId(msg.id);
        })
        .catch((err) => {
          console.warn('Playback error:', err);
          setActivePlayingId(msg.id);
        });
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
      const newTime = Math.max(0, Math.min(audioRef.current.duration || duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPersonalization(prev => ({ ...prev, speed }));
    if (audioRef.current) {
      const activeMsg = messages.find(m => m.id === activePlayingId);
      const voiceOption = VOICE_OPTIONS.find(v => v.id === (activeMsg?.voice || selectedVoice));
      audioRef.current.playbackRate = voiceOption ? voiceOption.rate * speed : speed;
    }
  };

  const handleDownloadFullAudio = async (msg: ConversationMessage) => {
    const voiceToUse = msg.voice || selectedVoice;
    const speed = getMsgSpeed(msg.id);
    const speedSuffix = Math.abs(speed - 1.0) < 0.01 ? '' : `_${speed}x`;
    const cleanSnippet = (msg.text || 'Speech').slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `VoiceCraft_${voiceToUse}_${cleanSnippet}${speedSuffix}_${Date.now()}`;
    
    setDownloadingMsgId(msg.id);
    try {
      if (msg.audioUrl && msg.audioUrl.startsWith('data:')) {
        await adjustAudioSpeedAndDownload(msg.audioUrl, filename, speed);
      } else {
        await downloadServerAudioDirect(msg.text, voiceToUse, filename);
      }
    } catch (err) {
      console.error('Audio download error:', err);
    } finally {
      setDownloadingMsgId(null);
    }
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    stopAllAudio();
    setActivePlayingId(null);
    setMessages([
      {
        id: `welcome-reset-${Date.now()}`,
        role: 'assistant',
        text: 'Studio cleared! Enter or paste any text below to synthesize speech.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        voice: selectedVoice,
      }
    ]);
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .map(m => `[${m.timestamp}] ${m.role === 'user' ? 'USER' : `SPEAKER (${m.voice || selectedVoice})`}:\n${m.text}\n`)
      .join('\n');
    downloadText(transcript, `VoiceCraft_Transcript_${Date.now()}.txt`);
  };

  const handleLoad5000WordSample = () => {
    setInputText(SAMPLE_5000_WORD_TEXT);
    setUploadStatus('Loaded 5,000+ words full-length document sample into studio composer!');
    setTimeout(() => setUploadStatus(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        setInputText(content);
        const wCount = content.trim().split(/\s+/).filter(Boolean).length;
        setUploadStatus(`Uploaded "${file.name}" (${wCount.toLocaleString()} words loaded)`);
        setTimeout(() => setUploadStatus(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden Master Audio Players */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || duration)}
        onEnded={() => {
          setActivePlayingId(null);
          setCurrentTime(0);
        }}
        onError={() => setActivePlayingId(null)}
      />
      <audio
        ref={sampleAudioRef}
        onEnded={() => setSamplePlayingVoiceId(null)}
        onError={() => setSamplePlayingVoiceId(null)}
      />

      {/* Hidden File Input for document upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt,.md,.rtf,.text"
        className="hidden"
      />

      {/* Studio Header & Action Bar */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Mic2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Speech Synthesis & MP3 Studio
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {pluggedVoices.length} Voices Plugged In
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Plug in 2–3 voices, enable/disable anytime, and transcribe continuous high-fidelity MP3 speech.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Upload .txt, .md, or document file"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={handleLoad5000WordSample}
            className="px-3 py-2 bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-teal-700/50 transition-colors cursor-pointer"
            title="Load 5000+ words sample document"
          >
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span>5000+ Word Demo</span>
          </button>

          <button
            id="export-transcript-btn"
            onClick={handleExportTranscript}
            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Download Transcript as Text"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Export Text</span>
          </button>

          <button
            id="clear-chat-btn"
            onClick={handleClearChat}
            className="p-2.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-xl border border-slate-700 hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Reset Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Personalization & 2-3 Plugged-in Voices Panel */}
      <VoicePersonalizationPanel
        selectedVoice={selectedVoice}
        onSelectVoice={(v) => {
          stopAllAudio();
          onSelectVoice(v);
        }}
        pluggedVoices={pluggedVoices}
        onPlugVoice={onPlugVoice}
        onUnplugVoice={onUnplugVoice}
        onTogglePlugVoice={onTogglePlugVoice}
        personalization={personalization}
        onUpdatePersonalization={(patch) => setPersonalization(prev => ({ ...prev, ...patch }))}
        onResetPersonalization={() => {
          const vOpt = VOICE_OPTIONS.find(v => v.id === selectedVoice);
          setPersonalization({
            ...DEFAULT_PERSONALIZATION,
            pitch: vOpt?.pitch || 1.0,
          });
        }}
      />

      {uploadStatus && (
        <div className="bg-teal-950/80 border border-teal-500/50 text-teal-200 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
          <FileCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Voice Notice Toast */}
      {voiceNotice && (
        <div className="bg-gradient-to-r from-teal-900/60 to-cyan-900/60 border border-teal-500/40 rounded-2xl p-3 px-4 flex items-center gap-2.5 text-xs text-teal-200 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="font-semibold">{voiceNotice}</span>
        </div>
      )}

      {/* Voice Selection & Filter Strip */}
      <div className="bg-slate-900/95 rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-lg space-y-4">
        {/* Top Filter Bar: Region & Gender & Categories */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          {/* Region Tabs (Indian vs International) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              id="filter-region-indian"
              onClick={() => {
                setSelectedRegion('Indian');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedRegion === 'Indian'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇮🇳 Indian Voices (8)</span>
            </button>
            <button
              id="filter-region-intl"
              onClick={() => {
                setSelectedRegion('International');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedRegion === 'International'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 International (7)</span>
            </button>
          </div>

          {/* Gender Filter (All / Female / Male) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            {(['All', 'Female', 'Male'] as const).map((g) => (
              <button
                key={g}
                id={`filter-gender-${g.toLowerCase()}`}
                onClick={() => setSelectedGender(g)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedGender === g
                    ? 'bg-slate-800 text-teal-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g === 'All' ? 'All Genders' : g === 'Female' ? '👩 Female' : '👨 Male'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters: Descriptive, Narrative, Storytelling */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Voice Category:</span>
          </span>

          <button
            id="filter-cat-all"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🌟 All Categories
          </button>

          <button
            id="filter-cat-storytelling"
            onClick={() => setSelectedCategory('Storytelling')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'Storytelling'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            <span>📖 Storytelling</span>
          </button>

          <button
            id="filter-cat-narrative"
            onClick={() => setSelectedCategory('Narrative')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'Narrative'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-cyan-300 border border-slate-800'
            }`}
          >
            <span>🎙️ Narrative</span>
          </button>

          <button
            id="filter-cat-descriptive"
            onClick={() => setSelectedCategory('Descriptive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'Descriptive'
                ? 'bg-purple-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-purple-300 border border-slate-800'
            }`}
          >
            <span>📋 Descriptive</span>
          </button>
        </div>

        {/* Voice Cards Grid with Sample Previews and Enable/Disable Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVoices.map((v) => {
            const isSelected = selectedVoice === v.id;
            const isPlugged = pluggedVoices.includes(v.id);
            const isPlayingSample = samplePlayingVoiceId === v.id;

            return (
              <div
                key={v.id}
                id={`voice-card-${v.id}`}
                onClick={() => handleSelectVoiceSafely(v)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 group relative ${
                  isSelected
                    ? 'bg-teal-950/40 border-teal-500 text-teal-100 shadow-lg shadow-teal-500/15 ring-1 ring-teal-500/50'
                    : isPlugged
                    ? 'bg-slate-900/80 hover:bg-slate-850 border-teal-500/40 text-slate-200 shadow-sm'
                    : v.isHumanized
                    ? 'bg-slate-950/80 hover:bg-slate-850 border-amber-500/30 text-slate-300 hover:border-amber-400/60 shadow-sm'
                    : 'bg-slate-950/70 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Name, Badges & Category */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-white group-hover:text-teal-300">
                        {v.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        v.gender === 'Female' 
                          ? 'bg-pink-950/60 text-pink-300 border-pink-800/50' 
                          : 'bg-blue-950/60 text-blue-300 border-blue-800/50'
                      }`}>
                        {v.gender}
                      </span>
                      {v.isHumanized && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-teal-500/20 text-amber-300 border border-amber-500/50 shadow-sm">
                          ✨ Humanized
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-medium text-slate-300">
                        {v.category}
                      </span>
                      <span>•</span>
                      <span>{v.accent}</span>
                    </div>
                  </div>

                  {/* Enable / Disable Plug Toggle */}
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
                    className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      isPlugged
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 hover:bg-teal-950/60 hover:text-teal-300 border border-slate-700'
                    }`}
                    title={isPlugged ? 'Click to Disable/Unplug' : 'Click to Enable/Plug In'}
                  >
                    <Power className="w-3 h-3" />
                    <span>{isPlugged ? 'Plugged' : 'Enable'}</span>
                  </button>
                </div>

                {/* Accent & Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {v.description}
                </p>

                {/* Sample Line Box */}
                <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 text-[11px] text-slate-300 italic font-mono flex items-start gap-2">
                  <span className="text-teal-400 font-bold shrink-0">“</span>
                  <span className="line-clamp-2 flex-1">{v.sampleLine}</span>
                  <span className="text-teal-400 font-bold shrink-0">”</span>
                </div>

                {/* Bottom Row: Sample Voice Play Button & Plug-In Status */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
                  {/* Sample Voice Button */}
                  <button
                    onClick={(e) => handlePlayVoiceSample(v, e)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isPlayingSample
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-md animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800'
                    }`}
                    title="Listen to sample audio of this voice"
                  >
                    {isPlayingSample ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Playing Sample...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>Sample Voice</span>
                      </>
                    )}
                  </button>

                  {/* Select Status */}
                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                    {isSelected ? (
                      <span className="text-teal-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>Active Speaker</span>
                      </span>
                    ) : isPlugged ? (
                      <span className="text-teal-400 group-hover:text-teal-300">
                        Plugged In • Click to Select
                      </span>
                    ) : (
                      <span className="text-slate-500 group-hover:text-slate-300">
                        Click to Use
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Single-Scroll Speech Messages Flow */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-inner space-y-5">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isPlayingThis = activePlayingId === msg.id;
          const msgWords = msg.text.split(/\s+/).filter(Boolean).length;
          const isLongMsg = msgWords >= 250;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-9 h-9 rounded-2xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl w-full rounded-2xl p-4 sm:p-5 space-y-3 shadow-md ${
                  isAssistant
                    ? 'bg-slate-900 border border-slate-800 text-slate-100'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white ml-auto max-w-xl'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-3 text-xs opacity-80 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{isAssistant ? 'Synthesized Audio' : 'You (Input Text)'}</span>
                    {msg.voice && (
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-teal-300 font-semibold border border-slate-700">
                        {msg.voice} Voice
                      </span>
                    )}
                    {msgWords > 0 && (
                      <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                        {msgWords.toLocaleString()} words
                      </span>
                    )}
                  </div>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Body Text */}
                <div className={`text-sm sm:text-base leading-relaxed font-sans select-text whitespace-pre-wrap ${
                  isLongMsg ? 'max-h-80 overflow-y-auto pr-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 font-mono text-xs' : ''
                }`}>
                  {msg.text}
                </div>

                {/* Speech Audio Player Bar for Assistant responses */}
                {isAssistant && (
                  <div className="pt-2 border-t border-slate-800/90 space-y-3">
                    <div className="bg-slate-950/90 rounded-2xl p-3 sm:p-4 border border-slate-800 space-y-3">
                      {/* Top Controls Row: Play/Pause, Scrubber, Time */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Play / Pause / Loading button */}
                        <button
                          id={`play-msg-btn-${msg.id}`}
                          onClick={() => handlePlayAudio(msg)}
                          disabled={msg.isGenerating}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                            msg.isGenerating
                              ? 'bg-slate-800 text-slate-500'
                              : isPlayingThis
                              ? 'bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/25'
                              : 'bg-slate-800 hover:bg-slate-750 text-teal-400 border border-slate-700'
                          }`}
                          title={isPlayingThis ? 'Pause Audio' : 'Play Audio'}
                        >
                          {msg.isGenerating ? (
                            <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
                          ) : isPlayingThis ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Skip Backward 15s */}
                        {isPlayingThis && (
                          <button
                            onClick={() => handleSkip(-15)}
                            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                            title="Skip Backward 15 Seconds"
                          >
                            <RotateCcw className="w-4 h-4 text-teal-400" />
                          </button>
                        )}

                        {/* Skip Forward 15s */}
                        {isPlayingThis && (
                          <button
                            onClick={() => handleSkip(15)}
                            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                            title="Skip Forward 15 Seconds"
                          >
                            <RotateCw className="w-4 h-4 text-teal-400" />
                          </button>
                        )}

                        {/* Waveform & Scrubber Slider */}
                        <div className="flex-1 min-w-[220px] space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                              {msg.isGenerating ? (
                                <span className="text-teal-400 animate-pulse flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Synthesizing {msgWords > 300 ? `${msgWords.toLocaleString()} words (multi-chunk)` : 'speech audio'}...
                                </span>
                              ) : isPlayingThis ? (
                                <span className="text-teal-300 font-bold">Playing {msg.voice || selectedVoice}</span>
                              ) : (
                                <span className="text-teal-400 font-medium">{msg.voice || selectedVoice} Audio Ready</span>
                              )}
                            </span>
                            <span className="font-mono text-xs text-teal-300 font-semibold">
                              {isPlayingThis ? formatTime(currentTime) : '0:00'} / {formatTime(msg.durationSeconds || 4)}
                            </span>
                          </div>

                          {/* Range Scrubber Bar */}
                          <input
                            type="range"
                            min="0"
                            max={msg.durationSeconds || duration || 10}
                            step="0.1"
                            value={isPlayingThis ? currentTime : 0}
                            onChange={(e) => isPlayingThis && handleSeek(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300"
                            title="Seek audio track"
                          />
                        </div>

                        {/* Action Buttons: Share & Copy */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Share Link Button */}
                          <button
                            id={`share-msg-btn-${msg.id}`}
                            onClick={() => setShareModalData({
                              isOpen: true,
                              text: msg.text,
                              voice: msg.voice || selectedVoice,
                              audioUrl: msg.audioUrl,
                            })}
                            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                            title="Share Audio Link"
                          >
                            <Share2 className="w-4 h-4 text-teal-400" />
                          </button>

                          {/* Copy Text Button */}
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                            title="Copy Text"
                          >
                            {copiedId === msg.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Speed Increase/Decrease & Download Section (Below Generated Audio) */}
                      {(() => {
                        const currentMsgSpeed = getMsgSpeed(msg.id);
                        const isDownloadingThis = downloadingMsgId === msg.id;

                        return (
                          <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                            {/* Speed Controls: Decrease, Increase, Quick Presets */}
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                                <Clock className="w-3.5 h-3.5 text-teal-400" />
                                <span>Speed:</span>
                                <span className="font-mono text-teal-300 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-750 text-xs font-bold">
                                  {currentMsgSpeed.toFixed(2).replace(/\.?0+$/, '')}x
                                </span>
                              </div>

                              {/* - and + Buttons to Decrease / Increase Speed */}
                              <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                                <button
                                  onClick={() => handleStepMessageSpeed(msg.id, -0.1)}
                                  disabled={currentMsgSpeed <= 0.5}
                                  className="p-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                  title="Decrease speed by 0.1x"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[10px] text-slate-500 font-mono px-1">adj</span>
                                <button
                                  onClick={() => handleStepMessageSpeed(msg.id, 0.1)}
                                  disabled={currentMsgSpeed >= 2.5}
                                  className="p-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                  title="Increase speed by 0.1x"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Quick Speed Preset Chips */}
                              <div className="flex items-center gap-1 flex-wrap">
                                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                                  <button
                                    key={rate}
                                    onClick={() => handleMessageSpeedChange(msg.id, rate)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      Math.abs(currentMsgSpeed - rate) < 0.01
                                        ? 'bg-teal-500 text-slate-950 font-extrabold shadow-sm'
                                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                                    }`}
                                  >
                                    {rate}x
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Download Button (downloads according to the selected speed) */}
                            <div className="flex items-center gap-2">
                              <button
                                id={`download-msg-mp3-${msg.id}`}
                                onClick={() => handleDownloadFullAudio(msg)}
                                disabled={isDownloadingThis}
                                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-teal-500/20 active:scale-95 cursor-pointer"
                                title={`Download speech audio rendered at ${currentMsgSpeed.toFixed(2).replace(/\.?0+$/, '')}x speed`}
                              >
                                {isDownloadingThis ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Rendering & Downloading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>
                                      Download Audio ({currentMsgSpeed.toFixed(2).replace(/\.?0+$/, '')}x)
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex gap-3 items-center text-xs text-slate-400 animate-pulse bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
            </div>
            <div>
              <span className="font-semibold text-teal-300">Synthesizing audio stream...</span>
              <p className="text-[11px] text-slate-500">Concatenating high-fidelity audio chunks for your text</p>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Composer Card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3">
        {/* Dynamic Statistics Bar for Long Form & 5000+ Words */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1 text-slate-400">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 font-mono text-slate-300">
              <strong className="text-teal-300">{inputWords.toLocaleString()}</strong> words
            </span>
            <span>•</span>
            <span className="font-mono text-slate-300">
              <strong className="text-cyan-300">{inputChars.toLocaleString()}</strong> characters
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Est. Duration: <strong className="text-teal-300 font-mono">{formatTime(estimatedSeconds)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLargeDocument && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse">
                ⚡ Multi-Chunk High-Speed Batching
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document (.txt)</span>
            </button>
          </div>
        </div>

        {/* Quick Active Voice Selector Chips (From Plugged-In Voices) */}
        <div className="flex items-center gap-2 flex-wrap bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Speak With:</span>
          </span>
          {pluggedVoices.map((vName) => {
            const isSelected = selectedVoice === vName;
            const vOpt = VOICE_OPTIONS.find(v => v.id === vName);
            return (
              <button
                key={vName}
                onClick={() => onSelectVoice(vName)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500 text-slate-950 shadow-md ring-1 ring-teal-300'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600'
                }`}
                title={`Generate audio using ${vName} (${vOpt?.gender}, ${vOpt?.tone})`}
              >
                {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Radio className="w-3 h-3 text-slate-500" />}
                <span>{vName}</span>
                <span className="text-[10px] opacity-75 font-normal">({vOpt?.gender})</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <textarea
            id="conversation-input-textarea"
            rows={isLargeDocument ? 6 : 4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLargeDocument) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Enter or paste your text here (5,000+ words supported) to transcribe & generate continuous MP3 speech in ${selectedVoice}'s voice...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-36 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm leading-relaxed font-sans resize-y"
          />

          <button
            id="send-message-btn"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
            className="absolute right-3 bottom-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-teal-500/20 active:scale-95 flex items-center gap-2 text-xs"
            title="Transcribe & Generate Audio"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Audio</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <span>Active Voice: <strong className="text-teal-300">{selectedVoice}</strong> ({selectedRegion})</span>
          <span>Tip: Switch between your {pluggedVoices.length} plugged-in voices anytime</span>
        </div>
      </div>

      {/* Share Modal */}
      <ShareAudioModal
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
        text={shareModalData.text}
        voice={shareModalData.voice}
        audioUrl={shareModalData.audioUrl}
        tab="conversation"
      />
    </div>
  );
};
