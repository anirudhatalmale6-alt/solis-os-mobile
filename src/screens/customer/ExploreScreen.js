import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, RefreshControl } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  { key: 'salon', label: 'Salons', icon: 'content-cut', bg: 'rgba(245,158,11,0.08)', iconColor: '#f59e0b' },
  { key: 'barber', label: 'Barbers', icon: 'razor-double-edge', bg: 'rgba(59,130,246,0.08)', iconColor: '#3b82f6' },
  { key: 'clinic', label: 'Clinics', icon: 'hospital-box-outline', bg: 'rgba(34,197,94,0.08)', iconColor: '#22c55e' },
  { key: 'garage', label: 'Garages', icon: 'wrench', bg: 'rgba(168,85,247,0.08)', iconColor: '#a855f7' },
  { key: 'lessons', label: 'Lessons', icon: 'school-outline', bg: 'rgba(20,184,166,0.08)', iconColor: '#14b8a6' },
  { key: 'other', label: 'Other', icon: 'office-building-outline', bg: 'rgba(107,114,128,0.08)', iconColor: '#6b7280' },
]

const STOCK_IMAGES = {
  salon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop',
  clinic: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=200&fit=crop',
  barber: 'https://images.unsplash.com/photo-1585747860019-8e945cfd4082?w=400&h=200&fit=crop',
  garage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=200&fit=crop',
  lessons: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop',
  other: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop',
}

export default function ExploreScreen({ navigation }) {
  const [businesses, setBusinesses] = useState([])
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').order('created_at', { ascending: false })
    setBusinesses(data || [])
  }

  useEffect(() => { fetchBusinesses() }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBusinesses()
    setRefreshing(false)
  }

  const filtered = businesses.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return (b.name || '').toLowerCase().includes(q) || (b.industry || '').toLowerCase().includes(q) || (b.city || '').toLowerCase().includes(q)
  })

  const categoryCounts = {}
  businesses.forEach(b => {
    const cat = b.industry || 'other'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Explore</Text>
        <Text style={s.subtitle}>Discover businesses near you</Text>
      </View>

      <View style={s.searchWrap}>
        <View style={s.searchInner}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, category, city..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={s.sectionTitle}>Categories</Text>
        <View style={s.catGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              activeOpacity={0.8}
              style={[s.catCard, { backgroundColor: cat.bg }]}
              onPress={() => setSearch(cat.label.replace(/s$/, ''))}
            >
              <View style={[s.catIconWrap, { backgroundColor: cat.bg }]}>
                <MaterialCommunityIcons name={cat.icon} size={22} color={cat.iconColor} />
              </View>
              <Text style={s.catLabel}>{cat.label}</Text>
              <Text style={s.catCount}>{categoryCounts[cat.key] || 0}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>
            {search ? `Results for "${search}"` : 'All Businesses'}
          </Text>
          <View style={s.countBadge}>
            <Text style={s.countText}>{filtered.length}</Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons name="magnify" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No businesses found</Text>
            <Text style={s.emptyDesc}>Try a different search term</Text>
          </View>
        ) : (
          filtered.map(biz => (
            <TouchableOpacity
              key={biz.id}
              style={s.bizCard}
              activeOpacity={0.85}
              onPress={() => navigation.getParent()?.navigate('Home', {
                screen: 'BusinessProfile',
                params: { business: biz }
              })}
            >
              <Image
                source={{ uri: biz.logo_url || STOCK_IMAGES[biz.industry] || STOCK_IMAGES.other }}
                style={s.bizImage}
              />
              <View style={s.bizRating}>
                <MaterialCommunityIcons name="star" size={12} color="#f59e0b" />
                <Text style={s.bizRatingText}>4.{Math.floor(Math.random() * 3) + 7}</Text>
              </View>
              <View style={s.bizInfo}>
                <Text style={s.bizName}>{biz.name}</Text>
                <View style={s.bizMetaRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textMuted} />
                  <Text style={s.bizMeta}>
                    {biz.city || 'Local'} · {(biz.industry || 'Business').charAt(0).toUpperCase() + (biz.industry || 'business').slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  searchWrap: { marginHorizontal: 20, marginTop: 16, marginBottom: 20 },
  searchInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, gap: 10,
    ...shadows.card,
  },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 14 },
  countBadge: {
    backgroundColor: colors.bgInput, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10,
  },
  countText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  catCard: {
    width: 105, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 8,
  },
  catIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  catLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  catCount: { fontSize: 11, color: colors.textMuted },
  bizCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    marginBottom: 16, ...shadows.card,
  },
  bizImage: { width: '100%', height: 160, backgroundColor: '#E8E9EF' },
  bizRating: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8, ...shadows.card,
  },
  bizRatingText: { fontSize: 12, fontWeight: '700', color: colors.text },
  bizInfo: { padding: 14 },
  bizMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bizName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  bizMeta: { fontSize: 13, color: colors.textMuted },
  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
