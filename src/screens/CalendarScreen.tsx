import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import SessionDetailModal from '../components/SessionDetailModal';
import { getAllSessions } from '../storage/sessions';
import { colors } from '../theme/colors';
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
  type MonthSummary,
} from '../utils/summary';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / 7);

export default function CalendarScreen() {
  const navigation = useNavigation();

  const [sessions, setSessions] = useState<WalkSession[]>([]);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadSessions = useCallback(async () => {
    const all = await getAllSessions();
    setSessions(all);
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

  const sessionsByDay = getSessionsByDay(sessions);
  const grid = getMonthGrid(year, month);
  const summary = computeMonthSummary(sessions, year, month);
  const today = new Date();

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
    ? sessionsByDay.get(toDateKey(selectedDate)) ?? []
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
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

            return (
              <TouchableOpacity
                key={i}
                style={styles.dayCell}
                onPress={() => handleDayPress(cell.date)}
                activeOpacity={hasSessions ? 0.6 : 1}
                disabled={!cell.isCurrentMonth}
              >
                <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                  <Text
                    style={[
                      styles.dayText,
                      !cell.isCurrentMonth && styles.dayTextOther,
                      isToday && styles.dayTextToday,
                      cell.isCurrentMonth && dayOfWeek === 0 && styles.daySunday,
                      cell.isCurrentMonth && dayOfWeek === 6 && styles.daySaturday,
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                </View>
                {hasSessions && cell.isCurrentMonth && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Month summary */}
        <View style={styles.summaryRow}>
          <SummaryCard label="散歩日数" value={`${summary.walkDays}`} unit="日" />
          <SummaryCard
            label="累計歩数"
            value={summary.totalSteps.toLocaleString()}
            unit="歩"
          />
          <SummaryCard label="連続日数" value={`${summary.currentStreak}`} unit="日" />
        </View>
      </View>

      <SessionDetailModal
        visible={selectedDate !== null}
        date={selectedDate}
        sessions={selectedSessions}
        onClose={() => setSelectedDate(null)}
      />
    </SafeAreaView>
  );
}

function SummaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>
        {value}
        <Text style={styles.summaryUnit}> {unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Month header
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  monthTitle: {
    fontSize: 18,
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
    fontSize: 12,
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
  todayCircle: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
  },
  dayTextOther: {
    color: colors.textLight,
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

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
