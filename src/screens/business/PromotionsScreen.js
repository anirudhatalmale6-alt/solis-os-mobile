import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import ScreenBackground from '../../components/ScreenBackground'

export default function PromotionsScreen() {
  const { user } = useAuth()
  const [promotions, setPromotions] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [businessId, setBusinessId] = useState(null)

  // Form state
  const [formCode, setFormCode] = useState('')
  const [formDiscountType, setFormDiscountType] = useState('percentage')
  const [formDiscountValue, setFormDiscountValue] = useState('')
  const [formMaxUses, setFormMaxUses] = useState('')
  const [formExpiresAt, setFormExpiresAt] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const fetchPromotions = async () => {
    if (!user?.id) return
    try {
      const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
      const bizId = bizArr?.[0]?.id
      if (!bizId) {
        setLoading(false)
        return
      }
      setBusinessId(bizId)

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('business_id', bizId)
        .order('created_at', { ascending: false })

      if (!error) setPromotions(data || [])
    } catch (err) {
      console.log('Promotions table not ready')
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { fetchPromotions() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPromotions()
    setRefreshing(false)
  }

  // Compute stats
  const activePromos = promotions.filter((p) => p.active && !isExpired(p)).length
  const totalRedemptions = promotions.reduce((sum, p) => sum + (p.used_count || 0), 0)
  const revenueImpact = promotions.reduce((sum, p) => {
    if (p.discount_type === 'fixed') return sum + (p.discount_value || 0) * (p.used_count || 0)
    return sum
  }, 0)

  function isExpired(promo) {
    if (!promo.expires_at) return false
    return new Date(promo.expires_at) < new Date()
  }

  function isUsedUp(promo) {
    if (!promo.max_uses) return false
    return promo.used_count >= promo.max_uses
  }

  function getStatus(promo) {
    if (isExpired(promo)) return 'expired'
    if (isUsedUp(promo)) return 'used_up'
    if (!promo.active) return 'inactive'
    return 'active'
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'active': return 'Active'
      case 'expired': return 'Expired'
      case 'used_up': return 'Used Up'
      case 'inactive': return 'Inactive'
      default: return 'Unknown'
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active': return colors.green
      case 'expired': return colors.red
      case 'used_up': return colors.purple
      case 'inactive': return colors.textMuted
      default: return colors.textMuted
    }
  }

  function getStatusBgColor(status) {
    switch (status) {
      case 'active': return colors.greenLight
      case 'expired': return colors.redLight
      case 'used_up': return colors.purpleLight
      case 'inactive': return 'rgba(85, 85, 102, 0.12)'
      default: return 'rgba(85, 85, 102, 0.12)'
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'No expiry'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatDiscount(promo) {
    if (promo.discount_type === 'percentage') return `${promo.discount_value}%`
    return `$${parseFloat(promo.discount_value).toFixed(2)}`
  }

  const copyToClipboard = (code) => {
    Clipboard.setString(code)
    Alert.alert('Copied', `Code "${code}" copied to clipboard.`)
  }

  const openAddModal = () => {
    setFormCode('')
    setFormDiscountType('percentage')
    setFormDiscountValue('')
    setFormMaxUses('')
    setFormExpiresAt('')
    setFormDescription('')
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
  }

  const handleSave = async () => {
    if (!formCode.trim()) {
      Alert.alert('Validation', 'Promo code is required.')
      return
    }
    if (!formDiscountValue || isNaN(parseFloat(formDiscountValue)) || parseFloat(formDiscountValue) <= 0) {
      Alert.alert('Validation', 'Discount value must be a valid positive number.')
      return
    }
    if (formDiscountType === 'percentage' && parseFloat(formDiscountValue) > 100) {
      Alert.alert('Validation', 'Percentage discount cannot exceed 100%.')
      return
    }
    if (formMaxUses && (isNaN(parseInt(formMaxUses, 10)) || parseInt(formMaxUses, 10) < 1)) {
      Alert.alert('Validation', 'Max uses must be a positive number.')
      return
    }
    if (formExpiresAt) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(formExpiresAt)) {
        Alert.alert('Validation', 'Expiry date must be in YYYY-MM-DD format.')
        return
      }
      if (new Date(formExpiresAt) < new Date()) {
        Alert.alert('Validation', 'Expiry date must be in the future.')
        return
      }
    }
    if (!businessId) {
      Alert.alert('Error', 'No business found. Please set up your business first.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        business_id: businessId,
        code: formCode.trim().toUpperCase(),
        discount_type: formDiscountType,
        discount_value: parseFloat(formDiscountValue),
        max_uses: formMaxUses ? parseInt(formMaxUses, 10) : null,
        used_count: 0,
        expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        active: true,
        description: formDescription.trim() || null,
      }

      const { error } = await supabase.from('promotions').insert(payload)
      if (error) throw error

      closeModal()
      await fetchPromotions()
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create promotion.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (promo) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ active: !promo.active })
        .eq('id', promo.id)
      if (error) throw error
      await fetchPromotions()
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update promotion status.')
    }
  }

  const handleDelete = (promo) => {
    Alert.alert(
      'Delete Promotion',
      `Are you sure you want to delete code "${promo.code}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('promotions').delete().eq('id', promo.id)
              if (error) throw error
              await fetchPromotions()
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete promotion.')
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <ScreenBackground theme="royal">
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )
  }

  return (
    <ScreenBackground theme="royal">
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Promotions</Text>
          <Text style={s.headerSub}>
            {promotions.length} {promotions.length === 1 ? 'discount code' : 'discount codes'}
          </Text>
        </View>
        <TouchableOpacity style={s.addButton} onPress={openAddModal} activeOpacity={0.8}>
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.addButtonGradient}>
            <Text style={s.addButtonText}>+ New Code</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Stats Cards */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <LinearGradient
              colors={['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)']}
              style={s.statGradient}
            >
              <Text style={s.statValue}>{activePromos}</Text>
              <Text style={s.statLabel}>Active</Text>
            </LinearGradient>
          </View>
          <View style={s.statCard}>
            <LinearGradient
              colors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)']}
              style={s.statGradient}
            >
              <Text style={s.statValue}>{totalRedemptions}</Text>
              <Text style={s.statLabel}>Redemptions</Text>
            </LinearGradient>
          </View>
          <View style={s.statCard}>
            <LinearGradient
              colors={['rgba(168,85,247,0.15)', 'rgba(168,85,247,0.05)']}
              style={s.statGradient}
            >
              <Text style={s.statValue}>${revenueImpact.toFixed(0)}</Text>
              <Text style={s.statLabel}>Impact</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Promotions List */}
        {promotions.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons name="tag-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No promotions yet</Text>
            <Text style={s.emptyDesc}>Create your first discount code to attract customers</Text>
          </View>
        ) : (
          promotions.map((promo) => {
            const status = getStatus(promo)
            const statusColor = getStatusColor(status)
            const statusBg = getStatusBgColor(status)

            return (
              <View key={promo.id} style={s.promoCard}>
                {/* Card header */}
                <View style={s.cardTop}>
                  <View style={s.codeRow}>
                    <TouchableOpacity
                      style={s.codeBadge}
                      onPress={() => copyToClipboard(promo.code)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.codeText}>{promo.code}</Text>
                      <MaterialCommunityIcons name="content-copy" size={12} color={colors.primary} />
                    </TouchableOpacity>
                    <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
                      <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[s.statusText, { color: statusColor }]}>
                        {getStatusLabel(status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.discountValue}>{formatDiscount(promo)}</Text>
                </View>

                {/* Description */}
                {promo.description ? (
                  <Text style={s.promoDescription} numberOfLines={2}>{promo.description}</Text>
                ) : null}

                {/* Card details */}
                <View style={s.cardDetails}>
                  <View style={s.detailItem}>
                    <MaterialCommunityIcons name="chart-bar" size={12} color={colors.textSecondary} />
                    <Text style={s.detailText}>
                      {promo.used_count || 0}{promo.max_uses ? ` / ${promo.max_uses}` : ''} uses
                    </Text>
                  </View>
                  <View style={s.detailItem}>
                    <MaterialCommunityIcons name="calendar-outline" size={12} color={colors.textSecondary} />
                    <Text style={s.detailText}>{formatDate(promo.expires_at)}</Text>
                  </View>
                </View>

                {/* Card actions */}
                <View style={s.cardActions}>
                  <TouchableOpacity
                    style={[s.actionBtn, promo.active ? s.actionBtnDeactivate : s.actionBtnActivate]}
                    onPress={() => toggleActive(promo)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.actionBtnText, { color: promo.active ? colors.red : colors.green }]}>
                      {promo.active ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => handleDelete(promo)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* Create Promotion Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Create Promotion</Text>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={s.modalScroll}>
              <View style={s.formGroup}>
                <Text style={s.label}>Promo Code</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. SUMMER20"
                  placeholderTextColor={colors.textMuted}
                  value={formCode}
                  onChangeText={setFormCode}
                  autoCapitalize="characters"
                />
              </View>

              <View style={s.formGroup}>
                <Text style={s.label}>Discount Type</Text>
                <View style={s.typeToggle}>
                  <TouchableOpacity
                    style={[s.typeOption, formDiscountType === 'percentage' && s.typeOptionActive]}
                    onPress={() => setFormDiscountType('percentage')}
                    activeOpacity={0.7}
                  >
                    {formDiscountType === 'percentage' ? (
                      <LinearGradient colors={['#f59e0b', '#f97316']} style={s.typeOptionGradient}>
                        <Text style={[s.typeOptionText, s.typeOptionTextActive]}>Percentage (%)</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={s.typeOptionText}>Percentage (%)</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.typeOption, formDiscountType === 'fixed' && s.typeOptionActive]}
                    onPress={() => setFormDiscountType('fixed')}
                    activeOpacity={0.7}
                  >
                    {formDiscountType === 'fixed' ? (
                      <LinearGradient colors={['#f59e0b', '#f97316']} style={s.typeOptionGradient}>
                        <Text style={[s.typeOptionText, s.typeOptionTextActive]}>Fixed ($)</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={s.typeOptionText}>Fixed ($)</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.formGroup}>
                <Text style={s.label}>
                  Discount Value {formDiscountType === 'percentage' ? '(%)' : '($)'}
                </Text>
                <TextInput
                  style={s.input}
                  placeholder={formDiscountType === 'percentage' ? 'e.g. 20' : 'e.g. 10.00'}
                  placeholderTextColor={colors.textMuted}
                  value={formDiscountValue}
                  onChangeText={setFormDiscountValue}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={s.formGroup}>
                <Text style={s.label}>Max Uses (optional)</Text>
                <TextInput
                  style={s.input}
                  placeholder="Leave empty for unlimited"
                  placeholderTextColor={colors.textMuted}
                  value={formMaxUses}
                  onChangeText={setFormMaxUses}
                  keyboardType="number-pad"
                />
              </View>

              <View style={s.formGroup}>
                <Text style={s.label}>Expiry Date (optional)</Text>
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={formExpiresAt}
                  onChangeText={setFormExpiresAt}
                  keyboardType="default"
                />
              </View>

              <View style={s.formGroup}>
                <Text style={s.label}>Description (optional)</Text>
                <TextInput
                  style={[s.input, s.inputMultiline]}
                  placeholder="e.g. Summer sale discount for new customers"
                  placeholderTextColor={colors.textMuted}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[s.saveButton, saving && s.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#f59e0b', '#f97316']} style={s.saveButtonGradient}>
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.bg} />
                  ) : (
                    <Text style={s.saveButtonText}>Create Promotion</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenBackground>
  )
}

const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.button,
  },
  addButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: { fontSize: 14, fontWeight: '700', color: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...shadows.card,
  },
  statGradient: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Promo cards
  promoCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'column',
    gap: 8,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    gap: 6,
  },
  codeText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  discountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  promoDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnActivate: {
    backgroundColor: colors.greenLight,
  },
  actionBtnDeactivate: {
    backgroundColor: colors.redLight,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: colors.red },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 20,
    ...shadows.card,
  },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgCardSolid,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    borderBottomWidth: 0,
    maxHeight: '85%',
    ...shadows.deep,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalClose: { fontSize: 22, color: colors.textMuted, padding: 4 },
  modalScroll: { flexGrow: 0 },
  formGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 14,
  },

  // Discount type toggle
  typeToggle: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  typeOptionActive: {
    borderColor: colors.borderGlow,
    backgroundColor: 'transparent',
    padding: 0,
  },
  typeOptionGradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 11,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.bg,
  },

  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
    ...shadows.button,
  },
  saveButtonGradient: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: colors.bg },
})
