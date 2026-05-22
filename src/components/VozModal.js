import { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Animated } from 'react-native'
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio'
import * as FileSystem from 'expo-file-system/legacy'
import { Ionicons } from '@expo/vector-icons'
import * as Speech from 'expo-speech'
import { api } from '../lib/api'
import { colors, radius, text } from '../lib/theme'
import { useAuth } from '../contexts/AuthContext'

const ESTADOS = {
  idle:         'idle',
  gravando:     'gravando',
  processando:  'processando',
  resultado:    'resultado',
  ouvindo:      'ouvindo',  // a ouvir a resposta do utilizador
  confirmando:  'confirmando',
}

function lerLista(lista, onDone) {
  if (lista.length === 0) {
    Speech.speak('Não encontrei aulas disponíveis para esse pedido. Quer tentar outra pesquisa?', { language: 'pt-BR', onDone })
    return
  }
  if (lista.length === 1) {
    const h = lista[0]
    const dataStr = h._data
      ? new Date(h._data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      : ''
    const msg = `Encontrei ${h.nome}${dataStr ? ` para ${dataStr}` : ''} às ${h.hora_inicio.slice(0,5)}. Posso marcar?`
    Speech.speak(msg, { language: 'pt-BR', onDone })
    return
  }
  const opcoes = lista.slice(0, 5).map((h, i) => {
    const dataStr = h._data
      ? new Date(h._data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })
      : ''
    return `Opção ${i + 1}: ${h.nome}${dataStr ? `, ${dataStr}` : ''} às ${h.hora_inicio.slice(0,5)}.`
  }).join(' ')
  Speech.speak(`Encontrei ${lista.length} aulas. ${opcoes} Diz um número para confirmar.`, {
    language: 'pt-BR', rate: 0.95, onDone
  })
}

function interpretarNumero(texto, max) {
  const t = texto.toLowerCase()
  const porExtenso = ['um','uma','dois','duas','três','quatro','cinco','seis','sete','oito','nove','dez']
  const ordinais   = ['primeiro','primeira','segundo','segunda','terceiro','terceira','quarto','quarta','quinto','quinta']
  for (let i = 1; i <= Math.min(max, 10); i++) {
    if (t.includes(String(i))) return i - 1
    if (porExtenso[i-1] && t.includes(porExtenso[i-1])) return i - 1
    const oi = (i-1)*2
    if (ordinais[oi] && (t.includes(ordinais[oi]) || t.includes(ordinais[oi+1]))) return i - 1
  }
  const m = t.match(/\b([1-9])\b/)
  if (m) return parseInt(m[1]) - 1
  return -1
}

const DESPEDIDAS = ['fui', 'tchau', 'até', 'saindo', 'adeus', 'sair', 'logout', 'fechar']

function isDespedida(texto) {
  const t = texto.toLowerCase().trim()
  return DESPEDIDAS.some(d => t.includes(d))
}

