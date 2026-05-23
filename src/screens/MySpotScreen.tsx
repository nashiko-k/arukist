import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getAllPhotos } from '../storage/photos';
import { colors } from '../theme/colors';
import type { SpotCluster, SpotLevel } from '../types/spot';
import { clusterPhotos } from '../utils/clustering';

export default function MySpotScreen() {
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [gpsPhotos, setGpsPhotos] = useState(0);
  const [clusters, setClusters] = useState<SpotCluster[]>([]);

  useEffect(() => {
    (async () => {
      const map = await getAllPhotos();
      const photos = Object.values(map);
      setTotalPhotos(photos.length);
      const withGps = photos.filter(
        (p) => p.latitude != null && p.longitude != null,
      );
      setGpsPhotos(withGps.length);
      setClusters(clusterPhotos(photos));
    })();
  }, []);

  const countByLevel = (lv: SpotLevel) =>
    clusters.filter((c) => c.level === lv).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>マイスポット</Text>
        <Text style={styles.description}>
          散歩で訪れた場所が、ここで木として育ちます
        </Text>

        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>デバッグ情報</Text>
          <Text style={styles.debugText}>
            合計写真: {totalPhotos} 枚（GPS あり: {gpsPhotos} 枚）
          </Text>
          <Text style={styles.debugText}>スポット数: {clusters.length}</Text>
          <Text style={styles.debugText} />
          {([1, 2, 3, 4, 5] as SpotLevel[]).map((lv) => (
            <Text key={lv} style={styles.debugText}>
              Lv{lv}: {countByLevel(lv)} 個
            </Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 32,
  },
  debugBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  debugText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
});
