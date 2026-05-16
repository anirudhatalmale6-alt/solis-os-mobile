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
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function ServicesScreen() {
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [businessId, setBusinessId] = useState(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formDuration, setFormDuration] = useState('')

  const fetchServices = async () => {
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
        .from('services')
        .select('*')
        .eq('business_id', bizId)
        .order('name', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (err) {
      console.error('Error fetching services:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { fetchServices() }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchServices()
    setRefreshing(false)
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '--'
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
    }
    return `${minutes} min`
  }

  const formatPrice = (price) => {
    if (price == null || price === '') return 'Free'
    return `$${parseFloat(price).toFixed(2)}`
  }

  const openAddModal = () => {
    setEditingService(null)
    setFormName('')
    setFormPrice('')
    setFormDuration('')
    setModalVisible(true)
  }

  const openEditModal = (service) => {
    setEditingService(service)
    setFormName(service.name || '')
    setFormPrice(service.price != null ? String(service.price) : '')
    setFormDuration(service.duration != null ? String(service.duration) : '')
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setEditingService(null)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation', 'Service name is required.')
      return
    }
    if (formPrice && isNaN(parseFloat(formPrice))) {
      Alert.alert('Validation', 'Price must be a valid number.')
      return
    }
    if (formDuration && isNaN(parseInt(formDuration, 10))) {
      Alert.alert('Validation', 'Duration must be a valid number in minutes.')
      return
    }
    if (!businessId) {
      Alert.alert('Error', 'No business found. Please set up your business first.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        price: formPrice ? parseFloat(formPrice) : null,
        duration: formDuration ? parseInt(formDuration, 10) : null,
        business_id: businessId,
      }

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingService.id)
        if (error) throw error
      } else {
        payload.is_active = true
        const { error } = await supabase.from('services').insert(payload)
        if (error) throw error
      }

      closeModal()
      await fetchServices()
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save service.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('services').delete().eq('id', service.id)
              if (error) throw error
              await fetchServices()
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete service.')
            }
          },
        },
      ]
    )
  }

  const toggleActive = async (service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id)
      if (error) throw error
      await fetchServices()
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update status.')
    }
  }

  if (loading) {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={s.container}>
      <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.03)', 'transparent']} style={s.headerGlow} />
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Services</Text>
          <Text style={s.headerSub}>
            {services.length} {services.length === 1 ? 'service' : 'services'}
          </Text>
        </View>
        <TouchableOpacity style={s.addButton} onPress={openAddModal} activeOpacity={0.8}>
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.addButtonGradient}>
            <Text style={s.addButtonText}>+ Add Service</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {services.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>✂️</Text>
            <Text style={s.emptyTitle}>No services yet</Text>
            <Text style={s.emptyDesc}>Tap "Add Service" to create your first offering</Text>
          </View>
        ) : (
          services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={s.serviceCard}
              onPress={() => openEditModal(service)}
              onLongPress={() => handleDelete(service)}
              activeOpacity={0.8}
            >
              <View style={s.cardTop}>
                <Text style={s.serviceName} numberOfLines={1}>{service.name}</Text>
                <Text style={s.servicePrice}>{formatPrice(service.price)}</Text>
              </View>
              <View style={s.cardBottom}>
                <View style={s.badgeRow}>
                  <View style={s.durationBadge}>
                    <Text style={s.durationIcon}>🕐</Text>
                    <Text style={s.durationText}>{formatDuration(service.duration)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      s.statusBadge,
                      service.is_active ? s.statusActive : s.statusInactive,
                    ]}
                    onPress={() => toggleActive(service)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        s.statusDot,
                        { backgroundColor: service.is_active ? colors.green : colors.red },
                      ]}
                    />
                    <Text
                      style={[
                        s.statusText,
                        { color: service.is_active ? colors.green : colors.red },
                      ]}
                    >
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(service)}
                  activeOpacity={0.7}
                >
                  <Text style={s.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
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
              <Text style={s.modalTitle}>
                {editingService ? 'Edit Service' : 'Add Service'}
              </Text>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>Service Name</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Haircut, Consultation..."
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
                autoCapitalize="words"
              />
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>Price ($)</Text>
              <TextInput
                style={s.input}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={formPrice}
                onChangeText={setFormPrice}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>Duration (minutes)</Text>
              <TextInput
                style={s.input}
                placeholder="30"
                placeholderTextColor={colors.textMuted}
                value={formDuration}
                onChangeText={setFormDuration}
                keyboardType="number-pad"
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
                  <Text style={s.saveButtonText}>
                    {editingService ? 'Update Service' : 'Create Service'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  serviceCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 12 },
  servicePrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  durationIcon: { fontSize: 12 },
  durationText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  statusActive: { backgroundColor: colors.greenLight },
  statusInactive: { backgroundColor: colors.redLight },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.redLight,
  },
  deleteBtnText: { fontSize: 11, fontWeight: '600', color: colors.red },
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
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
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
    ...shadows.deep,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalClose: { fontSize: 22, color: colors.textMuted, padding: 4 },
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
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
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
