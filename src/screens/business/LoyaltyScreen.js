import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Modal, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import ScreenBackground from '../../components/ScreenBackground'

const DEFAULT_TIERS = [
  { name: 'Bronze', minPoints: 0, color: '#CD7F32', icon: 'shield-outline' },
  { name: 'Silver', minPoints: 100, color: '#C0C0C0', icon: 'shield-half-full' },
  { name: 'Gold', minPoints: 300, color: '#FFD700', icon: 'shield-star' },
  { name: 'Platinum', minPoints: 500, color: '#E5E4E2', icon: 'crown' },
]

export default function LoyaltyScreen() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [bizId, setBizId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [pointsToAdd, setPointsToAdd] = useState('')
  const [pointsPerVisit, setPointsPerVisit] = useState('10')
  const [showSettings, setShowSettings] = useState(false)
  const [rewardName, setRewardName] = useState('')
  const [rewardPoints, setRewardPoints] = useState('')
  const [rewards, setRewards] = useState([
    { name: 'Free Service', points: 200 },
    { name: '20% Discount', points: 100 },
    { name: 'Free Add-On', points: 50 },
  ])

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

      const ppv = parseInt(pointsPerVisit) || 10
      const customerMap = {}
      ;(bookings || []).forEach(b => {
        const key = b.customer_email || b.customer_name
        if (!key) return
        if (!customerMap[key]) {
          customerMap[key] = { name: b.customer_name, email: b.customer_email, visits: 0, points: 0 }
        }
        customerMap[key].visits += 1
        customerMap[key].points += ppv
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

  const resetCustomerPoints = () => {
    if (!selectedCustomer) return
    Alert.alert('Reset Points', `Reset ${selectedCustomer.name}'s points to 0?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => {
        setCustomers(prev => prev.map(c =>
          c.email === selectedCustomer.email ? { ...c, points: 0 } : c
        ))
        setShowModal(false)
        setSelectedCustomer(null)
      }},
    ])
  }

  const addReward = () => {
    if (!rewardName.trim() || !rewardPoints.trim()) { Alert.alert('Required', 'Enter reward name and points'); return }
    setRewards(prev => [...prev, { name: rewardName.trim(), points: parseInt(rewardPoints) || 0 }])
    setRewardName('')
    setRewardPoints('')
  }

  const removeReward = (idx) => {
    setRewards(prev => prev.filter((_, i) => i !== idx))
  }

  const getTier = (points) => {
    for (let i = DEFAULT_TIERS.length - 1; i >= 0; i--) {
      if (points >= DEFAULT_TIERS[i].minPoints) return DEFAULT_TIERS[i]
    }
    return DEFAULT_TIERS[0]
  }

  const totalPoints = customers.reduce((sum, c) => sum + c.points, 0)
  const topCustomer = customers[0]

  return (
    <ScreenBackground theme="royal">
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Loyalty & Rewards</Text>
          <Text style={s.headerSub}>{pointsPerVisit} points per visit</Text>
        </View>
        <TouchableOpacity style={s.settingsBtn} onPress={() => setShowSettings(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="cog-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
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

        <Text style={s.sectionTitle}>Tier Levels</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {DEFAULT_TIERS.map((tier, i) => (
            <View key={i} style={[s.tierCard, { borderColor: tier.color + '40' }]}>
              <MaterialCommunityIcons name={tier.icon} size={22} color={tier.color} />
              <Text style={[s.tierName, { color: tier.color }]}>{tier.name}</Text>
              <Text style={s.tierMin}>{tier.minPoints}+ pts</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={s.sectionTitle}>Rewards Available</Text>
        {rewards.map((rw, i) => (
          <View key={i} style={s.rewardCard}>
            <MaterialCommunityIcons name="gift-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.rewardName}>{rw.name}</Text>
              <Text style={s.rewardPts}>{rw.points} points to redeem</Text>
            </View>
          </View>
        ))}

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Loyalty Members</Text>

        {customers.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons name="star-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No loyalty members yet</Text>
            <Text style={s.emptyDesc}>Customers earn points automatically with each visit</Text>
          </View>
        ) : (
          customers.map((cust, idx) => {
            const tier = getTier(cust.points)
            return (
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.custMeta}>{cust.visits} visits</Text>
                    <View style={[s.tierBadge, { backgroundColor: tier.color + '20' }]}>
                      <Text style={[s.tierBadgeText, { color: tier.color }]}>{tier.name}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.pointsBadge}>
                  <Text style={s.pointsText}>{cust.points} pts</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* Add/Manage Points Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Manage Points</Text>
            <Text style={s.modalSub}>{selectedCustomer?.name || 'Customer'} - {selectedCustomer?.points || 0} pts ({getTier(selectedCustomer?.points || 0).name})</Text>
            <TextInput
              style={s.input}
              placeholder="Points to add"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={pointsToAdd}
              onChangeText={setPointsToAdd}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowModal(false); setPointsToAdd(''); }}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={handleAddPoints}>
                <LinearGradient colors={['#f59e0b', '#f97316']} style={s.saveBtn}>
                  <Text style={s.saveBtnText}>Add Points</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.resetBtn} onPress={resetCustomerPoints} activeOpacity={0.7}>
              <MaterialCommunityIcons name="refresh" size={16} color={colors.red} />
              <Text style={s.resetBtnText}>Reset Points to 0</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={s.modalTitle}>Loyalty Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.settingLabel}>Points Per Visit</Text>
              <TextInput
                style={s.input}
                placeholder="10"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={pointsPerVisit}
                onChangeText={setPointsPerVisit}
              />
              <Text style={s.settingHint}>Each booking earns the customer this many points</Text>

              <Text style={[s.settingLabel, { marginTop: 20 }]}>Rewards</Text>
              {rewards.map((rw, i) => (
                <View key={i} style={s.rewardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rewardRowName}>{rw.name}</Text>
                    <Text style={s.rewardRowPts}>{rw.points} pts</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeReward(i)}>
                    <MaterialCommunityIcons name="close-circle" size={20} color={colors.red} />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[s.settingLabel, { marginTop: 16 }]}>Add Reward</Text>
              <TextInput style={s.input} placeholder="Reward name (e.g. Free Haircut)" placeholderTextColor={colors.textMuted} value={rewardName} onChangeText={setRewardName} />
              <TextInput style={s.input} placeholder="Points needed" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={rewardPoints} onChangeText={setRewardPoints} />
              <TouchableOpacity activeOpacity={0.8} onPress={addReward}>
                <LinearGradient colors={['#f59e0b', '#f97316']} style={[s.saveBtn, { marginBottom: 30 }]}>
                  <Text style={s.saveBtnText}>Add Reward</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  )
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: colors.primary, marginTop: 4, fontWeight: '500' },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  statLabel: { fontSize: 11, color: colors.textMuted },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },

  tierCard: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, marginRight: 10,
    backgroundColor: colors.bgCard, borderWidth: 1, alignItems: 'center', gap: 4, minWidth: 90,
  },
  tierName: { fontSize: 13, fontWeight: '700' },
  tierMin: { fontSize: 10, color: colors.textMuted },

  rewardCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, marginBottom: 8,
  },
  rewardName: { fontSize: 14, fontWeight: '600', color: colors.text },
  rewardPts: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tierBadgeText: { fontSize: 10, fontWeight: '700' },

  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
  custCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard,
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1,
    borderColor: colors.border, gap: 12, ...shadows.card,
  },
  rank: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bgInput,
    alignItems: 'center', justifyContent: 'center',
  },
  rankGold: { backgroundColor: 'rgba(245,158,11,0.15)' },
  rankText: { fontSize: 13, fontWeight: '700', color: colors.text },
  custInfo: { flex: 1 },
  custName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  custMeta: { fontSize: 12, color: colors.textMuted },
  pointsBadge: { backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  pointsText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  input: {
    backgroundColor: colors.bgInput, borderRadius: 12, padding: 14,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...shadows.button },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 16, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.08)',
  },
  resetBtnText: { fontSize: 13, color: colors.red, fontWeight: '600' },
  settingLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  settingHint: { fontSize: 11, color: colors.textMuted, marginTop: -8, marginBottom: 8 },
  rewardRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.bgInput,
    borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight, marginBottom: 8,
  },
  rewardRowName: { fontSize: 14, fontWeight: '600', color: colors.text },
  rewardRowPts: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
})
