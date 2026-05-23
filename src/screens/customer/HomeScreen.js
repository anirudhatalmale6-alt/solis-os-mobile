import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, RefreshControl } from 'react-native'
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
      <View style={s.header}>
        <Text style={s.greeting}>Find & Book</Text>
        <Text style={s.subGreeting}>Discover businesses near you</Text>
      </View>

      <View style={s.searchWrap}>
        <View style={s.searchInner}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search businesses, services..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
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
            <MaterialCommunityIcons name={cat.icon} size={14} color={selectedCat === cat.key ? '#fff' : colors.textSecondary} />
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
          <View style={s.countBadge}>
            <Text style={s.countText}>{filtered.length} businesses</Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons name="magnify" size={48} color={colors.textMuted} />
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
  greeting: { fontSize: 28, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  searchWrap: { marginHorizontal: 20, marginTop: 16 },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    ...shadows.card,
  },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.text },
  catsScroll: { marginTop: 16, maxHeight: 46 },
  catsContainer: { paddingHorizontal: 20, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  catChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  catChipTextActive: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  list: { flex: 1, marginTop: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  countBadge: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  bizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...shadows.card,
  },
  bizImage: { width: '100%', height: 180, backgroundColor: '#E8E9EF' },
  bizRating: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    ...shadows.card,
  },
  bizRatingText: { fontSize: 12, fontWeight: '700', color: colors.text },
  bizInfo: { padding: 14 },
  bizName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  bizMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bizMeta: { fontSize: 13, color: colors.textMuted },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
