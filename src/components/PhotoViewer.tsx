import { Ionicons } from '@expo/vector-icons';
import {
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
};

export const PhotoViewer = ({
  visible,
  photos,
  initialIndex,
  onClose,
}: Props) => {
  if (photos.length === 0) return null;
  const { width, height } = Dimensions.get('window');

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
});
