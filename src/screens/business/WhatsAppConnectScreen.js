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

  // QR code state
  const [qrImage, setQrImage] = useState(null)
  const [waitingQR, setWaitingQR] = useState(false)
  const pollRef = useRef(null)

  // Pairing code state
  const [pairingCode, setPairingCode] = useState(null)
  const [waitingCode, setWaitingCode] = useState(false)

  const [linkMethod, setLinkMethod] = useState(null)

  const fetchBusiness = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: bizArr } = await supabase.from('businesses').select('id, whatsapp_number').eq('owner_id', user.id)
      const biz = bizArr?.[0]
      if (biz) {
        setBizId(biz.id)
        if (biz.whatsapp_number) {
          setWhatsappNumber(biz.whatsapp_number)
          setSavedNumber(biz.whatsapp_number)
          setConnected(true)
          checkBotStatus(biz.id)
        }
      }
    } catch (e) {}
    setLoading(false)
  }

  const checkBotStatus = async (id) => {
    try {
      const resp = await fetch(`${BOT_URL}/api/whatsapp/status/${id}`)
      const data = await resp.json()
      setBotConnected(data.status === 'connected')
    } catch (e) {
      setBotConnected(false)
    }
  }

  useFocusEffect(useCallback(() => {
    fetchBusiness()
    return () => {
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
    try {
      await fetch(`${BOT_URL}/api/whatsapp/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: bizId }),
      })
      startPollingQR()
    } catch (e) {
      setWaitingQR(false)
      Alert.alert('Error', 'Could not reach the bot server. Please try again later.')
    }
  }

  const startPairingLink = async () => {
    setLinkMethod('code')
    setWaitingCode(true)
    setPairingCode(null)
    try {
      await fetch(`${BOT_URL}/api/whatsapp/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: bizId, phone_number: savedNumber }),
      })
      startPollingForCode()
    } catch (e) {
      setWaitingCode(false)
      Alert.alert('Error', 'Could not reach the bot server. Please try again later.')
    }
  }

  const startPollingQR = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > 60) {
        clearInterval(pollRef.current)
        setWaitingQR(false)
        Alert.alert('Timeout', 'QR code expired. Please try again.')
        return
      }
      try {
        const resp = await fetch(`${BOT_URL}/api/whatsapp/qr/${bizId}`)
        const data = await resp.json()
        if (data.qr) {
          setQrImage(data.qr)
          setWaitingQR(false)
        }
        if (data.status === 'connected') {
          clearInterval(pollRef.current)
          setQrImage(null)
          setWaitingQR(false)
          setConnected(true)
          setBotConnected(true)
          Alert.alert('Connected!', 'Your WhatsApp AI chatbot is now live!')
        }
      } catch (e) {}
    }, 2000)
  }

  const startPollingForCode = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > 30) {
        clearInterval(pollRef.current)
        setWaitingCode(false)
        Alert.alert('Timeout', 'Could not get pairing code. Please try again.')
        return
      }
      try {
        const resp = await fetch(`${BOT_URL}/api/whatsapp/pairing-code/${bizId}`)
        const data = await resp.json()
        if (data.code) {
          setPairingCode(data.code)
          setWaitingCode(false)
          clearInterval(pollRef.current)
          startPollingForConnection()
        } else if (data.status === 'connected') {
          clearInterval(pollRef.current)
          setWaitingCode(false)
          setPairingCode(null)
          setConnected(true)
          setBotConnected(true)
        }
      } catch (e) {}
    }, 2000)
  }

  const startPollingForConnection = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > 90) {
        clearInterval(pollRef.current)
        return
      }
      try {
        const resp = await fetch(`${BOT_URL}/api/whatsapp/status/${bizId}`)
        const data = await resp.json()
        if (data.status === 'connected') {
          clearInterval(pollRef.current)
          setPairingCode(null)
          setQrImage(null)
          setLinkMethod(null)
          setConnected(true)
          setBotConnected(true)
          Alert.alert('Connected!', 'Your WhatsApp AI chatbot is now live. Customers who message this number will get instant AI replies.')
        }
      } catch (e) {}
    }, 3000)
  }

  const handleDisconnect = () => {
    Alert.alert('Disconnect WhatsApp', 'This will stop the AI chatbot.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${BOT_URL}/api/whatsapp/disconnect`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ business_id: bizId }),
            })
          } catch (e) {}
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
            <Text style={s.qrTitle}>Link Your WhatsApp</Text>
            <Text style={s.qrInstructions}>Follow these steps:</Text>
            <View style={s.qrSteps}>
              <Text style={s.qrStep}>1. Take a screenshot of this QR code</Text>
              <Text style={s.qrStep}>2. Open WhatsApp on this phone</Text>
              <Text style={s.qrStep}>3. Go to Settings {'>'} Linked Devices</Text>
              <Text style={s.qrStep}>4. Tap "Link a Device"</Text>
              <Text style={s.qrStep}>5. Tap the gallery/photos icon at the bottom</Text>
              <Text style={s.qrStep}>6. Select the screenshot you just took</Text>
            </View>
            <View style={s.waitingRow}>
              <ActivityIndicator size="small" color="#25D366" />
              <Text style={s.waitingText}>Waiting for you to scan...</Text>
            </View>
            <Text style={s.qrNote}>QR code refreshes automatically. If it doesn't work, go back and try again.</Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  // Pairing code display screen
  if (pairingCode) {
    const formatted = pairingCode.length === 8
      ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}`
      : pairingCode
    return (
      <View style={s.container}>
        <LinearGradient colors={['rgba(37,211,102,0.1)', 'rgba(37,211,102,0.03)', 'transparent']} style={s.headerGlow} />
        <View style={s.header}>
          <TouchableOpacity onPress={cancelLink} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Enter Code</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.codeCard}>
            <MaterialCommunityIcons name="whatsapp" size={48} color="#25D366" />
            <Text style={s.codeTitle}>Your Pairing Code</Text>
            <View style={s.codeBox}>
              <Text style={s.codeText}>{formatted}</Text>
            </View>
            <Text style={s.codeInstructions}>Open WhatsApp on this phone:</Text>
            <View style={s.codeSteps}>
              <Text style={s.codeStep}>1. Go to Settings</Text>
              <Text style={s.codeStep}>2. Tap Linked Devices</Text>
              <Text style={s.codeStep}>3. Tap Link a Device</Text>
              <Text style={s.codeStep}>4. Tap "Link with phone number instead"</Text>
              <Text style={s.codeStep}>5. Enter the code above</Text>
            </View>
            <View style={s.securityNoticeSmall}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#60a5fa" />
              <Text style={s.securityNoticeSmallText}>
                You may see a location security notice - this is normal. It's our secure cloud server. Tap "Link Device" to continue.
              </Text>
            </View>
            <View style={s.waitingRow}>
              <ActivityIndicator size="small" color="#25D366" />
              <Text style={s.waitingText}>Waiting for you to enter the code...</Text>
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
              <Text style={s.connectedDesc}>
                Your AI chatbot is live. Customers who message you get instant replies, booking, pricing, and more.
              </Text>
            ) : (
              <>
                <Text style={s.connectedDesc}>
                  Your number is saved. Link your WhatsApp below to activate the AI chatbot.
                </Text>

                <Text style={s.methodTitle}>Choose how to link:</Text>

                <TouchableOpacity activeOpacity={0.8} onPress={startPairingLink} style={{ alignSelf: 'stretch', marginBottom: 10 }}>
                  <LinearGradient colors={['#25D366', '#128C7E']} style={s.connectBtn}>
                    <MaterialCommunityIcons name="dialpad" size={20} color="#fff" />
                    <Text style={s.connectBtnText}>Link with Pairing Code</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={s.methodHint}>Recommended for phone users - get an 8-digit code to enter in WhatsApp</Text>

                <TouchableOpacity activeOpacity={0.8} onPress={startQRLink} style={{ alignSelf: 'stretch', marginBottom: 10, marginTop: 12 }}>
                  <View style={s.altBtn}>
                    <MaterialCommunityIcons name="qrcode-scan" size={20} color="#25D366" />
                    <Text style={s.altBtnText}>Link with QR Code</Text>
                  </View>
                </TouchableOpacity>
                <Text style={s.methodHint}>Requires a second device (laptop/tablet) to scan the QR code</Text>

                <View style={s.securityNotice}>
                  <MaterialCommunityIcons name="shield-check" size={20} color="#60a5fa" />
                  <Text style={s.securityNoticeText}>
                    During linking, WhatsApp may show a security notice about a device in another location. This is normal - it's our secure cloud server that powers your AI chatbot. Your messages remain encrypted and private. Simply tap "Link Device" to continue.
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
              <Text style={s.stepDesc}>Use QR code (screenshot and scan from gallery) or enter a pairing code</Text>
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
  qrNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },

  // Pairing code screen
  codeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.2)', alignItems: 'center', marginBottom: 28,
  },
  codeTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 12, marginBottom: 20 },
  codeBox: {
    backgroundColor: 'rgba(37,211,102,0.12)', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 32,
    borderWidth: 2, borderColor: 'rgba(37,211,102,0.3)', marginBottom: 24,
  },
  codeText: { fontSize: 28, fontWeight: '800', color: '#25D366', letterSpacing: 4 },
  codeInstructions: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 16, textAlign: 'center' },
  codeSteps: { alignSelf: 'stretch', marginBottom: 24 },
  codeStep: { fontSize: 14, color: colors.textSecondary, lineHeight: 28, paddingLeft: 8 },

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
