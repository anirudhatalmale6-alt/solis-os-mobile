import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

const MENU_ITEMS = [
  { key: 'Services', emoji: '🛠', label: 'Services', nav: 'Services' },
  { key: 'Schedule', emoji: '📅', label: 'Schedule', nav: 'Schedule' },
  { key: 'Staff', emoji: '👤', label: 'Staff', nav: 'Staff' },
  { key: 'Analytics', emoji: '📊', label: 'Analytics', nav: 'Analytics' },
  { key: 'BookingLink', emoji: '🔗', label: 'Booking Link', nav: 'BookingLink' },
  { key: 'Settings', emoji: '⚙️', label: 'Settings', nav: 'Settings' },
]

const COMING_SOON = [
  { key: 'invoices', emoji: '🧾', label: 'Invoices' },
  { key: 'messages', emoji: '💬', label: 'Messages' },
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
      <View style={s.glowOrb} />
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
              <View style={s.menuIconWrap}>
                <Text style={s.menuEmoji}>{item.emoji}</Text>
              </View>
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
                <View style={s.menuIconWrap}>
                  <Text style={s.menuEmoji}>{item.emoji}</Text>
                </View>
                <Text style={s.menuLabel}>{item.label}</Text>
                <View style={s.soonBadge}>
                  <Text style={s.soonText}>Soon</Text>
                </View>
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
  glowOrb: {
    position: 'absolute',
    top: 40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
  },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  menuContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
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
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuEmoji: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  soonBadge: {
    backgroundColor: colors.primaryLight,
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
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: colors.red },
  version: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 20 },
})
