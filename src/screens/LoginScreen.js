import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { useAuth } from '../contexts/AuthContext'

export default function LoginScreen({ navigation }) {
  const { entrar } = useAuth()
  const [email, setEmail]   = useState('')
  const [senha, setSenha]   = useState('')
  const [erro, setErro]     = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setErro(''); setLoading(true)
    const { error } = await entrar(email, senha)
    setLoading(false)
    if (error) setErro('Email ou senha incorretos.')
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <View style={s.logo}>
          <Text style={s.logoText}>v</Text>
        </View>
        <Text style={s.titulo}>voulapp</Text>
        <Text style={s.sub}>Entra na tua conta</Text>

        {!!erro && <Text style={s.erro}>{erro}</Text>}

        <TextInput
          style={s.input} placeholder="Email" placeholderTextColor="#64748b"
          value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none"
        />
        <TextInput
          style={s.input} placeholder="Senha" placeholderTextColor="#64748b"
          value={senha} onChangeText={setSenha} secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Registar')}>
          <Text style={s.link}>Não tens conta? <Text style={s.linkDest}>Cria uma agora</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  inner:  { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
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
