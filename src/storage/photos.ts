import { deleteAsync } from 'expo-file-system/legacy';
import { getItem, setItem } from './storage';
import type { WalkPhoto } from '../types/photo';

const PHOTOS_KEY = 'walk_photos';

type PhotoMap = Record<string, WalkPhoto>;

async function getPhotoMap(): Promise<PhotoMap> {
  return (await getItem<PhotoMap>(PHOTOS_KEY)) ?? {};
}

export async function getAllPhotos(): Promise<PhotoMap> {
  return getPhotoMap();
}

export async function getPhotosByIds(ids: string[]): Promise<WalkPhoto[]> {
  const map = await getPhotoMap();
  const result: WalkPhoto[] = [];
  for (const id of ids) {
    const p = map[id];
    if (p) result.push(p);
  }
  return result;
}

export async function savePhoto(photo: WalkPhoto): Promise<void> {
  const map = await getPhotoMap();
  map[photo.id] = photo;
  await setItem(PHOTOS_KEY, map);
}

export async function deletePhoto(id: string): Promise<void> {
  const map = await getPhotoMap();
  const photo = map[id];
  if (photo) {
    try {
      await deleteAsync(photo.uri, { idempotent: true });
    } catch {
      // file may already be gone
    }
    delete map[id];
    await setItem(PHOTOS_KEY, map);
  }
}
