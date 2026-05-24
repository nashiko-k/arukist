import { getItem, setItem } from './storage';
import { deletePhoto } from './photos';
import type { WalkSession } from '../types/walk';

const SESSIONS_KEY = 'walk_sessions';

function migrateSession(raw: any): WalkSession {
  return {
    id: raw.id,
    startTime: raw.startTime,
    endTime: raw.endTime,
    steps: raw.steps ?? 0,
    memo: raw.memo ?? '',
    placeLabel: raw.placeLabel ?? null,
    photoIds: raw.photoIds ?? [],
    weather: raw.weather,
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

export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await getAllSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;

  // 関連写真を全削除（deletePhoto はファイル実体も削除する）
  if (session.photoIds && session.photoIds.length > 0) {
    for (const pid of session.photoIds) {
      await deletePhoto(pid);
    }
  }

  // セッション本体を削除
  const updated = sessions.filter((s) => s.id !== sessionId);
  await setItem(SESSIONS_KEY, updated);
}

export async function getLatestSession(): Promise<WalkSession | null> {
  const sessions = await getAllSessions();
  if (sessions.length === 0) return null;
  return sessions.reduce((latest, s) => (s.startTime > latest.startTime ? s : latest));
}
