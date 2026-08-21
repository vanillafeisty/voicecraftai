import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Check, 
  Mic, 
  Sliders, 
  FileText,
  Radio,
  Share2,
  Settings2
} from 'lucide-react';
import { VoiceName, ContextPresetId, ConversationMessage } from '../types';
import { VOICE_OPTIONS, CONTEXT_PRESETS, downloadAudioFile, formatTime, downloadText } from '../utils/audioUtils';
import { ShareAudioModal } from './ShareAudioModal';

interface ConversationalAudioStudioProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  initialText?: string;
  autoGenerate?: boolean;
  autoDownload?: boolean;
}

const QUICK_PROMPT_SUGGESTIONS = [
  {
    title: 'Podcast Intro',
    text: 'Welcome back to The Innovation Horizon. Today we explore neural audio synthesis and the future of human-machine voice interfaces.',
    preset: 'narrator' as ContextPresetId,
  },
  {
    title: 'Product Announcement',
    text: 'We are thrilled to announce VoiceCraft AI, a context-aware speech studio designed to turn your ideas into high-fidelity voice productions in seconds.',
    preset: 'announcement' as ContextPresetId,
  },
  {
    title: 'Sci-Fi Story Opening',
    text: 'The solar sail caught the edge of the stellar wind, humming with an otherworldly resonance that reverberated through the pilot’s helmet.',
    preset: 'storytelling' as ContextPresetId,
  },
  {
    title: 'Interactive Tutorial',
    text: 'To begin configuring your voice profile, select a preferred timbre, adjust the cadence slider, and press Generate to preview the acoustic waveform.',
    preset: 'educational' as ContextPresetId,
  },
];

