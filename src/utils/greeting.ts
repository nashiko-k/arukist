import type { Weather } from './weather';

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export function getTimeOfDay(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

const HEADLINES: Record<TimeOfDay, string> = {
  morning: 'おはようございます',
  day: 'こんにちは',
  evening: 'こんばんは',
  night: '夜更かしですね',
};

function weatherComment(weather: Weather): string {
  const t = weather.temperature;
  switch (weather.category) {
    case 'sunny':
      if (t >= 26) return '日差しが強めです。水分補給を忘れずに';
      if (t >= 15) return '気持ちのいい陽気ですね';
      if (t >= 5) return 'さっぱりした空気ですね';
      return '肌寒いので暖かくしてくださいね';
    case 'cloudy':
      if (t >= 26) return '曇り空でも蒸し暑いかも。無理せずに';
      if (t >= 15) return 'ちょっと曇り空ですが、散歩日和ですよ';
      return '雲が多めですが、歩くにはちょうどいいかも';
    case 'rainy':
      return '雨ですね。無理せずおうちで一休みもいいかも';
    case 'snowy':
      return '雪です。足元にお気をつけて';
    case 'stormy':
      return '天気が荒れています。今日はお家でゆっくり';
  }
}

export function buildGreeting(
  date: Date,
  weather: Weather | null,
): { headline: string; comment: string } {
  const tod = getTimeOfDay(date);
  const headline = HEADLINES[tod];
  const comment = weather ? weatherComment(weather) : '散歩、いってきますか？';
  return { headline, comment };
}
