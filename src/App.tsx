import React, { useState, useEffect } from 'react';
import { VoiceName, AudioEngine, ContextPresetId } from './types';
import { Navbar, AppNavTab } from './components/Navbar';
import { OpeningLandingPage } from './components/OpeningLandingPage';
import { ConversationalAudioStudio } from './components/ConversationalAudioStudio';
import { VoiceWorkshop } from './components/VoiceWorkshop';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppNavTab>('overview');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Priya');
  const [audioEngine, setAudioEngine] = useState<AudioEngine>('studio');

  // Shared Link Parameters
  const [sharedText, setSharedText] = useState<string>('');
  const [sharedPreset, setSharedPreset] = useState<ContextPresetId>('narrator');
  const [autoGenerate, setAutoGenerate] = useState<boolean>(false);
  const [autoDownload, setAutoDownload] = useState<boolean>(false);

  // Parse incoming URL parameters for shared speech links
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const textParam = params.get('text');
      const voiceParam = params.get('voice') as VoiceName | null;
      const presetParam = params.get('preset') as ContextPresetId | null;
      const tabParam = params.get('tab') as AppNavTab | null;
      const autoParam = params.get('auto') === 'true' || params.get('play') === 'true';
      const downloadParam = params.get('download') === 'true';

      if (textParam) {
        setSharedText(decodeURIComponent(textParam));
      }
      if (voiceParam) {
        setSelectedVoice(voiceParam);
      }
      if (presetParam) {
        setSharedPreset(presetParam);
      }
      if (tabParam && ['overview', 'conversation', 'workshop'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      if (autoParam) {
        setAutoGenerate(true);
      }
      if (downloadParam) {
        setAutoDownload(true);
      }
    } catch (e) {
      console.error('Error parsing URL query parameters:', e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedVoice={selectedVoice}
        onSelectVoice={(v) => setSelectedVoice(v)}
        audioEngine={audioEngine}
        onSelectAudioEngine={(eng) => setAudioEngine(eng)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* TAB 1: OVERVIEW & OPENING SHOWCASE */}
        {activeTab === 'overview' && (
          <OpeningLandingPage
            onNavigateToConversation={() => setActiveTab('conversation')}
            onNavigateToWorkshop={() => setActiveTab('workshop')}
            selectedVoice={selectedVoice}
            onSelectVoice={(v) => setSelectedVoice(v)}
            initialText={sharedText || undefined}
            initialPreset={sharedPreset}
            autoGenerate={autoGenerate}
            autoDownload={autoDownload}
          />
        )}

        {/* TAB 2: CONVERSATIONAL AUDIO STUDIO */}
        {activeTab === 'conversation' && (
          <ConversationalAudioStudio
            selectedVoice={selectedVoice}
            onSelectVoice={(v) => setSelectedVoice(v)}
            initialText={sharedText || undefined}
            autoGenerate={autoGenerate}
            autoDownload={autoDownload}
          />
        )}

        {/* TAB 3: VOICE WORKSHOP & SYNTHESIZER */}
        {activeTab === 'workshop' && (
          <VoiceWorkshop
            selectedVoice={selectedVoice}
            onSelectVoice={(v) => setSelectedVoice(v)}
            initialText={sharedText || undefined}
            initialVoice={selectedVoice}
            autoGenerate={autoGenerate}
            autoDownload={autoDownload}
          />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-400">
            VoiceCraft AI • Context-Aware Neural Speech Studio
          </p>
          <p className="text-slate-600 text-[11px]">
            High-fidelity voice synthesis, real-time waveform visualization, instant MP3 exports, and shareable audio links.
          </p>
        </div>
      </footer>
    </div>
  );
}
