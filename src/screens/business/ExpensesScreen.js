import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Modal } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import ScreenBackground from '../../components/ScreenBackground'

const CATEGORIES = [
  { key: 'rent', label: 'Rent', icon: 'home-outline' },
  { key: 'supplies', label: 'Supplies', icon: 'package-variant' },
  { key: 'utilities', label: 'Utilities', icon: 'lightbulb-outline' },
  { key: 'marketing', label: 'Marketing', icon: 'bullhorn-outline' },
  { key: 'salary', label: 'Salaries', icon: 'briefcase-outline' },
  { key: 'equipment', label: 'Equipment', icon: 'wrench-outline' },
  { key: 'other', label: 'Other', icon: 'clipboard-outline' },
]

export default function ExpensesScreen() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'supplies' })
  const [bizId, setBizId] = useState(null)

  const fetchExpenses = async () => {
    if (!user?.id) return
    try {
      const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
      const id = bizArr?.[0]?.id
      if (!id) return
      setBizId(id)

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', id)
        .order('created_at', { ascending: false })

      if (!error) setExpenses(data || [])
    } catch (e) {}
  }

  useFocusEffect(useCallback(() => { fetchExpenses() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchExpenses()
    setRefreshing(false)
  }

  const handleAdd = async () => {
    if (!form.description || !form.amount || !bizId) return
    try {
      await supabase.from('expenses').insert({
        business_id: bizId,
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category,
      })
      setForm({ description: '', amount: '', category: 'supplies' })
      setShowModal(false)
      fetchExpenses()
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    try {
      await supabase.from('expenses').delete().eq('id', id)
      fetchExpenses()
    } catch (e) {}
  }

  const totalThisMonth = expenses
    .filter(e => {
      const d = new Date(e.created_at)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  const totalAll = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  const byCat = {}
  expenses.forEach(e => {
    byCat[e.category] = (byCat[e.category] || 0) + (e.amount || 0)
  })

  return (
    <ScreenBackground theme="warm">
      <View style={s.header}>
        <Text style={s.headerTitle}>Expenses</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowModal(true)}>
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.addBtn}>
            <Text style={s.addBtnText}>+ Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={s.statsRow}>
          <View style={[s.statCard, { borderLeftColor: colors.red }]}>
            <Text style={[s.statValue, { color: colors.red }]}>${totalThisMonth.toFixed(0)}</Text>
            <Text style={s.statLabel}>This Month</Text>
          </View>
          <View style={[s.statCard, { borderLeftColor: colors.primary }]}>
            <Text style={s.statValue}>${totalAll.toFixed(0)}</Text>
            <Text style={s.statLabel}>All Time</Text>
          </View>
        </View>

        {Object.keys(byCat).length > 0 && (
          <View style={s.catSummary}>
            <Text style={s.catTitle}>By Category</Text>
            {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
              const catInfo = CATEGORIES.find(c => c.key === cat) || CATEGORIES[6]
              const pct = totalAll > 0 ? (amount / totalAll) * 100 : 0
              return (
                <View key={cat} style={s.catRow}>
                  <MaterialCommunityIcons name={catInfo.icon} size={16} color={colors.primary} />
                  <Text style={s.catName}>{catInfo.label}</Text>
                  <View style={s.catBarWrap}>
                    <View style={[s.catBar, { width: `${pct}%` }]} />
                  </View>
                  <Text style={s.catAmount}>${amount.toFixed(0)}</Text>
                </View>
              )
            })}
          </View>
        )}

        <Text style={s.sectionTitle}>Recent Expenses</Text>
        {expenses.length === 0 ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.empty}
          >
            <MaterialCommunityIcons name="cash-remove" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No expenses recorded</Text>
            <Text style={s.emptyDesc}>Tap + Add to track your first expense</Text>
          </LinearGradient>
        ) : (
          expenses.map(exp => {
            const catInfo = CATEGORIES.find(c => c.key === exp.category) || CATEGORIES[6]
            return (
              <TouchableOpacity
                key={exp.id}
                style={s.expCard}
                activeOpacity={0.8}
                onLongPress={() => handleDelete(exp.id)}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                  style={s.expIcon}
                >
                  <MaterialCommunityIcons name={catInfo.icon} size={18} color={colors.primary} />
                </LinearGradient>
                <View style={s.expInfo}>
                  <Text style={s.expDesc}>{exp.description}</Text>
                  <Text style={s.expCat}>{catInfo.label} · {new Date(exp.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={s.expAmount}>-${(exp.amount || 0).toFixed(2)}</Text>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Add Expense</Text>

            <Text style={s.inputLabel}>Description</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Monthly rent"
              placeholderTextColor={colors.textMuted}
              value={form.description}
              onChangeText={t => setForm(p => ({ ...p, description: t }))}
            />

            <Text style={s.inputLabel}>Amount ($)</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={form.amount}
              onChangeText={t => setForm(p => ({ ...p, amount: t }))}
            />

            <Text style={s.inputLabel}>Category</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  activeOpacity={0.8}
                  onPress={() => setForm(p => ({ ...p, category: cat.key }))}
                  style={[
                    s.catChip,
                    form.category === cat.key && s.catChipActive,
                  ]}
                >
                  <MaterialCommunityIcons name={cat.icon} size={14} color={colors.textMuted} />
                  <Text style={[
                    s.catChipText,
                    form.category === cat.key && s.catChipTextActive,
                  ]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={handleAdd}>
                <LinearGradient colors={['#f59e0b', '#f97316']} style={s.saveBtn}>
                  <Text style={s.saveBtnText}>Save Expense</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  )
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  addBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, ...shadows.button },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderLeftWidth: 3, ...shadows.card,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  catSummary: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20, ...shadows.card,
  },
  catTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 14 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  catName: { fontSize: 13, color: colors.textSecondary, width: 70 },
  catBarWrap: {
    flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3,
  },
  catBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  catAmount: { fontSize: 13, fontWeight: '600', color: colors.text, width: 50, textAlign: 'right' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14 },
  expCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8, gap: 12, ...shadows.card,
  },
  expIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  expInfo: { flex: 1 },
  expDesc: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  expCat: { fontSize: 12, color: colors.textMuted },
  expAmount: { fontSize: 15, fontWeight: '700', color: colors.red },
  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111118', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  catChipActive: { borderColor: colors.borderGlow, backgroundColor: 'rgba(245,158,11,0.1)' },
  catChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  catChipTextActive: { color: colors.primary },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...shadows.button },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
})
