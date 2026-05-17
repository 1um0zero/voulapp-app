import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function PerfilScreen() {
  const { sair } = useAuth()
  const [perfil, setPerfil]   = useState(null)
  const [form, setForm]       = useState({})
  const [salvando, setSalv]   = useState(false)

  useEffect(() => {
    api.get('/perfil').then(p => {
      setPerfil(p)
      setForm({
        nome: p.nome || '', telefone: p.telefone || '',
        data_nascimento: p.data_nascimento || '', cpf: p.cpf || '',
        rg: p.rg || '', cep: p.cep || '', endereco: p.endereco || '',
        cidade: p.cidade || '', estado: p.estado || '',
      })
    }).catch(console.error)
  }, [])

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    setSalv(true)
    try {
      await api.patch('/perfil', form)
      Alert.alert('✓', 'Perfil guardado!')
    } catch (e) { Alert.alert('Erro', e.message) }
    setSalv(false)
  }

  if (!perfil) return <View style={s.container}><ActivityIndicator color="#6366f1" /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Avatar */}
      <View style={s.avatar}>
        <Text style={s.avatarTxt}>{(perfil.nome || perfil.email)?.[0]?.toUpperCase()}</Text>
      </View>
      <Text style={s.email}>{perfil.email}</Text>

      <Section titulo="Dados pessoais">
        <Campo label="Nome completo" value={form.nome} onChange={set('nome')} />
        <Campo label="Telefone" value={form.telefone} onChange={set('telefone')} kb="phone-pad" />
        <Campo label="Data de nascimento" value={form.data_nascimento} onChange={set('data_nascimento')} ph="YYYY-MM-DD" />
        <Campo label="CPF" value={form.cpf} onChange={set('cpf')} ph="000.000.000-00" />
        <Campo label="RG" value={form.rg} onChange={set('rg')} />
      </Section>

      <Section titulo="Endereço">
        <Campo label="CEP" value={form.cep} onChange={set('cep')} kb="numeric" />
        <Campo label="Rua" value={form.endereco} onChange={set('endereco')} />
        <Campo label="Cidade" value={form.cidade} onChange={set('cidade')} />
        <Campo label="Estado (UF)" value={form.estado} onChange={set('estado')} ph="SP" />
      </Section>

      <TouchableOpacity style={s.btn} onPress={guardar} disabled={salvando}>
        {salvando ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Guardar perfil</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.btnSair} onPress={sair}>
        <Text style={s.btnSairTxt}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function Section({ titulo, children }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: '#475569', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{titulo}</Text>
      <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 12 }}>
        {children}
      </View>
    </View>
  )
}

function Campo({ label, value, onChange, kb = 'default', ph }) {
  return (
    <View>
      <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '500', marginBottom: 4 }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, padding: 10, color: '#f1f5f9', fontSize: 14 }}
        value={value} onChangeText={onChange} placeholder={ph} placeholderTextColor="#475569"
        keyboardType={kb} autoCapitalize="none"
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  avatar:    { width: 72, height: 72, borderRadius: 36, backgroundColor: '#312e81', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 16, marginBottom: 8 },
  avatarTxt: { color: '#818cf8', fontSize: 28, fontWeight: '700' },
  email:     { color: '#64748b', textAlign: 'center', fontSize: 14, marginBottom: 24 },
  btn:       { backgroundColor: '#6366f1', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnTxt:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnSair:   { borderWidth: 1, borderColor: '#334155', borderRadius: 14, padding: 14, alignItems: 'center' },
  btnSairTxt:{ color: '#64748b', fontSize: 15 },
})
