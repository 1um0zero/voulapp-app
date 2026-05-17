import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native'
import { api } from '../lib/api'

const statusCfg = {
  confirmada: { cor: '#052e16', txt: '#34d399', label: 'Confirmada' },
  pendente:   { cor: '#422006', txt: '#fb923c', label: 'Pendente' },
  cancelada:  { cor: '#450a0a', txt: '#f87171', label: 'Cancelada' },
  concluida:  { cor: '#1e293b', txt: '#64748b', label: 'Concluída' },
}

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export default function MarcacoesScreen() {
  const [marcacoes, setMarcacoes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [refresh, setRefresh]     = useState(false)

  const carregar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true)
    try {
      const data = await api.get('/marcacoes/minhas')
      setMarcacoes(data)
    } catch {}
    setLoading(false); setRefresh(false)
  }, [])

  useEffect(() => { carregar() }, [])

  const cancelar = (id) => {
    Alert.alert('Cancelar marcação', 'Tens a certeza?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim, cancelar', style: 'destructive', onPress: async () => {
        await api.patch(`/marcacoes/${id}`, { status: 'cancelada' })
        setMarcacoes(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelada' } : m))
      }}
    ])
  }

  const futuras  = marcacoes.filter(m => m.status !== 'cancelada' && new Date(m.data + 'T23:59:59') >= new Date())
  const passadas = marcacoes.filter(m => m.status === 'cancelada' || new Date(m.data + 'T23:59:59') < new Date())

  if (loading) return <View style={s.container}><ActivityIndicator color="#6366f1" /></View>

  return (
    <FlatList
      style={s.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => carregar(true)} tintColor="#6366f1" />}
      data={[
        ...(futuras.length ? [{ type: 'header', id: 'h1', label: 'Próximas' }] : []),
        ...futuras.map(m => ({ type: 'item', ...m })),
        ...(passadas.length ? [{ type: 'header', id: 'h2', label: 'Histórico' }] : []),
        ...passadas.map(m => ({ type: 'item', ...m })),
      ]}
      keyExtractor={item => item.id}
      ListEmptyComponent={
        <View style={s.vazio}>
          <Text style={s.vazioBig}>📅</Text>
          <Text style={s.vazioTxt}>Sem marcações ainda</Text>
        </View>
      }
      renderItem={({ item }) => {
        if (item.type === 'header') return <Text style={s.secLabel}>{item.label}</Text>
        const cfg = statusCfg[item.status] || statusCfg.pendente
        const d = new Date(item.data + 'T12:00:00')
        const futura = new Date(item.data + 'T23:59:59') >= new Date()
        return (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.nome}>{item.horarios?.nome}</Text>
                <Text style={s.local}>{item.horarios?.locais?.nome}</Text>
                <Text style={s.hora}>
                  {item.horarios?.hora_inicio?.slice(0,5)} – {item.horarios?.hora_fim?.slice(0,5)}
                  {item.horarios?.professores ? `  ·  ${item.horarios.professores.nome}` : ''}
                </Text>
              </View>
              <View style={[s.badge, { backgroundColor: cfg.cor }]}>
                <Text style={[s.badgeTxt, { color: cfg.txt }]}>{cfg.label}</Text>
              </View>
            </View>
            <View style={s.cardBot}>
              <Text style={s.dataLabel}>{DIAS[d.getDay()]}, {d.getDate()}/{d.getMonth()+1}/{d.getFullYear()}</Text>
              {item.status === 'confirmada' && futura && (
                <TouchableOpacity onPress={() => cancelar(item.id)}>
                  <Text style={s.cancelar}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )
      }}
    />
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  secLabel:  { color: '#475569', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  card:      { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  nome:      { color: '#f1f5f9', fontWeight: '600', fontSize: 15 },
  local:     { color: '#64748b', fontSize: 13, marginTop: 2 },
  hora:      { color: '#818cf8', fontSize: 13, marginTop: 4 },
  badge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  badgeTxt:  { fontSize: 11, fontWeight: '600' },
  cardBot:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 10 },
  dataLabel: { color: '#475569', fontSize: 12 },
  cancelar:  { color: '#f87171', fontSize: 13 },
  vazio:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  vazioBig:  { fontSize: 40, marginBottom: 12 },
  vazioTxt:  { color: '#94a3b8', fontWeight: '600', fontSize: 16 },
})
