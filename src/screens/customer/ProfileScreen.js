import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

const MENU_ITEMS = [
  { key: 'notifications', icon: 'bell-outline', label: 'Notifications', nav: 'CustomerNotifications' },
  { key: 'help', icon: 'lightbulb-outline', label: 'Help & Support', nav: 'CustomerHelp' },
  { key: 'about', icon: 'information-outline', label: 'About Solis OS', nav: 'CustomerAbout' },
]

export default function ProfileScreen({ navigation }) {
  const { user, signOut, exitGuestMode } = useAuth()

  const handleMenuPress = (item) => {
    if (item.nav) {
      navigation.navigate(item.nav)
    }
  }

  const handleSignOut = () => {
    if (!user) {
      exitGuestMode()
      return
    }
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    )
  }

  if (!user) {
    return (
      <View style={s.container}>
        <LinearGradient
          colors={['rgba(245,158,11,0.1)', 'transparent']}
          style={s.headerGlow}
        />
        <View style={s.glowOrb1} />
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.profileSection}>
            <View style={s.avatarGuest}>
              <Ionicons name="person-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={s.userName}>Guest</Text>
            <Text style={s.userEmail}>Sign in to manage your bookings</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              const tab = navigation.getParent()?.getParent?.() || navigation.getParent()
              tab?.navigate('Home', { screen: 'Login', params: { role: 'customer' } })
            }}
          >
            <LinearGradient colors={['#f59e0b', '#f97316']} style={s.signInBtn}>
              <Text style={s.signInText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.createBtn}
            activeOpacity={0.85}
            onPress={() => {
              const tab = navigation.getParent()?.getParent?.() || navigation.getParent()
              tab?.navigate('Home', { screen: 'Signup', params: { role: 'customer' } })
            }}
          >
            <Text style={s.createBtnText}>Create Account</Text>
          </TouchableOpacity>

          <View style={[s.menuContainer, { marginTop: 28 }]}>
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                style={[s.menuItem, index === MENU_ITEMS.length - 1 && s.menuItemLast]}
                activeOpacity={0.7}
                onPress={() => handleMenuPress(item)}
              >
                <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']} style={s.menuIconWrap}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={colors.textMuted} />
                </LinearGradient>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.signOutBtn} activeOpacity={0.7} onPress={handleSignOut}>
            <Text style={s.signOutText}>Back to Start</Text>
          </TouchableOpacity>

          <Text style={s.version}>Solis OS v1.3.0</Text>
        </ScrollView>
      </View>
    )
  }

  const initials = user.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?'

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(245,158,11,0.12)', 'rgba(168,85,247,0.05)', 'transparent']}
        style={s.headerGlow}
      />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.profileSection}>
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={s.userName}>{user.full_name || 'User'}</Text>
          <Text style={s.userEmail}>{user.email || ''}</Text>
        </View>

        <LinearGradient
          colors={['rgba(245,158,11,0.08)', 'rgba(245,158,11,0.02)']}
          style={s.memberCard}
        >
          <Text style={s.memberLabel}>MEMBER SINCE</Text>
          <Text style={s.memberDate}>{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}</Text>
        </LinearGradient>

        <View style={s.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[s.menuItem, index === MENU_ITEMS.length - 1 && s.menuItemLast]}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item)}
            >
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']} style={s.menuIconWrap}>
                <MaterialCommunityIcons name={item.icon} size={18} color={colors.textMuted} />
              </LinearGradient>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.signOutBtn} activeOpacity={0.7} onPress={handleSignOut}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Solis OS v1.3.0</Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  glowOrb1: {
    position: 'absolute',
    top: 30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  glowOrb2: {
    position: 'absolute',
    top: 200,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
  },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...shadows.button,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#000' },
  avatarGuest: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarGuestText: { },
  userName: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: colors.textMuted },
  memberCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  memberLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  memberDate: { fontSize: 15, fontWeight: '600', color: colors.primary },
  signInBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.button,
  },
  signInText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  createBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  createBtnText: { fontSize: 16, fontWeight: '700', color: colors.text },
  menuContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    ...shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 14,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  signOutBtn: {
    marginTop: 28,
    backgroundColor: colors.redLight,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: colors.red },
  version: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 20 },
})
