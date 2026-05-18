import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { colors, radius, text } from '../lib/theme'

const STATUS = {
  confirmada: { cor: colors.greenDim,  txt: colors.green,  icon: 'checkmark-circle', label: 'Confirmada' },
  pendente:   { cor: colors.amberDim,  txt: colors.amber,  icon: 'time',             label: 'Pendente' },
  cancelada:  { cor: colors.redDim,    txt: colors.red,    icon: 'close-circle',      label: 'Cancelada' },
  concluida:  { cor: colors.border,    txt: colors.textDim,icon: 'checkmark-done',    label: 'Concluída' },
}

const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function formatarData(iso) {
  const d = new Date(iso + 'T12:00:00')
  return `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`
}

export default function MarcacoesScreen() {
  const [marcacoes, setMarcacoes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [refresh, setRefresh]     = useState(false)

  const carregar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true)
    try { const d = await api.get('/marcacoes/minhas'); setMarcacoes(d) } catch {}
    setLoading(false); setRefresh(false)
  }, [])

  useEffect(() => { carregar() }, [])

  const cancelar = (id) => Alert.alert('Cancelar aula', 'Tens a certeza?', [
    { text: 'Não', style: 'cancel' },
    { text: 'Cancelar aula', style: 'destructive', onPress: async () => {
      await api.patch(`/marcacoes/${id}`, { status: 'cancelada' })
      setMarcacoes(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelada' } : m))
    }}
  ])

  const futuras  = marcacoes.filter(m => m.status !== 'cancelada' && new Date(m.data + 'T23:59:59') >= new Date())
  const passadas = marcacoes.filter(m => m.status === 'cancelada' || new Date(m.data + 'T23:59:59') < new Date())

  const items = [
    ...(futuras.length  ? [{ type: 'h', id: 'h1', label: 'Próximas' },  ...futuras.map(m => ({ type: 'm', ...m }))  ] : []),
    ...(passadas.length ? [{ type: 'h', id: 'h2', label: 'Histórico' }, ...passadas.map(m => ({ type: 'm', ...m })) ] : []),
  ]

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={s.pad}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => carregar(true)} tintColor={colors.accent} />}
        ListHeaderComponent={<Text style={[text.h2, { marginBottom: 16 }]}>Marcações</Text>}
        ListEmptyComponent={
          <View style={s.vazio}>
            <View style={s.vazioBg}><Ionicons name="calendar-outline" size={32} color={colors.accent} /></View>
            <Text style={[text.h3, { marginTop: 16 }]}>Sem marcações</Text>
            <Text style={[text.body, { marginTop: 4 }]}>As tuas aulas aparecem aqui</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'h') return <Text style={[text.label, s.secLabel]}>{item.label}</Text>
          const cfg = STATUS[item.status] || STATUS.pendente
          const futura = new Date(item.data + 'T23:59:59') >= new Date()
          return (
            <View style={[s.card, { borderLeftColor: cfg.txt, borderLeftWidth: 3 }]}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={text.h3}>{item.horarios?.nome}</Text>
                  <Text style={[text.body, { marginTop: 2 }]}>{item.horarios?.locais?.nome}</Text>
                  <View style={s.horaMeta}>
                    <Ionicons name="time-outline" size={12} color={colors.textDim} />
                    <Text style={s.horaTxt}>
                      {item.horarios?.hora_inicio?.slice(0,5)} – {item.horarios?.hora_fim?.slice(0,5)}
                    </Text>
                    {item.horarios?.professores && (
                      <>
                        <Text style={s.dotSep}>·</Text>
                        <Text style={s.horaTxt}>{item.horarios.professores.nome}</Text>
                      </>
                    )}
                  </View>
                </View>
                <View style={[s.badge, { backgroundColor: cfg.cor }]}>
                  <Ionicons name={cfg.icon} size={12} color={cfg.txt} />
                  <Text style={[s.badgeTxt, { color: cfg.txt }]}>{cfg.label}</Text>
                </View>
              </View>
              <View style={s.cardBot}>
                <Text style={text.sm}>{formatarData(item.data)}</Text>
                {item.status === 'confirmada' && futura && (
                  <TouchableOpacity onPress={() => cancelar(item.id)} style={s.cancelarBtn}>
                    <Text style={s.cancelarTxt}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  pad:        { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 },
  secLabel:   { marginTop: 8, marginBottom: 10, marginLeft: 2 },
  card:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 10, overflow: 'hidden' },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  horaMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  horaTxt:    { color: colors.textDim, fontSize: 12 },
  dotSep:     { color: colors.textDim, fontSize: 10 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  badgeTxt:   { fontSize: 11, fontWeight: '600' },
  cardBot:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  cancelarBtn:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  cancelarTxt:{ color: colors.red, fontSize: 12, fontWeight: '500' },
  vazio:      { alignItems: 'center', paddingTop: 60 },
  vazioBg:    { width: 72, height: 72, backgroundColor: colors.accentDim, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
})
