import { registerRootComponent } from 'expo';
import { ErrorHandler } from './src/services/ErrorHandler';

// Initialize error handling as early as possible
try {
  ErrorHandler.getInstance().setupGlobalErrorHandling();
} catch (error) {
  console.error('Failed to initialize error handling:', error);
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
