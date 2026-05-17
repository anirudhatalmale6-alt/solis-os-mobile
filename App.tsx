import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { AuthProvider } from './src/lib/AuthContext'
import AppNavigator from './src/navigation/AppNavigator'

class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { console.log('App crash caught:', error?.message) }
  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Something went wrong</Text>
          <Text style={eb.desc}>The app hit an unexpected error.</Text>
          <TouchableOpacity style={eb.btn} onPress={() => this.setState({ hasError: false })}>
            <Text style={eb.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080d', alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 12 },
  desc: { fontSize: 15, color: '#9ca3af', marginBottom: 28, textAlign: 'center' },
  btn: { backgroundColor: '#f59e0b', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#000' },
})

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ErrorBoundary>
  )
}
