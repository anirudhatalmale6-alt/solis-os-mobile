import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import ScreenBackground from '../../components/ScreenBackground'

const STATUS_STYLES = {
  confirmed: { gradient: ['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)'], color: colors.green, border: 'rgba(34,197,94,0.25)', label: 'Confirmed' },
  pending: { gradient: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)'], color: colors.primary, border: 'rgba(245,158,11,0.25)', label: 'Pending' },
  cancelled: { gradient: ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)'], color: colors.red, border: 'rgba(239,68,68,0.25)', label: 'Cancelled' },
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

  const deleteBooking = (booking) => {
    Alert.alert('Delete Booking', `Delete ${booking.customer_name || 'this'} booking?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('bookings').delete().eq('id', booking.id)
        setBookings(prev => prev.filter(b => b.id !== booking.id))
        setExpandedId(null)
      }},
    ])
  }

  const clearPastBookings = () => {
    const pastBookings = bookings.filter(b => b.date < today)
    if (pastBookings.length === 0) { Alert.alert('No Past Bookings', 'There are no past bookings to clear.'); return }
    Alert.alert('Clear Past Bookings', `Delete ${pastBookings.length} past booking${pastBookings.length > 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => {
        await Promise.all(pastBookings.map(b => supabase.from('bookings').delete().eq('id', b.id)))
        setBookings(prev => prev.filter(b => b.date >= today))
      }},
    ])
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
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const isExpanded = expandedId === booking.id

    return (
      <TouchableOpacity
        key={booking.id}
        style={s.bookingCard}
        activeOpacity={0.8}
        onPress={() => setExpandedId(isExpanded ? null : booking.id)}
      >
        <View style={s.bookingRow}>
          <LinearGradient colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.08)']} style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={s.bookingInfo}>
            <Text style={s.customerName}>{booking.customer_name || 'Customer'}</Text>
            <Text style={s.serviceName}>{booking.service_name || 'Service'}</Text>
          </View>
          <View style={s.rightCol}>
            <Text style={s.bookingTime}>{booking.time || '--:--'}</Text>
            <LinearGradient colors={status.gradient} style={[s.badge, { borderColor: status.border }]}>
              <Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text>
            </LinearGradient>
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
                <Text style={[s.detailValue, { color: colors.primary, fontWeight: '700' }]}>${booking.price}</Text>
              </View>
            )}
            {booking.notes && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Notes</Text>
                <Text style={s.detailValue}>{booking.notes}</Text>
              </View>
            )}
            <TouchableOpacity style={s.deleteBtn} onPress={() => deleteBooking(booking)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="delete-outline" size={16} color={colors.red} />
              <Text style={s.deleteBtnText}>Delete Booking</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderSection = (title, items) => {
    if (items.length === 0) return null
    return (
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{title}</Text>
          <View style={s.sectionCountWrap}>
            <Text style={s.sectionCount}>{items.length}</Text>
          </View>
        </View>
        {items.map(renderBooking)}
      </View>
    )
  }

  return (
    <ScreenBackground theme="golden">
      <View style={s.header}>
        <Text style={s.headerTitle}>Bookings</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {bookings.filter(b => b.date < today).length > 0 && (
            <TouchableOpacity style={s.clearPastBtn} onPress={clearPastBookings} activeOpacity={0.7}>
              <Text style={s.clearPastBtnText}>Clear Past</Text>
            </TouchableOpacity>
          )}
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{bookings.length} total</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {bookings.length === 0 ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.empty}
          >
            <MaterialCommunityIcons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No bookings yet</Text>
            <Text style={s.emptyDesc}>Bookings from customers will appear here</Text>
          </LinearGradient>
        ) : (
          <>
            {renderSection('Today', grouped.today)}
            {renderSection('Upcoming', grouped.upcoming)}
            {renderSection('Past', grouped.past)}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  )
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerBadge: {
    backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: colors.borderGlow,
  },
  headerBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  sectionCountWrap: {
    backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionCount: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  bookingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 8, ...shadows.card,
  },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  bookingInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  serviceName: { fontSize: 12, color: colors.textMuted },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  bookingTime: { fontSize: 13, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  clearPastBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  clearPastBtnText: { fontSize: 11, color: colors.red, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.08)',
  },
  deleteBtnText: { fontSize: 13, color: colors.red, fontWeight: '600' },
  details: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 12, color: colors.textMuted },
  detailValue: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginTop: 20, ...shadows.card,
  },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
