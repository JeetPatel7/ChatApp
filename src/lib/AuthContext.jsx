import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth session error:', error)
        setLoading(false)
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    }).catch(err => {
      console.error('Auth session failed:', err)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('Profile fetch error:', error)
        // Create a fallback profile from auth user data
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setProfile({
            id: authUser.id,
            email: authUser.email,
            display_name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'User',
            avatar_color: authUser.user_metadata?.avatar_color || '#185FA5',
          })
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Profile fetch failed:', err)
    }
    setLoading(false)
  }

  async function signUp(email, password, displayName) {
    const avatarColors = ['#185FA5', '#0F6E56', '#993C1D', '#993556', '#534AB7', '#3B6D11', '#854F0B']
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)]
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, avatar_color: avatarColor } },
    })
    return { error }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateLastSeen() {
    if (!user) return
    try {
      await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id)
    } catch (err) {
      console.error('updateLastSeen error:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateLastSeen, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
