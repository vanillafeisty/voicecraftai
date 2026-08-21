import React, { useState } from 'react';
import { 
  X, 
  Github, 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  Sparkles,
  Cloud,
  CheckCircle2,
  FolderGit2,
  Cpu
} from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'github' | 'vercel' | 'env'>('github');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const vercelCliCode = `# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Deploy to Vercel
vercel

# 3. Add your Gemini API key (optional for enhanced fidelity)
vercel env add GEMINI_API_KEY`;

  const gitCloneCode = `# 1. Clone or add remote to your GitHub repository
git clone https://github.com/vanillafeisty/voicecraft-ai.git
cd voicecraft-ai

# Or if pushing existing directory:
git init
git remote add origin https://github.com/vanillafeisty/voicecraft-ai.git
git add .
git commit -m "Initial VoiceCraft AI commit"
git branch -M main
git push -u origin main

# 2. Install dependencies & run locally
npm install
npm run dev`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-bold shadow-lg">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">GitHub & Vercel Deployment</h2>
              <p className="text-xs text-slate-400">Step-by-step guide to push to GitHub and host on Vercel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'github'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>1. Push to GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'vercel'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>2. Deploy on Vercel</span>
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'env'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Environment Config</span>
          </button>
        </div>

        {/* Tab 1: Push to GitHub */}
        {activeTab === 'github' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Github className="w-4 h-4 text-teal-400" />
                <span>Exporting from Google AI Studio:</span>
              </h3>
              
              <ol className="space-y-2.5 list-decimal list-inside text-slate-400 leading-relaxed">
                <li>
                  <strong className="text-slate-200">Export via AI Studio Menu:</strong> Click the <strong className="text-teal-400">Settings / Export</strong> menu at the top right of the AI Studio Build interface.
                </li>
                <li>
                  <strong className="text-slate-200">Select Export to GitHub or ZIP:</strong> Choose <strong className="text-slate-200">Export to GitHub</strong> to create a new GitHub repository directly, or download as a <strong className="text-slate-200">ZIP</strong> archive.
                </li>
                <li>
                  <strong className="text-slate-200">If using Git manually:</strong> Initialize git and push to your remote repository:
                </li>
              </ol>

              <div className="relative">
                <pre className="bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-teal-300 overflow-x-auto whitespace-pre">
                  {gitCloneCode}
                </pre>
                <button
                  onClick={() => handleCopy(gitCloneCode, 'git')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedCode === 'git' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'git' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Deploy on Vercel */}
        {activeTab === 'vercel' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                <span>One-Click Vercel Deployment:</span>
              </h3>

              <div className="space-y-2 text-slate-400 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Option A (Web UI):</strong> Go to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">vercel.com/new</a>, connect your GitHub account, and select your <strong className="text-slate-200">voicecraft-ai</strong> repository.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Framework Preset:</strong> Select <strong className="text-slate-200">Vite</strong> (Build Command: <code className="text-teal-300">npm run build</code>, Output Directory: <code className="text-teal-300">dist</code>).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Option B (CLI):</strong> Run the commands below in your project folder:
                  </span>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-teal-300 overflow-x-auto whitespace-pre">
                  {vercelCliCode}
                </pre>
                <button
                  onClick={() => handleCopy(vercelCliCode, 'vercel')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedCode === 'vercel' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'vercel' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Environment Config */}
        {activeTab === 'env' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-400" />
                <span>Environment Variables (.env)</span>
              </h3>

              <p className="text-slate-400 leading-relaxed">
                VoiceCraft AI features a dual-engine architecture:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                  <strong className="text-teal-300 font-semibold block">1. Zero-Config Studio Neural Engine:</strong>
                  <span className="text-slate-400 text-[11px]">
                    Works out of the box with zero external keys required for all voice accents (Priya, Aarav, Deepa, Rohan, Kore, Fenrir).
                  </span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                  <strong className="text-teal-300 font-semibold block">2. Google Gemini Native TTS Engine (Optional):</strong>
                  <span className="text-slate-400 text-[11px]">
                    Add <code className="text-teal-300">GEMINI_API_KEY</code> in Vercel project settings to enable experimental Gemini audio generation.
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-teal-300 border border-slate-800">
                GEMINI_API_KEY=your_gemini_api_key_here
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Production Ready • Vite + Express + Vercel Serverless</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
