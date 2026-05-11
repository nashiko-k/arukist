import type { PlaceLabel } from './place';

export type WalkSession = {
  id: string;
  startTime: number;
  endTime: number;
  startSteps: number;
  endSteps: number;
  memo: string;
  placeLabel: PlaceLabel | null;
};

export type WalkSummary = {
  durationMs: number;
  sessionSteps: number;
  calories: number;
};
