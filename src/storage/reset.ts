import { deleteAsync } from 'expo-file-system/legacy';
import { getAllPhotos } from './photos';
import { removeItem } from './storage';

const STORAGE_KEYS = [
  'walk_photos',
  'walk_sessions',
  'spot_names',
  'last_greeting_date',
];

export async function resetAllData(): Promise<void> {
  // 1. 写真ファイル本体を削除
  const photos = await getAllPhotos();
  for (const photo of Object.values(photos)) {
    try {
      await deleteAsync(photo.uri, { idempotent: true });
    } catch {
      // ファイルが既にない等は無視
    }
  }

  // 2. 全ストレージキーをクリア
  for (const key of STORAGE_KEYS) {
    try {
      await removeItem(key);
    } catch {
      // キーが存在しない等は無視
    }
  }
}
