// screens/NotificationsScreen.tsx - Notifications and subscription settings screen for mobile app

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface Hospital {
  id: string;
  name: string;
  type: string;
  wilaya: string;
  urgency: 'high' | 'medium' | 'low';
}

interface NotificationSettings {
  enableNotifications: boolean;
  subscribedHospitals: string[];
  urgencyLevels: {
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  notificationMethods: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'info' | 'success';
  hospitalId?: string;
  hospitalName?: string;
  timestamp: string;
  isRead: boolean;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enableNotifications: true,
    subscribedHospitals: [],
    urgencyLevels: {
      high: true,
      medium: true,
      low: false,
    },
    notificationMethods: {
      push: true,
      email: false,
      sms: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.token || !user) return;

    try {
      setIsLoading(true);

      // Mock data for notifications
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Demande urgente de sang O+',
          message: 'CHU Mustapha Pacha a besoin de sang O+ de toute urgence',
          type: 'urgent',
          hospitalId: 'h1',
          hospitalName: 'CHU Mustapha Pacha',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
        },
        {
          id: '2',
          title: 'Don programmé demain',
          message: 'N\'oubliez pas votre rendez-vous de don prévu demain à 10h00',
          type: 'info',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          isRead: false,
        },
        {
          id: '3',
          title: 'Don effectué avec succès',
          message: 'Merci pour votre don! Votre certificat est disponible.',
          type: 'success',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
        },
      ];

      // Mock data for hospitals
      const mockHospitals: Hospital[] = [
        {
          id: 'h1',
          name: 'CHU Mustapha Pacha',
          type: 'Centre Hospitalier Universitaire',
          wilaya: 'Alger',
          urgency: 'high',
        },
        {
          id: 'h2',
          name: 'Hôpital Parnet',
          type: 'Hôpital Général',
          wilaya: 'Alger',
          urgency: 'medium',
        },
        {
          id: 'h3',
          name: 'Centre de Transfusion Sanguine',
          type: 'Centre de Transfusion',
          wilaya: 'Alger',
          urgency: 'low',
        },
      ];

      setNotifications(mockNotifications);
      setHospitals(mockHospitals);

    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Erreur', 'Impossible de charger les notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleNotifications = async (enabled: boolean) => {
    try {
      // In a real app, this would save to backend
      setSettings(prev => ({ ...prev, enableNotifications: enabled }));

      if (!enabled) {
        Alert.alert(
          'Notifications désactivées',
          'Vous ne recevrez plus de notifications sur les demandes de sang urgentes.'
        );
      } else {
        Alert.alert(
          'Notifications activées',
          'Vous recevrez maintenant des notifications sur les demandes de sang urgentes.'
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier les paramètres');
    }
  };

  const toggleHospitalSubscription = (hospitalId: string) => {
    setSettings(prev => {
      const isSubscribed = prev.subscribedHospitals.includes(hospitalId);
      const newSubscriptions = isSubscribed
        ? prev.subscribedHospitals.filter(id => id !== hospitalId)
        : [...prev.subscribedHospitals, hospitalId];

      return {
        ...prev,
        subscribedHospitals: newSubscriptions,
      };
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return '#ef4444'; // red-500
      case 'info':
        return '#3b82f6'; // blue-500
      case 'success':
        return '#10b981'; // green-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '#ef4444'; // red-500
      case 'medium':
        return '#f59e0b'; // amber-500
      case 'low':
        return '#10b981'; // green-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadNotification]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <MaterialIcons
          name={getNotificationIcon(item.type)}
          size={24}
          color={getNotificationColor(item.type)}
        />
        <View style={styles.notificationInfo}>
          <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.notificationTimestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>

      <Text style={styles.notificationMessage}>{item.message}</Text>

      {item.hospitalName && (
        <View style={styles.notificationFooter}>
          <MaterialIcons name="local-hospital" size={16} color="#6b7280" />
          <Text style={styles.hospitalName}>{item.hospitalName}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHospitalItem = ({ item }: { item: Hospital }) => {
    const isSubscribed = settings.subscribedHospitals.includes(item.id);

    return (
      <View style={styles.hospitalCard}>
        <View style={styles.hospitalHeader}>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalName}>{item.name}</Text>
            <Text style={styles.hospitalType}>{item.type}</Text>
            <Text style={styles.hospitalWilaya}>{item.wilaya}</Text>
          </View>

          <View style={styles.hospitalActions}>
            <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
              <Text style={styles.urgencyText}>
                {item.urgency === 'high' ? 'Élevé' : item.urgency === 'medium' ? 'Moyen' : 'Faible'}
              </Text>
            </View>

            <Switch
              value={isSubscribed}
              onValueChange={() => toggleHospitalSubscription(item.id)}
              trackColor={{ false: '#d1d5db', true: '#dc2626' }}
              thumbColor={isSubscribed ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderNotificationsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.notificationsHeader}>
        <Text style={styles.sectionTitle}>Notifications récentes</Text>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
        >
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="notifications-none" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>Aucune notification</Text>
          <Text style={styles.emptyStateSubtext}>
            Vous recevrez ici les notifications importantes
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderSettingsTab = () => {
    const filteredHospitals = hospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.wilaya.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Paramètres généraux</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications" size={24} color="#dc2626" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDescription}>
                  Recevoir des notifications sur les demandes urgentes
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enableNotifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#d1d5db', true: '#dc2626' }}
              thumbColor={settings.enableNotifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Abonnements aux hôpitaux</Text>
          <Text style={styles.sectionDescription}>
            Choisissez les hôpitaux dont vous souhaitez recevoir les notifications
          </Text>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un hôpital..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredHospitals.length === 0 ? (
            <View style={styles.emptySearchState}>
              <Text style={styles.emptySearchText}>Aucun hôpital trouvé</Text>
            </View>
          ) : (
            <FlatList
              data={filteredHospitals}
              renderItem={renderHospitalItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={48} color="#dc2626" />
        <Text style={styles.loadingText}>Chargement des notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notifications' && styles.activeTab]}
          onPress={() => setActiveTab('notifications')}
        >
          <MaterialIcons
            name="notifications"
            size={20}
            color={activeTab === 'notifications' ? '#dc2626' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
            Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <MaterialIcons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? '#dc2626' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Paramètres
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'notifications' ? renderNotificationsTab() : renderSettingsTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#dc2626',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#dc2626',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalName: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  hospitalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hospitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalType: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  hospitalWilaya: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  hospitalActions: {
    alignItems: 'center',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySearchState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptySearchText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
