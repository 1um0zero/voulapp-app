import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const entrar = (email, senha) =>
    supabase.auth.signInWithPassword({ email, password: senha })

  const registar = (email, senha, nome, telefone) =>
    supabase.auth.signUp({ email, password: senha, options: { data: { nome, telefone } } })

  const sair = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ session, loading, entrar, registar, sair }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
