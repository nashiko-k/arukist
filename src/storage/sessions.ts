import { getItem, setItem } from './storage';
import type { WalkSession } from '../types/walk';

const SESSIONS_KEY = 'walk_sessions';

function migrateSession(raw: any): WalkSession {
  return {
    id: raw.id,
    startTime: raw.startTime,
    endTime: raw.endTime,
    startSteps: raw.startSteps,
    endSteps: raw.endSteps,
    memo: raw.memo ?? '',
    placeLabel: raw.placeLabel ?? null,
  };
}

export async function getAllSessions(): Promise<WalkSession[]> {
  const raw = await getItem<any[]>(SESSIONS_KEY);
  if (!raw) return [];
  return raw.map(migrateSession);
}

export async function saveSession(session: WalkSession): Promise<void> {
  const sessions = await getAllSessions();
  sessions.push(session);
  await setItem(SESSIONS_KEY, sessions);
}

export async function getLatestSession(): Promise<WalkSession | null> {
  const sessions = await getAllSessions();
  if (sessions.length === 0) return null;
  return sessions.reduce((latest, s) => (s.startTime > latest.startTime ? s : latest));
}
