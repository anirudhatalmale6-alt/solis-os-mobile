import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL = 'https://joeklgpncbrhnujzdzsp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZWtsZ3BuY2JyaG51anpkenNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTA1ODksImV4cCI6MjA5MzkyNjU4OX0.p4hS6hpKaweZRDIZbeuWb6-c0NL7irtTJ_HXOZmdTmY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export const API_BASE = 'https://api.solis-os.com'
