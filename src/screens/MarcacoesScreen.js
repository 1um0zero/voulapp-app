import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, StatusBar, Clipboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { colors, radius, text } from '../lib/theme'
import { buscarPrevisaoDias } from '../lib/tempo'

const DIAS  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function contagem(data, hora) {
  const agora = new Date()
  const [h, m] = hora.split(':').map(Number)
  const alvo = new Date(data + 'T12:00:00')
  alvo.setHours(h, m, 0, 0)
  const diff = alvo - agora
  if (diff < 0) return null
  const mins  = Math.floor(diff / 60000)
  const horas = Math.floor(mins / 60)
  const dias  = Math.floor(horas / 24)
  if (dias === 0 && horas === 0) return `em ${mins}m`
  if (dias === 0) return `em ${horas}h ${mins % 60}m`
  if (dias === 1) return 'amanhã'
  return `em ${dias} dias`
}

function urgencia(data, hora) {
  const agora = new Date()
  const [h, m] = hora.split(':').map(Number)
  const alvo = new Date(data + 'T12:00:00')
  alvo.setHours(h, m, 0, 0)
  const horas = (alvo - agora) / 3600000
  if (horas < 2)  return 'hot'
  if (horas < 24) return 'warm'
  return 'cool'
}

function agendarLembrete(marcacao) {
  const [h, m] = marcacao.horarios.hora_inicio.split(':').map(Number)
  const dataAula = new Date(marcacao.data + 'T12:00:00')
  dataAula.setHours(h, m, 0, 0)
  const lembrete = new Date(dataAula.getTime() - 60 * 60 * 1000)
  const horaL = lembrete.toTimeString().slice(0, 5)
  const diaL  = lembrete.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  Alert.alert(
    '⏰ Lembrete',
    `Coloca um alarme no teu telemóvel para:\n\n${diaL}\nàs ${horaL}\n\n(1 hora antes da aula)`,
    [{ text: 'OK' }]
  )
}

