import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

const MENU_ITEMS = [
  { key: 'Services', emoji: '🛠', label: 'Services', nav: 'Services' },
  { key: 'Schedule', emoji: '📅', label: 'Schedule', nav: 'Schedule' },
  { key: 'Staff', emoji: '👤', label: 'Staff', nav: 'Staff' },
  { key: 'Analytics', emoji: '📊', label: 'Analytics', nav: 'Analytics' },
  { key: 'Invoices', emoji: '🧾', label: 'Invoices', nav: 'Invoices' },
  { key: 'Expenses', emoji: '💸', label: 'Expenses', nav: 'Expenses' },
  { key: 'Promotions', emoji: '🎁', label: 'Promotions', nav: 'Promotions' },
  { key: 'Notifications', emoji: '🔔', label: 'Notifications', nav: 'Notifications' },
  { key: 'BookingLink', emoji: '🔗', label: 'Booking Link', nav: 'BookingLink' },
  { key: 'Settings', emoji: '⚙️', label: 'Settings', nav: 'Settings' },
]

const COMING_SOON = [
  { key: 'loyalty', emoji: '⭐', label: 'Loyalty & Rewards' },
  { key: 'waitlist', emoji: '⏳', label: 'Digital Waitlist' },
]

export default function MoreScreen() {
  const { signOut } = useAuth()
  const navigation = useNavigation()

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    )
  }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(245,158,11,0.1)', 'rgba(168,85,247,0.04)', 'transparent']}
        style={s.headerGlow}
      />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />
      <View style={s.header}>
        <Text style={s.headerTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[s.menuItem, index === MENU_ITEMS.length - 1 && s.menuItemLast]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(item.nav)}
            >
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']} style={s.menuIconWrap}>
                <Text style={s.menuEmoji}>{item.emoji}</Text>
              </LinearGradient>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {COMING_SOON.length > 0 && (
          <View style={[s.menuContainer, { marginTop: 16 }]}>
            {COMING_SOON.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                style={[s.menuItem, index === COMING_SOON.length - 1 && s.menuItemLast]}
                activeOpacity={0.7}
                onPress={() => Alert.alert(item.label, 'Coming soon!')}
              >
                <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']} style={s.menuIconWrap}>
                  <Text style={s.menuEmoji}>{item.emoji}</Text>
                </LinearGradient>
                <Text style={s.menuLabel}>{item.label}</Text>
                <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={s.soonBadge}>
                  <Text style={s.soonText}>Soon</Text>
                </LinearGradient>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  glowOrb1: {
    position: 'absolute', top: 40, right: -30, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  glowOrb2: {
    position: 'absolute', bottom: 150, left: -40, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(168, 85, 247, 0.06)',
  },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
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
  menuEmoji: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  soonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  soonText: { fontSize: 10, fontWeight: '700', color: colors.primary },
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
