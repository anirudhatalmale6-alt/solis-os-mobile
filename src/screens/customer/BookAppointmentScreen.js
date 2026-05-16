import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
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
      <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.03)', 'transparent']} style={s.headerGlow} />
      <View style={s.glowOrb1} />
      <View style={s.glowOrb2} />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.04)']} style={s.backBtn}>
              <Text style={s.backText}>←</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.topTitle}>Select Time</Text>
          <View style={{ width: 40 }} />
        </View>

        <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.03)']} style={s.serviceInfo}>
          <Text style={s.serviceName}>{service.name}</Text>
          <Text style={s.serviceMeta}>{service.duration || 30} min · ${service.price || 0}</Text>
        </LinearGradient>

        <View style={s.calCard}>
          <View style={s.calHeader}>
            <Text style={s.calMonth}>{monthLabel}</Text>
            <View style={s.calArrows}>
              <TouchableOpacity onPress={() => setWeekOffset(Math.max(0, weekOffset - 1))} style={s.arrowBtn}>
                <Text style={s.calArrow}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWeekOffset(weekOffset + 1)} style={s.arrowBtn}>
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
                  {isSelected ? (
                    <LinearGradient colors={['#f59e0b', '#f97316']} style={s.dayNumSelected}>
                      <Text style={[s.dayNumText, s.dayNumTextSelected]}>
                        {d.getDate()}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={s.dayNum}>
                      <Text style={[s.dayNumText, isPast && s.dayPast]}>
                        {d.getDate()}
                      </Text>
                    </View>
                  )}
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
            if (isSelected) {
              return (
                <TouchableOpacity
                  key={time}
                  onPress={() => !isBooked && setSelectedTime(time)}
                  disabled={isBooked}
                  style={{ width: '31%' }}
                >
                  <LinearGradient colors={['rgba(245,158,11,0.2)', 'rgba(249,115,22,0.1)']} style={s.slotSelectedGradient}>
                    <Text style={[s.slotText, s.slotTextSelected]}>
                      {time}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )
            }
            return (
              <TouchableOpacity
                key={time}
                style={[s.slot, isBooked && s.slotBooked]}
                onPress={() => !isBooked && setSelectedTime(time)}
                disabled={isBooked}
              >
                <Text style={[s.slotText, isBooked && s.slotTextBooked]}>
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

      {selectedTime ? (
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.confirmBtn}>
            <Text style={s.confirmBtnText}>{loading ? 'Booking...' : 'Confirm Booking'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={[s.confirmBtn, s.confirmBtnDisabled]}>
          <Text style={s.confirmBtnText}>Confirm Booking</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  glowOrb1: {
    position: 'absolute',
    top: 20,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 150,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59,130,246,0.06)',
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
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    color: colors.text,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  serviceInfo: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: 16,
    ...shadows.cardGlow,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
    ...shadows.card,
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
    gap: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calArrow: {
    fontSize: 18,
    color: colors.textSecondary,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  slotBooked: {
    opacity: 0.3,
  },
  slotSelectedGradient: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.cardGlow,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    ...shadows.cardGlow,
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  confirmBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.button,
  },
  confirmBtnDisabled: {
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
})
