import { useCallback, useEffect, useState } from 'react';
import { getCoarseLocation, type CoarseLocation } from '../utils/location';
import { fetchWeather, type Weather } from '../utils/weather';

export type Condition = {
  location: CoarseLocation | null;
  weather: Weather | null;
  loading: boolean;
  error: string | null;
};

export function useCondition(): Condition & {
  refresh: () => Promise<void>;
  refreshIfStale: (maxAgeMs?: number) => void;
} {
  const [location, setLocation] = useState<CoarseLocation | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCoarseLocation();
      setLocation(loc);
      if (loc) {
        const w = await fetchWeather(loc);
        setWeather(w);
        if (!w) setError('天気を取得できませんでした');
      } else {
        setWeather(null);
        setError('位置情報を取得できませんでした');
      }
    } catch {
      setError('コンディションの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // 天気が未取得、または fetchedAt が maxAgeMs より古ければ再取得する
  const refreshIfStale = useCallback(
    (maxAgeMs: number = 60 * 60 * 1000) => {
      if (!weather || Date.now() - weather.fetchedAt >= maxAgeMs) {
        refresh();
      }
    },
    [weather, refresh],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { location, weather, loading, error, refresh, refreshIfStale };
}
