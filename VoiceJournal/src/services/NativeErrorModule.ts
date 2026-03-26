import { NativeModules } from 'react-native';

interface NativeErrorLog {
  timestamp: string;
  context: string;
  message: string;
  stackTrace: string;
  type: string;
}

interface NativeErrorModuleInterface {
  getNativeErrorLogs(): Promise<NativeErrorLog[]>;
  clearNativeErrorLogs(): Promise<boolean>;
  logNativeError(context: string, message: string, stackTrace: string): Promise<boolean>;
}

const { NativeErrorModule } = NativeModules;

export const NativeErrorModuleInterface: NativeErrorModuleInterface = {
  getNativeErrorLogs: () => NativeErrorModule.getNativeErrorLogs(),
  clearNativeErrorLogs: () => NativeErrorModule.clearNativeErrorLogs(),
  logNativeError: (context: string, message: string, stackTrace: string) => 
    NativeErrorModule.logNativeError(context, message, stackTrace),
};

export type { NativeErrorLog };