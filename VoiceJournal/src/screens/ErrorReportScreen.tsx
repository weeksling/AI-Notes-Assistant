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
import { NativeErrorModuleInterface, NativeErrorLog } from '../services/NativeErrorModule';

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
  const [nativeErrors, setNativeErrors] = useState<NativeErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | NativeErrorLog | null>(null);
  const [selectedErrorType, setSelectedErrorType] = useState<'js' | 'native'>('js');

  const ERROR_LOGS_KEY = '@voice_journal_error_logs';

  useEffect(() => {
    loadAllErrorLogs();
  }, []);

  const loadAllErrorLogs = async () => {
    try {
      setIsLoading(true);
      
      // Load JavaScript errors
      const logsJson = await AsyncStorage.getItem(ERROR_LOGS_KEY);
      if (logsJson) {
        const logs = JSON.parse(logsJson);
        setErrors(logs);
      }
      
      // Load native errors
      try {
        const nativeLogs = await NativeErrorModuleInterface.getNativeErrorLogs();
        setNativeErrors(nativeLogs);
      } catch (nativeError) {
        console.error('Failed to load native error logs:', nativeError);
        // Continue without native logs if there's an error
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
              // Clear JavaScript errors
              await AsyncStorage.removeItem(ERROR_LOGS_KEY);
              setErrors([]);
              
              // Clear native errors
              try {
                await NativeErrorModuleInterface.clearNativeErrorLogs();
                setNativeErrors([]);
              } catch (nativeError) {
                console.error('Failed to clear native error logs:', nativeError);
              }
              
              Alert.alert('Success', 'All error logs have been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear error logs');
            }
          },
        },
      ]
    );
  };

  const shareErrorLog = async (error: ErrorLog | NativeErrorLog) => {
    try {
      const isNative = 'stackTrace' in error;
      const errorText = `Voice Journal Error Report

Type: ${isNative ? 'Native' : error.type}
Time: ${new Date(isNative ? parseInt(error.timestamp) : error.timestamp).toLocaleString()}
Message: ${error.message}

${isNative ? `Stack Trace:\n${error.stackTrace}` : error.stack ? `Stack Trace:\n${error.stack}` : ''}

${!isNative && error.componentStack ? `Component Stack:\n${error.componentStack}` : ''}`;

      await Share.share({
        message: errorText,
        title: 'Voice Journal Error Report',
      });
    } catch (shareError) {
      Alert.alert('Error', 'Failed to share error log');
    }
  };

  const renderErrorItem = ({ item, type }: { item: ErrorLog | NativeErrorLog; type: 'js' | 'native' }) => (
    <TouchableOpacity
      style={[styles.errorItem, type === 'native' && styles.nativeErrorItem]}
      onPress={() => {
        setSelectedError(item);
        setSelectedErrorType(type);
      }}
    >
      <View style={styles.errorHeader}>
        <Text style={[styles.errorType, type === 'native' && styles.nativeErrorType]}>
          {type === 'native' ? 'NATIVE' : item.type.toUpperCase()}
        </Text>
        <Text style={styles.errorTime}>
          {new Date(type === 'native' ? parseInt(item.timestamp) : item.timestamp).toLocaleString()}
        </Text>
      </View>
      <Text style={styles.errorMessage} numberOfLines={2}>
        {item.message}
      </Text>
    </TouchableOpacity>
  );

  const renderErrorDetails = () => {
    if (!selectedError) return null;

    const isNative = selectedErrorType === 'native';
    const error = selectedError as (isNative ? NativeErrorLog : ErrorLog);

    return (
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalTitle}>Error Details</Text>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{isNative ? 'Native' : error.type}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>
                {new Date(isNative ? parseInt(error.timestamp) : error.timestamp).toLocaleString()}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Message:</Text>
              <Text style={styles.detailValue}>{error.message}</Text>
            </View>

            {isNative && error.stackTrace && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Stack Trace:</Text>
                <ScrollView style={styles.codeBlock}>
                  <Text style={styles.codeText}>{error.stackTrace}</Text>
                </ScrollView>
              </View>
            )}

            {!isNative && (error as ErrorLog).stack && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Stack Trace:</Text>
                <ScrollView style={styles.codeBlock}>
                  <Text style={styles.codeText}>{(error as ErrorLog).stack}</Text>
                </ScrollView>
              </View>
            )}

            {!isNative && (error as ErrorLog).componentStack && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Component Stack:</Text>
                <ScrollView style={styles.codeBlock}>
                  <Text style={styles.codeText}>{(error as ErrorLog).componentStack}</Text>
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

  const allErrors = [
    ...errors.map(error => ({ ...error, _type: 'js' as const })),
    ...nativeErrors.map(error => ({ ...error, _type: 'native' as const }))
  ].sort((a, b) => {
    const timeA = new Date('stackTrace' in a ? parseInt(a.timestamp) : a.timestamp).getTime();
    const timeB = new Date('stackTrace' in b ? parseInt(b.timestamp) : b.timestamp).getTime();
    return timeB - timeA; // Most recent first
  });

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
        {allErrors.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllErrors}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {allErrors.length === 0 ? (
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
              {allErrors.length} error{allErrors.length !== 1 ? 's' : ''} recorded
              {errors.length > 0 && nativeErrors.length > 0 && (
                ` (${errors.length} JS, ${nativeErrors.length} Native)`
              )}
            </Text>
          </View>

          <FlatList
            data={allErrors}
            renderItem={({ item }) => renderErrorItem({ item, type: item._type })}
            keyExtractor={(item) => `${item._type}_${'id' in item ? item.id : item.timestamp}`}
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
  nativeErrorItem: {
    borderLeftColor: '#f39c12',
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
  nativeErrorType: {
    color: '#f39c12',
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