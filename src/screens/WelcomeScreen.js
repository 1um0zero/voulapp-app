import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { colors, radius, text } from '../lib/theme'

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Logo area */}
      <View style={s.top}>
        <View style={s.logo}>
          <Text style={s.logoLetter}>v</Text>
        </View>
        <Text style={s.appName}>voulapp</Text>
        <Text style={s.tagline}>A forma mais simples de gerir{'\n'}as tuas aulas e marcações.</Text>
      </View>

      {/* Avatar illustration */}
      <View style={s.avatarArea}>
        <View style={s.avatarOuter}>
          <View style={s.avatarInner}>
            <Text style={s.avatarEmoji}>🏃</Text>
          </View>
        </View>
        <View style={s.dot1} /><View style={s.dot2} /><View style={s.dot3} />
      </View>

      {/* Acções */}
      <View style={s.bottom}>
        <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Login')}>
          <Text style={s.btnPrimaryTxt}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={() => navigation.navigate('Registar')}>
          <Text style={s.btnSecondaryTxt}>Criar conta</Text>
        </TouchableOpacity>
        <Text style={s.legalTxt}>Ao continuares, aceitas os nossos{'\n'}Termos de Serviço e Política de Privacidade.</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 28 },
  top:          { alignItems: 'center', paddingTop: 80 },
  logo:         { width: 60, height: 60, backgroundColor: colors.accent, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: colors.accent, shadowOffset: {width:0,height:8}, shadowOpacity: 0.4, shadowRadius: 16 },
  logoLetter:   { color: '#fff', fontSize: 28, fontWeight: '800' },
  appName:      { ...text.h1, fontSize: 32, marginBottom: 12 },
  tagline:      { ...text.body, textAlign: 'center', lineHeight: 22 },
  avatarArea:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarOuter:  { width: 160, height: 160, borderRadius: 80, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accent + '40' },
  avatarInner:  { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.accent + '30', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji:  { fontSize: 60 },
  dot1: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, top: 20, right: 60, opacity: 0.6 },
  dot2: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent, bottom: 30, left: 50, opacity: 0.4 },
  dot3: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent + '40', bottom: 60, right: 40 },
  bottom:       { paddingBottom: 48, gap: 12 },
  btnPrimary:   { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', shadowColor: colors.accent, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 8 },
  btnPrimaryTxt:{ color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  btnSecondary: { borderWidth: 1, borderColor: colors.border2, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  btnSecondaryTxt: { color: colors.textMed, fontWeight: '600', fontSize: 16 },
  legalTxt:     { ...text.sm, textAlign: 'center', lineHeight: 17, marginTop: 4 },
})
