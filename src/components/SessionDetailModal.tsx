import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSessionSteps } from '../hooks/useSessionSteps';
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

export default function SessionDetailModal({ visible, date, sessions, onClose }: Props) {
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
}: {
  session: WalkSession;
  index: number;
  total: number;
  photos: WalkPhoto[];
}) {
  const steps = useSessionSteps(session.startTime, session.endTime);
  const calories = steps != null ? steps * 0.04 : null;

  return (
    <View style={styles.sessionCard}>
      {total > 1 && (
        <Text style={styles.sessionIndex}>{index + 1}回目</Text>
      )}
      <DetailRow
        label="時間"
        value={`${formatTime(session.startTime)} 〜 ${formatTime(session.endTime)}`}
      />
      <DetailRow label="経過" value={formatDuration(session.endTime - session.startTime)} />
      <DetailRow
        label="歩数"
        value={steps != null ? `${steps.toLocaleString()} 歩` : '取得中…'}
      />
      <DetailRow
        label="カロリー"
        value={calories != null ? `${calories.toFixed(1)} kcal` : '---'}
      />
      {photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
          contentContainerStyle={styles.photoRow}
        >
          {photos.map((p) => (
            <Image key={p.id} source={{ uri: p.uri }} style={styles.photoThumb} />
          ))}
        </ScrollView>
      )}
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
    fontSize: 18,
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
  sessionIndex: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 16,
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
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  memo: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 12,
  },
  photoScroll: {
    marginTop: 12,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.borderSoft,
  },
});
