import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  Searchbar,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  IconButton,
  Menu,
  Divider,
  TextInput,
  Switch,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

// Blood Group Mapping
const BLOOD_GROUP_MAP = {
  1: "AB+",
  2: "AB-",
  3: "A+",
  4: "A-",
  5: "B+",
  6: "B-",
  7: "O+",
  8: "O-"
};

const BLOOD_TYPE_COMPATIBILITY = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

type RequestUrgency = "critical" | "urgent" | "standard";

interface BloodRequest {
  id: string;
  hospitalName: string;
  hospitalType: "public" | "private" | "clinic";
  bloodType: string;
  bloodGroup?: number;
  urgency: RequestUrgency;
  deadline: string;
  location: string;
  wilayaId?: number;
  distance: number;
  notes: string;
  unitsNeeded: number;
  contactInfo: {
    phone: string;
    email: string;
    contactPerson: string;
  };
}

const RequestsScreen: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [wilayas, setWilayas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');
  const [wilayaFilter, setWilayaFilter] = useState('all');
  const [compatibilityFilter, setCompatibilityFilter] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [pledgeNotes, setPledgeNotes] = useState('');
  const [pledgeLoading, setPledgeLoading] = useState(false);

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const determineUrgency = (deadline: string): RequestUrgency => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 24) return "critical";
    if (hoursUntilDeadline <= 72) return "urgent";
    return "standard";
  };

  const fetchRequests = async () => {
    try {
      const requestsData = user?.token
        ? await api.getAuthenticatedBloodDonationRequests(user.token, 1)
        : await api.getPublicBloodDonationRequests(1);

      if (requestsData && Array.isArray(requestsData)) {
        const mappedRequests: BloodRequest[] = requestsData.map((request, index) => {
          const stableId = request.id || `request-${index}`;
          const bloodGroupString = request.bloodGroup
            ? BLOOD_GROUP_MAP[request.bloodGroup as keyof typeof BLOOD_GROUP_MAP] || "?"
            : "?";

          return {
            id: stableId,
            hospitalName: request.bloodTansfusionCenter?.name || "Hôpital inconnu",
            hospitalType: "public",
            bloodType: bloodGroupString,
            bloodGroup: request.bloodGroup,
            urgency: determineUrgency(request.deadline || ""),
            deadline: request.deadline || "",
            location: request.bloodTansfusionCenter?.wilaya?.name || "Non spécifiée",
            wilayaId: request.bloodTansfusionCenter?.wilaya?.id,
            distance: 0,
            notes: request.notes || "",
            unitsNeeded: request.unitsNeeded || 1,
            contactInfo: {
              phone: request.bloodTansfusionCenter?.tel || "",
              email: request.bloodTansfusionCenter?.email || "",
              contactPerson: request.contactPerson || "Responsable",
            },
          };
        });

        setRequests(mappedRequests);
      }

      // Fetch wilayas
      const wilayasData = await api.getWilayas();
      if (wilayasData && Array.isArray(wilayasData)) {
        const wilayaNames = wilayasData.map(w => w.name || "").filter(Boolean);
        setWilayas(wilayaNames);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Erreur', 'Impossible de charger les demandes de sang');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const getCompatibleBloodTypes = (userBloodType: string): string[] => {
    return BLOOD_TYPE_COMPATIBILITY[userBloodType as keyof typeof BLOOD_TYPE_COMPATIBILITY] || [];
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUrgency = urgencyFilter === 'all' || request.urgency === urgencyFilter;
    const matchesBloodType = bloodTypeFilter === 'all' || request.bloodType === bloodTypeFilter;
    const matchesWilaya = wilayaFilter === 'all' || request.location === wilayaFilter;

    let matchesCompatibility = true;
    if (compatibilityFilter && user?.bloodType) {
      const compatibleTypes = getCompatibleBloodTypes(user.bloodType);
      matchesCompatibility = compatibleTypes.includes(request.bloodType);
    }

    return matchesSearch && matchesUrgency && matchesBloodType && matchesWilaya && matchesCompatibility;
  });

  const handlePledge = async () => {
    if (!selectedRequest || !user?.token) {
      Alert.alert('Erreur', 'Vous devez être connecté pour faire un engagement');
      return;
    }

    setPledgeLoading(true);
    try {
      await api.createPledge(user.token, {
        bloodDonationRequestId: selectedRequest.id,
        pledgeNotes: pledgeNotes
      });

      Alert.alert('Succès', 'Votre engagement a été enregistré avec succès');
      setShowPledgeModal(false);
      setPledgeNotes('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Pledge error:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'enregistrement de l\'engagement');
    } finally {
      setPledgeLoading(false);
    }
  };

  const getUrgencyColor = (urgency: RequestUrgency): string => {
    switch (urgency) {
      case 'critical': return '#f44336';
      case 'urgent': return '#ff9800';
      case 'standard': return '#4caf50';
      default: return '#666';
    }
  };

  const getUrgencyLabel = (urgency: RequestUrgency): string => {
    switch (urgency) {
      case 'critical': return 'Critique';
      case 'urgent': return 'Urgent';
      case 'standard': return 'Standard';
      default: return 'Inconnu';
    }
  };

  const formatDeadline = (deadline: string): string => {
    try {
      const date = new Date(deadline);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Expiré';
      if (diffDays === 0) return 'Aujourd\'hui';
      if (diffDays === 1) return 'Demain';
      return `Dans ${diffDays} jours`;
    } catch {
      return 'Date invalide';
    }
  };

  const renderRequest = ({ item: request }: { item: BloodRequest }) => (
    <Card style={styles.requestCard} mode="outlined">
      <Card.Content>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.hospitalName}>{request.hospitalName}</Text>
            <View style={styles.tagsContainer}>
              <Chip
                mode="flat"
                compact
                style={[styles.urgencyChip, { backgroundColor: getUrgencyColor(request.urgency) }]}
                textStyle={styles.urgencyChipText}
              >
                {getUrgencyLabel(request.urgency)}
              </Chip>
              <Chip mode="flat" compact style={styles.bloodTypeChip}>
                {request.bloodType}
              </Chip>
            </View>
            <Text style={styles.location}>📍 {request.location}</Text>
            <Text style={styles.deadline}>⏰ {formatDeadline(request.deadline)}</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.requestDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Unités nécessaires:</Text>
            <Text style={styles.detailValue}>{request.unitsNeeded}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Contact:</Text>
            <Text style={styles.detailValue}>{request.contactInfo.contactPerson}</Text>
          </View>
        </View>

        {request.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{request.notes}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {user && (
            <Button
              mode="contained"
              onPress={() => {
                setSelectedRequest(request);
                setShowPledgeModal(true);
              }}
              style={styles.pledgeButton}
              icon="heart"
            >
              S'engager à donner
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Chargement des demandes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Demandes de Sang</Text>
        <Text style={styles.subtitle}>
          {filteredRequests.length} demande{filteredRequests.length !== 1 ? 's' : ''} trouvée{filteredRequests.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <Searchbar
        placeholder="Rechercher une demande..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Urgence:</Text>
            <Picker
              selectedValue={urgencyFilter}
              onValueChange={setUrgencyFilter}
              style={styles.picker}
            >
              <Picker.Item label="Toutes" value="all" />
              <Picker.Item label="Critique" value="critical" />
              <Picker.Item label="Urgent" value="urgent" />
              <Picker.Item label="Standard" value="standard" />
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Groupe sanguin:</Text>
            <Picker
              selectedValue={bloodTypeFilter}
              onValueChange={setBloodTypeFilter}
              style={styles.picker}
            >
              <Picker.Item label="Tous" value="all" />
              {bloodTypes.map(type => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Wilaya:</Text>
            <Picker
              selectedValue={wilayaFilter}
              onValueChange={setWilayaFilter}
              style={styles.picker}
            >
              <Picker.Item label="Toutes" value="all" />
              {wilayas.map(wilaya => (
                <Picker.Item key={wilaya} label={wilaya} value={wilaya} />
              ))}
            </Picker>
          </View>

          {user?.bloodType && (
            <View style={styles.compatibilityContainer}>
              <Text style={styles.compatibilityLabel}>
                Compatible avec {user.bloodType}
              </Text>
              <Switch
                value={compatibilityFilter}
                onValueChange={setCompatibilityFilter}
              />
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune demande trouvée</Text>
          </View>
        }
      />

      {/* Pledge Modal */}
      <Modal
        visible={showPledgeModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>S'engager à donner</Text>

            {selectedRequest && (
              <View style={styles.modalRequestInfo}>
                <Text style={styles.modalRequestText}>
                  Hôpital: {selectedRequest.hospitalName}
                </Text>
                <Text style={styles.modalRequestText}>
                  Groupe sanguin: {selectedRequest.bloodType}
                </Text>
                <Text style={styles.modalRequestText}>
                  Unités: {selectedRequest.unitsNeeded}
                </Text>
              </View>
            )}

            <TextInput
              label="Notes (optionnel)"
              value={pledgeNotes}
              onChangeText={setPledgeNotes}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowPledgeModal(false);
                  setPledgeNotes('');
                  setSelectedRequest(null);
                }}
                style={styles.modalButton}
              >
                Annuler
              </Button>
              <Button
                mode="contained"
                onPress={handlePledge}
                loading={pledgeLoading}
                disabled={pledgeLoading}
                style={styles.modalButton}
              >
                Confirmer
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  compatibilityContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  compatibilityLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    marginBottom: 16,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requestInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  urgencyChip: {
    marginRight: 8,
  },
  urgencyChipText: {
    color: '#fff',
  },
  bloodTypeChip: {
    backgroundColor: '#d32f2f',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deadline: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 16,
  },
  requestDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pledgeButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#d32f2f',
  },
  modalRequestInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  modalRequestText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  notesInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default RequestsScreen;
