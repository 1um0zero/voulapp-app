import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { useAuth } from '../contexts/AuthContext'

export default function RegistarScreen({ navigation }) {
  const { registar } = useAuth()
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const criar = async () => {
    setErro(''); setLoading(true)
    const { error } = await registar(form.email, form.senha, form.nome, form.telefone)
    setLoading(false)
    if (error) setErro(error.message)
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <View style={s.logo}><Text style={s.logoText}>v</Text></View>
        <Text style={s.titulo}>voulapp</Text>
        <Text style={s.sub}>Cria a tua conta</Text>

        {!!erro && <Text style={s.erro}>{erro}</Text>}

        {[
          { key: 'nome',     ph: 'Nome completo',    kb: 'default',        sec: false },
          { key: 'email',    ph: 'Email',             kb: 'email-address',  sec: false },
          { key: 'telefone', ph: 'Telefone',          kb: 'phone-pad',      sec: false },
          { key: 'senha',    ph: 'Senha (mín. 6)',    kb: 'default',        sec: true  },
        ].map(({ key, ph, kb, sec }) => (
          <TextInput key={key} style={s.input} placeholder={ph} placeholderTextColor="#64748b"
            value={form[key]} onChangeText={set(key)}
            keyboardType={kb} secureTextEntry={sec} autoCapitalize="none" />
        ))}

        <TouchableOpacity style={s.btn} onPress={criar} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.link}>Já tens conta? <Text style={s.linkDest}>Entra aqui</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  inner:  { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logo:   { width: 56, height: 56, backgroundColor: '#6366f1', borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  titulo: { fontSize: 28, fontWeight: '700', color: '#f1f5f9', textAlign: 'center', marginBottom: 4 },
  sub:    { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
  erro:   { backgroundColor: '#450a0a', color: '#f87171', padding: 12, borderRadius: 12, marginBottom: 12, fontSize: 14, textAlign: 'center' },
  input:  { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14, padding: 14, color: '#f1f5f9', fontSize: 15, marginBottom: 12 },
  btn:    { backgroundColor: '#6366f1', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20, marginTop: 4 },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:   { textAlign: 'center', color: '#64748b', fontSize: 14 },
  linkDest: { color: '#818cf8', fontWeight: '600' },
})
