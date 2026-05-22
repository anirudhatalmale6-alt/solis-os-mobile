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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import ScreenBackground from '../../components/ScreenBackground'

const AVATAR_COLORS = [
  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  { bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
  { bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
]

export default function StaffScreen() {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState('')
  const [formEmail, setFormEmail] = useState('')

  const fetchStaff = async () => {
    if (!user?.id) return
    const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
    const bizId = bizArr?.[0]?.id
    if (!bizId) return

    const { data } = await supabase
      .from('staff')
      .select('*')
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })

    setStaff(data || [])
    setLoading(false)
  }

  useFocusEffect(useCallback(() => {
    setLoading(true)
    fetchStaff()
  }, [user]))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchStaff()
    setRefreshing(false)
  }

  const filtered = staff.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.role || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    )
  })

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const openAddModal = () => {
    setEditingStaff(null)
    setFormName('')
    setFormRole('')
    setFormEmail('')
    setModalVisible(true)
  }

  const openEditModal = (member) => {
    setEditingStaff(member)
    setFormName(member.name || '')
    setFormRole(member.role || '')
    setFormEmail(member.email || '')
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setEditingStaff(null)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter a name for the staff member.')
      return
    }
    if (!formRole.trim()) {
      Alert.alert('Required', 'Please enter a role.')
      return
    }

    setSaving(true)
    try {
      const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
      const bizId = bizArr?.[0]?.id
      if (!bizId) {
        Alert.alert('Error', 'Business not found.')
        setSaving(false)
        return
      }

      const payload = {
        name: formName.trim(),
        role: formRole.trim(),
        email: formEmail.trim() || null,
        business_id: bizId,
        is_active: true,
      }

      if (editingStaff) {
        const { error } = await supabase
          .from('staff')
          .update({ name: payload.name, role: payload.role, email: payload.email })
          .eq('id', editingStaff.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('staff').insert(payload)
        if (error) throw error
      }

      closeModal()
      await fetchStaff()
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save staff member.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (member) => {
    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to remove ${member.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('staff').delete().eq('id', member.id)
            if (error) {
              Alert.alert('Error', error.message || 'Failed to delete.')
            } else {
              await fetchStaff()
            }
          },
        },
      ]
    )
  }

  const toggleActive = async (member) => {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: !member.is_active })
      .eq('id', member.id)
    if (!error) await fetchStaff()
  }

  return (
    <ScreenBackground theme="sapphire">
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Staff</Text>
          <Text style={s.headerSub}>{staff.length} team member{staff.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.addBtnGradient}>
            <Text style={s.addBtnText}>+ Add Staff</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name, role, email..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Staff List */}
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>{search ? 'No results found' : 'No staff members yet'}</Text>
            <Text style={s.emptyDesc}>
              {search ? 'Try a different search' : 'Add your team members to get started'}
            </Text>
          </View>
        ) : (
          filtered.map((member, index) => {
            const ac = AVATAR_COLORS[index % AVATAR_COLORS.length]
            return (
              <TouchableOpacity
                key={member.id}
                style={s.staffRow}
                activeOpacity={0.8}
                onPress={() => openEditModal(member)}
                onLongPress={() => handleDelete(member)}
              >
                <View style={[s.avatar, { backgroundColor: ac.bg }]}>
                  <Text style={[s.avatarText, { color: ac.color }]}>{getInitials(member.name)}</Text>
                </View>
                <View style={s.staffInfo}>
                  <Text style={s.staffName}>{member.name || 'Unknown'}</Text>
                  <Text style={s.staffRole}>{member.role || 'No role'}</Text>
                  {member.email && <Text style={s.staffDetail}>{member.email}</Text>}
                </View>
                <View style={s.rightCol}>
                  <TouchableOpacity
                    style={[s.badge, member.is_active ? s.badgeActive : s.badgeInactive]}
                    onPress={() => toggleActive(member)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.badgeText, member.is_active ? s.badgeTextActive : s.badgeTextInactive]}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </Text>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={s.formGroup}>
              <Text style={s.formLabel}>Full Name *</Text>
              <TextInput
                style={s.formInput}
                placeholder="e.g. Sarah Johnson"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
                autoCapitalize="words"
              />
            </View>

            <View style={s.formGroup}>
              <Text style={s.formLabel}>Role *</Text>
              <TextInput
                style={s.formInput}
                placeholder="e.g. Senior Stylist"
                placeholderTextColor={colors.textMuted}
                value={formRole}
                onChangeText={setFormRole}
                autoCapitalize="words"
              />
            </View>

            <View style={s.formGroup}>
              <Text style={s.formLabel}>Email (optional)</Text>
              <TextInput
                style={s.formInput}
                placeholder="e.g. sarah@example.com"
                placeholderTextColor={colors.textMuted}
                value={formEmail}
                onChangeText={setFormEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={s.modalActions}>
              {editingStaff && (
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => { closeModal(); handleDelete(editingStaff) }}
                  activeOpacity={0.7}
                >
                  <Text style={s.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#f59e0b', '#f97316']} style={s.saveBtnGradient}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.saveBtnText}>{editingStaff ? 'Update' : 'Add Member'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenBackground>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  addBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.card,
  },
  addBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
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
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  staffRow: {
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
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  staffRole: { fontSize: 13, color: colors.textSecondary, marginBottom: 1 },
  staffDetail: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  rightCol: { alignItems: 'flex-end' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: { backgroundColor: 'rgba(34,197,94,0.12)' },
  badgeInactive: { backgroundColor: colors.bgInput },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#22c55e' },
  badgeTextInactive: { color: colors.textMuted },
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
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalClose: { fontSize: 20, color: colors.textMuted, padding: 4 },
  formGroup: { marginBottom: 18 },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  formInput: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
