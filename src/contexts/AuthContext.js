import { createContext, useContext, useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import {
  biometriaDisponivel, biometriaActiva, activarBiometria,
  desactivarBiometria, autenticarComBiometria
} from '../lib/biometria'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]             = useState(undefined)
  const [loading, setLoading]             = useState(true)
  const [bloqueado, setBloqueado]         = useState(false)
  const [biometriaOn, setBiometriaOn]     = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) {
        const activa = await biometriaActiva()
        setBiometriaOn(activa)
        if (activa) setBloqueado(true) // tem sessão + biometria → pedir autenticação
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const entrar = async (email, senha) => {
    const result = await supabase.auth.signInWithPassword({ email, password: senha })
    if (!result.error) await oferecerBiometria()
    return result
  }

  const oferecerBiometria = async () => {
    const disponivel = await biometriaDisponivel()
    const jaActiva   = await biometriaActiva()
    if (!disponivel || jaActiva) return

    Alert.alert(
      'Acesso rápido',
      'Queres usar a impressão digital para entrar mais rápido nas próximas vezes?',
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Activar', onPress: async () => {
          await activarBiometria()
          setBiometriaOn(true)
        }}
      ]
    )
  }

  const desbloquear = async () => {
    const ok = await autenticarComBiometria()
    if (ok) setBloqueado(false)
    else Alert.alert('Autenticação falhada', 'Tenta de novo ou usa email e senha.')
  }

  const sair = async () => {
    await desactivarBiometria()
    setBiometriaOn(false)
    setBloqueado(false)
    await supabase.auth.signOut()
  }

  const registar = (email, senha, nome, telefone) =>
    supabase.auth.signUp({ email, password: senha, options: { data: { nome, telefone } } })

  return (
    <AuthContext.Provider value={{ session, loading, bloqueado, biometriaOn, entrar, registar, sair, desbloquear }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
