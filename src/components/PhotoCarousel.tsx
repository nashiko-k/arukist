import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { WalkPhoto } from '../types/photo';

type Props = {
  photos: WalkPhoto[];
};

const CARD_SIZE = 220;

export const PhotoCarousel = ({ photos }: Props) => {
  if (photos.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {photos.map((photo) => {
        const time = new Date(photo.takenAt);
        const h = time.getHours().toString().padStart(2, '0');
        const m = time.getMinutes().toString().padStart(2, '0');
        return (
          <View key={photo.id} style={styles.card}>
            <Image
              source={{ uri: photo.uri }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.time}>{`${h}:${m}`}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    width: CARD_SIZE,
  },
  image: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 12,
    backgroundColor: colors.bg,
  },
  time: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
  },
});
