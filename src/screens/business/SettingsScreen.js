import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useFocusEffect } from '@react-navigation/native'
import { launchImageLibrary } from 'react-native-image-picker'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const INDUSTRIES = [
  { label: 'Salon', value: 'salon' },
  { label: 'Barber', value: 'barber' },
  { label: 'Garage', value: 'garage' },
  { label: 'Clinic', value: 'clinic' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'Lessons', value: 'lessons' },
  { label: 'Other', value: 'other' },
]

const CURRENCIES = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'CAD - Canadian Dollar', value: 'CAD' },
  { label: 'AUD - Australian Dollar', value: 'AUD' },
  { label: 'INR - Indian Rupee', value: 'INR' },
]

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bizId, setBizId] = useState(null)

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [industry, setIndustry] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [currency, setCurrency] = useState('USD')

  const [industryModalVisible, setIndustryModalVisible] = useState(false)
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false)

  const fetchBusiness = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: bizArr } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
      const biz = bizArr?.[0]
      if (biz) {
        setBizId(biz.id)
        setName(biz.name || '')
        setLogoUrl(biz.logo_url || '')
        setIndustry(biz.industry || '')
        setPhone(biz.phone || '')
        setEmail(biz.email || '')
        setAddress(biz.address || '')
        setCity(biz.city || '')
        setCountry(biz.country || '')
        setCurrency(biz.currency || 'USD')
      }
    } catch (err) {
      console.error('Error fetching business:', err)
    }
    setLoading(false)
  }

  useFocusEffect(useCallback(() => { fetchBusiness() }, [user]))

  const handleSave = async () => {
    if (!bizId) {
      Alert.alert('Error', 'No business profile found')
      return
    }
    setSaving(true)
    try {
      const updates = {
        name: name.trim(),
        industry,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        currency,
      }
      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', bizId)

      if (error) throw error
      Alert.alert('Success', 'Business settings saved successfully')
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save changes')
    }
    setSaving(false)
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ])
  }

  const handleLogoUpload = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8,
        includeBase64: true,
      })
      if (result.didCancel || !result.assets?.[0]) return

      setUploadingLogo(true)
      const asset = result.assets[0]
      const ext = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${bizId}/logo_${Date.now()}.${ext}`
      const contentType = asset.type || 'image/jpeg'

      const base64Data = asset.base64
      const binaryStr = atob(base64Data)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, bytes.buffer, {
          contentType,
          upsert: true,
        })

      if (uploadError) {
        Alert.alert('Upload Error', uploadError.message)
        setUploadingLogo(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase.from('businesses').update({ logo_url: publicUrl }).eq('id', bizId)
      if (dbError) {
        Alert.alert('Save Error', 'Logo uploaded but failed to save to profile: ' + dbError.message)
        setUploadingLogo(false)
        return
      }
      setLogoUrl(publicUrl)
      Alert.alert('Success', 'Logo uploaded successfully')
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to upload logo')
    }
    setUploadingLogo(false)
  }

  const getIndustryLabel = () => {
    const found = INDUSTRIES.find(i => i.value === industry)
    return found ? found.label : 'Select Industry'
  }

  const getCurrencyLabel = () => {
    const found = CURRENCIES.find(c => c.value === currency)
    return found ? found.label : 'Select Currency'
  }

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.03)', 'transparent']} style={s.headerGlow} />
      <View style={s.glowOrb1} />
      <View style={s.header}>
        <Text style={s.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <Text style={s.sectionLabel}>Business Logo</Text>
        <View style={s.card}>
          <View style={s.logoRow}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={s.logoPreview} />
            ) : (
              <LinearGradient colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.08)']} style={s.logoPlaceholder}>
                <Text style={s.logoPlaceholderText}>{name ? name[0]?.toUpperCase() : 'S'}</Text>
              </LinearGradient>
            )}
            <View style={s.logoInfo}>
              <Text style={s.logoInfoTitle}>{logoUrl ? 'Logo uploaded' : 'No logo yet'}</Text>
              <Text style={s.logoInfoDesc}>Your logo appears on your public profile</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={handleLogoUpload} disabled={uploadingLogo}>
                <LinearGradient colors={['#f59e0b', '#f97316']} style={s.logoUploadBtn}>
                  {uploadingLogo ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={s.logoUploadText}>{logoUrl ? 'Change Logo' : 'Upload Logo'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Business Profile Section */}
        <Text style={s.sectionLabel}>Business Profile</Text>
        <View style={s.card}>
          <View style={s.fieldGroup}>
            <Text style={s.label}>Business Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your business name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Industry</Text>
            <TouchableOpacity
              style={s.pickerButton}
              onPress={() => setIndustryModalVisible(true)}
            >
              <Text style={[s.pickerText, !industry && s.pickerPlaceholder]}>
                {getIndustryLabel()}
              </Text>
              <Text style={s.pickerArrow}>▾</Text>
            </TouchableOpacity>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Phone</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="business@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Address</Text>
            <TextInput
              style={s.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main Street"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldHalf}>
              <Text style={s.label}>City</Text>
              <TextInput
                style={s.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={s.fieldHalf}>
              <Text style={s.label}>Country</Text>
              <TextInput
                style={s.input}
                value={country}
                onChangeText={setCountry}
                placeholder="Country"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Currency</Text>
            <TouchableOpacity
              style={s.pickerButton}
              onPress={() => setCurrencyModalVisible(true)}
            >
              <Text style={[s.pickerText, !currency && s.pickerPlaceholder]}>
                {getCurrencyLabel()}
              </Text>
              <Text style={s.pickerArrow}>▾</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[s.saveButton, saving && s.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#f59e0b', '#f97316']} style={s.saveButtonGradient}>
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={s.saveButtonText}>Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Account Section */}
        <Text style={s.sectionLabel}>Account</Text>
        <View style={s.card}>
          <View style={s.accountRow}>
            <Text style={s.accountLabel}>Email</Text>
            <Text style={s.accountValue}>{user?.email || '--'}</Text>
          </View>

          <TouchableOpacity style={s.signOutButton} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Industry Picker Modal */}
      <Modal
        visible={industryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIndustryModalVisible(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setIndustryModalVisible(false)}
        >
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Select Industry</Text>
            <FlatList
              data={INDUSTRIES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.modalOption, industry === item.value && s.modalOptionActive]}
                  onPress={() => {
                    setIndustry(item.value)
                    setIndustryModalVisible(false)
                  }}
                >
                  <Text style={[s.modalOptionText, industry === item.value && s.modalOptionTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Select Currency</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.modalOption, currency === item.value && s.modalOptionActive]}
                  onPress={() => {
                    setCurrency(item.value)
                    setCurrencyModalVisible(false)
                  }}
                >
                  <Text style={[s.modalOptionText, currency === item.value && s.modalOptionTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  logoPreview: {
    width: 72, height: 72, borderRadius: 18, borderWidth: 2, borderColor: colors.borderGlow,
  },
  logoPlaceholder: {
    width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 28, fontWeight: '800', color: colors.primary,
  },
  logoInfo: { flex: 1 },
  logoInfoTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  logoInfoDesc: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  logoUploadBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start',
    ...shadows.button,
  },
  logoUploadText: { fontSize: 13, fontWeight: '700', color: '#000' },
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
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    marginBottom: 20,
    ...shadows.card,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  pickerButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 15,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.textMuted,
  },
  pickerArrow: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 28,
    ...shadows.button,
  },
  saveButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  accountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  accountValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 13,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#16161e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxHeight: 400,
    padding: 20,
    ...shadows.deep,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  modalOptionText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  modalOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
})
