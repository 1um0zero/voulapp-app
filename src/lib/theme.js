export const colors = {
  // Fundos — gradiente profundo
  bg:        '#07080f',
  bgMid:     '#0d0f1a',
  card:      '#12141f',
  cardAlt:   '#181a28',
  border:    '#1e2135',
  border2:   '#2a2d45',

  // Texto
  text:      '#f4f4ff',
  textMed:   '#9294b8',
  textDim:   '#4a4d6e',

  // Acento principal — violeta vivo
  accent:    '#7c6ff7',
  accent2:   '#5b4fe0',
  accentDim: '#1c1a3a',
  accentGlow:'rgba(124,111,247,0.25)',

  // Secundário — magenta quente
  hot:       '#e040a0',
  hotDim:    '#2a0a1f',
  hotGlow:   'rgba(224,64,160,0.2)',

  // Estados
  green:     '#3dd68c',
  greenDim:  '#0a2018',
  red:       '#f05d5d',
  redDim:    '#2a0a0a',
  amber:     '#f5a623',
  amberDim:  '#2a1a00',
}

// Gradientes
export const gradients = {
  bg:      ['#07080f', '#0d0f1a', '#130d1f'],
  card:    ['rgba(28,26,58,0.8)', 'rgba(18,20,31,0.9)'],
  accent:  ['#7c6ff7', '#5b4fe0', '#3a2fb8'],
  hot:     ['#e040a0', '#9b28c0'],
  hero:    ['#1c1a3a', '#0d0f1a'],
}

export const radius = { sm: 12, md: 16, lg: 20, xl: 26 }

export const text = {
  h1:    { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  h2:    { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  h3:    { fontSize: 16, fontWeight: '600', color: colors.text },
  body:  { fontSize: 14, color: colors.textMed, lineHeight: 20 },
  sm:    { fontSize: 12, color: colors.textDim },
  label: { fontSize: 11, fontWeight: '700', color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1.2 },
  mono:  { fontSize: 15, fontWeight: '700', color: colors.accent, fontVariant: ['tabular-nums'] },
}
