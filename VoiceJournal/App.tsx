import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ErrorHandler } from './src/services/ErrorHandler';

// Initialize global error handling as early as possible
ErrorHandler.getInstance().setupGlobalErrorHandling();

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
