export const colors = {
  // 背景・サーフェス
  bg: '#FAF6EE',
  surface: '#FFFFFF',

  // プライマリ（ピーチ・朝陽）
  primary: '#F5B595',
  primaryLight: '#FBD9C4',
  primaryLighter: '#FDEDE0',
  primaryDark: '#DC8C68',

  // クール（ペリウィンクル・夕暮れ）
  cool: '#B8B8DC',
  coolLight: '#DBDBEC',
  coolLighter: '#EBEBF5',
  coolDark: '#8E8EBC',

  // ピンク（中間色）
  pink: '#EDB0B8',
  pinkLight: '#F8D5DC',

  // セージ（記録ドット用）
  sage: '#8FAD7E',
  sageLight: '#C8DBBC',
  sageLighter: '#E5EEDE',
  sageDark: '#6A8B5B',

  // テキスト
  text: '#3D3530',
  textMuted: '#7A6F65',
  textLight: '#B0A89C',

  // ボーダー
  border: '#E8DCC8',
  borderSoft: '#F2EAD8',
};

// グラデーション（LinearGradient 用の色配列）
export const gradients = {
  hero: ['#F5B595', '#EDB0B8', '#B8B8DC'] as const,
  heroSoft: ['#FBD9C4', '#F8D5DC', '#DBDBEC'] as const,
};
