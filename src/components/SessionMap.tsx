import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { getPhotosByIds } from '../storage/photos';
import { colors } from '../theme/colors';
import type { WalkPhoto } from '../types/photo';

type Props = {
  photoIds: string[];
  memo: string;
};

type GeoPhoto = WalkPhoto & { latitude: number; longitude: number };

function hasCoords(p: WalkPhoto): p is GeoPhoto {
  return typeof p.latitude === 'number' && typeof p.longitude === 'number';
}

// 例: 5/22 23:54
function formatTakenAt(takenAt: number): string {
  const d = new Date(takenAt);
  const mm = String(d.getMinutes()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

export default function SessionMap({ photoIds, memo }: Props) {
  const [geoPhotos, setGeoPhotos] = useState<GeoPhoto[]>([]);
  const mapRef = useRef<MapView | null>(null);

  // photoIds は呼び出し側で毎レンダー新しい配列になりうるので、内容をキー化して再取得を抑制
  const idsKey = photoIds.join(',');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (photoIds.length === 0) {
        if (!cancelled) setGeoPhotos([]);
        return;
      }
      const photos = await getPhotosByIds(photoIds);
      if (!cancelled) setGeoPhotos(photos.filter(hasCoords));
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  if (geoPhotos.length === 0) return null;

  const shortMemo = memo.length > 50 ? `${memo.slice(0, 50)}...` : memo;

  const fitToPins = () => {
    mapRef.current?.fitToCoordinates(
      geoPhotos.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: false,
      },
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onMapReady={fitToPins}
        initialRegion={{
          latitude: geoPhotos[0].latitude,
          longitude: geoPhotos[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {geoPhotos.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            tracksViewChanges={false}
          >
            <Callout>
              <View style={styles.callout}>
                <Image source={{ uri: p.uri }} style={styles.calloutImage} />
                <Text style={styles.calloutTime}>{formatTakenAt(p.takenAt)}</Text>
                {shortMemo !== '' && (
                  <Text style={styles.calloutMemo}>{shortMemo}</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  callout: {
    width: 200,
    alignItems: 'center',
  },
  calloutImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.borderSoft,
    marginBottom: 6,
  },
  calloutTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  calloutMemo: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
