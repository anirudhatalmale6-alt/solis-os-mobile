import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { colors, shadows } from '../../theme/colors'

export default function WaitlistScreen() {
  const [queue, setQueue] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState('1')

  const handleAdd = () => {
    if (!name.trim()) return
    const entry = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      partySize: parseInt(partySize) || 1,
      joinedAt: new Date(),
      status: 'waiting',
    }
    setQueue(prev => [...prev, entry])
    setName('')
    setPhone('')
    setPartySize('1')
    setShowAdd(false)
  }

  const handleServe = (id) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'served' } : q))
  }

  const handleRemove = (id) => {
    Alert.alert('Remove', 'Remove this person from the waitlist?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setQueue(prev => prev.filter(q => q.id !== id)) },
    ])
  }

  const waiting = queue.filter(q => q.status === 'waiting')
  const served = queue.filter(q => q.status === 'served')

  const getWaitTime = (joinedAt) => {
    const mins = Math.floor((Date.now() - new Date(joinedAt).getTime()) / 60000)
    if (mins < 1) return 'Just joined'
    return `${mins} min wait`
  }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(96,165,250,0.1)', 'rgba(96,165,250,0.03)', 'transparent']}
        style={s.headerGlow}
      />

      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Digital Waitlist</Text>
          <Text style={s.headerSub}>{waiting.length} waiting</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowAdd(!showAdd)}>
          <LinearGradient colors={['#3b82f6', '#60a5fa']} style={s.addBtn}>
            <Text style={s.addBtnText}>+ Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={s.addForm}>
          <TextInput
            style={s.input}
            placeholder="Customer name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <View style={s.formRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Phone (optional)"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[s.input, { width: 70 }]}
              placeholder="Size"
              placeholderTextColor={colors.textMuted}
              value={partySize}
              onChangeText={setPartySize}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={handleAdd}>
            <LinearGradient colors={['#3b82f6', '#60a5fa']} style={s.joinBtn}>
              <Text style={s.joinBtnText}>Add to Waitlist</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll}>
        {waiting.length === 0 && served.length === 0 ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={s.empty}
          >
            <MaterialCommunityIcons name="timer-sand-empty" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No one waiting</Text>
            <Text style={s.emptyDesc}>Tap + Add when walk-in customers arrive</Text>
          </LinearGradient>
        ) : (
          <>
            {waiting.map((entry, idx) => (
              <View key={entry.id} style={s.entryCard}>
                <View style={s.position}>
                  <Text style={s.posNum}>{idx + 1}</Text>
                </View>
                <View style={s.entryInfo}>
                  <Text style={s.entryName}>{entry.name}</Text>
                  <Text style={s.entryMeta}>Party of {entry.partySize} · {getWaitTime(entry.joinedAt)}</Text>
                </View>
                <TouchableOpacity style={s.serveBtn} onPress={() => handleServe(entry.id)}>
                  <Text style={s.serveBtnText}>Serve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.removeBtn} onPress={() => handleRemove(entry.id)}>
                  <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            {served.length > 0 && (
              <>
                <Text style={s.servedTitle}>Served Today ({served.length})</Text>
                {served.map(entry => (
                  <View key={entry.id} style={[s.entryCard, s.entryServed]}>
                    <View style={[s.position, s.posServed]}>
                      <MaterialCommunityIcons name="check" size={16} color={colors.green} />
                    </View>
                    <View style={s.entryInfo}>
                      <Text style={[s.entryName, { opacity: 0.5 }]}>{entry.name}</Text>
                      <Text style={s.entryMeta}>Party of {entry.partySize}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: '#60a5fa', marginTop: 4, fontWeight: '500' },
  addBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, ...shadows.button },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  addForm: { marginHorizontal: 20, marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10,
  },
  joinBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...shadows.button },
  joinBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: {
    alignItems: 'center', paddingVertical: 60, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
  entryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', gap: 12, ...shadows.card,
  },
  entryServed: { opacity: 0.5 },
  position: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  posServed: { backgroundColor: 'rgba(34,197,94,0.12)' },
  posNum: { fontSize: 15, fontWeight: '700', color: '#60a5fa' },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  entryMeta: { fontSize: 12, color: colors.textMuted },
  serveBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  serveBtnText: { fontSize: 13, fontWeight: '600', color: colors.green },
  removeBtn: { padding: 8 },
  servedTitle: { fontSize: 14, fontWeight: '600', color: colors.textMuted, marginTop: 20, marginBottom: 10 },
})
