import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { api } from '../lib/api'
import { useLocalStorage } from '../lib/useLocalStorage'

const hoje = () => new Date().toISOString().split('T')[0]
const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function formatarData(iso) {
  const d = new Date(iso + 'T12:00:00')
  return `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`
}

export default function HorariosScreen({ navigation }) {
  const [localId, setLocalId] = useLocalStorage('local_id', '')
  const [locais, setLocais]   = useState([])
  const [horarios, setHorarios] = useState([])
  const [data, setData]       = useState(hoje())
  const [loading, setLoading] = useState(false)
  const [marcando, setMarcando] = useState(null)
  const [toast, setToast]     = useState(null)

  const mostrarToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    api.get('/locais').then(setLocais).catch(console.error)
  }, [])

  useEffect(() => {
    if (!localId) return
    setLoading(true)
    api.get(`/horarios/disponiveis?local_id=${localId}&data=${data}`)
      .then(setHorarios).catch(() => setHorarios([]))
      .finally(() => setLoading(false))
  }, [localId, data])

  const marcar = async (horario) => {
    setMarcando(horario.id)
    try {
      const m = await api.post('/marcacoes', { horario_id: horario.id, data })
      if (horario.preco) {
        navigation.navigate('Pagamento', { marcacao_id: m.id, valor: horario.preco, descricao: `${horario.nome} — ${data}` })
      } else {
        mostrarToast('Aula marcada!')
      }
    } catch (e) { mostrarToast(e.message, false) }
    setMarcando(null)
  }

  const mudarData = (dias) => {
    const d = new Date(data + 'T12:00:00')
    d.setDate(d.getDate() + dias)
    setData(d.toISOString().split('T')[0])
  }

  if (!localId) return (
    <View style={s.container}>
      <Text style={s.titulo}>Escolhe um local</Text>
      {locais.map(l => (
        <TouchableOpacity key={l.id} style={s.card} onPress={() => setLocalId(l.id)}>
          <Text style={s.cardTitulo}>{l.nome}</Text>
          {l.endereco && <Text style={s.cardSub}>{l.endereco}</Text>}
        </TouchableOpacity>
      ))}
    </View>
  )

  return (
    <View style={s.container}>
      {toast && (
        <View style={[s.toast, { backgroundColor: toast.ok ? '#10b981' : '#ef4444' }]}>
          <Text style={s.toastTxt}>{toast.msg}</Text>
        </View>
      )}

      {/* Navegação de data */}
      <View style={s.dataNave}>
        <TouchableOpacity onPress={() => mudarData(-1)} style={s.seta}><Text style={s.setaTxt}>‹</Text></TouchableOpacity>
        <Text style={s.dataLabel}>{formatarData(data)}</Text>
        <TouchableOpacity onPress={() => mudarData(1)} style={s.seta}><Text style={s.setaTxt}>›</Text></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
      ) : horarios.length === 0 ? (
        <View style={s.vazio}>
          <Text style={s.vazioBig}>🏖️</Text>
          <Text style={s.vazioTxt}>Sem aulas disponíveis</Text>
          <Text style={s.vazioCor}>Tenta outro dia</Text>
        </View>
      ) : (
        <FlatList
          data={horarios}
          keyExtractor={h => h.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item: h }) => (
            <View style={s.horario}>
              <View style={s.horarioInfo}>
                <Text style={s.horarioNome}>{h.nome}</Text>
                <Text style={s.horarioHora}>
                  {h.hora_inicio.slice(0,5)} – {h.hora_fim.slice(0,5)}
                  {h.modalidades ? `  ·  ${h.modalidades.nome}` : ''}
                </Text>
                {h.professores && <Text style={s.horarioProf}>👤 {h.professores.nome}</Text>}
                {h.preco && <Text style={s.horarioPreco}>R$ {parseFloat(h.preco).toFixed(2).replace('.', ',')}</Text>}
              </View>
              <View style={s.horarioDir}>
                <View style={[s.vagas, h.vagas_disponiveis <= 1 && s.vagasAlerta]}>
                  <Text style={[s.vagasTxt, h.vagas_disponiveis <= 1 && s.vagasTxtAlerta]}>
                    {h.vagas_disponiveis} vg
                  </Text>
                </View>
                <TouchableOpacity
                  style={[s.marcarBtn, marcando === h.id && s.marcarBtnDis]}
                  onPress={() => marcar(h)}
                  disabled={marcando === h.id}
                >
                  <Text style={s.marcarTxt}>{marcando === h.id ? '...' : 'Marcar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity onPress={() => setLocalId('')} style={s.trocarLocal}>
        <Text style={s.trocarLocalTxt}>Trocar local</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 16 },
  titulo:    { color: '#f1f5f9', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  card:      { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  cardTitulo:{ color: '#f1f5f9', fontWeight: '600', fontSize: 16 },
  cardSub:   { color: '#64748b', fontSize: 13, marginTop: 4 },
  dataNave:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  seta:      { padding: 8 },
  setaTxt:   { color: '#818cf8', fontSize: 24 },
  dataLabel: { color: '#f1f5f9', fontWeight: '600', fontSize: 16 },
  vazio:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vazioBig:  { fontSize: 40, marginBottom: 12 },
  vazioTxt:  { color: '#94a3b8', fontWeight: '600', fontSize: 16 },
  vazioCor:  { color: '#475569', fontSize: 14, marginTop: 4 },
  horario:   { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155', flexDirection: 'row', alignItems: 'center' },
  horarioInfo: { flex: 1 },
  horarioNome: { color: '#f1f5f9', fontWeight: '600', fontSize: 15 },
  horarioHora: { color: '#818cf8', fontSize: 13, marginTop: 4, fontFamily: Platform?.OS === 'ios' ? 'Courier' : 'monospace' },
  horarioProf: { color: '#64748b', fontSize: 12, marginTop: 4 },
  horarioPreco:{ color: '#10b981', fontSize: 13, fontWeight: '600', marginTop: 4 },
  horarioDir:  { alignItems: 'flex-end', gap: 8 },
  vagas:     { backgroundColor: '#052e16', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  vagasTxt:  { color: '#34d399', fontSize: 11, fontWeight: '600' },
  vagasAlerta: { backgroundColor: '#431407' },
  vagasTxtAlerta: { color: '#fb923c' },
  marcarBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  marcarBtnDis: { opacity: 0.5 },
  marcarTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  toast:     { borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' },
  toastTxt:  { color: '#fff', fontWeight: '600', fontSize: 14 },
  trocarLocal: { alignItems: 'center', paddingVertical: 12 },
  trocarLocalTxt: { color: '#475569', fontSize: 13 },
})
