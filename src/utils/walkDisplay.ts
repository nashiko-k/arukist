import type { WalkSession } from '../types/walk';

export function getSessionStepCount(session: WalkSession): number {
  return session.sessionSteps ?? Math.max(0, session.endSteps - session.startSteps);
}
