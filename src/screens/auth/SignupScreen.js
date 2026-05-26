import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

export default function SignupScreen({ navigation, route }) {
  const role = route.params?.role || 'customer'
  const { signUp } = useAuth()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

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
    } else if (result.confirmationNeeded) {
      setLoading(false)
      setConfirmationSent(true)
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(168,85,247,0.04)', 'transparent']} style={s.headerGlow} />
      <View style={s.glowOrb} />
      <View style={s.glowOrb2} />
      <ScrollView contentContainerStyle={[s.scroll, isTablet && { alignItems: 'center' }]} keyboardShouldPersistTaps="handled">
        <View style={isTablet ? { width: 480, maxWidth: '100%' } : undefined}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <View style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </View>
        </TouchableOpacity>

        <View style={s.header}>
          {role === 'business' ? (
            <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={[s.roleTag, { borderColor: colors.borderGlow }]}>
              <Text style={[s.roleTagText, { color: colors.primary }]}>
                Business
              </Text>
            </LinearGradient>
          ) : (
            <View style={[s.roleTag, { backgroundColor: colors.blueLight, borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Text style={[s.roleTagText, { color: colors.blue }]}>
                Customer
              </Text>
            </View>
          )}
          <Text style={s.title}>Create account</Text>
          <Text style={s.subtitle}>
            {role === 'business' ? 'Set up your business on Solis OS' : 'Join Solis OS to discover and book'}
          </Text>
        </View>

        {confirmationSent ? (
          <View style={s.formCard}>
            <View style={s.successIcon}>
              <Text style={{ fontSize: 36, color: '#10b981' }}>{'✓'}</Text>
            </View>
            <Text style={s.successTitle}>Check your email</Text>
            <Text style={s.successText}>
              We sent a confirmation link to {email}. Open it to activate your account, then come back and sign in.
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login', { role })} activeOpacity={0.85}>
              <LinearGradient colors={['#f59e0b', '#f97316']} style={s.signupBtn}>
                <Text style={s.signupBtnText}>Go to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.formCard}>
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

            <TouchableOpacity onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#f59e0b', '#f97316']} style={s.signupBtn}>
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={s.signupBtnText}>
                    {role === 'business' ? 'Create Business Account' : 'Create Account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

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
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  glowOrb: {
    position: 'absolute',
    top: 60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 80,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168,85,247,0.06)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: {
    fontSize: 18,
    color: colors.text,
  },
  header: {
    marginBottom: 32,
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
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
  formCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
    ...shadows.card,
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
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  signupBtn: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 56,
    justifyContent: 'center',
    ...shadows.button,
  },
  signupBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  switchWrap: {
    alignItems: 'center',
    marginTop: 24,
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
