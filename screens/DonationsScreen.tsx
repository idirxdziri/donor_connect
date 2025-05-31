// screens/DonationsScreen.tsx - Donations history screen for mobile app

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
  FlatList,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { BLOOD_GROUP_MAP } from '../types/data';

const { width } = Dimensions.get('window');

// Helper function to safely get blood type display name
const getBloodTypeDisplay = (bloodType: string): string => {
  // If it's already a display name (like "O+", "A-"), return as is
  if (bloodType.includes('+') || bloodType.includes('-')) {
    return bloodType;
  }

  // If it's a numeric key, convert it
  const numericKey = parseInt(bloodType, 10);
  if (!isNaN(numericKey) && numericKey in BLOOD_GROUP_MAP) {
    return BLOOD_GROUP_MAP[numericKey as keyof typeof BLOOD_GROUP_MAP];
  }

  return bloodType;
};

interface Donation {
  id: string;
  date: string;
  hospitalName: string;
  bloodType: string;
  amount: number; // in ml
  status: 'completed' | 'pending' | 'cancelled';
  certificateUrl?: string;
}

export default function DonationsScreen() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalVolume: 0,
    lastDonation: '',
  });

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    if (!user?.token || !user) return;

    try {
      setIsLoading(true);

      // Mock data for now - replace with actual API call
      const mockDonations: Donation[] = [
        {
          id: '1',
          date: '2024-01-15T10:00:00Z',
          hospitalName: 'CHU Mustapha Pacha',
          bloodType: user.bloodType || 'O+',
          amount: 450,
          status: 'completed',
          certificateUrl: 'https://example.com/cert1.pdf',
        },
        {
          id: '2',
          date: '2023-10-20T14:30:00Z',
          hospitalName: 'Hôpital Parnet',
          bloodType: user.bloodType || 'O+',
          amount: 450,
          status: 'completed',
          certificateUrl: 'https://example.com/cert2.pdf',
        },
        {
          id: '3',
          date: '2023-07-05T09:15:00Z',
          hospitalName: 'Centre de Transfusion Sanguine',
          bloodType: user.bloodType || 'O+',
          amount: 450,
          status: 'completed',
          certificateUrl: 'https://example.com/cert3.pdf',
        },
      ];

      setDonations(mockDonations);

      // Calculate stats
      const totalDonations = mockDonations.filter(d => d.status === 'completed').length;
      const totalVolume = mockDonations
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + d.amount, 0);
      const lastDonation = mockDonations.length > 0 ? mockDonations[0].date : '';

      setStats({ totalDonations, totalVolume, lastDonation });

    } catch (error) {
      console.error('Error loading donations:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des dons');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDonations();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981'; // green-500
      case 'pending':
        return '#f59e0b'; // amber-500
      case 'cancelled':
        return '#ef4444'; // red-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const downloadCertificate = (donation: Donation) => {
    if (donation.certificateUrl) {
      Alert.alert(
        'Télécharger le certificat',
        `Télécharger le certificat de don du ${formatDate(donation.date)}?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Télécharger',
            onPress: () => {
              // In a real app, this would open the certificate URL
              Alert.alert('Succès', 'Le certificat a été téléchargé');
            }
          },
        ]
      );
    }
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Historique des dons</Text>
        <Text style={styles.headerSubtitle}>
          Consultez tous vos dons de sang précédents et téléchargez vos certificats.
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <MaterialIcons name="favorite" size={24} color="#dc2626" />
          <Text style={styles.statNumber}>{stats.totalDonations}</Text>
          <Text style={styles.statLabel}>Dons Total</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="local-hospital" size={24} color="#dc2626" />
          <Text style={styles.statNumber}>{stats.totalVolume}ml</Text>
          <Text style={styles.statLabel}>Volume Total</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="access-time" size={24} color="#dc2626" />
          <Text style={styles.statNumber}>
            {stats.lastDonation ? formatDate(stats.lastDonation).split(' ')[0] : '--'}
          </Text>
          <Text style={styles.statLabel}>Dernier Don</Text>
        </View>
      </View>
    </View>
  );

  const renderDonationItem = ({ item }: { item: Donation }) => (
    <View style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <View style={styles.donationInfo}>
          <Text style={styles.donationDate}>{formatDate(item.date)}</Text>
          <Text style={styles.donationHospital}>{item.hospitalName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.donationDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="opacity" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Type: {getBloodTypeDisplay(item.bloodType)}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="local-drink" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Volume: {item.amount}ml</Text>
        </View>
      </View>

      {item.certificateUrl && item.status === 'completed' && (
        <TouchableOpacity
          style={styles.certificateButton}
          onPress={() => downloadCertificate(item)}
        >
          <MaterialIcons name="download" size={16} color="#dc2626" />
          <Text style={styles.certificateButtonText}>Télécharger le certificat</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={48} color="#dc2626" />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderStatsCard()}

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Historique des dons</Text>

        {donations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="local-hospital" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>Aucun don enregistré</Text>
            <Text style={styles.emptyStateSubtext}>
              Vos futurs dons apparaîtront ici
            </Text>
          </View>
        ) : (
          <FlatList
            data={donations}
            renderItem={renderDonationItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScrollView>
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
  statsContainer: {
    margin: 16,
  },
  gradientHeader: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  listContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  donationCard: {
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
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  donationInfo: {
    flex: 1,
  },
  donationDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  donationHospital: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  donationDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  certificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  certificateButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
    marginLeft: 8,
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
});
