import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function ServicesScreen() {
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchServices = async () => {
    if (!user?.id) return
    const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
    const bizId = bizArr?.[0]?.id
    if (!bizId) return

    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', bizId)
      .order('name', { ascending: true })

    setServices(data || [])
  }

  useFocusEffect(useCallback(() => { fetchServices() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchServices()
    setRefreshing(false)
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '--'
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
    }
    return `${minutes}m`
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Services</Text>
        <Text style={s.headerSub}>{services.length} services</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {services.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>✂️</Text>
            <Text style={s.emptyTitle}>No services yet</Text>
            <Text style={s.emptyDesc}>Add services for customers to book</Text>
          </View>
        ) : (
          services.map((service) => (
            <View key={service.id} style={s.serviceCard}>
              <View style={s.cardTop}>
                <Text style={s.serviceName}>{service.name}</Text>
                <Text style={s.servicePrice}>
                  {service.price != null ? `$${service.price}` : 'Free'}
                </Text>
              </View>
              <View style={s.cardBottom}>
                <View style={s.durationBadge}>
                  <Text style={s.durationIcon}>🕐</Text>
                  <Text style={s.durationText}>{formatDuration(service.duration)}</Text>
                </View>
                {service.description && (
                  <Text style={s.description} numberOfLines={2}>{service.description}</Text>
                )}
              </View>
            </View>
          ))
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
  serviceCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  servicePrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
  cardBottom: { gap: 8 },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  durationIcon: { fontSize: 12 },
  durationText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  description: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
