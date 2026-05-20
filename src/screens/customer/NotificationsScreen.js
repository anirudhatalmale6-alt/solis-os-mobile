import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { colors, shadows } from '../../theme/colors'

export default function NotificationsScreen({ navigation }) {
  return (
    <View style={s.container}>
      <LinearGradient
        colors={['rgba(245,158,11,0.1)', 'transparent']}
        style={s.headerGlow}
      />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.emptyWrap}>
        <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={s.emptyIcon}>
          <MaterialCommunityIcons name="bell-outline" size={40} color={colors.primary} />
        </LinearGradient>
        <Text style={s.emptyTitle}>No notifications yet</Text>
        <Text style={s.emptyDesc}>
          When you receive booking confirmations, reminders, or updates, they'll appear here.
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
