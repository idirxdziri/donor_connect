import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
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
  Badge,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface Hospital {
  id: string;
  name: string;
  type: "public" | "private" | "clinic";
  wilaya: string;
  address: string;
  phone: string;
  email: string;
  openHours: string;
  activeRequests: number;
  totalRequests: number;
  bloodBankCapacity: number;
  specialties: string[];
  loggedUserSubscribed?: boolean;
}

const HospitalsScreen: React.FC = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [wilayas, setWilayas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('all');
  const [subscribedCenters, setSubscribedCenters] = useState<{id: string, bloodTansfusionCenterId: string}[]>([]);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});

  const determineHospitalType = (name: string): "public" | "private" | "clinic" => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('chu') || lowerName.includes('hopital') || lowerName.includes('hôpital')) {
      return 'public';
    } else if (lowerName.includes('clinique')) {
      return 'clinic';
    }
    return 'private';
  };

  const fetchHospitals = async () => {
    try {
      const centersData = await api.getBloodTansfusionCentersDirectAuthenticated(user?.token as string);

      if (centersData && Array.isArray(centersData)) {
        const mappedHospitals: Hospital[] = centersData.map((center) => ({
          id: center.id || "",
          name: center.name || "",
          type: determineHospitalType(center.name || ""),
          wilaya: center.wilaya?.name || "",
          address: center.address || "",
          phone: center.tel || "",
          email: center.email || "",
          openHours: "24h/24, 7j/7",
          activeRequests: center.bloodDonationRequests?.filter((req: { evolutionStatus: number }) => req.evolutionStatus !== 3).length || 0,
          totalRequests: center.bloodDonationRequests?.length || 0,
          bloodBankCapacity: 500,
          specialties: ["Transfusion sanguine"],
          loggedUserSubscribed: center.loggedUserSubscribed || false
        }));

        setHospitals(mappedHospitals);
      }

      // Fetch wilayas
      const wilayasData = await api.getWilayas();
      if (wilayasData && Array.isArray(wilayasData)) {
        const wilayaNames = wilayasData.map(w => w.name || "").filter(Boolean);
        setWilayas(wilayaNames);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des hôpitaux');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHospitals();
  };

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hospital.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWilaya = wilayaFilter === 'all' || hospital.wilaya === wilayaFilter;

    return matchesSearch && matchesWilaya;
  });

  const handleSubscription = async (hospital: Hospital) => {
    if (!user?.token) {
      Alert.alert('Erreur', 'Vous devez être connecté pour vous abonner');
      return;
    }

    try {
      if (hospital.loggedUserSubscribed) {
        await api.unsubscribeFromBloodTansfusionCenter(user.token, hospital.id);
        Alert.alert('Succès', 'Désabonnement réussi');
      } else {
        await api.subscribeToBloodTansfusionCenter(user.token, hospital.id);
        Alert.alert('Succès', 'Abonnement réussi');
      }

      // Update the hospital's subscription status
      setHospitals(prev => prev.map(h =>
        h.id === hospital.id
          ? { ...h, loggedUserSubscribed: !h.loggedUserSubscribed }
          : h
      ));
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Erreur', 'Erreur lors de la gestion de l\'abonnement');
    }
  };

  const handleContact = (hospital: Hospital, method: 'phone' | 'email') => {
    if (method === 'phone' && hospital.phone) {
      Linking.openURL(`tel:${hospital.phone}`);
    } else if (method === 'email' && hospital.email) {
      Linking.openURL(`mailto:${hospital.email}`);
    }
  };

  const toggleMenu = (hospitalId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [hospitalId]: !prev[hospitalId]
    }));
  };

  const getHospitalTypeColor = (type: "public" | "private" | "clinic"): string => {
    switch (type) {
      case 'public': return '#4caf50';
      case 'private': return '#2196f3';
      case 'clinic': return '#ff9800';
      default: return '#666';
    }
  };

  const getHospitalTypeLabel = (type: "public" | "private" | "clinic"): string => {
    switch (type) {
      case 'public': return 'Public';
      case 'private': return 'Privé';
      case 'clinic': return 'Clinique';
      default: return 'Autre';
    }
  };

  const renderHospital = ({ item: hospital }: { item: Hospital }) => (
    <Card style={styles.hospitalCard} mode="outlined">
      <Card.Content>
        <View style={styles.hospitalHeader}>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalName}>{hospital.name}</Text>
            <View style={styles.typeContainer}>
              <Chip
                mode="flat"
                compact
                style={[styles.typeChip, { backgroundColor: getHospitalTypeColor(hospital.type) }]}
                textStyle={styles.typeChipText}
              >
                {getHospitalTypeLabel(hospital.type)}
              </Chip>
              {hospital.loggedUserSubscribed && (
                <Chip
                  mode="flat"
                  compact
                  style={[styles.chip, styles.subscribedChip]}
                  textStyle={styles.subscribedText}
                >
                  Abonné
                </Chip>
              )}
            </View>
            <Text style={styles.location}>📍 {hospital.wilaya}</Text>
            <Text style={styles.address}>{hospital.address}</Text>
          </View>
          <Menu
            visible={menuVisible[hospital.id] || false}
            onDismiss={() => toggleMenu(hospital.id)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => toggleMenu(hospital.id)}
              />
            }
          >
            {hospital.phone && (
              <Menu.Item
                onPress={() => {
                  toggleMenu(hospital.id);
                  handleContact(hospital, 'phone');
                }}
                title="Appeler"
                leadingIcon="phone"
              />
            )}
            {hospital.email && (
              <Menu.Item
                onPress={() => {
                  toggleMenu(hospital.id);
                  handleContact(hospital, 'email');
                }}
                title="Email"
                leadingIcon="email"
              />
            )}
          </Menu>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.hospitalStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hospital.activeRequests}</Text>
            <Text style={styles.statLabel}>Demandes actives</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hospital.totalRequests}</Text>
            <Text style={styles.statLabel}>Total demandes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hospital.bloodBankCapacity}</Text>
            <Text style={styles.statLabel}>Capacité</Text>
          </View>
        </View>

        <View style={styles.specialtiesContainer}>
          {hospital.specialties.map((specialty, index) => (
            <Chip key={index} mode="flat" compact style={styles.specialtyChip}>
              {specialty}
            </Chip>
          ))}
        </View>

        <Text style={styles.openHours}>⏰ {hospital.openHours}</Text>

        <View style={styles.actionButtons}>
          {user && (
            <Button
              mode={hospital.loggedUserSubscribed ? "outlined" : "contained"}
              onPress={() => handleSubscription(hospital)}
              style={styles.subscribeButton}
              icon={hospital.loggedUserSubscribed ? "bell-off" : "bell"}
            >
              {hospital.loggedUserSubscribed ? "Se désabonner" : "S'abonner"}
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
        <Text style={styles.loadingText}>Chargement des hôpitaux...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Centres de Transfusion</Text>
        <Text style={styles.subtitle}>
          {filteredHospitals.length} centre{filteredHospitals.length !== 1 ? 's' : ''} trouvé{filteredHospitals.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <Searchbar
        placeholder="Rechercher un centre..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.filtersContainer}>
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
      </View>

      <FlatList
        data={filteredHospitals}
        renderItem={renderHospital}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun centre trouvé</Text>
          </View>
        }
      />
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
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
  },
  hospitalCard: {
    marginBottom: 16,
    elevation: 2,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  typeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  typeChip: {
    marginRight: 8,
  },
  typeChipText: {
    color: '#fff',
  },
  chip: {
    marginRight: 4,
  },
  subscribedChip: {
    backgroundColor: '#4caf50',
  },
  subscribedText: {
    color: '#fff',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  address: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    marginVertical: 16,
  },
  hospitalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialtyChip: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
  },
  openHours: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  subscribeButton: {
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
});

export default HospitalsScreen;
