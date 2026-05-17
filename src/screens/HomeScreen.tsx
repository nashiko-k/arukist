import { Ionicons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealth } from '../hooks/useHealth';
import { deletePhoto } from '../storage/photos';
import { saveSession } from '../storage/sessions';
import { colors } from '../theme/colors';
import {
  PLACE_LABEL_ORDER,
  PLACE_LABEL_TEXT,
  type PlaceLabel,
} from '../types/place';
import type { WalkPhoto } from '../types/photo';
import type { WalkSession } from '../types/walk';
import { captureFromCamera, captureFromLibrary } from '../utils/photoCapture';

type Phase = 'idle' | 'walking' | 'finished';

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
  const [endSteps, setEndSteps] = useState(0);

  // Pedometer
  const [pedometerSteps, setPedometerSteps] = useState(0);
  const [pedometerAvailable, setPedometerAvailable] = useState(true);
  const pedometerSubRef = useRef<{ remove: () => void } | null>(null);

  // 散歩後の入力
  const [memo, setMemo] = useState('');
  const [placeLabel, setPlaceLabel] = useState<PlaceLabel | null>(null);
  const [photos, setPhotos] = useState<WalkPhoto[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    Pedometer.isAvailableAsync().then((available) => {
      if (!cancelled) setPedometerAvailable(available);
    });
    return () => { cancelled = true; };
  }, []);

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

  const handleStart = useCallback(async () => {
    try {
      const s = await getTodaySteps();
      setStartSteps(s);
      setPedometerSteps(0);
      const t = Date.now();
      setStartTime(t);
      setNow(t);

      if (pedometerAvailable) {
        const sub = Pedometer.watchStepCount((result) => {
          setPedometerSteps(result.steps);
        });
        pedometerSubRef.current = sub;
      }

      setPhase('walking');
    } catch (e) {
      Alert.alert('歩数の取得に失敗しました', e instanceof Error ? e.message : '');
    }
  }, [getTodaySteps, pedometerAvailable]);

  const handleEnd = useCallback(async () => {
    if (pedometerSubRef.current) {
      pedometerSubRef.current.remove();
      pedometerSubRef.current = null;
    }

    let finalSteps = startSteps;
    try {
      finalSteps = await getTodaySteps();
    } catch {
      // HealthKit 取得失敗時は startSteps のまま
    }
    setEndSteps(finalSteps);
    setEndTime(Date.now());
    setPhase('finished');
  }, [startSteps, getTodaySteps]);

  const handleCapture = useCallback(async () => {
    try {
      const photo = await captureFromCamera();
      if (photo) setPhotos((prev) => [...prev, photo]);
    } catch {
      // silently ignore
    }
  }, []);

  const resetSessionInputs = useCallback(() => {
    setMemo('');
    setPlaceLabel(null);
    setPhotos([]);
    setPedometerSteps(0);
  }, []);

  const displaySteps = pedometerAvailable
    ? pedometerSteps
    : Math.max(0, endSteps - startSteps);

  const handleSave = useCallback(async () => {
    const session: WalkSession = {
      id: makeSessionId(startTime),
      startTime,
      endTime,
      startSteps,
      endSteps,
      sessionSteps: pedometerAvailable ? pedometerSteps : undefined,
      memo,
      placeLabel,
      photoIds: photos.map((p) => p.id),
    };
    try {
      await saveSession(session);
    } catch (e) {
      Alert.alert('保存に失敗しました', e instanceof Error ? e.message : '');
      return;
    }
    resetSessionInputs();
    setPhase('idle');
  }, [startTime, endTime, startSteps, endSteps, pedometerSteps, pedometerAvailable, memo, placeLabel, photos, resetSessionInputs]);

  const handleDiscard = useCallback(() => {
    Alert.alert('今回の散歩を破棄しますか？', 'この操作は元に戻せません', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '破棄する',
        style: 'destructive',
        onPress: () => {
          resetSessionInputs();
          setPhase('idle');
        },
      },
    ]);
  }, [resetSessionInputs]);

  const handleAddPhoto = useCallback(() => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['カメラで撮影', 'カメラロールから選ぶ', 'キャンセル'],
        cancelButtonIndex: 2,
      },
      async (index) => {
        let photo: WalkPhoto | null = null;
        try {
          if (index === 0) photo = await captureFromCamera();
          else if (index === 1) photo = await captureFromLibrary();
        } catch {
          // silently ignore
        }
        if (photo) setPhotos((prev) => [...prev, photo]);
      },
    );
  }, []);

  const handleDeletePhoto = useCallback((photoId: string) => {
    Alert.alert('この写真を削除しますか？', '', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deletePhoto(photoId);
          setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        },
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
          sessionSteps={pedometerSteps}
          photoCount={photos.length}
          onCapture={handleCapture}
          onEnd={handleEnd}
        />
      )}
      {phase === 'finished' && (
        <PostWalkView
          durationMs={endTime - startTime}
          sessionSteps={displaySteps}
          memo={memo}
          placeLabel={placeLabel}
          photos={photos}
          onChangeMemo={setMemo}
          onChangePlaceLabel={setPlaceLabel}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
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
  photoCount: number;
  onCapture: () => void;
  onEnd: () => void;
};

function DuringWalkView({ elapsedMs, sessionSteps, photoCount, onCapture, onEnd }: DuringWalkProps) {
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

      <TouchableOpacity
        style={styles.cameraButton}
        onPress={onCapture}
        activeOpacity={0.7}
      >
        <Ionicons name="camera-outline" size={20} color={colors.text} />
        <Text style={styles.cameraButtonText}>
          写真を撮る{photoCount > 0 ? `（${photoCount}枚撮影済）` : ''}
        </Text>
      </TouchableOpacity>

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
  memo: string;
  placeLabel: PlaceLabel | null;
  photos: WalkPhoto[];
  onChangeMemo: (v: string) => void;
  onChangePlaceLabel: (v: PlaceLabel | null) => void;
  onAddPhoto: () => void;
  onDeletePhoto: (id: string) => void;
  onSave: () => void;
  onDiscard: () => void;
};

function PostWalkView({
  durationMs,
  sessionSteps,
  memo,
  placeLabel,
  photos,
  onChangeMemo,
  onChangePlaceLabel,
  onAddPhoto,
  onDeletePhoto,
  onSave,
  onDiscard,
}: PostWalkProps) {
  const calories = sessionSteps * 0.04;

  const togglePlace = (label: PlaceLabel) => {
    onChangePlaceLabel(placeLabel === label ? null : label);
  };

  return (
    <ScrollView
      style={styles.postScroll}
      contentContainerStyle={styles.postContent}
      keyboardShouldPersistTaps="handled"
    >
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>写真</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoRow}
        >
          {photos.map((p) => (
            <TouchableOpacity
              key={p.id}
              onLongPress={() => onDeletePhoto(p.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: p.uri }} style={styles.photoThumb} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.photoAddButton}
            onPress={onAddPhoto}
            activeOpacity={0.6}
          >
            <Ionicons name="add" size={28} color={colors.textLight} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>どんな場所を歩いた？</Text>
        <View style={styles.chipWrap}>
          {PLACE_LABEL_ORDER.map((label) => {
            const selected = placeLabel === label;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => togglePlace(label)}
                activeOpacity={0.7}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {PLACE_LABEL_TEXT[label]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>メモ</Text>
        <TextInput
          style={styles.memoInput}
          value={memo}
          onChangeText={onChangeMemo}
          placeholder="今日の散歩、どうでしたか？"
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />
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

      <TouchableOpacity onPress={onDiscard} activeOpacity={0.6} style={styles.discardWrap}>
        <Text style={styles.discardText}>破棄する</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 24,
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

  // Camera button (during walk)
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  cameraButtonText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
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
  postScroll: {
    flex: 1,
  },
  postContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
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
  discardWrap: {
    paddingVertical: 8,
  },
  discardText: {
    fontSize: 13,
    color: colors.textLight,
    textDecorationLine: 'underline',
  },

  // PostWalk - sections
  section: {
    width: '100%',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
  memoInput: {
    minHeight: 88,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },

  // Photos
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.borderSoft,
  },
  photoAddButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
