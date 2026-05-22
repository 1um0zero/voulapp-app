import * as Speech from 'expo-speech'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CHAVE_VOZ = 'voz_ativa'

export async function vozEstaAtiva() {
  const val = await AsyncStorage.getItem(CHAVE_VOZ)
  return val === null || val === 'true' // activa por defeito
}

export async function setVozAtiva(valor) {
  await AsyncStorage.setItem(CHAVE_VOZ, String(valor))
}

const OPCOES = {
  language: 'pt-BR',
  pitch: 1.0,
  rate: 1.05,
}

function limparParaVoz(t) {
  return t
    .replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[✅❌⚡💳📅📌🕐💰🎉🎂🎈👋🏆🏃💪📱🆕⏳🎊🎙️📊]/g, '')
    .replace(/\*/g, '').replace(/_/g, '').replace(/#/g, '')
    .replace(/\s+/g, ' ').trim()
}

export async function falar(texto, opcoes = {}) {
  const ativa = await vozEstaAtiva()
  if (!ativa) return
  const aFalar = await Speech.isSpeakingAsync()
  if (aFalar) Speech.stop()
  Speech.speak(limparParaVoz(texto), { ...OPCOES, ...opcoes })
}

export function pararVoz() {
  Speech.stop()
}

export function saudacao(nome) {
  const hora = new Date().getHours()
  const periodo = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const primeiroNome = nome?.split(' ')[0] || ''
  return `${periodo}${primeiroNome ? `, ${primeiroNome}` : ''}!`
}

export function mensagemMotivacional(marcacoesRecentes) {
  const total = marcacoesRecentes?.length || 0
  const hoje = new Date().toISOString().split('T')[0]
  const temHoje = marcacoesRecentes?.some(m => m.data === hoje)

  if (temHoje) return 'Tens uma aula hoje. Vamos a isso!'
  if (total === 0) return 'Pronto para começar? Marca a tua próxima aula!'

  const msgs = [
    'Ótimo dia para se exercitar!',
    'Continua assim, estás a ir bem!',
    'Cada treino conta. Vamos lá!',
    'O teu corpo agradece cada sessão.',
    'Mais um dia, mais um treino. Força!',
  ]
  return msgs[Math.floor(Math.random() * msgs.length)]
}
