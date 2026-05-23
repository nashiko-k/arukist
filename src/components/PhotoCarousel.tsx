import { useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';
import { PhotoViewer } from './PhotoViewer';
import type { WalkPhoto } from '../types/photo';

type Props = {
  photos: WalkPhoto[];
  showDate?: boolean;
  cardSize?: number;
  initialScrollToEnd?: boolean;
};

export const PhotoCarousel = ({
  photos,
  showDate = false,
  cardSize = 220,
  initialScrollToEnd = false,
}: Props) => {
  const [viewerPhoto, setViewerPhoto] = useState<WalkPhoto | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (initialScrollToEnd && photos.length > 0) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [initialScrollToEnd, photos.length]);

  if (photos.length === 0) return null;

  const formatLabel = (photo: WalkPhoto) => {
    const d = new Date(photo.takenAt);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    if (showDate) {
      return `${d.getMonth() + 1}/${d.getDate()} ${h}:${m}`;
    }
    return `${h}:${m}`;
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {photos.map((photo) => (
          <TouchableOpacity
            key={photo.id}
            style={{ width: cardSize }}
            onPress={() => setViewerPhoto(photo)}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: photo.uri }}
              style={{
                width: cardSize,
                height: cardSize,
                borderRadius: 12,
                backgroundColor: colors.bg,
              }}
              resizeMode="cover"
            />
            <Text style={styles.label}>{formatLabel(photo)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <PhotoViewer
        visible={!!viewerPhoto}
        photo={viewerPhoto}
        onClose={() => setViewerPhoto(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  label: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
  },
});
