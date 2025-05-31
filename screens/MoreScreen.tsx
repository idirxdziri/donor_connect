// screens/MoreScreen.tsx - More/Menu screen for mobile app navigation

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  screen: string;
  color: string;
}

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Historique des dons',
      subtitle: 'Consultez vos dons passés et certificats',
      icon: 'favorite',
      screen: 'Donations',
      color: '#dc2626',
    },
    {
      id: '2',
      title: 'Notifications',
      subtitle: 'Gérez vos notifications et abonnements',
      icon: 'notifications',
      screen: 'Notifications',
      color: '#3b82f6',
    },
    {
      id: '3',
      title: 'Mes engagements',
      subtitle: 'Suivez vos rendez-vous de don',
      icon: 'assignment',
      screen: 'Pledges',
      color: '#f59e0b',
    },
    {
      id: '4',
      title: 'Mon profil',
      subtitle: 'Modifiez vos informations personnelles',
      icon: 'person',
      screen: 'Profile',
      color: '#10b981',
    },
  ];

  const handleMenuPress = (screen: string) => {
    navigation.navigate(screen as never);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={32} color="white" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
            <Text style={styles.userBloodType}>
              Groupe sanguin: {user?.bloodType || 'Non défini'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Menu principal</Text>

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.screen)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
              <MaterialIcons name={item.icon as any} size={24} color="white" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#6b7280' }]}>
            <MaterialIcons name="help" size={24} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Aide et support</Text>
            <Text style={styles.menuSubtitle}>Obtenez de l'aide et contactez le support</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#6b7280' }]}>
            <MaterialIcons name="info" size={24} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>À propos</Text>
            <Text style={styles.menuSubtitle}>Informations sur l'application</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
          <View style={[styles.menuIcon, { backgroundColor: '#ef4444' }]}>
            <MaterialIcons name="logout" size={24} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: '#ef4444' }]}>Se déconnecter</Text>
            <Text style={styles.menuSubtitle}>Déconnectez-vous de votre compte</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>DonorConnect v1.0.0</Text>
        <Text style={styles.footerSubtext}>
          Application mobile pour le don de sang en Algérie
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#dc2626',
    padding: 20,
    paddingTop: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  userBloodType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  menuSection: {
    margin: 16,
  },
  actionsSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
