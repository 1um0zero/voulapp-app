import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useLocalStorage } from '../lib/useLocalStorage'
import { colors, radius, text } from '../lib/theme'
import VozModal from '../components/VozModal'
import ParticipantesModal from '../components/ParticipantesModal'
import { falar, saudacao, mensagemMotivacional } from '../lib/voz'
import { buscarTempo } from '../lib/tempo'

const hoje = () => new Date().toISOString().split('T')[0]
const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function CalendarioSemanal({ dataSel, onChange }) {
  const [offset, setOffset] = useState(0)
  const base = new Date()
  base.setDate(base.getDate() - base.getDay() + offset * 7)

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return d
  })

  const hojeISO = hoje()
  const mes = MESES[dias[3].getMonth()]

  return (
    <View style={s.cal}>
      <View style={s.calHeader}>
        <TouchableOpacity onPress={() => offset > 0 && setOffset(o => o - 1)}
          style={[s.calArrow, offset === 0 && s.calArrowDis]}>
          <Ionicons name="chevron-back" size={18} color={offset === 0 ? colors.textDim : colors.textMed} />
        </TouchableOpacity>
        <Text style={s.calMes}>{mes} {dias[3].getFullYear()}</Text>
        <TouchableOpacity onPress={() => setOffset(o => o + 1)} style={s.calArrow}>
          <Ionicons name="chevron-forward" size={18} color={colors.textMed} />
        </TouchableOpacity>
      </View>
      <View style={s.calDias}>
        {dias.map(d => {
          const iso = d.toISOString().split('T')[0]
          const sel = iso === dataSel
          const pass = iso < hojeISO
          return (
            <TouchableOpacity key={iso} onPress={() => !pass && onChange(iso)} disabled={pass}
              style={[s.calDia, sel && s.calDiaSel, pass && s.calDiaPass]}>
              <Text style={[s.calDiaNome, sel && s.calDiaNomeSel, pass && s.calDiaNomePass]}>{DIAS[d.getDay()]}</Text>
              <Text style={[s.calDiaNum, sel && s.calDiaNumSel, pass && s.calDiaNomePass]}>{d.getDate()}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export default function HorariosScreen({ navigation }) {
  const [localId, setLocalId, loadedLocal] = useLocalStorage('local_id', '')
  const [, setAcademiaId] = useLocalStorage('academia_id', '')
  const [locais, setLocais]   = useState([])
  const [horarios, setHorarios]   = useState([])
  const [minhas, setMinhas]       = useState({}) // horario_id -> marcacao
  const [data, setData]           = useState(hoje())
  const [loading, setLoading]     = useState(false)
  const [marcando, setMarcando]   = useState(null)
  const [toast, setToast]         = useState(null)
  const [vozVisivel, setVozVisivel] = useState(false)

  const mostrarToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    api.get('/locais').then(setLocais).catch(console.error)

    // saudação motivacional ao abrir
    Promise.all([
      api.get('/perfil').catch(() => null),
      api.get('/marcacoes/minhas').catch(() => []),
    ]).then(([perfil, marcacoes]) => {
      const saud = saudacao(perfil?.nome)
      const motiv = mensagemMotivacional(marcacoes)
      falar(`${saud} ${motiv}`)
    }).catch(() => falar(saudacao('')))
  }, [])

  useEffect(() => {
    if (!localId) return
    setLoading(true)
    Promise.all([
      api.get(`/horarios/disponiveis?local_id=${localId}&data=${data}`),
      api.get('/marcacoes/minhas').catch(() => []),
    ]).then(([h, m]) => {
      setHorarios(h)
      // mapa horario_id -> marcacao para o dia seleccionado
      const mapa = {}
      m.filter(mc => mc.data === data && mc.status !== 'cancelada')
       .forEach(mc => { mapa[mc.horario_id] = mc })
      setMinhas(mapa)
    }).catch(() => setHorarios([]))
     .finally(() => setLoading(false))
  }, [localId, data])

  const marcar = async (horario) => {
    setMarcando(horario.id)
    try {
      await api.post('/marcacoes', { horario_id: horario.id, data })
      mostrarToast('Aula marcada!')
      const m = await api.get('/marcacoes/minhas').catch(() => [])
      const mapa = {}
      m.filter(mc => mc.data === data && mc.status !== 'cancelada')
       .forEach(mc => { mapa[mc.horario_id] = mc })
      setMinhas(mapa)
    } catch (e) { mostrarToast(e.message, false) }
    setMarcando(null)
  }

  const cancelarMarcacao = async (horario) => {
    const mc = minhas[horario.id]
    if (!mc) return
    setMarcando(horario.id)
    try {
      await api.patch(`/marcacoes/${mc.id}`, { status: 'cancelada' })
      mostrarToast('Marcação cancelada')
      setMinhas(prev => { const n = { ...prev }; delete n[horario.id]; return n })
      setHorarios(prev => prev.map(h =>
        h.id === horario.id ? { ...h, vagas_disponiveis: h.vagas_disponiveis + 1 } : h
      ))
    } catch (e) { mostrarToast(e.message, false) }
    setMarcando(null)
  }

  if (!loadedLocal) return <View style={s.container}><ActivityIndicator color={colors.accent} /></View>

  if (!localId) return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.pad}>
        <View style={s.selectorHeader}>
          <View style={s.logoMini}><Text style={{ color: '#fff', fontWeight: '800' }}>v</Text></View>
          <Text style={text.h2}>Escolhe um local</Text>
        </View>
        <Text style={[text.body, { marginBottom: 20 }]}>Selecciona onde queres treinar</Text>
        {locais.map(l => (
          <TouchableOpacity key={l.id} style={s.localCard}
            onPress={async () => {
              setLocalId(l.id)
              setAcademiaId(l.academia_id)
              if (l.lat && l.lng) {
                const tempo = await buscarTempo(l.lat, l.lng)
                if (tempo) falar(`${l.nome}. Hoje ${tempo.temp} graus e ${tempo.descricao}.`)
              }
            }}>
            <View style={s.localIcon}>
              <Ionicons name="location" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={text.h3}>{l.nome}</Text>
              {l.endereco ? <Text style={[text.sm, { marginTop: 2 }]}>{l.endereco}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      {toast && (
        <View style={[s.toast, { backgroundColor: toast.ok ? colors.green : colors.red }]}>
          <Ionicons name={toast.ok ? 'checkmark-circle' : 'alert-circle'} size={16} color="#fff" />
          <Text style={s.toastTxt}>{toast.msg}</Text>
        </View>
      )}

      <FlatList
        data={horarios}
        keyExtractor={h => h.id}
        contentContainerStyle={s.pad}
        ListHeaderComponent={() => (
          <>
            <View style={s.pageHeader}>
              <View>
                <Text style={text.h2}>Aulas</Text>
                <TouchableOpacity onPress={() => setLocalId('')} style={s.localBtn}>
                  <Ionicons name="location-outline" size={12} color={colors.accent} />
                  <Text style={s.localBtnTxt}>{locais.find(l => l.id === localId)?.nome || 'Local'}</Text>
                  <Ionicons name="chevron-down" size={12} color={colors.accent} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.micFab} onPress={() => setVozVisivel(true)}>
                <Ionicons name="mic" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <VozModal
              visivel={vozVisivel}
              onFechar={() => setVozVisivel(false)}
              localId={localId}
              data={data}
              onConfirmar={async (horario, dataAula) => {
                try {
                  await api.post('/marcacoes', { horario_id: horario.id, data: dataAula })
                  mostrarToast(`✓ ${horario.nome} marcado!`)
                  setData(dataAula) // dispara o useEffect que recarrega os horários
                } catch (e) { mostrarToast(e.message, false) }
              }}
            />
            <CalendarioSemanal dataSel={data} onChange={setData} />
            {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />}
          </>
        )}
        ListEmptyComponent={!loading ? (
          <View style={s.vazio}>
            <View style={s.vazioBg}><Ionicons name="calendar-outline" size={32} color={colors.accent} /></View>
            <Text style={[text.h3, { marginTop: 16 }]}>Sem aulas hoje</Text>
            <Text style={[text.body, { marginTop: 4, textAlign: 'center' }]}>Tenta outro dia</Text>
          </View>
        ) : null}
        renderItem={({ item: h }) => {
          const marcado = !!minhas[h.id]
          return (
            <View style={[s.horario, marcado && s.horarioMarcado]}>
              <View style={s.horarioHora}>
                <Text style={s.horarioHoraTxt}>{h.hora_inicio.slice(0,5)}</Text>
                <Text style={s.horarioHoraFim}>{h.hora_fim.slice(0,5)}</Text>
              </View>
              <View style={s.horarioInfo}>
                <View style={s.nomeLinha}>
                  <Text style={text.h3}>{h.nome}</Text>
                  {marcado && <Ionicons name="checkmark-circle" size={16} color={colors.green} />}
                </View>
                <View style={s.horarioMeta}>
                  {h.professores && (
                    <View style={s.metaItem}>
                      <Ionicons name="person-outline" size={11} color={colors.textDim} />
                      <Text style={s.metaTxt}>{h.professores.nome}</Text>
                    </View>
                  )}
                  {h.recursos && (
                    <View style={s.metaItem}>
                      <Ionicons name="location-outline" size={11} color={colors.textDim} />
                      <Text style={s.metaTxt}>{h.recursos.nome}</Text>
                    </View>
                  )}
                </View>
                {h.preco ? <Text style={s.preco}>R$ {parseFloat(h.preco).toFixed(0)}</Text> : null}
              </View>
              <View style={s.horarioDir}>
                <ParticipantesModal
                  horarioId={h.id}
                  data={data}
                  vagas={h.vagas}
                  vagasDisponiveis={h.vagas_disponiveis}
                />
                <TouchableOpacity
                  style={[marcado ? s.cancelarBtn : s.marcarBtn, marcando === h.id && { opacity: 0.5 }]}
                  onPress={() => marcado ? cancelarMarcacao(h) : marcar(h)}
                  disabled={marcando === h.id}>
                  {marcando === h.id
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={marcado ? s.cancelarTxt : s.marcarTxt}>{marcado ? 'Cancelar' : 'Marcar'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  pad:          { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 },
  pageHeader:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  selectorHeader:{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6, marginTop: 16 },
  logoMini:     { width: 32, height: 32, backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  localBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  localBtnTxt:  { color: colors.accent, fontSize: 12, fontWeight: '600' },
  localCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 10 },
  localIcon:    { width: 40, height: 40, backgroundColor: colors.accentDim, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cal:          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 16, marginBottom: 16 },
  calHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calArrow:     { padding: 6 },
  calArrowDis:  { opacity: 0.3 },
  calMes:       { ...text.body, fontWeight: '600', color: colors.textMed },
  calDias:      { flexDirection: 'row', justifyContent: 'space-between' },
  calDia:       { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md },
  calDiaSel:    { backgroundColor: colors.accent },
  calDiaPass:   { opacity: 0.3 },
  calDiaNome:   { fontSize: 10, fontWeight: '600', color: colors.textDim, marginBottom: 6 },
  calDiaNomeSel:{ color: '#fff' },
  calDiaNomePass:{ opacity: 0.4 },
  calDiaNum:    { fontSize: 16, fontWeight: '700', color: colors.text },
  calDiaNumSel: { color: '#fff' },
  vazio:        { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  vazioBg:      { width: 72, height: 72, backgroundColor: colors.accentDim, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  toast:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 8, padding: 12, borderRadius: radius.md },
  toastTxt:     { color: '#fff', fontWeight: '600', fontSize: 13, flex: 1 },
  horario:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 10, gap: 12 },
  horarioHora:  { alignItems: 'center', minWidth: 44 },
  horarioHoraTxt:{ color: colors.accent, fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  horarioHoraFim:{ color: colors.textDim, fontSize: 11, marginTop: 2 },
  horarioInfo:  { flex: 1 },
  horarioMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  metaItem:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt:      { color: colors.textDim, fontSize: 11 },
  preco:        { color: colors.green, fontSize: 13, fontWeight: '600', marginTop: 4 },
  micFab:       { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  horarioDir:   { alignItems: 'flex-end', gap: 8 },
  vagas:        { backgroundColor: colors.greenDim, borderRadius: 20, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  vagasAlerta:  { backgroundColor: colors.amberDim },
  vagasTxt:     { color: colors.green, fontSize: 12, fontWeight: '700' },
  vagasTxtAlerta:{ color: colors.amber },
  horarioMarcado: { borderColor: colors.green + '50', backgroundColor: colors.greenDim + '20' },
  nomeLinha:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  marcarBtn:    { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  marcarTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelarBtn:  { backgroundColor: colors.redDim, borderWidth: 1, borderColor: colors.red + '50', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8 },
  cancelarTxt:  { color: colors.red, fontWeight: '700', fontSize: 13 },
})
