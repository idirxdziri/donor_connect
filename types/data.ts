// types/data.ts - Data types for mobile app

export type RequestUrgency = "critical" | "urgent" | "standard" | "low";

export type BloodRequest = {
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
};

export type Donor = {
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
};

export type Hospital = {
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
};

export type BloodGroup = {
  id: number;
  name: string;
};

export type Wilaya = {
  id: number;
  name: string;
};

// Blood Group Mapping
export const BLOOD_GROUP_MAP = {
  1: "AB+",
  2: "AB-",
  3: "A+",
  4: "A-",
  5: "B+",
  6: "B-",
  7: "O+",
  8: "O-",
};

// Contact Method Mapping
export const CONTACT_METHOD_MAP = {
  1: "Appel téléphonique",
  2: "Message texte",
  3: "Tous les moyens",
};

// Priority Mapping
export const PRIORITY_MAP = {
  1: "low",
  2: "standard",
  3: "critical",
};

// Donation Type Mapping
export const DONATION_TYPE_MAP = {
  1: "Sang total",
  2: "Plaquettes",
  3: "Plasma",
};
