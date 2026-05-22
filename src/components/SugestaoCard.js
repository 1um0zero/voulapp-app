import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, gradients } from '../lib/theme'

const tipoConfig = {
  marcar:   { icon: 'calendar',        cor: colors.accent, grad: gradients.accent },
  explorar: { icon: 'compass',         cor: colors.hot,    grad: gradients.hot },
  motivar:  { icon: 'trophy',          cor: '#f5a623',     grad: ['#f5a623','#e07000'] },
  social:   { icon: 'people',          cor: colors.green,  grad: ['#3dd68c','#1a9e6a'] },
}

export default function SugestaoCard({ sugestao, onAceitar, onIgnorar }) {
  const [loading, setLoading] = useState(false)
  const cfg = tipoConfig[sugestao.tipo] || tipoConfig.motivar

  const aceitar = async () => {
    setLoading(true)
    await onAceitar?.(sugestao)
    setLoading(false)
  }

  return (
    <View style={s.container}>
      <LinearGradient colors={['rgba(28,26,58,0.95)', 'rgba(18,20,31,0.98)']} style={s.card}>
        <View style={s.header}>
          <LinearGradient colors={cfg.grad} style={s.iconBg}>
            <Ionicons name={cfg.icon} size={16} color="#fff" />
          </LinearGradient>
          <Text style={s.label}>Sugestão para ti</Text>
          <TouchableOpacity onPress={onIgnorar} style={s.fechar}>
            <Ionicons name="close" size={16} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        <Text style={s.texto}>{sugestao.texto}</Text>

        {sugestao.horario_id && (
          <TouchableOpacity onPress={aceitar} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={cfg.grad} style={s.btn}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={s.btnTxt}>Marcar agora</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  )
}

const s = StyleSheet.create({
  container: { marginBottom: 12 },
  card:      { borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: colors.border2 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconBg:    { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:     { flex: 1, color: colors.textMed, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  fechar:    { padding: 4 },
  texto:     { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 14 },
  btn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, paddingVertical: 13 },
  btnTxt:    { color: '#fff', fontWeight: '700', fontSize: 14 },
})
