import type { WalkSession } from '../types/walk';
import { toDateKey } from './dates';

export type MonthSummary = {
  walkDays: number;
  currentStreak: number;
};

export function getSessionsByDay(sessions: WalkSession[]): Map<string, WalkSession[]> {
  const map = new Map<string, WalkSession[]>();
  for (const s of sessions) {
    const key = toDateKey(new Date(s.startTime));
    const list = map.get(key);
    if (list) {
      list.push(s);
    } else {
      map.set(key, [s]);
    }
  }
  return map;
}

export function computeMonthSummary(
  sessions: WalkSession[],
  year: number,
  month: number,
): MonthSummary {
  const monthStart = new Date(year, month, 1).getTime();
  const monthEnd = new Date(year, month + 1, 1).getTime();

  const inMonth = sessions.filter((s) => s.startTime >= monthStart && s.startTime < monthEnd);

  const daySet = new Set<string>();
  for (const s of inMonth) {
    daySet.add(toDateKey(new Date(s.startTime)));
  }

  const currentStreak = computeStreak(sessions);

  return { walkDays: daySet.size, currentStreak };
}

function computeStreak(sessions: WalkSession[]): number {
  if (sessions.length === 0) return 0;

  const daySet = new Set<string>();
  for (const s of sessions) {
    daySet.add(toDateKey(new Date(s.startTime)));
  }

  const today = new Date();
  if (!daySet.has(toDateKey(today))) return 0;

  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (daySet.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
