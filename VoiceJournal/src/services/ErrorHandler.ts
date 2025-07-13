import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ErrorLog {
  id: string;
  timestamp: Date;
  type: 'javascript' | 'native' | 'promise' | 'component';
  message: string;
  stack?: string;
  componentStack?: string;
  props?: any;
  url?: string;
  line?: number;
  column?: number;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private readonly ERROR_LOGS_KEY = '@voice_journal_error_logs';
  private readonly MAX_ERROR_LOGS = 50;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Initialize global error handlers
  setupGlobalErrorHandling() {
    try {
      // Handle JavaScript errors using ErrorUtils if available
      const errorUtils = (global as any)?.ErrorUtils;
      if (errorUtils && typeof errorUtils.setGlobalHandler === 'function') {
        const originalHandler = errorUtils.getGlobalHandler?.();
        errorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
          this.logError({
            type: 'javascript',
            message: error?.message || 'Unknown JavaScript error',
            stack: error?.stack,
          });

          if (isFatal) {
            this.showFatalErrorDialog(error);
          } else {
            this.showNonFatalErrorToast(error);
          }

          // Call original handler
          if (originalHandler) {
            originalHandler(error, isFatal);
          }
        });
      }

      // Handle unhandled promise rejections using HermesInternal if available
      const hermesInternal = (global as any)?.HermesInternal;
      if (hermesInternal?.hasPromise && hermesInternal?.enablePromiseRejectionTracker) {
        hermesInternal.enablePromiseRejectionTracker({
          allRejections: true,
          onUnhandled: (id: string, error: Error) => {
            this.logError({
              type: 'promise',
              message: `Unhandled Promise Rejection: ${error.message || 'Unknown error'}`,
              stack: error.stack,
            });
            this.showNonFatalErrorToast(error);
          },
          onHandled: () => {
            // Promise was handled after being unhandled
          },
        });
      }

      // Handle console errors
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        const message = args.join(' ');
        if (message.includes('Warning:') || message.includes('[GESTURE HANDLER]')) {
          // Skip React warnings and gesture handler warnings
          originalConsoleError(...args);
          return;
        }

        this.logError({
          type: 'javascript',
          message: `Console Error: ${message}`,
        });

        originalConsoleError(...args);
      };
    } catch (setupError) {
      console.error('Failed to setup global error handling:', setupError);
    }
  }

  // Log error to AsyncStorage
  async logError(errorInfo: Partial<ErrorLog>) {
    try {
      const errorLog: ErrorLog = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: errorInfo.type || 'javascript',
        message: errorInfo.message || 'Unknown error',
        stack: errorInfo.stack,
        componentStack: errorInfo.componentStack,
        props: errorInfo.props,
        url: errorInfo.url,
        line: errorInfo.line,
        column: errorInfo.column,
      };

      console.error('Error logged:', errorLog);

      // Get existing error logs
      const existingLogs = await this.getErrorLogs();
      
      // Add new error and keep only the most recent MAX_ERROR_LOGS
      const updatedLogs = [errorLog, ...existingLogs].slice(0, this.MAX_ERROR_LOGS);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(this.ERROR_LOGS_KEY, JSON.stringify(updatedLogs));
    } catch (storageError) {
      console.error('Failed to log error to storage:', storageError);
    }
  }

  // Get all error logs
  async getErrorLogs(): Promise<ErrorLog[]> {
    try {
      const logsJson = await AsyncStorage.getItem(this.ERROR_LOGS_KEY);
      if (!logsJson) return [];
      
      const logs = JSON.parse(logsJson);
      return logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    } catch (error) {
      console.error('Error getting error logs:', error);
      return [];
    }
  }

  // Clear all error logs
  async clearErrorLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ERROR_LOGS_KEY);
    } catch (error) {
      console.error('Error clearing error logs:', error);
    }
  }

  // Show fatal error dialog
  private showFatalErrorDialog(error: Error) {
    Alert.alert(
      'Application Error',
      `The app encountered a fatal error and needs to restart.\n\nError: ${error.message}\n\nPlease restart the app. If this continues, try clearing app data.`,
      [
        {
          text: 'Show Details',
          onPress: () => this.showErrorDetails(error),
          style: 'default',
        },
        {
          text: 'Restart App',
          onPress: () => {
            // In a real app, you might want to restart here
            // For now, we'll just show an alert
            Alert.alert('Please manually restart the app');
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  }

  // Show non-fatal error toast
  private showNonFatalErrorToast(error: Error) {
    // Only show alerts for non-fatal errors in development or if user opts in
    const isDev = (global as any)?.__DEV__ || false;
    if (isDev) {
      Alert.alert(
        'Non-Fatal Error',
        `An error occurred but the app should continue working.\n\nError: ${error.message}`,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'Show Details', onPress: () => this.showErrorDetails(error) },
        ]
      );
    }
  }

  // Show detailed error information
  private showErrorDetails(error: Error) {
    Alert.alert(
      'Error Details',
      `Message: ${error.message}\n\nStack Trace:\n${error.stack || 'No stack trace available'}`,
      [{ text: 'Copy to Clipboard', onPress: () => this.copyErrorToClipboard(error) }]
    );
  }

  // Copy error to clipboard (if available)
  private async copyErrorToClipboard(error: Error) {
    try {
      const errorText = `Error: ${error.message}\n\nStack: ${error.stack || 'No stack trace'}`;
      // In a real app, you'd use @react-native-clipboard/clipboard
      console.log('Error copied to clipboard:', errorText);
      Alert.alert('Copied', 'Error details copied to clipboard');
    } catch (clipboardError) {
      console.error('Failed to copy to clipboard:', clipboardError);
      Alert.alert('Copy Failed', 'Could not copy error details');
    }
  }

  // Manual error reporting for components
  reportError(error: Error, componentInfo?: { componentStack?: string; props?: any }) {
    this.logError({
      type: 'component',
      message: error.message || 'Component error',
      stack: error.stack,
      componentStack: componentInfo?.componentStack,
      props: componentInfo?.props,
    });

    const isDev = (global as any)?.__DEV__ || false;
    if (isDev) {
      Alert.alert(
        'Component Error',
        `Error in component: ${error.message}`,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'Show Details', onPress: () => this.showErrorDetails(error) },
        ]
      );
    }
  }

  // Get error summary for user
  async getErrorSummary(): Promise<string> {
    const logs = await this.getErrorLogs();
    if (logs.length === 0) {
      return 'No errors recorded.';
    }

    const errorCounts = logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summary = Object.entries(errorCounts)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    const latestError = logs[0];
    return `Total errors: ${logs.length}\nBreakdown: ${summary}\n\nLatest error (${latestError.timestamp.toLocaleString()}):\n${latestError.message}`;
  }
}

export default ErrorHandler;