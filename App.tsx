import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';

// Custom theme based on blood donation theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#d32f2f',
    primaryContainer: '#ffebee',
    secondary: '#f44336',
    secondaryContainer: '#ffcdd2',
    tertiary: '#e57373',
    error: '#f44336',
    errorContainer: '#ffcdd2',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#d32f2f',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#f44336',
    surface: '#ffffff',
    onSurface: '#212121',
    surfaceVariant: '#f5f5f5',
    onSurfaceVariant: '#757575',
    outline: '#bdbdbd',
    background: '#fafafa',
    onBackground: '#212121',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="light" backgroundColor="#d32f2f" />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
