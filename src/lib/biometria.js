import * as LocalAuthentication from 'expo-local-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CHAVE = 'biometria_activa'

export async function biometriaDisponivel() {
  const compativel = await LocalAuthentication.hasHardwareAsync()
  const registado  = await LocalAuthentication.isEnrolledAsync()
  return compativel && registado
}

export async function biometriaActiva() {
  const val = await AsyncStorage.getItem(CHAVE)
  return val === 'true'
}

export async function activarBiometria() {
  await AsyncStorage.setItem(CHAVE, 'true')
}

export async function desactivarBiometria() {
  await AsyncStorage.removeItem(CHAVE)
}

export async function autenticarComBiometria() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage:   'Aceder ao voulapp',
    fallbackLabel:   'Usar senha',
    cancelLabel:     'Cancelar',
    disableDeviceFallback: false,
  })
  return result.success
}
