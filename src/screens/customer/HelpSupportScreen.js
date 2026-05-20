import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { colors, shadows } from '../../theme/colors'

const FAQ = [
  {
    q: 'How do I book an appointment?',
    a: 'Browse businesses on the Home or Explore tab, tap on a business to view their services, select a service and pick a date and time that works for you.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes. Go to the Bookings tab, find your upcoming booking, and tap on it to view details. You can cancel from there.',
  },
  {
    q: 'Do I need an account to browse?',
    a: 'No! You can browse businesses and services as a guest. You only need to create an account when you want to make a booking.',
  },
  {
    q: 'How do I create a business account?',
    a: 'Go back to the start screen and select "I\'m a Business". You can sign up with your email and start managing your business right away.',
  },
  {
    q: 'Is Solis OS free for customers?',
    a: 'Yes, Solis OS is completely free for customers. Browse, discover, and book with no charges.',
  },
]

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(!open)} style={s.faqItem}>
      <View style={s.faqHeader}>
        <Text style={s.faqQ}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </View>
      {open && <Text style={s.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  )
}

export default function HelpSupportScreen({ navigation }) {
  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(245,158,11,0.1)', 'transparent']}
        style={s.headerGlow}
      />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL('https://solis-os.com')}
        >
          <LinearGradient
            colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)']}
            style={s.contactCard}
          >
            <LinearGradient colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.08)']} style={s.contactIcon}>
              <MaterialCommunityIcons name="web" size={22} color={colors.primary} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.contactLabel}>Visit our website</Text>
              <Text style={s.contactValue}>solis-os.com</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL('https://wa.me/447700168964')}
        >
          <LinearGradient
            colors={['rgba(34,197,94,0.12)', 'rgba(34,197,94,0.04)']}
            style={s.contactCard}
          >
            <LinearGradient colors={['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.08)']} style={s.contactIcon}>
              <Ionicons name="logo-whatsapp" size={22} color={colors.green} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.contactLabel}>Chat with us</Text>
              <Text style={s.contactValue}>WhatsApp Support</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Frequently Asked Questions</Text>

        <View style={s.faqContainer}>
          {FAQ.map((item, i) => (
            <FAQItem key={i} item={item} />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 14,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 28,
    marginBottom: 14,
  },
  faqContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    ...shadows.card,
  },
  faqItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  faqA: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 10,
  },
})
