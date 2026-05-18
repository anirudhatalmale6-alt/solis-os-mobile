import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const NOTIF_TYPES = {
  booking: { icon: 'calendar-check', color: colors.blue, gradient: ['rgba(59,130,246,0.2)', 'rgba(59,130,246,0.05)'] },
  payment: { icon: 'cash-check', color: colors.green, gradient: ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.05)'] },
  cancellation: { icon: 'calendar-remove', color: colors.red, gradient: ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.05)'] },
  reminder: { icon: 'bell-outline', color: colors.primary, gradient: ['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.05)'] },
  customer: { icon: 'account-outline', color: colors.purple, gradient: ['rgba(168,85,247,0.2)', 'rgba(168,85,247,0.05)'] },
  system: { icon: 'cog-outline', color: colors.teal, gradient: ['rgba(20,184,166,0.2)', 'rgba(20,184,166,0.05)'] },
}

export default function NotificationsScreen() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetchNotifications = async () => {
    if (!user?.id) return
    const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
    const bizId = bizArr?.[0]?.id
    if (!bizId) return

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })
      .limit(50)

    const notifs = (bookings || []).map(b => {
      let type = 'booking'
      let title = 'New Booking'
      let message = `${b.customer_name || 'A customer'} booked ${b.service_name || 'a service'}`

      if (b.status === 'cancelled') {
        type = 'cancellation'
        title = 'Booking Cancelled'
        message = `${b.customer_name || 'A customer'} cancelled their ${b.service_name || 'appointment'}`
      } else if (b.status === 'completed') {
        type = 'payment'
        title = 'Booking Completed'
        message = `${b.service_name || 'Service'} with ${b.customer_name || 'customer'} - $${b.price || 0}`
      }

      return {
        id: b.id,
        type,
        title,
        message,
        time: b.created_at,
        read: b.status === 'completed',
      }
    })

    setNotifications(notifs)
  }

  useFocusEffect(useCallback(() => { fetchNotifications() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter)

  const unreadCount = notifications.filter(n => !n.read).length

  const timeAgo = (dateStr) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'booking', label: 'Bookings' },
    { key: 'payment', label: 'Payments' },
    { key: 'cancellation', label: 'Cancelled' },
  ]

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(168,85,247,0.1)', 'rgba(59,130,246,0.05)', 'transparent']}
        style={s.headerGlow}
      />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />

      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={s.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {notifications.length > 0 && (
            <TouchableOpacity
              style={s.clearBtn}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Clear All', 'Delete all notifications?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear All', style: 'destructive', onPress: () => setNotifications([]) },
              ])}
            >
              <Text style={s.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
          {unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            activeOpacity={0.8}
            onPress={() => setFilter(f.key)}
          >
            {filter === f.key ? (
              <LinearGradient
                colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.08)']}
                style={[s.filterChip, s.filterChipActive]}
              >
                <Text style={[s.filterText, s.filterTextActive]}>{f.label}</Text>
              </LinearGradient>
            ) : (
              <View style={s.filterChip}>
                <Text style={s.filterText}>{f.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filtered.length === 0 ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.empty}
          >
            <MaterialCommunityIcons name="bell-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No notifications yet</Text>
            <Text style={s.emptyDesc}>Activity from bookings will appear here</Text>
          </LinearGradient>
        ) : (
          filtered.map(notif => {
            const typeConfig = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system
            return (
              <TouchableOpacity
                key={notif.id}
                style={[s.notifCard, !notif.read && s.notifUnread]}
                activeOpacity={0.8}
                onLongPress={() => Alert.alert('Delete', 'Remove this notification?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => setNotifications(prev => prev.filter(n => n.id !== notif.id)) },
                ])}
              >
                {!notif.read && <View style={[s.unreadDot, { backgroundColor: typeConfig.color }]} />}
                <LinearGradient colors={typeConfig.gradient} style={s.notifIcon}>
                  <MaterialCommunityIcons name={typeConfig.icon} size={20} color={typeConfig.color} />
                </LinearGradient>
                <View style={s.notifContent}>
                  <Text style={s.notifTitle}>{notif.title}</Text>
                  <Text style={s.notifMsg} numberOfLines={2}>{notif.message}</Text>
                  <Text style={s.notifTime}>{timeAgo(notif.time)}</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  glowOrb1: {
    position: 'absolute', top: 30, right: -40, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  glowOrb2: {
    position: 'absolute', bottom: 200, left: -50, width: 130, height: 130,
    borderRadius: 65, backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: colors.purple, marginTop: 2, fontWeight: '500' },
  unreadBadge: {
    backgroundColor: colors.red, width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  clearBtnText: { fontSize: 11, color: colors.red, fontWeight: '600' },
  filterScroll: { maxHeight: 56, marginTop: 12 },
  filterRow: { paddingHorizontal: 20, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: { borderColor: colors.borderGlow },
  filterText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  filterTextActive: { color: colors.primary, fontWeight: '600' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8, gap: 12, ...shadows.card,
  },
  notifUnread: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  unreadDot: {
    position: 'absolute', top: 16, left: 8, width: 6, height: 6, borderRadius: 3,
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 3 },
  notifMsg: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: colors.textMuted },
  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 20,
  },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
