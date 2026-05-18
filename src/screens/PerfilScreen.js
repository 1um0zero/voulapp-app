import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function PerfilScreen() {
  const { sair } = useAuth()
  const [perfil, setPerfil]       = useState(null)
  const [form, setForm]           = useState({})
  const [salvando, setSalv]       = useState(false)
  const [extraindo, setExtraindo] = useState(false)

  useEffect(() => {
    api.get('/perfil').then(p => {
      setPerfil(p)
      setForm({
        nome:            p.nome            || '',
        telefone:        p.telefone        || '',
        data_nascimento: p.data_nascimento || '',
        cpf:             p.cpf             || '',
        rg:              p.rg              || '',
        genero:          p.genero          || '',
        cep:             p.cep             || '',
        endereco:        p.endereco        || '',
        numero:          p.numero          || '',
        bairro:          p.bairro          || '',
        cidade:          p.cidade          || '',
        estado:          p.estado          || '',
      })
    }).catch(console.error)
  }, [])

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  // ── Foto de perfil ────────────────────────────────────────
  const escolherFoto = async (origem) => {
    const permissao = origem === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permissao.granted) { Alert.alert('Permissão necessária'); return }

    const resultado = origem === 'camera'
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, aspect: [1,1], allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, aspect: [1,1], allowsEditing: true })

    if (resultado.canceled) return
    const { base64, mimeType } = resultado.assets[0]
    try {
      const { foto_url } = await api.post('/perfil/foto', { base64, tipo: mimeType || 'image/jpeg' })
      setPerfil(p => ({ ...p, foto_url }))
      Alert.alert('✓', 'Foto guardada!')
    } catch (e) { Alert.alert('Erro', e.message) }
  }

  const opcoesFoto = () => {
    Alert.alert('Foto de perfil', 'Escolhe uma opção', [
      { text: 'Câmara', onPress: () => escolherFoto('camera') },
      { text: 'Galeria', onPress: () => escolherFoto('galeria') },
      { text: 'Cancelar', style: 'cancel' }
    ])
  }

  // ── Extração de documento ────────────────────────────────
  const extrairDocumento = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync()
    if (!permissao.granted) { Alert.alert('Permissão necessária'); return }

    Alert.alert('Documento', 'Fotografa o teu RG, CNH ou Passaporte', [
      { text: 'Câmara', onPress: async () => {
        const r = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 })
        if (r.canceled) return
        setExtraindo(true)
        try {
          const { base64, mimeType } = r.assets[0]
          const dados = await api.post('/perfil/extrair-documento', { imagem: base64, tipo: mimeType || 'image/jpeg' })
          if (dados.nome)            setForm(f => ({ ...f, nome: dados.nome }))
          if (dados.data_nascimento) setForm(f => ({ ...f, data_nascimento: dados.data_nascimento }))
          if (dados.cpf)             setForm(f => ({ ...f, cpf: dados.cpf }))
          if (dados.rg)              setForm(f => ({ ...f, rg: dados.rg }))
          Alert.alert('✓', 'Dados extraídos! Revê e guarda.')
        } catch (e) { Alert.alert('Erro', e.message) }
        setExtraindo(false)
      }},
      { text: 'Cancelar', style: 'cancel' }
    ])
  }

  // ── Guardar ───────────────────────────────────────────────
  const guardar = async () => {
    setSalv(true)
    try {
      await api.patch('/perfil', form)
      Alert.alert('✓', 'Perfil guardado!')
    } catch (e) { Alert.alert('Erro', e.message) }
    setSalv(false)
  }

  if (!perfil) return <View style={s.container}><ActivityIndicator color="#6366f1" /></View>

  const inicial = (perfil.nome || perfil.email || '?')[0].toUpperCase()

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

      {/* Header com logout */}
      <View style={s.header}>
        <Text style={s.headerTitulo}>Perfil</Text>
        <TouchableOpacity onPress={sair} style={s.btnSairTopo}>
          <Text style={s.btnSairTopoTxt}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={s.avatarRow}>
        <TouchableOpacity onPress={opcoesFoto}>
          {perfil.foto_url
            ? <Image source={{ uri: perfil.foto_url }} style={s.avatarImg} />
            : <View style={s.avatar}><Text style={s.avatarTxt}>{inicial}</Text></View>
          }
          <View style={s.avatarEdit}><Text style={{ color: '#fff', fontSize: 12 }}>✏️</Text></View>
        </TouchableOpacity>
        <Text style={s.email}>{perfil.email}</Text>
      </View>

      {/* Extrair documento */}
      <TouchableOpacity style={s.btnDoc} onPress={extrairDocumento} disabled={extraindo}>
        {extraindo
          ? <ActivityIndicator color="#818cf8" size="small" />
          : <Text style={s.btnDocTxt}>📄 Preencher pelo documento</Text>
        }
      </TouchableOpacity>

      {/* Dados pessoais */}
      <SecaoTitulo titulo="Dados pessoais" />
      <View style={s.secao}>
        <Campo label="Nome completo"       value={form.nome}            onChange={set('nome')} />
        <Campo label="Telefone"            value={form.telefone}        onChange={set('telefone')}        kb="phone-pad" />
        <Campo label="Data de nascimento"  value={form.data_nascimento} onChange={set('data_nascimento')} ph="YYYY-MM-DD" />
        <Campo label="CPF"                 value={form.cpf}             onChange={set('cpf')}             ph="000.000.000-00" />
        <Campo label="RG"                  value={form.rg}              onChange={set('rg')} />
        <View>
          <Text style={s.campoLabel}>Género</Text>
          <View style={s.generoRow}>
            {['masculino','feminino','outro'].map(g => (
              <TouchableOpacity key={g} onPress={() => set('genero')(g)}
                style={[s.generoBotao, form.genero === g && s.generoBotaoSel]}>
                <Text style={[s.generoBotaoTxt, form.genero === g && s.generoBotaoTxtSel]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Endereço */}
      <SecaoTitulo titulo="Endereço" />
      <View style={s.secao}>
        <Campo label="CEP"         value={form.cep}      onChange={set('cep')}      kb="numeric" />
        <Campo label="Rua"         value={form.endereco} onChange={set('endereco')} />
        <View style={s.row}>
          <View style={{ flex: 1 }}><Campo label="Número" value={form.numero} onChange={set('numero')} kb="numeric" /></View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}><Campo label="Bairro" value={form.bairro} onChange={set('bairro')} /></View>
        </View>
        <Campo label="Cidade" value={form.cidade} onChange={set('cidade')} />
        <Campo label="Estado (UF)" value={form.estado} onChange={set('estado')} ph="SP" />
      </View>

      <TouchableOpacity style={s.btnGuardar} onPress={guardar} disabled={salvando}>
        {salvando ? <ActivityIndicator color="#fff" /> : <Text style={s.btnGuardarTxt}>Guardar perfil</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.btnSair} onPress={sair}>
        <Text style={s.btnSairTxt}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function SecaoTitulo({ titulo }) {
  return <Text style={{ color: '#475569', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 }}>{titulo}</Text>
}

function Campo({ label, value, onChange, kb = 'default', ph }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.campoLabel}>{label}</Text>
      <TextInput
        style={s.input} value={value} onChangeText={onChange}
        placeholder={ph} placeholderTextColor="#475569"
        keyboardType={kb} autoCapitalize="none"
      />
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#020617' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitulo:   { color: '#f1f5f9', fontSize: 20, fontWeight: '700' },
  btnSairTopo:    { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#334155', borderRadius: 10 },
  btnSairTopoTxt: { color: '#64748b', fontSize: 13 },
  avatarRow:      { alignItems: 'center', marginBottom: 16, marginTop: 8 },
  avatarImg:      { width: 80, height: 80, borderRadius: 40 },
  avatar:         { width: 80, height: 80, borderRadius: 40, backgroundColor: '#312e81', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { color: '#818cf8', fontSize: 30, fontWeight: '700' },
  avatarEdit:     { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6366f1', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  email:          { color: '#64748b', fontSize: 13, marginTop: 8 },
  btnDoc:         { backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#3730a3', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 8 },
  btnDocTxt:      { color: '#818cf8', fontWeight: '600', fontSize: 15 },
  secao:          { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  campoLabel:     { color: '#64748b', fontSize: 11, fontWeight: '500', marginBottom: 4 },
  input:          { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, padding: 10, color: '#f1f5f9', fontSize: 14 },
  generoRow:      { flexDirection: 'row', gap: 8 },
  generoBotao:    { flex: 1, borderWidth: 1, borderColor: '#334155', borderRadius: 10, padding: 8, alignItems: 'center' },
  generoBotaoSel: { backgroundColor: '#312e81', borderColor: '#6366f1' },
  generoBotaoTxt: { color: '#64748b', fontSize: 13 },
  generoBotaoTxtSel: { color: '#818cf8', fontWeight: '600' },
  row:            { flexDirection: 'row' },
  btnGuardar:     { backgroundColor: '#6366f1', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 12 },
  btnGuardarTxt:  { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnSair:        { borderWidth: 1, borderColor: '#334155', borderRadius: 14, padding: 14, alignItems: 'center' },
  btnSairTxt:     { color: '#64748b', fontSize: 15 },
})
