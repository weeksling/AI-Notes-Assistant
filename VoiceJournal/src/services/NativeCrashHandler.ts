import { NativeModules, Platform } from 'react-native';

interface CrashReportModuleInterface {
  getNativeCrashLogs(): Promise<string>;
  clearNativeCrashLogs(): Promise<boolean>;
}

// Get the native module (only available on Android for now)
const CrashReportModule = Platform.OS === 'android' 
  ? NativeModules.CrashReportModule as CrashReportModuleInterface
  : null;

export class NativeCrashHandler {
  static async getNativeCrashLogs(): Promise<any[]> {
    if (!CrashReportModule) {
      return [];
    }

    try {
      const logsJson = await CrashReportModule.getNativeCrashLogs();
      const logs = JSON.parse(logsJson);
      return Array.isArray(logs) ? logs : [];
    } catch (error) {
      console.error('Failed to get native crash logs:', error);
      return [];
    }
  }

  static async clearNativeCrashLogs(): Promise<boolean> {
    if (!CrashReportModule) {
      return false;
    }

    try {
      return await CrashReportModule.clearNativeCrashLogs();
    } catch (error) {
      console.error('Failed to clear native crash logs:', error);
      return false;
    }
  }

  static isAvailable(): boolean {
    return CrashReportModule !== null;
  }
}