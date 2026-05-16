import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { useFocusEffect } from '@react-navigation/native'

const C = colors

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AnalyticsScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    revenue: 0,
    completionRate: 0,
    uniqueCustomers: 0,
    monthlyTrend: [],
    topServices: [],
    busiestDays: [],
    statusBreakdown: { confirmed: 0, completed: 0, cancelled: 0 },
  })

  const fetchAnalytics = async () => {
    if (!user?.id) return

    const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
    const bizId = bizArr?.[0]?.id
    if (!bizId) return

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('business_id', bizId)

    if (!bookings || bookings.length === 0) {
      setAnalytics({
        totalBookings: 0,
        revenue: 0,
        completionRate: 0,
        uniqueCustomers: 0,
        monthlyTrend: [],
        topServices: [],
        busiestDays: [],
        statusBreakdown: { confirmed: 0, completed: 0, cancelled: 0 },
      })
      setLoading(false)
      return
    }

    // Total bookings
    const totalBookings = bookings.length

    // Revenue (exclude cancelled)
    const revenue = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.price || 0), 0)

    // Completion rate
    const completedCount = bookings.filter(b => b.status === 'completed').length
    const completionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0

    // Unique customers
    const customerNames = new Set(bookings.map(b => b.customer_name).filter(Boolean))
    const uniqueCustomers = customerNames.size

    // Monthly trend (last 6 months)
    const now = new Date()
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const count = bookings.filter(b => {
        const bd = new Date(b.date || b.created_at)
        return bd.getFullYear() === year && bd.getMonth() === month
      }).length
      monthlyTrend.push({ label: MONTHS[month], count })
    }

    // Top services
    const serviceCounts = {}
    bookings.forEach(b => {
      const name = b.service_name || 'Unknown'
      serviceCounts[name] = (serviceCounts[name] || 0) + 1
    })
    const topServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Busiest days
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]
    bookings.forEach(b => {
      const bd = new Date(b.date || b.created_at)
      if (!isNaN(bd.getTime())) {
        dayCounts[bd.getDay()]++
      }
    })
    const busiestDays = DAYS.map((day, i) => ({ day, count: dayCounts[i] }))

    // Status breakdown
    const statusBreakdown = {
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    }

    setAnalytics({
      totalBookings,
      revenue,
      completionRate,
      uniqueCustomers,
      monthlyTrend,
      topServices,
      busiestDays,
      statusBreakdown,
    })
    setLoading(false)
  }

  useFocusEffect(useCallback(() => {
    setLoading(true)
    fetchAnalytics()
  }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const maxMonthly = Math.max(...(analytics.monthlyTrend.map(m => m.count)), 1)
  const maxDay = Math.max(...(analytics.busiestDays.map(d => d.count)), 1)

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {/* Header */}
        <Text style={s.header}>Analytics</Text>

        {/* Top Stats Grid */}
        <View style={s.statsGrid}>
          <View style={[s.statCard, { borderLeftColor: C.primary }]}>
            <Text style={s.statValue}>{analytics.totalBookings}</Text>
            <Text style={s.statLabel}>Total Bookings</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: C.green }]}>
            <Text style={[s.statValue, { color: C.green }]}>${analytics.revenue.toFixed(0)}</Text>
            <Text style={s.statLabel}>Revenue</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: C.blue }]}>
            <Text style={[s.statValue, { color: C.blue }]}>{analytics.completionRate}%</Text>
            <Text style={s.statLabel}>Completion Rate</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: C.purple }]}>
            <Text style={[s.statValue, { color: C.purple }]}>{analytics.uniqueCustomers}</Text>
            <Text style={s.statLabel}>Customers</Text>
          </View>
        </View>

        {/* Monthly Trend */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Monthly Trend</Text>
          <Text style={s.sectionSubtitle}>Bookings per month (last 6 months)</Text>
          <View style={s.chartContainer}>
            {analytics.monthlyTrend.map((m, i) => (
              <View key={i} style={s.barColumn}>
                <Text style={s.barValue}>{m.count}</Text>
                <View style={s.barTrack}>
                  <View
                    style={[
                      s.bar,
                      { height: `${(m.count / maxMonthly) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={s.barLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Services */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Top Services</Text>
          <Text style={s.sectionSubtitle}>Most booked services</Text>
          {analytics.topServices.length === 0 ? (
            <Text style={s.emptyText}>No bookings yet</Text>
          ) : (
            analytics.topServices.map((svc, i) => (
              <View key={i} style={s.serviceRow}>
                <View style={s.serviceRank}>
                  <Text style={s.serviceRankText}>{i + 1}</Text>
                </View>
                <Text style={s.serviceName} numberOfLines={1}>{svc.name}</Text>
                <View style={s.serviceBadge}>
                  <Text style={s.serviceBadgeText}>{svc.count}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Busiest Days */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Busiest Days</Text>
          <Text style={s.sectionSubtitle}>Bookings by day of week</Text>
          <View style={s.daysContainer}>
            {analytics.busiestDays.map((d, i) => (
              <View key={i} style={s.dayColumn}>
                <Text style={s.dayValue}>{d.count}</Text>
                <View style={s.dayBarTrack}>
                  <View
                    style={[
                      s.dayBar,
                      { height: `${(d.count / maxDay) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={s.dayLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Status Breakdown */}
        <View style={[s.card, { marginBottom: 40 }]}>
          <Text style={s.sectionTitle}>Status Breakdown</Text>
          <Text style={s.sectionSubtitle}>Booking statuses overview</Text>
          <View style={s.statusRow}>
            <View style={s.statusDot(C.green)} />
            <Text style={s.statusLabel}>Confirmed</Text>
            <Text style={s.statusCount}>{analytics.statusBreakdown.confirmed}</Text>
          </View>
          <View style={s.statusRow}>
            <View style={s.statusDot(C.blue)} />
            <Text style={s.statusLabel}>Completed</Text>
            <Text style={s.statusCount}>{analytics.statusBreakdown.completed}</Text>
          </View>
          <View style={s.statusRow}>
            <View style={s.statusDot('#ef4444')} />
            <Text style={s.statusLabel}>Cancelled</Text>
            <Text style={s.statusCount}>{analytics.statusBreakdown.cancelled}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    ...shadows.card,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: C.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barValue: {
    fontSize: 11,
    color: C.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    width: 28,
    backgroundColor: C.bgInput,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: C.primary,
    borderRadius: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  serviceRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  serviceBadge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 10,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  dayValue: {
    fontSize: 11,
    color: C.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  dayBarTrack: {
    flex: 1,
    width: 24,
    backgroundColor: C.bgInput,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  dayBar: {
    width: '100%',
    backgroundColor: C.teal,
    borderRadius: 6,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  statusDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color,
    marginRight: 12,
  }),
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  statusCount: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  emptyText: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
})
