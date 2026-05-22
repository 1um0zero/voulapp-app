import { useState, useEffect, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Modal, ScrollView, Linking, Animated, Dimensions, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useLocalStorage } from '../lib/useLocalStorage'
import { colors, radius, text, gradients } from '../lib/theme'

const { width, height } = Dimensions.get('window')
const CARD_WIDTH = width * 0.72

export default function EquipaScreen({ navigation }) {
  const [academiaId] = useLocalStorage('academia_id', '')
  const [professores, setProfessores] = useState([])
  const [sel, setSel]       = useState(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!academiaId) return
    api.get(`/professores?academia_id=${academiaId}`)
      .then(d => setProfessores(d.filter(p => p.ativo)))
      .catch(console.error)
  }, [academiaId])

  const abrir = (p) => {
    setSel(p)
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }

  const fechar = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setSel(null))
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <Text style={[text.h2, { letterSpacing: -0.5 }]}>A Equipa</Text>
        <Text style={[text.body, { marginTop: 4 }]}>Conhece os teus treinadores</Text>
      </View>

      {professores.length === 0 ? (
        <View style={s.vazio}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🏃</Text>
          <Text style={text.h3}>Sem professores ainda</Text>
        </View>
      ) : (
        <FlatList
          data={professores}
          keyExtractor={p => p.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.listPad}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          renderItem={({ item: p }) => (
            <TouchableOpacity onPress={() => abrir(p)} activeOpacity={0.92} style={s.card}>
              <View style={s.cardImg}>
                {p.foto_url
                  ? <Image source={{ uri: p.foto_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <LinearGradient colors={gradients.hero} style={[StyleSheet.absoluteFill, s.semFoto]}>
                      <Text style={s.semFotoLetra}>{p.nome?.[0]}</Text>
                    </LinearGradient>
                }
                <LinearGradient
                  colors={['transparent', 'rgba(7,8,15,0.95)']}
                  style={s.cardOverlay}
                >
                  <Text style={s.cardNome}>{p.nome}</Text>
                  {p.especialidades && (
                    <Text style={s.cardEsp}>{p.especialidades}</Text>
                  )}
                  <View style={s.cardBadges}>
                    {p.anos_experiencia && (
                      <View style={s.badge}>
                        <Text style={s.badgeTxt}>{p.anos_experiencia} anos</Text>
                      </View>
                    )}
                    {p.video_url && (
                      <View style={[s.badge, { backgroundColor: colors.hotDim, borderColor: colors.hot + '40' }]}>
                        <Ionicons name="play-circle" size={12} color={colors.hot} />
                        <Text style={[s.badgeTxt, { color: colors.hot }]}>Vídeo</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal de perfil */}
      <Modal visible={!!sel} transparent animationType="none" onRequestClose={fechar}>
        <Animated.View style={[s.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={fechar} />
          <Animated.View style={[s.modalSheet, { transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0,1], outputRange: [100,0] }) }] }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Foto de corpo inteiro */}
              <View style={s.modalFotoWrap}>
                {sel?.foto_url
                  ? <Image source={{ uri: sel.foto_url }} style={s.modalFoto} resizeMode="cover" />
                  : <LinearGradient colors={gradients.hero} style={s.modalFotoPlaceholder}>
                      <Text style={{ fontSize: 60, fontWeight: '900', color: colors.accent }}>{sel?.nome?.[0]}</Text>
                    </LinearGradient>
                }
                <LinearGradient
                  colors={['transparent', colors.bgMid]}
                  style={s.modalFotoGrad}
                />
                <TouchableOpacity style={s.fecharBtn} onPress={fechar}>
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={s.modalBody}>
                <Text style={s.modalNome}>{sel?.nome}</Text>
                {sel?.especialidades && (
                  <Text style={s.modalEsp}>{sel.especialidades}</Text>
                )}

                {/* Stats */}
                {sel?.anos_experiencia && (
                  <View style={s.statsRow}>
                    <View style={s.stat}>
                      <Text style={s.statVal}>{sel.anos_experiencia}</Text>
                      <Text style={s.statLabel}>anos exp.</Text>
                    </View>
                  </View>
                )}

                {/* Bio */}
                {sel?.bio && (
                  <View style={s.bioBox}>
                    <Text style={s.bioTxt}>{sel.bio}</Text>
                  </View>
                )}

                {/* Acções */}
                <View style={s.acoes}>
                  {sel?.video_url && (
                    <TouchableOpacity style={s.btnVideo} onPress={() => Linking.openURL(sel.video_url)} activeOpacity={0.85}>
                      <LinearGradient colors={gradients.hot} style={s.btnVideoGrad}>
                        <Ionicons name="play-circle" size={20} color="#fff" />
                        <Text style={s.btnVideoTxt}>Ver apresentação</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  {sel?.instagram && (
                    <TouchableOpacity style={s.btnInsta}
                      onPress={() => Linking.openURL(`https://instagram.com/${sel.instagram.replace('@','')}`)}
                      activeOpacity={0.85}>
                      <Ionicons name="logo-instagram" size={18} color={colors.hot} />
                      <Text style={s.btnInstaTxt}>{sel.instagram}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  header:       { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 8 },
  listPad:      { paddingHorizontal: 22, paddingBottom: 30, gap: 16 },
  vazio:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card:         { width: CARD_WIDTH, borderRadius: radius.xl, overflow: 'hidden', shadowColor: colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  cardImg:      { height: height * 0.62, backgroundColor: colors.card },
  semFoto:      { alignItems: 'center', justifyContent: 'center' },
  semFotoLetra: { fontSize: 80, fontWeight: '900', color: colors.accent },
  cardOverlay:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 24 },
  cardNome:     { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  cardEsp:      { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 4 },
  cardBadges:   { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.border2, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt:     { color: colors.textMed, fontSize: 11, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: colors.bgMid, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: height * 0.9, overflow: 'hidden' },
  modalFotoWrap:{ height: height * 0.5, position: 'relative' },
  modalFoto:    { width: '100%', height: '100%' },
  modalFotoPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  modalFotoGrad:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  fecharBtn:    { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalBody:    { padding: 24 },
  modalNome:    { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  modalEsp:     { color: colors.accent, fontSize: 15, fontWeight: '600', marginTop: 6 },
  statsRow:     { flexDirection: 'row', gap: 12, marginTop: 20 },
  stat:         { backgroundColor: colors.accentDim, borderRadius: radius.md, padding: 14, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: colors.border2 },
  statVal:      { color: colors.text, fontSize: 22, fontWeight: '800' },
  statLabel:    { color: colors.textDim, fontSize: 11, marginTop: 2 },
  bioBox:       { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginTop: 20, borderWidth: 1, borderColor: colors.border },
  bioTxt:       { color: colors.textMed, fontSize: 14, lineHeight: 22 },
  acoes:        { gap: 12, marginTop: 20 },
  btnVideo:     { borderRadius: radius.lg, overflow: 'hidden' },
  btnVideoGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  btnVideoTxt:  { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnInsta:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.hot + '40', borderRadius: radius.lg, padding: 14, justifyContent: 'center' },
  btnInstaTxt:  { color: colors.hot, fontWeight: '600', fontSize: 14 },
})
