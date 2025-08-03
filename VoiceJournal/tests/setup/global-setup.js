/**
 * Global Setup for Playwright Tests
 * 
 * This file handles global setup tasks that need to run before all tests
 * including environment validation and Appetize.io connectivity checks.
 */

const fs = require('fs');
const path = require('path');

async function globalSetup() {
  console.log('🚀 Setting up global test environment...');
  
  // Validate environment variables
  const requiredEnvVars = ['APPETIZE_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    console.error('Please set these variables in your .env file or environment');
    process.exit(1);
  }
  
  // Ensure test results directory exists
  const testResultsDir = path.join(__dirname, '../../test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }
  
  // Load and validate app info
  const appInfoPath = path.join(__dirname, '../../appetize-app-info.json');
  if (!fs.existsSync(appInfoPath)) {
    console.error('❌ Missing appetize-app-info.json file');
    console.error('Please ensure your app has been uploaded to Appetize.io');
    process.exit(1);
  }
  
  const appInfo = JSON.parse(fs.readFileSync(appInfoPath, 'utf8'));
  if (!appInfo.publicKey) {
    console.error('❌ Invalid app info: missing publicKey');
    process.exit(1);
  }
  
  console.log('✅ Global setup complete');
  console.log(`📱 App Key: ${appInfo.publicKey}`);
  console.log(`🔗 App URL: ${appInfo.appUrl}`);
  
  return appInfo;
}

module.exports = globalSetup;