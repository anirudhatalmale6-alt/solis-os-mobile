import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
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

  const upcoming = bookings.filter(b => b.date >= new Date().toISOString().split('T')[0] && b.status !== 'cancelled')
  const past = bookings.filter(b => b.date < new Date().toISOString().split('T')[0] || b.status === 'cancelled')

  return (
    <View style={s.container}>
      <View style={s.glowOrb} />
      <View style={s.header}>
        <Text style={s.title}>My Bookings</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {bookings.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>📅</Text>
            <Text style={s.emptyTitle}>No bookings yet</Text>
            <Text style={s.emptyDesc}>Browse businesses and book your first appointment</Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Upcoming</Text>
                {upcoming.map(b => (
                  <View key={b.id} style={s.bookingCard}>
                    <View style={s.bookingGlow} />
                    <View style={s.bookingTop}>
                      <Text style={s.bookingService}>{b.service_name}</Text>
                      <View style={[s.statusBadge, b.status === 'confirmed' ? s.statusConfirmed : s.statusPending]}>
                        <Text style={[s.statusText, b.status === 'confirmed' ? { color: colors.green } : { color: colors.primary }]}>{b.status}</Text>
                      </View>
                    </View>
                    <Text style={s.bookingDate}>📅 {b.date} at {b.time}</Text>
                    {b.price > 0 && <Text style={s.bookingPrice}>${b.price}</Text>}
                  </View>
                ))}
              </>
            )}

            {past.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Past</Text>
                {past.map(b => (
                  <View key={b.id} style={[s.bookingCard, s.bookingCardPast]}>
                    <View style={s.bookingTop}>
                      <Text style={[s.bookingService, { opacity: 0.6 }]}>{b.service_name}</Text>
                      <View style={[s.statusBadge, b.status === 'cancelled' ? s.statusCancelled : s.statusDone]}>
                        <Text style={[s.statusText, b.status === 'cancelled' ? { color: colors.red } : { color: colors.blue }]}>
                          {b.status === 'cancelled' ? 'cancelled' : 'completed'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[s.bookingDate, { opacity: 0.5 }]}>📅 {b.date} at {b.time}</Text>
                  </View>
                ))}
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
  glowOrb: {
    position: 'absolute',
    top: 30,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
  },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  bookingCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
    ...shadows.card,
  },
  bookingGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  bookingCardPast: { opacity: 0.6 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookingService: { fontSize: 15, fontWeight: '700', color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusConfirmed: { backgroundColor: colors.greenLight, borderColor: 'rgba(34, 197, 94, 0.2)' },
  statusPending: { backgroundColor: colors.primaryLight, borderColor: colors.borderGlow },
  statusCancelled: { backgroundColor: colors.redLight, borderColor: 'rgba(239, 68, 68, 0.2)' },
  statusDone: { backgroundColor: colors.blueLight, borderColor: 'rgba(59, 130, 246, 0.2)' },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  bookingDate: { fontSize: 13, color: colors.textMuted },
  bookingPrice: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 8 },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
    ...shadows.card,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
})
