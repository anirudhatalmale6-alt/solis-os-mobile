import React from 'react'
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { useAuth } from '../lib/AuthContext'
import { colors } from '../theme/colors'

// Auth Screens
import RoleSelectScreen from '../screens/auth/RoleSelectScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import SignupScreen from '../screens/auth/SignupScreen'

// Customer Screens
import HomeScreen from '../screens/customer/HomeScreen'
import BusinessProfileScreen from '../screens/customer/BusinessProfileScreen'
import BookAppointmentScreen from '../screens/customer/BookAppointmentScreen'
import MyBookingsScreen from '../screens/customer/MyBookingsScreen'
import ProfileScreen from '../screens/customer/ProfileScreen'

// Business Screens
import DashboardScreen from '../screens/business/DashboardScreen'
import BookingsScreen from '../screens/business/BookingsScreen'
import CustomersScreen from '../screens/business/CustomersScreen'
import MoreScreen from '../screens/business/MoreScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const HomeStack = createNativeStackNavigator()

// Customer Home Stack (Home > BusinessProfile > BookAppointment > Login/Signup)
function CustomerHomeStack() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
      <HomeStack.Screen name="BookAppointment" component={BookAppointmentScreen} />
      <HomeStack.Screen name="Login" component={LoginScreen} />
      <HomeStack.Screen name="Signup" component={SignupScreen} />
    </HomeStack.Navigator>
  )
}

// Placeholder Explore screen
function ExploreScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderEmoji}>🔍</Text>
      <Text style={styles.placeholderTitle}>Explore</Text>
      <Text style={styles.placeholderDesc}>Discover new businesses near you</Text>
    </View>
  )
}

// Customer Tab Navigator
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={CustomerHomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  )
}

// Business Tab Navigator
function BusinessTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>☰</Text>
          ),
        }}
      />
    </Tab.Navigator>
  )
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { user, userType, guestMode, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const showCustomerTabs = guestMode || (user && userType === 'customer')
  const showBusinessTabs = user && userType === 'business'

  return (
    <NavigationContainer>
      {showBusinessTabs ? (
        <BusinessTabs />
      ) : showCustomerTabs ? (
        <CustomerTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: '#111118',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 64,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  placeholderDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
