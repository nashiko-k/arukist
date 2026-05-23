import type { WalkPhoto } from './photo';

export type SpotLevel = 1 | 2 | 3 | 4 | 5;

export type SpotCluster = {
  id: string;
  anchorPhoto: WalkPhoto;
  photos: WalkPhoto[];
  visitDays: number;
  level: SpotLevel;
};
