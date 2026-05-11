export type WalkSession = {
  id: string;
  startTime: number;
  endTime: number;
  startSteps: number;
  endSteps: number;
};

export type WalkSummary = {
  durationMs: number;
  sessionSteps: number;
  calories: number;
};
