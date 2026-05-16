import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

export default function RoleSelectScreen({ navigation }) {
  const { enterGuestMode } = useAuth()
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />

      <View style={s.logoWrap}>
        <View style={s.logoCircle}>
          <Text style={s.logoText}>S</Text>
        </View>
        <Text style={s.brandName}>Solis OS</Text>
        <Text style={s.tagline}>The future of business management</Text>
      </View>

      <View style={s.cardsWrap}>
        <TouchableOpacity
          style={[s.roleCard, s.roleCardBusiness]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login', { role: 'business' })}
        >
          <View style={[s.roleIcon, { backgroundColor: colors.primaryLight }]}>
            <Text style={s.roleEmoji}>🏢</Text>
          </View>
          <Text style={s.roleTitle}>I'm a Business</Text>
          <Text style={s.roleDesc}>
            Manage bookings, staff, customers, invoices and grow your business with AI tools
          </Text>
          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText}>Plans from $29/mo</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.roleCard}
          activeOpacity={0.85}
          onPress={() => enterGuestMode()}
        >
          <View style={[s.roleIcon, { backgroundColor: colors.blueLight }]}>
            <Text style={s.roleEmoji}>👤</Text>
          </View>
          <Text style={s.roleTitle}>I'm a Customer</Text>
          <Text style={s.roleDesc}>
            Discover businesses near you, book appointments instantly, and browse services
          </Text>
          <View style={[s.roleBadge, { backgroundColor: colors.blueLight }]}>
            <Text style={[s.roleBadgeText, { color: colors.blue }]}>Free forever</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  glowOrb1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadows.button,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textDark,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
  },
  cardsWrap: {
    gap: 14,
  },
  roleCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  roleCardBusiness: {
    borderColor: colors.borderGlow,
    ...shadows.cardGlow,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
})
