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
  Avatar,
  Chip,
  Button,
  ActivityIndicator,
  IconButton,
  Badge,
  Menu,
  Divider,
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

// Contact Method Mapping
const CONTACT_METHOD_MAP = {
  1: "Appel téléphonique",
  2: "Message texte",
  3: "Tous les moyens"
};

interface Donor {
  id: string;
  name: string;
  bloodType: string;
  wilaya: string;
  lastDonation: string | null;
  totalDonations: number;
  isEligible: boolean;
  badges: string[];
  avatar?: string;
  contactInfo: {
    email: string;
    phone: string;
    contactMethod?: number;
  };
  privacySettings: {
    isAnonymous: boolean;
    showOnPublicList: boolean;
  };
}

const DonorsScreen: React.FC = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [wilayas, setWilayas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');
  const [wilayaFilter, setWilayaFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const getBadges = (donationCount: number): string[] => {
    const badges = [];
    if (donationCount >= 1) badges.push('Donneur');
    if (donationCount >= 5) badges.push('Généreux');
    if (donationCount >= 10) badges.push('Héros');
    if (donationCount >= 25) badges.push('Légende');
    return badges;
  };

  const fetchDonors = async () => {
    try {
      const donorsData = user?.token
        ? await api.getAllNonAnonymousDonors(user.token, 2)
        : await api.getPublicNonAnonymousDonors(1);

      if (donorsData && Array.isArray(donorsData)) {
        const mappedDonors: Donor[] = donorsData.map((donor, index) => {
          const stableId = donor.id || `donor-${donor.username || ''}${donor.email || ''}${index}`;
          const bloodGroupString = donor.donorBloodGroup
            ? BLOOD_GROUP_MAP[donor.donorBloodGroup as keyof typeof BLOOD_GROUP_MAP] || "?"
            : "?";

          return {
            id: stableId,
            name: donor.firstName && donor.lastName
              ? `${donor.firstName} ${donor.lastName}`
              : donor.username || "Donneur anonyme",
            bloodType: bloodGroupString,
            wilaya: donor.wilaya?.name || "Non spécifiée",
            lastDonation: donor.donorLastDonationDate || null,
            totalDonations: donor.donorDonationCount || 0,
            isEligible: donor.donorCanDonateNow || false,
            badges: getBadges(donor.donorDonationCount || 0),
            avatar: donor.profilePictureUrl || undefined,
            contactInfo: {
              email: donor.email || "",
              phone: donor.donorTel || "",
              contactMethod: donor.donorContactMethod || null,
            },
            privacySettings: {
              isAnonymous: donor.donorWantToStayAnonymous || false,
              showOnPublicList: !donor.donorExcludedFromPublicPortal,
            },
          };
        });

        setDonors(mappedDonors);
      }

      // Fetch wilayas
      const wilayasData = await api.getWilayas();
      if (wilayasData && Array.isArray(wilayasData)) {
        const wilayaNames = wilayasData.map(w => w.name || "").filter(Boolean);
        setWilayas(wilayaNames);
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des donneurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDonors();
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         donor.wilaya.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBloodType = bloodTypeFilter === 'all' || donor.bloodType === bloodTypeFilter;
    const matchesWilaya = wilayaFilter === 'all' || donor.wilaya === wilayaFilter;

    return matchesSearch && matchesBloodType && matchesWilaya;
  });

  const handleContact = (donor: Donor, method: 'phone' | 'email') => {
    if (method === 'phone' && donor.contactInfo.phone) {
      Linking.openURL(`tel:${donor.contactInfo.phone}`);
    } else if (method === 'email' && donor.contactInfo.email) {
      Linking.openURL(`mailto:${donor.contactInfo.email}`);
    }
  };

  const toggleMenu = (donorId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [donorId]: !prev[donorId]
    }));
  };

  const renderDonor = ({ item: donor }: { item: Donor }) => (
    <Card style={styles.donorCard} mode="outlined">
      <Card.Content>
        <View style={styles.donorHeader}>
          <Avatar.Text
            size={60}
            label={donor.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: '#c2185b' }}
          />
          <View style={styles.donorInfo}>
            <Text style={styles.donorName}>{donor.name}</Text>
            <View style={styles.bloodTypeContainer}>
              <Chip mode="flat" compact style={styles.bloodTypeChip}>
                {donor.bloodType}
              </Chip>
              {donor.isEligible && (
                <Chip
                  mode="flat"
                  compact
                  style={[styles.chip, styles.eligibleChip]}
                  textStyle={styles.eligibleText}
                >
                  Éligible
                </Chip>
              )}
            </View>
            <Text style={styles.location}>📍 {donor.wilaya}</Text>
          </View>
          <Menu
            visible={menuVisible[donor.id] || false}
            onDismiss={() => toggleMenu(donor.id)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => toggleMenu(donor.id)}
              />
            }
          >
            {donor.contactInfo.phone && (
              <Menu.Item
                onPress={() => {
                  toggleMenu(donor.id);
                  handleContact(donor, 'phone');
                }}
                title="Appeler"
                leadingIcon="phone"
              />
            )}
            {donor.contactInfo.email && (
              <Menu.Item
                onPress={() => {
                  toggleMenu(donor.id);
                  handleContact(donor, 'email');
                }}
                title="Email"
                leadingIcon="email"
              />
            )}
          </Menu>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.donorStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{donor.totalDonations}</Text>
            <Text style={styles.statLabel}>Dons</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {donor.lastDonation
                ? new Date(donor.lastDonation).toLocaleDateString('fr-FR')
                : 'N/A'
              }
            </Text>
            <Text style={styles.statLabel}>Dernier don</Text>
          </View>
        </View>

        {donor.badges.length > 0 && (
          <View style={styles.badgesContainer}>
            {donor.badges.map((badge, index) => (
              <Chip key={index} mode="flat" compact style={styles.badge}>
                {badge}
              </Chip>
            ))}
          </View>
        )}

        {donor.contactInfo.contactMethod && (
          <Text style={styles.contactMethod}>
            Préférence de contact: {CONTACT_METHOD_MAP[donor.contactInfo.contactMethod as keyof typeof CONTACT_METHOD_MAP]}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Chargement des donneurs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Donneurs de Sang</Text>
        <Text style={styles.subtitle}>
          {filteredDonors.length} donneur{filteredDonors.length !== 1 ? 's' : ''} trouvé{filteredDonors.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <Searchbar
        placeholder="Rechercher un donneur..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.filtersContainer}>
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
        data={filteredDonors}
        renderItem={renderDonor}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun donneur trouvé</Text>
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 8,
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
  donorCard: {
    marginBottom: 16,
    elevation: 2,
  },
  donorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  donorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bloodTypeChip: {
    backgroundColor: '#d32f2f',
    marginRight: 8,
  },
  chip: {
    marginRight: 4,
  },
  eligibleChip: {
    backgroundColor: '#4caf50',
  },
  eligibleText: {
    color: '#fff',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  donorStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  badge: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
  },
  contactMethod: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
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

export default DonorsScreen;
