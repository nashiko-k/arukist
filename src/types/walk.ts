import type { PlaceLabel } from './place';
import type { Weather } from '../utils/weather';

export type WalkSession = {
  id: string;
  startTime: number;
  endTime: number;
  steps: number;
  memo: string;
  placeLabel: PlaceLabel | null;
  photoIds: string[];
  weather?: Weather;
};
