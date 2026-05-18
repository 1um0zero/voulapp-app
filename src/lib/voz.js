import * as Speech from 'expo-speech'

const OPCOES = {
  language: 'pt-BR',
  pitch: 1.0,
  rate: 1.05,
}

export function falar(texto, opcoes = {}) {
  Speech.stop()
  Speech.speak(texto, { ...OPCOES, ...opcoes })
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
