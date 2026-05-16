import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

export default function LoginScreen({ navigation, route }) {
  const role = route.params?.role || 'customer'
  const { signIn, setType } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter email and password')
      return
    }
    setLoading(true)
    setError('')
    const result = await signIn(email.trim().toLowerCase(), password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      await setType(role)
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={s.header}>
          <View style={[s.roleTag, role === 'business' ? { backgroundColor: colors.primaryLight } : { backgroundColor: colors.blueLight }]}>
            <Text style={[s.roleTagText, role === 'business' ? { color: colors.primary } : { color: colors.blue }]}>
              {role === 'business' ? '🏢 Business' : '👤 Customer'}
            </Text>
          </View>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>
        </View>

        <View style={s.form}>
          <View style={s.inputWrap}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.inputWrap}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="Enter password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={s.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Signup', { role })} style={s.switchWrap}>
            <Text style={s.switchText}>
              Don't have an account? <Text style={s.switchLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backBtn: {
    marginBottom: 32,
  },
  backText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  header: {
    marginBottom: 36,
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 16,
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  form: {
    gap: 16,
  },
  inputWrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  error: {
    fontSize: 13,
    color: colors.red,
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.button,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  switchWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  switchText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '600',
  },
})
