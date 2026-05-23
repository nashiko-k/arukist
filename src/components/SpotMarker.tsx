import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import type { SpotLevel } from '../types/spot';

const SAGE = '#8FAD7E';
const SAGE_DARK = '#6A8B5B';
const TRUNK = '#8B6F47';
const PINK = '#EDB0B8';
const PEACH = '#F5B595';
const PEACH_DARK = '#DC8C68';

export const SPOT_MARKER_SIZE = 50;

type Props = { level: SpotLevel };

export const SpotMarker = ({ level }: Props) => (
  <View
    style={{
      width: SPOT_MARKER_SIZE,
      height: SPOT_MARKER_SIZE,
      justifyContent: 'flex-end',
      alignItems: 'center',
    }}
  >
    {renderTree(level)}
  </View>
);

function renderTree(level: SpotLevel) {
  switch (level) {
    case 1:
      return (
        <Svg width={18} height={14} viewBox="0 0 18 14">
          <Path d="M 9 14 L 9 6" stroke={SAGE_DARK} strokeWidth={1.5} strokeLinecap="round" />
          <Ellipse cx={5} cy={8} rx={3.5} ry={2.5} fill={SAGE} transform="rotate(-30 5 8)" />
          <Ellipse cx={13} cy={8} rx={3.5} ry={2.5} fill={SAGE} transform="rotate(30 13 8)" />
        </Svg>
      );
    case 2:
      return (
        <Svg width={22} height={30} viewBox="0 0 22 30">
          <Path d="M 11 30 L 11 4" stroke={SAGE_DARK} strokeWidth={1.5} strokeLinecap="round" />
          <Ellipse cx={5} cy={22} rx={5} ry={3.5} fill={SAGE} transform="rotate(15 5 22)" />
          <Ellipse cx={17} cy={22} rx={5} ry={3.5} fill={SAGE} transform="rotate(-15 17 22)" />
          <Ellipse cx={6} cy={12} rx={5} ry={3.5} fill={SAGE} transform="rotate(10 6 12)" />
          <Ellipse cx={16} cy={12} rx={5} ry={3.5} fill={SAGE} transform="rotate(-10 16 12)" />
          <Ellipse cx={11} cy={4} rx={5} ry={4} fill={SAGE} />
        </Svg>
      );
    case 3:
      return (
        <Svg width={28} height={34} viewBox="0 0 28 34">
          <Rect x={11} y={14} width={6} height={20} rx={2} fill={TRUNK} />
          <Circle cx={9} cy={9} r={9} fill={SAGE} />
          <Circle cx={19} cy={7} r={10} fill={SAGE} />
          <Circle cx={14} cy={15} r={8} fill={SAGE} />
        </Svg>
      );
    case 4:
      return (
        <Svg width={38} height={46} viewBox="0 0 38 46">
          <Rect x={15} y={20} width={8} height={26} rx={2} fill={TRUNK} />
          <Circle cx={9} cy={20} r={10} fill={SAGE} />
          <Circle cx={22} cy={12} r={12} fill={SAGE} />
          <Circle cx={29} cy={20} r={9.5} fill={SAGE} />
          <Circle cx={18} cy={26} r={10} fill={SAGE} />
        </Svg>
      );
    case 5:
      return (
        <Svg width={42} height={50} viewBox="0 0 42 50">
          <Rect x={17} y={24} width={8} height={26} rx={2} fill={TRUNK} />
          <Circle cx={11} cy={24} r={10} fill={SAGE} />
          <Circle cx={24} cy={16} r={12} fill={SAGE} />
          <Circle cx={31} cy={24} r={9.5} fill={SAGE} />
          <Circle cx={20} cy={30} r={10} fill={SAGE} />
          <Circle cx={9} cy={20} r={1.8} fill={PINK} />
          <Circle cx={23} cy={12} r={1.8} fill={PEACH} />
          <Circle cx={29} cy={23} r={1.8} fill={PINK} />
          <Circle cx={18} cy={26} r={1.8} fill={PEACH} />
          <Circle cx={26} cy={29} r={1.8} fill={PINK} />
          <Circle cx={13} cy={28} r={1.8} fill={PEACH} />
          <Path d="M 36 5 L 37 8 L 39 9 L 37 10 L 36 13 L 35 10 L 33 9 L 35 8 Z" fill={PEACH_DARK} />
        </Svg>
      );
  }
}
