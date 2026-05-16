import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native'
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
          <View style={s.heroOverlay} />
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={s.infoSection}>
          <Text style={s.bizName}>{business.name}</Text>
          <Text style={s.bizType}>
            {(business.industry || 'Business').charAt(0).toUpperCase() + (business.industry || 'business').slice(1)} · {business.city || 'Local'}
          </Text>

          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>⭐ 4.9</Text>
              <Text style={s.statLabel}>(128)</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statVal}>📍 0.3</Text>
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
            <View style={s.noServices}>
              <Text style={s.noServicesText}>No services listed yet</Text>
            </View>
          ) : (
            services.map(svc => (
              <TouchableOpacity
                key={svc.id}
                style={s.serviceRow}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('BookAppointment', { business, service: svc })}
              >
                <View style={s.serviceLeft}>
                  <Text style={s.serviceName}>{svc.name}</Text>
                  <Text style={s.serviceDuration}>{svc.duration || 30} min</Text>
                </View>
                <View style={s.serviceRight}>
                  <Text style={s.servicePrice}>${svc.price || 0}</Text>
                  <Text style={s.serviceBook}>Book →</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {business.address && (
          <View style={s.detailsSection}>
            <Text style={s.detailsTitle}>Location</Text>
            <View style={s.detailRow}>
              <Text style={s.detailIcon}>📍</Text>
              <Text style={s.detailText}>{business.address}</Text>
            </View>
          </View>
        )}

        {business.phone && (
          <View style={s.detailRow}>
            <Text style={s.detailIcon}>📞</Text>
            <Text style={s.detailText}>{business.phone}</Text>
          </View>
        )}
      </ScrollView>

      {services.length > 0 && (
        <TouchableOpacity
          style={s.bookBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('BookAppointment', { business, service: services[0] })}
        >
          <Text style={s.bookBtnText}>Book Now</Text>
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
    height: 220,
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
    height: 100,
    backgroundColor: 'transparent',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
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
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
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
  },
  servicePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  serviceBook: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  noServices: {
    paddingVertical: 30,
    alignItems: 'center',
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
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
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.button,
  },
  bookBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
})
