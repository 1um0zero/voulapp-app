import { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Animated } from 'react-native'
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio'
import * as FileSystem from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { colors, radius, text } from '../lib/theme'

const ESTADOS = { idle: 'idle', gravando: 'gravando', processando: 'processando', resultado: 'resultado', erro: 'erro' }

export default function VozModal({ visivel, onFechar, onConfirmar, localId, data }) {
  const [estado, setEstado] = useState(ESTADOS.idle)
  const [transcricao, setTranscricao] = useState('')
  const [interpretacao, setInterpretacao] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [horarioSel, setHorarioSel] = useState(null)
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const pulso = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (estado === ESTADOS.gravando) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulso, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulso, { toValue: 1,   duration: 500, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulso.setValue(1)
    }
  }, [estado])

  const iniciarGravacao = async () => {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync()
    if (!granted) return
    await audioRecorder.record()
    setEstado(ESTADOS.gravando)
  }

  const pararGravacao = async () => {
    if (estado !== ESTADOS.gravando) return
    setEstado(ESTADOS.processando)

    try {
      await audioRecorder.stop()
      const uri = audioRecorder.uri

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
      const res = await api.post('/voz/interpretar', { audio_base64: base64, formato: 'm4a' })

      setTranscricao(res.transcricao)
      setInterpretacao(res)

      if (res.acao === 'marcar' && localId && res.data) {
        const h = await api.get(`/horarios/disponiveis?local_id=${localId}&data=${res.data}`)
        const desc = res.descricao_aula?.toLowerCase() || ''
        const correspondentes = desc
          ? h.filter(x => x.nome.toLowerCase().includes(desc) || (x.modalidades?.nome || '').toLowerCase().includes(desc))
          : h
        setHorarios(correspondentes)
        if (correspondentes.length === 1) setHorarioSel(correspondentes[0])
      }

      setEstado(ESTADOS.resultado)
    } catch (e) {
      setInterpretacao({ resposta: e.message })
      setEstado(ESTADOS.erro)
    }
  }

  const confirmar = async () => {
    if (!horarioSel || !interpretacao?.data) return
    await onConfirmar(horarioSel, interpretacao.data)
    fechar()
  }

  const fechar = () => {
    setEstado(ESTADOS.idle)
    setTranscricao('')
    setInterpretacao(null)
    setHorarios([])
    setHorarioSel(null)
    onFechar()
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={fechar}>
      <View style={s.overlay}>
        <View style={s.sheet}>

          <View style={s.handle} />

          {estado === ESTADOS.idle && (
            <View style={s.center}>
              <Text style={text.h3}>Marcação por voz</Text>
              <Text style={[text.body, { textAlign: 'center', marginTop: 8, marginBottom: 28 }]}>
                Mantém pressionado o microfone e diz o que queres marcar
              </Text>
              <Text style={[text.sm, { marginBottom: 20 }]}>
                Ex: "Marca beach tênis para amanhã de manhã"
              </Text>
              <TouchableOpacity style={s.micBtn} onPressIn={iniciarGravacao} onPressOut={pararGravacao}>
                <Ionicons name="mic" size={36} color="#fff" />
              </TouchableOpacity>
              <Text style={s.micHint}>Pressiona para falar</Text>
            </View>
          )}

          {estado === ESTADOS.gravando && (
            <View style={s.center}>
              <Animated.View style={[s.micBtnGravando, { transform: [{ scale: pulso }] }]}>
                <Ionicons name="mic" size={36} color="#fff" />
              </Animated.View>
              <Text style={[text.h3, { marginTop: 20, color: colors.red }]}>A ouvir...</Text>
              <Text style={[text.body, { marginTop: 6 }]}>Larga para enviar</Text>
            </View>
          )}

          {estado === ESTADOS.processando && (
            <View style={s.center}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={[text.h3, { marginTop: 20 }]}>A processar...</Text>
              <Text style={[text.body, { marginTop: 6 }]}>O Claude está a interpretar</Text>
            </View>
          )}

          {(estado === ESTADOS.resultado || estado === ESTADOS.erro) && interpretacao && (
            <View style={{ gap: 16 }}>
              {transcricao ? (
                <View style={s.transcricaoBox}>
                  <Text style={s.transcricaoLabel}>Ouvi:</Text>
                  <Text style={s.transcricaoTxt}>"{transcricao}"</Text>
                </View>
              ) : null}

              <View style={s.respostaBox}>
                <Ionicons name="sparkles" size={16} color={colors.accent} />
                <Text style={s.respostaTxt}>{interpretacao.resposta}</Text>
              </View>

              {horarios.length > 1 && (
                <View style={{ gap: 8 }}>
                  <Text style={text.label}>Escolhe a aula:</Text>
                  {horarios.map(h => (
                    <TouchableOpacity key={h.id} onPress={() => setHorarioSel(h)}
                      style={[s.horarioOpt, horarioSel?.id === h.id && s.horarioOptSel]}>
                      <Text style={[s.horarioOptTxt, horarioSel?.id === h.id && { color: colors.accent }]}>
                        {h.nome} · {h.hora_inicio.slice(0,5)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {horarioSel && interpretacao.data && (
                <TouchableOpacity style={s.confirmarBtn} onPress={confirmar}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={s.confirmarTxt}>
                    Confirmar · {horarioSel.nome} · {interpretacao.data}
                  </Text>
                </TouchableOpacity>
              )}

              {estado === ESTADOS.resultado && horarios.length === 0 && interpretacao.acao === 'marcar' && (
                <Text style={[text.body, { textAlign: 'center', color: colors.amber }]}>
                  Sem aulas disponíveis para essa data e hora.
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity style={s.fecharBtn} onPress={fechar}>
            <Text style={{ color: colors.textMed, fontSize: 15 }}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:            { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, minHeight: 340 },
  handle:           { width: 36, height: 4, backgroundColor: colors.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  center:           { alignItems: 'center', paddingVertical: 16 },
  micBtn:           { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  micBtnGravando:   { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  micHint:          { color: colors.textDim, fontSize: 13, marginTop: 12 },
  transcricaoBox:   { backgroundColor: colors.bg, borderRadius: radius.md, padding: 12 },
  transcricaoLabel: { color: colors.textDim, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  transcricaoTxt:   { color: colors.textMed, fontSize: 14, fontStyle: 'italic' },
  respostaBox:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.accentDim, borderRadius: radius.md, padding: 12 },
  respostaTxt:      { color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 },
  horarioOpt:       { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
  horarioOptSel:    { borderColor: colors.accent, backgroundColor: colors.accentDim },
  horarioOptTxt:    { color: colors.textMed, fontSize: 14 },
  confirmarBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: radius.lg, padding: 14, justifyContent: 'center' },
  confirmarTxt:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  fecharBtn:        { alignItems: 'center', marginTop: 16 },
})
