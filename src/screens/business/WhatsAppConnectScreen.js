import React, { useState, useCallback, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Image, PermissionsAndroid, Platform } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const BOT_URL = 'http://146.190.26.115:3003'

export default function WhatsAppConnectScreen({ navigation }) {
  const { user } = useAuth()
  const [bizId, setBizId] = useState(null)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [savedNumber, setSavedNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [botConnected, setBotConnected] = useState(false)

  const [qrImage, setQrImage] = useState(null)
  const [waitingQR, setWaitingQR] = useState(false)
  const pollRef = useRef(null)
  const mountedRef = useRef(true)

  const [pairingCode, setPairingCode] = useState(null)
  const [waitingCode, setWaitingCode] = useState(false)

  const [linkMethod, setLinkMethod] = useState(null)

  const safeFetch = async (url, opts) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const resp = await fetch(url, { ...opts, signal: controller.signal })
      clearTimeout(timeout)
      if (!resp.ok) return null
      return await resp.json()
    } catch (e) {
      clearTimeout(timeout)
      return null
    }
  }

  const fetchBusiness = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: bizArr } = await supabase.from('businesses').select('id, whatsapp_number').eq('owner_id', user.id)
      const biz = bizArr?.[0]
      if (biz && mountedRef.current) {
        setBizId(biz.id)
        if (biz.whatsapp_number) {
          setWhatsappNumber(biz.whatsapp_number)
          setSavedNumber(biz.whatsapp_number)
          setConnected(true)
          checkBotStatus(biz.id)
        }
      }
    } catch (e) { console.log('fetchBusiness error:', e.message) }
    if (mountedRef.current) setLoading(false)
  }

  const checkBotStatus = async (id) => {
    const data = await safeFetch(`${BOT_URL}/api/whatsapp/status/${id}`)
    if (mountedRef.current) setBotConnected(data?.status === 'connected')
  }

  useFocusEffect(useCallback(() => {
    mountedRef.current = true
    fetchBusiness()
    return () => {
      mountedRef.current = false
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [user]))

  const handleSaveNumber = async () => {
    if (!whatsappNumber.trim()) {
      Alert.alert('Required', 'Please enter your WhatsApp number')
      return
    }
    if (!bizId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ whatsapp_number: whatsappNumber.trim() })
        .eq('id', bizId)
      if (error) throw error
      setSavedNumber(whatsappNumber.trim())
      setConnected(true)
      Alert.alert('Saved', 'Number saved. Now tap "Link WhatsApp" to connect the AI chatbot.')
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save number')
    }
    setSaving(false)
  }

  const startQRLink = async () => {
    setLinkMethod('qr')
    setWaitingQR(true)
    setQrImage(null)
    const result = await safeFetch(`${BOT_URL}/api/whatsapp/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: bizId }),
    })
    if (!mountedRef.current) return
    if (result === null) {
      setWaitingQR(false)
      Alert.alert('Error', 'Could not reach the bot server. Please try again later.')
      return
    }
    startPollingQR()
  }


  const startPollingQR = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      if (!mountedRef.current) { clearInterval(pollRef.current); return }
      attempts++
      if (attempts > 60) {
        clearInterval(pollRef.current)
        if (mountedRef.current) {
          setWaitingQR(false)
          Alert.alert('Timeout', 'QR code expired. Please try again.')
        }
        return
      }
      const data = await safeFetch(`${BOT_URL}/api/whatsapp/qr/${bizId}`)
      if (!mountedRef.current) return
      if (data?.qr) {
        setQrImage(data.qr)
        setWaitingQR(false)
      }
      if (data?.status === 'connected') {
        clearInterval(pollRef.current)
        setQrImage(null)
        setWaitingQR(false)
        setConnected(true)
        setBotConnected(true)
        Alert.alert('Connected!', 'Your WhatsApp AI chatbot is now live!')
      }
    }, 2000)
  }


  const startPollingForConnection = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      if (!mountedRef.current) { clearInterval(pollRef.current); return }
      attempts++
      if (attempts > 90) {
        clearInterval(pollRef.current)
        return
      }
      const data = await safeFetch(`${BOT_URL}/api/whatsapp/status/${bizId}`)
      if (!mountedRef.current) return
      if (data?.status === 'connected') {
        clearInterval(pollRef.current)
        setPairingCode(null)
        setQrImage(null)
        setLinkMethod(null)
        setConnected(true)
        setBotConnected(true)
        Alert.alert('Connected!', 'Your WhatsApp AI chatbot is now live. Customers who message this number will get instant AI replies.')
      }
    }, 3000)
  }

  const handleDisconnect = () => {
    Alert.alert('Disconnect WhatsApp', 'This will stop the AI chatbot.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive', onPress: async () => {
          await safeFetch(`${BOT_URL}/api/whatsapp/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: bizId }),
          })
          try {
            await supabase.from('businesses').update({ whatsapp_number: null }).eq('id', bizId)
          } catch (e) {}
          setWhatsappNumber('')
          setSavedNumber('')
          setConnected(false)
          setBotConnected(false)
          setPairingCode(null)
          setQrImage(null)
          setLinkMethod(null)
        }
      },
    ])
  }

  const cancelLink = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setLinkMethod(null)
    setQrImage(null)
    setPairingCode(null)
    setWaitingQR(false)
    setWaitingCode(false)
  }

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.loadingWrap}><ActivityIndicator size="large" color="#25D366" /></View>
      </View>
    )
  }

  // QR Code display screen
  if (qrImage) {
    return (
      <View style={s.container}>
        <LinearGradient colors={['rgba(37,211,102,0.1)', 'rgba(37,211,102,0.03)', 'transparent']} style={s.headerGlow} />
        <View style={s.header}>
          <TouchableOpacity onPress={cancelLink} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Scan QR Code</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.qrCard}>
            <Image source={{ uri: qrImage }} style={s.qrImage} resizeMode="contain" />
            <Text style={s.qrTitle}>Scan with WhatsApp</Text>
            <Text style={s.qrInstructions}>On your phone:</Text>
            <View style={s.qrSteps}>
              <Text style={s.qrStep}>1. Open WhatsApp</Text>
              <Text style={s.qrStep}>2. Go to Settings {'>'} Linked Devices</Text>
              <Text style={s.qrStep}>3. Tap "Link a Device"</Text>
              <Text style={s.qrStep}>4. Point your camera at this QR code</Text>
            </View>
            <View style={s.securityNoticeSmall}>
              <MaterialCommunityIcons name="laptop" size={16} color="#60a5fa" />
              <Text style={s.securityNoticeSmallText}>
                Open this screen on a laptop or second device so you can scan the QR code with your phone's WhatsApp camera.
              </Text>
            </View>
            <View style={s.waitingRow}>
              <ActivityIndicator size="small" color="#25D366" />
              <Text style={s.waitingText}>Waiting for you to scan...</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }


  // Waiting for QR or code
  if (waitingQR || waitingCode) {
    return (
      <View style={s.container}>
        <LinearGradient colors={['rgba(37,211,102,0.1)', 'rgba(37,211,102,0.03)', 'transparent']} style={s.headerGlow} />
        <View style={s.header}>
          <TouchableOpacity onPress={cancelLink} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Connect WhatsApp</Text>
        </View>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={s.loadingText}>{waitingQR ? 'Generating QR code...' : 'Generating pairing code...'}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(37,211,102,0.1)', 'rgba(37,211,102,0.03)', 'transparent']}
        style={s.headerGlow}
      />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Connect WhatsApp</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {connected ? (
          <LinearGradient
            colors={['rgba(37,211,102,0.1)', 'rgba(37,211,102,0.03)']}
            style={s.connectedCard}
          >
            <MaterialCommunityIcons name={botConnected ? 'check-circle' : 'whatsapp'} size={48} color="#25D366" />
            <Text style={s.connectedTitle}>WhatsApp AI {botConnected ? 'Active' : 'Saved'}</Text>
            <Text style={s.connectedNumber}>{savedNumber}</Text>

            {botConnected ? (
              <>
                <Text style={s.connectedDesc}>
                  Your AI chatbot is live. Customers who message you get instant replies, booking, pricing, and more.
                </Text>
                <View style={s.cloudNotice}>
                  <MaterialCommunityIcons name="information-outline" size={18} color="#f59e0b" />
                  <Text style={s.cloudNoticeText}>
                    WhatsApp may show a security notice on some messages sent by your AI assistant. This is standard for all WhatsApp-integrated business tools and occurs because your chatbot operates from our secure cloud infrastructure. It does not affect message delivery or your account. Your customers can safely disregard this notice.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={s.connectedDesc}>
                  Your number is saved. Link your WhatsApp below to activate the AI chatbot.
                </Text>

                <TouchableOpacity activeOpacity={0.8} onPress={startQRLink} style={{ alignSelf: 'stretch', marginBottom: 14 }}>
                  <LinearGradient colors={['#25D366', '#128C7E']} style={s.connectBtn}>
                    <MaterialCommunityIcons name="qrcode-scan" size={20} color="#fff" />
                    <Text style={s.connectBtnText}>Link WhatsApp</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={s.securityNotice}>
                  <MaterialCommunityIcons name="laptop" size={20} color="#60a5fa" />
                  <Text style={s.securityNoticeText}>
                    For best experience, open Solis on a laptop, desktop, or a second device to scan the QR code with your WhatsApp camera.
                  </Text>
                </View>
              </>
            )}

            <View style={s.statusList}>
              <View style={s.statusItem}>
                <View style={[s.statusDot, botConnected ? {} : s.statusDotOff]} />
                <Text style={s.statusText}>Auto-replies {botConnected ? 'enabled' : 'pending'}</Text>
              </View>
              <View style={s.statusItem}>
                <View style={[s.statusDot, botConnected ? {} : s.statusDotOff]} />
                <Text style={s.statusText}>Appointment booking {botConnected ? 'active' : 'pending'}</Text>
              </View>
              <View style={s.statusItem}>
                <View style={[s.statusDot, botConnected ? {} : s.statusDotOff]} />
                <Text style={s.statusText}>Service & pricing info</Text>
              </View>
              <View style={s.statusItem}>
                <View style={[s.statusDot, botConnected ? {} : s.statusDotOff]} />
                <Text style={s.statusText}>Working 24/7</Text>
              </View>
            </View>

            <Text style={s.changeLabel}>Change number</Text>
            <TextInput
              style={s.input}
              placeholder="+61 416 161 691"
              placeholderTextColor={colors.textMuted}
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              keyboardType="phone-pad"
            />
            <View style={s.btnRow}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleSaveNumber} style={{ flex: 1 }}>
                <LinearGradient colors={['#25D366', '#128C7E']} style={s.saveBtn}>
                  <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Update Number'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.disconnectBtn} onPress={handleDisconnect}>
                <Text style={s.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ) : (
          <View style={s.setupCard}>
            <MaterialCommunityIcons name="whatsapp" size={48} color="#25D366" />
            <Text style={s.setupTitle}>Connect Your WhatsApp</Text>
            <Text style={s.setupDesc}>
              Enter your business WhatsApp number below. After saving, you'll link your WhatsApp account so the AI chatbot can handle messages 24/7.
            </Text>

            <Text style={s.inputLabel}>WhatsApp Phone Number</Text>
            <TextInput
              style={s.input}
              placeholder="+61 416 161 691"
              placeholderTextColor={colors.textMuted}
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              keyboardType="phone-pad"
              autoFocus
            />
            <Text style={s.inputHint}>Include country code (e.g. +61, +44, +1)</Text>

            <TouchableOpacity activeOpacity={0.8} onPress={handleSaveNumber} disabled={saving}>
              <LinearGradient colors={['#25D366', '#128C7E']} style={s.connectBtn}>
                <Text style={s.connectBtnText}>{saving ? 'Saving...' : 'Save & Continue'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.infoSection}>
          <Text style={s.infoTitle}>How it works</Text>

          <View style={s.infoStep}>
            <View style={s.stepNum}><Text style={s.stepNumText}>1</Text></View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Save your WhatsApp number</Text>
              <Text style={s.stepDesc}>Enter your business WhatsApp number with country code</Text>
            </View>
          </View>

          <View style={s.infoStep}>
            <View style={s.stepNum}><Text style={s.stepNumText}>2</Text></View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Link your WhatsApp</Text>
              <Text style={s.stepDesc}>Open this app on a laptop or second device, then scan the QR code with your WhatsApp camera</Text>
            </View>
          </View>

          <View style={s.infoStep}>
            <View style={s.stepNum}><Text style={s.stepNumText}>3</Text></View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>AI chatbot goes live</Text>
              <Text style={s.stepDesc}>Customers message your number, AI replies instantly with services, pricing, and books appointments</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 15, color: colors.textSecondary, marginTop: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 60, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: 0.3, flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },

  // QR Code screen
  qrCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.2)', alignItems: 'center', marginBottom: 28,
  },
  qrImage: { width: 260, height: 260, borderRadius: 12, marginBottom: 20, backgroundColor: '#fff' },
  qrTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  qrInstructions: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12, alignSelf: 'flex-start' },
  qrSteps: { alignSelf: 'stretch', marginBottom: 20 },
  qrStep: { fontSize: 14, color: colors.textSecondary, lineHeight: 28, paddingLeft: 8 },


  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  waitingText: { fontSize: 13, color: '#25D366', fontWeight: '500' },

  // Connected state
  connectedCard: {
    borderRadius: 20, padding: 28, borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.2)', alignItems: 'center', marginBottom: 28,
  },
  connectedTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
  connectedNumber: { fontSize: 18, fontWeight: '600', color: '#25D366', marginBottom: 12 },
  connectedDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },

  methodTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16, alignSelf: 'flex-start' },
  methodHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 4 },
  cloudNotice: {
    flexDirection: 'row', alignSelf: 'stretch', marginTop: 12, padding: 14,
    backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', gap: 10, alignItems: 'flex-start',
  },
  cloudNoticeText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  securityNotice: {
    flexDirection: 'row', alignSelf: 'stretch', marginTop: 20, padding: 14,
    backgroundColor: 'rgba(96,165,250,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', gap: 10, alignItems: 'flex-start',
  },
  securityNoticeText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  securityNoticeSmall: {
    flexDirection: 'row', alignSelf: 'stretch', marginBottom: 20, padding: 12,
    backgroundColor: 'rgba(96,165,250,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', gap: 8, alignItems: 'flex-start',
  },
  securityNoticeSmallText: { flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 },

  statusList: { alignSelf: 'stretch', marginBottom: 24, marginTop: 16 },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#25D366' },
  statusDotOff: { backgroundColor: '#6b7280' },
  statusText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  changeLabel: { fontSize: 13, color: colors.textMuted, alignSelf: 'flex-start', marginBottom: 8, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  disconnectBtn: {
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  disconnectText: { fontSize: 14, fontWeight: '600', color: '#f43f5e' },

  // Setup (first time)
  setupCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', marginBottom: 28,
  },
  setupTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
  setupDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: colors.text, alignSelf: 'flex-start', marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16,
    fontSize: 18, color: colors.text, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'stretch', letterSpacing: 1, fontWeight: '500',
  },
  inputHint: { fontSize: 12, color: colors.textMuted, marginTop: 8, marginBottom: 24, alignSelf: 'flex-start' },
  connectBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center', alignSelf: 'stretch',
    flexDirection: 'row', justifyContent: 'center', gap: 8, ...shadows.button,
  },
  connectBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  altBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: 'center', alignSelf: 'stretch',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.3)', backgroundColor: 'rgba(37,211,102,0.08)',
  },
  altBtnText: { fontSize: 16, fontWeight: '700', color: '#25D366' },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...shadows.button },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // How it works
  infoSection: { marginBottom: 20 },
  infoTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 20 },
  infoStep: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  stepNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(37,211,102,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 14, fontWeight: '700', color: '#25D366' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  stepDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
})
