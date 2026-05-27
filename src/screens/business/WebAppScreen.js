import React, { useRef, useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  StatusBar,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native'
import { WebView } from 'react-native-webview'
import { useFocusEffect, useNavigation } from '@react-navigation/native'

const WEB_APP_URL = 'https://app.solis-os.com'
const BLOCKED_PATTERNS = ['/signup', '/register', '/sign-up', '/create-account', '/pricing', '/subscribe', '/checkout', '/payment']

export default function WebAppScreen() {
  const webViewRef = useRef(null)
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [canGoBack, setCanGoBack] = useState(false)

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack()
          return true
        }
        if (navigation.canGoBack()) {
          navigation.goBack()
          return true
        }
        return false
      }

      if (Platform.OS === 'android') {
        BackHandler.addEventListener('hardwareBackPress', onBackPress)
        return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress)
      }
    }, [canGoBack, navigation])
  )

  const injectedJS = `
    (function() {
      var meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      function hideSignupElements() {
        var links = document.querySelectorAll('a[href*="signup"], a[href*="register"], a[href*="sign-up"], a[href*="create-account"], a[href*="pricing"], a[href*="subscribe"]');
        links.forEach(function(el) { el.style.display = 'none'; });
        var texts = document.querySelectorAll('a, button, span');
        texts.forEach(function(el) {
          var t = (el.textContent || '').toLowerCase().trim();
          if (t === 'sign up' || t === 'register' || t === 'create account' || t === 'get started free') {
            el.style.display = 'none';
          }
        });
      }
      hideSignupElements();
      var observer = new MutationObserver(hideSignupElements);
      observer.observe(document.body, { childList: true, subtree: true });
    })();
    true;
  `

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url.toLowerCase()
          if (BLOCKED_PATTERNS.some(p => url.includes(p))) {
            Alert.alert('Registration', 'Please create your account at solis-os.com on your browser.')
            return false
          }
          return true
        }}
        injectedJavaScript={injectedJS}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        cacheEnabled={true}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        textZoom={100}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
})
