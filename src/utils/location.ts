import * as Location from 'expo-location';

export type CoarseLocation = {
  latitude: number;
  longitude: number;
};

export async function getCoarseLocation(): Promise<CoarseLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: current.coords.latitude, longitude: current.coords.longitude };
  } catch {
    return null;
  }
}

const PHOTO_LOCATION_TIMEOUT_MS = 5000;

/**
 * 写真用の現在地取得（〜100m 精度の Balanced）。
 * ベストエフォート：権限なし・取得失敗・5秒タイムアウト時は null を返す（throw しない）。
 */
export async function getPhotoLocation(): Promise<CoarseLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), PHOTO_LOCATION_TIMEOUT_MS);
    });

    const fetchLocation = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }).then((pos) => ({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    }));

    return await Promise.race([fetchLocation, timeout]);
  } catch {
    return null;
  }
}
