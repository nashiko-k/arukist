import { Ionicons } from '@expo/vector-icons';
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
import { Pedometer } from 'expo-sensors';
import ConditionCard from '../components/ConditionCard';
import SessionMap from '../components/SessionMap';
import { WalkStartModal } from '../components/WalkStartModal';
import { useCondition } from '../hooks/useCondition';
import { useHealth } from '../hooks/useHealth';
import { deletePhoto } from '../storage/photos';
import { saveSession } from '../storage/sessions';
import { getItem, setItem } from '../storage/storage';
import { colors } from '../theme/colors';
import { buildGreeting } from '../utils/greeting';
import type { Weather } from '../utils/weather';
import {
  PLACE_LABEL_ORDER,
  PLACE_LABEL_TEXT,
  type PlaceLabel,
} from '../types/place';
import type { WalkPhoto } from '../types/photo';
import type { WalkSession } from '../types/walk';
import { captureFromCamera, captureFromLibrary } from '../utils/photoCapture';

type Phase = 'idle' | 'walking' | 'finished';

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
  const condition = useCondition();

  const [phase, setPhase] = useState<Phase>('idle');
  const [permissionReady, setPermissionReady] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [todaySteps, setTodaySteps] = useState<number | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  // fallback 用に HealthKit baseline を一応保持（通常は CMPedometer を使用）
  const [startStepsBaseline, setStartStepsBaseline] = useState(0);

  // CMPedometer ベースの歩数管理
  const [walkSteps, setWalkSteps] = useState(0);
  const [confirmedSteps, setConfirmedSteps] = useState<number | null>(null);
  const [walkStartedAt, setWalkStartedAt] = useState<Date | null>(null);
  const pedometerSubscription = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);

  const [sessionWeather, setSessionWeather] = useState<Weather | undefined>(undefined);

  const [memo, setMemo] = useState('');
  const [placeLabel, setPlaceLabel] = useState<PlaceLabel | null>(null);
  const [photos, setPhotos] = useState<WalkPhoto[]>([]);

  const [now, setNow] = useState(Date.now());

  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  // あいさつは「当日初回」だけ表示する
  useEffect(() => {
    (async () => {
      const d = new Date();
      const today = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const lastShown = await getItem<string>('last_greeting_date');
      if (lastShown !== today) {
        setShowGreeting(true);
        await setItem('last_greeting_date', today);
      }
    })();
  }, []);

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

  // 1秒タイマー（経過時間の表示用）
  useEffect(() => {
    if (phase !== 'walking') return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const handleStart = useCallback(async () => {
    // 散歩から戻ったときに勝手に再表示されないよう、あいさつを閉じる
    setShowGreeting(false);

    // fallback 用に HealthKit baseline を一応取得（通常は使わない）
    let baseline = 0;
    try {
      baseline = await getTodaySteps();
    } catch {
      // HealthKit 取得失敗でも散歩は始められる
    }
    setStartStepsBaseline(baseline);

    // CMPedometer のライブ計測を開始
    const startedAt = new Date();
    setWalkStartedAt(startedAt);
    setWalkSteps(0);
    setConfirmedSteps(null);
    try {
      await Pedometer.requestPermissionsAsync();
    } catch {
      // 権限取得失敗でも止めない（watchStepCount が発火しないだけ）
    }
    try {
      pedometerSubscription.current = Pedometer.watchStepCount(({ steps }) => {
        setWalkSteps(steps);
      });
    } catch {
      pedometerSubscription.current = null;
    }

    setSessionWeather(condition.weather ?? undefined);
    const t = startedAt.getTime();
    setStartTime(t);
    setNow(t);
    setPhase('walking');
  }, [getTodaySteps, condition.weather]);

  const handleEnd = useCallback(async () => {
    const ended = new Date();
    setEndTime(ended.getTime());

    // ライブ計測を停止
    if (pedometerSubscription.current) {
      pedometerSubscription.current.remove();
      pedometerSubscription.current = null;
    }

    setPhase('finished');

    // 散歩区間の確定歩数を取得（ライブ表示と同じ walkStartedAt 参照）
    if (walkStartedAt) {
      try {
        const result = await Pedometer.getStepCountAsync(walkStartedAt, ended);
        setConfirmedSteps(result.steps);
      } catch {
        setConfirmedSteps(walkSteps);
      }
    } else {
      setConfirmedSteps(walkSteps);
    }
  }, [walkStartedAt, walkSteps]);

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
    setStartStepsBaseline(0);
    setWalkSteps(0);
    setConfirmedSteps(null);
    setWalkStartedAt(null);
    setSessionWeather(undefined);
  }, []);

  const handleSave = useCallback(async () => {
    // ライブ表示と同ソース（CMPedometer）の確定値を保存。
    const sessionSteps = confirmedSteps ?? walkSteps ?? 0;
    const session: WalkSession = {
      id: makeSessionId(startTime),
      startTime,
      endTime,
      steps: sessionSteps,
      memo,
      placeLabel,
      photoIds: photos.map((p) => p.id),
      weather: sessionWeather,
    };
    try {
      await saveSession(session);
    } catch (e) {
      Alert.alert('保存に失敗しました', e instanceof Error ? e.message : '');
      return;
    }
    resetSessionInputs();
    setPhase('idle');
  }, [startTime, endTime, confirmedSteps, walkSteps, memo, placeLabel, photos, sessionWeather, resetSessionInputs]);

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
          weather={condition.weather}
          weatherLoading={condition.loading}
          weatherError={condition.error}
          showGreeting={showGreeting}
          onStart={() => setShowStartConfirm(true)}
        />
      )}
      {phase === 'walking' && (
        <DuringWalkView
          elapsedMs={now - startTime}
          walkSteps={walkSteps}
          photoCount={photos.length}
          onCapture={handleCapture}
          onEnd={handleEnd}
        />
      )}
      {phase === 'finished' && (
        <PostWalkView
          startTime={startTime}
          endTime={endTime}
          walkSteps={confirmedSteps ?? walkSteps}
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

      <WalkStartModal
        visible={showStartConfirm}
        onStart={() => {
          setShowStartConfirm(false);
          handleStart();
        }}
        onCancel={() => setShowStartConfirm(false)}
      />
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
  weather: Weather | null;
  weatherLoading: boolean;
  weatherError: string | null;
  showGreeting: boolean;
  onStart: () => void;
};

function PreWalkView({
  todaySteps,
  loading,
  error,
  permissionReady,
  weather,
  weatherLoading,
  weatherError,
  showGreeting,
  onStart,
}: PreWalkProps) {
  const { headline, comment } = buildGreeting(new Date(), weather);

  return (
    <ScrollView
      style={styles.preScroll}
      contentContainerStyle={styles.preContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titleSmall}>アルキスト</Text>

      <View style={styles.greetingBlock}>
        {showGreeting && (
          <Text style={styles.greetingHeadline}>{headline}</Text>
        )}
        <Text style={styles.greetingComment}>{comment}</Text>
      </View>

      <ConditionCard weather={weather} loading={weatherLoading} error={weatherError} />

      <View style={styles.stepsRow}>
        <Text style={styles.stepsLabel}>今日の歩数</Text>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.stepsValue}>
            {(todaySteps ?? 0).toLocaleString()}
            <Text style={styles.stepsUnit}> 歩</Text>
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
    </ScrollView>
  );
}

