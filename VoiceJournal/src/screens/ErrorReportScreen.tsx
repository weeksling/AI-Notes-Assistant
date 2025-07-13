import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ErrorLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  stack?: string;
  componentStack?: string;
}

interface ErrorReportScreenProps {
  navigation: any;
}

export const ErrorReportScreen: React.FC<ErrorReportScreenProps> = ({ navigation }) => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

  const ERROR_LOGS_KEY = '@voice_journal_error_logs';

  useEffect(() => {
    loadErrorLogs();
  }, []);

  const loadErrorLogs = async () => {
    try {
      setIsLoading(true);
      const logsJson = await AsyncStorage.getItem(ERROR_LOGS_KEY);
      if (logsJson) {
        const logs = JSON.parse(logsJson);
        setErrors(logs);
      }
    } catch (error) {
      console.error('Error loading error logs:', error);
      Alert.alert('Error', 'Failed to load error logs');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllErrors = () => {
    Alert.alert(
      'Clear All Errors',
      'Are you sure you want to clear all error logs? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(ERROR_LOGS_KEY);
              setErrors([]);
              Alert.alert('Success', 'All error logs have been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear error logs');
            }
          },
        },
      ]
    );
  };

  const shareErrorLog = async (error: ErrorLog) => {
    try {
      const errorText = `Voice Journal Error Report

Type: ${error.type}
Time: ${new Date(error.timestamp).toLocaleString()}
Message: ${error.message}

${error.stack ? `Stack Trace:\n${error.stack}` : ''}

${error.componentStack ? `Component Stack:\n${error.componentStack}` : ''}`;

      await Share.share({
        message: errorText,
        title: 'Voice Journal Error Report',
      });
    } catch (shareError) {
      Alert.alert('Error', 'Failed to share error log');
    }
  };

  const renderErrorItem = ({ item }: { item: ErrorLog }) => (
    <TouchableOpacity
      style={styles.errorItem}
      onPress={() => setSelectedError(item)}
    >
      <View style={styles.errorHeader}>
        <Text style={styles.errorType}>{item.type.toUpperCase()}</Text>
        <Text style={styles.errorTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      <Text style={styles.errorMessage} numberOfLines={2}>
        {item.message}
      </Text>
    </TouchableOpacity>
  );

  const renderErrorDetails = () => {
    if (!selectedError) return null;

    return (
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalTitle}>Error Details</Text>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{selectedError.type}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedError.timestamp).toLocaleString()}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Message:</Text>
              <Text style={styles.detailValue}>{selectedError.message}</Text>
            </View>

            {selectedError.stack && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Stack Trace:</Text>
                <ScrollView style={styles.codeBlock}>
                  <Text style={styles.codeText}>{selectedError.stack}</Text>
                </ScrollView>
              </View>
            )}

            {selectedError.componentStack && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Component Stack:</Text>
                <ScrollView style={styles.codeBlock}>
                  <Text style={styles.codeText}>{selectedError.componentStack}</Text>
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.shareButton]}
              onPress={() => shareErrorLog(selectedError)}
            >
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setSelectedError(null)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading error logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Error Reports</Text>
        {errors.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllErrors}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {errors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>No Errors Recorded</Text>
          <Text style={styles.emptyText}>
            Great! Your app is running smoothly with no recorded errors.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {errors.length} error{errors.length !== 1 ? 's' : ''} recorded
            </Text>
          </View>

          <FlatList
            data={errors}
            renderItem={renderErrorItem}
            keyExtractor={(item) => item.id}
            style={styles.errorList}
          />
        </>
      )}

      {renderErrorDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  summary: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  summaryText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  errorList: {
    flex: 1,
  },
  errorItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  errorType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  errorTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  errorMessage: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
    width: '100%',
  },
  modalScrollView: {
    maxHeight: 400,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    maxHeight: 150,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#2c3e50',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#3498db',
  },
  closeButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ErrorReportScreen;