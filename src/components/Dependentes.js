import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { colors, radius, text } from '../lib/theme'

export default function Dependentes() {
  const [lista, setLista]       = useState([])
  const [modal, setModal]       = useState(false)  // 'criar' | 'plafond' | null
  const [sel, setSel]           = useState(null)
  const [loading, setLoading]   = useState(false)
  const [nome, setNome]         = useState('')
  const [nascimento, setNasc]   = useState('')
  const [plafondM, setPlafondM] = useState('')
  const [plafondS, setPlafondS] = useState('')

  const carregar = () => api.get('/dependentes').then(setLista).catch(console.error)
  useEffect(() => { carregar() }, [])

  const criar = async () => {
    if (!nome) return
    setLoading(true)
    try {
      await api.post('/dependentes', { nome, data_nascimento: nascimento || null })
      setNome(''); setNasc(''); setModal(false); carregar()
    } catch (e) { Alert.alert('Erro', e.message) }
    setLoading(false)
  }

  const guardarPlafond = async () => {
    setLoading(true)
    try {
      await api.patch(`/dependentes/${sel.id}/restricoes`, {
        plafond_marcacoes_semana: plafondS ? parseInt(plafondS) : null,
        plafond_mensal: plafondM ? parseFloat(plafondM) : null,
      })
      setModal(false); carregar()
    } catch (e) { Alert.alert('Erro', e.message) }
    setLoading(false)
  }

  const remover = (dep) => Alert.alert('Remover dependente', `Remover ${dep.nome}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Remover', style: 'destructive', onPress: async () => {
      await api.delete(`/dependentes/${dep.id}`)
      carregar()
    }}
  ])

  const abrirPlafond = (dep) => {
    setSel(dep)
    setPlafondS(dep.plafond_marcacoes_semana ? String(dep.plafond_marcacoes_semana) : '')
    setPlafondM(dep.plafond_mensal ? String(dep.plafond_mensal) : '')
    setModal('plafond')
  }

  const idade = (dataNasc) => {
    if (!dataNasc) return null
    const anos = Math.floor((Date.now() - new Date(dataNasc + 'T12:00:00').getTime()) / (365.25 * 86400000))
    return `${anos} anos`
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={[text.label, { marginBottom: 0 }]}>Dependentes</Text>
        <TouchableOpacity onPress={() => setModal('criar')} style={s.addBtn}>
          <Ionicons name="add" size={16} color={colors.accent} />
          <Text style={s.addBtnTxt}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {lista.length === 0 ? (
        <Text style={[text.sm, { padding: 12 }]}>Sem dependentes. Podes adicionar a tua filha, filho ou outro familiar.</Text>
      ) : (
        lista.map(dep => (
          <View key={dep.id} style={s.depCard}>
            <View style={s.depAvatar}>
              <Text style={s.depAvatarTxt}>{dep.nome?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[text.h3, { fontSize: 14 }]}>{dep.nome}</Text>
              {dep.data_nascimento && <Text style={text.sm}>{idade(dep.data_nascimento)}</Text>}
              <View style={s.plafonds}>
                {dep.plafond_marcacoes_semana && (
                  <Text style={s.plafondBadge}>📅 {dep.plafond_marcacoes_semana}/sem</Text>
                )}
                {dep.plafond_mensal && (
                  <Text style={s.plafondBadge}>💰 R${dep.plafond_mensal}/mês</Text>
                )}
              </View>
            </View>
            <View style={s.depAcoes}>
              <TouchableOpacity onPress={() => abrirPlafond(dep)} style={s.depBtn}>
                <Ionicons name="settings-outline" size={16} color={colors.textMed} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remover(dep)} style={s.depBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.red} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Modal criar dependente */}
      <Modal visible={modal === 'criar'} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={[text.h3, { marginBottom: 16 }]}>Novo dependente</Text>
            <TextInput style={s.input} placeholder="Nome completo" placeholderTextColor={colors.textDim}
              value={nome} onChangeText={setNome} autoFocus />
            <TextInput style={[s.input, { marginTop: 10 }]} placeholder="Data de nascimento (YYYY-MM-DD)"
              placeholderTextColor={colors.textDim} value={nascimento} onChangeText={setNasc} />
            <Text style={[text.sm, { marginTop: 8, lineHeight: 16 }]}>
              Os dados de contacto e pagamentos serão associados à tua conta.
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setModal(false)} style={s.cancelBtn}>
                <Text style={{ color: colors.textMed }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={criar} disabled={loading} style={s.confirmBtn}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Criar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal plafonds */}
      <Modal visible={modal === 'plafond'} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={[text.h3, { marginBottom: 4 }]}>Restrições — {sel?.nome}</Text>
            <Text style={[text.sm, { marginBottom: 16 }]}>Deixa em branco para sem limite</Text>

            <Text style={s.inputLabel}>Máximo de marcações por semana</Text>
            <TextInput style={s.input} placeholder="Ex: 3" placeholderTextColor={colors.textDim}
              value={plafondS} onChangeText={setPlafondS} keyboardType="numeric" />

            <Text style={[s.inputLabel, { marginTop: 12 }]}>Plafond de gasto mensal (R$)</Text>
            <TextInput style={s.input} placeholder="Ex: 200.00" placeholderTextColor={colors.textDim}
              value={plafondM} onChangeText={setPlafondM} keyboardType="numeric" />

            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setModal(false)} style={s.cancelBtn}>
                <Text style={{ color: colors.textMed }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={guardarPlafond} disabled={loading} style={s.confirmBtn}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { marginTop: 4 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentDim, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnTxt:    { color: colors.accent, fontSize: 12, fontWeight: '600' },
  depCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  depAvatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  depAvatarTxt: { color: colors.accent, fontWeight: '700', fontSize: 16 },
  plafonds:     { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  plafondBadge: { color: colors.textDim, fontSize: 10, backgroundColor: colors.bg, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  depAcoes:     { gap: 4 },
  depBtn:       { padding: 6 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  input:        { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, color: colors.text, fontSize: 14 },
  inputLabel:   { color: colors.textDim, fontSize: 12, fontWeight: '500', marginBottom: 6 },
  modalBtns:    { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:    { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  confirmBtn:   { flex: 1, backgroundColor: colors.accent, borderRadius: radius.md, padding: 14, alignItems: 'center' },
})
