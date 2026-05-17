import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
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
            {sessions.map((s, i) => {
              const steps = Math.max(0, s.endSteps - s.startSteps);
              const calories = steps * 0.04;
              return (
                <View key={s.id} style={styles.sessionCard}>
                  {sessions.length > 1 && (
                    <Text style={styles.sessionIndex}>{i + 1}回目</Text>
                  )}
                  <DetailRow
                    label="時間"
                    value={`${formatTime(s.startTime)} 〜 ${formatTime(s.endTime)}`}
                  />
                  <DetailRow label="経過" value={formatDuration(s.endTime - s.startTime)} />
                  <DetailRow label="歩数" value={`${steps.toLocaleString()} 歩`} />
                  <DetailRow label="カロリー" value={`${calories.toFixed(1)} kcal`} />
                  {s.placeLabel && (
                    <View style={styles.placeRow}>
                      <View style={styles.placeChip}>
                        <Text style={styles.placeChipText}>
                          {PLACE_LABEL_TEXT[s.placeLabel]}
                        </Text>
                      </View>
                    </View>
                  )}
                  {s.memo !== '' && <Text style={styles.memo}>{s.memo}</Text>}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
});
