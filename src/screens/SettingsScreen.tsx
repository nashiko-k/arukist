import { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import appConfig from '../../app.json';
import { colors } from '../theme/colors';
import { resetAllData } from '../storage/reset';

const CONTACT_URL = 'https://nashiko-contact.vercel.app';

export default function SettingsScreen() {
  const [deleting, setDeleting] = useState(false);

  const handleContact = () => {
    Linking.openURL(CONTACT_URL).catch(() => {
      Alert.alert('エラー', 'お問い合わせページを開けませんでした');
    });
  };

  const handleTerms = () => {
    Linking.openURL('https://nashiko-k.github.io/arukist/terms.html').catch(() => {
      Alert.alert('エラー', '利用規約ページを開けませんでした');
    });
  };

  const handlePrivacy = () => {
    Linking.openURL('https://nashiko-k.github.io/arukist/privacy-policy.html').catch(() => {
      Alert.alert('エラー', 'プライバシーポリシーページを開けませんでした');
    });
  };

  const handleResetData = () => {
    Alert.alert(
      'データを全て削除',
      'すべての散歩記録・写真・スポット情報を削除します。この操作は取り消せません。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await resetAllData();
              Alert.alert('完了', 'すべてのデータを削除しました');
            } catch {
              Alert.alert('エラー', '削除中にエラーが発生しました');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const version = (appConfig as { expo: { version: string } }).expo.version;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>設定</Text>

        <Section title="アプリについて">
          <Row label="バージョン" value={version} />
        </Section>

        <Section title="お問い合わせ">
          <Row label="お問い合わせフォーム" onPress={handleContact} chevron />
        </Section>

        <Section title="規約">
          <Row label="利用規約" onPress={handleTerms} chevron />
          <Divider />
          <Row label="プライバシーポリシー" onPress={handlePrivacy} chevron />
        </Section>

        <Section title="データ">
          <Row
            label={deleting ? '削除中…' : 'データを全て削除'}
            onPress={deleting ? undefined : handleResetData}
            destructive
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  chevron,
  destructive,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
}) {
  const content = (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, destructive && styles.destructive]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {chevron && (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        )}
      </View>
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
      {content}
    </TouchableOpacity>
  ) : (
    content
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  rowLabel: { fontSize: 16, color: colors.text, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 16, color: colors.textMuted },
  destructive: { color: '#D9534F' },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
    marginLeft: 18,
  },
});
