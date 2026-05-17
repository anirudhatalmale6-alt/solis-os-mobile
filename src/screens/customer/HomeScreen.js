import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, RefreshControl } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  { key: 'salon', icon: 'content-cut', label: 'Salon' },
  { key: 'clinic', icon: 'hospital-box-outline', label: 'Clinic' },
  { key: 'barber', icon: 'razor-double-edge', label: 'Barber' },
  { key: 'garage', icon: 'wrench', label: 'Garage' },
  { key: 'lessons', icon: 'school-outline', label: 'Lessons' },
  { key: 'other', icon: 'office-building-outline', label: 'Other' },
]

const STOCK_IMAGES = {
  salon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop',
  clinic: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=200&fit=crop',
  barber: 'https://images.unsplash.com/photo-1585747860019-8e945cfd4082?w=400&h=200&fit=crop',
  garage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=200&fit=crop',
  lessons: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop',
  other: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop',
}

export default function HomeScreen({ navigation }) {
  const [businesses, setBusinesses] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchBusinesses = async () => {
    let query = supabase.from('businesses').select('*').order('created_at', { ascending: false })
    if (selectedCat) query = query.eq('industry', selectedCat)
    const { data } = await query
    setBusinesses(data || [])
  }

  useEffect(() => { fetchBusinesses() }, [selectedCat])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBusinesses()
    setRefreshing(false)
  }

  const filtered = businesses.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return (b.name || '').toLowerCase().includes(q) || (b.industry || '').toLowerCase().includes(q)
  })

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)', 'transparent']}
        style={s.headerGlow}
      />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />

      <View style={s.header}>
        <Text style={s.greeting}>Find & Book</Text>
        <Text style={s.subGreeting}>Discover businesses near you</Text>
      </View>

      <View style={s.searchWrap}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
          style={s.searchInner}
        >
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search businesses, services..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </LinearGradient>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catsScroll} contentContainerStyle={s.catsContainer}>
        <TouchableOpacity
          style={[s.catChip, !selectedCat && s.catChipActive]}
          onPress={() => setSelectedCat(null)}
        >
          {!selectedCat ? (
            <LinearGradient colors={['#f59e0b', '#f97316']} style={s.catChipGradient}>
              <Text style={s.catChipTextActive}>All</Text>
            </LinearGradient>
          ) : (
            <Text style={s.catChipText}>All</Text>
          )}
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.catChip, selectedCat === cat.key && s.catChipActive]}
            onPress={() => setSelectedCat(selectedCat === cat.key ? null : cat.key)}
          >
            {selectedCat === cat.key ? (
              <LinearGradient colors={['#f59e0b', '#f97316']} style={s.catChipGradient}>
                <MaterialCommunityIcons name={cat.icon} size={14} color="#000" />
                <Text style={s.catChipTextActive}>{cat.label}</Text>
              </LinearGradient>
            ) : (
              <>
                <MaterialCommunityIcons name={cat.icon} size={14} color={colors.textSecondary} />
                <Text style={s.catChipText}>{cat.label}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Near You</Text>
          <View style={s.countBadge}>
            <Text style={s.countText}>{filtered.length} businesses</Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.empty}
          >
            <MaterialCommunityIcons name="magnify" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No businesses found</Text>
            <Text style={s.emptyDesc}>Try a different search or category</Text>
          </LinearGradient>
        ) : (
          filtered.map(biz => (
            <TouchableOpacity
              key={biz.id}
              style={s.bizCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BusinessProfile', { business: biz })}
            >
              <Image
                source={{ uri: STOCK_IMAGES[biz.industry] || STOCK_IMAGES.other }}
                style={s.bizImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(8,8,13,0.8)', 'rgba(8,8,13,0.95)']}
                style={s.bizImageOverlay}
              />
              <View style={s.bizRating}>
                <Text style={s.bizRatingText}>★ 4.{Math.floor(Math.random() * 3) + 7}</Text>
              </View>
              <View style={s.bizInfo}>
                <Text style={s.bizName}>{biz.name}</Text>
                <Text style={s.bizMeta}>
                  {biz.city || 'Local'} · {(biz.industry || 'Business').charAt(0).toUpperCase() + (biz.industry || 'business').slice(1)}
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
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  glowOrb1: {
    position: 'absolute',
    top: 20,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  glowOrb2: {
    position: 'absolute',
    top: 300,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  greeting: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  subGreeting: { fontSize: 14, color: colors.primary, marginTop: 4, fontWeight: '500' },
  searchWrap: { marginHorizontal: 20, marginTop: 16 },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    gap: 10,
    ...shadows.card,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: colors.text },
  catsScroll: { marginTop: 16, maxHeight: 50 },
  catsContainer: { paddingHorizontal: 20, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  catChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  catChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderRadius: 24,
  },
  catChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  catChipTextActive: { fontSize: 13, fontWeight: '700', color: '#000' },
  list: { flex: 1, marginTop: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  countText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  bizCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.card,
  },
  bizImage: { width: '100%', height: 160 },
  bizImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  bizRating: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bizRatingText: { fontSize: 12, fontWeight: '600', color: colors.text },
  bizInfo: { padding: 16 },
  bizName: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  bizMeta: { fontSize: 13, color: colors.textMuted },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
