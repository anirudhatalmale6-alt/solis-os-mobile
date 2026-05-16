import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const AVATAR_COLORS = [
  { bg: colors.primaryLight, color: colors.primary },
  { bg: colors.blueLight, color: colors.blue },
  { bg: colors.greenLight, color: colors.green },
  { bg: colors.purpleLight, color: colors.purple },
  { bg: colors.tealLight, color: colors.teal },
  { bg: colors.redLight, color: colors.red },
]

export default function CustomersScreen() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchCustomers = async () => {
    if (!user?.id) return
    const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
    const bizId = bizArr?.[0]?.id
    if (!bizId) return

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })

    setCustomers(data || [])
  }

  useFocusEffect(useCallback(() => { fetchCustomers() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchCustomers()
    setRefreshing(false)
  }

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    )
  })

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <View style={s.container}>
      <View style={s.glowOrb} />
      <View style={s.header}>
        <Text style={s.headerTitle}>Customers</Text>
        <Text style={s.headerSub}>{customers.length} total</Text>
      </View>

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search by name, email, phone..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>👥</Text>
            <Text style={s.emptyTitle}>{search ? 'No results found' : 'No customers yet'}</Text>
            <Text style={s.emptyDesc}>{search ? 'Try a different search' : 'Customers who book will appear here'}</Text>
          </View>
        ) : (
          filtered.map((customer, index) => {
            const ac = AVATAR_COLORS[index % AVATAR_COLORS.length]
            return (
              <TouchableOpacity key={customer.id} style={s.customerRow} activeOpacity={0.8}>
                <View style={[s.avatar, { backgroundColor: ac.bg }]}>
                  <Text style={[s.avatarText, { color: ac.color }]}>{getInitials(customer.name)}</Text>
                </View>
                <View style={s.customerInfo}>
                  <Text style={s.customerName}>{customer.name || 'Unknown'}</Text>
                  {customer.email && <Text style={s.customerDetail}>{customer.email}</Text>}
                  {customer.phone && <Text style={s.customerDetail}>{customer.phone}</Text>}
                </View>
                <Text style={s.chevron}>›</Text>
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
  glowOrb: {
    position: 'absolute',
    top: 30,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
  },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    gap: 10,
    ...shadows.card,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    gap: 12,
    ...shadows.card,
  },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  customerDetail: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
    ...shadows.card,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
