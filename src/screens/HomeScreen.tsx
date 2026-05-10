import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealth } from '../hooks/useHealth';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  const { requestPermissions, getTodaySteps } = useHealth();
  const [steps, setSteps] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await requestPermissions();
        const today = await getTodaySteps();
        if (!cancelled) setSteps(today);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '取得できませんでした');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestPermissions, getTodaySteps]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>アルキスト</Text>
        <View style={styles.card}>
          <Text style={styles.label}>今日の歩数</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.value}>
              {(steps ?? 0).toLocaleString()}
              <Text style={styles.unit}> 歩</Text>
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 36,
    alignItems: 'center',
    minWidth: 260,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  value: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  unit: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textMuted,
  },
  error: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
