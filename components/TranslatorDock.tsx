
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppMode, Language, LANGUAGES, RoomState, AudioSource, EmotionType, QueueEntry } from '../types';
import { ChevronDown, ChevronUp, Mic, Volume2, Hand, X, Lock, Loader2, Share2, LogOut } from 'lucide-react';

interface TranslatorDockProps {
  mode: AppMode;
  roomState: RoomState;
  selectedLanguage: Language;
  myUserId: string;
  onSpeakToggle: () => void;
  onListenToggle: () => void;
  onLanguageChange: (lang: Language) => void;
  onRaiseHand: () => void;
  audioData?: Uint8Array;
  audioSource: AudioSource;
  onAudioSourceToggle: () => void;
  liveStreamText?: string;
  translatedStreamText?: string;
  isTtsLoading?: boolean;
  emotion?: EmotionType;
  meetingId: string;
  onInvite: () => void;
  onExit: () => void;
}

const emotionColors: Record<EmotionType, string> = {
  neutral: 'text-slate-100',
  joy: 'text-emerald-400',
  sadness: 'text-blue-400',
  anger: 'text-red-400',
  fear: 'text-purple-400',
  calm: 'text-cyan-300',
  excited: 'text-amber-400',
};

const AudioBar: React.FC<{ height: number, opacity: number, colorClass: string }> = ({ height, opacity, colorClass }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--bar-height', `${height}px`);
      ref.current.style.setProperty('--bar-opacity', opacity.toString());
    }
  }, [height, opacity]);

  return <div ref={ref} className={`audio-bar ${colorClass}`} />;
};

const AudioVisualizer: React.FC<{ data: Uint8Array, colorClass?: string }> = ({ data, colorClass = 'bg-white' }) => {
  if (!data || data.length === 0) return null;
  const bars = Array.from(data.slice(3, 11));
  const hasSignal = bars.some((v: number) => v > 4);
  if (!hasSignal) return null;

  return (
    <div className="flex items-center gap-[1.5px] h-3 ml-2.5">
      {bars.map((val: number, i: number) => {
        const height = Math.max(2, (val / 255) * 14);
        const opacity = 0.3 + (val / 255) * 0.7;
        return (
          <AudioBar
            key={i}
            height={height}
            opacity={opacity}
            colorClass={colorClass}
          />
        );
      })}
    </div>
  );
};

