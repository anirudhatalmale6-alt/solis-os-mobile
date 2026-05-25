import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'

export default function ForgotPasswordScreen({ navigation }) {
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <LinearGradient colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)', 'transparent']} style={s.headerGlow} />
      <View style={s.glowOrb} />
      <ScrollView contentContainerStyle={[s.scroll, isTablet && { alignItems: 'center' }]} keyboardShouldPersistTaps="handled">
        <View style={isTablet ? { width: 480, maxWidth: '100%' } : undefined}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <View style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </View>
        </TouchableOpacity>

        <View style={s.header}>
          <Text style={s.title}>Reset Password</Text>
          <Text style={s.subtitle}>Enter your email and we'll send you a reset link</Text>
        </View>

        {success ? (
          <View style={s.formCard}>
            <View style={s.successIcon}>
              <Text style={{ fontSize: 40 }}>✓</Text>
            </View>
            <Text style={s.successTitle}>Check your email</Text>
            <Text style={s.successText}>
              We sent a password reset link to {email}. Open the link to set a new password.
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <LinearGradient colors={['#f59e0b', '#f97316']} style={s.loginBtn}>
                <Text style={s.loginBtnText}>Back to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.formCard}>
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

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity onPress={handleReset} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#f59e0b', '#f97316']} style={s.loginBtn}>
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={s.loginBtnText}>Send Reset Link</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.switchWrap}>
          <Text style={s.switchText}>
            Remember your password? <Text style={s.switchLink}>Sign in</Text>
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
    top: 40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
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
  loginBtn: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 56,
    justifyContent: 'center',
    ...shadows.button,
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
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
