import type { CoarseLocation } from './location';

export type WeatherCategory = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';

export type Weather = {
  category: WeatherCategory;
  weatherCode: number;
  temperature: number;
  uvIndex: number;
  rainProbability: number;
};

function codeToCategory(code: number): WeatherCategory {
  if (code <= 1) return 'sunny';
  if (code <= 3 || code === 45 || code === 48) return 'cloudy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snowy';
  if (code >= 95 && code <= 99) return 'stormy';
  return 'cloudy';
}

export async function fetchWeather(loc: CoarseLocation): Promise<Weather | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${loc.latitude}&longitude=${loc.longitude}` +
      `&current=temperature_2m,weather_code,uv_index` +
      `&daily=precipitation_probability_max` +
      `&timezone=auto&forecast_days=1`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const current = json?.current;
    const daily = json?.daily;
    if (!current) return null;

    return {
      category: codeToCategory(current.weather_code ?? 0),
      weatherCode: current.weather_code ?? 0,
      temperature: current.temperature_2m ?? 0,
      uvIndex: current.uv_index ?? 0,
      rainProbability: daily?.precipitation_probability_max?.[0] ?? 0,
    };
  } catch {
    return null;
  }
}