export default function MarcacoesScreen() {
  const [futuras, setFuturas]       = useState([])
  const [passadas, setPassadas]     = useState([])
  const [previsao, setPrevisao]     = useState({})
  const [loading, setLoading]       = useState(true)
  const [refresh, setRefresh]       = useState(false)
  const [verHistorico, setVerHistorico] = useState(false)

  const carregar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true)
    try {
      const d = await api.get('/marcacoes/minhas')
      const agora = new Date()
      const fut = d.filter(m => m.status !== 'cancelada' && new Date(m.data + 'T23:59:59') >= agora)
        .sort((a, b) => a.data.localeCompare(b.data))
      const pas = d.filter(m => m.status === 'cancelada' || new Date(m.data + 'T23:59:59') < agora)
        .sort((a, b) => b.data.localeCompare(a.data))
      setFuturas(fut)
      setPassadas(pas)

      // buscar previsão para dias futuros com coordenadas
      const primeiroComCoords = fut.find(m => m.horarios?.locais?.lat && m.horarios?.locais?.lng)
      if (primeiroComCoords) {
        const { lat, lng } = primeiroComCoords.horarios.locais
        const datas = [...new Set(fut.map(m => m.data))]
        const prev = await buscarPrevisaoDias(lat, lng, datas)
        setPrevisao(prev)
      }
    } catch {}
    setLoading(false); setRefresh(false)
  }, [])

  // recarrega sempre que o tab fica em foco
  useFocusEffect(useCallback(() => { carregar() }, [carregar]))

  const cancelar = (id) => Alert.alert('Cancelar aula', 'Tens a certeza?', [
    { text: 'Não', style: 'cancel' },
    { text: 'Cancelar aula', style: 'destructive', onPress: async () => {
      await api.patch(`/marcacoes/${id}`, { status: 'cancelada' })
      carregar()
    }}
  ])

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        contentContainerStyle={s.pad}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => carregar(true)} tintColor={colors.accent} />}
        data={(() => {
          const itens = [{ type: 'header' }]
          let ultimaData = null
          futuras.forEach(m => {
            if (m.data !== ultimaData) {
              ultimaData = m.data
              if (previsao[m.data]) itens.push({ type: 'meteo', id: 'meteo_' + m.data, data: m.data, ...previsao[m.data] })
            }
            itens.push({ type: 'futura', ...m })
          })
          if (futuras.length === 0) itens.push({ type: 'empty_futuras' })
          itens.push({ type: 'historico_btn' })
          return itens
        })().concat(verHistorico ? passadas.map(m => ({ type: 'passada', ...m })) : [])}
        keyExtractor={(item, i) => item.id || item.type + i}
        renderItem={({ item }) => {

          if (item.type === 'meteo') {
            const d = new Date(item.data + 'T12:00:00')
            return (
              <View style={s.meteoRow}>
                <Text style={s.meteoData}>
                  {DIAS[d.getDay()]}, {d.getDate()} {MESES[d.getMonth()]}
                </Text>
                <View style={s.meteoPeriodos}>
                  {item.manha && (
                    <View style={s.meteoPeriodo}>
                      <Text style={s.meteoLabel}>manhã</Text>
                      <Text style={s.meteoIcone}>{item.manha.icone}</Text>
                      <Text style={s.meteoTemp}>{item.manha.temp}°</Text>
                    </View>
                  )}
                  {item.tarde && (
                    <View style={s.meteoPeriodo}>
                      <Text style={s.meteoLabel}>tarde</Text>
                      <Text style={s.meteoIcone}>{item.tarde.icone}</Text>
                      <Text style={s.meteoTemp}>{item.tarde.temp}°</Text>
                    </View>
                  )}
                </View>
              </View>
            )
          }

          if (item.type === 'header') return (
            <View style={s.pageHeader}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>Marcações</Text>
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{futuras.length} próximas</Text>
              </View>
            </View>
          )

          if (item.type === 'empty_futuras') return (
            <View style={s.vazio}>
              <View style={s.vazioBg}><Ionicons name="calendar-outline" size={28} color={colors.accent} /></View>
              <Text style={[text.h3, { marginTop: 14 }]}>Sem aulas marcadas</Text>
              <Text style={[text.body, { marginTop: 4, textAlign: 'center' }]}>
                Vai ao tab Aulas e marca a tua próxima sessão
              </Text>
            </View>
          )

          if (item.type === 'historico_btn') return passadas.length > 0 ? (
            <TouchableOpacity style={s.historicoBtn} onPress={() => setVerHistorico(v => !v)}>
              <Ionicons name={verHistorico ? 'chevron-up' : 'time-outline'} size={16} color={colors.textMed} />
              <Text style={s.historicoBtnTxt}>{verHistorico ? 'Ocultar histórico' : `Ver histórico (${passadas.length})`}</Text>
            </TouchableOpacity>
          ) : null

          // Card de marcação futura
          if (item.type === 'futura') {
            const u = urgencia(item.data, item.horarios?.hora_inicio || '00:00')
            const cnt = contagem(item.data, item.horarios?.hora_inicio || '00:00')
            const urgCores = {
              hot:  { bg: '#2d0a0a', accent: colors.red,   txt: colors.red },
              warm: { bg: '#1a1200', accent: colors.amber,  txt: colors.amber },
              cool: { bg: colors.accentDim, accent: colors.accent, txt: colors.accent },
            }
            const uc = urgCores[u]
            const d = new Date(item.data + 'T12:00:00')

            return (
              <View style={[s.card, { borderLeftColor: uc.accent, borderLeftWidth: 3 }]}>
                {/* Contagem */}
                <View style={[s.contagem, { backgroundColor: uc.bg }]}>
                  <Ionicons name="time" size={13} color={uc.accent} />
                  <Text style={[s.contagemTxt, { color: uc.txt }]}>{cnt}</Text>
                </View>

                <View style={s.cardBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={text.h3}>{item.horarios?.nome}</Text>
                    <Text style={[text.body, { marginTop: 2 }]}>{item.horarios?.locais?.nome}</Text>
                    <View style={s.metaRow}>
                      <Ionicons name="calendar-outline" size={12} color={colors.textDim} />
                      <Text style={s.metaTxt}>{DIAS[d.getDay()]}, {d.getDate()} {MESES[d.getMonth()]}</Text>
                      <Text style={s.dot}>·</Text>
                      <Ionicons name="time-outline" size={12} color={colors.textDim} />
                      <Text style={s.metaTxt}>{item.horarios?.hora_inicio?.slice(0,5)}</Text>
                    </View>
                  </View>
                </View>

                <View style={s.cardActions}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => agendarLembrete(item)}>
                    <Ionicons name="alarm-outline" size={18} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => cancelar(item.id)}>
                    <Ionicons name="close" size={18} color={colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            )
          }

          // Card de marcação passada/cancelada
          const cor = item.status === 'cancelada' ? colors.red : colors.textDim
          const d = new Date(item.data + 'T12:00:00')
          return (
            <View style={[s.cardPassada]}>
              <View style={{ flex: 1 }}>
                <Text style={[text.h3, { color: colors.textMed }]}>{item.horarios?.nome}</Text>
                <Text style={s.metaTxtSm}>{DIAS[d.getDay()]}, {d.getDate()} {MESES[d.getMonth()]} · {item.horarios?.hora_inicio?.slice(0,5)}</Text>
              </View>
              <Text style={[s.statusTxt, { color: cor }]}>
                {item.status === 'cancelada' ? 'Cancelada' : 'Concluída'}
              </Text>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  meteoRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 2 },
  meteoData:    { color: colors.textMed, fontSize: 13, fontWeight: '600' },
  meteoPeriodos:{ flexDirection: 'row', gap: 14 },
  meteoPeriodo: { alignItems: 'center', gap: 2 },
  meteoLabel:   { color: colors.textDim, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  meteoIcone:   { fontSize: 20 },
  meteoTemp:    { color: colors.textMed, fontSize: 12, fontWeight: '600' },
  pad:          { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 12 },
  pageHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  badge:        { backgroundColor: colors.accentDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt:     { color: colors.accent, fontSize: 12, fontWeight: '600' },
  card:         { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, marginBottom: 12, overflow: 'hidden' },
  contagem:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  contagemTxt:  { fontSize: 13, fontWeight: '700' },
  cardBody:     { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaTxt:      { color: colors.textDim, fontSize: 12 },
  dot:          { color: colors.textDim, fontSize: 10 },
  cardActions:  { flexDirection: 'row', gap: 0, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn:    { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: colors.border },
  actionBtnDanger: { borderRightWidth: 0 },
  historicoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, justifyContent: 'center', marginVertical: 8 },
  historicoBtnTxt: { color: colors.textMed, fontSize: 14, fontWeight: '500' },
  cardPassada:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card + '80', borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  metaTxtSm:    { color: colors.textDim, fontSize: 12, marginTop: 2 },
  statusTxt:    { fontSize: 11, fontWeight: '600' },
  vazio:        { alignItems: 'center', paddingVertical: 40 },
  vazioBg:      { width: 64, height: 64, backgroundColor: colors.accentDim, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
