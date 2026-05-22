import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, gradients } from '../lib/theme'

const { width, height } = Dimensions.get('window')

export default function WelcomeScreen({ navigation }) {
  const pulse   = useRef(new Animated.Value(0.9)).current
  const fadeIn  = useRef(new Animated.Value(0)).current
  const slideUp = useRef(new Animated.Value(40)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.9,  duration: 2000, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <LinearGradient colors={gradients.bg} style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Glow de fundo */}
      <View style={s.glowContainer}>
        <Animated.View style={[s.glow1, { transform: [{ scale: pulse }] }]} />
        <Animated.View style={[s.glow2, { transform: [{ scale: pulse }] }]} />
      </View>

      <Animated.View style={[s.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

        {/* Logo */}
        <View style={s.logoWrap}>
          <LinearGradient colors={gradients.accent} style={s.logoBg}>
            <Text style={s.logoLetra}>v</Text>
          </LinearGradient>
          <View style={s.logoRing} />
        </View>

        <Text style={s.appName}>voulapp</Text>
        <Text style={s.tagline}>Marca. Treina.{'\n'}Evolui.</Text>

        {/* Badges de funcionalidades */}
        <View style={s.badges}>
          {[
            { icon: 'mic',      label: 'Voz' },
            { icon: 'flash',    label: 'PIX' },
            { icon: 'logo-whatsapp', label: 'WhatsApp' },
            { icon: 'sparkles', label: 'IA' },
          ].map(({ icon, label }) => (
            <View key={label} style={s.badge}>
              <Ionicons name={icon} size={14} color={colors.accent} />
              <Text style={s.badgeLabel}>{label}</Text>
            </View>
          ))}
        </View>

      </Animated.View>

      {/* Botões */}
      <Animated.View style={[s.bottom, { opacity: fadeIn }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
          <LinearGradient colors={gradients.accent} style={s.btnPrimary}>
            <Text style={s.btnPrimaryTxt}>Entrar</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnSecondary} onPress={() => navigation.navigate('Registar')} activeOpacity={0.8}>
          <Text style={s.btnSecondaryTxt}>Criar conta</Text>
        </TouchableOpacity>

        <Text style={s.legal}>Ao continuares, aceitas os Termos e Política de Privacidade.</Text>
      </Animated.View>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1 },
  glowContainer:{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  glow1:        { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, backgroundColor: colors.accentGlow, top: height * 0.1 },
  glow2:        { position: 'absolute', width: width * 0.6, height: width * 0.6, borderRadius: width * 0.3, backgroundColor: colors.hotGlow, bottom: height * 0.2 },
  content:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoWrap:     { alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoBg:       { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  logoLetra:    { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -2 },
  logoRing:     { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: colors.accentGlow },
  appName:      { fontSize: 42, fontWeight: '900', color: colors.text, letterSpacing: -2, marginBottom: 12 },
  tagline:      { fontSize: 18, color: colors.textMed, textAlign: 'center', lineHeight: 28, marginBottom: 32 },
  badges:       { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.border2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  badgeLabel:   { color: colors.textMed, fontSize: 12, fontWeight: '600' },
  bottom:       { paddingHorizontal: 28, paddingBottom: 48, gap: 12 },
  btnPrimary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radius.lg, paddingVertical: 18 },
  btnPrimaryTxt:{ color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.3 },
  btnSecondary: { borderWidth: 1, borderColor: colors.border2, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  btnSecondaryTxt: { color: colors.textMed, fontWeight: '600', fontSize: 15 },
  legal:        { color: colors.textDim, fontSize: 11, textAlign: 'center', lineHeight: 16 },
})
