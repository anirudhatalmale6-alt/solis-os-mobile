import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
]

function getWeekDates(offset = 0) {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() + offset * 7)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

function formatDate(d) {
  return d.toISOString().split('T')[0]
}

export default function BookAppointmentScreen({ navigation, route }) {
  const { business, service } = route.params
  const { user } = useAuth()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [selectedTime, setSelectedTime] = useState(null)
  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(false)

  const weekDates = getWeekDates(weekOffset)
  const monthLabel = weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  useEffect(() => {
    supabase.from('bookings')
      .select('time')
      .eq('business_id', business.id)
      .eq('date', selectedDate)
      .neq('status', 'cancelled')
      .then(({ data }) => {
        setBookedSlots((data || []).map(b => b.time))
      })
  }, [selectedDate])

  const handleConfirm = async () => {
    if (!selectedTime) {
      Alert.alert('Select a time', 'Please choose a time slot')
      return
    }
    if (!user) {
      Alert.alert('Sign in required', 'You need to sign in to book an appointment', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login', { role: 'customer' }) },
      ])
      return
    }
    setLoading(true)
    const booking = {
      business_id: business.id,
      customer_name: user?.full_name || 'Customer',
      customer_email: user?.email || '',
      customer_phone: '',
      service_name: service.name,
      date: selectedDate,
      time: selectedTime,
      duration: service.duration || 30,
      price: service.price || 0,
      status: 'confirmed',
      notes: '',
    }
    const { error } = await supabase.from('bookings').insert(booking)
    setLoading(false)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Booked!', `Your appointment at ${business.name} is confirmed for ${selectedDate} at ${selectedTime}`, [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ])
    }
  }

  const today = formatDate(new Date())

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.topTitle}>Select Time</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={s.serviceInfo}>
          <Text style={s.serviceName}>{service.name}</Text>
          <Text style={s.serviceMeta}>{service.duration || 30} min · ${service.price || 0}</Text>
        </View>

        <View style={s.calCard}>
          <View style={s.calHeader}>
            <Text style={s.calMonth}>{monthLabel}</Text>
            <View style={s.calArrows}>
              <TouchableOpacity onPress={() => setWeekOffset(Math.max(0, weekOffset - 1))}>
                <Text style={s.calArrow}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWeekOffset(weekOffset + 1)}>
                <Text style={s.calArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.daysRow}>
            {weekDates.map(d => {
              const dateStr = formatDate(d)
              const isPast = dateStr < today
              const isSelected = dateStr === selectedDate
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[s.dayCell, isSelected && s.dayCellSelected]}
                  onPress={() => !isPast && setSelectedDate(dateStr)}
                  disabled={isPast}
                >
                  <Text style={[s.dayName, isPast && s.dayPast]}>{DAYS[d.getDay()]}</Text>
                  <View style={[s.dayNum, isSelected && s.dayNumSelected]}>
                    <Text style={[s.dayNumText, isSelected && s.dayNumTextSelected, isPast && s.dayPast]}>
                      {d.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <Text style={s.slotsLabel}>Available Slots</Text>
        <View style={s.slotsGrid}>
          {TIME_SLOTS.map(time => {
            const isBooked = bookedSlots.includes(time)
            const isSelected = time === selectedTime
            return (
              <TouchableOpacity
                key={time}
                style={[s.slot, isBooked && s.slotBooked, isSelected && s.slotSelected]}
                onPress={() => !isBooked && setSelectedTime(time)}
                disabled={isBooked}
              >
                <Text style={[s.slotText, isBooked && s.slotTextBooked, isSelected && s.slotTextSelected]}>
                  {time}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {selectedTime && (
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Service</Text>
              <Text style={s.summaryVal}>{service.name}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Date</Text>
              <Text style={s.summaryVal}>{new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Time</Text>
              <Text style={s.summaryVal}>{selectedTime}</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Total</Text>
              <Text style={s.summaryTotal}>${service.price || 0}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[s.confirmBtn, !selectedTime && s.confirmBtnDisabled]}
        onPress={handleConfirm}
        disabled={!selectedTime || loading}
        activeOpacity={0.85}
      >
        <Text style={s.confirmBtnText}>{loading ? 'Booking...' : 'Confirm Booking'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    color: colors.text,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  serviceInfo: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  serviceMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  calCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calMonth: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  calArrows: {
    flexDirection: 'row',
    gap: 16,
  },
  calArrow: {
    fontSize: 20,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    flex: 1,
  },
  dayCellSelected: {},
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  dayPast: {
    opacity: 0.3,
  },
  dayNum: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumSelected: {
    backgroundColor: colors.primary,
  },
  dayNumText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  dayNumTextSelected: {
    color: colors.textDark,
  },
  slotsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  slot: {
    width: '31%',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  slotBooked: {
    opacity: 0.3,
  },
  slotSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slotTextBooked: {
    textDecorationLine: 'line-through',
  },
  slotTextSelected: {
    color: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  confirmBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.button,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
})
