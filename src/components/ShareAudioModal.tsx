import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Code, 
  Globe, 
  Radio, 
  Send,
  MessageCircle
} from 'lucide-react';
import { VoiceName, ContextPresetId } from '../types';

interface ShareAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  voice: VoiceName;
  preset?: ContextPresetId;
  tab?: 'overview' | 'conversation' | 'workshop';
}

export const ShareAudioModal: React.FC<ShareAudioModalProps> = ({
  isOpen,
  onClose,
  text,
  voice,
  preset = 'conversational',
  tab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'app' | 'direct' | 'embed'>('app');
  const [autoGenerate, setAutoGenerate] = useState<boolean>(true);
  const [autoDownload, setAutoDownload] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const encodedText = encodeURIComponent(text.trim() || 'Welcome to VoiceCraft AI');
  
  // 1. Interactive App Link
  const appParams = new URLSearchParams();
  appParams.set('text', text.trim() || 'Welcome to VoiceCraft AI');
  appParams.set('voice', voice);
  if (preset) appParams.set('preset', preset);
  if (tab) appParams.set('tab', tab);
  if (autoGenerate) appParams.set('autogenerate', 'true');
  if (autoDownload) appParams.set('autodownload', 'true');
  
  const shareableAppLink = `${currentOrigin}/?${appParams.toString()}`;

  // 2. Direct MP3 Download URL
  const filename = `VoiceCraft_${voice}_${(text.slice(0, 16) || 'audio').replace(/[^a-zA-Z0-9]/g, '_')}`;
  const directDownloadUrl = `${currentOrigin}/api/tts/download-text?text=${encodedText}&voice=${encodeURIComponent(voice)}&filename=${encodeURIComponent(filename)}`;

  // 3. Embed snippet
  const embedSnippet = `<iframe 
  src="${shareableAppLink}" 
  width="100%" 
  height="450" 
  frameborder="0" 
  allow="autoplay" 
  style="border-radius: 16px; border: 1px solid #1e293b;"
></iframe>`;

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const shareText = `Listen to this speech generated with VoiceCraft AI (${voice} voice):`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareableAppLink}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareableAppLink)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareableAppLink)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Share & Export Audio Link</h2>
              <p className="text-xs text-slate-400">Share your custom speech with anyone anywhere</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snippet Preview Box */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-teal-400">Target Voice & Text</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">{voice} Voice</span>
          </div>
          <p className="text-xs text-slate-200 line-clamp-2 italic font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50">
            "{text || 'Welcome to VoiceCraft AI'}"
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('app')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'app'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Interactive App Link</span>
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Direct MP3 Download Link</span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'embed'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Embed HTML</span>
          </button>
        </div>

        {/* Tab 1: Interactive App Link */}
        {activeTab === 'app' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              When anyone opens this link, VoiceCraft AI opens with your text and voice pre-loaded, automatically generates the audio stream, and presents the live waveform player and download options.
            </p>

            <div className="flex flex-wrap items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                  className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900"
                />
                <span>Auto-synthesize speech on load</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoDownload}
                  onChange={(e) => setAutoDownload(e.target.checked)}
                  className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900"
                />
                <span>Auto-trigger MP3 download on load</span>
              </label>
            </div>

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
                title="Test in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Share Directly To:</span>
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
              This standalone URL triggers an instant binary download of the synthesized <code className="text-teal-300">.mp3</code> file directly when clicked, perfect for sending in emails, chat messages, or automating via curl/scripts.
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
              <a
                href={directDownloadUrl}
                download={filename + '.mp3'}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs transition-colors shrink-0"
                title="Download MP3 now"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">CURL / Terminal Command:</span>
              <code className="text-[11px] text-teal-300 font-mono block overflow-x-auto whitespace-pre">
                curl -o output.mp3 "{directDownloadUrl}"
              </code>
            </div>
          </div>
        )}

        {/* Tab 3: Embed HTML */}
        {activeTab === 'embed' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Embed this interactive voice player into any website, blog post, documentation page, or notion workspace.
            </p>

            <div className="space-y-2">
              <textarea
                readOnly
                rows={4}
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
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
          <span>VoiceCraft AI Neural Studio</span>
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
