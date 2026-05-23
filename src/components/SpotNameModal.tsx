import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  initialValue: string;
  onCancel: () => void;
  onSave: (name: string) => void;
};

export const SpotNameModal = ({
  visible,
  initialValue,
  onCancel,
  onSave,
}: Props) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const canSave = value.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={styles.dialog}>
          <Text style={styles.title}>この場所に名前をつけよう</Text>
          <Text style={styles.subtitle}>愛着のある呼び名でOK</Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="例: お気に入りの公園"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            maxLength={30}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onCancel} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => canSave && onSave(value.trim())}
              style={[styles.btnSave, !canSave && styles.btnDisabled]}
              disabled={!canSave}
            >
              <Text style={styles.btnSaveText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    backgroundColor: colors.bg,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  btnSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnSaveText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