export default function VozModal({ visivel, onFechar, onConfirmar, localId, data }) {
  const { sair } = useAuth()
  const [estado, setEstado]           = useState(ESTADOS.idle)
  const [transcricao, setTranscricao] = useState('')
  const [interpretacao, setInterpretacao] = useState(null)
  const [horarios, setHorarios]       = useState([])
  const [horarioSel, setHorarioSel]   = useState(null)
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const pulso      = useRef(new Animated.Value(1)).current
  const timerRef   = useRef(null)
  const estadoRef  = useRef(ESTADOS.idle) // ref para evitar stale closure nos timers

  const setEstadoSync = (e) => { estadoRef.current = e; setEstado(e) }

  useEffect(() => {
    if (estado === ESTADOS.gravando || estado === ESTADOS.ouvindo) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulso, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulso, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ])
      ).start()
    } else { pulso.setValue(1) }
  }, [estado])

  useEffect(() => () => {
    Speech.stop()
    clearTimeout(timerRef.current)
    clearInterval(contadorRef.current)
  }, [])

  // auto-iniciar gravação quando o modal abre
  useEffect(() => {
    if (visivel && estado === ESTADOS.idle) {
      Speech.stop() // parar qualquer áudio imediatamente
      const t = setTimeout(() => iniciarGravacao(), 400)
      return () => clearTimeout(t)
    }
  }, [visivel])

  // ── Gravar com auto-stop ─────────────────────────────────────
  const [contador, setContador] = useState(0)
  const contadorRef = useRef(null)

  const iniciarGravacao = async () => {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync()
    if (!granted) return
    Speech.stop()
    await audioRecorder.prepareToRecordAsync()
    await audioRecorder.record()
    setEstadoSync(ESTADOS.gravando)
    setContador(5)

    // countdown visual e auto-stop ao fim de 5 segundos
    let restante = 5
    contadorRef.current = setInterval(() => {
      restante -= 1
      setContador(restante)
      if (restante <= 0) {
        clearInterval(contadorRef.current)
        pararGravacao()
      }
    }, 1000)
  }

  const pararGravacao = async () => {
    clearInterval(contadorRef.current)
    if (estadoRef.current !== ESTADOS.gravando) return
    setEstadoSync(ESTADOS.processando)
    clearTimeout(timerRef.current)
    try {
      await audioRecorder.stop()
      const uri = audioRecorder.uri
      if (!uri) throw new Error('Sem áudio')
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' })
      const res = await api.post('/voz/interpretar', { audio_base64: base64, formato: 'm4a' })
      setTranscricao(res.transcricao)

      // detectar despedida antes de processar
      if (res.transcricao && isDespedida(res.transcricao)) {
        Speech.speak('Até logo! Bom treino! 💪', { language: 'pt-BR', onDone: () => sair() })
        fechar()
        return
      }

      setInterpretacao(res)
      await processarResultado(res)
    } catch (e) {
      setInterpretacao({ resposta: 'Erro: ' + e.message })
      setEstadoSync(ESTADOS.resultado)
    }
  }

  const processarResultado = async (res) => {
    const desc = res.descricao_aula?.toLowerCase() || ''
    let lista = []

    if ((res.acao === 'marcar' || res.acao === 'listar') && localId) {
      if (res.data_inicio && res.data_fim) {
        let d = new Date(res.data_inicio + 'T12:00:00')
        const fim = new Date(res.data_fim + 'T12:00:00')
        while (d <= fim) {
          const iso = d.toISOString().split('T')[0]
          try {
            const h = await api.get(`/horarios/disponiveis?local_id=${localId}&data=${iso}`)
            const f = desc ? h.filter(x => x.nome.toLowerCase().includes(desc) || (x.modalidades?.nome||'').toLowerCase().includes(desc)) : h
            f.forEach(x => lista.push({ ...x, _data: iso }))
          } catch {}
          d.setDate(d.getDate() + 1)
        }
      } else if (res.data) {
        const h = await api.get(`/horarios/disponiveis?local_id=${localId}&data=${res.data}`)
        lista = desc ? h.filter(x => x.nome.toLowerCase().includes(desc) || (x.modalidades?.nome||'').toLowerCase().includes(desc)) : h
        lista = lista.map(x => ({ ...x, _data: res.data }))
      }
    }

    setHorarios(lista)
    setEstadoSync(ESTADOS.resultado)

    // ler a lista e ouvir resposta automaticamente
    lerLista(lista, () => {
      if (lista.length >= 1) {
        iniciarEscutaResposta(lista) // ouve sempre — sim/não para 1 opção, número para múltiplas
      }
    })
  }

  // ── Ouvir resposta (número) ──────────────────────────────────
  const iniciarEscutaResposta = async (lista) => {
    setEstadoSync(ESTADOS.ouvindo)
    try {
      await audioRecorder.prepareToRecordAsync()
      await audioRecorder.record()
      timerRef.current = setTimeout(() => pararEscuta(lista), 4000)
    } catch {}
  }

  const pararEscuta = async (lista) => {
    clearTimeout(timerRef.current)
    try {
      await audioRecorder.stop()
      const uri = audioRecorder.uri
      if (!uri) { setEstadoSync(ESTADOS.resultado); return }
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' })
      const res = await api.post('/voz/interpretar', { audio_base64: base64, formato: 'm4a' })
      const t = (res.transcricao || '').toLowerCase()

      // detectar CANCELAR
      if (t.includes('não') || t.includes('nao') || t.includes('cancela')) {
        Speech.speak('Tudo bem, quer procurar outra alternativa?', { language: 'pt-BR',
          onDone: () => setEstadoSync(ESTADOS.idle)
        })
        return
      }

      // 1 opção — detectar SIM/OK
      if (lista.length === 1) {
        if (t.includes('sim') || t.includes('ok') || t.includes('marca') || t.includes('confirma') || t.includes('claro') || t.includes('vai')) {
          confirmarDirecto(lista[0], lista[0]._data)
        } else if (t.trim() === '') {
          // silêncio — deixa a lista visível
          setEstadoSync(ESTADOS.resultado)
          Speech.speak('Vou deixar a lista aqui para poder decidir.', { language: 'pt-BR' })
        } else {
          setEstadoSync(ESTADOS.resultado)
          Speech.speak('Vou deixar a lista aqui para poder decidir.', { language: 'pt-BR' })
        }
        return
      }

      // múltiplas opções — detectar número
      const indice = interpretarNumero(t, lista.length)
      if (indice >= 0) {
        confirmarDirecto(lista[indice], lista[indice]._data)
      } else {
        setEstadoSync(ESTADOS.resultado)
        Speech.speak('Vou deixar a lista aqui para poder decidir.', { language: 'pt-BR' })
      }
    } catch { setEstadoSync(ESTADOS.resultado) }
  }

  // ── Confirmar ──────────────────────────────────────────────
  const mensagemFinal = (nomeAula) => {
    const n = nomeAula.toLowerCase()
    if (n.includes('beach') || n.includes('tênis') || n.includes('tenis') || n.includes('padel') || n.includes('squash'))
      return 'Bom jogo!'
    if (n.includes('fitness') || n.includes('funcional') || n.includes('hiit') || n.includes('musculação'))
      return 'Bom treino!'
    if (n.includes('natação') || n.includes('natacao') || n.includes('piscina'))
      return 'Boa natação!'
    return 'Diverte-te!'
  }

  const confirmarDirecto = async (horario, dataAula) => {
    setEstadoSync(ESTADOS.confirmando)
    try {
      await onConfirmar(horario, dataAula)
      const encerramento = mensagemFinal(horario.nome)
      Speech.speak(`Marquei! ${encerramento}`, { language: 'pt-BR' })
    } catch {}
    setTimeout(fechar, 2500)
  }

  const confirmarToque = (horario) => {
    confirmarDirecto(horario, horario._data || interpretacao?.data)
  }

  const fechar = () => {
    Speech.stop()
    clearTimeout(timerRef.current)
    setEstadoSync(ESTADOS.idle)
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

          {/* IDLE */}
          {estado === ESTADOS.idle && (
            <View style={s.center}>
              <Text style={text.h3}>Marcação por voz</Text>
              <Text style={[text.body, { textAlign: 'center', marginVertical: 12 }]}>
                Toca no microfone e diz o que queres
              </Text>
              <Text style={[text.sm, { fontStyle: 'italic', marginBottom: 24 }]}>
                "Fitness esta semana"  ·  "Padel amanhã"
              </Text>
              <TouchableOpacity style={s.micBtn} onPress={iniciarGravacao}>
                <Ionicons name="mic" size={36} color="#fff" />
              </TouchableOpacity>
              <Text style={s.micHint}>Toca para falar</Text>
            </View>
          )}

          {/* GRAVANDO */}
          {estado === ESTADOS.gravando && (
            <View style={s.center}>
              <View style={s.countdownWrap}>
                <Animated.View style={[s.micBtnRed, { transform: [{ scale: pulso }] }]}>
                  <Ionicons name="mic" size={36} color="#fff" />
                </Animated.View>
                <View style={s.countdownBadge}>
                  <Text style={s.countdownTxt}>{contador}</Text>
                </View>
              </View>
              <Text style={[text.h3, { marginTop: 20, color: colors.red }]}>A ouvir...</Text>
              <Text style={[text.body, { marginTop: 4 }]}>Fala agora — para em {contador}s</Text>
            </View>
          )}

          {/* PROCESSANDO */}
          {(estado === ESTADOS.processando || estado === ESTADOS.confirmando) && (
            <View style={s.center}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={[text.h3, { marginTop: 20 }]}>
                {estado === ESTADOS.confirmando ? 'A confirmar...' : 'A processar...'}
              </Text>
            </View>
          )}

          {/* OUVINDO RESPOSTA */}
          {estado === ESTADOS.ouvindo && (
            <View style={s.center}>
              <Animated.View style={[s.micBtnAccent, { transform: [{ scale: pulso }] }]}>
                <Ionicons name="ear" size={32} color="#fff" />
              </Animated.View>
              <Text style={[text.h3, { marginTop: 20 }]}>A ouvir...</Text>
              <Text style={[text.body, { marginTop: 4 }]}>
                {horarios.length === 1
                  ? 'Diz "sim" para confirmar ou "não" para cancelar'
                  : 'Diz um número para escolher (4 segundos)'}
              </Text>
            </View>
          )}

          {/* RESULTADO */}
          {estado === ESTADOS.resultado && interpretacao && (
            <View style={{ gap: 12 }}>
              {transcricao ? (
                <View style={s.transcricaoBox}>
                  <Text style={s.transcricaoLabel}>Ouvi:</Text>
                  <Text style={s.transcricaoTxt}>"{transcricao}"</Text>
                </View>
              ) : null}

              <View style={s.respostaBox}>
                <Ionicons name="sparkles" size={15} color={colors.accent} />
                <Text style={s.respostaTxt}>{interpretacao.resposta}</Text>
              </View>

              {horarios.length > 0 && (
                <View style={{ gap: 6 }}>
                  <Text style={[text.label, { marginBottom: 2 }]}>
                    {horarios.length === 1 ? 'Aula encontrada:' : `${horarios.length} opções — toca para confirmar:`}
                  </Text>
                  {horarios.map((h, i) => {
                    const dataStr = h._data
                      ? new Date(h._data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
                      : ''
                    return (
                      <TouchableOpacity key={h.id + (h._data||'') + i}
                        onPress={() => confirmarToque(h)}
                        style={[s.opt, horarioSel?.id === h.id && s.optSel]}>
                        {horarios.length > 1 && (
                          <View style={s.optNum}>
                            <Text style={s.optNumTxt}>{i+1}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[s.optTxt, horarioSel?.id === h.id && { color: colors.accent }]}>
                            {h.nome}
                          </Text>
                          <Text style={s.optSub}>
                            {h.hora_inicio.slice(0,5)}{dataStr ? ` · ${dataStr}` : ''}
                          </Text>
                        </View>
                        <Ionicons name="checkmark-circle-outline" size={20}
                          color={horarioSel?.id === h.id ? colors.accent : colors.textDim} />
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}

              {horarios.length === 0 && interpretacao.acao !== 'desconhecido' && (
                <Text style={[text.body, { textAlign: 'center', color: colors.amber }]}>
                  Sem aulas disponíveis para esse pedido.
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity style={s.fecharBtn} onPress={fechar}>
            <Text style={{ color: colors.textMed, fontSize: 14 }}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, minHeight: 360 },
  handle:       { width: 36, height: 4, backgroundColor: colors.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  center:       { alignItems: 'center', paddingVertical: 12 },
  micBtn:       { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  micBtnRed:    { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  countdownWrap:{ position: 'relative' },
  countdownBadge:{ position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  countdownTxt: { color: colors.red, fontWeight: '800', fontSize: 13 },
  micBtnAccent: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  micHint:      { color: colors.textDim, fontSize: 13, marginTop: 12 },
  pararBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.red, borderRadius: radius.lg, paddingHorizontal: 28, paddingVertical: 13 },
  pararTxt:     { color: '#fff', fontWeight: '700', fontSize: 15 },
  transcricaoBox: { backgroundColor: colors.bg, borderRadius: radius.md, padding: 12 },
  transcricaoLabel: { color: colors.textDim, fontSize: 11, fontWeight: '600', marginBottom: 3 },
  transcricaoTxt:   { color: colors.textMed, fontSize: 13, fontStyle: 'italic' },
  respostaBox:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.accentDim, borderRadius: radius.md, padding: 12 },
  respostaTxt:  { color: colors.text, fontSize: 13, flex: 1, lineHeight: 19 },
  opt:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
  optSel:       { borderColor: colors.accent, backgroundColor: colors.accentDim },
  optNum:       { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  optNumTxt:    { color: colors.accent, fontWeight: '700', fontSize: 13 },
  optTxt:       { color: colors.text, fontSize: 14, fontWeight: '600' },
  optSub:       { color: colors.textDim, fontSize: 12, marginTop: 2 },
  fecharBtn:    { alignItems: 'center', marginTop: 16 },
})
