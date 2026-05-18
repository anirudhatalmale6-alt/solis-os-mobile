import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

const { width: W, height: H } = Dimensions.get('window')

const THEMES = {
  golden: {
    base: ['#0a0a12', '#0d0b14', '#100e18'],
    orbs: [
      { colors: ['rgba(245,158,11,0.28)', 'rgba(245,158,11,0.08)', 'transparent'], cx: 0.15, cy: 0.08, size: 0.7 },
      { colors: ['rgba(59,130,246,0.18)', 'rgba(59,130,246,0.05)', 'transparent'], cx: 0.85, cy: 0.25, size: 0.5 },
      { colors: ['rgba(245,158,11,0.15)', 'rgba(200,120,10,0.06)', 'transparent'], cx: 0.5, cy: 0.55, size: 0.8 },
      { colors: ['rgba(167,139,250,0.12)', 'rgba(167,139,250,0.04)', 'transparent'], cx: 0.1, cy: 0.75, size: 0.5 },
    ],
  },
  sapphire: {
    base: ['#08081a', '#0a0c1e', '#0c0e22'],
    orbs: [
      { colors: ['rgba(59,130,246,0.25)', 'rgba(59,130,246,0.08)', 'transparent'], cx: 0.5, cy: 0.1, size: 0.7 },
      { colors: ['rgba(245,158,11,0.20)', 'rgba(245,158,11,0.06)', 'transparent'], cx: 0.85, cy: 0.4, size: 0.5 },
      { colors: ['rgba(59,130,246,0.15)', 'rgba(30,80,200,0.05)', 'transparent'], cx: 0.2, cy: 0.6, size: 0.6 },
      { colors: ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)', 'transparent'], cx: 0.7, cy: 0.85, size: 0.5 },
    ],
  },
  amber: {
    base: ['#0c0a08', '#0e0c10', '#100e14'],
    orbs: [
      { colors: ['rgba(245,158,11,0.32)', 'rgba(200,120,10,0.10)', 'transparent'], cx: 0.3, cy: 0.05, size: 0.6 },
      { colors: ['rgba(245,158,11,0.18)', 'rgba(245,158,11,0.06)', 'transparent'], cx: 0.8, cy: 0.35, size: 0.5 },
      { colors: ['rgba(34,197,94,0.12)', 'rgba(34,197,94,0.04)', 'transparent'], cx: 0.15, cy: 0.5, size: 0.5 },
      { colors: ['rgba(245,158,11,0.22)', 'rgba(180,100,10,0.08)', 'transparent'], cx: 0.6, cy: 0.75, size: 0.7 },
    ],
  },
  royal: {
    base: ['#0a0814', '#0c0a18', '#0e0c1c'],
    orbs: [
      { colors: ['rgba(167,139,250,0.22)', 'rgba(167,139,250,0.08)', 'transparent'], cx: 0.2, cy: 0.1, size: 0.6 },
      { colors: ['rgba(245,158,11,0.25)', 'rgba(245,158,11,0.08)', 'transparent'], cx: 0.8, cy: 0.3, size: 0.5 },
      { colors: ['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)', 'transparent'], cx: 0.4, cy: 0.55, size: 0.6 },
      { colors: ['rgba(245,158,11,0.18)', 'rgba(245,158,11,0.06)', 'transparent'], cx: 0.15, cy: 0.8, size: 0.5 },
    ],
  },
}

export default function LuxuryBackground({ theme = 'golden', children, style }) {
  const t = THEMES[theme] || THEMES.golden

  return (
    <View style={[styles.container, style]}>
      <LinearGradient colors={t.base} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      {t.orbs.map((orb, i) => (
        <View
          key={i}
          style={[
            styles.orbContainer,
            {
              left: W * orb.cx - W * orb.size / 2,
              top: H * orb.cy - H * orb.size / 2,
              width: W * orb.size,
              height: W * orb.size,
            },
          ]}
        >
          <LinearGradient
            colors={orb.colors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0, y: 0 }}
            locations={[0, 0.5, 1]}
          />
        </View>
      ))}
      <View style={styles.noiseOverlay} />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080d',
  },
  orbContainer: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: 'white',
  },
})
