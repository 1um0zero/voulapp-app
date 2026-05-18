import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { colors, radius, text } from '../lib/theme'

export default function ParticipantesModal({ horarioId, data, vagas, vagasDisponiveis }) {
  const [visivel, setVisivel]         = useState(false)
  const [participantes, setParticipantes] = useState(null)
  const [loading, setLoading]         = useState(false)

  const ocupadas = vagas - vagasDisponiveis

  const abrir = async () => {
    setVisivel(true)
    if (participantes) return
    setLoading(true)
    try {
      const r = await api.get(`/horarios/${horarioId}/participantes?data=${data}`)
      setParticipantes(r)
    } catch { setParticipantes({ total: ocupadas, nomes: [] }) }
    setLoading(false)
  }

  return (
    <>
      <TouchableOpacity style={s.btn} onPress={abrir}>
        <Ionicons name="people-outline" size={13} color={colors.textDim} />
        <Text style={s.btnTxt}>{ocupadas}/{vagas}</Text>
      </TouchableOpacity>

      <Modal visible={visivel} transparent animationType="fade" onRequestClose={() => setVisivel(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setVisivel(false)}>
          <View style={s.sheet} onStartShouldSetResponder={() => true}>
            <Text style={[text.h3, { marginBottom: 4 }]}>Participantes</Text>
            <Text style={[text.sm, { marginBottom: 20 }]}>{data}</Text>

            {loading ? (
              <ActivityIndicator color={colors.accent} />
            ) : participantes ? (
              <>
                <View style={s.statRow}>
                  <View style={s.stat}>
                    <Text style={s.statVal}>{participantes.total}</Text>
                    <Text style={s.statLabel}>inscritos</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statVal}>{vagas - participantes.total}</Text>
                    <Text style={s.statLabel}>vagas livres</Text>
                  </View>
                </View>

                {participantes.nomes.length > 0 ? (
                  <View style={s.nomes}>
                    <Text style={[text.label, { marginBottom: 10 }]}>Quem vai estar</Text>
                    <View style={s.nomesGrid}>
                      {participantes.nomes.map((nome, i) => (
                        <View key={i} style={s.nomeBadge}>
                          <Text style={s.nomeTxt}>{nome}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={[text.body, { textAlign: 'center', marginTop: 8 }]}>
                    Nenhum participante partilhou o nome ainda
                  </Text>
                )}
              </>
            ) : null}

            <TouchableOpacity style={s.fechar} onPress={() => setVisivel(false)}>
              <Text style={{ color: colors.textMed, fontWeight: '600' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  btn:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btnTxt:    { color: colors.textDim, fontSize: 12 },
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet:     { backgroundColor: colors.card, borderRadius: radius.xl, padding: 24, width: '100%', maxWidth: 340 },
  statRow:   { flexDirection: 'row', gap: 12, marginBottom: 20 },
  stat:      { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  statVal:   { fontSize: 28, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  nomes:     { marginTop: 4 },
  nomesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nomeBadge: { backgroundColor: colors.accentDim, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  nomeTxt:   { color: colors.accent, fontWeight: '600', fontSize: 13 },
  fechar:    { marginTop: 20, alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
})
