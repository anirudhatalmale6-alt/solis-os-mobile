import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function DashboardScreen() {
  const { user } = useAuth()
  const [business, setBusiness] = useState(null)
  const [stats, setStats] = useState({ todayBookings: 0, todayRevenue: 0, totalCustomers: 0, rating: 4.9 })
  const [upcoming, setUpcoming] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    if (!user?.id) return
    const { data: bizArr } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
    const biz = bizArr?.[0]
    if (!biz) return
    setBusiness(biz)

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

  const STAT_CARDS = [
    { icon: '📅', value: stats.todayBookings, label: "Today's Bookings", color: colors.primary, bg: colors.primaryLight },
    { icon: '💰', value: `$${stats.todayRevenue}`, label: "Today's Revenue", color: colors.green, bg: colors.greenLight },
    { icon: '👥', value: stats.totalCustomers, label: 'Total Customers', color: colors.blue, bg: colors.blueLight },
    { icon: '⭐', value: stats.rating, label: 'Rating', color: colors.purple, bg: colors.purpleLight },
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
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={s.header}>
          <View>
            <Text style={s.greetingSub}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</Text>
            <Text style={s.bizName}>{business?.name || 'My Business'}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        </View>

        <View style={s.statsGrid}>
          {STAT_CARDS.map((st, i) => (
            <View key={i} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: st.bg }]}>
                <Text style={s.statEmoji}>{st.icon}</Text>
              </View>
              <Text style={s.statVal}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Upcoming</Text>

        {upcoming.length === 0 ? (
          <View style={s.emptyUpcoming}>
            <Text style={s.emptyText}>No upcoming bookings</Text>
          </View>
        ) : (
          upcoming.map((b, i) => {
            const ac = AVATAR_COLORS[i % AVATAR_COLORS.length]
            const customerInitials = (b.customer_name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            return (
              <View key={b.id} style={s.bookingRow}>
                <View style={[s.bookingAvatar, { backgroundColor: ac.bg }]}>
                  <Text style={[s.bookingAvatarText, { color: ac.color }]}>{customerInitials}</Text>
                </View>
                <View style={s.bookingInfo}>
                  <Text style={s.bookingName}>{b.customer_name || 'Customer'}</Text>
                  <Text style={s.bookingService}>{b.service_name}</Text>
                </View>
                <Text style={s.bookingTime}>{b.time}</Text>
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
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetingSub: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  bizName: { fontSize: 22, fontWeight: '800', color: colors.text },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.button },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.textDark },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  statCard: { width: '48%', backgroundColor: colors.bgCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statEmoji: { fontSize: 16 },
  statVal: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 8, gap: 12 },
  bookingAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookingAvatarText: { fontSize: 14, fontWeight: '700' },
  bookingInfo: { flex: 1 },
  bookingName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  bookingService: { fontSize: 12, color: colors.textMuted },
  bookingTime: { fontSize: 13, fontWeight: '600', color: colors.primary },
  emptyUpcoming: { backgroundColor: colors.bgCard, borderRadius: 14, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyText: { fontSize: 14, color: colors.textMuted },
})
