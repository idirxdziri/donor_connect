// screens/DashboardScreen.tsx - Dashboard screen for mobile app

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { requestsApi, userApi } from '../services/api';
import { BloodRequest } from '../types/data';
import { BLOOD_GROUP_MAP } from '../types/data';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalRequests: number;
  criticalRequests: number;
  yourPledges: number;
  nearbyRequests: number;
}

interface RecentActivity {
  id: string;
  type: 'pledge' | 'request' | 'donation';
  title: string;
  subtitle: string;
  date: string;
  status?: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    criticalRequests: 0,
    yourPledges: 0,
    nearbyRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState<BloodRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load blood requests
      const requests = user?.token
        ? await requestsApi.getAuthenticatedBloodDonationRequests(user.token, 2)
        : await requestsApi.getPublicBloodDonationRequests(2);

      if (requests?.bloodDonationRequests) {
        const mappedRequests = mapRequestsToBloodRequests(requests.bloodDonationRequests.slice(0, 3));
        setRecentRequests(mappedRequests);

        // Calculate stats
        const total = requests.bloodDonationRequests.length;
        const critical = requests.bloodDonationRequests.filter((req: any) => req.priority === 3).length;

        setStats(prev => ({
          ...prev,
          totalRequests: total,
          criticalRequests: critical,
          nearbyRequests: total, // For now, assume all are nearby
        }));
      }

      // Generate mock recent activity
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'pledge',
          title: 'Engagement créé',
          subtitle: 'Hôpital Mustapha Pacha - Sang O+',
          date: '2024-01-15T10:30:00',
          status: 'En attente'
        },
        {
          id: '2',
          type: 'request',
          title: 'Nouvelle demande urgente',
          subtitle: 'CHU Beni Messous - Sang AB-',
          date: '2024-01-14T15:20:00'
        },
        {
          id: '3',
          type: 'donation',
          title: 'Don effectué',
          subtitle: 'Centre de transfusion Alger',
          date: '2024-01-12T09:15:00',
          status: 'Terminé'
        }
      ];
      setRecentActivity(mockActivity);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du tableau de bord');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const mapRequestsToBloodRequests = (apiRequests: any[]): BloodRequest[] => {
    return apiRequests.map((req, index) => ({
      id: req.id || `request-${index}`,
      hospitalName: req.bloodTansfusionCenter?.name || 'Hôpital inconnu',
      hospitalType: 'public' as const,
      bloodType: req.bloodGroup ? BLOOD_GROUP_MAP[req.bloodGroup as keyof typeof BLOOD_GROUP_MAP] || '?' : '?',
      bloodGroup: req.bloodGroup,
      urgency: req.priority === 3 ? 'critical' : req.priority === 2 ? 'urgent' : 'standard',
      deadline: req.requestDueDate || new Date().toISOString(),
      location: req.bloodTansfusionCenter?.wilaya?.name || 'Localisation inconnue',
      wilayaId: req.bloodTansfusionCenter?.wilayaId,
      distance: Math.floor(Math.random() * 50) + 1, // Mock distance
      notes: req.moreDetails || '',
      unitsNeeded: req.requestedQty || 1,
      contactInfo: {
        phone: req.bloodTansfusionCenter?.tel || '',
        email: req.bloodTansfusionCenter?.email || '',
        contactPerson: 'Service de transfusion',
      }
    }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#DC2626';
      case 'urgent': return '#EA580C';
      case 'standard': return '#059669';
      default: return '#6B7280';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'Critique';
      case 'urgent': return 'Urgent';
      case 'standard': return 'Standard';
      default: return 'Normal';
    }
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        <MaterialIcons name={icon as any} size={24} color={color} />
        <View style={styles.statCardText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const RequestCard = ({ request }: { request: BloodRequest }) => (
    <TouchableOpacity style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.bloodTypeCircle}>
          <Text style={styles.bloodTypeText}>{request.bloodType}</Text>
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.hospitalName}>{request.hospitalName}</Text>
          <Text style={styles.location}>
            <MaterialIcons name="location-on" size={12} color="#6B7280" />
            {' '}{request.location}
          </Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(request.urgency) }]}>
          <Text style={styles.urgencyText}>{getUrgencyText(request.urgency)}</Text>
        </View>
      </View>
      <Text style={styles.requestNotes} numberOfLines={2}>{request.notes}</Text>
      <View style={styles.requestFooter}>
        <Text style={styles.deadline}>
          <MaterialIcons name="schedule" size={12} color="#6B7280" />
          {' '}{new Date(request.deadline).toLocaleDateString('fr-FR')}
        </Text>
        <Text style={styles.unitsNeeded}>{request.unitsNeeded} unité(s)</Text>
      </View>
    </TouchableOpacity>
  );

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case 'pledge': return 'volunteer-activism';
        case 'request': return 'bloodtype';
        case 'donation': return 'favorite';
        default: return 'info';
      }
    };

    const getActivityColor = () => {
      switch (activity.type) {
        case 'pledge': return '#3B82F6';
        case 'request': return '#DC2626';
        case 'donation': return '#059669';
        default: return '#6B7280';
      }
    };

    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: getActivityColor() }]}>
          <MaterialIcons name={getActivityIcon() as any} size={16} color="white" />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
          <Text style={styles.activityDate}>
            {new Date(activity.date).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        {activity.status && (
          <View style={styles.activityStatus}>
            <Text style={styles.activityStatusText}>{activity.status}</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bonjour,</Text>
        <Text style={styles.userName}>{user?.name || 'Donneur'}</Text>
        <Text style={styles.userBloodType}>
          Groupe sanguin: {user?.bloodType || 'Non défini'}
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Demandes totales"
            value={stats.totalRequests}
            icon="bloodtype"
            color="#DC2626"
          />
          <StatCard
            title="Critiques"
            value={stats.criticalRequests}
            icon="emergency"
            color="#EA580C"
          />
          <StatCard
            title="Vos engagements"
            value={stats.yourPledges}
            icon="volunteer-activism"
            color="#3B82F6"
          />
          <StatCard
            title="À proximité"
            value={stats.nearbyRequests}
            icon="location-on"
            color="#059669"
          />
        </View>
      </View>

      {/* Recent Requests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Demandes récentes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {recentRequests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activité récente</Text>
        {recentActivity.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#DC2626',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  welcomeText: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  userBloodType: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  statsSection: {
    padding: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: (width - 60) / 2,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardText: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bloodTypeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodTypeText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 14,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  requestNotes: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadline: {
    fontSize: 12,
    color: '#6B7280',
  },
  unitsNeeded: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activityDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  activityStatusText: {
    fontSize: 10,
    color: '#6B7280',
  },
});
