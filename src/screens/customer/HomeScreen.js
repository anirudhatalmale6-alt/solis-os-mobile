import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, RefreshControl } from 'react-native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  { key: 'salon', emoji: '💇', label: 'Salon' },
  { key: 'clinic', emoji: '🏥', label: 'Clinic' },
  { key: 'barber', emoji: '💈', label: 'Barber' },
  { key: 'garage', emoji: '🔧', label: 'Garage' },
  { key: 'lessons', emoji: '🎓', label: 'Lessons' },
  { key: 'other', emoji: '🏢', label: 'Other' },
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
      <View style={s.glowOrb} />

      <View style={s.header}>
        <Text style={s.greeting}>Find & Book</Text>
        <Text style={s.subGreeting}>Discover businesses near you</Text>
      </View>

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search businesses, services..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catsScroll} contentContainerStyle={s.catsContainer}>
        <TouchableOpacity
          style={[s.catChip, !selectedCat && s.catChipActive]}
          onPress={() => setSelectedCat(null)}
        >
          <Text style={[s.catChipText, !selectedCat && s.catChipTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.catChip, selectedCat === cat.key && s.catChipActive]}
            onPress={() => setSelectedCat(selectedCat === cat.key ? null : cat.key)}
          >
            <Text style={s.catEmoji}>{cat.emoji}</Text>
            <Text style={[s.catChipText, selectedCat === cat.key && s.catChipTextActive]}>{cat.label}</Text>
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
          <Text style={s.sectionCount}>{filtered.length} businesses</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🔍</Text>
            <Text style={s.emptyTitle}>No businesses found</Text>
            <Text style={s.emptyDesc}>Try a different search or category</Text>
          </View>
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
              <View style={s.bizImageOverlay} />
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
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  glowOrb: {
    position: 'absolute',
    top: 20,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    gap: 10,
    ...shadows.card,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.text,
  },
  catsScroll: {
    marginTop: 16,
    maxHeight: 44,
  },
  catsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 5,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.button,
  },
  catEmoji: {
    fontSize: 13,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: colors.textDark,
    fontWeight: '700',
  },
  list: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  bizCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  bizImage: {
    width: '100%',
    height: 150,
  },
  bizImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(8, 8, 13, 0.15)',
  },
  bizRating: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bizRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  bizInfo: {
    padding: 16,
  },
  bizName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  bizMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
  },
})
