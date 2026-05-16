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
import ExploreScreen from '../screens/customer/ExploreScreen'
import BusinessProfileScreen from '../screens/customer/BusinessProfileScreen'
import BookAppointmentScreen from '../screens/customer/BookAppointmentScreen'
import MyBookingsScreen from '../screens/customer/MyBookingsScreen'
import ProfileScreen from '../screens/customer/ProfileScreen'

// Business Screens
import DashboardScreen from '../screens/business/DashboardScreen'
import BookingsScreen from '../screens/business/BookingsScreen'
import CustomersScreen from '../screens/business/CustomersScreen'
import MoreScreen from '../screens/business/MoreScreen'
import ServicesScreen from '../screens/business/ServicesScreen'
import ScheduleScreen from '../screens/business/ScheduleScreen'
import StaffScreen from '../screens/business/StaffScreen'
import SettingsScreen from '../screens/business/SettingsScreen'
import AnalyticsScreen from '../screens/business/AnalyticsScreen'
import BookingLinkScreen from '../screens/business/BookingLinkScreen'
import InvoicesScreen from '../screens/business/InvoicesScreen'
import ExpensesScreen from '../screens/business/ExpensesScreen'
import PromotionsScreen from '../screens/business/PromotionsScreen'
import NotificationsScreen from '../screens/business/NotificationsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const HomeStack = createNativeStackNavigator()
const MoreStack = createNativeStackNavigator()

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

// Business More Stack (More > Services, Schedule, Staff, etc.)
function BusinessMoreStack() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreMain" component={MoreScreen} />
      <MoreStack.Screen name="Services" component={ServicesScreen} />
      <MoreStack.Screen name="Schedule" component={ScheduleScreen} />
      <MoreStack.Screen name="Staff" component={StaffScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
      <MoreStack.Screen name="Analytics" component={AnalyticsScreen} />
      <MoreStack.Screen name="BookingLink" component={BookingLinkScreen} />
      <MoreStack.Screen name="Invoices" component={InvoicesScreen} />
      <MoreStack.Screen name="Expenses" component={ExpensesScreen} />
      <MoreStack.Screen name="Promotions" component={PromotionsScreen} />
      <MoreStack.Screen name="Notifications" component={NotificationsScreen} />
    </MoreStack.Navigator>
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
        component={BusinessMoreStack}
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
    backgroundColor: 'rgba(8, 8, 13, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
    paddingBottom: 8,
    height: 66,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
})
