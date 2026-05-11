export type PlaceLabel =
  | 'shrine'
  | 'park'
  | 'waterside'
  | 'walkpath'
  | 'shopping'
  | 'station'
  | 'cafe'
  | 'sports'
  | 'residential'
  | 'other';

export const PLACE_LABEL_TEXT: Record<PlaceLabel, string> = {
  shrine: '神社・寺院',
  park: '公園・緑地',
  waterside: '川沿い・水辺',
  walkpath: '散歩道',
  shopping: '商店街',
  station: '駅周辺',
  cafe: 'カフェ',
  sports: 'スポーツ施設',
  residential: '住宅街',
  other: 'その他',
};

export const PLACE_LABEL_ORDER: PlaceLabel[] = [
  'park',
  'walkpath',
  'waterside',
  'shrine',
  'shopping',
  'station',
  'cafe',
  'sports',
  'residential',
  'other',
];