// -----------------------------------------------------------------------------
// DuringWalkView
// -----------------------------------------------------------------------------
type DuringWalkProps = {
  elapsedMs: number;
  walkSteps: number;
  photoCount: number;
  onCapture: () => void;
  onEnd: () => void;
};

function DuringWalkView({ elapsedMs, walkSteps, photoCount, onCapture, onEnd }: DuringWalkProps) {
  const handleEndPress = useCallback(() => {
    Alert.alert('散歩を終える', '散歩を終了しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '終わる', style: 'destructive', onPress: () => onEnd() },
    ]);
  }, [onEnd]);

  return (
    <View style={styles.duringContainer}>
      {/* 散歩中インジケーター */}
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveLabel}>散歩中</Text>
      </View>

      {/* 時間・歩数（中央・大きく） */}
      <View style={styles.metricsBlock}>
        <View style={styles.metric}>
          <Text style={styles.metricTimeValue}>{formatDuration(elapsedMs)}</Text>
          <Text style={styles.metricCaption}>経過時間</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricStepsValue}>{walkSteps.toLocaleString()}</Text>
          <Text style={styles.metricUnit}>歩</Text>
          <Text style={styles.metricNote}>※少し遅れて反映されます</Text>
        </View>
      </View>

      {/* ボタン群（下部） */}
      <View style={styles.actionBlock}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={onCapture}
          activeOpacity={0.85}
        >
          <Ionicons
            name="camera-outline"
            size={22}
            color={colors.surface}
            style={styles.captureIcon}
          />
          <Text style={styles.captureButtonText}>
            写真を撮る{photoCount > 0 ? `（${photoCount}枚）` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endTapButton}
          onPress={handleEndPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="stop"
            size={18}
            color={colors.textMuted}
            style={styles.endIcon}
          />
          <Text style={styles.endTapButtonText}>散歩を終える</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// PostWalkView
// -----------------------------------------------------------------------------
type PostWalkProps = {
  startTime: number;
  endTime: number;
  walkSteps: number;
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
  startTime,
  endTime,
  walkSteps,
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
  const durationMs = endTime - startTime;
  const calories = walkSteps * 0.04;

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
        <SummaryRow
          label="歩数"
          value={`${walkSteps.toLocaleString()} 歩`}
        />
        <View style={styles.summaryDivider} />
        <SummaryRow
          label="消費カロリー（概算）"
          value={`${calories.toFixed(1)} kcal`}
        />
      </View>

      <Text style={styles.stepsHint}>※ 数値が安定するまで少し待ってから記録してください</Text>

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
        <SessionMap photoIds={photos.map((p) => p.id)} memo={memo} />
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
  // PreWalk
  preScroll: {
    flex: 1,
  },
  preContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  titleSmall: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 20,
  },
  greetingBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingHeadline: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  greetingComment: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  stepsRow: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 28,
  },
  stepsLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  stepsValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  stepsUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 16,
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
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // DuringWalk
  duringContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.sage,
  },
  liveLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 2,
  },
  metricsBlock: {
    alignItems: 'center',
    gap: 36,
  },
  metric: {
    alignItems: 'center',
  },
  metricTimeValue: {
    fontSize: 60,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  metricStepsValue: {
    fontSize: 52,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  metricCaption: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
  metricUnit: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 4,
  },
  metricNote: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 6,
  },
  actionBlock: {
    width: '100%',
    gap: 14,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 28,
  },
  captureIcon: {
    marginRight: 8,
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.surface,
  },
  endTapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  endIcon: {
    marginRight: 8,
  },
  endTapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
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
    fontSize: 15,
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
    fontSize: 16,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 20,
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
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: 1,
  },
  discardWrap: {
    paddingVertical: 8,
  },
  discardText: {
    fontSize: 15,
    color: colors.textLight,
    textDecorationLine: 'underline',
  },
  stepsHint: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },

  // PostWalk - sections
  section: {
    width: '100%',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
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
    fontSize: 15,
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
    fontSize: 17,
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
