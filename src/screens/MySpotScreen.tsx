import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SpotMarker } from '../components/SpotMarker';
import { getAllPhotos } from '../storage/photos';
import { colors } from '../theme/colors';
import type { SpotCluster } from '../types/spot';
import { clusterPhotos } from '../utils/clustering';

const MIN_DELTA = 0.005;

export default function MySpotScreen() {
  const [clusters, setClusters] = useState<SpotCluster[]>([]);
  const [loaded, setLoaded] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    (async () => {
      const map = await getAllPhotos();
      setClusters(clusterPhotos(Object.values(map)));
      setLoaded(true);
    })();
  }, []);

  const fitToSpots = () => {
    if (clusters.length === 0) return;

    const lats = clusters.map((c) => c.anchorPhoto.latitude!);
    const lngs = clusters.map((c) => c.anchorPhoto.longitude!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max((maxLat - minLat) * 1.5, MIN_DELTA);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, MIN_DELTA);

    mapRef.current?.animateToRegion(
      {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      },
      0,
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>マイスポット</Text>
        <Text style={styles.subtitle}>
          散歩で訪れた場所が、ここで木として育ちます
        </Text>
      </View>

      {loaded && clusters.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>まだスポットがありません</Text>
          <Text style={styles.emptyBody}>
            散歩中に写真を撮ると、ここに木が育ち始めます🌱
          </Text>
        </View>
      ) : clusters.length > 0 ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            onMapReady={fitToSpots}
            initialRegion={{
              latitude: clusters[0].anchorPhoto.latitude!,
              longitude: clusters[0].anchorPhoto.longitude!,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {clusters.map((cluster) => (
              <Marker
                key={cluster.id}
                coordinate={{
                  latitude: cluster.anchorPhoto.latitude!,
                  longitude: cluster.anchorPhoto.longitude!,
                }}
                anchor={{ x: 0.5, y: 1.0 }}
                tracksViewChanges={false}
              >
                <SpotMarker level={cluster.level} />
              </Marker>
            ))}
          </MapView>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  map: { flex: 1 },
});
