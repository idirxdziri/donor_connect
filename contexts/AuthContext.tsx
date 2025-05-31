
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi } from '../services/api';
import { userStorage } from '../services/storage';
import { User, AuthContextType, RegisterData } from '../types/auth';
import { BLOOD_GROUP_MAP } from '../types/data';

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  updateUser: async () => {},
  logout: () => {},
  isLoading: true,
  login: async () => {},
  register: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to map numeric blood group to string
  const mapBloodGroupToString = (bloodGroupId: number): string => {
    const BLOOD_GROUP_MAP_TYPED: Record<number, string> = {
      1: "AB+",
      2: "AB-",
      3: "A+",
      4: "A-",
      5: "B+",
      6: "B-",
      7: "O+",
      8: "O-"
    };
    return BLOOD_GROUP_MAP_TYPED[bloodGroupId] || "Inconnu";
  };

  // Check for stored user data on app start
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUser = await userStorage.getUser();
        if (storedUser) {
          setUser(storedUser);

          // Optionally fetch fresh user data from API
          if (storedUser.token) {
            try {
              await fetchUserData(storedUser.id, storedUser.token);
            } catch (error) {
              console.warn('Failed to fetch fresh user data:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        await userStorage.removeUser();
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  // Function to fetch complete user data from API
  const fetchUserData = async (userId: string, token: string) => {
    try {
      const response = await userApi.getUserProfile(token, userId);

      if (response?.user) {
        const userData = response.user;

        const completeUser: User = {
          id: userData.donorCorrelationId || userId,
          name: userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData.username || "Utilisateur",
          email: userData.email || "",
          token: token,
          bloodType: userData.donorBloodGroup
            ? mapBloodGroupToString(userData.donorBloodGroup)
            : undefined,
          donorBloodGroup: userData.donorBloodGroup || undefined,
          wilaya: undefined,

          // Map all donor fields from the API response
          donorCorrelationId: userData.donorCorrelationId || undefined,
          donorWantToStayAnonymous: userData.donorWantToStayAnonymous || false,
          donorExcludeFromPublicPortal: userData.donorExcludeFromPublicPortal || false,
          donorAvailability: userData.donorAvailability || undefined,
          donorContactMethod: userData.donorContactMethod || undefined,
          donorName: userData.donorName || undefined,
          donorBirthDate: userData.donorBirthDate ? new Date(userData.donorBirthDate).toISOString() : undefined,
          donorNIN: userData.donorNIN || undefined,
          donorTel: userData.donorTel || undefined,
          donorNotesForBTC: userData.donorNotesForBTC || undefined,
          donorLastDonationDate: userData.donorLastDonationDate ? new Date(userData.donorLastDonationDate).toISOString() : undefined,
          communeId: userData.communeId || undefined,
          notificationPreferences: {
            enableNotifications: true,
            emailNotifications: true,
            smsNotifications: true,
            subscribedHospitals: []
          },
          privacySettings: {
            showOnPublicList: !userData.donorExcludeFromPublicPortal,
            isAnonymous: userData.donorWantToStayAnonymous || false
          }
        };

        setUser(completeUser);
        await userStorage.saveUser(completeUser);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log("[AUTH] Attempting login with:", email);

      const response = await authApi.login(email, password);

      console.log("[AUTH] Login successful, processing user data");

      // Map blood group to string representation
      const userData = response.userData || {};
      const bloodType = userData?.donorBloodGroup
        ? mapBloodGroupToString(userData.donorBloodGroup)
        : undefined;

      // Create a complete user object directly from login response
      const completeUser: User = {
        id: response.userId,
        name: userData?.donorName || email.split('@')[0],
        email,
        token: response.token,
        bloodType,
        donorCorrelationId: userData?.donorCorrelationId,
        donorWantToStayAnonymous: userData?.donorWantToStayAnonymous || false,
        donorExcludeFromPublicPortal: userData?.donorExcludeFromPublicPortal || false,
        donorAvailability: userData?.donorAvailability,
        donorContactMethod: userData?.donorContactMethod,
        donorName: userData?.donorName,
        donorBirthDate: userData?.donorBirthDate,
        donorBloodGroup: userData?.donorBloodGroup,
        donorNIN: userData?.donorNIN,
        donorTel: userData?.donorTel,
        donorNotesForBTC: userData?.donorNotesForBTC,
        donorLastDonationDate: userData?.donorLastDonationDate,
        communeId: userData?.communeId,
        notificationPreferences: {
          enableNotifications: true,
          emailNotifications: true,
          smsNotifications: true,
          subscribedHospitals: []
        },
        privacySettings: {
          showOnPublicList: !userData?.donorExcludeFromPublicPortal,
          isAnonymous: userData?.donorWantToStayAnonymous || false
        },
        wilaya: userData?.wilaya?.name,
      };

      setUser(completeUser);
      await userStorage.saveUser(completeUser);

      console.log("[AUTH] User data processed and stored");

    } catch (error) {
      console.error("[AUTH] Login failed:", error);
      throw new Error("Identifiants invalides. Veuillez réessayer.");
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      console.log("[AUTH] Attempting registration");

      await authApi.register(userData);

      // After successful registration, log the user in
      await login(userData.email, userData.password);

      console.log("[AUTH] Registration and login successful");

    } catch (error) {
      console.error("[AUTH] Registration failed:", error);
      throw new Error("L'inscription a échoué. Veuillez réessayer.");
    }
  };

  const updateUser = async (updatedUserData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedUserData };
      setUser(updatedUser);
      await userStorage.saveUser(updatedUser);
    }
  };

  const logout = async () => {
    console.log("[AUTH] Starting logout process");
    try {
      setUser(null);
      await userStorage.removeUser();
      console.log("[AUTH] Logout completed successfully");
    } catch (error) {
      console.error("[AUTH] Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      updateUser,
      logout,
      isLoading,
      login,
      register
    }}>
      {children}
    </AuthContext.Provider>
  );
};
