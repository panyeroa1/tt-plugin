
import { RoomState, SpeakerInfo, QueueEntry } from '../types';

const STORAGE_KEY = 'translator_plugin_room_state';

const INITIAL_STATE: RoomState = {
  activeSpeaker: null,
  raiseHandQueue: [],
  lockVersion: 0,
};

export function getRoomState(): RoomState {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : INITIAL_STATE;
}

export function updateRoomState(newState: RoomState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  // Dispatch event for other tabs
  window.dispatchEvent(new Event('storage'));
}

export function subscribeToRoomState(callback: (state: RoomState) => void) {
  const handler = () => callback(getRoomState());
  window.addEventListener('storage', handler);
  callback(getRoomState());
  return () => window.removeEventListener('storage', handler);
}

export function tryAcquireSpeaker(userId: string, userName: string): boolean {
  const state = getRoomState();
  if (state.activeSpeaker === null || state.activeSpeaker.userId === userId) {
    const newState: RoomState = {
      ...state,
      activeSpeaker: {
        userId,
        userName,
        sessionId: state.activeSpeaker?.sessionId || Math.random().toString(36).substring(7),
        since: state.activeSpeaker?.since || Date.now(),
      },
      lockVersion: state.lockVersion + 1,
    };
    updateRoomState(newState);
    return true;
  }
  return false;
}

export function releaseSpeaker(userId: string) {
  const state = getRoomState();
  if (state.activeSpeaker?.userId === userId) {
    let nextQueue = [...state.raiseHandQueue];
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

    const newState: RoomState = {
      ...state,
      activeSpeaker: nextSpeaker,
      raiseHandQueue: nextQueue,
      lockVersion: state.lockVersion + 1,
    };
    updateRoomState(newState);
  }
}

export function raiseHand(userId: string, userName: string) {
  const state = getRoomState();
  if (state.raiseHandQueue.some(q => q.userId === userId)) return;
  if (state.activeSpeaker?.userId === userId) return;

  const newState: RoomState = {
    ...state,
    raiseHandQueue: [...state.raiseHandQueue, { userId, userName, requestedAt: Date.now() }],
    lockVersion: state.lockVersion + 1,
  };
  updateRoomState(newState);
}

export function lowerHand(userId: string) {
  const state = getRoomState();
  const newState: RoomState = {
    ...state,
    raiseHandQueue: state.raiseHandQueue.filter(q => q.userId !== userId),
    lockVersion: state.lockVersion + 1,
  };
  updateRoomState(newState);
}
