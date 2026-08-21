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
  Radio
} from 'lucide-react';
import { VoiceName, VoiceRegion, VoiceGender, VoiceOption, ConversationMessage } from '../types';
import { VOICE_OPTIONS, downloadAudioFile, formatTime, downloadText } from '../utils/audioUtils';
import { ShareAudioModal } from './ShareAudioModal';

interface ConversationalAudioStudioProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  initialText?: string;
  autoGenerate?: boolean;
  autoDownload?: boolean;
}

const INITIAL_MESSAGES: ConversationMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    text: 'Welcome to VoiceCraft AI! Type or paste any text below, choose an Indian or International voice (Stern, Flowing, Male, or Female), and it will automatically synthesize into lifelike speech ready to download as an MP3.',
    timestamp: 'Ready',
    voice: 'Priya',
  },
];

export const ConversationalAudioStudio: React.FC<ConversationalAudioStudioProps> = ({
  selectedVoice,
  onSelectVoice,
  initialText,
  autoGenerate = false,
  autoDownload = false,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>(initialText || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Voice Filtering State (Indian / International & Gender)
  const [selectedRegion, setSelectedRegion] = useState<VoiceRegion>('Indian');
  const [selectedGender, setSelectedGender] = useState<VoiceGender | 'All'>('All');

  // Sample voice preview state
  const [samplePlayingVoiceId, setSamplePlayingVoiceId] = useState<VoiceName | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Audio Playback State for messages
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const hasAutoRunRef = useRef<boolean>(false);

  // Filter voices according to current region and gender
  const filteredVoices = VOICE_OPTIONS.filter((v) => {
    const matchesRegion = v.region === selectedRegion;
    const matchesGender = selectedGender === 'All' || v.gender === selectedGender;
    return matchesRegion && matchesGender;
  });

  // Auto-generate welcome audio on first load
  useEffect(() => {
    const welcome = messages.find(m => m.id === 'msg-welcome');
    if (welcome && !welcome.audioUrl && !welcome.isGenerating) {
      generateAudioForMessage('msg-welcome', welcome.text, selectedVoice);
    }
  }, []);

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
      const voiceOption = VOICE_OPTIONS.find(v => v.id === voiceName);
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: voiceName,
          engine: 'studio',
        }),
      });

      const data = await res.json();
      if (data.success && data.wavDataUrl) {
        setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
            return {
              ...m,
              audioUrl: data.wavDataUrl,
              durationSeconds: data.durationSeconds || 4,
              voice: voiceName,
              isGenerating: false,
            };
          }
          return m;
        }));

        if (shouldAutoDownload) {
          downloadAudioFile(data.wavDataUrl, `VoiceCraft_${voiceName}_Speech`);
        }

        if (shouldAutoPlay && audioRef.current) {
          audioRef.current.src = data.wavDataUrl;
          const targetRate = voiceOption ? voiceOption.rate * playbackSpeed : playbackSpeed;
          audioRef.current.playbackRate = targetRate;
          audioRef.current.play().then(() => {
            setActivePlayingId(msgId);
          }).catch(err => console.error('Auto-play error:', err));
        }
      } else {
        throw new Error(data.error || 'Speech generation failed');
      }
    } catch (err: any) {
      console.error('Error synthesizing speech:', err);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isGenerating: false, error: err.message || 'Failed to synthesize' } : m));
    }
  };

  /**
   * Auto-generation when user selects or switches to a new voice:
   * Plugs in and understands the text, then generates speech audio in the new voice immediately.
   */
  const handleSelectVoiceAndAutoGenerate = async (voice: VoiceOption) => {
    onSelectVoice(voice.id);
    
    // Stop any playing sample audio
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      setSamplePlayingVoiceId(null);
    }

    const currentText = inputText.trim();
    setVoiceNotice(`Plugged into ${voice.name} (${voice.tone}) - Synthesizing speech...`);
    setTimeout(() => setVoiceNotice(null), 3000);

    if (currentText) {
      // If user has input text, create a message for it and autogenerate
      const assistantMsgId = `asst-${Date.now()}`;
      const asstMsg: ConversationMessage = {
        id: assistantMsgId,
        role: 'assistant',
        text: currentText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        voice: voice.id,
        isGenerating: true,
      };

      setMessages(prev => [...prev, asstMsg]);
      await generateAudioForMessage(assistantMsgId, currentText, voice.id, false, true);
    } else {
      // If input is empty, re-synthesize the latest message or welcome message in the new voice
      const lastMsg = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastMsg) {
        const newMsgId = `asst-voice-switch-${Date.now()}`;
        const newMsg: ConversationMessage = {
          id: newMsgId,
          role: 'assistant',
          text: lastMsg.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          voice: voice.id,
          isGenerating: true,
        };
        setMessages(prev => [...prev, newMsg]);
        await generateAudioForMessage(newMsgId, lastMsg.text, voice.id, false, true);
      }
    }
  };

  /**
   * Sample voice preview: plays the official sample line of that voice
   */
  const handlePlayVoiceSample = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();

    // If already playing this sample, pause it
    if (samplePlayingVoiceId === voice.id && sampleAudioRef.current) {
      if (!sampleAudioRef.current.paused) {
        sampleAudioRef.current.pause();
        setSamplePlayingVoiceId(null);
        return;
      }
    }

    // Stop main audio player if active
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setActivePlayingId(null);
    }

    setSamplePlayingVoiceId(voice.id);

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleLine,
          voice: voice.id,
          engine: 'studio',
        }),
      });

      const data = await res.json();
      if (data.success && data.wavDataUrl && sampleAudioRef.current) {
        sampleAudioRef.current.src = data.wavDataUrl;
        sampleAudioRef.current.playbackRate = voice.rate;
        sampleAudioRef.current.play().catch(() => {});
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
      text: textToSend, // EXACT text transcription with no unwanted prefixes!
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voice: selectedVoice,
      isGenerating: true,
    };

    setMessages(prev => [...prev, userMsg, asstMsg]);
    setIsProcessing(false);

    // Immediately generate audio for user's text and auto-play
    await generateAudioForMessage(assistantMsgId, textToSend, selectedVoice, false, true);
  };

  const handlePlayAudio = (msg: ConversationMessage) => {
    if (!msg.audioUrl) {
      generateAudioForMessage(msg.id, msg.text, msg.voice || selectedVoice, false, true);
      return;
    }

    // Stop sample audio if playing
    if (sampleAudioRef.current && !sampleAudioRef.current.paused) {
      sampleAudioRef.current.pause();
      setSamplePlayingVoiceId(null);
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

    if (audioRef.current) {
      const voiceOption = VOICE_OPTIONS.find(v => v.id === (msg.voice || selectedVoice));
      audioRef.current.src = msg.audioUrl;
      const targetRate = voiceOption ? voiceOption.rate * playbackSpeed : playbackSpeed;
      audioRef.current.playbackRate = targetRate;
      audioRef.current.play().then(() => {
        setActivePlayingId(msg.id);
      }).catch(err => console.error('Audio play error:', err));
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      const activeMsg = messages.find(m => m.id === activePlayingId);
      const voiceOption = VOICE_OPTIONS.find(v => v.id === (activeMsg?.voice || selectedVoice));
      audioRef.current.playbackRate = voiceOption ? voiceOption.rate * speed : speed;
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
    }
    setActivePlayingId(null);
    setSamplePlayingVoiceId(null);
    setMessages(INITIAL_MESSAGES);
  };

  const handleExportTranscript = () => {
    const transcriptText = messages
      .map(m => `[${m.timestamp}] ${m.role === 'assistant' ? `VoiceCraft (${m.voice || 'Voice'})` : 'User'}:\n${m.text}\n`)
      .join('\n---\n\n');
    downloadText(transcriptText, `VoiceCraft_Transcript_${Date.now()}.txt`, 'text/plain');
  };

  const getToneBadgeStyle = (tone: string) => {
    switch (tone) {
      case 'Stern & Firm':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'Flowing & Warm':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
      case 'Authoritative':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/60';
      case 'Corporate Direct':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
      case 'Smooth Broadcast':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60';
      default:
        return 'bg-teal-950/60 text-teal-300 border-teal-800/60';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Hidden Audio Player for Speech Playback */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 4)}
        onEnded={() => setActivePlayingId(null)}
      />

      {/* Hidden Audio Player for Voice Sample Previews */}
      <audio
        ref={sampleAudioRef}
        onEnded={() => setSamplePlayingVoiceId(null)}
      />

      {/* Top Header Card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Speech Synthesis & MP3 Studio
            </h1>
            <p className="text-xs text-slate-400">
              Professional stern & flowing voice profiles with instant sample previews and autogeneration
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="export-transcript-btn"
            onClick={handleExportTranscript}
            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Download Transcript as Text"
          >
            <FileText className="w-4 h-4" />
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

      {/* Voice Notice Toast */}
      {voiceNotice && (
        <div className="bg-gradient-to-r from-teal-900/60 to-cyan-900/60 border border-teal-500/40 rounded-2xl p-3 px-4 flex items-center gap-2.5 text-xs text-teal-200 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="font-semibold">{voiceNotice}</span>
        </div>
      )}

      {/* Voice Selection & Filter Strip */}
      <div className="bg-slate-900/95 rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-lg space-y-4">
        {/* Category Filters: Region & Gender */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          {/* Region Tabs (Indian vs International) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              id="filter-region-indian"
              onClick={() => {
                setSelectedRegion('Indian');
                if (!['Priya', 'Kavita', 'Deepa', 'Aarav', 'Vikram', 'Rohan'].includes(selectedVoice)) {
                  onSelectVoice('Priya');
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedRegion === 'Indian'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇮🇳 Indian Voices (6)</span>
            </button>
            <button
              id="filter-region-intl"
              onClick={() => {
                setSelectedRegion('International');
                if (!['Sarah', 'Eleanor', 'Kore', 'Arthur', 'Fenrir', 'James'].includes(selectedVoice)) {
                  onSelectVoice('Sarah');
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedRegion === 'International'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 International (6)</span>
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
                {g === 'All' ? 'All' : g === 'Female' ? '👩 Female' : '👨 Male'}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Cards Grid with Sample Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVoices.map((v) => {
            const isSelected = selectedVoice === v.id;
            const isPlayingSample = samplePlayingVoiceId === v.id;

            return (
              <div
                key={v.id}
                id={`voice-card-${v.id}`}
                onClick={() => handleSelectVoiceAndAutoGenerate(v)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 group relative ${
                  isSelected
                    ? 'bg-teal-950/25 border-teal-500 text-teal-100 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/50'
                    : 'bg-slate-950/70 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Name, Gender, Tone Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
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
                  </div>

                  {/* Tone Badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getToneBadgeStyle(v.tone)}`}>
                    {v.tone}
                  </span>
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

                {/* Bottom Row: Sample Voice Play Button & Plug-In Indicator */}
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
                        <span>Plugged In</span>
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
                  </div>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Body Text */}
                <p className="text-sm sm:text-base leading-relaxed font-sans select-text">
                  {msg.text}
                </p>

                {/* Speech Audio Player Bar for Assistant responses */}
                {isAssistant && (
                  <div className="pt-2 border-t border-slate-800/90 space-y-2">
                    <div className="bg-slate-950/90 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-wrap items-center gap-3">
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

                      {/* Waveform & Duration Display - Clickable to trigger play/generate */}
                      <div 
                        onClick={() => !msg.isGenerating && handlePlayAudio(msg)}
                        className="flex-1 min-w-[200px] space-y-1.5 cursor-pointer"
                        title="Click to play voice audio"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            {msg.isGenerating ? (
                              <span className="text-teal-400 animate-pulse">Transcribing & synthesizing audio...</span>
                            ) : isPlayingThis ? (
                              <span className="text-teal-300 font-bold">Now Playing ({msg.voice || selectedVoice})</span>
                            ) : (
                              <span className="text-teal-400 hover:underline">Voice Audio Ready ({msg.voice || selectedVoice})</span>
                            )}
                          </span>
                          <span className="font-mono text-[11px]">
                            {isPlayingThis ? formatTime(currentTime) : '0:00'} / {formatTime(msg.durationSeconds || 4)}
                          </span>
                        </div>

                        {/* Interactive Waveform Bar */}
                        <div className="flex items-center gap-1 h-4">
                          {[...Array(24)].map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all duration-150 ${
                                isPlayingThis
                                  ? 'bg-gradient-to-t from-teal-500 to-cyan-400'
                                  : 'bg-slate-800 hover:bg-slate-750'
                              }`}
                              style={{
                                height: isPlayingThis
                                  ? `${Math.max(25, Math.sin(i + currentTime * 6) * 100)}%`
                                  : '30%',
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons: Share, Download MP3, Copy */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Download .MP3 Button */}
                        <button
                          id={`download-msg-mp3-${msg.id}`}
                          onClick={() => {
                            if (msg.audioUrl) {
                              downloadAudioFile(msg.audioUrl, `VoiceCraft_${msg.voice || 'Speech'}_${msg.id}`);
                            } else {
                              generateAudioForMessage(msg.id, msg.text, msg.voice || selectedVoice, true);
                            }
                          }}
                          className="px-3 py-2 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Download Audio File (.mp3)"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download MP3</span>
                        </button>

                        {/* Share Link Button */}
                        <button
                          id={`share-msg-btn-${msg.id}`}
                          onClick={() => setShareModalData({
                            isOpen: true,
                            text: msg.text,
                            voice: msg.voice || selectedVoice,
                            audioUrl: msg.audioUrl,
                          })}
                          className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                          title="Share Audio Link"
                        >
                          <Share2 className="w-4 h-4 text-teal-400" />
                        </button>

                        {/* Copy Text Button */}
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                          title="Copy Text"
                        >
                          {copiedId === msg.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Speed Selector Chips (when playing) */}
                    {isPlayingThis && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-1">
                        <span>Playback Speed:</span>
                        <div className="flex items-center gap-1">
                          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => handleSpeedChange(rate)}
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                playbackSpeed === rate
                                  ? 'bg-teal-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex gap-3 items-center text-xs text-slate-400 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
            </div>
            <span>Synthesizing speech audio for your text...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Composer Card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3">
        <div className="relative">
          <textarea
            id="conversation-input-textarea"
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Enter or paste your text here to transcribe & generate speech in ${selectedVoice}'s voice (press Enter, click Generate Audio, or select any voice above)...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-36 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm leading-relaxed font-sans resize-none"
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
          <span>Tip: Selecting any voice above will plug in and autogenerate speech</span>
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
