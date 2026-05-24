import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SessionMap from './SessionMap';
import { PhotoCarousel } from './PhotoCarousel';
import { getPhotosByIds } from '../storage/photos';
import { colors } from '../theme/colors';
import type { WalkPhoto } from '../types/photo';
import { PLACE_LABEL_TEXT } from '../types/place';
import type { WalkSession } from '../types/walk';
import { formatDate } from '../utils/dates';

type Props = {
  visible: boolean;
  date: Date | null;
  sessions: WalkSession[];
  onClose: () => void;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onDeletePhoto?: (photoId: string) => Promise<void>;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) return `${hours}時間${minutes}分`;
  return `${minutes}分`;
}

export default function SessionDetailModal({
  visible,
  date,
  sessions,
  onClose,
  onDeleteSession,
  onDeletePhoto,
}: Props) {
  const [photoMap, setPhotoMap] = useState<Record<string, WalkPhoto[]>>({});

  useEffect(() => {
    if (!visible || sessions.length === 0) {
      setPhotoMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      const map: Record<string, WalkPhoto[]> = {};
      for (const s of sessions) {
        if (s.photoIds.length > 0) {
          map[s.id] = await getPhotosByIds(s.photoIds);
        }
      }
      if (!cancelled) setPhotoMap(map);
    })();
    return () => { cancelled = true; };
  }, [visible, sessions]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{date ? formatDate(date) : ''}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} activeOpacity={0.6}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {sessions.map((s, i) => (
              <SessionCard
                key={s.id}
                session={s}
                index={i}
                total={sessions.length}
                photos={photoMap[s.id] ?? []}
                onDeleteSession={onDeleteSession}
                onDeletePhoto={onDeletePhoto}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SessionCard({
  session,
  index,
  total,
  photos,
  onDeleteSession,
  onDeletePhoto,
}: {
  session: WalkSession;
  index: number;
  total: number;
  photos: WalkPhoto[];
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onDeletePhoto?: (photoId: string) => Promise<void>;
}) {
  const steps = session.steps;
  const calories = steps * 0.04;

  const handleDeleteSessionPress = (sessionId: string) => {
    Alert.alert(
      '散歩記録を削除',
      'この散歩の記録と写真を削除します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await onDeleteSession?.(sessionId);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.sessionCard}>
      <View style={styles.cardHeader}>
        {total > 1 ? (
          <Text style={styles.sessionIndex}>{total - index}回目</Text>
        ) : (
          <View />
        )}
        {onDeleteSession && (
          <TouchableOpacity
            onPress={() => handleDeleteSessionPress(session.id)}
            hitSlop={10}
            activeOpacity={0.6}
          >
            <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <DetailRow
        label="時間"
        value={`${formatTime(session.startTime)} 〜 ${formatTime(session.endTime)}`}
      />
      <DetailRow label="経過" value={formatDuration(session.endTime - session.startTime)} />
      <DetailRow
        label="歩数"
        value={`${steps.toLocaleString()} 歩`}
      />
      <DetailRow
        label="カロリー"
        value={`${calories.toFixed(1)} kcal`}
      />
      <SessionMap photoIds={session.photoIds} memo={session.memo} />
      <PhotoCarousel photos={photos} onDeletePhoto={onDeletePhoto} />
      {session.placeLabel && (
        <View style={styles.placeRow}>
          <View style={styles.placeChip}>
            <Text style={styles.placeChipText}>
              {PLACE_LABEL_TEXT[session.placeLabel]}
            </Text>
          </View>
        </View>
      )}
      {session.memo !== '' && <Text style={styles.memo}>{session.memo}</Text>}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '40%',
    maxHeight: '75%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
  },
  bodyContent: {
    padding: 24,
    paddingBottom: 16,
    gap: 16,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
    marginBottom: 8,
  },
  sessionIndex: {
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  placeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  placeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.primaryLighter,
  },
  placeChipText: {
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  memo: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 12,
  },
});
