import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealth } from '../hooks/useHealth';
import { saveSession } from '../storage/sessions';
import { colors } from '../theme/colors';
import type { WalkSession } from '../types/walk';

type Phase = 'idle' | 'walking' | 'finished';

const STEP_POLL_MS = 5000;
const HOLD_DURATION_MS = 1000;

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

function makeSessionId(startTime: number): string {
  return new Date(startTime).toISOString().split('.')[0].replace(/:/g, '-');
}

export default function HomeScreen() {
  const { requestPermissions, getTodaySteps } = useHealth();

  const [phase, setPhase] = useState<Phase>('idle');
  const [permissionReady, setPermissionReady] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [todaySteps, setTodaySteps] = useState<number | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [startSteps, setStartSteps] = useState(0);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [endSteps, setEndSteps] = useState(0);

  // 経過時間の表示更新用
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await requestPermissions();
        if (!cancelled) setPermissionReady(true);
      } catch (e) {
        if (!cancelled) {
          setPermissionError(e instanceof Error ? e.message : '権限の取得に失敗しました');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestPermissions]);

  // 'idle' に入る・戻るたびに今日の歩数を取得
  const refreshTodaySteps = useCallback(async () => {
    if (!permissionReady) return;
    setTodayLoading(true);
    try {
      const v = await getTodaySteps();
      setTodaySteps(v);
    } catch {
      setTodaySteps(null);
    } finally {
      setTodayLoading(false);
    }
  }, [permissionReady, getTodaySteps]);

  useEffect(() => {
    if (phase === 'idle') {
      refreshTodaySteps();
    }
  }, [phase, refreshTodaySteps]);

  // 'walking' の間、1秒ごとに now を更新
  useEffect(() => {
    if (phase !== 'walking') return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // 'walking' の間、5秒ごとに歩数をポーリング
  useEffect(() => {
    if (phase !== 'walking') return;
    let cancelled = false;
    const poll = async () => {
      try {
        const v = await getTodaySteps();
        if (!cancelled) setCurrentSteps(v);
      } catch {
        // 取得失敗時はそのまま据え置く
      }
    };
    poll();
    const id = setInterval(poll, STEP_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, getTodaySteps]);

  const handleStart = useCallback(async () => {
    try {
      const s = await getTodaySteps();
      setStartSteps(s);
      setCurrentSteps(s);
      const t = Date.now();
      setStartTime(t);
      setNow(t);
      setPhase('walking');
    } catch (e) {
      Alert.alert('歩数の取得に失敗しました', e instanceof Error ? e.message : '');
    }
  }, [getTodaySteps]);

  const handleEnd = useCallback(async () => {
    let finalSteps = currentSteps;
    try {
      finalSteps = await getTodaySteps();
    } catch {
      // 失敗時はポーリング済みの最終値を使う
    }
    setEndSteps(finalSteps);
    setEndTime(Date.now());
    setPhase('finished');
  }, [currentSteps, getTodaySteps]);

  const handleSave = useCallback(async () => {
    const session: WalkSession = {
      id: makeSessionId(startTime),
      startTime,
      endTime,
      startSteps,
      endSteps,
    };
    try {
      await saveSession(session);
    } catch (e) {
      Alert.alert('保存に失敗しました', e instanceof Error ? e.message : '');
      return;
    }
    setPhase('idle');
  }, [startTime, endTime, startSteps, endSteps]);

  const handleDiscard = useCallback(() => {
    Alert.alert('今回の散歩を破棄しますか？', 'この操作は元に戻せません', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '破棄する',
        style: 'destructive',
        onPress: () => setPhase('idle'),
      },
    ]);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {phase === 'idle' && (
        <PreWalkView
          todaySteps={todaySteps}
          loading={todayLoading}
          error={permissionError}
          permissionReady={permissionReady}
          onStart={handleStart}
        />
      )}
      {phase === 'walking' && (
        <DuringWalkView
          elapsedMs={now - startTime}
          sessionSteps={Math.max(0, currentSteps - startSteps)}
          onEnd={handleEnd}
        />
      )}
      {phase === 'finished' && (
        <PostWalkView
          durationMs={endTime - startTime}
          sessionSteps={Math.max(0, endSteps - startSteps)}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      )}
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// PreWalkView
// -----------------------------------------------------------------------------
type PreWalkProps = {
  todaySteps: number | null;
  loading: boolean;
  error: string | null;
  permissionReady: boolean;
  onStart: () => void;
};

function PreWalkView({ todaySteps, loading, error, permissionReady, onStart }: PreWalkProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>アルキスト</Text>
      <View style={styles.card}>
        <Text style={styles.label}>今日の歩数</Text>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.todayValue}>
            {(todaySteps ?? 0).toLocaleString()}
            <Text style={styles.todayUnit}> 歩</Text>
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.startButton, !permissionReady && styles.startButtonDisabled]}
        onPress={onStart}
        disabled={!permissionReady}
        activeOpacity={0.85}
      >
        <Ionicons name="walk" size={22} color={colors.surface} style={styles.startIcon} />
        <Text style={styles.startButtonText}>散歩を始める</Text>
      </TouchableOpacity>
    </View>
  );
}

