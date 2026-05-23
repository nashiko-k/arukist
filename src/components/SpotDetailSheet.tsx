import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import type { SpotCluster, SpotLevel } from '../types/spot';

const LEVEL_INFO: Record<
  SpotLevel,
  {
    name: string;
    nextName: string | null;
    threshold: number;
    nextThreshold: number | null;
  }
> = {
  1: { name: '芽', nextName: '若葉', threshold: 1, nextThreshold: 3 },
  2: { name: '若葉', nextName: '若木', threshold: 3, nextThreshold: 10 },
  3: { name: '若木', nextName: '大木', threshold: 10, nextThreshold: 30 },
  4: { name: '大木', nextName: '満開', threshold: 30, nextThreshold: 60 },
  5: { name: '満開', nextName: null, threshold: 60, nextThreshold: null },
};

type Props = {
  visible: boolean;
  cluster: SpotCluster | null;
  name: string | null;
  onClose: () => void;
  onRename: () => void;
};

export const SpotDetailSheet = ({
  visible,
  cluster,
  name,
  onClose,
  onRename,
}: Props) => {
  if (!cluster) return null;

  const info = LEVEL_INFO[cluster.level];
  const visitDays = cluster.visitDays;
  const isMaxed = cluster.level === 5;
  const isNameable = cluster.level >= 4;
  const hasName = !!name;
  const daysToNext = info.nextThreshold
    ? Math.max(0, info.nextThreshold - visitDays)
    : 0;
  const progress = info.nextThreshold
    ? Math.min(
        1,
        Math.max(
          0,
          (visitDays - info.threshold) / (info.nextThreshold - info.threshold),
        ),
      )
    : 1;
  const firstVisit = new Date(cluster.photos[0].takenAt);
  const firstVisitText = `${firstVisit.getFullYear()}年${
    firstVisit.getMonth() + 1
  }月${firstVisit.getDate()}日`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.sheet}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {hasName ? name : `Lv ${cluster.level} · ${info.name}`}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {hasName && (
            <Text style={styles.subline}>
              Lv {cluster.level} · {info.name}
              {isMaxed ? ` · 訪問日数 ${visitDays}日` : ''}
            </Text>
          )}

          {(!isMaxed || !hasName) && (
            <Text style={styles.days}>訪問日数: {visitDays} 日</Text>
          )}

          {isMaxed ? (
            <Text style={styles.maxedMsg}>完全に育ちました ✨</Text>
          ) : (
            <>
              <Text style={styles.nextHint}>
                あと {daysToNext} 日通うと{info.nextName}に
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
            </>
          )}

          <Text style={styles.firstVisit}>初回訪問: {firstVisitText}</Text>

          {isNameable && (
            <TouchableOpacity style={styles.nameBtn} onPress={onRename}>
              <Text style={styles.nameBtnText}>
                {hasName ? '名前を変える' : '名前をつける'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  subline: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  days: {
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  nextHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.sage,
  },
  maxedMsg: {
    fontSize: 17,
    color: colors.sageDark,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  firstVisit: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  nameBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  nameBtnText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
});
