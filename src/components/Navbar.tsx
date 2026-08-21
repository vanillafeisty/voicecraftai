import React, { useState } from 'react';
import { 
  Sparkles, 
  Volume2, 
  Bot,
  Sliders,
  Home,
  Share2,
  FolderGit2
} from 'lucide-react';
import { VoiceName, AudioEngine } from '../types';
import { VOICE_OPTIONS } from '../utils/audioUtils';
import { DeployModal } from './DeployModal';
import { ShareAudioModal } from './ShareAudioModal';

export type AppNavTab = 'overview' | 'conversation' | 'workshop';

interface NavbarProps {
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  audioEngine: AudioEngine;
  onSelectAudioEngine: (engine: AudioEngine) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedVoice,
  onSelectVoice,
}) => {
  const [isDeployOpen, setIsDeployOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Brand Logo & Name */}
            <div 
              id="brand-logo-btn"
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-bold group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-white text-lg group-hover:text-teal-300 transition-colors">
                    VoiceCraft AI
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                    Studio Live
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-normal">Context-Aware Speech & MP3 Engine</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav aria-label="Main Navigation" className="hidden md:flex items-center bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/60 text-xs">
              <button
                id="nav-tab-overview"
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                id="nav-tab-conversation"
                onClick={() => setActiveTab('conversation')}
                className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'conversation'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm ring-1 ring-teal-400/40'
                    : 'text-teal-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>Conversational Studio</span>
              </button>

              <button
                id="nav-tab-workshop"
                onClick={() => setActiveTab('workshop')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'workshop'
                    ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Voice Workshop</span>
              </button>
            </nav>

            {/* Right Controls: Share, Deploy, Voice Selector */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Share Button */}
              <button
                id="nav-share-btn"
                onClick={() => setIsShareOpen(true)}
                className="bg-slate-800 hover:bg-slate-750 text-teal-300 hover:text-white border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Create a shareable link with custom text"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Share Link</span>
              </button>

              {/* GitHub & Vercel Deploy Guide */}
              <button
                id="nav-deploy-btn"
                onClick={() => setIsDeployOpen(true)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="GitHub & Vercel Deployment Instructions"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden lg:inline">Deploy / Export</span>
              </button>

              {/* Quick Voice Selector */}
              <div className="relative group hidden xl:block">
                <select
                  id="quick-voice-dropdown"
                  value={selectedVoice}
                  onChange={(e) => onSelectVoice(e.target.value as VoiceName)}
                  className="appearance-none bg-slate-800 hover:bg-slate-750 text-teal-300 text-xs font-semibold pl-3 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender})
                    </option>
                  ))}
                </select>
                <Volume2 className="w-3.5 h-3.5 text-teal-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Mobile Navigation Strip */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                activeTab === 'overview' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('conversation')}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                activeTab === 'conversation' ? 'bg-teal-600 text-white' : 'text-teal-400'
              }`}
            >
              Studio Chat
            </button>
            <button
              onClick={() => setActiveTab('workshop')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                activeTab === 'workshop' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              Workshop
            </button>
            <button
              onClick={() => setIsDeployOpen(true)}
              className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Share Modal */}
      <ShareAudioModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        text="Welcome to VoiceCraft AI! Convert any text to spoken speech with custom tone and download the MP3."
        voice={selectedVoice}
        tab={activeTab}
      />

      {/* Deploy Modal */}
      <DeployModal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
      />
    </>
  );
};
