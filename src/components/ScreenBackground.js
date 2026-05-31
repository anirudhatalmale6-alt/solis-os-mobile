import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { colors } from '../theme/colors'

const TABLET_BREAKPOINT = 768
const MAX_CONTENT_WIDTH = 560

export default function ScreenBackground({ children, style, fullWidth }) {
  const { width } = useWindowDimensions()
  const isTablet = width >= TABLET_BREAKPOINT

  return (
    <View style={[styles.container, style]}>
      {isTablet && !fullWidth ? (
        <View style={[styles.inner, { maxWidth: MAX_CONTENT_WIDTH }]}>
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
})
