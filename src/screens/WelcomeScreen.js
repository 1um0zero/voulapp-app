import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { colors, radius } from '../lib/theme'

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <View style={s.center}>
        {/* Logótipo */}
        <View style={s.logoWrap}>
          <View style={s.logoOuter}>
            <View style={s.logoInner}>
              <Text style={s.logoMarca}>v</Text>
            </View>
          </View>
          <View style={s.logoRing1} pointerEvents="none" />
          <View style={s.logoRing2} pointerEvents="none" />
        </View>

        <Text style={s.nome}>voulapp</Text>
        <Text style={s.tagline}>Marca. Treina. Evolui.</Text>
      </View>

      <View style={s.bottom}>
        <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Login')}>
          <Text style={s.btnPrimaryTxt}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnSecondary} onPress={() => navigation.navigate('Registar')}>
          <Text style={s.btnSecondaryTxt}>Criar conta</Text>
        </TouchableOpacity>

        <Text style={s.legal}>Ao continuares, aceitas os nossos Termos e Política de Privacidade.</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 28 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap:     { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  logoOuter:    { width: 80, height: 80, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  logoInner:    { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoMarca:    { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  logoRing1:    { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: colors.accent + '30' },
  logoRing2:    { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: colors.accent + '15' },
  nome:         { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1.5, marginBottom: 8 },
  tagline:      { fontSize: 16, color: colors.textMed, letterSpacing: 0.5 },
  bottom:       { paddingBottom: 52, gap: 12 },
  btnPrimary:   { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 17, alignItems: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnPrimaryTxt:{ color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  btnSecondary: { borderWidth: 1, borderColor: colors.border2, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  btnSecondaryTxt: { color: colors.textMed, fontWeight: '600', fontSize: 15 },
  legal:        { color: colors.textDim, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 4 },
})