const TranslatorDock: React.FC<TranslatorDockProps> = ({
  mode,
  roomState,
  selectedLanguage,
  myUserId,
  onSpeakToggle,
  onListenToggle,
  onLanguageChange,
  onRaiseHand,
  audioData,
  audioSource,
  onAudioSourceToggle,
  liveStreamText,
  translatedStreamText,
  isTtsLoading,
  emotion = 'neutral',
  meetingId,
  onInvite,
  onExit
}) => {
  const isSomeoneElseSpeaking = roomState.activeSpeaker && roomState.activeSpeaker.userId !== myUserId;
  const isMeSpeaking = mode === 'speaking';
  const isMeListening = mode === 'listening';
  
  const [showLangs, setShowLangs] = React.useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const myQueuePosition = roomState.raiseHandQueue.findIndex((q: QueueEntry) => q.userId === myUserId);
  const isQueued = myQueuePosition !== -1;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const displayText = isMeListening ? translatedStreamText : liveStreamText;
  const isTranslation = isMeListening && !!translatedStreamText;

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [displayText]);

  const handleLangClick = () => {
    if (!isMeListening) {
      setShowLangs(!showLangs);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
      
      {/* Sticky Top Control Dock (Header) */}
      <div 
        className={`fixed top-0 left-0 w-full z-[110] transition-transform duration-500 ease-in-out flex flex-col items-center ${
          isHeaderCollapsed ? '-translate-y-[calc(100%-12px)]' : 'translate-y-0'
        }`}
      >
        <div className="w-full bg-[#0a0f18]/80 backdrop-blur-xl border-b border-slate-700/30 h-[90px] flex items-center justify-center px-4 relative">
          <div className="relative flex items-stretch h-[64px] bg-[#1a2333]/95 backdrop-blur-2xl rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-slate-700/50 w-full max-w-[800px]">
            {/* Speak Button */}
            <div className="relative flex-1 flex items-stretch border-r border-slate-700/20">
              <button
                onClick={onSpeakToggle}
                disabled={(isSomeoneElseSpeaking && !isMeSpeaking) || isMeListening}
                className={`flex-1 flex items-center justify-center gap-2.5 px-4 rounded-l-[22px] transition-all disabled:opacity-30 ${
                  isMeSpeaking ? 'bg-red-500/90 text-white animate-live-pulse' : 'hover:bg-slate-700/20 text-slate-300'
                }`}
              >
                {isMeSpeaking ? <X className="w-5 h-5" /> : (isSomeoneElseSpeaking || isMeListening ? <Lock className="w-5 h-5 opacity-40" /> : <Mic className="w-4 h-4" />)}
                <span className="font-bold text-[16px] tracking-tight text-white">Speak</span>
                {isMeSpeaking && audioData && <AudioVisualizer data={audioData} colorClass="bg-white" />}
              </button>
            </div>

            {/* Listen Button */}
            <button
              onClick={onListenToggle}
              disabled={isMeSpeaking}
              className={`flex-1 flex items-center justify-center gap-2.5 px-4 transition-all border-r border-slate-700/20 disabled:opacity-20 ${
                isMeListening ? 'bg-blue-600/95 text-white ring-1 ring-blue-400/40 shadow-inner' : 'hover:bg-slate-700/20 text-slate-300'
              }`}
            >
              {isTtsLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-200" /> : <Volume2 className="w-4 h-4" />}
              <span className="font-bold text-[16px] tracking-tight">{isMeListening ? 'Live Aloud' : 'Listen'}</span>
              {isMeListening && audioData && <AudioVisualizer data={audioData} colorClass="bg-blue-200" />}
            </button>

            {/* Language Center */}
            <div className="relative flex-1 flex items-stretch border-r border-slate-700/20">
              <button
                onClick={handleLangClick}
                disabled={isMeListening}
                className={`flex-1 flex items-center gap-3 px-4 transition-all ${
                  isMeListening ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-700/20'
                }`}
              >
                <span className="text-2xl drop-shadow-md">{selectedLanguage.flag}</span>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-black text-slate-100 text-[14px] uppercase truncate w-full text-left">{selectedLanguage.code.split('-')[1] || selectedLanguage.code}</span>
                  <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider truncate w-full text-left">{selectedLanguage.name}</span>
                </div>
                {!isMeListening && <ChevronDown className="w-3 h-3 text-slate-600 ml-auto" />}
              </button>

              {showLangs && !isMeListening && (
                <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#0f172a]/95 border border-slate-700/60 rounded-[18px] shadow-2xl p-2 w-[260px] max-h-[380px] overflow-y-auto z-[120] animate-in fade-in zoom-in-95 duration-200">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { onLanguageChange(lang); setShowLangs(false); }}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-[14px] text-left w-full transition-all ${
                        selectedLanguage.code === lang.code ? 'bg-blue-600 text-white' : 'hover:bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-[13px] font-bold">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Raise Hand Queue */}
            <button
              onClick={onRaiseHand}
              disabled={isMeSpeaking}
              className={`flex-1 flex items-center justify-center gap-2.5 px-4 transition-all border-r border-slate-700/20 disabled:opacity-20 ${
                isQueued ? 'bg-amber-600/90 text-white' : 'hover:bg-slate-700/20 text-slate-300'
              }`}
            >
              <Hand className={`w-4 h-4 ${isQueued ? 'animate-bounce' : ''}`} />
              <span className="font-bold text-[16px] tracking-tight">{isQueued ? 'Queued' : 'Queue'}</span>
            </button>

            {/* Invite Button */}
            <button
              onClick={onInvite}
              className="flex-1 flex items-center justify-center gap-2.5 px-4 transition-all border-r border-slate-700/20 hover:bg-slate-700/20 text-slate-300"
              title={`Meeting ID: ${meetingId}`}
            >
              <Share2 className="w-4 h-4" />
              <span className="font-bold text-[16px] tracking-tight">Invite</span>
            </button>

            {/* Exit Button */}
            <button
              onClick={onExit}
              className="flex-1 flex items-center justify-center gap-2.5 px-4 rounded-r-[22px] transition-all hover:bg-red-900/20 text-red-400 group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-all" />
              <span className="font-bold text-[16px] tracking-tight">Exit</span>
            </button>
          </div>

          {/* Header Collapsible Toggle Button */}
          <button 
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md border border-slate-700/50 rounded-b-xl px-4 py-1 flex items-center justify-center transition-all group shadow-lg"
          >
            {isHeaderCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-y-0.5 transition-all" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:-translate-y-0.5 transition-all" />
            )}
          </button>
        </div>
      </div>


      {/* Fixed Bottom Transcription Bar (Always Visible) */}
      <div 
        className="fixed bottom-[65px] left-0 w-full z-[100] flex flex-col items-center"
      >
        <div className="w-full max-w-[900px] bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 h-16 flex items-center justify-center relative px-6">
          <div 
            ref={scrollContainerRef}
            className="w-full overflow-x-hidden whitespace-nowrap scroll-smooth flex justify-start items-center"
          >
            {displayText && (
              <span className="text-[14px] text-lime-400 font-bold tracking-wide transition-all duration-300 inline-block px-4">
                {displayText}
              </span>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default TranslatorDock;
