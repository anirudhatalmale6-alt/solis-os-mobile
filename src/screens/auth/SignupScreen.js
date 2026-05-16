import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

export default function SignupScreen({ navigation, route }) {
  const role = route.params?.role || 'customer'
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    const result = await signUp(email.trim().toLowerCase(), password, fullName.trim(), role)
    if (result.error) {
      setError(result.error)
      setLoading(false)
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
          <Text style={s.title}>Create account</Text>
          <Text style={s.subtitle}>
            {role === 'business' ? 'Set up your business on Solis OS' : 'Join Solis OS to discover and book'}
          </Text>
        </View>

        <View style={s.form}>
          <View style={s.inputWrap}>
            <Text style={s.label}>Full Name</Text>
            <TextInput
              style={s.input}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

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
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.signupBtn} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={s.signupBtnText}>
                {role === 'business' ? 'Create Business Account' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login', { role })} style={s.switchWrap}>
            <Text style={s.switchText}>
              Already have an account? <Text style={s.switchLink}>Sign in</Text>
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
  signupBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.button,
  },
  signupBtnText: {
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
