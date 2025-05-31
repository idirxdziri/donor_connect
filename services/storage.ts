// services/storage.ts - Storage service for mobile app

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  USER: "user",
  TOKEN: "token",
  REFRESH_TOKEN: "refresh_token",
} as const;

// Use SecureStore for sensitive data like tokens
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async clear(): Promise<void> {
    // Clear all secure items
    const keys = Object.values(KEYS);
    await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
  },
};

// Use AsyncStorage for non-sensitive data
export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  },

  async getItem(key: string): Promise<any> {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};

// User-specific storage functions
export const userStorage = {
  async saveUser(user: any): Promise<void> {
    // Save user data in regular storage
    await storage.setItem(KEYS.USER, user);

    // Save token in secure storage
    if (user?.token) {
      await secureStorage.setItem(KEYS.TOKEN, user.token);
    }
  },

  async getUser(): Promise<any> {
    const user = await storage.getItem(KEYS.USER);
    if (user) {
      // Get token from secure storage
      const token = await secureStorage.getItem(KEYS.TOKEN);
      if (token) {
        user.token = token;
      }
    }
    return user;
  },

  async removeUser(): Promise<void> {
    await storage.removeItem(KEYS.USER);
    await secureStorage.removeItem(KEYS.TOKEN);
    await secureStorage.removeItem(KEYS.REFRESH_TOKEN);
  },

  async getToken(): Promise<string | null> {
    return await secureStorage.getItem(KEYS.TOKEN);
  },
};
