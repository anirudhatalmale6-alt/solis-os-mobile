import React, { useState, useCallback } from 'react'
import {
  View, Text, TextInput, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const STATUS_STYLES = {
  draft: { label: 'Draft', gradient: ['rgba(245,158,11,0.25)', 'rgba(245,158,11,0.10)'], color: colors.primary, border: 'rgba(245,158,11,0.3)' },
  sent: { label: 'Sent', gradient: ['rgba(59,130,246,0.25)', 'rgba(59,130,246,0.10)'], color: colors.blue, border: 'rgba(59,130,246,0.3)' },
  paid: { label: 'Paid', gradient: ['rgba(34,197,94,0.25)', 'rgba(34,197,94,0.10)'], color: colors.green, border: 'rgba(34,197,94,0.3)' },
  overdue: { label: 'Overdue', gradient: ['rgba(239,68,68,0.25)', 'rgba(239,68,68,0.10)'], color: colors.red, border: 'rgba(239,68,68,0.3)' },
}

const FILTER_OPTIONS = ['all', 'draft', 'sent', 'paid', 'overdue']

export default function InvoicesScreen() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [businessId, setBusinessId] = useState(null)
  const [businessName, setBusinessName] = useState('')
  const [businessLogo, setBusinessLogo] = useState(null)
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [creating, setCreating] = useState(false)
  const [detailInvoice, setDetailInvoice] = useState(null)
  const [newInvoice, setNewInvoice] = useState({
    customer_name: '',
    customer_email: '',
    items: [{ name: '', qty: '1', price: '' }],
    due_date: '',
    status: 'draft',
  })

  const fetchData = async () => {
    if (!user?.id) return
    try {
      const { data: bizArr } = await supabase
        .from('businesses')
        .select('id, name, logo_url, phone, email')
        .eq('owner_id', user.id)
      const biz = bizArr?.[0]
      if (!biz) { setLoading(false); return }
      setBusinessId(biz.id)
      setBusinessName(biz.name || '')
      setBusinessLogo(biz.logo_url || null)
      setBusinessPhone(biz.phone || '')
      setBusinessEmail(biz.email || '')

      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false })
      setInvoices(data || [])
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

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalPaidThisMonth = invoices
    .filter(inv => inv.status === 'paid' && new Date(inv.created_at) >= thisMonthStart)
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  const filtered = invoices.filter(inv => {
    if (filter !== 'all' && inv.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (inv.customer_name || '').toLowerCase().includes(q) || (inv.customer_email || '').toLowerCase().includes(q)
  })

  const fmt = (amount) => '$' + (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  const calcTotal = (items) => items.reduce((sum, it) => sum + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0)

  const handleCreate = async () => {
    if (!newInvoice.customer_name.trim()) { Alert.alert('Required', 'Enter customer name'); return }
    const validItems = newInvoice.items.filter(it => it.name.trim() && parseFloat(it.price) > 0)
    if (validItems.length === 0) { Alert.alert('Required', 'Add at least one item with name and price'); return }
    if (!newInvoice.due_date.trim()) { Alert.alert('Required', 'Enter due date (DD/MM/YYYY)'); return }

    setCreating(true)
    try {
      const items = validItems.map(it => ({
        name: it.name.trim(),
        qty: parseInt(it.qty) || 1,
        price: parseFloat(it.price),
      }))
      const total = items.reduce((sum, it) => sum + it.qty * it.price, 0)

      let dueDate = newInvoice.due_date.trim()
      const ddmmyyyy = dueDate.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
      if (ddmmyyyy) {
        dueDate = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`
      }

      const { error } = await supabase.from('invoices').insert({
        business_id: businessId,
        customer_name: newInvoice.customer_name.trim(),
        customer_email: newInvoice.customer_email.trim(),
        items,
        total,
        status: newInvoice.status,
        due_date: dueDate,
      })
      if (error) throw error

      setModalVisible(false)
      resetForm()
      await fetchData()
      Alert.alert('Created', 'Invoice created successfully')
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create invoice')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setNewInvoice({ customer_name: '', customer_email: '', items: [{ name: '', qty: '1', price: '' }], due_date: '', status: 'draft' })
  }

  const addLineItem = () => {
    setNewInvoice(prev => ({ ...prev, items: [...prev.items, { name: '', qty: '1', price: '' }] }))
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
    setNewInvoice(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))
  }

  const updateStatus = async (invoice, newStatus) => {
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', invoice.id)
    if (error) Alert.alert('Error', error.message)
    else fetchData()
  }

  const deleteInvoice = (invoice) => {
    Alert.alert('Delete Invoice', `Delete invoice for ${invoice.customer_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('invoices').delete().eq('id', invoice.id)
        setDetailInvoice(null)
        fetchData()
      }},
    ])
  }

  if (loading) {
    return <View style={[s.container, s.center]}><ActivityIndicator size="large" color={colors.primary} /></View>
  }

  return (
    <View style={s.container}>
      <LinearGradient colors={['rgba(245,158,11,0.08)', 'rgba(59,130,246,0.04)', 'transparent']} style={s.headerGlow} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Invoices</Text>
        <View style={s.headerBadge}><Text style={s.headerBadgeText}>{invoices.length} total</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statsRow} contentContainerStyle={s.statsContent}>
        <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={s.statCard}>
          <Text style={s.statLabel}>Outstanding</Text>
          <Text style={[s.statValue, { color: colors.primary }]}>{fmt(totalOutstanding)}</Text>
        </LinearGradient>
        <LinearGradient colors={['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)']} style={s.statCard}>
          <Text style={s.statLabel}>Paid This Month</Text>
          <Text style={[s.statValue, { color: colors.green }]}>{fmt(totalPaidThisMonth)}</Text>
        </LinearGradient>
        <LinearGradient colors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)']} style={s.statCard}>
          <Text style={s.statLabel}>Total Invoices</Text>
          <Text style={[s.statValue, { color: colors.blue }]}>{invoices.length}</Text>
        </LinearGradient>
      </ScrollView>

      <View style={s.searchWrap}>
        <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']} style={s.searchInner}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
          <TextInput style={s.searchInput} placeholder="Search invoices..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
        </LinearGradient>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={s.filterContent}>
        {FILTER_OPTIONS.map(opt => (
          <TouchableOpacity key={opt} onPress={() => setFilter(opt)} style={[s.filterChip, filter === opt && s.filterChipActive]} activeOpacity={0.7}>
            <Text style={[s.filterChipText, filter === opt && s.filterChipTextActive]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {filtered.length === 0 ? (
          <LinearGradient colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']} style={s.empty}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>{search || filter !== 'all' ? 'No invoices found' : 'No invoices yet'}</Text>
            <Text style={s.emptyDesc}>{search || filter !== 'all' ? 'Try adjusting your search or filter' : 'Tap + to create your first invoice'}</Text>
          </LinearGradient>
        ) : (
          filtered.map((invoice) => {
            const ss = STATUS_STYLES[invoice.status] || STATUS_STYLES.draft
            const itemCount = Array.isArray(invoice.items) ? invoice.items.length : 0
            return (
              <TouchableOpacity key={invoice.id} style={s.invoiceCard} activeOpacity={0.8} onPress={() => setDetailInvoice(invoice)}>
                <View style={s.invoiceTop}>
                  <View style={s.invoiceInfo}>
                    <Text style={s.invoiceName}>{invoice.customer_name || 'Unknown'}</Text>
                    <Text style={s.invoiceDate}>{fmtDate(invoice.due_date || invoice.created_at)}</Text>
                    <Text style={s.invoiceItemCount}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={s.invoiceRight}>
                    <Text style={s.invoiceAmount}>{fmt(invoice.total)}</Text>
                    <LinearGradient colors={ss.gradient} style={[s.statusBadge, { borderColor: ss.border }]}>
                      <Text style={[s.statusText, { color: ss.color }]}>{ss.label}</Text>
                    </LinearGradient>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={[colors.primary, 'rgba(245,158,11,0.8)']} style={s.fabGradient}>
          <Text style={s.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Invoice Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); resetForm() }}>
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalContainer}>
            <LinearGradient colors={['rgba(20,20,30,0.99)', 'rgba(8,8,13,0.99)']} style={s.modalContent}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>New Invoice</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm() }}><MaterialCommunityIcons name="close" size={22} color={colors.textMuted} /></TouchableOpacity>
              </View>

              <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={s.fieldLabel}>Customer Name</Text>
                <TextInput style={s.input} placeholder="John Smith" placeholderTextColor={colors.textMuted} value={newInvoice.customer_name} onChangeText={(v) => setNewInvoice(prev => ({ ...prev, customer_name: v }))} />

                <Text style={s.fieldLabel}>Customer Email (optional)</Text>
                <TextInput style={s.input} placeholder="john@email.com" placeholderTextColor={colors.textMuted} value={newInvoice.customer_email} onChangeText={(v) => setNewInvoice(prev => ({ ...prev, customer_email: v }))} keyboardType="email-address" autoCapitalize="none" />

                <Text style={[s.fieldLabel, { marginTop: 16 }]}>Items</Text>
                <View style={s.itemsHeader}>
                  <Text style={[s.itemsHeaderText, { flex: 3 }]}>Description</Text>
                  <Text style={[s.itemsHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[s.itemsHeaderText, { flex: 1.5, textAlign: 'right' }]}>Price</Text>
                  <Text style={[s.itemsHeaderText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
                  <View style={{ width: 28 }} />
                </View>

                {newInvoice.items.map((item, index) => {
                  const lineTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)
                  return (
                    <View key={index} style={s.lineItemRow}>
                      <TextInput style={[s.lineInput, { flex: 3 }]} placeholder="Service" placeholderTextColor={colors.textMuted} value={item.name} onChangeText={(v) => updateLineItem(index, 'name', v)} />
                      <TextInput style={[s.lineInput, { flex: 1, textAlign: 'center' }]} placeholder="1" placeholderTextColor={colors.textMuted} value={item.qty} onChangeText={(v) => updateLineItem(index, 'qty', v)} keyboardType="number-pad" />
                      <TextInput style={[s.lineInput, { flex: 1.5, textAlign: 'right' }]} placeholder="0.00" placeholderTextColor={colors.textMuted} value={item.price} onChangeText={(v) => updateLineItem(index, 'price', v)} keyboardType="decimal-pad" />
                      <Text style={[s.lineTotalText, { flex: 1.5 }]}>{fmt(lineTotal)}</Text>
                      {newInvoice.items.length > 1 && (
                        <TouchableOpacity onPress={() => removeLineItem(index)} style={s.removeBtn}>
                          <MaterialCommunityIcons name="close-circle" size={20} color={colors.red} />
                        </TouchableOpacity>
                      )}
                      {newInvoice.items.length <= 1 && <View style={{ width: 28 }} />}
                    </View>
                  )
                })}

                <TouchableOpacity style={s.addItemBtn} onPress={addLineItem} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
                  <Text style={s.addItemText}>Add Item</Text>
                </TouchableOpacity>

                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Subtotal</Text>
                  <Text style={s.totalValue}>{fmt(calcTotal(newInvoice.items))}</Text>
                </View>

                <Text style={[s.fieldLabel, { marginTop: 16 }]}>Due Date</Text>
                <TextInput style={s.input} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textMuted} value={newInvoice.due_date} onChangeText={(v) => setNewInvoice(prev => ({ ...prev, due_date: v }))} keyboardType="number-pad" />

                <Text style={[s.fieldLabel, { marginTop: 16 }]}>Status</Text>
                <View style={s.statusPicker}>
                  {['draft', 'sent'].map(st => (
                    <TouchableOpacity key={st} style={[s.statusOption, newInvoice.status === st && s.statusOptionActive]} onPress={() => setNewInvoice(prev => ({ ...prev, status: st }))} activeOpacity={0.7}>
                      <Text style={[s.statusOptionText, newInvoice.status === st && { color: colors.primary }]}>{st.charAt(0).toUpperCase() + st.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={s.createBtn} onPress={handleCreate} disabled={creating} activeOpacity={0.85}>
                  <LinearGradient colors={[colors.primary, 'rgba(245,158,11,0.8)']} style={s.createBtnGradient}>
                    {creating ? <ActivityIndicator color="#000" /> : <Text style={s.createBtnText}>Create Invoice</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal visible={!!detailInvoice} animationType="slide" transparent onRequestClose={() => setDetailInvoice(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <LinearGradient colors={['rgba(20,20,30,0.99)', 'rgba(8,8,13,0.99)']} style={s.modalContent}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Invoice</Text>
                <TouchableOpacity onPress={() => setDetailInvoice(null)}><MaterialCommunityIcons name="close" size={22} color={colors.textMuted} /></TouchableOpacity>
              </View>

              {detailInvoice && (
                <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Business header with logo */}
                  <View style={s.detailBizHeader}>
                    {businessLogo ? (
                      <Image source={{ uri: businessLogo }} style={s.detailLogo} />
                    ) : (
                      <View style={s.detailLogoPlaceholder}>
                        <MaterialCommunityIcons name="store" size={28} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={s.detailBizInfo}>
                      <Text style={s.detailBizName}>{businessName || 'Your Business'}</Text>
                      {businessPhone ? <Text style={s.detailBizContact}>{businessPhone}</Text> : null}
                      {businessEmail ? <Text style={s.detailBizContact}>{businessEmail}</Text> : null}
                    </View>
                  </View>

                  <View style={s.detailDivider} />

                  {/* Invoice status + dates */}
                  <View style={s.detailStatusRow}>
                    <LinearGradient colors={(STATUS_STYLES[detailInvoice.status] || STATUS_STYLES.draft).gradient} style={[s.statusBadge, { borderColor: (STATUS_STYLES[detailInvoice.status] || STATUS_STYLES.draft).border }]}>
                      <Text style={[s.statusText, { color: (STATUS_STYLES[detailInvoice.status] || STATUS_STYLES.draft).color }]}>{(STATUS_STYLES[detailInvoice.status] || STATUS_STYLES.draft).label}</Text>
                    </LinearGradient>
                    <Text style={s.detailDate}>Due: {fmtDate(detailInvoice.due_date)}</Text>
                  </View>

                  {/* Bill to */}
                  <Text style={s.detailSectionLabel}>Bill To</Text>
                  <Text style={s.detailCustomerName}>{detailInvoice.customer_name}</Text>
                  {detailInvoice.customer_email ? <Text style={s.detailCustomerEmail}>{detailInvoice.customer_email}</Text> : null}

                  {/* Items table */}
                  <Text style={[s.detailSectionLabel, { marginTop: 20 }]}>Items</Text>
                  <View style={s.detailTableHeader}>
                    <Text style={[s.detailTableHeaderText, { flex: 3 }]}>Description</Text>
                    <Text style={[s.detailTableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                    <Text style={[s.detailTableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Price</Text>
                    <Text style={[s.detailTableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
                  </View>

                  {(detailInvoice.items || []).map((item, i) => {
                    const q = item.qty || 1
                    const p = item.price || 0
                    return (
                      <View key={i} style={s.detailTableRow}>
                        <Text style={[s.detailTableCell, { flex: 3 }]}>{item.name}</Text>
                        <Text style={[s.detailTableCell, { flex: 1, textAlign: 'center' }]}>{q}</Text>
                        <Text style={[s.detailTableCell, { flex: 1.5, textAlign: 'right' }]}>{fmt(p)}</Text>
                        <Text style={[s.detailTableCell, { flex: 1.5, textAlign: 'right', fontWeight: '600' }]}>{fmt(q * p)}</Text>
                      </View>
                    )
                  })}

                  <View style={s.detailTotalRow}>
                    <Text style={s.detailTotalLabel}>Total</Text>
                    <Text style={s.detailTotalValue}>{fmt(detailInvoice.total)}</Text>
                  </View>

                  <Text style={s.detailCreatedDate}>Created: {fmtDate(detailInvoice.created_at)}</Text>

                  {/* Action buttons */}
                  <View style={s.detailActions}>
                    {detailInvoice.status === 'draft' && (
                      <TouchableOpacity style={s.actionBtn} onPress={() => { updateStatus(detailInvoice, 'sent'); setDetailInvoice(prev => prev ? { ...prev, status: 'sent' } : null) }}>
                        <MaterialCommunityIcons name="send" size={18} color={colors.blue} />
                        <Text style={[s.actionBtnText, { color: colors.blue }]}>Mark Sent</Text>
                      </TouchableOpacity>
                    )}
                    {(detailInvoice.status === 'sent' || detailInvoice.status === 'overdue') && (
                      <TouchableOpacity style={s.actionBtn} onPress={() => { updateStatus(detailInvoice, 'paid'); setDetailInvoice(prev => prev ? { ...prev, status: 'paid' } : null) }}>
                        <MaterialCommunityIcons name="check-circle" size={18} color={colors.green} />
                        <Text style={[s.actionBtnText, { color: colors.green }]}>Mark Paid</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[s.actionBtn, { borderColor: 'rgba(239,68,68,0.3)' }]} onPress={() => deleteInvoice(detailInvoice)}>
                      <MaterialCommunityIcons name="delete-outline" size={18} color={colors.red} />
                      <Text style={[s.actionBtnText, { color: colors.red }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerBadge: { backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  headerBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '600' },

  statsRow: { marginTop: 16, maxHeight: 90 },
  statsContent: { paddingHorizontal: 20, gap: 10 },
  statCard: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 10, minWidth: 140 },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },

  searchWrap: { marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  searchInner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: colors.text },

  filterRow: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8 },
  filterChipActive: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
  filterChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  filterChipTextActive: { color: colors.primary },

  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  invoiceCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  invoiceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  invoiceInfo: { flex: 1 },
  invoiceName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
  invoiceDate: { fontSize: 12, color: colors.textMuted },
  invoiceItemCount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end' },
  invoiceAmount: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 60, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },

  fab: { position: 'absolute', bottom: 90, right: 24 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  fabText: { fontSize: 28, fontWeight: '600', color: '#000', marginTop: -2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { maxHeight: '92%' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingTop: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalScroll: { paddingHorizontal: 24 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 14, fontSize: 14, color: colors.text, marginBottom: 12 },

  itemsHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', marginBottom: 8 },
  itemsHeaderText: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },

  lineItemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  lineInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 10, fontSize: 13, color: colors.text },
  lineTotalText: { fontSize: 13, color: colors.primary, fontWeight: '600', textAlign: 'right' },
  removeBtn: { width: 28, alignItems: 'center', justifyContent: 'center' },

  addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderStyle: 'dashed', marginBottom: 12, marginTop: 4 },
  addItemText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.primary },

  statusPicker: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statusOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusOptionActive: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' },
  statusOptionText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },

  createBtn: { marginTop: 24, marginBottom: 20 },
  createBtnGradient: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },

  // Detail modal
  detailBizHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  detailLogo: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  detailLogoPlaceholder: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  detailBizInfo: { flex: 1 },
  detailBizName: { fontSize: 18, fontWeight: '700', color: colors.text },
  detailBizContact: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  detailDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },

  detailStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  detailDate: { fontSize: 13, color: colors.textSecondary },

  detailSectionLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  detailCustomerName: { fontSize: 16, fontWeight: '600', color: colors.text },
  detailCustomerEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  detailTableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  detailTableHeaderText: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  detailTableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  detailTableCell: { fontSize: 13, color: colors.text },

  detailTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, marginTop: 8 },
  detailTotalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  detailTotalValue: { fontSize: 22, fontWeight: '800', color: colors.primary },

  detailCreatedDate: { fontSize: 11, color: colors.textMuted, marginBottom: 20 },

  detailActions: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
})
