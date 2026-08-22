import React, { useState, useEffect } from 'react';
import { VoiceName, AudioEngine, ContextPresetId, MAX_PLUGGED_VOICES, MIN_PLUGGED_VOICES, DEFAULT_PLUGGED_VOICES } from './types';
import { Navbar, AppNavTab } from './components/Navbar';
import { OpeningLandingPage } from './components/OpeningLandingPage';
import { ConversationalAudioStudio } from './components/ConversationalAudioStudio';
import { VoiceWorkshop } from './components/VoiceWorkshop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VOICE_OPTIONS } from './utils/audioUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppNavTab>('overview');
  
  // 2-3 plugged-in voices management state
  const [pluggedVoices, setPluggedVoices] = useState<VoiceName[]>(() => {
    try {
      const saved = localStorage.getItem('voicecraft_plugged_voices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= MIN_PLUGGED_VOICES) {
          return parsed.slice(0, MAX_PLUGGED_VOICES) as VoiceName[];
        }
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_PLUGGED_VOICES;
  });

  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(() => {
    try {
      const saved = localStorage.getItem('voicecraft_active_voice');
      if (saved && VOICE_OPTIONS.some(v => v.id === saved)) {
        return saved as VoiceName;
      }
    } catch (e) {
      // fallback
    }
    return 'Priya';
  });

  const [audioEngine, setAudioEngine] = useState<AudioEngine>('studio');

  // Shared Link Parameters
  const [sharedText, setSharedText] = useState<string>('');
  const [sharedPreset, setSharedPreset] = useState<ContextPresetId>('narrator');
  const [autoGenerate, setAutoGenerate] = useState<boolean>(false);
  const [autoDownload, setAutoDownload] = useState<boolean>(false);

  // Synchronize plugged voices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voicecraft_plugged_voices', JSON.stringify(pluggedVoices));
    } catch (e) {}
  }, [pluggedVoices]);

  // Synchronize active voice to localStorage and ensure it is plugged in
  useEffect(() => {
    try {
      localStorage.setItem('voicecraft_active_voice', selectedVoice);
    } catch (e) {}

    // Auto-plug if not already in pluggedVoices
    if (!pluggedVoices.includes(selectedVoice)) {
      setPluggedVoices(prev => {
        if (prev.length < MAX_PLUGGED_VOICES) {
          return [...prev, selectedVoice];
        }
        // Replace last voice to maintain max limit of 3
        return [prev[0], prev[1] || selectedVoice, selectedVoice];
      });
    }
  }, [selectedVoice]);

  // Plug / Enable a voice (up to 3 maximum)
  const handlePlugVoice = (voice: VoiceName) => {
    if (!pluggedVoices.includes(voice)) {
      if (pluggedVoices.length < MAX_PLUGGED_VOICES) {
        setPluggedVoices(prev => [...prev, voice]);
      } else {
        // If 3 are already plugged in, replace the 3rd slot with new voice
        setPluggedVoices(prev => [prev[0], prev[1], voice]);
      }
    }
    setSelectedVoice(voice);
  };

  // Unplug / Disable a voice (keep minimum 1)
  const handleUnplugVoice = (voice: VoiceName) => {
    if (pluggedVoices.length <= MIN_PLUGGED_VOICES) {
      return; // Must keep at least 1 voice plugged in
    }

    const remaining = pluggedVoices.filter(v => v !== voice);
    setPluggedVoices(remaining);

    // If currently active voice is disabled, auto-switch to remaining voice
    if (selectedVoice === voice && remaining.length > 0) {
      setSelectedVoice(remaining[0]);
    }
  };

  // Toggle plug/unplug status for a voice
  const handleTogglePlugVoice = (voice: VoiceName) => {
    if (pluggedVoices.includes(voice)) {
      handleUnplugVoice(voice);
    } else {
      handlePlugVoice(voice);
    }
  };

  // Select active voice (and ensure it's plugged in)
  const handleSelectVoice = (voice: VoiceName) => {
    if (!pluggedVoices.includes(voice)) {
      handlePlugVoice(voice);
    } else {
      setSelectedVoice(voice);
    }
  };

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
      if (voiceParam && VOICE_OPTIONS.some(v => v.id === voiceParam)) {
        handleSelectVoice(voiceParam);
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
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
        {/* Top Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedVoice={selectedVoice}
          onSelectVoice={handleSelectVoice}
          pluggedVoices={pluggedVoices}
          onTogglePlugVoice={handleTogglePlugVoice}
          onUnplugVoice={handleUnplugVoice}
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
              onSelectVoice={handleSelectVoice}
              pluggedVoices={pluggedVoices}
              onTogglePlugVoice={handleTogglePlugVoice}
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
              onSelectVoice={handleSelectVoice}
              pluggedVoices={pluggedVoices}
              onPlugVoice={handlePlugVoice}
              onUnplugVoice={handleUnplugVoice}
              onTogglePlugVoice={handleTogglePlugVoice}
              initialText={sharedText || undefined}
              autoGenerate={autoGenerate}
              autoDownload={autoDownload}
            />
          )}

          {/* TAB 3: VOICE WORKSHOP & SYNTHESIZER */}
          {activeTab === 'workshop' && (
            <VoiceWorkshop
              selectedVoice={selectedVoice}
              onSelectVoice={handleSelectVoice}
              pluggedVoices={pluggedVoices}
              onPlugVoice={handlePlugVoice}
              onUnplugVoice={handleUnplugVoice}
              onTogglePlugVoice={handleTogglePlugVoice}
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
              VoiceCraft AI • Multi-Voice Neural Speech Studio
            </p>
            <p className="text-slate-600 text-[11px]">
              Multi-voice plug-in routing (2-3 simultaneous enabled voices), real-time waveform visualization, instant MP3 exports, and shareable audio links.
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

