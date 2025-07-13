import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private readonly ERROR_LOGS_KEY = '@voice_journal_error_logs';

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.logError(error, errorInfo);
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorLog = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: 'component',
        message: error.message || 'Component error',
        stack: error.stack || 'No stack trace',
        componentStack: errorInfo.componentStack || 'No component stack',
      };

      console.error('ErrorBoundary caught an error:', errorLog);

      // Save to AsyncStorage
      const existingLogsJson = await AsyncStorage.getItem(this.ERROR_LOGS_KEY);
      const existingLogs = existingLogsJson ? JSON.parse(existingLogsJson) : [];
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 50); // Keep last 50 errors
      
      await AsyncStorage.setItem(this.ERROR_LOGS_KEY, JSON.stringify(updatedLogs));
    } catch (storageError) {
      console.error('Failed to log error to storage:', storageError);
    }
  }

  private handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleShowDetails = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const details = `Error: ${error.message}\n\nStack Trace:\n${error.stack || 'No stack available'}\n\nComponent Stack:\n${errorInfo?.componentStack || 'No component stack available'}`;
    
    Alert.alert(
      'Error Details',
      details,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Copy Details', onPress: () => this.copyToClipboard(details) },
      ]
    );
  };

  private copyToClipboard = (text: string) => {
    // In a real app, you'd use @react-native-clipboard/clipboard
    console.log('Error details copied to clipboard:', text);
    Alert.alert('Copied', 'Error details have been logged to console');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.state.errorInfo!);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. This has been logged for debugging.
            </Text>
            
            <View style={styles.errorSummary}>
              <Text style={styles.errorTitle}>Error Summary:</Text>
              <Text style={styles.errorText}>
                {this.state.error?.message || 'Unknown error occurred'}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleRestart}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleShowDetails}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Show Details
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helpText}>
              If this error persists, try restarting the app or clearing app data.
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorSummary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 12,
    alignSelf: 'stretch',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#7f8c8d',
  },
  helpText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});

export default ErrorBoundary;