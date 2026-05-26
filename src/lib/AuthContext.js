import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [guestMode, setGuestMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const [storedType, storedGuest] = await Promise.all([
        AsyncStorage.getItem('solis_user_type'),
        AsyncStorage.getItem('solis_guest_mode'),
      ])
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
        })
        setUserType(storedType)
        if (storedType === 'business') {
          await AsyncStorage.removeItem('solis_guest_mode')
        } else if (storedGuest === 'true') {
          setGuestMode(true)
        }
      } else if (storedGuest === 'true') {
        setGuestMode(true)
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
    await AsyncStorage.removeItem('solis_guest_mode')
    setGuestMode(false)
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
    if (!data.session) return { data, confirmationNeeded: true }
    return { data }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    await AsyncStorage.removeItem('solis_user_type')
    await AsyncStorage.removeItem('solis_guest_mode')
    setUser(null)
    setUserType(null)
    setGuestMode(false)
  }

  const setType = async (type) => {
    await AsyncStorage.setItem('solis_user_type', type)
    if (type === 'business') {
      await AsyncStorage.removeItem('solis_guest_mode')
      setGuestMode(false)
    }
    setUserType(type)
  }

  const enterGuestMode = async () => {
    await AsyncStorage.setItem('solis_guest_mode', 'true')
    setGuestMode(true)
  }

  const exitGuestMode = async () => {
    await AsyncStorage.removeItem('solis_guest_mode')
    setGuestMode(false)
  }

  return (
    <AuthContext.Provider value={{ user, userType, guestMode, loading, signIn, signUp, signOut, setType, enterGuestMode, exitGuestMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
