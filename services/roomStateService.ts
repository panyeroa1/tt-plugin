
import { createClient } from '@supabase/supabase-js';
import { RoomState, SpeakerInfo, QueueEntry } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const INITIAL_STATE: RoomState = {
  activeSpeaker: null,
  raiseHandQueue: [],
  lockVersion: 0,
};

let currentState: RoomState = INITIAL_STATE;
let meetingId: string | null = null;
let realtimeChannel: any = null;

export function initRoomService(mId: string) {
  meetingId = mId;
}

export function subscribeToRoomState(callback: (state: RoomState) => void): () => void {
  if (!meetingId) return () => {};

  // Initial fetch
  fetchRoomState(meetingId).then(state => {
    currentState = state;
    callback(currentState);
  });

  // Realtime subscription
  realtimeChannel = supabase
    .channel(`room_state:${meetingId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'rooms', 
      filter: `meeting_id=eq.${meetingId}` 
    }, (payload: any) => {
      if (payload.eventType === 'DELETE') {
        currentState = { ...INITIAL_STATE, lockVersion: currentState.lockVersion + 1 };
        callback(currentState);
        return;
      }

      const newRow = payload.new;
      if (newRow) {
        currentState = {
          activeSpeaker: newRow.active_speaker,
          raiseHandQueue: newRow.raise_hand_queue || [],
          lockVersion: currentState.lockVersion + 1
        };
        callback(currentState);
      }
    })
    .subscribe();

  return () => {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  };
}

export function getRoomState(): RoomState {
  return currentState;
}

async function fetchRoomState(mId: string): Promise<RoomState> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('meeting_id', mId)
    .single();

  if (error || !data) {
    // If room doesn't exist, try to create it optimistically
    const initialStateRow = {
      meeting_id: mId,
      active_speaker: null,
      raise_hand_queue: []
    };
    await supabase.from('rooms').upsert(initialStateRow);
    return INITIAL_STATE;
  }

  return {
    activeSpeaker: data.active_speaker,
    raiseHandQueue: data.raise_hand_queue || [],
    lockVersion: 0 // synced from server
  };
}

export async function tryAcquireSpeaker(userId: string, userName: string): Promise<boolean> {
  if (!meetingId) return false;

  // Optimistic check
  if (currentState.activeSpeaker && currentState.activeSpeaker.userId !== userId) {
    return false;
  }

  const newSpeakerInfo: SpeakerInfo = {
    userId,
    userName,
    sessionId: Math.random().toString(36).substring(7),
    since: Date.now(),
  };

  // Atomic update: only update if active_speaker is null OR active_speaker->>'userId' is my userId
  // Since Supabase generic RLS/update doesn't easily support complex "test-and-set" without stored procedures,
  // we will try to update and verify. 
  // BETTER: Use RLS "USING" clause or just simple last-write-wins for this prototype, 
  // but let's try to be safe by fetching fresh first inside the upsert logic if possible.
  // Actually, for simplicity and speed in this context:
  
  // 1. Fetch fresh
  const { data: freshRoom } = await supabase.from('rooms').select('active_speaker').eq('meeting_id', meetingId).single();
  const currentOwner = freshRoom?.active_speaker;

  if (currentOwner && currentOwner.userId !== userId) {
    return false; // Someone else has it
  }

  // 2. Update
  const { error } = await supabase
    .from('rooms')
    .update({ active_speaker: newSpeakerInfo })
    .eq('meeting_id', meetingId);

  return !error;
}

export async function releaseSpeaker(userId: string) {
  if (!meetingId) return;
  
  // Only release if we are the owner
  if (currentState.activeSpeaker?.userId !== userId) return;

  // Check queue for next speaker
  let nextQueue = [...currentState.raiseHandQueue];
  let nextSpeaker: SpeakerInfo | null = null;

  if (nextQueue.length > 0) {
    const nextInLine = nextQueue.shift()!;
    nextSpeaker = {
      userId: nextInLine.userId,
      userName: nextInLine.userName,
      sessionId: Math.random().toString(36).substring(7),
      since: Date.now(),
    };
  }

  await supabase
    .from('rooms')
    .update({ 
      active_speaker: nextSpeaker,
      raise_hand_queue: nextQueue
    })
    .eq('meeting_id', meetingId);
}

export async function raiseHand(userId: string, userName: string) {
  if (!meetingId) return;
  
  const state = currentState;
  if (state.raiseHandQueue.some(q => q.userId === userId)) return;
  if (state.activeSpeaker?.userId === userId) return;

  const newQueue = [...state.raiseHandQueue, { userId, userName, requestedAt: Date.now() }];

  await supabase
    .from('rooms')
    .update({ raise_hand_queue: newQueue })
    .eq('meeting_id', meetingId);
}

export async function lowerHand(userId: string) {
  if (!meetingId) return;

  const state = currentState;
  const newQueue = state.raiseHandQueue.filter(q => q.userId !== userId);

  await supabase
    .from('rooms')
    .update({ raise_hand_queue: newQueue })
    .eq('meeting_id', meetingId);
}