const INITIAL_MESSAGES: ConversationMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    text: 'Hello! I am your VoiceCraft AI voice companion. Type any text, script, or conversation below to hear it spoken in real-time with authentic vocal timbre and natural inflection. You can play, adjust speed, and download the audio as an MP3 instantly.',
    timestamp: 'Just now',
    voice: 'Priya',
    contextPreset: 'conversational',
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
  const [selectedPreset, setSelectedPreset] = useState<ContextPresetId>('conversational');
  const [studioMode, setStudioMode] = useState<'ai-dialogue' | 'direct-tts'>('ai-dialogue');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Audio Playback State
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Share Modal State
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; text: string; voice: VoiceName; preset?: ContextPresetId }>({
    isOpen: false,
    text: '',
    voice: selectedVoice,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const hasAutoRunRef = useRef<boolean>(false);

  // Auto scroll on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Initial welcome message audio generation on load
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
        contextPreset: 'conversational',
        isGenerating: true,
      };
      setMessages(prev => [...prev, newMsg]);
      generateAudioForMessage(customId, initialText, selectedVoice, autoDownload);
    }
  }, [autoGenerate, initialText, selectedVoice, autoDownload]);

  const generateAudioForMessage = async (msgId: string, text: string, voiceName: VoiceName, shouldAutoDownload = false) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isGenerating: true } : m));

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
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
      } else {
        throw new Error(data.error || 'Speech generation failed');
      }
    } catch (err: any) {
      console.error('Error synthesizing speech:', err);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isGenerating: false, error: err.message } : m));
    }
  };

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || isProcessing) return;

    setInputText('');
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ConversationMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    const assistantMsgId = `asst-${Date.now()}`;

    if (studioMode === 'direct-tts') {
      // Direct TTS Mode: speaks the exact user text
      const asstMsg: ConversationMessage = {
        id: assistantMsgId,
        role: 'assistant',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        voice: selectedVoice,
        contextPreset: selectedPreset,
        isGenerating: true,
      };

      setMessages(prev => [...prev, asstMsg]);
      setIsProcessing(false);
      await generateAudioForMessage(assistantMsgId, textToSend, selectedVoice);

    } else {
      // AI Conversational Mode: generates dynamic conversational response then speaks it
      try {
        let generatedResponseText = '';
        const presetObj = CONTEXT_PRESETS.find(p => p.id === selectedPreset);

        // Responsive text generator based on context preset
        if (selectedPreset === 'storytelling') {
          generatedResponseText = `Here is the story continuation: "${textToSend}". As the chapter unfolded, a quiet stillness settled over the scene, punctuated only by the distant echo of what was yet to come.`;
        } else if (selectedPreset === 'educational') {
          generatedResponseText = `Let's break down "${textToSend}". Key concept: clear pacing and acoustic resonance allow maximum listener retention. Next, we will examine practical applications and synthesis parameters.`;
        } else if (selectedPreset === 'announcement') {
          generatedResponseText = `Official Announcement: "${textToSend}". All listeners are advised to take note of these details. Thank you for your cooperation.`;
        } else if (selectedPreset === 'narrator') {
          generatedResponseText = `VoiceCraft Narration: "${textToSend}". Delivered with precision acoustic modeling and balanced studio acoustics.`;
        } else {
          generatedResponseText = `I have received your text: "${textToSend}". I have synthesized the audio below using ${selectedVoice} with our ${presetObj?.label || 'natural'} inflection profile. You can play, adjust playback speed, or download the MP3 file anytime.`;
        }

        const asstMsg: ConversationMessage = {
          id: assistantMsgId,
          role: 'assistant',
          text: generatedResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          voice: selectedVoice,
          contextPreset: selectedPreset,
          isGenerating: true,
        };

        setMessages(prev => [...prev, asstMsg]);
        setIsProcessing(false);
        await generateAudioForMessage(assistantMsgId, generatedResponseText, selectedVoice);

      } catch (e) {
        setIsProcessing(false);
      }
    }
  };

  const handlePlayAudio = (msg: ConversationMessage) => {
    if (!msg.audioUrl) {
      generateAudioForMessage(msg.id, msg.text, msg.voice || selectedVoice);
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

    if (audioRef.current) {
      audioRef.current.src = msg.audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => {
        setActivePlayingId(msg.id);
      }).catch(err => console.error('Audio play error:', err));
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
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
    setActivePlayingId(null);
    setMessages(INITIAL_MESSAGES);
  };

  const handleExportTranscript = () => {
    const transcriptText = messages.map(m => `[${m.timestamp}] ${m.role === 'assistant' ? `VoiceCraft (${m.voice || 'Studio'})` : 'User'}:\n${m.text}\n`).join('\n---\n\n');
    downloadText(transcriptText, `VoiceCraft_Transcript_${Date.now()}.txt`, 'text/plain');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden Audio Player for Chat Item Playback */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 4)}
        onEnded={() => setActivePlayingId(null)}
      />

      {/* Top Controls Bar */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Conversational Speech Studio
            </h1>
            <p className="text-xs text-slate-400">
              Contextual voice responses with multi-speed MP3 playback & URL sharing
            </p>
          </div>
        </div>

        {/* Mode Selector & Quick Tools */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mode Switch: AI Dialogue vs Direct TTS */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              id="mode-ai-dialogue-btn"
              onClick={() => setStudioMode('ai-dialogue')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                studioMode === 'ai-dialogue'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Companion
            </button>
            <button
              id="mode-direct-tts-btn"
              onClick={() => setStudioMode('direct-tts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                studioMode === 'direct-tts'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct TTS
            </button>
          </div>

          {/* Voice Selector Dropdown */}
          <div className="relative">
            <select
              id="studio-voice-selector"
              value={selectedVoice}
              onChange={(e) => onSelectVoice(e.target.value as VoiceName)}
              className="appearance-none bg-slate-800 hover:bg-slate-750 text-teal-300 text-xs font-bold pl-3 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.accent})
                </option>
              ))}
            </select>
            <Volume2 className="w-3.5 h-3.5 text-teal-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export Transcript */}
          <button
            id="export-transcript-btn"
            onClick={handleExportTranscript}
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Download Transcript as Text"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Clear Chat */}
          <button
            id="clear-chat-btn"
            onClick={handleClearChat}
            className="p-2 bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300 rounded-xl border border-slate-700 hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Reset Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Selector Strip */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 shadow-md flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-bold uppercase text-slate-400 px-1 whitespace-nowrap">
          Tone Preset:
        </span>
        {CONTEXT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            id={`preset-btn-${preset.id}`}
            onClick={() => setSelectedPreset(preset.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedPreset === preset.id
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-755'
            }`}
          >
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Main Conversation Messages Scroll Area */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-inner min-h-[480px] max-h-[580px] overflow-y-auto space-y-6">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isPlayingThis = activePlayingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 space-y-3 shadow-md ${
                  isAssistant
                    ? 'bg-slate-900 border border-slate-800 text-slate-100'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-3 text-xs opacity-80 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{isAssistant ? 'VoiceCraft AI' : 'You'}</span>
                    {msg.voice && (
                      <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] text-teal-300 font-semibold border border-slate-700">
                        Voice: {msg.voice}
                      </span>
                    )}
                    {msg.contextPreset && (
                      <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] text-cyan-300 font-semibold border border-slate-700">
                        {msg.contextPreset}
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
                    <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
                      {/* Play / Pause / Loading button */}
                      <button
                        id={`play-msg-btn-${msg.id}`}
                        onClick={() => handlePlayAudio(msg)}
                        disabled={msg.isGenerating}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                          msg.isGenerating
                            ? 'bg-slate-800 text-slate-500'
                            : isPlayingThis
                            ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                            : 'bg-slate-800 hover:bg-slate-750 text-teal-400 border border-slate-700'
                        }`}
                        title={isPlayingThis ? 'Pause Audio' : 'Play Spoken Audio'}
                      >
                        {msg.isGenerating ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                        ) : isPlayingThis ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      {/* Waveform & Duration Display */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            {msg.isGenerating ? (
                              <span className="text-teal-400 animate-pulse">Synthesizing audio...</span>
                            ) : isPlayingThis ? (
                              <span className="text-teal-300 font-bold">Now Playing</span>
                            ) : (
                              <span>Voice Audio Ready</span>
                            )}
                          </span>
                          <span>
                            {isPlayingThis ? formatTime(currentTime) : '0:00'} / {formatTime(msg.durationSeconds || 4)}
                          </span>
                        </div>

                        {/* Animated waveform visualizer */}
                        <div className="flex items-center gap-1 h-3.5">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all duration-150 ${
                                isPlayingThis
                                  ? 'bg-gradient-to-t from-teal-500 to-cyan-400'
                                  : 'bg-slate-800'
                              }`}
                              style={{
                                height: isPlayingThis
                                  ? `${Math.max(25, Math.sin(i + currentTime * 6) * 100)}%`
                                  : '25%',
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Share Link Button */}
                      <button
                        onClick={() => setShareModalData({
                          isOpen: true,
                          text: msg.text,
                          voice: msg.voice || selectedVoice,
                          preset: msg.contextPreset || selectedPreset
                        })}
                        className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        title="Share Audio Link"
                      >
                        <Share2 className="w-4 h-4 text-teal-400" />
                      </button>

                      {/* Download .MP3 Button */}
                      {msg.audioUrl && (
                        <button
                          id={`download-msg-mp3-${msg.id}`}
                          onClick={() => downloadAudioFile(msg.audioUrl!, `VoiceCraft_${msg.voice || 'Speech'}_${msg.id}`)}
                          className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                          title="Download Audio (.mp3)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      {/* Copy Text Button */}
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        title="Copy Text"
                      >
                        {copiedId === msg.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Speed Selector Chips */}
                    {isPlayingThis && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>Speed Cadence:</span>
                        <div className="flex items-center gap-1">
                          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => handleSpeedChange(rate)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
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
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <span>Generating speech response...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Inspirations / Quick Prompt Presets */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Quick Inspirations:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {QUICK_PROMPT_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(item.text);
                setSelectedPreset(item.preset);
              }}
              className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition-all group cursor-pointer"
            >
              <p className="text-xs font-bold text-slate-200 group-hover:text-teal-300 truncate">
                {item.title}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                {item.text}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer Card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow-xl space-y-3">
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
            placeholder={
              studioMode === 'direct-tts'
                ? `Enter any script to speak aloud in ${selectedVoice}'s voice...`
                : `Say anything to your VoiceCraft assistant (press Enter to send)...`
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pr-16 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm leading-relaxed font-sans resize-none"
          />

          <button
            id="send-message-btn"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
            className="absolute right-3 bottom-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 p-3 rounded-xl transition-all cursor-pointer shadow-md shadow-teal-500/20 active:scale-95"
            title="Send and Synthesize Audio"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <span>Mode: <strong className="text-slate-300">{studioMode === 'direct-tts' ? 'Direct TTS Narrator' : 'Conversational Companion'}</strong></span>
          <span>Press <strong className="text-slate-300">Enter</strong> to synthesize speech</span>
        </div>
      </div>

      {/* Share Modal */}
      <ShareAudioModal
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
        text={shareModalData.text}
        voice={shareModalData.voice}
        preset={shareModalData.preset}
        tab="conversation"
      />
    </div>
  );
};
