// Tema Solstício — quente, dourado, solar
export const colors = {
  bg:        '#0d0800',
  bgMid:     '#160e00',
  card:      '#1f1400',
  cardAlt:   '#271a00',
  border:    '#2e1e00',
  border2:   '#3d2800',

  text:      '#fff8ee',
  textMed:   '#c4956a',
  textDim:   '#6b4e2a',

  // Dourado solar
  accent:    '#f59e0b',
  accent2:   '#d97706',
  accentDim: '#2a1800',
  accentGlow:'rgba(245,158,11,0.25)',

  // Coral quente
  hot:       '#f97316',
  hotDim:    '#2a1000',
  hotGlow:   'rgba(249,115,22,0.2)',

  // Estados
  green:     '#4ade80',
  greenDim:  '#052e16',
  red:       '#f87171',
  redDim:    '#2a0a0a',
  amber:     '#fbbf24',
  amberDim:  '#2a1a00',
}

export const gradients = {
  bg:      ['#0d0800', '#160e00', '#1a1000'],
  card:    ['rgba(42,24,0,0.8)', 'rgba(31,20,0,0.9)'],
  accent:  ['#f59e0b', '#d97706', '#b45309'],
  hot:     ['#f97316', '#ea580c'],
  hero:    ['#2a1800', '#160e00'],
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
