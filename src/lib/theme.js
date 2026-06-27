export const colors = {
  // Fundos — areia e creme quente
  bg:        '#faf8f4',
  bgMid:     '#f3ede4',
  card:      '#fffdf8',
  cardAlt:   '#f7f0e6',
  border:    '#e8dfd0',
  border2:   '#d5c9b5',

  // Texto
  text:      '#2c2218',
  textMed:   '#7a6a58',
  textDim:   '#b0a090',

  // Acento — caramelo/areia dourada
  accent:    '#c4a882',
  accent2:   '#a88860',
  accentDim: '#f0e8da',
  accentGlow:'rgba(196,168,130,0.25)',

  // Secundário — terracota pastel
  hot:       '#d4948a',
  hotDim:    '#f5e4e0',
  hotGlow:   'rgba(212,148,138,0.22)',

  // Estados
  green:     '#8cbda0',
  greenDim:  '#e4f0eb',
  red:       '#d48888',
  redDim:    '#f5e4e4',
  amber:     '#d4aa70',
  amberDim:  '#f8ecd8',
}

export const gradients = {
  bg:      ['#faf8f4', '#f3ede4', '#ede4d4'],
  card:    ['rgba(255,253,248,1)', 'rgba(247,240,230,0.95)'],
  accent:  ['#d8c0a0', '#c4a882', '#a88860'],
  hot:     ['#d4948a', '#b87870'],
  hero:    ['#f0e8da', '#f3ede4'],
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
