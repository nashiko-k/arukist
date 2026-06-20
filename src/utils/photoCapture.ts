import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { savePhoto } from '../storage/photos';
import type { WalkPhoto } from '../types/photo';
import { getPhotoLocation } from './location';

const PHOTO_DIR = `${documentDirectory}photos/`;

async function ensurePhotoDirectory(): Promise<string> {
  const info = await getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
  return PHOTO_DIR;
}

function generatePhotoId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function persistAndSave(sourceUri: string): Promise<WalkPhoto> {
  const dir = await ensurePhotoDirectory();
  const id = generatePhotoId();
  const ext = sourceUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const destUri = `${dir}${id}.${ext}`;
  await copyAsync({ from: sourceUri, to: destUri });

  // GPS 座標はベストエフォート（取得失敗・タイムアウト時は null）
  const location = await getPhotoLocation();

  const photo: WalkPhoto = {
    id,
    uri: destUri,
    takenAt: Date.now(),
    ...(location
      ? { latitude: location.latitude, longitude: location.longitude }
      : {}),
  };
  await savePhoto(photo);
  return photo;
}

// 撮影した写真を端末のカメラロールにも保存する（ベストエフォート）。
// 権限拒否・失敗が起きてもアプリ内保存や散歩記録は壊さない。
async function saveToCameraRoll(uri: string): Promise<void> {
  try {
    // writeOnly = true（追加のみ）。全ライブラリ読み取り権限は要求しない。
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status === 'granted') {
      await MediaLibrary.saveToLibraryAsync(uri);
    }
    // granted でなくてもアプリ内保存は成立済みなので、ここでは何もしない
  } catch (e) {
    console.warn('カメラロール保存に失敗:', e);
  }
}

export async function captureFromCamera(): Promise<WalkPhoto | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    allowsEditing: false,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const photo = await persistAndSave(result.assets[0].uri);
  // アプリ内カメラで撮った写真だけ、端末のカメラロールにも保存する。
  // （ライブラリ選択の写真は既にカメラロールにあるため対象外）
  await saveToCameraRoll(result.assets[0].uri);
  return photo;
}

export async function captureFromLibrary(): Promise<WalkPhoto | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.7,
    allowsEditing: false,
    mediaTypes: ['images'],
  });
  if (result.canceled || result.assets.length === 0) return null;

  return persistAndSave(result.assets[0].uri);
}