// -----------------------------------------------------------------------------
// DuringWalkView
// -----------------------------------------------------------------------------
type DuringWalkProps = {
  elapsedMs: number;
  sessionSteps: number;
  onEnd: () => void;
};

function DuringWalkView({ elapsedMs, sessionSteps, onEnd }: DuringWalkProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearHold = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    holdStartRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearHold();
  }, [clearHold]);

  const handlePressIn = useCallback(() => {
    holdStartRef.current = Date.now();
    setHoldProgress(0);
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (holdStartRef.current ?? Date.now());
      const p = Math.min(1, elapsed / HOLD_DURATION_MS);
      setHoldProgress(p);
      if (p >= 1) {
        clearHold();
        setHoldProgress(0);
        onEnd();
      }
    }, 50);
  }, [clearHold, onEnd]);

  const handlePressOut = useCallback(() => {
    clearHold();
    setHoldProgress(0);
  }, [clearHold]);

  return (
    <View style={styles.container}>
      <Text style={styles.statusLabel}>散歩中</Text>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>経過時間</Text>
          <Text style={styles.statCardValue}>{formatDuration(elapsedMs)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>歩数</Text>
          <Text style={styles.statCardValue}>{sessionSteps.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.endButtonWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.endButton, holdProgress > 0 && styles.endButtonPressed]}
        >
          <View style={[styles.endButtonProgress, { width: `${holdProgress * 100}%` }]} />
          <View style={styles.endButtonContent}>
            <Ionicons name="stop" size={18} color={colors.surface} style={styles.endIcon} />
            <Text style={styles.endButtonText}>
              {holdProgress > 0 ? '長押しで終了…' : '散歩を終わる（長押し）'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// PostWalkView
// -----------------------------------------------------------------------------
type PostWalkProps = {
  durationMs: number;
  sessionSteps: number;
  onSave: () => void;
  onDiscard: () => void;
};

function PostWalkView({ durationMs, sessionSteps, onSave, onDiscard }: PostWalkProps) {
  const calories = sessionSteps * 0.04;

  return (
    <View style={styles.container}>
      <View style={styles.celebrationBlock}>
        <Ionicons name="sparkles" size={28} color={colors.primaryDark} />
        <Text style={styles.celebrationTitle}>散歩おつかれさまでした</Text>
        <Text style={styles.celebrationSub}>記録しますか？</Text>
      </View>

      <View style={styles.summaryCard}>
        <SummaryRow label="経過時間" value={formatDuration(durationMs)} />
        <View style={styles.summaryDivider} />
        <SummaryRow label="歩数" value={`${sessionSteps.toLocaleString()} 歩`} />
        <View style={styles.summaryDivider} />
        <SummaryRow label="消費カロリー（概算）" value={`${calories.toFixed(1)} kcal`} />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={onSave} activeOpacity={0.85}>
        <Ionicons
          name="checkmark-circle"
          size={22}
          color={colors.surface}
          style={styles.startIcon}
        />
        <Text style={styles.saveButtonText}>記録する</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDiscard} activeOpacity={0.6}>
        <Text style={styles.discardText}>破棄する</Text>
      </TouchableOpacity>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

// -----------------------------------------------------------------------------
// styles
// -----------------------------------------------------------------------------
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

  // Common
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
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  todayValue: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  todayUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // PreWalk start button
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 48,
    minWidth: 240,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startIcon: {
    marginRight: 8,
  },
  startButtonText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // DuringWalk
  statusLabel: {
    position: 'absolute',
    top: 24,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 48,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  statCardLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
    letterSpacing: 1,
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  endButtonWrapper: {
    width: '100%',
  },
  endButton: {
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.coolDark,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  endButtonPressed: {
    backgroundColor: colors.coolDark,
  },
  endButtonProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primaryDark,
  },
  endButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endIcon: {
    marginRight: 8,
  },
  endButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // PostWalk
  celebrationBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    letterSpacing: 1,
  },
  celebrationSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderSoft,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sage,
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 240,
    marginBottom: 20,
    shadowColor: colors.sageDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 1,
  },
  discardText: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'underline',
  },
});
