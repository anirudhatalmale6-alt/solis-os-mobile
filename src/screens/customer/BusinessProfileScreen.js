import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'

const STOCK_IMAGES = {
  salon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
  clinic: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
  barber: 'https://images.unsplash.com/photo-1585747860019-8e945cfd4082?w=600&h=400&fit=crop',
  garage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop',
  lessons: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop',
  other: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
}

export default function BusinessProfileScreen({ navigation, route }) {
  const { business } = route.params
  const [services, setServices] = useState([])

  useEffect(() => {
    supabase.from('services').select('*').eq('business_id', business.id).then(({ data }) => {
      setServices(data || [])
    })
  }, [business.id])

  const heroImage = STOCK_IMAGES[business.industry] || STOCK_IMAGES.other

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.heroWrap}>
          <Image source={{ uri: heroImage }} style={s.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(8,8,13,0.6)', 'rgba(8,8,13,0.98)']} style={s.heroOverlay} />
          <TouchableOpacity style={s.backBtnWrap} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']} style={s.backBtn}>
              <Text style={s.backText}>←</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={s.infoSection}>
          <Text style={s.bizName}>{business.name}</Text>
          <Text style={s.bizType}>
            {(business.industry || 'Business').charAt(0).toUpperCase() + (business.industry || 'business').slice(1)} · {business.city || 'Local'}
          </Text>

          <View style={[s.statsRow, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={s.stat}>
              <Text style={s.statVal}>★ 4.9</Text>
              <Text style={s.statLabel}>(128)</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statVal}>0.3</Text>
              <Text style={s.statLabel}>mi</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={[s.statVal, { color: colors.green }]}>Open</Text>
              <Text style={s.statLabel}>now</Text>
            </View>
          </View>
        </View>

        <View style={s.servicesSection}>
          <Text style={s.servicesTitle}>Services</Text>
          {services.length === 0 ? (
            <View style={[s.noServices, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={s.noServicesText}>No services listed yet</Text>
            </View>
          ) : (
            <View style={[s.servicesCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
              {services.map((svc, idx) => (
                <TouchableOpacity
                  key={svc.id}
                  style={[s.serviceRow, idx === services.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('BookAppointment', { business, service: svc })}
                >
                  <LinearGradient colors={['rgba(245,158,11,0.08)', 'rgba(245,158,11,0.02)']} style={s.serviceInfo}>
                    <Text style={s.serviceName}>{svc.name}</Text>
                    <Text style={s.serviceDuration}>{svc.duration || 30} min</Text>
                  </LinearGradient>
                  <View style={s.serviceRight}>
                    <Text style={s.servicePrice}>${svc.price || 0}</Text>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('BookAppointment', { business, service: svc })}>
                      <LinearGradient colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.08)']} style={s.bookTag}>
                        <Text style={s.serviceBook}>Book</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {business.address && (
          <View style={s.detailsSection}>
            <Text style={s.detailsTitle}>Location</Text>
            <View style={[s.detailCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={s.detailRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textMuted} />
                <Text style={s.detailText}>{business.address}</Text>
              </View>
              {business.phone && (
                <View style={[s.detailRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 }]}>
                  <MaterialCommunityIcons name="phone-outline" size={16} color={colors.textMuted} />
                  <Text style={s.detailText}>{business.phone}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {services.length > 0 && (
        <TouchableOpacity
          style={s.bookBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('BookAppointment', { business, service: services[0] })}
        >
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.bookBtnGradient}>
            <Text style={s.bookBtnText}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: 100,
  },
  heroWrap: {
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  backBtnWrap: {
    position: 'absolute',
    top: 52,
    left: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    color: colors.text,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  bizName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  bizType: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  servicesSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  servicesCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceLeft: {},
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  serviceDuration: {
    fontSize: 12,
    color: colors.textMuted,
  },
  serviceRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  servicePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  bookTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  serviceBook: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  noServices: {
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noServicesText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bookBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 14,
    overflow: 'hidden',
    ...shadows.button,
  },
  bookBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  bookBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  serviceInfo: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
})
