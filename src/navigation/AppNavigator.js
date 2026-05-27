import React from 'react'
import { Text, View, ActivityIndicator, StyleSheet, Platform } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { useAuth } from '../lib/AuthContext'
import { colors } from '../theme/colors'

// Auth Screens
import RoleSelectScreen from '../screens/auth/RoleSelectScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import SignupScreen from '../screens/auth/SignupScreen'
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen'

// Customer Screens
import HomeScreen from '../screens/customer/HomeScreen'
import ExploreScreen from '../screens/customer/ExploreScreen'
import BusinessProfileScreen from '../screens/customer/BusinessProfileScreen'
import BookAppointmentScreen from '../screens/customer/BookAppointmentScreen'
import MyBookingsScreen from '../screens/customer/MyBookingsScreen'
import ProfileScreen from '../screens/customer/ProfileScreen'
import CustomerNotificationsScreen from '../screens/customer/NotificationsScreen'
import HelpSupportScreen from '../screens/customer/HelpSupportScreen'
import AboutScreen from '../screens/customer/AboutScreen'

// Business: full web dashboard
import WebAppScreen from '../screens/business/WebAppScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const HomeStack = createNativeStackNavigator()
const ProfileStack = createNativeStackNavigator()

function CustomerHomeStack() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
      <HomeStack.Screen name="BookAppointment" component={BookAppointmentScreen} />
      <HomeStack.Screen name="Login" component={LoginScreen} />
      <HomeStack.Screen name="Signup" component={SignupScreen} />
      <HomeStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </HomeStack.Navigator>
  )
}

function CustomerProfileStack() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="CustomerNotifications" component={CustomerNotificationsScreen} />
      <ProfileStack.Screen name="CustomerHelp" component={HelpSupportScreen} />
      <ProfileStack.Screen name="CustomerAbout" component={AboutScreen} />
    </ProfileStack.Navigator>
  )
}

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={CustomerHomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={focused ? colors.primary : '#9CA3AF'} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={focused ? colors.primary : '#9CA3AF'} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={22} color={focused ? colors.primary : '#9CA3AF'} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={CustomerProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={focused ? colors.primary : '#9CA3AF'} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="WebApp" component={WebAppScreen} />
        </Stack.Navigator>
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E9EF',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 45 : 8,
    height: Platform.OS === 'android' ? 105 : 66,
    shadowColor: '#8B8FA8',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
})
