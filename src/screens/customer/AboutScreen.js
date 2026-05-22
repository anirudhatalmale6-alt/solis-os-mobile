import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { colors, shadows } from '../../theme/colors'

export default function AboutScreen({ navigation }) {
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
        <Text style={s.headerTitle}>About Solis OS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.logoWrap}>
          <Image source={require('../../assets/logo_solis.png')} style={s.logo} />
          <Text style={s.appName}>Solis OS</Text>
          <Text style={s.version}>Version 1.3.0</Text>
        </View>

        <LinearGradient
          colors={['rgba(245,158,11,0.08)', 'rgba(245,158,11,0.02)']}
          style={s.descCard}
        >
          <Text style={s.descText}>
            Solis OS is the future of business management. Discover local businesses, book appointments instantly, and enjoy a seamless experience — all in one app.
          </Text>
        </LinearGradient>

        <Text style={s.sectionTitle}>For Businesses</Text>
        <View style={s.featureCard}>
          <FeatureRow icon="calendar-outline" text="Smart booking & scheduling" />
          <FeatureRow icon="people-outline" text="Customer management & loyalty" />
          <FeatureRow icon="receipt-outline" text="Invoices & expense tracking" />
          <FeatureRow icon="bar-chart-outline" text="Analytics & insights" />
          <FeatureRow icon="logo-whatsapp" text="WhatsApp integration" />
        </View>

        <Text style={s.sectionTitle}>For Customers</Text>
        <View style={s.featureCard}>
          <FeatureRow icon="search-outline" text="Discover businesses near you" />
          <FeatureRow icon="time-outline" text="Book appointments instantly" />
          <FeatureRow icon="compass-outline" text="Browse services & prices" />
          <FeatureRow icon="star-outline" text="Free forever" />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL('https://solis-os.com')}
        >
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.websiteBtn}>
            <Text style={s.websiteBtnText}>Visit solis-os.com</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openURL('https://solis-os.com/privacy-policy.html')}
        >
          <Text style={s.link}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openURL('https://solis-os.com/delete-account.html')}
        >
          <Text style={s.link}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={s.copyright}>{'©'} 2026 Solis OS. All rights reserved.</Text>
      </ScrollView>
    </View>
  )
}

function FeatureRow({ icon, text }) {
  return (
    <View style={s.featureRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={s.featureText}>{text}</Text>
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
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 100, alignItems: 'center' },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 14,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  version: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  descCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
    alignSelf: 'stretch',
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  featureCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 24,
    alignSelf: 'stretch',
    gap: 14,
    ...shadows.card,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  websiteBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 24,
    ...shadows.button,
  },
  websiteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  link: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 12,
  },
  copyright: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 16,
  },
})
