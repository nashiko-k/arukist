import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { Weather, WeatherCategory } from '../utils/weather';

type Props = {
  weather: Weather | null;
  loading: boolean;
  error: string | null;
};

const CATEGORY_LABEL: Record<WeatherCategory, string> = {
  sunny: '晴れ',
  cloudy: '曇り',
  rainy: '雨',
  snowy: '雪',
  stormy: '雷雨',
};

const CATEGORY_ICON: Record<WeatherCategory, keyof typeof Ionicons.glyphMap> = {
  sunny: 'sunny',
  cloudy: 'cloudy',
  rainy: 'rainy',
  snowy: 'snow',
  stormy: 'thunderstorm',
};

const CATEGORY_COLOR: Record<WeatherCategory, string> = {
  sunny: '#E8A838',
  cloudy: '#9EA5B0',
  rainy: '#6B9EC0',
  snowy: '#A8C8D8',
  stormy: '#7A6FB0',
};

const DANGER_COLOR = '#D9534F';

function uvLabel(uv: number): string {
  if (uv < 3) return '弱';
  if (uv < 6) return '中';
  if (uv < 8) return '強';
  return '非常に強';
}

export default function ConditionCard({ weather, loading, error }: Props) {
  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <Text style={styles.loadingText}>コンディション取得中…</Text>
      </View>
    );
  }

  if (!weather) {
    if (!error) return null;
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Ionicons
            name={CATEGORY_ICON[weather.category]}
            size={20}
            color={CATEGORY_COLOR[weather.category]}
          />
          <Text style={styles.cellValue}>{CATEGORY_LABEL[weather.category]}</Text>
        </View>
        <View style={styles.cell}>
          <Ionicons name="thermometer-outline" size={20} color={colors.textMuted} />
          <Text
            style={[
              styles.cellValue,
              Math.round(weather.temperature) >= 35 && { color: DANGER_COLOR },
            ]}
          >
            {Math.round(weather.temperature)}°C
          </Text>
        </View>
        <View style={styles.cell}>
          <Ionicons name="sunny-outline" size={20} color={colors.textMuted} />
          <Text
            style={[
              styles.cellValue,
              Math.round(weather.uvIndex) >= 5 && { color: DANGER_COLOR },
            ]}
          >
            UV {Math.round(weather.uvIndex)}（{uvLabel(weather.uvIndex)}）
          </Text>
        </View>
        {weather.rainProbability > 0 && (
          <View style={styles.cell}>
            <Ionicons name="water-outline" size={20} color={colors.textMuted} />
            <Text style={styles.cellValue}>雨 {weather.rainProbability}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  cellValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
