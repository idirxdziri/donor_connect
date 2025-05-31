// types/auth.ts - Authentication types for mobile app

export type NotificationSettings = {
  enableNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  subscribedHospitals: string[];
};

export type PrivacySettings = {
  showOnPublicList: boolean;
  isAnonymous: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  token: string;
  bloodType?: string;
  wilaya?: string;

  // Donor specific fields
  donorCorrelationId?: string;
  donorWantToStayAnonymous?: boolean;
  donorExcludeFromPublicPortal?: boolean;
  donorAvailability?: number;
  donorContactMethod?: number;
  donorName?: string;
  donorBirthDate?: string;
  donorBloodGroup?: number;
  donorNIN?: string;
  donorTel?: string;
  donorNotesForBTC?: string;
  donorLastDonationDate?: string;
  communeId?: number;

  notificationPreferences?: NotificationSettings;
  privacySettings?: PrivacySettings;
} | null;

export type AuthContextType = {
  user: User;
  setUser: (user: User) => void;
  updateUser: (updatedData: Partial<NonNullable<User>>) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  bloodType: string;
  wilaya: string;
  lastDonation?: string;
};
