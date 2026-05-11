import { getItem, setItem } from './storage';
import type { WalkSession } from '../types/walk';

const SESSIONS_KEY = 'walk_sessions';

export async function getAllSessions(): Promise<WalkSession[]> {
  const sessions = await getItem<WalkSession[]>(SESSIONS_KEY);
  return sessions ?? [];
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
