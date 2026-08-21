import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Code, 
  Globe, 
  Send,
  MessageCircle,
  Volume2,
  Play,
  Pause
} from 'lucide-react';
import { VoiceName, ContextPresetId } from '../types';
import { downloadAudioFile } from '../utils/audioUtils';

interface ShareAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  voice: VoiceName;
  preset?: ContextPresetId;
  tab?: 'overview' | 'conversation' | 'workshop';
  audioUrl?: string;
}

export const ShareAudioModal: React.FC<ShareAudioModalProps> = ({
  isOpen,
  onClose,
  text,
  voice,
  preset = 'conversational',
  tab = 'conversation',
  audioUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'app' | 'direct' | 'embed'>('app');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const cleanText = text.trim() || 'VoiceCraft AI Speech';
  const encodedText = encodeURIComponent(cleanText);
  
  // 1. Interactive App Link with parameters to auto-generate & load text
  const appParams = new URLSearchParams();
  appParams.set('text', cleanText);
  appParams.set('voice', voice);
  if (preset) appParams.set('preset', preset);
  if (tab) appParams.set('tab', tab);
  appParams.set('autogenerate', 'true');
  
  const shareableAppLink = `${currentOrigin}/?${appParams.toString()}`;

  // 2. Direct MP3 Download URL
  const safeFilename = `VoiceCraft_${voice}_${cleanText.slice(0, 18).replace(/[^a-zA-Z0-9]/g, '_')}`;
  const directDownloadUrl = `${currentOrigin}/api/tts/download-text?text=${encodedText}&voice=${encodeURIComponent(voice)}&filename=${encodeURIComponent(safeFilename)}`;

  // 3. Embed snippet
  const embedSnippet = `<iframe 
  src="${shareableAppLink}" 
  width="100%" 
  height="420" 
  frameborder="0" 
  allow="autoplay" 
  style="border-radius: 16px; border: 1px solid #1e293b;"
></iframe>`;

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Direct instant browser download of the synthesized MP3 audio
  const handleDownloadMp3 = async () => {
    setIsDownloading(true);
    try {
      if (audioUrl && audioUrl.startsWith('data:audio')) {
        downloadAudioFile(audioUrl, safeFilename);
      } else {
        // Fetch generated speech audio directly from API
        const response = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, voice, engine: 'studio' }),
        });
        const data = await response.json();
        if (data.success && data.wavDataUrl) {
          downloadAudioFile(data.wavDataUrl, safeFilename);
        } else {
          // Fallback to window download trigger
          window.open(directDownloadUrl, '_blank');
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      window.open(directDownloadUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const shareTitle = `Speech Audio: "${cleanText.slice(0, 60)}${cleanText.length > 60 ? '...' : ''}" (${voice} Voice)`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n${shareableAppLink}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareableAppLink)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareableAppLink)}&text=${encodeURIComponent(shareTitle)}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Share & Export Audio</h2>
              <p className="text-xs text-slate-400">Share or download your synthesized speech</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Summary & Direct Download Action */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-teal-400">Audio Preview & Text</span>
            <span className="bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-200 font-semibold border border-slate-700">
              {voice} Voice
            </span>
          </div>

          <p className="text-xs text-slate-200 italic font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800/60 line-clamp-3 leading-relaxed">
            "{cleanText}"
          </p>

          {/* Quick Direct Download Button */}
          <button
            id="modal-direct-download-btn"
            onClick={handleDownloadMp3}
            disabled={isDownloading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Preparing MP3 Download...' : 'Download MP3 File Now'}</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('app')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'app'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Interactive Web Link</span>
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Direct Audio URL</span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'embed'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Embed</span>
          </button>
        </div>

        {/* Tab 1: Interactive App Link */}
        {activeTab === 'app' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Anyone opening this link will see your exact text pre-loaded with the selected voice ready to play and download:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableAppLink}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono select-all focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={() => handleCopy(shareableAppLink, 'app')}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-md shadow-teal-500/20 active:scale-95"
              >
                {copiedType === 'app' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <a
                href={shareableAppLink}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors shrink-0"
                title="Test link in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">One-Click Share:</span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/60 text-sky-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Twitter / X</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Direct MP3 Download Link */}
        {activeTab === 'direct' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Direct endpoint that streams the synthesized <code className="text-teal-300">.mp3</code> file directly:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={directDownloadUrl}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono select-all focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={() => handleCopy(directDownloadUrl, 'direct')}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-md shadow-teal-500/20 active:scale-95"
              >
                {copiedType === 'direct' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadMp3}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                title="Download MP3 directly"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Terminal / cURL Command:</span>
              <code className="text-[11px] text-teal-300 font-mono block overflow-x-auto whitespace-pre">
                curl -o voice.mp3 "{directDownloadUrl}"
              </code>
            </div>
          </div>
        )}

        {/* Tab 3: Embed HTML */}
        {activeTab === 'embed' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Embed this voice generator into any website, blog post, or dashboard:
            </p>

            <div className="space-y-2">
              <textarea
                readOnly
                rows={3}
                value={embedSnippet}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-teal-300 font-mono select-all focus:outline-none focus:border-teal-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(embedSnippet, 'embed')}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-teal-500/20 active:scale-95"
                >
                  {copiedType === 'embed' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Snippet Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Embed Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-500">
          <span>VoiceCraft AI Speech Studio</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
