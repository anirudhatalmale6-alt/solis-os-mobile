import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useFocusEffect } from '@react-navigation/native'
import { colors, shadows } from '../../theme/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

export default function BookingLinkScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState(null)
  const [copied, setCopied] = useState(false)

  const bookingUrl = business
    ? `https://app.solis-os.com/book/${business.id}`
    : ''

  const fetchBusiness = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: bizArr } = await supabase
        .from('businesses')
        .select('id, name, slug')
        .eq('owner_id', user.id)
      const biz = bizArr?.[0]
      if (biz) {
        setBusiness(biz)
      }
    } catch (err) {
      console.error('Error fetching business:', err)
    }
    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      fetchBusiness()
    }, [user?.id])
  )

  const handleCopyLink = async () => {
    try {
      // Use Share API as clipboard fallback
      await Share.share({
        message: bookingUrl,
      })
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      Alert.alert('Error', 'Could not copy link')
    }
  }

  const handleShareLink = async () => {
    try {
      await Share.share({
        title: `Book with ${business?.name || 'us'}`,
        message: `Book your appointment here: ${bookingUrl}`,
        url: bookingUrl,
      })
    } catch (err) {
      if (err.message !== 'User did not share') {
        Alert.alert('Error', 'Could not open share sheet')
      }
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.03)', 'transparent']} style={styles.headerGlow} />
      <View style={styles.glowOrb1} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.header}>Booking Link</Text>
        <Text style={styles.subtitle}>
          Share your booking link with customers so they can schedule appointments directly.
        </Text>

        {/* URL Card */}
        <View style={styles.urlCard}>
          <View style={styles.urlLabelRow}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <Text style={styles.urlText} numberOfLines={2}>
            {bookingUrl}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.copyButton]}
            onPress={handleCopyLink}
            activeOpacity={0.7}
          >
            <Text style={styles.copyButtonIcon}>📋</Text>
            <Text style={styles.copyButtonText}>
              {copied ? 'Copied!' : 'Copy Link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShareLink}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.shareButtonGradient}>
              <Text style={styles.shareButtonIcon}>📤</Text>
              <Text style={styles.shareButtonText}>Share Link</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Preview Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What customers see</Text>
          <Text style={styles.cardDescription}>
            Customers can book appointments directly from this link. They will see your available services, staff members, and open time slots.
          </Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewIcon}>📅</Text>
            <Text style={styles.previewText}>
              Your public booking page — no app download required
            </Text>
          </View>
        </View>

        {/* QR Info Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>QR Code</Text>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrIcon}>⬜</Text>
            <Text style={styles.qrText}>
              Generate a QR code for your booking link to display in-store or on printed materials.
            </Text>
          </View>
          <Text style={styles.qrHint}>Coming soon</Text>
        </View>

        {/* Tips Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tips for sharing</Text>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>📱</Text>
            <Text style={styles.tipText}>Share on social media profiles and posts</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>🌐</Text>
            <Text style={styles.tipText}>Add to your website as a "Book Now" button</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>💬</Text>
            <Text style={styles.tipText}>Send via WhatsApp to your customers</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>✉️</Text>
            <Text style={styles.tipText}>Include in your email signature</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },

  // URL Card
  urlCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    marginBottom: 20,
    ...shadows.card,
  },
  urlLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.green,
  },
  urlText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
    lineHeight: 22,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  copyButton: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  copyButtonIcon: {
    fontSize: 16,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  shareButton: {
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonIcon: {
    fontSize: 16,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },

  // Cards
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    marginBottom: 16,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },

  // Preview
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  previewIcon: {
    fontSize: 20,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    lineHeight: 19,
  },

  // QR
  qrPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  qrIcon: {
    fontSize: 32,
    opacity: 0.4,
  },
  qrText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  qrHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Tips
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  tipIcon: {
    fontSize: 18,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
})
