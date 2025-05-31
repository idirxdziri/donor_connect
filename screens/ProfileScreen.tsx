import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Avatar,
  Button,
  TextInput,
  Switch,
  ActivityIndicator,
  Chip,
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

const REVERSE_BLOOD_GROUP_MAP = {
  "AB+": 1,
  "AB-": 2,
  "A+": 3,
  "A-": 4,
  "B+": 5,
  "B-": 6,
  "O+": 7,
  "O-": 8
};

const CONTACT_METHOD_MAP = {
  1: "Appel téléphonique",
  2: "Message texte",
  3: "Tous les moyens"
};

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  donorBloodGroup?: number;
  donorTel?: string;
  donorContactMethod?: number;
  donorWantToStayAnonymous?: boolean;
  donorExcludedFromPublicPortal?: boolean;
  donorCanDonateNow?: boolean;
  donorLastDonationDate?: string;
  donorDonationCount?: number;
  wilaya?: {
    id: number;
    name: string;
  };
}

const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [wilayas, setWilayas] = useState<{id: number, name: string}[]>([]);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<number | undefined>();
  const [contactMethod, setContactMethod] = useState<number | undefined>();
  const [stayAnonymous, setStayAnonymous] = useState(false);
  const [excludeFromPublic, setExcludeFromPublic] = useState(false);
  const [selectedWilayaId, setSelectedWilayaId] = useState<number | undefined>();

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const fetchProfile = async () => {
    try {
      if (!user?.token) return;

      const profileData = await api.getUserProfile(user.token);
      setProfile(profileData);

      // Update form state
      setFirstName(profileData.firstName || '');
      setLastName(profileData.lastName || '');
      setPhone(profileData.donorTel || '');
      setBloodGroup(profileData.donorBloodGroup);
      setContactMethod(profileData.donorContactMethod);
      setStayAnonymous(profileData.donorWantToStayAnonymous || false);
      setExcludeFromPublic(profileData.donorExcludedFromPublicPortal || false);
      setSelectedWilayaId(profileData.wilaya?.id);

      // Fetch wilayas for selection
      const wilayasData = await api.getWilayas();
      if (wilayasData && Array.isArray(wilayasData)) {
        setWilayas(wilayasData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleSave = async () => {
    if (!user?.token) return;

    setSaving(true);
    try {
      const updateData = {
        firstName,
        lastName,
        donorTel: phone,
        donorBloodGroup: bloodGroup,
        donorContactMethod: contactMethod,
        donorWantToStayAnonymous: stayAnonymous,
        donorExcludedFromPublicPortal: excludeFromPublic,
        wilayaId: selectedWilayaId,
      };

      await api.updateUserProfile(user.token, updateData);

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updateData } : null);

      // Update auth context
      const updatedUser = {
        ...user,
        firstName,
        lastName,
        bloodType: bloodGroup ? BLOOD_GROUP_MAP[bloodGroup as keyof typeof BLOOD_GROUP_MAP] : undefined,
      };
      updateUser(updatedUser);

      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout }
      ]
    );
  };

  const getBadges = (donationCount: number): string[] => {
    const badges = [];
    if (donationCount >= 1) badges.push('Donneur');
    if (donationCount >= 5) badges.push('Généreux');
    if (donationCount >= 10) badges.push('Héros');
    if (donationCount >= 25) badges.push('Légende');
    return badges;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Impossible de charger le profil</Text>
        <Button mode="contained" onPress={fetchProfile}>
          Réessayer
        </Button>
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
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileHeader}>
          <Avatar.Text
            size={80}
            label={`${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile.firstName} {profile.lastName}
            </Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
            {profile.donorBloodGroup && (
              <Chip style={styles.bloodTypeChip} mode="flat">
                {BLOOD_GROUP_MAP[profile.donorBloodGroup as keyof typeof BLOOD_GROUP_MAP]}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Donation Stats */}
      {profile.donorDonationCount !== undefined && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Statistiques de don</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.donorDonationCount}</Text>
                <Text style={styles.statLabel}>Dons effectués</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile.donorLastDonationDate
                    ? new Date(profile.donorLastDonationDate).toLocaleDateString('fr-FR')
                    : 'N/A'
                  }
                </Text>
                <Text style={styles.statLabel}>Dernier don</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile.donorCanDonateNow ? 'Oui' : 'Non'}
                </Text>
                <Text style={styles.statLabel}>Peut donner</Text>
              </View>
            </View>

            {/* Badges */}
            {profile.donorDonationCount > 0 && (
              <View style={styles.badgesContainer}>
                <Text style={styles.badgesTitle}>Badges obtenus:</Text>
                <View style={styles.badges}>
                  {getBadges(profile.donorDonationCount).map((badge, index) => (
                    <Chip key={index} mode="flat" style={styles.badge}>
                      {badge}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Profile Details */}
      <Card style={styles.detailsCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            <Button
              mode={editing ? "outlined" : "contained"}
              onPress={() => editing ? setEditing(false) : setEditing(true)}
              compact
            >
              {editing ? "Annuler" : "Modifier"}
            </Button>
          </View>

          <Divider style={styles.divider} />

          {editing ? (
            // Editing Mode
            <View style={styles.formContainer}>
              <TextInput
                label="Prénom"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Nom"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Téléphone"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Groupe sanguin:</Text>
                <Picker
                  selectedValue={bloodGroup}
                  onValueChange={setBloodGroup}
                  style={styles.picker}
                >
                  <Picker.Item label="Non spécifié" value={undefined} />
                  {Object.entries(BLOOD_GROUP_MAP).map(([value, label]) => (
                    <Picker.Item key={value} label={label} value={parseInt(value)} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Méthode de contact préférée:</Text>
                <Picker
                  selectedValue={contactMethod}
                  onValueChange={setContactMethod}
                  style={styles.picker}
                >
                  <Picker.Item label="Non spécifié" value={undefined} />
                  {Object.entries(CONTACT_METHOD_MAP).map(([value, label]) => (
                    <Picker.Item key={value} label={label} value={parseInt(value)} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Wilaya:</Text>
                <Picker
                  selectedValue={selectedWilayaId}
                  onValueChange={setSelectedWilayaId}
                  style={styles.picker}
                >
                  <Picker.Item label="Non spécifiée" value={undefined} />
                  {wilayas.map((wilaya) => (
                    <Picker.Item key={wilaya.id} label={wilaya.name} value={wilaya.id} />
                  ))}
                </Picker>
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Rester anonyme</Text>
                <Switch value={stayAnonymous} onValueChange={setStayAnonymous} />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Exclure du portail public</Text>
                <Switch value={excludeFromPublic} onValueChange={setExcludeFromPublic} />
              </View>

              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
              >
                Enregistrer
              </Button>
            </View>
          ) : (
            // View Mode
            <View style={styles.viewContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Téléphone:</Text>
                <Text style={styles.detailValue}>{profile.donorTel || 'Non spécifié'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Wilaya:</Text>
                <Text style={styles.detailValue}>{profile.wilaya?.name || 'Non spécifiée'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Méthode de contact:</Text>
                <Text style={styles.detailValue}>
                  {profile.donorContactMethod
                    ? CONTACT_METHOD_MAP[profile.donorContactMethod as keyof typeof CONTACT_METHOD_MAP]
                    : 'Non spécifiée'
                  }
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Anonyme:</Text>
                <Text style={styles.detailValue}>
                  {profile.donorWantToStayAnonymous ? 'Oui' : 'Non'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Exclu du portail public:</Text>
                <Text style={styles.detailValue}>
                  {profile.donorExcludedFromPublicPortal ? 'Oui' : 'Non'}
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Card style={styles.logoutCard}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#f44336"
            icon="logout"
          >
            Se déconnecter
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#d32f2f',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  bloodTypeChip: {
    backgroundColor: '#d32f2f',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    marginTop: 4,
    textAlign: 'center',
  },
  badgesContainer: {
    marginTop: 16,
  },
  badgesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  pickerContainer: {
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    marginTop: 16,
  },
  viewContainer: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  logoutCard: {
    margin: 16,
    elevation: 2,
  },
  logoutButton: {
    paddingVertical: 8,
  },
});

export default ProfileScreen;
