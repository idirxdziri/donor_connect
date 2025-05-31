// screens/PledgesScreen.tsx - Pledges management screen for mobile app

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
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

  return bloodType; // fallback to original value
};

type PledgeStatus = 'active' | 'completed' | 'cancelled';

interface Pledge {
  id: string;
  requestId: string;
  hospitalName: string;
  bloodType: string;
  urgency: 'critical' | 'urgent' | 'normal';
  appointmentDate: string;
  appointmentTime: string;
  location: string;
  contactPhone: string;
  status: PledgeStatus;
  createdAt: string;
  notes?: string;
}

interface NewPledgeData {
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
}

export default function PledgesScreen() {
  const { user } = useAuth();
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
  const [rescheduleData, setRescheduleData] = useState<NewPledgeData>({
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  });

  useEffect(() => {
    loadPledges();
  }, []);

  const loadPledges = async () => {
    if (!user?.token || !user) return;

    try {
      setIsLoading(true);

      // Mock data for pledges
      const mockPledges: Pledge[] = [
        {
          id: '1',
          requestId: 'req1',
          hospitalName: 'CHU Mustapha Pacha',
          bloodType: 'O+',
          urgency: 'critical',
          appointmentDate: '2024-02-15',
          appointmentTime: '10:00',
          location: 'Service de Transfusion, Bloc A',
          contactPhone: '+213 21 23 35 50',
          status: 'active',
          createdAt: '2024-02-10T14:30:00Z',
          notes: 'Besoin urgent pour patient en chirurgie',
        },
        {
          id: '2',
          requestId: 'req2',
          hospitalName: 'Hôpital Parnet',
          bloodType: 'A+',
          urgency: 'urgent',
          appointmentDate: '2024-02-20',
          appointmentTime: '14:30',
          location: 'Centre de Prélèvement',
          contactPhone: '+213 21 65 78 90',
          status: 'active',
          createdAt: '2024-02-08T09:15:00Z',
        },
        {
          id: '3',
          requestId: 'req3',
          hospitalName: 'Centre de Transfusion Sanguine',
          bloodType: 'O+',
          urgency: 'normal',
          appointmentDate: '2024-01-25',
          appointmentTime: '11:00',
          location: 'Salle de Don',
          contactPhone: '+213 21 45 67 89',
          status: 'completed',
          createdAt: '2024-01-20T16:45:00Z',
        },
      ];

      setPledges(mockPledges);

    } catch (error) {
      console.error('Error loading pledges:', error);
      Alert.alert('Erreur', 'Impossible de charger les engagements');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPledges();
    setRefreshing(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return '#dc2626'; // red-600
      case 'urgent':
        return '#f59e0b'; // amber-500
      case 'normal':
        return '#10b981'; // green-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'Critique';
      case 'urgent':
        return 'Urgent';
      case 'normal':
        return 'Normal';
      default:
        return urgency;
    }
  };

  const getStatusColor = (status: PledgeStatus) => {
    switch (status) {
      case 'active':
        return '#3b82f6'; // blue-500
      case 'completed':
        return '#10b981'; // green-500
      case 'cancelled':
        return '#ef4444'; // red-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getStatusText = (status: PledgeStatus) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const confirmPledge = (pledge: Pledge) => {
    Alert.alert(
      'Confirmer le don',
      `Confirmer votre présence pour le don prévu le ${formatDate(pledge.appointmentDate)} à ${formatTime(pledge.appointmentTime)}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            setPledges(prev =>
              prev.map(p =>
                p.id === pledge.id ? { ...p, status: 'completed' } : p
              )
            );
            Alert.alert('Succès', 'Don confirmé avec succès!');
          },
        },
      ]
    );
  };

  const cancelPledge = (pledge: Pledge) => {
    Alert.alert(
      'Annuler l\'engagement',
      'Êtes-vous sûr de vouloir annuler cet engagement de don?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            setPledges(prev =>
              prev.map(p =>
                p.id === pledge.id ? { ...p, status: 'cancelled' } : p
              )
            );
            Alert.alert('Engagement annulé', 'Votre engagement a été annulé.');
          },
        },
      ]
    );
  };

  const rescheduleApiointment = (pledge: Pledge) => {
    setSelectedPledge(pledge);
    setRescheduleData({
      appointmentDate: pledge.appointmentDate,
      appointmentTime: pledge.appointmentTime,
      notes: pledge.notes || '',
    });
    setShowRescheduleModal(true);
  };

  const submitReschedule = () => {
    if (!selectedPledge) return;

    if (!rescheduleData.appointmentDate || !rescheduleData.appointmentTime) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setPledges(prev =>
      prev.map(p =>
        p.id === selectedPledge.id
          ? {
              ...p,
              appointmentDate: rescheduleData.appointmentDate,
              appointmentTime: rescheduleData.appointmentTime,
              notes: rescheduleData.notes,
            }
          : p
      )
    );

    setShowRescheduleModal(false);
    setSelectedPledge(null);
    Alert.alert('Succès', 'Rendez-vous reprogrammé avec succès!');
  };

  const contactHospital = (phone: string) => {
    Alert.alert(
      'Contacter l\'hôpital',
      `Appeler le ${phone}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appeler',
          onPress: () => {
            // In a real app, this would open the phone app
            Alert.alert('Action', `Appel vers ${phone}`);
          },
        },
      ]
    );
  };

  const renderPledgeItem = ({ item }: { item: Pledge }) => (
    <View style={styles.pledgeCard}>
      <View style={styles.pledgeHeader}>
        <View style={styles.pledgeInfo}>
          <Text style={styles.hospitalName}>{item.hospitalName}</Text>
          <Text style={styles.pledgeDate}>
            {formatDate(item.appointmentDate)} à {formatTime(item.appointmentTime)}
          </Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
            <Text style={styles.badgeText}>{getUrgencyText(item.urgency)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.pledgeDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="opacity" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Type: {getBloodTypeDisplay(item.bloodType)}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.contactPhone}</Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      {item.status === 'active' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => confirmPledge(item)}
          >
            <MaterialIcons name="check" size={16} color="white" />
            <Text style={styles.confirmButtonText}>Confirmer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={() => rescheduleApiointment(item)}
          >
            <MaterialIcons name="schedule" size={16} color="#3b82f6" />
            <Text style={styles.rescheduleButtonText}>Reprogrammer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.contactButton]}
            onPress={() => contactHospital(item.contactPhone)}
          >
            <MaterialIcons name="phone" size={16} color="#f59e0b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => cancelPledge(item)}
          >
            <MaterialIcons name="close" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const filterPledgesByStatus = (status: PledgeStatus) => {
    return pledges.filter(pledge => pledge.status === status);
  };

  const renderTabContent = () => {
    const filteredPledges = filterPledgesByStatus(activeTab);

    if (filteredPledges.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="assignment" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>
            {activeTab === 'active' && 'Aucun engagement actif'}
            {activeTab === 'completed' && 'Aucun don terminé'}
            {activeTab === 'cancelled' && 'Aucun engagement annulé'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {activeTab === 'active' && 'Vos futurs engagements apparaîtront ici'}
            {activeTab === 'completed' && 'Vos dons terminés apparaîtront ici'}
            {activeTab === 'cancelled' && 'Vos engagements annulés apparaîtront ici'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredPledges}
        renderItem={renderPledgeItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={48} color="#dc2626" />
        <Text style={styles.loadingText}>Chargement des engagements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.gradientHeader}>
          <Text style={styles.headerTitle}>Mes engagements</Text>
          <Text style={styles.headerSubtitle}>
            Gérez vos rendez-vous de don de sang et suivez leur statut
          </Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Actifs ({filterPledgesByStatus('active').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Terminés ({filterPledgesByStatus('completed').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
            Annulés ({filterPledgesByStatus('cancelled').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {renderTabContent()}
        </View>
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reprogrammer le rendez-vous</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowRescheduleModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date du rendez-vous *</Text>
                <TextInput
                  style={styles.input}
                  value={rescheduleData.appointmentDate}
                  onChangeText={(text) => setRescheduleData(prev => ({ ...prev, appointmentDate: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Heure du rendez-vous *</Text>
                <TextInput
                  style={styles.input}
                  value={rescheduleData.appointmentTime}
                  onChangeText={(text) => setRescheduleData(prev => ({ ...prev, appointmentTime: text }))}
                  placeholder="HH:MM"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (optionnel)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={rescheduleData.notes}
                  onChangeText={(text) => setRescheduleData(prev => ({ ...prev, notes: text }))}
                  placeholder="Ajoutez des notes..."
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRescheduleModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={submitReschedule}
              >
                <Text style={styles.modalConfirmText}>Reprogrammer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    margin: 16,
  },
  gradientHeader: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 24,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#dc2626',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  pledgeCard: {
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
  pledgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pledgeInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pledgeDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  badges: {
    alignItems: 'flex-end',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  pledgeDetails: {
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
  notesSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  rescheduleButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  rescheduleButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginLeft: 4,
  },
  contactButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    flex: 0.5,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
    flex: 0.5,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width - 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  modalConfirmButton: {
    backgroundColor: '#dc2626',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});
