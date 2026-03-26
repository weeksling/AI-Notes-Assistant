import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import ErrorHandler from './src/services/ErrorHandler';

export default function App() {
  useEffect(() => {
    // Initialize global error handling
    const errorHandler = ErrorHandler.getInstance();
    errorHandler.setupGlobalErrorHandling();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
