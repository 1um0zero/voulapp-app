import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, StatusBar, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { colors, radius, text } from '../lib/theme'
import { vozEstaAtiva, setVozAtiva } from '../lib/voz'
import { gpsParaEndereco, pesquisarLugares } from '../lib/localizacao'

export default function PerfilScreen() {
  const { sair } = useAuth()
  const [perfil, setPerfil]       = useState(null)
  const [form, setForm]           = useState({})
  const [salvando, setSalv]         = useState(false)
  const [extraindo, setExtraindo]   = useState(false)
  const [uploadFoto, setUploadFoto] = useState(false)
  const [vozOn, setVozOn]           = useState(true)
  const [gpsLoading, setGpsLoad]    = useState(false)
  const [sugestoes, setSugestoes]   = useState([])
  const searchTimer = useRef(null)

  useEffect(() => { vozEstaAtiva().then(setVozOn) }, [])

  useEffect(() => {
    api.get('/perfil').then(p => {
      setPerfil(p)
      setForm({
        nome: p.nome || '', telefone: p.telefone || '',
        data_nascimento: p.data_nascimento || '', cpf: p.cpf || '',
        rg: p.rg || '', genero: p.genero || '',
        cep: p.cep || '', endereco: p.endereco || '',
        numero: p.numero || '', bairro: p.bairro || '',
        cidade: p.cidade || '', estado: p.estado || '',
        mostrar_nome_publico: p.mostrar_nome_publico || false,
      })
    }).catch(console.error)
  }, [])

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const confirmarSair = () => {
    Alert.alert('Sair', 'Tens a certeza que queres sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: sair }
    ])
  }

  const escolherFoto = async (origem) => {
    const perm = origem === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permissão necessária'); return }
    const r = origem === 'camera'
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, aspect: [1,1], allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, aspect: [1,1], allowsEditing: true })
    if (r.canceled) return
    setUploadFoto(true)
    try {
      const { base64, mimeType } = r.assets[0]
      const { foto_url } = await api.post('/perfil/foto', { base64, tipo: mimeType || 'image/jpeg' })
      setPerfil(p => ({ ...p, foto_url }))
    } catch (e) { Alert.alert('Erro', e.message) }
    setUploadFoto(false)
  }

  const opcoesFoto = () => Alert.alert('Foto de perfil', '', [
    { text: 'Câmara', onPress: () => escolherFoto('camera') },
    { text: 'Galeria', onPress: () => escolherFoto('galeria') },
    { text: 'Cancelar', style: 'cancel' }
  ])

  const extrairDocumento = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permissão necessária'); return }
    const r = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 })
    if (r.canceled) return
    setExtraindo(true)
    try {
      const { base64, mimeType } = r.assets[0]
      const d = await api.post('/perfil/extrair-documento', { imagem: base64, tipo: mimeType || 'image/jpeg' })
      if (d.nome)            set('nome')(d.nome)
      if (d.data_nascimento) set('data_nascimento')(d.data_nascimento)
      if (d.cpf)             set('cpf')(d.cpf)
      if (d.rg)              set('rg')(d.rg)
      Alert.alert('✓ Dados extraídos', 'Revê os dados e guarda o perfil.')
    } catch (e) { Alert.alert('Erro', e.message) }
    setExtraindo(false)
  }

  const detectarGPS = async () => {
    setGpsLoad(true)
    try {
      const end = await gpsParaEndereco()
      setForm(f => ({
        ...f,
        endereco: end.endereco || f.endereco,
        numero:   end.numero   || f.numero,
        bairro:   end.bairro   || f.bairro,
        cidade:   end.cidade   || f.cidade,
        estado:   end.estado   || f.estado,
        cep:      end.cep      || f.cep,
      }))
      Alert.alert('📍 Localização detectada', end.descricao?.slice(0, 120))
    } catch (e) { Alert.alert('Erro', e.message) }
    setGpsLoad(false)
  }

  const pesquisarEndereco = (texto) => {
    clearTimeout(searchTimer.current)
    if (!texto || texto.length < 3) { setSugestoes([]); return }
    searchTimer.current = setTimeout(async () => {
      const res = await pesquisarLugares(texto).catch(() => [])
      setSugestoes(res.slice(0, 4))
    }, 600)
  }

  const selecionarSugestao = (s) => {
    setForm(f => ({
      ...f,
      endereco: s.endereco || f.endereco,
      numero:   s.numero   || f.numero,
      bairro:   s.bairro   || f.bairro,
      cidade:   s.cidade   || f.cidade,
      estado:   s.estado   || f.estado,
      cep:      s.cep      || f.cep,
    }))
    setSugestoes([])
  }

  const guardar = async () => {
    setSalv(true)
    try { await api.patch('/perfil', form); Alert.alert('✓', 'Perfil guardado!') }
    catch (e) { Alert.alert('Erro', e.message) }
    setSalv(false)
  }

  if (!perfil) return <View style={s.container}><ActivityIndicator color={colors.accent} /></View>

  const inicial = (perfil.nome || perfil.email || '?')[0].toUpperCase()

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={text.h2}>Perfil</Text>
          <TouchableOpacity onPress={confirmarSair} style={s.sairBtn}>
            <Ionicons name="log-out-outline" size={18} color={colors.textMed} />
            <Text style={s.sairTxt}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={opcoesFoto} style={s.avatarWrap}>
            {uploadFoto ? (
              <View style={s.avatarImg}><ActivityIndicator color={colors.accent} /></View>
            ) : perfil.foto_url ? (
              <Image source={{ uri: perfil.foto_url }} style={s.avatarImg} />
            ) : (
              <View style={[s.avatarImg, s.avatarPlaceholder]}>
                <Text style={s.avatarLetra}>{inicial}</Text>
              </View>
            )}
            <View style={s.avatarEditBadge}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={s.avatarNome}>{perfil.nome || 'Sem nome'}</Text>
          <Text style={[text.sm, { marginTop: 2 }]}>{perfil.email}</Text>
        </View>

        {/* Privacidade */}
        <View style={s.privacidade}>
          <View style={{ flex: 1 }}>
            <Text style={s.privTitulo}>Mostrar nome nas sessões</Text>
            <Text style={s.privDesc}>Outros alunos podem ver o teu primeiro nome nas aulas que marcares</Text>
          </View>
          <Switch
            value={form.mostrar_nome_publico}
            onValueChange={v => setForm(f => ({ ...f, mostrar_nome_publico: v }))}
            trackColor={{ false: colors.border, true: colors.accent + '80' }}
            thumbColor={form.mostrar_nome_publico ? colors.accent : colors.textDim}
          />
        </View>

        {/* Toggle voz */}
        <View style={s.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleTitulo}>Notificações por voz</Text>
            <Text style={s.toggleDesc}>Saudação e meteorologia ao abrir a app</Text>
          </View>
          <Switch
            value={vozOn}
            onValueChange={async v => { setVozOn(v); await setVozAtiva(v) }}
            trackColor={{ false: colors.border, true: colors.accent + '80' }}
            thumbColor={vozOn ? colors.accent : colors.textDim}
          />
        </View>

        {/* Botão documento */}
        <TouchableOpacity style={s.btnDoc} onPress={extrairDocumento} disabled={extraindo}>
          {extraindo ? <ActivityIndicator color={colors.accent} size="small" /> : (
            <>
              <Ionicons name="scan-outline" size={18} color={colors.accent} />
              <Text style={s.btnDocTxt}>Preencher pelo documento</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Secção dados pessoais */}
        <SecLabel label="Dados pessoais" />
        <View style={s.secao}>
          <Campo icon="person-outline"     label="Nome completo"      value={form.nome}            onChange={set('nome')} />
          <Sep />
          <Campo icon="call-outline"       label="Telefone"           value={form.telefone}        onChange={set('telefone')}        kb="phone-pad" />
          <Sep />
          <Campo icon="calendar-outline"   label="Data de nascimento" value={form.data_nascimento} onChange={set('data_nascimento')} ph="YYYY-MM-DD" />
          <Sep />
          <Campo icon="card-outline"       label="CPF"                value={form.cpf}             onChange={set('cpf')}             ph="000.000.000-00" />
          <Sep />
          <Campo icon="document-outline"   label="RG"                 value={form.rg}              onChange={set('rg')} />
          <Sep />
          <View style={s.campo}>
            <Ionicons name="male-female-outline" size={16} color={colors.textDim} style={s.campoIcon} />
            <Text style={s.campoLabel}>Género</Text>
            <View style={s.generoRow}>
              {['M','F','—'].map((g, i) => {
                const val = ['masculino','feminino','outro'][i]
                return (
                  <TouchableOpacity key={g} onPress={() => set('genero')(val)}
                    style={[s.generoBotao, form.genero === val && s.generoBotaoSel]}>
                    <Text style={[s.generoBotaoTxt, form.genero === val && s.generoBotaoTxtSel]}>{g}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>

        {/* Secção endereço */}
        <SecLabel label="Endereço" />
        <View style={s.secao}>
          {/* Botão GPS */}
          <TouchableOpacity style={s.gpsBtn} onPress={detectarGPS} disabled={gpsLoading}>
            {gpsLoading
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Ionicons name="navigate" size={16} color={colors.accent} />}
            <Text style={s.gpsBtnTxt}>{gpsLoading ? 'A detectar...' : 'Usar localização actual'}</Text>
          </TouchableOpacity>
          <Sep />
          <Campo icon="navigate-outline" label="CEP" value={form.cep} onChange={set('cep')} kb="numeric" />
          <Sep />
          <View>
            <Campo icon="home-outline" label="Rua / Local" value={form.endereco}
              onChange={v => { setForm(f => ({ ...f, endereco: v })); pesquisarEndereco(v) }} />
            {sugestoes.length > 0 && (
              <View style={s.sugestoesList}>
                {sugestoes.map((sg, i) => (
                  <TouchableOpacity key={i} onPress={() => selecionarSugestao(sg)}
                    style={[s.sugestaoItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <Ionicons name="location-outline" size={13} color={colors.accent} />
                    <Text style={s.sugestaoTxt} numberOfLines={2}>{sg.descricao}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <Sep />
          <View style={s.row}>
            <View style={{ flex: 1 }}><Campo icon="pin-outline" label="Nº" value={form.numero} onChange={set('numero')} kb="numeric" /></View>
            <View style={s.sep2} />
            <View style={{ flex: 2 }}><Campo icon="grid-outline" label="Bairro" value={form.bairro} onChange={set('bairro')} /></View>
          </View>
          <Sep /><Campo icon="business-outline" label="Cidade" value={form.cidade} onChange={set('cidade')} />
          <Sep /><Campo icon="flag-outline"     label="UF"     value={form.estado} onChange={set('estado')} ph="SP" />
        </View>

        <TouchableOpacity style={s.btnGuardar} onPress={guardar} disabled={salvando}>
          {salvando ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={s.btnGuardarTxt}>Guardar perfil</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

function SecLabel({ label }) {
  return <Text style={[text.label, { marginTop: 20, marginBottom: 8, marginLeft: 4 }]}>{label}</Text>
}
function Sep() { return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 2 }} /> }
function Campo({ icon, label, value, onChange, kb = 'default', ph }) {
  return (
    <View style={s.campo}>
      <Ionicons name={icon} size={16} color={colors.textDim} style={s.campoIcon} />
      <View style={{ flex: 1 }}>
        <Text style={s.campoLabel}>{label}</Text>
        <TextInput style={s.campoInput} value={value} onChangeText={onChange}
          placeholder={ph} placeholderTextColor={colors.textDim}
          keyboardType={kb} autoCapitalize="none" />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  scroll:       { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  sairBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.redDim, borderWidth: 1, borderColor: colors.red + '40', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  sairTxt:      { color: colors.red, fontSize: 13, fontWeight: '600' },
  avatarSection:{ alignItems: 'center', marginBottom: 20 },
  avatarWrap:   { position: 'relative', marginBottom: 10 },
  avatarImg:    { width: 88, height: 88, borderRadius: 44, overflow: 'hidden' },
  avatarPlaceholder: { backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  avatarLetra:  { color: colors.accent, fontSize: 34, fontWeight: '700' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.accent, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  avatarNome:   { ...text.h3, marginTop: 4 },
  btnDoc:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accent + '50', borderRadius: radius.md, padding: 14, marginBottom: 4 },
  btnDocTxt:    { color: colors.accent, fontWeight: '600', fontSize: 14 },
  secao:        { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  campo:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  campoIcon:    { marginRight: 12 },
  campoLabel:   { color: colors.textDim, fontSize: 11, marginBottom: 2 },
  campoInput:   { color: colors.text, fontSize: 14, padding: 0 },
  generoRow:    { flexDirection: 'row', gap: 6 },
  generoBotao:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  generoBotaoSel:{ backgroundColor: colors.accentDim, borderColor: colors.accent },
  generoBotaoTxt:{ color: colors.textDim, fontSize: 13 },
  generoBotaoTxtSel: { color: colors.accent, fontWeight: '600' },
  row:          { flexDirection: 'row' },
  sep2:         { width: 1, backgroundColor: colors.border },
  privacidade:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 4 },
  privTitulo:   { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  privDesc:     { color: colors.textDim, fontSize: 12, lineHeight: 16 },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 4 },
  toggleTitulo: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  toggleDesc:   { color: colors.textDim, fontSize: 12, lineHeight: 16 },
  gpsBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingHorizontal: 16 },
  gpsBtnTxt:    { color: colors.accent, fontSize: 13, fontWeight: '600' },
  sugestoesList:{ backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  sugestaoItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, paddingHorizontal: 16 },
  sugestaoTxt:  { color: colors.textMed, fontSize: 12, flex: 1, lineHeight: 17 },
  btnGuardar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 16, marginTop: 20, shadowColor: colors.accent, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 8 },
  btnGuardarTxt:{ color: '#fff', fontWeight: '700', fontSize: 16 },
})
