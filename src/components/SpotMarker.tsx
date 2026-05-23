import { View } from 'react-native';
import type { SpotLevel } from '../types/spot';

export const SPOT_MARKER_SIZE = 50;

const COLORS: Record<SpotLevel, string> = {
  1: '#A0C090',
  2: '#8FAD7E',
  3: '#7AA068',
  4: '#6A8B5B',
  5: '#5A7E4F',
};

type Props = { level: SpotLevel };

export const SpotMarker = ({ level }: Props) => {
  const size = 14 + level * 6;
  return (
    <View
      style={{
        width: SPOT_MARKER_SIZE,
        height: SPOT_MARKER_SIZE,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: COLORS[level],
          borderRadius: size / 2,
        }}
      />
    </View>
  );
};
