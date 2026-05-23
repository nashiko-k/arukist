import { View } from 'react-native';
import type { SpotLevel } from '../types/spot';

export const SPOT_MARKER_SIZE = 50;

const SAGE = '#7AA068';
const SAGE_LIGHT = '#8FAD7E';
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

// L1: 双葉 — 茎の上に左右に開いた2枚の葉(🌱)
function SeedTree() {
  return (
    <View style={{ width: 26, height: 22 }}>
      {/* 茎 */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 12,
          width: 2,
          height: 12,
          backgroundColor: SAGE_LIGHT,
        }}
      />
      {/* 左の双葉 */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 2,
          width: 14,
          height: 9,
          borderRadius: 6,
          backgroundColor: SAGE_LIGHT,
          transform: [{ rotate: '-35deg' }],
        }}
      />
      {/* 右の双葉 */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 2,
          width: 14,
          height: 9,
          borderRadius: 6,
          backgroundColor: SAGE_LIGHT,
          transform: [{ rotate: '35deg' }],
        }}
      />
    </View>
  );
}

// L2: 若葉 — 茎 + 葉5枚
function SproutTree() {
  return (
    <View style={{ width: 32, height: 34 }}>
      {/* 茎 */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 15,
          width: 2,
          height: 28,
          backgroundColor: SAGE,
        }}
      />
      {/* 一番上の葉 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 12,
          width: 8,
          height: 13,
          borderRadius: 6,
          backgroundColor: SAGE,
        }}
      />
      {/* 上ペア（左） */}
      <View
        style={{
          position: 'absolute',
          left: 2,
          top: 9,
          width: 11,
          height: 8,
          borderRadius: 5,
          backgroundColor: SAGE,
          transform: [{ rotate: '-30deg' }],
        }}
      />
      {/* 上ペア（右） */}
      <View
        style={{
          position: 'absolute',
          right: 2,
          top: 9,
          width: 11,
          height: 8,
          borderRadius: 5,
          backgroundColor: SAGE,
          transform: [{ rotate: '30deg' }],
        }}
      />
      {/* 下ペア（左） */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 18,
          width: 12,
          height: 8,
          borderRadius: 5,
          backgroundColor: SAGE,
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* 下ペア（右） */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 18,
          width: 12,
          height: 8,
          borderRadius: 5,
          backgroundColor: SAGE,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

// L3: 若木 — 茶色の幹 + 雲型樹冠
function SmallTree() {
  return (
    <View style={{ alignItems: 'center' }}>
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
            top: 9,
            width: 16,
            height: 14,
            borderRadius: 7,
            backgroundColor: SAGE,
          }}
        />
      </View>
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

// L4: 大木
function LargeTree() {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 40, height: 30, position: 'relative' }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 8,
            width: 21,
            height: 21,
            borderRadius: 10.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 10,
            top: 0,
            width: 21,
            height: 21,
            borderRadius: 10.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 19,
            top: 8,
            width: 21,
            height: 21,
            borderRadius: 10.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 11,
            top: 11,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: SAGE,
          }}
        />
      </View>
      <View
        style={{
          width: 6,
          height: 15,
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
      <View style={{ width: 40, height: 30, position: 'relative' }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 8,
            width: 21,
            height: 21,
            borderRadius: 10.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 10,
            top: 0,
            width: 21,
            height: 21,
            borderRadius: 10.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 19,
            top: 8,
            width: 21,
            height: 21,
            borderRadius: 10.5,
            backgroundColor: SAGE,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 11,
            top: 11,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: SAGE,
          }}
        />
        {/* 花 */}
        <View
          style={{
            position: 'absolute',
            left: 6,
            top: 12,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: PEACH,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 17,
            top: 4,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: PINK,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 27,
            top: 13,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: PEACH,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 18,
            top: 18,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: PINK,
          }}
        />
      </View>
      <View
        style={{
          width: 6,
          height: 15,
          backgroundColor: TRUNK,
          marginTop: -2,
        }}
      />
      {/* スパークル */}
      <View
        style={{
          position: 'absolute',
          right: 2,
          top: 2,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: SPARKLE,
        }}
      />
    </View>
  );
}
