import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, RefreshControl } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  { key: 'salon', label: 'Salons', emoji: '💇', gradient: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)'] },
  { key: 'barber', label: 'Barbers', emoji: '💈', gradient: ['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)'] },
  { key: 'clinic', label: 'Clinics', emoji: '🏥', gradient: ['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)'] },
  { key: 'garage', label: 'Garages', emoji: '🔧', gradient: ['rgba(168,85,247,0.15)', 'rgba(168,85,247,0.05)'] },
  { key: 'lessons', label: 'Lessons', emoji: '🎓', gradient: ['rgba(20,184,166,0.15)', 'rgba(20,184,166,0.05)'] },
  { key: 'other', label: 'Other', emoji: '🏢', gradient: ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)'] },
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
      <LinearGradient
        colors={['rgba(59,130,246,0.1)', 'rgba(245,158,11,0.05)', 'transparent']}
        style={s.headerGlow}
      />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />

      <View style={s.header}>
        <Text style={s.title}>Explore</Text>
        <Text style={s.subtitle}>Discover businesses near you</Text>
      </View>

      <View style={s.searchWrap}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
          style={s.searchInner}
        >
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, category, city..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </LinearGradient>
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
              onPress={() => setSearch(cat.label.replace(/s$/, ''))}
            >
              <LinearGradient
                colors={cat.gradient}
                style={s.catCard}
              >
                <Text style={s.catEmoji}>{cat.emoji}</Text>
                <Text style={s.catLabel}>{cat.label}</Text>
                <Text style={s.catCount}>{categoryCounts[cat.key] || 0}</Text>
              </LinearGradient>
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
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.empty}
          >
            <Text style={s.emptyEmoji}>🔍</Text>
            <Text style={s.emptyTitle}>No businesses found</Text>
            <Text style={s.emptyDesc}>Try a different search term</Text>
          </LinearGradient>
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
              <LinearGradient
                colors={['transparent', 'rgba(8,8,13,0.7)', 'rgba(8,8,13,0.95)']}
                style={s.bizOverlay}
              />
              <View style={s.bizRating}>
                <Text style={s.bizRatingText}>⭐ 4.{Math.floor(Math.random() * 3) + 7}</Text>
              </View>
              <View style={s.bizInfo}>
                <Text style={s.bizName}>{biz.name}</Text>
                <Text style={s.bizMeta}>
                  📍 {biz.city || 'Local'} · {(biz.industry || 'Business').charAt(0).toUpperCase() + (biz.industry || 'business').slice(1)}
                </Text>
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
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  glowOrb1: {
    position: 'absolute', top: 20, right: -40, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  glowOrb2: {
    position: 'absolute', top: 300, left: -50, width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: colors.blue, marginTop: 4, fontWeight: '500' },
  searchWrap: { marginHorizontal: 20, marginTop: 16, marginBottom: 20 },
  searchInner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, paddingHorizontal: 14, gap: 10, ...shadows.card,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 14 },
  countBadge: {
    backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: colors.borderGlow,
  },
  countText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  catCard: {
    width: 105, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', gap: 6,
  },
  catEmoji: { fontSize: 24 },
  catLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  catCount: { fontSize: 11, color: colors.textMuted },
  bizCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden',
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', ...shadows.card,
  },
  bizImage: { width: '100%', height: 140 },
  bizOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  bizRating: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  bizRatingText: { fontSize: 12, fontWeight: '600', color: colors.text },
  bizInfo: { padding: 16 },
  bizName: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  bizMeta: { fontSize: 13, color: colors.textMuted },
  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
