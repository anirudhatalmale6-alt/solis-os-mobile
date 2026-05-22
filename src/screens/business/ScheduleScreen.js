import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import ScreenBackground from '../../components/ScreenBackground'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_SCHEDULE = {
  monday: { open: '09:00', close: '17:00', enabled: true },
  tuesday: { open: '09:00', close: '17:00', enabled: true },
  wednesday: { open: '09:00', close: '17:00', enabled: true },
  thursday: { open: '09:00', close: '17:00', enabled: true },
  friday: { open: '09:00', close: '17:00', enabled: true },
  saturday: { open: '09:00', close: '17:00', enabled: false },
  sunday: { open: '09:00', close: '17:00', enabled: false },
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

export default function ScheduleScreen() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [pickerDay, setPickerDay] = useState(null)
  const [pickerField, setPickerField] = useState(null) // 'open' or 'close'
  const [pickerHour, setPickerHour] = useState('09')
  const [pickerMinute, setPickerMinute] = useState('00')

  const fetchSchedule = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
      const bizId = bizArr?.[0]?.id
      if (!bizId) { setLoading(false); return }

      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('business_id', bizId)
        .single()

      if (data) {
        const loaded = {}
        DAYS.forEach((day) => {
          loaded[day] = data[day] || DEFAULT_SCHEDULE[day]
        })
        setSchedule(loaded)
      }
    } catch (e) {
      // Use defaults if no schedule exists
    }
    setLoading(false)
  }

  useFocusEffect(useCallback(() => { fetchSchedule() }, [user]))

  const toggleDay = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }))
  }

  const openTimePicker = (day, field) => {
    const current = schedule[day][field] || '09:00'
    const [h, m] = current.split(':')
    setPickerDay(day)
    setPickerField(field)
    setPickerHour(h)
    setPickerMinute(MINUTES.includes(m) ? m : '00')
    setPickerVisible(true)
  }

  const confirmPicker = () => {
    const time = `${pickerHour}:${pickerMinute}`
    setSchedule((prev) => ({
      ...prev,
      [pickerDay]: { ...prev[pickerDay], [pickerField]: time },
    }))
    setPickerVisible(false)
  }

  const saveSchedule = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const { data: bizArr } = await supabase.from('businesses').select('id').eq('owner_id', user.id)
      const bizId = bizArr?.[0]?.id
      if (!bizId) {
        Alert.alert('Error', 'Business not found')
        setSaving(false)
        return
      }

      const payload = { business_id: bizId }
      DAYS.forEach((day) => { payload[day] = schedule[day] })

      const { data: existing } = await supabase
        .from('schedules')
        .select('id')
        .eq('business_id', bizId)
        .single()

      let error
      if (existing) {
        ({ error } = await supabase.from('schedules').update(payload).eq('business_id', bizId))
      } else {
        ({ error } = await supabase.from('schedules').insert(payload))
      }

      if (error) {
        Alert.alert('Error', error.message)
      } else {
        Alert.alert('Success', 'Schedule saved successfully')
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <ScreenBackground theme="golden">
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )
  }

  return (
    <ScreenBackground theme="golden">
      <View style={s.header}>
        <Text style={s.headerTitle}>Schedule</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {DAYS.map((day, idx) => {
          const dayData = schedule[day]
          const isEnabled = dayData.enabled
          return (
            <View key={day} style={[s.dayCard, isEnabled && s.dayCardEnabled]}>
              <View style={s.dayRow}>
                <Text style={[s.dayName, !isEnabled && s.dayNameDisabled]}>
                  {DAY_LABELS[idx]}
                </Text>
                <Switch
                  value={isEnabled}
                  onValueChange={() => toggleDay(day)}
                  trackColor={{ false: colors.bgInput, true: colors.greenLight }}
                  thumbColor={isEnabled ? colors.green : colors.textMuted}
                  ios_backgroundColor={colors.bgInput}
                />
              </View>

              {isEnabled ? (
                <View style={s.timesRow}>
                  <TouchableOpacity
                    style={s.timeButton}
                    onPress={() => openTimePicker(day, 'open')}
                    activeOpacity={0.7}
                  >
                    <Text style={s.timeLabel}>Open</Text>
                    <Text style={s.timeValue}>{dayData.open}</Text>
                  </TouchableOpacity>

                  <Text style={s.timeSeparator}>—</Text>

                  <TouchableOpacity
                    style={s.timeButton}
                    onPress={() => openTimePicker(day, 'close')}
                    activeOpacity={0.7}
                  >
                    <Text style={s.timeLabel}>Close</Text>
                    <Text style={s.timeValue}>{dayData.close}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={s.closedText}>Closed</Text>
              )}
            </View>
          )
        })}

        <TouchableOpacity
          style={s.saveButton}
          onPress={saveSchedule}
          activeOpacity={0.8}
          disabled={saving}
        >
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.saveButtonGradient}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveButtonText}>Save Schedule</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>
              Select {pickerField === 'open' ? 'Opening' : 'Closing'} Time
            </Text>

            <View style={s.pickerRow}>
              {/* Hour Selector */}
              <View style={s.pickerColumn}>
                <Text style={s.pickerLabel}>Hour</Text>
                <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[s.pickerItem, pickerHour === h && s.pickerItemActive]}
                      onPress={() => setPickerHour(h)}
                    >
                      <Text style={[s.pickerItemText, pickerHour === h && s.pickerItemTextActive]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={s.pickerColon}>:</Text>

              {/* Minute Selector */}
              <View style={s.pickerColumn}>
                <Text style={s.pickerLabel}>Min</Text>
                <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false}>
                  {MINUTES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[s.pickerItem, pickerMinute === m && s.pickerItemActive]}
                      onPress={() => setPickerMinute(m)}
                    >
                      <Text style={[s.pickerItemText, pickerMinute === m && s.pickerItemTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={s.modalCancel}
                onPress={() => setPickerVisible(false)}
              >
                <View style={s.modalCancelInner}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalConfirm}
                onPress={confirmPicker}
              >
                <LinearGradient colors={['#f59e0b', '#f97316']} style={s.modalConfirmGradient}>
                  <Text style={s.modalConfirmText}>Confirm</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  dayCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    ...shadows.card,
  },
  dayCardEnabled: {
    borderColor: colors.borderGlow,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dayNameDisabled: {
    color: colors.textMuted,
  },

  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  timeButton: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.green,
  },
  timeSeparator: {
    fontSize: 16,
    color: colors.textMuted,
  },

  closedText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: colors.red,
  },

  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
    ...shadows.button,
  },
  saveButtonGradient: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.deep,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pickerColumn: {
    alignItems: 'center',
    width: 80,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerScroll: {
    height: 160,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  pickerItemActive: {
    backgroundColor: colors.primaryLight,
  },
  pickerItemText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  pickerItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  pickerColon: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 8,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalCancelInner: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalConfirm: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
})
