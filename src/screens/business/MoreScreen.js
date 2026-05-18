import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { useAuth } from '../../lib/AuthContext'
import ScreenBackground from '../../components/ScreenBackground'

const MENU_ITEMS = [
  { key: 'WhatsApp', icon: 'whatsapp', color: '#25D366', label: 'Connect WhatsApp', nav: 'WhatsAppConnect' },
  { key: 'Services', icon: 'wrench', color: '#60a5fa', label: 'Services', nav: 'Services' },
  { key: 'Schedule', icon: 'calendar-clock', color: '#f59e0b', label: 'Schedule', nav: 'Schedule' },
  { key: 'Staff', icon: 'account-group', color: '#a78bfa', label: 'Staff', nav: 'Staff' },
  { key: 'Analytics', icon: 'chart-line', color: '#2dd4bf', label: 'Analytics', nav: 'Analytics' },
  { key: 'Invoices', icon: 'file-document-outline', color: '#f59e0b', label: 'Invoices', nav: 'Invoices' },
  { key: 'Expenses', icon: 'cash-minus', color: '#f43f5e', label: 'Expenses', nav: 'Expenses' },
  { key: 'Promotions', icon: 'gift-outline', color: '#f97316', label: 'Promotions', nav: 'Promotions' },
  { key: 'Loyalty', icon: 'star-outline', color: '#eab308', label: 'Loyalty & Rewards', nav: 'Loyalty' },
  { key: 'Waitlist', icon: 'timer-sand', color: '#60a5fa', label: 'Digital Waitlist', nav: 'Waitlist' },
  { key: 'Notifications', icon: 'bell-outline', color: '#a78bfa', label: 'Notifications', nav: 'Notifications' },
  { key: 'BookingLink', icon: 'link-variant', color: '#2dd4bf', label: 'Booking Link', nav: 'BookingLink' },
  { key: 'Settings', icon: 'cog-outline', color: '#8a8f9e', label: 'Settings', nav: 'Settings' },
]

const COMING_SOON = []

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
    <ScreenBackground theme="royal">
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
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
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
                  <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
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
    </ScreenBackground>
  )
}

const s = StyleSheet.create({
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
