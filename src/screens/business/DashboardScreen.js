import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const BOT_URL = 'http://146.190.26.115:3003'

export default function DashboardScreen() {
  const { user } = useAuth()
  const navigation = useNavigation()
  const [business, setBusiness] = useState(null)
  const [whatsappStatus, setWhatsappStatus] = useState(null)
  const [stats, setStats] = useState({ todayBookings: 0, todayRevenue: 0, totalCustomers: 0, rating: 4.9 })
  const [upcoming, setUpcoming] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    if (!user?.id) return
    const { data: bizArr } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
    const biz = bizArr?.[0]
    if (!biz) return
    setBusiness(biz)

    try {
      const waResp = await fetch(`${BOT_URL}/api/whatsapp/status/${biz.id}`)
      const waData = await waResp.json()
      setWhatsappStatus(waData.status)
    } catch { setWhatsappStatus(null) }

    const today = new Date().toISOString().split('T')[0]

    const [bookingsRes, customersRes] = await Promise.all([
      supabase.from('bookings').select('*').eq('business_id', biz.id).order('date', { ascending: true }).order('time', { ascending: true }),
      supabase.from('customers').select('id').eq('business_id', biz.id),
    ])

    const allBookings = bookingsRes.data || []
    const todayBookings = allBookings.filter(b => b.date === today && b.status !== 'cancelled')
    const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.price || 0), 0)
    const upcomingBookings = allBookings.filter(b => b.date >= today && b.status !== 'cancelled').slice(0, 5)

    setStats({
      todayBookings: todayBookings.length,
      todayRevenue: todayRevenue,
      totalCustomers: customersRes.data?.length || 0,
      rating: 4.9,
    })
    setUpcoming(upcomingBookings)
  }

  useFocusEffect(useCallback(() => { fetchData() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const initials = business?.name
    ? business.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const STAT_CARDS = [
    { icon: 'calendar-check', value: stats.todayBookings, label: "Today's Bookings", gradient: ['#f59e0b', '#f97316'] },
    { icon: 'cash', value: `$${stats.todayRevenue}`, label: "Today's Revenue", gradient: ['#22c55e', '#10b981'] },
    { icon: 'account-group', value: stats.totalCustomers, label: 'Total Customers', gradient: ['#3b82f6', '#6366f1'] },
    { icon: 'star-outline', value: stats.rating, label: 'Rating', gradient: ['#a855f7', '#ec4899'] },
  ]

  const AVATAR_COLORS = [
    { bg: colors.primaryLight, color: colors.primary },
    { bg: colors.blueLight, color: colors.blue },
    { bg: colors.greenLight, color: colors.green },
    { bg: colors.purpleLight, color: colors.purple },
    { bg: colors.redLight, color: colors.red },
  ]

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)', 'transparent']}
        style={s.headerGradient}
      />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />
      <View style={s.glowOrb3} />

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={s.header}>
          <View>
            <Text style={s.greetingSub}>{greeting}</Text>
            <Text style={s.bizName}>{business?.name || 'My Business'}</Text>
          </View>
          {business?.logo_url ? (
            <Image source={{ uri: business.logo_url }} style={s.avatarImage} />
          ) : (
            <LinearGradient colors={['#f59e0b', '#f97316']} style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </LinearGradient>
          )}
        </View>

        <LinearGradient
          colors={['rgba(245,158,11,0.08)', 'rgba(249,115,22,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.welcomeBanner}
        >
          <View style={s.welcomeGlow} />
          <Text style={s.welcomeTitle}>Your Dashboard</Text>
          <Text style={s.welcomeDesc}>Here's how your business is performing today</Text>
        </LinearGradient>

        <View style={s.statsGrid}>
          {STAT_CARDS.map((st, i) => (
            <View key={i} style={s.statCard}>
              <LinearGradient
                colors={st.gradient}
                style={s.statAccent}
              />
              <View style={s.statContent}>
                <View style={s.statHeader}>
                  <MaterialCommunityIcons name={st.icon} size={18} color={colors.text} />
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
                <Text style={s.statVal}>{st.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('More', { screen: 'WhatsAppConnect' })}
          style={s.whatsappCard}
        >
          <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
          <View style={s.whatsappCardContent}>
            <Text style={s.whatsappCardTitle}>WhatsApp AI Chatbot</Text>
            <Text style={s.whatsappCardStatus}>
              {whatsappStatus === 'connected' ? 'Active - Replying to customers 24/7' : 'Tap to connect your WhatsApp'}
            </Text>
          </View>
          <View style={[s.whatsappDot, whatsappStatus === 'connected' && s.whatsappDotActive]} />
        </TouchableOpacity>

        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Upcoming</Text>
          <View style={s.sectionBadge}>
            <Text style={s.sectionBadgeText}>{upcoming.length}</Text>
          </View>
        </View>

        {upcoming.length === 0 ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.emptyUpcoming}
          >
            <MaterialCommunityIcons name="calendar-outline" size={40} color={colors.textMuted} />
            <Text style={s.emptyText}>No upcoming bookings</Text>
            <Text style={s.emptyDesc}>Bookings will show up here</Text>
          </LinearGradient>
        ) : (
          upcoming.map((b, i) => {
            const ac = AVATAR_COLORS[i % AVATAR_COLORS.length]
            const customerInitials = (b.customer_name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            return (
              <View key={b.id} style={s.bookingRow}>
                <View style={s.bookingGlowDot} />
                <View style={[s.bookingAvatar, { backgroundColor: ac.bg }]}>
                  <Text style={[s.bookingAvatarText, { color: ac.color }]}>{customerInitials}</Text>
                </View>
                <View style={s.bookingInfo}>
                  <Text style={s.bookingName}>{b.customer_name || 'Customer'}</Text>
                  <Text style={s.bookingService}>{b.service_name}</Text>
                </View>
                <View style={s.bookingRight}>
                  <LinearGradient
                    colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']}
                    style={s.bookingTimeWrap}
                  >
                    <Text style={s.bookingTime}>{b.time}</Text>
                  </LinearGradient>
                  <Text style={s.bookingDate}>{b.date}</Text>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  glowOrb1: {
    position: 'absolute',
    top: -30,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  glowOrb2: {
    position: 'absolute',
    top: 200,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  glowOrb3: {
    position: 'absolute',
    bottom: 120,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
  },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingSub: { fontSize: 14, color: colors.primary, marginBottom: 2, fontWeight: '600' },
  bizName: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#000' },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    ...shadows.button,
  },
  welcomeBanner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    overflow: 'hidden',
  },
  welcomeGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  welcomeTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  welcomeDesc: { fontSize: 13, color: colors.textSecondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.card,
  },
  statAccent: {
    height: 3,
    width: '100%',
  },
  statContent: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statVal: { fontSize: 28, fontWeight: '800', color: colors.text },
  whatsappCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(37,211,102,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.2)', marginBottom: 24,
  },
  whatsappCardContent: { flex: 1 },
  whatsappCardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  whatsappCardStatus: { fontSize: 12, color: colors.textSecondary },
  whatsappDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6b7280' },
  whatsappDotActive: { backgroundColor: '#25D366' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  sectionBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
    gap: 12,
    overflow: 'hidden',
    ...shadows.card,
  },
  bookingGlowDot: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  bookingAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bookingAvatarText: { fontSize: 15, fontWeight: '700' },
  bookingInfo: { flex: 1 },
  bookingName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
  bookingService: { fontSize: 12, color: colors.textMuted },
  bookingRight: { alignItems: 'flex-end' },
  bookingTimeWrap: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    marginBottom: 4,
  },
  bookingTime: { fontSize: 13, fontWeight: '700', color: colors.primary },
  bookingDate: { fontSize: 10, color: colors.textMuted },
  emptyUpcoming: {
    borderRadius: 18,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.card,
  },
  emptyEmoji: { marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
