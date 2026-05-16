import React, { useState, useCallback } from 'react'
import {
  View, Text, TextInput, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const STATUS_STYLES = {
  draft: {
    label: 'Draft',
    gradient: ['rgba(245,158,11,0.25)', 'rgba(245,158,11,0.10)'],
    color: colors.primary,
    border: 'rgba(245,158,11,0.3)',
  },
  sent: {
    label: 'Sent',
    gradient: ['rgba(59,130,246,0.25)', 'rgba(59,130,246,0.10)'],
    color: colors.blue,
    border: 'rgba(59,130,246,0.3)',
  },
  paid: {
    label: 'Paid',
    gradient: ['rgba(34,197,94,0.25)', 'rgba(34,197,94,0.10)'],
    color: colors.green,
    border: 'rgba(34,197,94,0.3)',
  },
  overdue: {
    label: 'Overdue',
    gradient: ['rgba(239,68,68,0.25)', 'rgba(239,68,68,0.10)'],
    color: colors.red,
    border: 'rgba(239,68,68,0.3)',
  },
}

const FILTER_OPTIONS = ['all', 'draft', 'sent', 'paid', 'overdue']

export default function InvoicesScreen() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [businessId, setBusinessId] = useState(null)

  // Modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    customer_name: '',
    customer_email: '',
    items: [{ name: '', price: '' }],
    due_date: '',
    status: 'draft',
  })
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)

  const fetchData = async () => {
    if (!user?.id) return

    try {
      const { data: bizArr } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)

      const bizId = bizArr?.[0]?.id
      if (!bizId) {
        setLoading(false)
        return
      }
      setBusinessId(bizId)

      const [invoicesRes, customersRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('business_id', bizId)
          .order('created_at', { ascending: false }),
        supabase
          .from('customers')
          .select('id, name, email')
          .eq('business_id', bizId)
          .order('name', { ascending: true }),
      ])

      setInvoices(invoicesRes.data || [])
      setCustomers(customersRes.data || [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { fetchData() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  // Stats calculations
  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalPaidThisMonth = invoices
    .filter(inv => {
      if (inv.status !== 'paid') return false
      const d = new Date(inv.created_at)
      return d >= thisMonthStart
    })
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  const invoiceCount = invoices.length

  // Filtered list
  const filtered = invoices.filter(inv => {
    if (filter !== 'all' && inv.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (inv.customer_name || '').toLowerCase().includes(q) ||
      (inv.customer_email || '').toLowerCase().includes(q)
    )
  })

  const formatCurrency = (amount) => {
    return '$' + (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Create invoice
  const handleCreate = async () => {
    if (!newInvoice.customer_name.trim()) {
      Alert.alert('Error', 'Please enter a customer name')
      return
    }
    const validItems = newInvoice.items.filter(it => it.name.trim() && parseFloat(it.price) > 0)
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one line item with a name and price')
      return
    }
    if (!newInvoice.due_date.trim()) {
      Alert.alert('Error', 'Please enter a due date (YYYY-MM-DD)')
      return
    }

    setCreating(true)
    try {
      const items = validItems.map(it => ({ name: it.name.trim(), price: parseFloat(it.price) }))
      const total = items.reduce((sum, it) => sum + it.price, 0)

      const { error } = await supabase.from('invoices').insert({
        business_id: businessId,
        customer_name: newInvoice.customer_name.trim(),
        customer_email: newInvoice.customer_email.trim(),
        items: items,
        total: total,
        status: newInvoice.status,
        due_date: newInvoice.due_date.trim(),
      })

      if (error) throw error

      setModalVisible(false)
      resetForm()
      await fetchData()
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create invoice')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setNewInvoice({
      customer_name: '',
      customer_email: '',
      items: [{ name: '', price: '' }],
      due_date: '',
      status: 'draft',
    })
    setShowCustomerPicker(false)
  }

  const addLineItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { name: '', price: '' }],
    }))
  }

  const updateLineItem = (index, field, value) => {
    setNewInvoice(prev => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, items }
    })
  }

  const removeLineItem = (index) => {
    if (newInvoice.items.length <= 1) return
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const selectCustomer = (customer) => {
    setNewInvoice(prev => ({
      ...prev,
      customer_name: customer.name || '',
      customer_email: customer.email || '',
    }))
    setShowCustomerPicker(false)
  }

  const getFormTotal = () => {
    return newInvoice.items.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0)
  }

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(245,158,11,0.08)', 'rgba(59,130,246,0.04)', 'transparent']}
        style={s.headerGlow}
      />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Invoices</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{invoiceCount} total</Text>
        </View>
      </View>

      {/* Summary Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statsRow} contentContainerStyle={s.statsContent}>
        <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={s.statCard}>
          <Text style={s.statLabel}>Outstanding</Text>
          <Text style={[s.statValue, { color: colors.primary }]}>{formatCurrency(totalOutstanding)}</Text>
        </LinearGradient>
        <LinearGradient colors={['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)']} style={s.statCard}>
          <Text style={s.statLabel}>Paid This Month</Text>
          <Text style={[s.statValue, { color: colors.green }]}>{formatCurrency(totalPaidThisMonth)}</Text>
        </LinearGradient>
        <LinearGradient colors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)']} style={s.statCard}>
          <Text style={s.statLabel}>Total Invoices</Text>
          <Text style={[s.statValue, { color: colors.blue }]}>{invoiceCount}</Text>
        </LinearGradient>
      </ScrollView>

      {/* Search */}
      <View style={s.searchWrap}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
          style={s.searchInner}
        >
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search invoices..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </LinearGradient>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={s.filterContent}>
        {FILTER_OPTIONS.map(opt => {
          const active = filter === opt
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => setFilter(opt)}
              style={[s.filterChip, active && s.filterChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Invoice List */}
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filtered.length === 0 ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.empty}
          >
            <Text style={s.emptyEmoji}>📄</Text>
            <Text style={s.emptyTitle}>{search || filter !== 'all' ? 'No invoices found' : 'No invoices yet'}</Text>
            <Text style={s.emptyDesc}>
              {search || filter !== 'all' ? 'Try adjusting your search or filter' : 'Tap + to create your first invoice'}
            </Text>
          </LinearGradient>
        ) : (
          filtered.map((invoice) => {
            const statusStyle = STATUS_STYLES[invoice.status] || STATUS_STYLES.draft
            return (
              <TouchableOpacity key={invoice.id} style={s.invoiceCard} activeOpacity={0.8}>
                <View style={s.invoiceTop}>
                  <View style={s.invoiceInfo}>
                    <Text style={s.invoiceName}>{invoice.customer_name || 'Unknown'}</Text>
                    <Text style={s.invoiceDate}>{formatDate(invoice.due_date || invoice.created_at)}</Text>
                  </View>
                  <View style={s.invoiceRight}>
                    <Text style={s.invoiceAmount}>{formatCurrency(invoice.total)}</Text>
                    <LinearGradient
                      colors={statusStyle.gradient}
                      style={[s.statusBadge, { borderColor: statusStyle.border }]}
                    >
                      <Text style={[s.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                    </LinearGradient>
                  </View>
                </View>
                {invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0 && (
                  <Text style={s.invoiceItems} numberOfLines={1}>
                    {invoice.items.map(it => it.name).join(', ')}
                  </Text>
                )}
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
      >
        <LinearGradient
          colors={[colors.primary, 'rgba(245,158,11,0.8)']}
          style={s.fabGradient}
        >
          <Text style={s.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Invoice Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setModalVisible(false); resetForm() }}
      >
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={s.modalContainer}
          >
            <LinearGradient
              colors={['rgba(20,20,30,0.99)', 'rgba(8,8,13,0.99)']}
              style={s.modalContent}
            >
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>New Invoice</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm() }}>
                  <Text style={s.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Customer Selection */}
                <Text style={s.fieldLabel}>Customer</Text>
                <TouchableOpacity
                  style={s.customerPickerBtn}
                  onPress={() => setShowCustomerPicker(!showCustomerPicker)}
                  activeOpacity={0.7}
                >
                  <Text style={newInvoice.customer_name ? s.fieldValue : s.fieldPlaceholder}>
                    {newInvoice.customer_name || 'Select or type customer name'}
                  </Text>
                  <Text style={s.chevronDown}>{showCustomerPicker ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showCustomerPicker && customers.length > 0 && (
                  <View style={s.pickerList}>
                    {customers.map(cust => (
                      <TouchableOpacity
                        key={cust.id}
                        style={s.pickerItem}
                        onPress={() => selectCustomer(cust)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.pickerItemText}>{cust.name}</Text>
                        {cust.email && <Text style={s.pickerItemSub}>{cust.email}</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TextInput
                  style={s.input}
                  placeholder="Customer name"
                  placeholderTextColor={colors.textMuted}
                  value={newInvoice.customer_name}
                  onChangeText={(v) => setNewInvoice(prev => ({ ...prev, customer_name: v }))}
                />
                <TextInput
                  style={s.input}
                  placeholder="Customer email (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={newInvoice.customer_email}
                  onChangeText={(v) => setNewInvoice(prev => ({ ...prev, customer_email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Line Items */}
                <Text style={[s.fieldLabel, { marginTop: 20 }]}>Line Items</Text>
                {newInvoice.items.map((item, index) => (
                  <View key={index} style={s.lineItemRow}>
                    <TextInput
                      style={[s.input, s.lineItemName]}
                      placeholder="Service name"
                      placeholderTextColor={colors.textMuted}
                      value={item.name}
                      onChangeText={(v) => updateLineItem(index, 'name', v)}
                    />
                    <TextInput
                      style={[s.input, s.lineItemPrice]}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                      value={item.price}
                      onChangeText={(v) => updateLineItem(index, 'price', v)}
                      keyboardType="decimal-pad"
                    />
                    {newInvoice.items.length > 1 && (
                      <TouchableOpacity onPress={() => removeLineItem(index)} style={s.removeBtn}>
                        <Text style={s.removeBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={s.addItemBtn} onPress={addLineItem} activeOpacity={0.7}>
                  <Text style={s.addItemText}>+ Add Item</Text>
                </TouchableOpacity>

                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total</Text>
                  <Text style={s.totalValue}>{formatCurrency(getFormTotal())}</Text>
                </View>

                {/* Due Date */}
                <Text style={[s.fieldLabel, { marginTop: 20 }]}>Due Date</Text>
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={newInvoice.due_date}
                  onChangeText={(v) => setNewInvoice(prev => ({ ...prev, due_date: v }))}
                />

                {/* Status */}
                <Text style={[s.fieldLabel, { marginTop: 20 }]}>Status</Text>
                <View style={s.statusPicker}>
                  {['draft', 'sent'].map(st => {
                    const active = newInvoice.status === st
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[s.statusOption, active && s.statusOptionActive]}
                        onPress={() => setNewInvoice(prev => ({ ...prev, status: st }))}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.statusOptionText, active && { color: colors.primary }]}>
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                {/* Create Button */}
                <TouchableOpacity
                  style={s.createBtn}
                  onPress={handleCreate}
                  disabled={creating}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.primary, 'rgba(245,158,11,0.8)']}
                    style={s.createBtnGradient}
                  >
                    {creating ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={s.createBtnText}>Create Invoice</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  glowOrb1: {
    position: 'absolute', top: 40, right: -60, width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(245, 158, 11, 0.07)',
  },
  glowOrb2: {
    position: 'absolute', bottom: 200, left: -50, width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  headerBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '600' },

  // Stats
  statsRow: { marginTop: 16, maxHeight: 90 },
  statsContent: { paddingHorizontal: 20, gap: 10 },
  statCard: {
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 10,
    minWidth: 140, ...shadows.card,
  },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },

  // Search
  searchWrap: { marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  searchInner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, paddingHorizontal: 14, gap: 10, ...shadows.card,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: colors.text },

  // Filters
  filterRow: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)',
  },
  filterChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  filterChipTextActive: { color: colors.primary },

  // List
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  invoiceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10, ...shadows.card,
  },
  invoiceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  invoiceInfo: { flex: 1 },
  invoiceName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
  invoiceDate: { fontSize: 12, color: colors.textMuted },
  invoiceRight: { alignItems: 'flex-end' },
  invoiceAmount: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  invoiceItems: { fontSize: 12, color: colors.textSecondary, marginTop: 10 },

  // Empty
  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 20, ...shadows.card,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },

  // FAB
  fab: { position: 'absolute', bottom: 90, right: 24 },
  fabGradient: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    ...shadows.cardGlow,
  },
  fabText: { fontSize: 28, fontWeight: '600', color: '#000', marginTop: -2 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: { maxHeight: '92%' },
  modalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingTop: 20, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalClose: { fontSize: 20, color: colors.textMuted, padding: 4 },
  modalScroll: { paddingHorizontal: 24 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, color: colors.text },
  fieldPlaceholder: { fontSize: 14, color: colors.textMuted },

  customerPickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 14, marginBottom: 10,
  },
  chevronDown: { fontSize: 10, color: colors.textMuted },
  pickerList: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10, maxHeight: 160, overflow: 'hidden',
  },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  pickerItemText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  pickerItemSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 14, fontSize: 14, color: colors.text, marginBottom: 10,
  },

  lineItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineItemName: { flex: 2, marginBottom: 10 },
  lineItemPrice: { flex: 1, marginBottom: 10 },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)', marginBottom: 10,
  },
  removeBtnText: { color: colors.red, fontSize: 12, fontWeight: '700' },

  addItemBtn: {
    paddingVertical: 10, alignItems: 'center', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderStyle: 'dashed',
    marginBottom: 12,
  },
  addItemText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 4, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },

  statusPicker: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statusOption: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusOptionActive: {
    backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)',
  },
  statusOptionText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },

  createBtn: { marginTop: 24, marginBottom: 20 },
  createBtnGradient: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
})
