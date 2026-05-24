import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type { WalkPhoto } from '../types/photo';

type Props = {
  visible: boolean;
  photos: WalkPhoto[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (photoId: string) => Promise<void>;
};

export const PhotoViewer = ({
  visible,
  photos,
  initialIndex,
  onClose,
  onDelete,
}: Props) => {
  const { width, height } = Dimensions.get('window');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // ビューアを開くたびに表示位置を初期インデックスへ同期
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  if (photos.length === 0) return null;

  const handleDeletePress = () => {
    const photo = photos[currentIndex];
    if (!photo || !onDelete) return;
    Alert.alert('写真を削除', 'この写真を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await onDelete(photo.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(idx);
          }}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ScrollView
              style={{ width }}
              maximumZoomScale={3}
              minimumZoomScale={1}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={{ uri: item.uri }}
                style={{ width, height: height * 0.85 }}
                resizeMode="contain"
              />
            </ScrollView>
          )}
        />
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePress}>
            <Ionicons name="trash-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
  },
  deleteBtn: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
  },
});
