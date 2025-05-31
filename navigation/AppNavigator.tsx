// navigation/AppNavigator.tsx - Main navigation for mobile app

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import DonorsScreen from '../screens/DonorsScreen';
import HospitalsScreen from '../screens/HospitalsScreen';
import RequestsScreen from '../screens/RequestsScreen';
import DonationsScreen from '../screens/DonationsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PledgesScreen from '../screens/PledgesScreen';
import MoreScreen from '../screens/MoreScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const MoreStack = createStackNavigator();

// Auth Stack (Login/Register)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// More Stack (Additional screens)
function MoreStackNavigator() {
  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#dc2626' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <MoreStack.Screen
        name="MoreHome"
        component={MoreScreen}
        options={{ title: 'Plus' }}
      />
      <MoreStack.Screen
        name="Donations"
        component={DonationsScreen}
        options={{ title: 'Historique des dons' }}
      />
      <MoreStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <MoreStack.Screen
        name="Pledges"
        component={PledgesScreen}
        options={{ title: 'Mes engagements' }}
      />
      <MoreStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </MoreStack.Navigator>
  );
}

// Main App Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Donors') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Hospitals') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#dc2626', // red-600
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#dc2626',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Tableau de bord' }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{ title: 'Demandes' }}
      />
      <Tab.Screen
        name="Donors"
        component={DonorsScreen}
        options={{ title: 'Donneurs' }}
      />
      <Tab.Screen
        name="Hospitals"
        component={HospitalsScreen}
        options={{ title: 'Hôpitaux' }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        options={{ title: 'Plus', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Main App Stack
function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
