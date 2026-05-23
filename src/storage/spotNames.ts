import { getItem, setItem } from './storage';

const SPOT_NAMES_KEY = 'spot_names';

export type SpotNames = Record<string, string>;

export async function getSpotNames(): Promise<SpotNames> {
  return (await getItem<SpotNames>(SPOT_NAMES_KEY)) ?? {};
}

export async function setSpotName(
  anchorPhotoId: string,
  name: string,
): Promise<void> {
  const names = await getSpotNames();
  names[anchorPhotoId] = name;
  await setItem(SPOT_NAMES_KEY, names);
}
