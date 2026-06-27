import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { colors, radius, text } from '../lib/theme'

export default function RegistarScreen({ navigation }) {
  const { registar } = useAuth()
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const criar = async () => {
    setErro(''); setLoading(true)
    const { data, error } = await registar(form.email, form.senha, form.nome, form.telefone)
    setLoading(false)
    if (error) { setErro(error.message); return }
    if (data?.user && !data?.session) {
      // confirmação de email activa — avisar
      setErro('Conta criada! Confirma o teu email antes de entrar.')
    }
    // se session existe, o AuthContext navega automaticamente
  }

  const campos = [
    { key: 'nome',     icon: 'person-outline',   ph: 'Nome completo',  kb: 'default',       sec: false },
    { key: 'email',    icon: 'mail-outline',      ph: 'Email',          kb: 'email-address', sec: false },
    { key: 'telefone', icon: 'call-outline',      ph: 'Telefone',       kb: 'phone-pad',     sec: false },
    { key: 'senha',    icon: 'lock-closed-outline',ph: 'Senha (mín. 6)',kb: 'default',       sec: true  },
  ]

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textMed} />
        </TouchableOpacity>

        <Text style={[text.h1, { marginBottom: 6 }]}>Criar conta</Text>
        <Text style={[text.body, { marginBottom: 32 }]}>Junta-te ao voUdeZapp hoje</Text>

        {!!erro && (
          <View style={s.erroBox}>
            <Ionicons name="alert-circle" size={16} color={colors.red} />
            <Text style={s.erroTxt}>{erro}</Text>
          </View>
        )}

        <View style={s.campos}>
          {campos.map(({ key, icon, ph, kb, sec }) => (
            <View key={key} style={s.campo}>
              <Ionicons name={icon} size={18} color={colors.textDim} style={s.icon} />
              <TextInput style={s.input} placeholder={ph} placeholderTextColor={colors.textDim}
                value={form[key]} onChangeText={set(key)}
                keyboardType={kb} secureTextEntry={sec} autoCapitalize="none" />
            </View>
          ))}
        </View>

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={criar} disabled={loading}>
          {loading
            ? <><ActivityIndicator color="#fff" /><Text style={[s.btnTxt, { marginLeft: 8 }]}>A criar conta...</Text></>
            : <Text style={s.btnTxt}>Criar conta</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.linkRow}>
          <Text style={{ color: colors.textDim, fontSize: 14 }}>Já tens conta? </Text>
          <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600' }}>Entra aqui</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner:     { flexGrow: 1, paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40 },
  back:      { position: 'absolute', top: 56, left: 28, padding: 4 },
  erroBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.redDim, borderWidth: 1, borderColor: colors.red + '40', borderRadius: radius.md, padding: 12, marginBottom: 16 },
  erroTxt:   { color: colors.red, fontSize: 13, flex: 1 },
  campos:    { gap: 10, marginBottom: 24 },
  campo:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14 },
  icon:      { marginRight: 10 },
  input:     { flex: 1, paddingVertical: 15, color: colors.text, fontSize: 15 },
  btn:       { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', shadowColor: colors.accent, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 8 },
  btnTxt:    { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  linkRow:   { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
})
