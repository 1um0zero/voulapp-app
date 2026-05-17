import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native'
import { api } from '../lib/api'
import { useLocalStorage } from '../lib/useLocalStorage'

export default function PlanosScreen() {
  const [academiaId] = useLocalStorage('academia_id', '')
  const [planos, setPlanos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [pagando, setPagando] = useState(null)

  useEffect(() => {
    if (!academiaId) return
    api.get(`/planos?academia_id=${academiaId}&ativo=true`)
      .then(setPlanos).catch(console.error).finally(() => setLoading(false))
  }, [academiaId])

  const subscrever = async (plano, metodo) => {
    setPagando(plano.id + metodo)
    try {
      const data = await api.post('/pagamentos/plano', { plano_id: plano.id, metodo })
      if (metodo === 'cartao') {
        Linking.openURL(data.sandbox_url || data.checkout_url)
      }
    } catch (e) {
      Alert.alert('Erro', e.message)
    }
    setPagando(null)
  }

  if (loading) return <View style={s.container}><ActivityIndicator color="#6366f1" /></View>

  return (
    <FlatList
      style={s.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={planos}
      keyExtractor={p => p.id}
      ListEmptyComponent={
        <View style={s.vazio}>
          <Text style={s.vazioBig}>📋</Text>
          <Text style={s.vazioTxt}>Sem planos disponíveis</Text>
        </View>
      }
      renderItem={({ item: p }) => (
        <View style={s.card}>
          <View style={s.cardTop}>
            <Text style={s.nome}>{p.nome}</Text>
            {p.descricao && <Text style={s.desc}>{p.descricao}</Text>}
            <View style={s.tipoBadge}>
              <Text style={s.tipoBadgeTxt}>
                {p.tipo === 'mensalidade' ? 'Mensalidade' : `Pacote ${p.sessoes} aulas`}
              </Text>
            </View>
          </View>
          <View style={s.preco}>
            <Text style={s.precoVal}>R$ {parseFloat(p.preco).toFixed(2).replace('.', ',')}</Text>
            {p.tipo === 'mensalidade' && <Text style={s.precoSub}>/mês</Text>}
          </View>
          <View style={s.btns}>
            <TouchableOpacity
              style={[s.btnPix, pagando === p.id + 'pix' && s.btnDis]}
              onPress={() => subscrever(p, 'pix')}
              disabled={!!pagando}
            >
              <Text style={s.btnPixTxt}>⚡ PIX</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnCartao, pagando === p.id + 'cartao' && s.btnDis]}
              onPress={() => subscrever(p, 'cartao')}
              disabled={!!pagando}
            >
              <Text style={s.btnCartaoTxt}>💳 Cartão</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  card:      { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTop:   { marginBottom: 12 },
  nome:      { color: '#f1f5f9', fontWeight: '700', fontSize: 18 },
  desc:      { color: '#64748b', fontSize: 13, marginTop: 4 },
  tipoBadge: { backgroundColor: '#312e81', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 8 },
  tipoBadgeTxt: { color: '#818cf8', fontSize: 12, fontWeight: '600' },
  preco:     { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12 },
  precoVal:  { color: '#f1f5f9', fontSize: 28, fontWeight: '700' },
  precoSub:  { color: '#64748b', fontSize: 13, marginLeft: 4 },
  btns:      { flexDirection: 'row', gap: 10 },
  btnPix:    { flex: 1, backgroundColor: '#052e16', borderWidth: 1, borderColor: '#166534', borderRadius: 12, padding: 12, alignItems: 'center' },
  btnPixTxt: { color: '#34d399', fontWeight: '600', fontSize: 15 },
  btnCartao: { flex: 1, backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3', borderRadius: 12, padding: 12, alignItems: 'center' },
  btnCartaoTxt: { color: '#818cf8', fontWeight: '600', fontSize: 15 },
  btnDis:    { opacity: 0.5 },
  vazio:     { flex: 1, alignItems: 'center', paddingTop: 80 },
  vazioBig:  { fontSize: 40, marginBottom: 12 },
  vazioTxt:  { color: '#94a3b8', fontWeight: '600', fontSize: 16 },
})
