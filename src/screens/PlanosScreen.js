import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Alert, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useLocalStorage } from '../lib/useLocalStorage'
import { colors, radius, text } from '../lib/theme'

export default function PlanosScreen() {
  const [academiaId, , loadedAcademia] = useLocalStorage('academia_id', '')
  const [planos, setPlanos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [pagando, setPagando] = useState(null)

  useEffect(() => {
    if (!loadedAcademia) return
    const url = academiaId ? `/planos?academia_id=${academiaId}` : '/planos'
    api.get(url)
      .then(d => setPlanos(d.filter(p => p.ativo)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [academiaId, loadedAcademia])

  const subscrever = async (plano, metodo) => {
    setPagando(plano.id + metodo)
    try {
      const data = await api.post('/pagamentos/plano', { plano_id: plano.id, metodo })
      if (metodo === 'cartao') {
        Linking.openURL(data.sandbox_url || data.checkout_url)
      } else {
        Alert.alert('PIX gerado ✓', 'Copia o código abaixo e paga no teu banco.\n\n' + data.pix_copia_cola, [
          { text: 'OK' }
        ])
      }
    } catch (e) { Alert.alert('Erro', e.message) }
    setPagando(null)
  }

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} /></SafeAreaView>

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={planos}
        keyExtractor={p => p.id}
        contentContainerStyle={s.pad}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text style={text.h2}>Planos</Text>
            <Text style={[text.body, { marginTop: 4 }]}>Subscreve um plano e poupa</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.vazio}>
            <View style={s.vazioBg}><Ionicons name="layers-outline" size={32} color={colors.accent} /></View>
            <Text style={[text.h3, { marginTop: 16 }]}>Sem planos disponíveis</Text>
          </View>
        }
        renderItem={({ item: p }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={text.h3}>{p.nome}</Text>
                {p.descricao ? <Text style={[text.body, { marginTop: 4 }]}>{p.descricao}</Text> : null}
              </View>
              <View style={s.tipoBadge}>
                <Text style={s.tipoBadgeTxt}>
                  {p.tipo === 'mensalidade' ? 'Mensal' : `${p.sessoes} aulas`}
                </Text>
              </View>
            </View>

            <View style={s.precoRow}>
              <Text style={s.precoVal}>R$ {parseFloat(p.preco).toFixed(2).replace('.', ',')}</Text>
              {p.tipo === 'mensalidade' && <Text style={s.precoSub}>/mês</Text>}
            </View>

            <View style={s.btns}>
              <TouchableOpacity style={[s.btnPix, !!pagando && s.btnDis]}
                onPress={() => subscrever(p, 'pix')} disabled={!!pagando}>
                <Ionicons name="flash" size={15} color={colors.green} />
                <Text style={s.btnPixTxt}>PIX</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnCartao, !!pagando && s.btnDis]}
                onPress={() => subscrever(p, 'cartao')} disabled={!!pagando}>
                <Ionicons name="card-outline" size={15} color={colors.accent} />
                <Text style={s.btnCartaoTxt}>Cartão</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  pad:          { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  card:         { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 20, marginBottom: 14 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  tipoBadge:    { backgroundColor: colors.accentDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tipoBadgeTxt: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  precoRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  precoVal:     { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  precoSub:     { color: colors.textDim, fontSize: 14 },
  btns:         { flexDirection: 'row', gap: 10 },
  btnPix:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.greenDim, borderWidth: 1, borderColor: colors.green + '40', borderRadius: radius.md, paddingVertical: 12 },
  btnPixTxt:    { color: colors.green, fontWeight: '700', fontSize: 14 },
  btnCartao:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accent + '40', borderRadius: radius.md, paddingVertical: 12 },
  btnCartaoTxt: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  btnDis:       { opacity: 0.4 },
  vazio:        { alignItems: 'center', paddingTop: 60 },
  vazioBg:      { width: 72, height: 72, backgroundColor: colors.accentDim, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
})
