import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { colors, radius, text } from '../lib/theme'

export default function LoginScreen({ navigation }) {
  const { entrar } = useAuth()
  const [email, setEmail]   = useState('')
  const [senha, setSenha]   = useState('')
  const [erro, setErro]     = useState('')
  const [loading, setLoading] = useState(false)
  const [verSenha, setVerSenha] = useState(false)

  const login = async () => {
    setErro(''); setLoading(true)
    const { error } = await entrar(email, senha)
    setLoading(false)
    if (error) setErro('Email ou senha incorretos.')
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={colors.textMed} />
      </TouchableOpacity>

      <View style={s.inner}>
        <Text style={s.titulo}>Bem-vindo de volta</Text>
        <Text style={s.sub}>Entra na tua conta para continuar</Text>

        {!!erro && (
          <View style={s.erroBox}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={s.erroTxt}>{erro}</Text>
          </View>
        )}

        <View style={s.campos}>
          <View style={s.campo}>
            <Ionicons name="mail-outline" size={18} color={colors.textDim} style={s.campoIcon} />
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={colors.textDim}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={s.campo}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textDim} style={s.campoIcon} />
            <TextInput style={s.input} placeholder="Senha" placeholderTextColor={colors.textDim}
              value={senha} onChangeText={setSenha} secureTextEntry={!verSenha} />
            <TouchableOpacity onPress={() => setVerSenha(v => !v)} style={s.campoIconDir}>
              <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textDim} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[s.btn, loading && s.btnDis]} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Registar')} style={s.linkRow}>
          <Text style={s.linkTxt}>Não tens conta? </Text>
          <Text style={s.link}>Cria uma agora</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  back:        { position: 'absolute', top: 56, left: 24, zIndex: 10, padding: 4 },
  inner:       { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingTop: 40 },
  titulo:      { ...text.h1, marginBottom: 6 },
  sub:         { ...text.body, marginBottom: 32 },
  erroBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.redDim, borderWidth: 1, borderColor: colors.red + '40', borderRadius: radius.md, padding: 12, marginBottom: 16 },
  erroTxt:     { color: colors.red, fontSize: 13, flex: 1 },
  campos:      { gap: 12, marginBottom: 24 },
  campo:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14 },
  campoIcon:   { marginRight: 10 },
  campoIconDir:{ padding: 4 },
  input:       { flex: 1, paddingVertical: 15, color: colors.text, fontSize: 15 },
  btn:         { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', shadowColor: colors.accent, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 8 },
  btnDis:      { opacity: 0.6 },
  btnTxt:      { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  linkRow:     { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  linkTxt:     { color: colors.textDim, fontSize: 14 },
  link:        { color: colors.accent, fontSize: 14, fontWeight: '600' },
})
