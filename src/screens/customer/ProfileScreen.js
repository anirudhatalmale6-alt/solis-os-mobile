import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

const MENU_ITEMS = [
  { key: 'notifications', emoji: '🔔', label: 'Notifications', nav: null },
  { key: 'help', emoji: '💡', label: 'Help & Support', nav: null },
  { key: 'about', emoji: '✨', label: 'About Solis OS', nav: null },
]

export default function ProfileScreen({ navigation }) {
  const { user, signOut, exitGuestMode } = useAuth()

  const handleMenuPress = (item) => {
    if (item.nav) {
      navigation.navigate(item.nav)
    } else {
      Alert.alert(item.label, 'Coming soon!')
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
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.profileSection}>
            <View style={[s.avatar, { backgroundColor: colors.bgInput }]}>
              <Text style={[s.avatarText, { color: colors.textMuted }]}>👤</Text>
            </View>
            <Text style={s.userName}>Guest</Text>
            <Text style={s.userEmail}>Sign in to manage your bookings</Text>
          </View>

          <TouchableOpacity
            style={s.signInBtn}
            activeOpacity={0.85}
            onPress={() => navigation.getParent()?.navigate('Home', { screen: 'Login', params: { role: 'customer' } })}
          >
            <Text style={s.signInText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.signInBtn, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, marginTop: 10 }]}
            activeOpacity={0.85}
            onPress={() => navigation.getParent()?.navigate('Home', { screen: 'Signup', params: { role: 'customer' } })}
          >
            <Text style={[s.signInText, { color: colors.text }]}>Create Account</Text>
          </TouchableOpacity>

          <View style={[s.menuContainer, { marginTop: 28 }]}>
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                style={[s.menuItem, index === MENU_ITEMS.length - 1 && s.menuItemLast]}
                activeOpacity={0.7}
                onPress={() => handleMenuPress(item)}
              >
                <View style={s.menuIconWrap}>
                  <Text style={s.menuEmoji}>{item.emoji}</Text>
                </View>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.signOutBtn} activeOpacity={0.7} onPress={handleSignOut}>
            <Text style={s.signOutText}>Back to Start</Text>
          </TouchableOpacity>

          <Text style={s.version}>Solis OS v1.0</Text>
        </ScrollView>
      </View>
    )
  }

  const initials = user.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?'

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.profileSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.userName}>{user.full_name || 'User'}</Text>
          <Text style={s.userEmail}>{user.email || ''}</Text>
        </View>

        <View style={s.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[s.menuItem, index === MENU_ITEMS.length - 1 && s.menuItemLast]}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item)}
            >
              <View style={s.menuIconWrap}>
                <Text style={s.menuEmoji}>{item.emoji}</Text>
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.signOutBtn} activeOpacity={0.7} onPress={handleSignOut}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Solis OS v1.0</Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...shadows.button,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.textDark },
  userName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: colors.textMuted },
  signInBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.button,
  },
  signInText: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  menuContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuEmoji: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  signOutBtn: {
    marginTop: 28,
    backgroundColor: colors.redLight,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: colors.red },
  version: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 20 },
})
