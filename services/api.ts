// services/api.ts - API service for mobile app that mirrors Next.js implementation

// Import the same API configuration from the Next.js app
export const API_BASE_URL = "https://localhost:57679";

// Basic API error handling
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper to make authenticated requests
async function makeRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Add any existing headers from options
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    // Clean token if it has Bearer prefix
    const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
    headers.Authorization = `Bearer ${cleanToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Authentication API - mirrors Next.js auth-service.ts with CORS handling
export const authApi = {
  async login(email: string, password: string) {
    console.log("[MOBILE AUTH API] Attempting login with:", email);

    try {
      // For mobile apps, try a CORS-friendly approach first
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[MOBILE AUTH API] Login failed:",
          response.status,
          errorText
        );
        throw new ApiError(
          response.status,
          errorText || `Login failed with status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("[MOBILE AUTH API] Raw login response:", data);

      // Return the properly structured response matching Next.js format
      return {
        token: data.jwToken,
        userData: data.userDTO || null,
        userId: data.userId || extractUserIdFromToken(data.jwToken),
      };
    } catch (error) {
      console.error("[MOBILE AUTH API] Login error:", error);

      // If it's a CORS error, provide helpful message
      if (
        error instanceof Error &&
        (error.message.includes("CORS") || error.message.includes("fetch"))
      ) {
        throw new ApiError(
          500,
          "Authentication failed due to CORS policy. Please ensure the backend has proper CORS configuration for auth endpoints."
        );
      }

      throw error;
    }
  },

  async register(userData: any) {
    console.log("[MOBILE AUTH API] Attempting registration");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[MOBILE AUTH API] Registration failed:",
          response.status,
          errorText
        );
        throw new ApiError(
          response.status,
          errorText || `Registration failed with status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("[MOBILE AUTH API] Registration successful:", data);
      return data;
    } catch (error) {
      console.error("[MOBILE AUTH API] Registration error:", error);

      // If it's a CORS error, provide helpful message
      if (
        error instanceof Error &&
        (error.message.includes("CORS") || error.message.includes("fetch"))
      ) {
        throw new ApiError(
          500,
          "Registration failed due to CORS policy. Please ensure the backend has proper CORS configuration for auth endpoints."
        );
      }

      throw error;
    }
  },
};

// Helper function to extract user ID from JWT token (matching Next.js implementation)
function extractUserIdFromToken(token: string): string {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    return payload.UserId || payload.nameid || payload.sub || "unknown-user";
  } catch (error) {
    console.error(
      "[MOBILE AUTH API] Error extracting user ID from token:",
      error
    );
    return "unknown-user";
  }
}

// Blood Donation Requests API - mirrors blood-donation-requests-service.ts
export const requestsApi = {
  async getPublicBloodDonationRequests(level: number = 1) {
    try {
      console.log(
        `[MOBILE REQUESTS API] Fetching public blood donation requests with level: ${level}`
      );

      // Use the working direct endpoint
      const response = await fetch(`${API_BASE_URL}/BloodDonationRequests`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data?.bloodDonationRequests || data || [];
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error(
        "[MOBILE REQUESTS API] Error fetching public requests:",
        error
      );
      return [];
    }
  },

  async getAuthenticatedBloodDonationRequests(
    token: string,
    level: number = 1
  ) {
    try {
      console.log(
        `[MOBILE REQUESTS API] Fetching authenticated blood donation requests with level: ${level}`
      );

      const cleanToken = token.startsWith("Bearer ")
        ? token.substring(7)
        : token;
      const response = await fetch(`${API_BASE_URL}/BloodDonationRequests`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data?.bloodDonationRequests || data || [];
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error(
        "[MOBILE REQUESTS API] Error fetching authenticated requests:",
        error
      );
      return [];
    }
  },

  async getSubscribedHospitalRequests(token: string) {
    return makeRequest("/BloodDonationRequests/subscribed", {}, token);
  },

  async getMatchingBloodTypeRequests(token: string) {
    return makeRequest("/BloodDonationRequests/matching", {}, token);
  },

  async getRequestsByBloodTransfusionCenter(btcId: string, token?: string) {
    return makeRequest(`/BTC/${btcId}/bloodDonationRequests`, {}, token);
  },

  async getNearbyRequests(token: string, radius: number = 10) {
    return makeRequest(
      `/BloodDonationRequests/nearby?radius=${radius}`,
      {},
      token
    );
  },

  async createBloodDonationRequest(token: string, requestData: any) {
    return makeRequest(
      "/BloodDonationRequests",
      {
        method: "POST",
        body: JSON.stringify(requestData),
      },
      token
    );
  },
};

// Pledges API - mirrors pledges-service.ts
export const pledgesApi = {
  async createPledge(
    token: string,
    pledgeData: {
      bloodDonationRequestId: string;
      pledgeDate?: string | Date;
      pledgeNotes?: string;
    }
  ) {
    console.log(
      `[MOBILE PLEDGES API] Creating pledge for request: ${pledgeData.bloodDonationRequestId}`
    );
    return makeRequest(
      "/Pledges",
      {
        method: "POST",
        body: JSON.stringify(pledgeData),
      },
      token
    );
  },

  async fetchUserPledges(
    token: string,
    filter?: {
      evolutionStatus?: number;
      paginationTake?: number;
      paginationSkip?: number;
    }
  ) {
    const queryParams = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/Pledges?${queryString}` : "/Pledges";
    return makeRequest(endpoint, {}, token);
  },

  async updatePledgeStatus(token: string, pledgeId: string, status: number) {
    return makeRequest(
      `/Pledges/${pledgeId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ evolutionStatus: status }),
      },
      token
    );
  },

  async cancelPledge(token: string, pledgeId: string) {
    return makeRequest(
      `/Pledges/${pledgeId}`,
      {
        method: "DELETE",
      },
      token
    );
  },

  async completePledge(token: string, pledgeId: string) {
    return this.updatePledgeStatus(token, pledgeId, 3); // 3 = completed status
  },
};

// Donors API - mirrors donors-service.ts
export const donorsApi = {
  async getPublicNonAnonymousDonors(level: number = 1) {
    try {
      console.log(
        `[MOBILE DONORS API] Fetching public non-anonymous donors with level: ${level}`
      );
      return makeRequest(
        `/Users?level=${level}&donorWantToStayAnonymous=false&donorExcludedFromPublicPortal=false`
      );
    } catch (error) {
      console.error("[MOBILE DONORS API] Error fetching public donors:", error);
      // Fallback direct fetch
      return makeRequest(
        `/api/Users?level=${level}&donorWantToStayAnonymous=false&donorExcludedFromPublicPortal=false`
      );
    }
  },

  async getAllNonAnonymousDonors(token: string, level: number = 2) {
    console.log(
      `[MOBILE DONORS API] Fetching all non-anonymous donors with level: ${level}`
    );
    return makeRequest(
      `/Users?level=${level}&donorWantToStayAnonymous=false`,
      {},
      token
    );
  },

  async getNonAnonymousDonorsByBloodType(
    bloodType: string,
    token?: string,
    level: number = 1
  ) {
    const params = token
      ? `level=${level}&donorBloodGroup=${bloodType}&donorWantToStayAnonymous=false`
      : `level=${level}&donorBloodGroup=${bloodType}&donorWantToStayAnonymous=false&donorExcludedFromPublicPortal=false`;

    return makeRequest(`/Users?${params}`, {}, token);
  },

  async searchNonAnonymousDonors(
    searchTerm: string,
    token?: string,
    level: number = 1
  ) {
    const params = token
      ? `level=${level}&search=${encodeURIComponent(
          searchTerm
        )}&donorWantToStayAnonymous=false`
      : `level=${level}&search=${encodeURIComponent(
          searchTerm
        )}&donorWantToStayAnonymous=false&donorExcludedFromPublicPortal=false`;

    return makeRequest(`/Users?${params}`, {}, token);
  },
};

// Hospitals/Blood Transfusion Centers API - mirrors blood-transfusion-service.ts
export const hospitalsApi = {
  async getBloodTansfusionCenters(token?: string) {
    try {
      console.log(
        `[MOBILE HOSPITALS API] Fetching blood transfusion centers${
          token ? " (authenticated)" : ""
        }`
      );

      // Use the working direct endpoint
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (token) {
        const cleanToken = token.startsWith("Bearer ")
          ? token.substring(7)
          : token;
        headers["Authorization"] = `Bearer ${cleanToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/BTC`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        return data?.bloodTansfusionCenters || data || [];
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error("[MOBILE HOSPITALS API] Error fetching centers:", error);
      return [];
    }
  },

  async subscribeToBloodTansfusionCenter(
    token: string,
    bloodTansfusionCenterId: string
  ) {
    console.log(
      `[MOBILE HOSPITALS API] Subscribing to center: ${bloodTansfusionCenterId}`
    );
    return makeRequest(
      "/Subscriptions",
      {
        method: "POST",
        body: JSON.stringify({ bloodTansfusionCenterId }),
      },
      token
    );
  },

  async unsubscribeFromBloodTansfusionCenter(
    token: string,
    subscriptionId: string
  ) {
    console.log(
      `[MOBILE HOSPITALS API] Unsubscribing from subscription: ${subscriptionId}`
    );
    return makeRequest(
      `/Subscriptions/btc/${subscriptionId}`,
      {
        method: "DELETE",
      },
      token
    );
  },

  async getSubscribedBloodTansfusionCenters(token: string) {
    return makeRequest("/BTC/subscribed", {}, token);
  },
};

// Locations API - mirrors locations-service.ts
export const locationsApi = {
  async getWilayas() {
    return makeRequest("/Wilayas");
  },

  async getCommunes() {
    return makeRequest("/Communes");
  },
};

// User profile API
export const userApi = {
  async getUserProfile(token: string, userId?: string) {
    const endpoint = userId ? `/user?userId=${userId}` : "/user";
    return makeRequest(endpoint, {}, token);
  },

  async updateUserProfile(token: string, profileData: any) {
    return makeRequest(
      "/donor/profile",
      {
        method: "PATCH",
        body: JSON.stringify(profileData),
      },
      token
    );
  },
};

// Donations API - for donation history and management
export const donationsApi = {
  async getUserDonations(token: string) {
    console.log("[MOBILE DONATIONS API] Fetching user donations");
    try {
      // Try multiple endpoints based on the backend structure
      return await makeRequest("/donations", {}, token);
    } catch (error) {
      console.warn("Primary donations endpoint failed, trying alternative");
      try {
        return await makeRequest("/donor/donations", {}, token);
      } catch (error2) {
        console.warn(
          "Alternative donations endpoint failed, returning mock data"
        );
        // Return mock data for demonstration
        return [];
      }
    }
  },

  async getDonationStats(token: string) {
    console.log("[MOBILE DONATIONS API] Fetching donation stats");
    try {
      return await makeRequest("/donations/stats", {}, token);
    } catch (error) {
      console.warn("Donations stats endpoint failed, returning mock data");
      return {
        totalDonations: 0,
        totalVolume: 0,
        lastDonation: null,
      };
    }
  },

  async downloadCertificate(token: string, donationId: string) {
    console.log(
      `[MOBILE DONATIONS API] Downloading certificate for donation ${donationId}`
    );
    try {
      return await makeRequest(
        `/donations/${donationId}/certificate`,
        {},
        token
      );
    } catch (error) {
      console.error("Error downloading certificate:", error);
      throw error;
    }
  },
};

// Notifications API - for notification management and settings
export const notificationsApi = {
  async getUserNotifications(token: string) {
    console.log("[MOBILE NOTIFICATIONS API] Fetching user notifications");
    try {
      return await makeRequest("/notifications", {}, token);
    } catch (error) {
      console.warn("Notifications endpoint failed, returning mock data");
      return [];
    }
  },

  async markNotificationAsRead(token: string, notificationId: string) {
    console.log(
      `[MOBILE NOTIFICATIONS API] Marking notification ${notificationId} as read`
    );
    try {
      return await makeRequest(
        `/notifications/${notificationId}/read`,
        { method: "PATCH" },
        token
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  async markAllNotificationsAsRead(token: string) {
    console.log("[MOBILE NOTIFICATIONS API] Marking all notifications as read");
    try {
      return await makeRequest(
        "/notifications/mark-all-read",
        { method: "PATCH" },
        token
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  async getNotificationSettings(token: string) {
    console.log("[MOBILE NOTIFICATIONS API] Fetching notification settings");
    try {
      return await makeRequest("/notifications/settings", {}, token);
    } catch (error) {
      console.warn(
        "Notification settings endpoint failed, returning default settings"
      );
      return {
        enableNotifications: true,
        subscribedHospitals: [],
        urgencyLevels: {
          high: true,
          medium: true,
          low: false,
        },
        notificationMethods: {
          push: true,
          email: false,
          sms: false,
        },
      };
    }
  },

  async updateNotificationSettings(token: string, settings: any) {
    console.log("[MOBILE NOTIFICATIONS API] Updating notification settings");
    try {
      return await makeRequest(
        "/notifications/settings",
        {
          method: "PUT",
          body: JSON.stringify(settings),
        },
        token
      );
    } catch (error) {
      console.error("Error updating notification settings:", error);
      throw error;
    }
  },
};

// Consolidated API object for easier imports - mirrors api-service.ts structure
export const api = {
  // Auth methods
  login: authApi.login,
  register: authApi.register,

  // Blood donation requests
  getPublicBloodDonationRequests: requestsApi.getPublicBloodDonationRequests,
  getAuthenticatedBloodDonationRequests:
    requestsApi.getAuthenticatedBloodDonationRequests,
  getSubscribedHospitalRequests: requestsApi.getSubscribedHospitalRequests,
  getMatchingBloodTypeRequests: requestsApi.getMatchingBloodTypeRequests,
  getRequestsByBloodTransfusionCenter:
    requestsApi.getRequestsByBloodTransfusionCenter,
  getNearbyRequests: requestsApi.getNearbyRequests,
  createBloodDonationRequest: requestsApi.createBloodDonationRequest,

  // Pledges
  createPledge: pledgesApi.createPledge,
  fetchUserPledges: pledgesApi.fetchUserPledges,
  updatePledgeStatus: pledgesApi.updatePledgeStatus,
  cancelPledge: pledgesApi.cancelPledge,
  completePledge: pledgesApi.completePledge,
  pledgeToDonate: pledgesApi.createPledge, // Alias for compatibility

  // Donations
  getUserDonations: donationsApi.getUserDonations,
  getDonationStats: donationsApi.getDonationStats,
  downloadCertificate: donationsApi.downloadCertificate,

  // Notifications
  getUserNotifications: notificationsApi.getUserNotifications,
  markNotificationAsRead: notificationsApi.markNotificationAsRead,
  markAllNotificationsAsRead: notificationsApi.markAllNotificationsAsRead,
  getNotificationSettings: notificationsApi.getNotificationSettings,
  updateNotificationSettings: notificationsApi.updateNotificationSettings,

  // Donors
  getPublicNonAnonymousDonors: donorsApi.getPublicNonAnonymousDonors,
  getAllNonAnonymousDonors: donorsApi.getAllNonAnonymousDonors,
  getNonAnonymousDonorsByBloodType: donorsApi.getNonAnonymousDonorsByBloodType,
  searchNonAnonymousDonors: donorsApi.searchNonAnonymousDonors,

  // Blood transfusion centers
  getBloodTansfusionCenters: hospitalsApi.getBloodTansfusionCenters,
  getBloodTansfusionCentersDirectAuthenticated:
    hospitalsApi.getBloodTansfusionCenters,
  subscribeToBloodTansfusionCenter:
    hospitalsApi.subscribeToBloodTansfusionCenter,
  unsubscribeFromBloodTansfusionCenter:
    hospitalsApi.unsubscribeFromBloodTansfusionCenter,
  getSubscribedBloodTansfusionCenters:
    hospitalsApi.getSubscribedBloodTansfusionCenters,

  // Locations
  getWilayas: locationsApi.getWilayas,
  getCommunes: locationsApi.getCommunes,

  // User profile
  getUserProfile: userApi.getUserProfile,
  updateUserProfile: userApi.updateUserProfile,
};
