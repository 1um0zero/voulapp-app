import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { colors, radius } from '../lib/theme'

export default function BiometriaScreen() {
  const { desbloquear, sair } = useAuth()

  useEffect(() => {
    // tenta automaticamente ao abrir
    desbloquear()
  }, [])

  return (
    <View style={s.container}>
      <View style={s.logo}>
        <Text style={s.logoLetra}>v</Text>
      </View>
      <Text style={s.titulo}>voUdeZapp</Text>
      <Text style={s.sub}>Confirma a tua identidade para continuar</Text>

      <TouchableOpacity style={s.btn} onPress={desbloquear}>
        <Ionicons name="finger-print" size={32} color="#fff" />
        <Text style={s.btnTxt}>Usar impressão digital</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.btnSair} onPress={sair}>
        <Text style={s.btnSairTxt}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  logo:      { width: 72, height: 72, backgroundColor: colors.accent, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  logoLetra: { color: '#fff', fontSize: 32, fontWeight: '800' },
  titulo:    { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -1, marginBottom: 8 },
  sub:       { color: colors.textMed, fontSize: 15, textAlign: 'center', marginBottom: 48 },
  btn:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 18, paddingHorizontal: 32, shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 },
  btnTxt:    { color: '#fff', fontWeight: '700', fontSize: 17 },
  btnSair:   { marginTop: 24 },
  btnSairTxt:{ color: colors.textDim, fontSize: 14 },
})
