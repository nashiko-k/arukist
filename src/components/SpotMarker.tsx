import { View } from 'react-native';
import type { SpotLevel } from '../types/spot';

export const SPOT_MARKER_SIZE = 50;

const SAGE = '#8FAD7E';
const SAGE_LIGHT = '#A6C094';
const TRUNK = '#8B6F47';
const PEACH = '#F5B595';
const PINK = '#EDB0B8';
const SPARKLE = '#DC8C68';

type Props = { level: SpotLevel };

export const SpotMarker = ({ level }: Props) => {
  return (
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
};

function renderTree(level: SpotLevel) {
  switch (level) {
    case 1:
      return <SeedTree />;
    case 2:
      return <SproutTree />;
    case 3:
      return <SmallTree />;
    case 4:
      return <LargeTree />;
    case 5:
      return <BloomTree />;
  }
}

// L1: 芽 — 葉っぱ1枚と短い茎
function SeedTree() {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 7,
          height: 10,
          backgroundColor: SAGE_LIGHT,
          borderRadius: 4,
          marginBottom: 1,
        }}
      />
      <View
        style={{
          width: 1.5,
          height: 4,
          backgroundColor: SAGE_LIGHT,
        }}
      />
    </View>
  );
}

// L2: 若葉 — 茎 + 葉5枚（上1+上下左右2ペア）
function SproutTree() {
  return (
    <View style={{ alignItems: 'center', width: 24, height: 28 }}>
      {/* 茎（中央背面） */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: 1.5,
          height: 22,
          backgroundColor: SAGE,
        }}
      />
      {/* 一番上の葉 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          width: 7,
          height: 10,
          borderRadius: 5,
          backgroundColor: SAGE,
        }}
      />
      {/* 上ペア（左） */}
      <View
        style={{
          position: 'absolute',
          left: 3,
          top: 6,
          width: 8,
          height: 6,
          borderRadius: 3,
          backgroundColor: SAGE,
          transform: [{ rotate: '-25deg' }],
        }}
      />
      {/* 上ペア（右） */}
      <View
        style={{
          position: 'absolute',
          right: 3,
          top: 6,
          width: 8,
          height: 6,
          borderRadius: 3,
          backgroundColor: SAGE,
          transform: [{ rotate: '25deg' }],
        }}
      />
      {/* 下ペア（左） */}
      <View
        style={{
          position: 'absolute',
          left: 1,
          top: 13,
          width: 9,
          height: 6,
          borderRadius: 3,
          backgroundColor: SAGE,
          transform: [{ rotate: '-40deg' }],
        }}
      />
      {/* 下ペア（右） */}
      <View
        style={{
          position: 'absolute',
          right: 1,
          top: 13,
          width: 9,
          height: 6,
          borderRadius: 3,
          backgroundColor: SAGE,
          transform: [{ rotate: '40deg' }],
        }}
      />
    </View>
  );
}

// L3: 若木 — 茶色の幹 + 雲型樹冠（円4つ）
function SmallTree() {
  return (
    <View style={{ alignItems: 'center' }}>
      {/* 樹冠 */}
      <View style={{ width: 24, height: 18, position: 'relative' }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 4,
            width: 13,
            height: 13,
            borderRadius: 6.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 5,
            top: 0,
            width: 13,
            height: 13,
            borderRadius: 6.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 11,
            top: 4,
            width: 13,
            height: 13,
            borderRadius: 6.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 6,
            top: 7,
            width: 12,
            height: 11,
            borderRadius: 6,
            backgroundColor: SAGE,
          }}
        />
      </View>
      {/* 幹 */}
      <View
        style={{
          width: 4,
          height: 9,
          backgroundColor: TRUNK,
          marginTop: -1,
        }}
      />
    </View>
  );
}

// L4: 大木 — より大きな幹 + 樹冠
function LargeTree() {
  return (
    <View style={{ alignItems: 'center' }}>
      {/* 樹冠 */}
      <View style={{ width: 32, height: 24, position: 'relative' }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 6,
            width: 17,
            height: 17,
            borderRadius: 8.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 7,
            top: 0,
            width: 17,
            height: 17,
            borderRadius: 8.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 15,
            top: 6,
            width: 17,
            height: 17,
            borderRadius: 8.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            width: 16,
            height: 15,
            borderRadius: 8,
            backgroundColor: SAGE,
          }}
        />
      </View>
      {/* 幹 */}
      <View
        style={{
          width: 5,
          height: 12,
          backgroundColor: TRUNK,
          marginTop: -2,
        }}
      />
    </View>
  );
}

// L5: 満開 — L4 + 花4つ + スパークル
function BloomTree() {
  return (
    <View style={{ alignItems: 'center', position: 'relative' }}>
      {/* 樹冠 */}
      <View style={{ width: 32, height: 24, position: 'relative' }}>
        {/* sage の雲 */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 6,
            width: 17,
            height: 17,
            borderRadius: 8.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 7,
            top: 0,
            width: 17,
            height: 17,
            borderRadius: 8.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 15,
            top: 6,
            width: 17,
            height: 17,
            borderRadius: 8.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            width: 16,
            height: 15,
            borderRadius: 8,
            backgroundColor: SAGE,
          }}
        />
        {/* 花 */}
        <View
          style={{
            position: 'absolute',
            left: 5,
            top: 9,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: PEACH,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 13,
            top: 3,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: PINK,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 21,
            top: 10,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: PEACH,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 14,
            top: 14,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: PINK,
          }}
        />
      </View>
      {/* 幹 */}
      <View
        style={{
          width: 5,
          height: 12,
          backgroundColor: TRUNK,
          marginTop: -2,
        }}
      />
      {/* スパークル（右上に小さい点） */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 2,
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: SPARKLE,
        }}
      />
    </View>
  );
}
