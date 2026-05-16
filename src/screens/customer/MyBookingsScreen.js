import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors } from '../../theme/colors'
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
      <View style={s.header}>
        <Text style={s.title}>My Bookings</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {bookings.length === 0 ? (
          <View style={s.empty}>
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
                    <View style={s.bookingTop}>
                      <Text style={s.bookingService}>{b.service_name}</Text>
                      <View style={[s.statusBadge, b.status === 'confirmed' ? s.statusConfirmed : s.statusPending]}>
                        <Text style={s.statusText}>{b.status}</Text>
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
                        <Text style={s.statusText}>{b.status === 'cancelled' ? 'cancelled' : 'completed'}</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  bookingCard: { backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  bookingCardPast: { opacity: 0.6 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookingService: { fontSize: 15, fontWeight: '700', color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  statusConfirmed: { backgroundColor: colors.greenLight },
  statusPending: { backgroundColor: colors.primaryLight },
  statusCancelled: { backgroundColor: colors.redLight },
  statusDone: { backgroundColor: colors.blueLight },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'capitalize' },
  bookingDate: { fontSize: 13, color: colors.textMuted },
  bookingPrice: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
})
