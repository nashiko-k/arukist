import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { savePhoto } from '../storage/photos';
import type { WalkPhoto } from '../types/photo';

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
  const photo: WalkPhoto = { id, uri: destUri, takenAt: Date.now() };
  await savePhoto(photo);
  return photo;
}

export async function captureFromCamera(): Promise<WalkPhoto | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    allowsEditing: false,
  });
  if (result.canceled || result.assets.length === 0) return null;

  return persistAndSave(result.assets[0].uri);
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
