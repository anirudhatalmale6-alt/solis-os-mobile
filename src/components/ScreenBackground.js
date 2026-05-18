import React from 'react'
import { ImageBackground, View, StyleSheet } from 'react-native'

const BG_IMAGES = {
  golden: require('../assets/backgrounds/bg_bokeh.jpg'),
  sapphire: require('../assets/backgrounds/bg_glow.jpg'),
  warm: require('../assets/backgrounds/bg_marble.jpg'),
  royal: require('../assets/backgrounds/bg_geometric.jpg'),
}

export default function ScreenBackground({ theme = 'golden', children, style, overlay = 0.45 }) {
  return (
    <ImageBackground
      source={BG_IMAGES[theme] || BG_IMAGES.golden}
      style={[styles.container, style]}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { backgroundColor: `rgba(8,8,13,${overlay})` }]} />
      {children}
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
})
