import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

export default function RoleSelectScreen({ navigation }) {
  const { enterGuestMode } = useAuth()
  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <LinearGradient
        colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)', 'transparent']}
        style={s.topGlow}
      />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />
      <View style={s.glowOrb3} />

      <View style={s.logoWrap}>
        <Image source={require('../../assets/logo_solis.png')} style={s.logoImage} />
        <Text style={s.brandName}>Solis OS</Text>
        <Text style={s.tagline}>The future of business management</Text>
      </View>

      <View style={s.cardsWrap}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login', { role: 'business' })}
        >
          <View style={s.roleCardBusiness}>
            <View style={s.cardGlow} />
            <LinearGradient colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.08)']} style={s.roleIcon}>
              <MaterialCommunityIcons name="office-building-outline" size={28} color={colors.primary} />
            </LinearGradient>
            <Text style={s.roleTitle}>I'm a Business</Text>
            <Text style={s.roleDesc}>
              Manage bookings, staff, customers, invoices and grow your business with AI tools
            </Text>
            <LinearGradient colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.08)']} style={s.roleBadge}>
              <Text style={s.roleBadgeText}>Plans from $29/mo</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => enterGuestMode()}
        >
          <View style={s.roleCard}>
            <LinearGradient colors={['rgba(59,130,246,0.2)', 'rgba(59,130,246,0.08)']} style={s.roleIcon}>
              <Ionicons name="person-outline" size={28} color={colors.blue} />
            </LinearGradient>
            <Text style={s.roleTitle}>I'm a Customer</Text>
            <Text style={s.roleDesc}>
              Discover businesses near you, book appointments instantly, and browse services
            </Text>
            <LinearGradient colors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)']} style={s.roleBadge}>
              <Text style={[s.roleBadgeText, { color: colors.blue }]}>Free forever</Text>
            </LinearGradient>
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
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
  },
  glowOrb1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  glowOrb3: {
    position: 'absolute',
    top: '40%',
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 22,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  cardsWrap: {
    gap: 14,
  },
  roleCardBusiness: {
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    overflow: 'hidden',
    ...shadows.cardGlow,
  },
  cardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  roleCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  roleIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  roleEmoji: {
  },
  roleTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
})
