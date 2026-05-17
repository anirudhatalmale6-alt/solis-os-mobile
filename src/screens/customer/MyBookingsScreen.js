import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function MyBookingsScreen() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchBookings = async () => {
    if (!user?.email) return
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_email', user.email)
      .order('date', { ascending: false })
    setBookings(data || [])
  }

  useFocusEffect(useCallback(() => { fetchBookings() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBookings()
    setRefreshing(false)
  }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = bookings.filter(b => b.date >= today && b.status !== 'cancelled')
  const past = bookings.filter(b => b.date < today || b.status === 'cancelled')

  const STATUS_CONFIG = {
    confirmed: { gradient: ['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)'], color: colors.green, border: 'rgba(34,197,94,0.25)' },
    pending: { gradient: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)'], color: colors.primary, border: 'rgba(245,158,11,0.25)' },
    cancelled: { gradient: ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)'], color: colors.red, border: 'rgba(239,68,68,0.25)' },
    completed: { gradient: ['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)'], color: colors.blue, border: 'rgba(59,130,246,0.25)' },
  }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(59,130,246,0.1)', 'rgba(245,158,11,0.05)', 'transparent']}
        style={s.headerGlow}
      />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />
      <View style={s.header}>
        <Text style={s.title}>My Bookings</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>{bookings.length} total</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {bookings.length === 0 ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.emptyCard}
          >
            <MaterialCommunityIcons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No bookings yet</Text>
            <Text style={s.emptyDesc}>Browse businesses and book your first appointment</Text>
          </LinearGradient>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <View style={s.sectionRow}>
                  <Text style={s.sectionLabel}>Upcoming</Text>
                  <View style={s.sectionBadge}>
                    <Text style={s.sectionBadgeText}>{upcoming.length}</Text>
                  </View>
                </View>
                {upcoming.map(b => {
                  const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending
                  return (
                    <View key={b.id} style={s.bookingCard}>
                      <View style={s.bookingAccent} />
                      <View style={s.bookingTop}>
                        <Text style={s.bookingService}>{b.service_name}</Text>
                        <LinearGradient colors={sc.gradient} style={[s.statusBadge, { borderColor: sc.border }]}>
                          <Text style={[s.statusText, { color: sc.color }]}>{b.status}</Text>
                        </LinearGradient>
                      </View>
                      <View style={s.bookingDetails}>
                        <Text style={s.bookingDate}>{b.date} at {b.time}</Text>
                        {b.price > 0 && <Text style={s.bookingPrice}>${b.price}</Text>}
                      </View>
                    </View>
                  )
                })}
              </>
            )}

            {past.length > 0 && (
              <>
                <View style={s.sectionRow}>
                  <Text style={s.sectionLabel}>Past</Text>
                  <View style={[s.sectionBadge, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={[s.sectionBadgeText, { color: colors.textMuted }]}>{past.length}</Text>
                  </View>
                </View>
                {past.map(b => {
                  const sc = b.status === 'cancelled' ? STATUS_CONFIG.cancelled : STATUS_CONFIG.completed
                  return (
                    <View key={b.id} style={[s.bookingCard, { opacity: 0.6 }]}>
                      <View style={s.bookingTop}>
                        <Text style={s.bookingService}>{b.service_name}</Text>
                        <LinearGradient colors={sc.gradient} style={[s.statusBadge, { borderColor: sc.border }]}>
                          <Text style={[s.statusText, { color: sc.color }]}>
                            {b.status === 'cancelled' ? 'cancelled' : 'completed'}
                          </Text>
                        </LinearGradient>
                      </View>
                      <Text style={s.bookingDate}>{b.date} at {b.time}</Text>
                    </View>
                  )
                })}
              </>
            )}
          </>
        )}
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
    height: 250,
  },
  glowOrb1: {
    position: 'absolute',
    top: 30,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  glowOrb2: {
    position: 'absolute',
    top: 250,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  countText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 12, gap: 10 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  sectionBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  bookingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
    overflow: 'hidden',
    ...shadows.card,
  },
  bookingAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bookingService: { fontSize: 16, fontWeight: '700', color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  bookingDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingDate: { fontSize: 13, color: colors.textMuted },
  bookingPrice: { fontSize: 17, fontWeight: '800', color: colors.primary },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
    ...shadows.card,
  },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
})
