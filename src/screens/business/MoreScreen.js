import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'

const MENU_ITEMS = [
  { key: 'schedule', emoji: '📅', label: 'Schedule' },
  { key: 'invoices', emoji: '🧾', label: 'Invoices' },
  { key: 'staff', emoji: '👤', label: 'Staff' },
  { key: 'analytics', emoji: '📊', label: 'Analytics' },
  { key: 'messages', emoji: '💬', label: 'Messages' },
  { key: 'settings', emoji: '⚙️', label: 'Settings' },
  { key: 'booking_link', emoji: '🔗', label: 'Booking Link' },
]

export default function MoreScreen() {
  const { signOut } = useAuth()

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

  const handleMenuPress = (item) => {
    // Future navigation to individual screens
    Alert.alert(item.label, 'Coming soon!')
  }

  return (
    <View style={s.container}>
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
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
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
  menuItemLast: {
    borderBottomWidth: 0,
  },
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
