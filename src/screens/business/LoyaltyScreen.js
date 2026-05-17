import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Modal, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function LoyaltyScreen() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [bizId, setBizId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [pointsToAdd, setPointsToAdd] = useState('')

  const fetchData = async () => {
    if (!user?.id) return
    try {
      const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
      const id = bizArr?.[0]?.id
      if (!id) return
      setBizId(id)

      const { data: bookings } = await supabase
        .from('bookings')
        .select('customer_name, customer_email')
        .eq('business_id', id)

      const customerMap = {}
      ;(bookings || []).forEach(b => {
        const key = b.customer_email || b.customer_name
        if (!key) return
        if (!customerMap[key]) {
          customerMap[key] = { name: b.customer_name, email: b.customer_email, visits: 0, points: 0 }
        }
        customerMap[key].visits += 1
        customerMap[key].points += 10
      })

      setCustomers(Object.values(customerMap).sort((a, b) => b.points - a.points))
    } catch (e) {}
  }

  useFocusEffect(useCallback(() => { fetchData() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleAddPoints = () => {
    if (!selectedCustomer || !pointsToAdd) return
    const pts = parseInt(pointsToAdd) || 0
    setCustomers(prev => prev.map(c =>
      c.email === selectedCustomer.email ? { ...c, points: c.points + pts } : c
    ))
    setShowModal(false)
    setPointsToAdd('')
    setSelectedCustomer(null)
    Alert.alert('Done', `Added ${pointsToAdd} points`)
  }

  const totalPoints = customers.reduce((sum, c) => sum + c.points, 0)
  const topCustomer = customers[0]

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(245,158,11,0.1)', 'rgba(244,63,94,0.05)', 'transparent']}
        style={s.headerGlow}
      />

      <View style={s.header}>
        <Text style={s.headerTitle}>Loyalty & Rewards</Text>
        <Text style={s.headerSub}>10 points per visit</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{customers.length}</Text>
            <Text style={s.statLabel}>Members</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: colors.primary }]}>{totalPoints}</Text>
            <Text style={s.statLabel}>Total Points</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: colors.green }]}>{topCustomer?.visits || 0}</Text>
            <Text style={s.statLabel}>Most Visits</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Loyalty Members</Text>

        {customers.length === 0 ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.empty}
          >
            <MaterialCommunityIcons name="star-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No loyalty members yet</Text>
            <Text style={s.emptyDesc}>Customers earn points automatically with each visit</Text>
          </LinearGradient>
        ) : (
          customers.map((cust, idx) => (
            <TouchableOpacity
              key={cust.email || idx}
              style={s.custCard}
              activeOpacity={0.8}
              onPress={() => { setSelectedCustomer(cust); setShowModal(true); }}
            >
              <View style={[s.rank, idx === 0 && s.rankGold]}>
                <Text style={s.rankText}>{idx + 1}</Text>
              </View>
              <View style={s.custInfo}>
                <Text style={s.custName}>{cust.name || 'Customer'}</Text>
                <Text style={s.custMeta}>{cust.visits} visits</Text>
              </View>
              <View style={s.pointsBadge}>
                <Text style={s.pointsText}>{cust.points} pts</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Add Points</Text>
            <Text style={s.modalSub}>{selectedCustomer?.name || 'Customer'} - {selectedCustomer?.points || 0} pts</Text>
            <TextInput
              style={s.input}
              placeholder="Points to add"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={pointsToAdd}
              onChangeText={setPointsToAdd}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={handleAddPoints}>
                <LinearGradient colors={['#f59e0b', '#f97316']} style={s.saveBtn}>
                  <Text style={s.saveBtnText}>Add Points</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: colors.primary, marginTop: 4, fontWeight: '500' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', ...shadows.card,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  statLabel: { fontSize: 11, color: colors.textMuted },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },
  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
  custCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', gap: 12, ...shadows.card,
  },
  rank: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  rankGold: { backgroundColor: 'rgba(245,158,11,0.15)' },
  rankText: { fontSize: 13, fontWeight: '700', color: colors.text },
  custInfo: { flex: 1 },
  custName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  custMeta: { fontSize: 12, color: colors.textMuted },
  pointsBadge: { backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  pointsText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111118', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...shadows.button },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
})
