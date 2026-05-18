import React, { useState, useCallback } from 'react'
import {
  View, Text, TextInput, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, Share, Linking,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import RNHTMLtoPDF from 'react-native-html-to-pdf'
import RNShare from 'react-native-share'
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

const todayStr = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

const todayISO = () => new Date().toISOString().split('T')[0]

const genInvoiceNum = () => {
  const d = new Date()
  return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*900+100)}`
}

const resolveInvoice = (inv) => {
  const metaItem = (inv.items || []).find(it => it && it.__meta)
  return {
    ...inv,
    invoice_number: inv.invoice_number || (metaItem && metaItem.invoice_number) || '',
    customer_phone: inv.customer_phone || (metaItem && metaItem.customer_phone) || '',
    notes: inv.notes || (metaItem && metaItem.notes) || '',
    items: (inv.items || []).filter(it => !it || !it.__meta),
  }
}

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
  const [businessAddress, setBusinessAddress] = useState('')
  const [customers, setCustomers] = useState([])

  const [modalVisible, setModalVisible] = useState(false)
  const [creating, setCreating] = useState(false)
  const [detailInvoice, setDetailInvoice] = useState(null)
  const [newInvoice, setNewInvoice] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    items: [{ name: '', qty: '1', price: '' }],
    due_date: todayStr(),
    notes: '',
    status: 'draft',
    invoice_number: genInvoiceNum(),
  })

  const fetchData = async () => {
    if (!user?.id) return
    try {
      const { data: bizArr } = await supabase
        .from('businesses')
        .select('id, name, logo_url, phone, email, address')
        .eq('owner_id', user.id)
      const biz = bizArr?.[0]
      if (!biz) { setLoading(false); return }
      setBusinessId(biz.id)
      setBusinessName(biz.name || '')
      setBusinessLogo(biz.logo_url || null)
      setBusinessPhone(biz.phone || '')
      setBusinessEmail(biz.email || '')
      setBusinessAddress(biz.address || '')

      const [invoicesRes, customersRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }),
        supabase.from('customers').select('name, phone, email').eq('business_id', biz.id).order('name'),
      ])
      const rawData = invoicesRes.data || []
      const invData = rawData.map(resolveInvoice)

      const todayDate = todayISO()
      const overdueUpdates = invData.filter(inv => inv.status === 'sent' && inv.due_date && inv.due_date < todayDate)
      if (overdueUpdates.length > 0) {
        await Promise.all(overdueUpdates.map(inv =>
          supabase.from('invoices').update({ status: 'overdue' }).eq('id', inv.id)
        ))
        overdueUpdates.forEach(inv => { inv.status = 'overdue' })
      }

      setInvoices(invData)
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

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalPaidThisMonth = invoices
    .filter(inv => inv.status === 'paid' && new Date(inv.created_at) >= thisMonthStart)
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length

  const filtered = invoices.filter(inv => {
    if (filter !== 'all' && inv.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (inv.customer_name || '').toLowerCase().includes(q) || (inv.customer_email || '').toLowerCase().includes(q) || (inv.invoice_number || '').toLowerCase().includes(q)
  })

  const fmt = (amount) => '$' + (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  const calcTotal = (items) => items.reduce((sum, it) => sum + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0)

  const buildInvoiceText = (invoice) => {
    const items = (invoice.items || []).map((it, i) => {
      const q = it.qty || 1
      const p = it.price || 0
      return `${i+1}. ${it.name} x${q} - ${fmt(p)} = ${fmt(q*p)}`
    }).join('\n')

    let text = `INVOICE${invoice.invoice_number ? ' #' + invoice.invoice_number : ''}\n`
    text += `From: ${businessName || 'Business'}\n`
    if (businessPhone) text += `Phone: ${businessPhone}\n`
    if (businessEmail) text += `Email: ${businessEmail}\n`
    text += `\nBill To: ${invoice.customer_name}\n`
    if (invoice.customer_email) text += `Email: ${invoice.customer_email}\n`
    if (invoice.customer_phone) text += `Phone: ${invoice.customer_phone}\n`
    text += `\nItems:\n${items}\n`
    text += `\nTotal: ${fmt(invoice.total)}\n`
    text += `Due: ${fmtDate(invoice.due_date)}\n`
    text += `Status: ${(STATUS_STYLES[invoice.status] || STATUS_STYLES.draft).label}\n`
    if (invoice.notes) text += `\nNotes: ${invoice.notes}\n`
    text += `\nThank you for your business!`
    return text
  }

  const buildInvoiceHTML = (invoice) => {
    const itemRows = (invoice.items || []).map((it, i) => {
      const q = it.qty || 1
      const p = it.price || 0
      return `<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${it.name}</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${q}</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(p)}</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt(q*p)}</td></tr>`
    }).join('')

    const logoHtml = businessLogo
      ? `<img src="${businessLogo}" style="width:60px;height:60px;border-radius:12px;object-fit:cover;" />`
      : `<div style="width:60px;height:60px;border-radius:12px;background:#f59e0b;display:flex;align-items:center;justify-content:center;"><span style="font-size:24px;font-weight:800;color:#000;">${(businessName || 'B')[0]}</span></div>`

    const statusColor = { draft: '#f59e0b', sent: '#3b82f6', paid: '#22c55e', overdue: '#ef4444' }[invoice.status] || '#f59e0b'
    const statusLabel = (STATUS_STYLES[invoice.status] || STATUS_STYLES.draft).label

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:30px;color:#1f2937;background:#fff;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:2px solid #f59e0b;padding-bottom:20px;}
      .biz-info{display:flex;align-items:center;gap:16px;}
      .biz-details h1{margin:0;font-size:20px;color:#111827;}
      .biz-details p{margin:2px 0;font-size:12px;color:#6b7280;}
      .invoice-title{text-align:right;}
      .invoice-title h2{margin:0;font-size:28px;color:#f59e0b;font-weight:800;}
      .invoice-title p{margin:4px 0;font-size:12px;color:#6b7280;}
      .status-badge{display:inline-block;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;color:#fff;background:${statusColor};}
      .bill-to{margin:20px 0;padding:16px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;}
      .bill-to h3{margin:0 0 6px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;}
      .bill-to p{margin:2px 0;font-size:14px;color:#374151;}
      table{width:100%;border-collapse:collapse;margin:20px 0;}
      th{background:#f9fafb;padding:10px 12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e5e7eb;}
      .total-row{display:flex;justify-content:flex-end;margin:10px 0 20px;}
      .total-box{background:#111827;color:#fff;padding:16px 30px;border-radius:10px;text-align:right;}
      .total-box span{font-size:12px;color:#9ca3af;display:block;}
      .total-box strong{font-size:24px;color:#f59e0b;}
      .notes{margin:16px 0;padding:14px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;}
      .notes h4{margin:0 0 4px;font-size:12px;color:#92400e;}
      .notes p{margin:0;font-size:13px;color:#78350f;}
      .footer{margin-top:30px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;}
    </style></head><body>
      <div class="header">
        <div class="biz-info">${logoHtml}<div class="biz-details"><h1>${businessName || 'Business'}</h1>${businessAddress ? `<p>${businessAddress}</p>` : ''}${businessPhone ? `<p>${businessPhone}</p>` : ''}${businessEmail ? `<p>${businessEmail}</p>` : ''}</div></div>
        <div class="invoice-title"><h2>INVOICE</h2>${invoice.invoice_number ? `<p>${invoice.invoice_number}</p>` : ''}<p>Date: ${fmtDate(invoice.created_at)}</p><p>Due: ${fmtDate(invoice.due_date)}</p><div style="margin-top:8px;"><span class="status-badge">${statusLabel}</span></div></div>
      </div>
      <div class="bill-to"><h3>Bill To</h3><p style="font-weight:600;font-size:16px;">${invoice.customer_name}</p>${invoice.customer_email ? `<p>${invoice.customer_email}</p>` : ''}${invoice.customer_phone ? `<p>${invoice.customer_phone}</p>` : ''}</div>
      <table><thead><tr><th style="text-align:left;">Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th></tr></thead><tbody>${itemRows}</tbody></table>
      <div class="total-row"><div class="total-box"><span>Total Amount</span><strong>${fmt(invoice.total)}</strong></div></div>
      ${invoice.notes ? `<div class="notes"><h4>Notes</h4><p>${invoice.notes}</p></div>` : ''}
      <div class="footer"><p>Thank you for your business!</p><p>Generated by Solis OS</p></div>
    </body></html>`
  }

  const shareInvoicePDF = async (invoice) => {
    try {
      const html = buildInvoiceHTML(invoice)
      const pdf = await RNHTMLtoPDF.convert({
        html,
        fileName: `Invoice_${invoice.invoice_number || invoice.customer_name || 'document'}`,
        base64: false,
      })
      await RNShare.open({
        url: `file://${pdf.filePath}`,
        type: 'application/pdf',
        title: `Invoice - ${invoice.customer_name}`,
      })
    } catch (e) {
      if (e.message !== 'User did not share') {
        const text = buildInvoiceText(invoice)
        Share.share({ message: text, title: `Invoice - ${invoice.customer_name}` }).catch(() => {})
      }
    }
  }

  const shareInvoice = async (invoice) => {
    const text = buildInvoiceText(invoice)
    try {
      await Share.share({ message: text, title: `Invoice - ${invoice.customer_name}` })
    } catch (e) {}
  }

  const sendViaWhatsApp = async (invoice) => {
    try {
      const html = buildInvoiceHTML(invoice)
      const pdf = await RNHTMLtoPDF.convert({
        html,
        fileName: `Invoice_${invoice.invoice_number || 'document'}`,
        base64: false,
      })
      const phone = (invoice.customer_phone || '').replace(/[^0-9]/g, '')
      await RNShare.open({
        url: `file://${pdf.filePath}`,
        type: 'application/pdf',
        social: RNShare.Social.WHATSAPP,
        whatsAppNumber: phone || undefined,
        title: `Invoice - ${invoice.customer_name}`,
      })
    } catch (e) {
      const phone = (invoice.customer_phone || '').replace(/[^0-9]/g, '')
      const text = encodeURIComponent(buildInvoiceText(invoice))
      const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
      Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open WhatsApp'))
    }
  }

  const sendReminder = (invoice) => {
    const phone = (invoice.customer_phone || '').replace(/[^0-9]/g, '')
    const text = encodeURIComponent(
      `Hi ${invoice.customer_name},\n\nThis is a friendly reminder that your invoice${invoice.invoice_number ? ' #' + invoice.invoice_number : ''} for ${fmt(invoice.total)} was due on ${fmtDate(invoice.due_date)}.\n\nPlease let us know if you have any questions.\n\nThank you,\n${businessName || 'Business'}`
    )
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open WhatsApp'))
  }

  const duplicateInvoice = (invoice) => {
    setNewInvoice({
      customer_name: invoice.customer_name || '',
      customer_email: invoice.customer_email || '',
      customer_phone: invoice.customer_phone || '',
      items: (invoice.items || [{ name: '', qty: '1', price: '' }]).map(it => ({ name: it.name || '', qty: String(it.qty || 1), price: String(it.price || '') })),
      due_date: todayStr(),
      notes: invoice.notes || '',
      status: 'draft',
      invoice_number: genInvoiceNum(),
    })
    setDetailInvoice(null)
    setModalVisible(true)
  }

  const handleCreate = async () => {
    if (!newInvoice.customer_name.trim()) { Alert.alert('Required', 'Enter customer name'); return }
    const validItems = newInvoice.items.filter(it => it.name.trim() && parseFloat(it.price) > 0)
    if (validItems.length === 0) { Alert.alert('Required', 'Add at least one item with name and price'); return }

    setCreating(true)
    try {
      const items = validItems.map(it => ({
        name: it.name.trim(),
        qty: parseInt(it.qty) || 1,
        price: parseFloat(it.price),
      }))
      const total = items.reduce((sum, it) => sum + it.qty * it.price, 0)

      let dueDate = newInvoice.due_date.trim()
      if (!dueDate) dueDate = todayStr()
      const ddmmyyyy = dueDate.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
      if (ddmmyyyy) {
        dueDate = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`
      }

      const meta = { __meta: true }
      if (newInvoice.invoice_number) meta.invoice_number = newInvoice.invoice_number
      if (newInvoice.customer_phone.trim()) meta.customer_phone = newInvoice.customer_phone.trim()
      if (newInvoice.notes.trim()) meta.notes = newInvoice.notes.trim()
      const itemsWithMeta = Object.keys(meta).length > 1 ? [...items, meta] : items

      const fullInsert = {
        business_id: businessId,
        customer_name: newInvoice.customer_name.trim(),
        customer_email: newInvoice.customer_email.trim(),
        customer_phone: newInvoice.customer_phone.trim(),
        items: itemsWithMeta,
        total,
        status: newInvoice.status,
        due_date: dueDate,
        notes: newInvoice.notes.trim(),
        invoice_number: newInvoice.invoice_number,
      }

      let { error } = await supabase.from('invoices').insert(fullInsert)
      if (error && error.message && (error.message.includes('column') || error.code === '42703')) {
        const baseInsert = {
          business_id: businessId,
          customer_name: newInvoice.customer_name.trim(),
          customer_email: newInvoice.customer_email.trim(),
          items: itemsWithMeta,
          total,
          status: newInvoice.status,
          due_date: dueDate,
        }
        const { error: err2 } = await supabase.from('invoices').insert(baseInsert)
        if (err2) throw err2
      } else if (error) {
        throw error
      }

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
    setNewInvoice({
      customer_name: '', customer_email: '', customer_phone: '',
      items: [{ name: '', qty: '1', price: '' }],
      due_date: todayStr(), notes: '', status: 'draft', invoice_number: genInvoiceNum(),
    })
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

  const selectCustomer = (cust) => {
    setNewInvoice(prev => ({
      ...prev,
      customer_name: cust.name || prev.customer_name,
      customer_email: cust.email || prev.customer_email,
      customer_phone: cust.phone || prev.customer_phone,
    }))
  }

  if (loading) {
    return <View style={[s.container, s.center]}><ActivityIndicator size="large" color={colors.primary} /></View>
  }

  return (
    <View style={s.container}>
      <LinearGradient colors={['rgba(245,158,11,0.08)', 'rgba(59,130,246,0.04)', 'transparent']} style={s.headerGlow} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Invoices</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {overdueCount > 0 && (
            <View style={s.overdueBadge}><Text style={s.overdueBadgeText}>{overdueCount} overdue</Text></View>
          )}
          <View style={s.headerBadge}><Text style={s.headerBadgeText}>{invoices.length} total</Text></View>
        </View>
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
        <LinearGradient colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)']} style={s.statCard}>
          <Text style={s.statLabel}>Overdue</Text>
          <Text style={[s.statValue, { color: colors.red }]}>{overdueCount}</Text>
        </LinearGradient>
        <LinearGradient colors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)']} style={s.statCard}>
          <Text style={s.statLabel}>Total Invoices</Text>
          <Text style={[s.statValue, { color: colors.blue }]}>{invoices.length}</Text>
        </LinearGradient>
      </ScrollView>

      <View style={s.searchWrap}>
        <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']} style={s.searchInner}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
          <TextInput style={s.searchInput} placeholder="Search by name, email, or invoice #..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
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
                    {invoice.invoice_number && <Text style={s.invoiceNum}>{invoice.invoice_number}</Text>}
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

      <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={() => { resetForm(); setModalVisible(true) }}>
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
                <View style={s.invoiceNumRow}>
                  <Text style={s.invoiceNumLabel}>Invoice #</Text>
                  <Text style={s.invoiceNumValue}>{newInvoice.invoice_number}</Text>
                </View>

                <Text style={s.fieldLabel}>Customer Name</Text>
                <TextInput style={s.input} placeholder="John Smith" placeholderTextColor={colors.textMuted} value={newInvoice.customer_name} onChangeText={(v) => setNewInvoice(prev => ({ ...prev, customer_name: v }))} />

                {customers.length > 0 && !newInvoice.customer_name && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, marginTop: -4 }}>
                    {customers.slice(0, 10).map((c, i) => (
                      <TouchableOpacity key={i} onPress={() => selectCustomer(c)} style={s.customerChip} activeOpacity={0.7}>
                        <Text style={s.customerChipText}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <Text style={s.fieldLabel}>Customer Email (optional)</Text>
                <TextInput style={s.input} placeholder="john@email.com" placeholderTextColor={colors.textMuted} value={newInvoice.customer_email} onChangeText={(v) => setNewInvoice(prev => ({ ...prev, customer_email: v }))} keyboardType="email-address" autoCapitalize="none" />

                <Text style={s.fieldLabel}>Customer Phone (for WhatsApp)</Text>
                <TextInput style={s.input} placeholder="+61 400 000 000" placeholderTextColor={colors.textMuted} value={newInvoice.customer_phone} onChangeText={(v) => setNewInvoice(prev => ({ ...prev, customer_phone: v }))} keyboardType="phone-pad" />

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
                  <Text style={s.totalLabel}>Total</Text>
                  <Text style={s.totalValue}>{fmt(calcTotal(newInvoice.items))}</Text>
                </View>

                <Text style={[s.fieldLabel, { marginTop: 16 }]}>Due Date</Text>
                <TextInput style={s.input} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textMuted} value={newInvoice.due_date} onChangeText={(v) => setNewInvoice(prev => ({ ...prev, due_date: v }))} keyboardType="number-pad" />
                <Text style={s.fieldHint}>Defaults to today. Change if needed.</Text>

                <Text style={[s.fieldLabel, { marginTop: 12 }]}>Notes (optional)</Text>
                <TextInput style={[s.input, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Payment terms, thank you message, etc." placeholderTextColor={colors.textMuted} value={newInvoice.notes} onChangeText={(v) => setNewInvoice(prev => ({ ...prev, notes: v }))} multiline />

                <Text style={[s.fieldLabel, { marginTop: 12 }]}>Status</Text>
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
                      {businessAddress ? <Text style={s.detailBizContact}>{businessAddress}</Text> : null}
                      {businessPhone ? <Text style={s.detailBizContact}>{businessPhone}</Text> : null}
                      {businessEmail ? <Text style={s.detailBizContact}>{businessEmail}</Text> : null}
                    </View>
                  </View>

                  {detailInvoice.invoice_number && (
                    <Text style={s.detailInvoiceNum}>{detailInvoice.invoice_number}</Text>
                  )}

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
                  {detailInvoice.customer_phone ? <Text style={s.detailCustomerEmail}>{detailInvoice.customer_phone}</Text> : null}

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

                  {detailInvoice.notes ? (
                    <View style={s.notesBox}>
                      <Text style={s.noteLabel}>Notes</Text>
                      <Text style={s.noteText}>{detailInvoice.notes}</Text>
                    </View>
                  ) : null}

                  <Text style={s.detailCreatedDate}>Created: {fmtDate(detailInvoice.created_at)}</Text>

                  {/* Share / Send buttons */}
                  <Text style={[s.detailSectionLabel, { marginTop: 8 }]}>Send & Share</Text>
                  <View style={s.shareRow}>
                    <TouchableOpacity style={s.shareBtn} onPress={() => sendViaWhatsApp(detailInvoice)} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                      <Text style={[s.shareBtnText, { color: '#25D366' }]}>WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.shareBtn} onPress={() => shareInvoicePDF(detailInvoice)} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.red} />
                      <Text style={[s.shareBtnText, { color: colors.red }]}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.shareBtn} onPress={() => shareInvoice(detailInvoice)} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="share-variant" size={20} color={colors.blue} />
                      <Text style={[s.shareBtnText, { color: colors.blue }]}>Text</Text>
                    </TouchableOpacity>
                    {(detailInvoice.status === 'sent' || detailInvoice.status === 'overdue') && (
                      <TouchableOpacity style={s.shareBtn} onPress={() => sendReminder(detailInvoice)} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="bell-ring-outline" size={20} color={colors.primary} />
                        <Text style={[s.shareBtnText, { color: colors.primary }]}>Remind</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Action buttons */}
                  <Text style={[s.detailSectionLabel, { marginTop: 16 }]}>Actions</Text>
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
                    <TouchableOpacity style={s.actionBtn} onPress={() => duplicateInvoice(detailInvoice)}>
                      <MaterialCommunityIcons name="content-copy" size={18} color={colors.textSecondary} />
                      <Text style={[s.actionBtnText, { color: colors.textSecondary }]}>Duplicate</Text>
                    </TouchableOpacity>
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
  overdueBadge: { backgroundColor: 'rgba(239,68,68,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  overdueBadgeText: { fontSize: 11, color: colors.red, fontWeight: '600' },

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
  invoiceName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  invoiceNum: { fontSize: 11, color: colors.primary, fontWeight: '500', marginBottom: 2 },
  invoiceDate: { fontSize: 12, color: colors.textMuted },
  invoiceItemCount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end' },
  invoiceAmount: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 60, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },

  fab: { position: 'absolute', bottom: 110, right: 24 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  fabText: { fontSize: 28, fontWeight: '600', color: '#000', marginTop: -2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { maxHeight: '92%' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingTop: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalScroll: { paddingHorizontal: 24 },

  invoiceNumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  invoiceNumLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  invoiceNumValue: { fontSize: 14, fontWeight: '700', color: colors.primary },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldHint: { fontSize: 11, color: colors.textMuted, marginTop: -8, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 14, fontSize: 14, color: colors.text, marginBottom: 12 },

  customerChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', marginRight: 8 },
  customerChipText: { fontSize: 12, color: colors.blue, fontWeight: '500' },

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
  detailBizHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  detailLogo: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  detailLogoPlaceholder: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  detailBizInfo: { flex: 1 },
  detailBizName: { fontSize: 18, fontWeight: '700', color: colors.text },
  detailBizContact: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  detailInvoiceNum: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: 8 },
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

  notesBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  noteLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  noteText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  detailCreatedDate: { fontSize: 11, color: colors.textMuted, marginBottom: 12 },

  shareRow: { flexDirection: 'row', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  shareBtnText: { fontSize: 13, fontWeight: '600' },

  detailActions: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
})
