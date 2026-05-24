import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import SessionDetailModal from '../components/SessionDetailModal';
import { PhotoCarousel } from '../components/PhotoCarousel';
import { getAllPhotos } from '../storage/photos';
import { getAllSessions } from '../storage/sessions';
import { colors } from '../theme/colors';
import type { WalkPhoto } from '../types/photo';
import type { WalkSession } from '../types/walk';
import {
  formatYearMonth,
  getMonthGrid,
  isSameDay,
  toDateKey,
} from '../utils/dates';
import {
  computeMonthSummary,
  getSessionsByDay,
} from '../utils/summary';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / 7);

export default function CalendarScreen() {
  const navigation = useNavigation();

  const [sessions, setSessions] = useState<WalkSession[]>([]);
  const [allPhotos, setAllPhotos] = useState<WalkPhoto[]>([]);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessionStepsTotal, setSessionStepsTotal] = useState<number>(0);

  const loadSessions = useCallback(async () => {
    const all = await getAllSessions();
    setSessions(all);
    const photoMap = await getAllPhotos();
    const sorted = Object.values(photoMap).sort((a, b) => a.takenAt - b.takenAt);
    setAllPhotos(sorted);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadSessions();
    });
    return unsub;
  }, [navigation, loadSessions]);

  // 散歩歩数（session.steps の単純合算）
  useEffect(() => {
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 1).getTime();
    const inMonth = sessions.filter((s) => s.startTime >= monthStart && s.startTime < monthEnd);
    setSessionStepsTotal(inMonth.reduce((sum, s) => sum + s.steps, 0));
  }, [sessions, year, month]);

  const sessionsByDay = getSessionsByDay(sessions);
  const grid = getMonthGrid(year, month);
  const summary = computeMonthSummary(sessions, year, month);
  const today = new Date();
  const todayKey = toDateKey(today);
  const todaySteps = sessions
    .filter((s) => toDateKey(new Date(s.startTime)) === todayKey)
    .reduce((sum, s) => sum + s.steps, 0);

  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleDayPress = (date: Date) => {
    const key = toDateKey(date);
    if (sessionsByDay.has(key)) {
      setSelectedDate(date);
    }
  };

  const selectedSessions = selectedDate
    ? [...(sessionsByDay.get(toDateKey(selectedDate)) ?? [])].sort(
        (a, b) => b.startTime - a.startTime,
      )
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Month header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={goPrev} hitSlop={12} activeOpacity={0.6}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatYearMonth(year, month)}</Text>
          <TouchableOpacity onPress={goNext} hitSlop={12} activeOpacity={0.6}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Weekday header */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d, i) => (
            <View key={d} style={styles.weekdayCell}>
              <Text
                style={[
                  styles.weekdayText,
                  i === 0 && styles.weekdaySunday,
                  i === 6 && styles.weekdaySaturday,
                ]}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {grid.map((cell, i) => {
            const key = toDateKey(cell.date);
            const hasSessions = sessionsByDay.has(key);
            const isToday = isSameDay(cell.date, today);
            const dayOfWeek = cell.date.getDay();
            const showWalkStyle = hasSessions && cell.isCurrentMonth;

            return (
              <TouchableOpacity
                key={i}
                style={styles.dayCell}
                onPress={() => handleDayPress(cell.date)}
                activeOpacity={hasSessions ? 0.6 : 1}
                disabled={!cell.isCurrentMonth}
              >
                <View
                  style={[
                    styles.dayCircle,
                    showWalkStyle && styles.walkDayCircle,
                    isToday && styles.todayCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !cell.isCurrentMonth && styles.dayTextOther,
                      showWalkStyle && styles.dayTextWalk,
                      isToday && styles.dayTextToday,
                      cell.isCurrentMonth && !showWalkStyle && dayOfWeek === 0 && styles.daySunday,
                      cell.isCurrentMonth && !showWalkStyle && dayOfWeek === 6 && styles.daySaturday,
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                </View>
                {showWalkStyle && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Month summary - 3 stats in one row */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>今日の歩数</Text>
            <Text style={styles.statValue}>{todaySteps.toLocaleString()}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>連続日数</Text>
            <Text style={styles.statValue}>{summary.currentStreak}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>月間歩数</Text>
            <Text style={styles.statValue}>
              {sessionStepsTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* All photos carousel */}
        <PhotoCarousel
          photos={allPhotos}
          showDate
          cardSize={140}
          initialScrollToEnd
        />
      </ScrollView>

      <SessionDetailModal
        visible={selectedDate !== null}
        date={selectedDate}
        sessions={selectedSessions}
        onClose={() => setSelectedDate(null)}
      />
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
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
    opacity: 0.6,
  },

  // Month header
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 1,
  },

  // Weekday row
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  weekdaySunday: {
    color: '#D4756A',
  },
  weekdaySaturday: {
    color: colors.coolDark,
  },

  // Calendar grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkDayCircle: {
    backgroundColor: colors.sageLighter,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 16,
    color: colors.text,
  },
  dayTextOther: {
    color: colors.textLight,
  },
  dayTextWalk: {
    fontWeight: '600',
    color: colors.sageDark,
  },
  dayTextToday: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  daySunday: {
    color: '#D4756A',
  },
  daySaturday: {
    color: colors.coolDark,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sage,
    marginTop: 2,
  },

  // Summary - 3 stats in one row
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    gap: 12,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
