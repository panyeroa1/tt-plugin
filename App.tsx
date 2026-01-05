
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AppMode, Language, LANGUAGES, RoomState, AudioSource, EmotionType, AUTO_DETECT, QueueEntry } from './types';
import TranslatorDock from './components/TranslatorDock';
import * as roomStateService from './services/roomStateService';
import * as geminiService from './services/geminiService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const getMeetingId = () => {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  if (room) return room;
  // Fallback to existing logic or generate new
  const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const url = new URL(window.location.href);
  url.searchParams.set('room', newId);
  window.history.replaceState({}, '', url);
  return newId;
};

const MEETING_ID = getMeetingId();

// Constant for maximum characters to show on one line before "scrolling" by pruning
const MAX_LINE_CHARACTERS = 130;

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('idle');
  const [audioSource, setAudioSource] = useState<AudioSource>('mic');
  const [roomState, setRoomState] = useState<RoomState>(roomStateService.getRoomState());
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  
  const [lastFinalText, setLastFinalText] = useState<string>('');
  const [livePartialText, setLivePartialText] = useState<string>('');
  const [remoteSourceText, setRemoteSourceText] = useState<string>('');
  const [translatedStreamText, setTranslatedStreamText] = useState<string>('');
  
  const [emotion, setEmotion] = useState<EmotionType>('neutral');
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  
  const [myUserId, setMyUserId] = useState<string>('');
  const [myUserName, setMyUserName] = useState<string>('');

  const modeRef = useRef<AppMode>('idle');
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const selectedLanguageRef = useRef<Language>(LANGUAGES[0]);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let activeUser = user;
      
      if (!activeUser) {
        const { data } = await supabase.auth.signInAnonymously();
        activeUser = data.user;
      }

      if (activeUser) {
        const userId = activeUser.id;
        const userName = `Member ${userId.slice(0, 5).toUpperCase()}`;
        setMyUserId(userId);
        setMyUserName(userName);

        await supabase.from('users').upsert({
          user_id: userId,
          email: activeUser.email || `${userId}@eburon.ai`,
          role: 'student'
        }, { onConflict: 'user_id' });

        await supabase.from('user_configs').upsert({
          user_identity: userId,
          target_language: selectedLanguageRef.current.code.split('-')[0],
          translation_engine: 'google'
        }, { onConflict: 'user_identity' });
      }
    };
    
    initAuth();
  }, []);

  const pruneText = (text: string) => {
    if (text.length <= MAX_LINE_CHARACTERS) return text;
    const excess = text.length - MAX_LINE_CHARACTERS;
    const cutIndex = text.indexOf(' ', excess);
    return cutIndex === -1 ? text.slice(excess) : text.slice(cutIndex).trim();
  };

  const resetClearTimer = useCallback(() => {
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => {
      setLastFinalText('');
      setLivePartialText('');
      setRemoteSourceText('');
      setTranslatedStreamText('');
    }, 5000);

    roomStateService.initRoomService(MEETING_ID);
  }, []);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isTtsActiveRef = useRef(false);
  const lastProcessedSegmentIdRef = useRef<string | null>(null);
  
  const segmentQueueRef = useRef<any[]>([]);
  const realtimeChannelRef = useRef<any>(null);

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const shipSegment = async (text: string) => {
    const segment = text.trim();
    if (!segment) return;

    const segmentId = Math.random().toString(36).substring(7);
    
    const { data: existing } = await supabase
      .from('transcript_segments')
      .select('full_transcription')
      .eq('meeting_id', MEETING_ID)
      .maybeSingle();

    const previousFullText = existing?.full_transcription || '';
    const updatedFullText = previousFullText ? `${previousFullText} ${segment}` : segment;

    await supabase.from('transcript_segments').upsert({ 
      meeting_id: MEETING_ID, 
      speaker_id: myUserId, 
      source_lang: selectedLanguageRef.current.code, 
      source_text: segment,
      full_transcription: updatedFullText,
      last_segment_id: segmentId
    }, { onConflict: 'meeting_id' });
  };

  const processNextInQueue = useCallback(async () => {
    if (segmentQueueRef.current.length === 0 || isTtsActiveRef.current) return;

    const row = segmentQueueRef.current.shift();
    if (!row || row.last_segment_id === lastProcessedSegmentIdRef.current) {
      processNextInQueue();
      return;
    }

    lastProcessedSegmentIdRef.current = row.last_segment_id;
    setIsTtsLoading(true);
    
    const currentTargetLang = selectedLanguageRef.current;
    const targetName = currentTargetLang.code === 'auto' ? 'English' : currentTargetLang.name;
    const ctx = ensureAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    try {
      isTtsActiveRef.current = true;
      console.log(`Starting TTS for segment: ${row.meeting_id}`);
      
      await geminiService.streamTranslation(
        row.source_text,
        targetName,
        ctx,
        (data) => {
          setAudioData(data);
          // Only stop loading once we actually get audio data
          if (data.length > 0) setIsTtsLoading(false);
        },
        (text) => {
          setTranslatedStreamText(pruneText(text));
          resetClearTimer();
        },
        () => {
          console.log("TTS segment complete");
          isTtsActiveRef.current = false;
          setAudioData(new Uint8Array(0));
          setIsTtsLoading(false); // Ensure loading is off
          if (segmentQueueRef.current.length > 0) processNextInQueue();
        },
        row.source_lang
      );
    } catch (err) {
      console.error("Failed to process segment:", err);
      setIsTtsLoading(false);
      isTtsActiveRef.current = false;
      processNextInQueue();
    }
  }, [ensureAudioContext, resetClearTimer]);

  const handleIncomingRow = useCallback((row: any) => {
    if (!row || row.speaker_id === myUserId) return;
    if (row.last_segment_id === lastProcessedSegmentIdRef.current) return;
    if (segmentQueueRef.current.some((q: any) => q.last_segment_id === row.last_segment_id)) return;

    if (modeRef.current === 'listening') {
      setRemoteSourceText(pruneText(row.source_text));
      setTranslatedStreamText(''); 
      resetClearTimer();
    }

    segmentQueueRef.current.push(row);
    processNextInQueue();
  }, [processNextInQueue, myUserId]);

  const fetchCurrentSegment = useCallback(async () => {
    const { data } = await supabase.from('transcript_segments')
      .select('*')
      .eq('meeting_id', MEETING_ID)
      .maybeSingle();
    
    if (data) handleIncomingRow(data);
  }, [handleIncomingRow]);

  useEffect(() => {
    if (mode === 'listening') {
      const channel = supabase
        .channel(`meeting:${MEETING_ID}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transcript_segments', filter: `meeting_id=eq.${MEETING_ID}` }, 
          (payload) => handleIncomingRow(payload.new))
        .subscribe();
      
      realtimeChannelRef.current = channel;
      fetchCurrentSegment();
      const pollInterval = setInterval(fetchCurrentSegment, 2000);

      return () => {
        if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
        clearInterval(pollInterval);
      };
    }
  }, [mode, handleIncomingRow, fetchCurrentSegment]);

  const toggleListen = async () => {
    ensureAudioContext(); 
    if (mode === 'listening') {
      setMode('idle');
      setTranslatedStreamText('');
      setRemoteSourceText('');
      setAudioData(new Uint8Array(0));
      segmentQueueRef.current = [];
      lastProcessedSegmentIdRef.current = null;
    } else {
      setMode('listening');
      setLivePartialText('');
      setLastFinalText('');
      setTranslatedStreamText('');
    }
  };

  const handleSpeakToggle = async () => {
    ensureAudioContext();
    if (mode === 'speaking') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping recognition:", e);
        }
      }
      setMode('idle');
      setLivePartialText('');
      setLastFinalText('');
      roomStateService.releaseSpeaker(myUserId);
    } else {
      if (mode === 'listening') {
        alert("Please stop listening before speaking.");
        return;
      }
      
      const acquired = await roomStateService.tryAcquireSpeaker(myUserId, myUserName);
      if (acquired) {
        setMode('speaking');
        setLastFinalText('');
        
        try {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome.");
            setMode('idle');
            roomStateService.releaseSpeaker(myUserId);
            return;
          }

          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = selectedLanguageRef.current.code === 'auto' ? navigator.language : selectedLanguageRef.current.code; 
          
          recognition.onresult = (event: any) => {
            let final = '', interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final = event.results[i][0].transcript;
                setLastFinalText(pruneText(final));
                setLivePartialText('');
                shipSegment(final);
                resetClearTimer();
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            if (interim) {
              setLivePartialText(pruneText(interim));
              resetClearTimer();
            }
          };

          recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
              alert("Microphone access denied. Please allow microphone access.");
            }
            setMode('idle');
            roomStateService.releaseSpeaker(myUserId);
          };

          recognition.onend = () => {
            // Restart if still in speaking mode? Better to let user toggle.
            if (modeRef.current === 'speaking') {
              console.log("Recognition ended unexpectedly.");
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.error("Failed to start speech recognition:", err);
          alert("Could not start speech recognition. Check console for details.");
          setMode('idle');
          roomStateService.releaseSpeaker(myUserId);
        }
      } else {
        const state = roomStateService.getRoomState();
        alert(`Someone else is currently speaking: ${state.activeSpeaker?.userName || 'Unknown'}`);
      }
    }
  };

  const handleInvite = async () => {
    const shareData = {
      title: 'Join my Eburon Translator Room',
      text: `Join my translation room: ${MEETING_ID}`,
      url: window.location.href,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Meeting link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleExit = () => {
    if (confirm('Are you sure you want to exit the room?')) {
      window.location.href = 'https://eburon.ai';
    }
  };

  useEffect(() => {
    const unsub = roomStateService.subscribeToRoomState(setRoomState);
    return () => {
      unsub();
      // Only release if we were the owner
      const state = roomStateService.getRoomState();
      if (state.activeSpeaker?.userId === myUserIdRef.current) {
        roomStateService.releaseSpeaker(myUserIdRef.current);
      }
    };
  }, []);

  // Use a ref for myUserId to use in cleanup
  const myUserIdRef = useRef(myUserId);
  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  const sourceDisplayText = livePartialText || lastFinalText;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-4 overflow-hidden relative">
      <TranslatorDock
        mode={mode}
        roomState={roomState}
        selectedLanguage={selectedLanguage}
        myUserId={myUserId}
        onSpeakToggle={handleSpeakToggle}
        onListenToggle={toggleListen}
        onLanguageChange={setSelectedLanguage}
        onRaiseHand={() => roomStateService.raiseHand(myUserId, myUserName)}
        audioData={audioData}
        audioSource={audioSource}
        onAudioSourceToggle={() => setAudioSource(audioSource === 'mic' ? 'system' : 'mic')}
        liveStreamText={mode === 'listening' ? remoteSourceText : sourceDisplayText}
        translatedStreamText={translatedStreamText}
        isTtsLoading={isTtsLoading}
        isTtsActive={isTtsActiveRef.current}
        emotion={emotion}
        meetingId={MEETING_ID}
        onInvite={handleInvite}
        onExit={handleExit}
      />
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(0,0,0,1)_100%)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
};

export default App;
