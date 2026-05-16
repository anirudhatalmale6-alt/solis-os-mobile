import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const STATUS_STYLES = {
  confirmed: { bg: colors.greenLight, color: colors.green, label: 'Confirmed' },
  pending: { bg: colors.primaryLight, color: colors.primary, label: 'Pending' },
  cancelled: { bg: colors.redLight, color: colors.red, label: 'Cancelled' },
}

export default function BookingsScreen() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const fetchBookings = async () => {
    if (!user?.id) return
    const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
    const bizId = bizArr?.[0]?.id
    if (!bizId) return

    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('business_id', bizId)
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    setBookings(data || [])
  }

  useFocusEffect(useCallback(() => { fetchBookings() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBookings()
    setRefreshing(false)
  }

  const today = new Date().toISOString().split('T')[0]

  const grouped = {
    today: bookings.filter(b => b.date === today),
    upcoming: bookings.filter(b => b.date > today),
    past: bookings.filter(b => b.date < today),
  }

  const renderBooking = (booking) => {
    const status = STATUS_STYLES[booking.status] || STATUS_STYLES.pending
    const initials = (booking.customer_name || '??')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    const isExpanded = expandedId === booking.id

    return (
      <TouchableOpacity
        key={booking.id}
        style={s.bookingCard}
        activeOpacity={0.8}
        onPress={() => setExpandedId(isExpanded ? null : booking.id)}
      >
        <View style={s.bookingRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={s.bookingInfo}>
            <Text style={s.customerName}>{booking.customer_name || 'Customer'}</Text>
            <Text style={s.serviceName}>{booking.service_name || 'Service'}</Text>
          </View>
          <View style={s.rightCol}>
            <Text style={s.bookingTime}>{booking.time || '--:--'}</Text>
            <View style={[s.badge, { backgroundColor: status.bg }]}>
              <Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {isExpanded && (
          <View style={s.details}>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Date</Text>
              <Text style={s.detailValue}>{booking.date}</Text>
            </View>
            {booking.price != null && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Price</Text>
                <Text style={s.detailValue}>${booking.price}</Text>
              </View>
            )}
            {booking.notes && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Notes</Text>
                <Text style={s.detailValue}>{booking.notes}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderSection = (title, items, emoji) => {
    if (items.length === 0) return null
    return (
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionEmoji}>{emoji}</Text>
          <Text style={s.sectionTitle}>{title}</Text>
          <Text style={s.sectionCount}>{items.length}</Text>
        </View>
        {items.map(renderBooking)}
      </View>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Bookings</Text>
        <Text style={s.headerSub}>{bookings.length} total</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {bookings.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📅</Text>
            <Text style={s.emptyTitle}>No bookings yet</Text>
            <Text style={s.emptyDesc}>Bookings from customers will appear here</Text>
          </View>
        ) : (
          <>
            {renderSection('Today', grouped.today, '📍')}
            {renderSection('Upcoming', grouped.upcoming, '🗓️')}
            {renderSection('Past', grouped.past, '🕐')}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionEmoji: { fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  sectionCount: { fontSize: 12, color: colors.textMuted, backgroundColor: colors.bgInput, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  bookingCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    ...shadows.card,
  },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  bookingInfo: { flex: 1 },
  customerName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  serviceName: { fontSize: 12, color: colors.textMuted },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  bookingTime: { fontSize: 13, fontWeight: '600', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 12, color: colors.textMuted },
  detailValue: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
