import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null) // 'business' or 'customer'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
        })
        AsyncStorage.getItem('solis_user_type').then(t => setUserType(t))
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
        })
      } else {
        setUser(null)
        setUserType(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    const type = await AsyncStorage.getItem('solis_user_type')
    setUserType(type)
    return { data }
  }

  const signUp = async (email, password, fullName, type) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) return { error: error.message }
    await AsyncStorage.setItem('solis_user_type', type)
    setUserType(type)
    return { data }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    await AsyncStorage.removeItem('solis_user_type')
    setUser(null)
    setUserType(null)
  }

  const setType = async (type) => {
    await AsyncStorage.setItem('solis_user_type', type)
    setUserType(type)
  }

  return (
    <AuthContext.Provider value={{ user, userType, loading, signIn, signUp, signOut, setType }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
