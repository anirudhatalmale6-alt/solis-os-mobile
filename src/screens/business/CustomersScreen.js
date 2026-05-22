import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import ScreenBackground from '../../components/ScreenBackground'

const AVATAR_COLORS = [
  { gradient: ['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.08)'], color: colors.primary },
  { gradient: ['rgba(59,130,246,0.2)', 'rgba(59,130,246,0.08)'], color: colors.blue },
  { gradient: ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.08)'], color: colors.green },
  { gradient: ['rgba(168,85,247,0.2)', 'rgba(168,85,247,0.08)'], color: colors.purple },
  { gradient: ['rgba(20,184,166,0.2)', 'rgba(20,184,166,0.08)'], color: colors.teal },
  { gradient: ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.08)'], color: colors.red },
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

  const deleteCustomer = (customer) => {
    Alert.alert('Delete Customer', `Remove ${customer.name || 'this customer'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('customers').delete().eq('id', customer.id)
        setCustomers(prev => prev.filter(c => c.id !== customer.id))
      }},
    ])
  }

  const clearAllCustomers = () => {
    if (customers.length === 0) return
    Alert.alert('Clear All Customers', `Delete all ${customers.length} customers? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => {
        const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
        const bizId = bizArr?.[0]?.id
        if (bizId) {
          await supabase.from('customers').delete().eq('business_id', bizId)
          setCustomers([])
        }
      }},
    ])
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <ScreenBackground theme="warm">
      <View style={s.header}>
        <Text style={s.headerTitle}>Customers</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {customers.length > 0 && (
            <TouchableOpacity style={s.clearAllBtn} onPress={clearAllCustomers} activeOpacity={0.7}>
              <Text style={s.clearAllBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{customers.length} total</Text>
          </View>
        </View>
      </View>

      <View style={s.searchWrap}>
        <View style={s.searchInner}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, email, phone..."
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
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>{search ? 'No results found' : 'No customers yet'}</Text>
            <Text style={s.emptyDesc}>{search ? 'Try a different search' : 'Customers who book will appear here'}</Text>
          </View>
        ) : (
          filtered.map((customer, index) => {
            const ac = AVATAR_COLORS[index % AVATAR_COLORS.length]
            return (
              <TouchableOpacity key={customer.id} style={s.customerRow} activeOpacity={0.8} onLongPress={() => deleteCustomer(customer)}>
                <LinearGradient colors={ac.gradient} style={s.avatar}>
                  <Text style={[s.avatarText, { color: ac.color }]}>{getInitials(customer.name)}</Text>
                </LinearGradient>
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
    </ScreenBackground>
  )
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerBadge: {
    backgroundColor: colors.blueLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  headerBadgeText: { fontSize: 11, color: colors.blue, fontWeight: '600' },
  clearAllBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  clearAllBtnText: { fontSize: 11, color: colors.red, fontWeight: '600' },
  searchWrap: { marginHorizontal: 20, marginTop: 16, marginBottom: 16 },
  searchInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, paddingHorizontal: 14, gap: 10, ...shadows.card,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  customerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: colors.border,
    marginBottom: 8, gap: 12, ...shadows.card,
  },
  avatar: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  customerDetail: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 20,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, marginTop: 20, ...shadows.card,
  },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
})
