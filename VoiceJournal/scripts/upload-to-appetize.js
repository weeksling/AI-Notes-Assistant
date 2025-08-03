#!/usr/bin/env node

/**
 * 📱 Appetize.io Upload Script
 * 
 * This script uploads the VoiceJournal APK to Appetize.io with correct
 * Android platform settings and updates the app configuration.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  white: '\x1b[0;37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function success(message) {
  log(`✅ SUCCESS: ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  INFO: ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

// Find APK file
function findApkFile() {
  const possiblePaths = [
    path.join(__dirname, '../releases/VoiceJournal-v1.2-ErrorHandling-UPDATED.apk'),
    path.join(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk'),
    path.join(__dirname, '../android/app/build/outputs/apk/release/app-release.apk'),
    path.join(__dirname, '../build/VoiceJournal.apk'),
    path.join(__dirname, '../VoiceJournal.apk')
  ];
  
  for (const apkPath of possiblePaths) {
    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      info(`Found APK: ${apkPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      return apkPath;
    }
  }
  
  return null;
}

// Upload APK to Appetize.io
async function uploadApk() {
  const apiKey = process.env.APPETIZE_API_KEY;
  
  if (!apiKey) {
    error('APPETIZE_API_KEY not found in environment variables');
    error('Please set your API key in the .env file');
    return null;
  }
  
  const apkPath = findApkFile();
  if (!apkPath) {
    error('APK file not found. Please ensure the APK exists in one of these locations:');
    log('- releases/VoiceJournal-v1.2-ErrorHandling-UPDATED.apk', 'yellow');
    log('- android/app/build/outputs/apk/debug/app-debug.apk', 'yellow');
    log('- android/app/build/outputs/apk/release/app-release.apk', 'yellow');
    return null;
  }
  
  try {
    const FormData = (await import('form-data')).default;
    const fetch = (await import('node-fetch')).default;
    
    info('Preparing upload to Appetize.io...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(apkPath));
    formData.append('platform', 'android');  // ← CRITICAL: Set platform to android
    
    // Optional: Set additional configuration
    formData.append('note', 'VoiceJournal v1.2 - Android APK upload with correct platform');
    
    info('Uploading APK to Appetize.io...');
    log(`File: ${path.basename(apkPath)}`, 'white');
    log(`Platform: android`, 'green');
    log(`Size: ${(fs.statSync(apkPath).size / 1024 / 1024).toFixed(2)} MB`, 'white');
    
    const response = await fetch('https://api.appetize.io/v1/apps', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      },
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      success('APK uploaded successfully!');
      return result;
    } else {
      const errorText = await response.text();
      error(`Upload failed: ${response.status} ${response.statusText}`);
      log(`Error details: ${errorText}`, 'red');
      return null;
    }
    
  } catch (err) {
    error(`Upload failed: ${err.message}`);
    return null;
  }
}

// Save app info to file
function saveAppInfo(appData) {
  const appInfoPath = path.join(__dirname, '../appetize-app-info.json');
  
  const appInfo = {
    publicKey: appData.publicKey,
    privateKey: appData.privateKey,
    platform: appData.platform,
    created: appData.created,
    updated: appData.updated,
    publicURL: appData.publicURL,
    appURL: appData.publicURL,
    manageURL: `https://appetize.io/manage/${appData.publicKey}`,
    appUrl: appData.publicURL,
    debugUrl: `${appData.publicURL}?enableAdb=true&proxy=intercept`,
    uploadTime: new Date().toISOString(),
    apkPath: 'releases/VoiceJournal-v1.2-ErrorHandling-UPDATED.apk'
  };
  
  fs.writeFileSync(appInfoPath, JSON.stringify(appInfo, null, 2));
  info(`App info saved to: ${appInfoPath}`);
  
  return appInfo;
}

// Verify the upload
async function verifyUpload(publicKey) {
  const apiKey = process.env.APPETIZE_API_KEY;
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    info('Verifying upload...');
    
    const response = await fetch(`https://api.appetize.io/v1/apps/${publicKey}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      
      log('\n📱 App Configuration Verified:', 'cyan');
      log(`Public Key: ${result.publicKey}`, 'white');
      log(`Platform: ${result.platform}`, result.platform === 'android' ? 'green' : 'red');
      log(`Created: ${result.created}`, 'white');
      log(`Updated: ${result.updated}`, 'white');
      log(`App URL: ${result.publicURL}`, 'white');
      log(`Manage URL: https://appetize.io/manage/${result.publicKey}`, 'white');
      
      if (result.platform === 'android') {
        success('✅ Platform correctly set to Android!');
        return true;
      } else {
        error(`❌ Platform is ${result.platform}, expected android`);
        return false;
      }
    } else {
      error(`Verification failed: ${response.status}`);
      return false;
    }
    
  } catch (err) {
    error(`Verification failed: ${err.message}`);
    return false;
  }
}

// Test the app URL
async function testAppUrl(appUrl) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    info('Testing app URL accessibility...');
    
    const response = await fetch(appUrl, { method: 'HEAD' });
    
    if (response.ok) {
      success('✅ App URL is accessible');
      return true;
    } else {
      warn(`⚠️ App URL returned: ${response.status}`);
      return false;
    }
    
  } catch (err) {
    warn(`⚠️ App URL test failed: ${err.message}`);
    return false;
  }
}

// Main function
async function main() {
  log('\n📱 Appetize.io APK Upload Utility', 'cyan');
  log('==================================', 'cyan');
  
  // Check dependencies
  try {
    await import('node-fetch');
    await import('form-data');
  } catch (err) {
    error('Missing dependencies. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install node-fetch form-data', { stdio: 'inherit' });
  }
  
  // Upload APK
  const uploadResult = await uploadApk();
  
  if (!uploadResult) {
    log('\n❌ Upload failed. Please check the error messages above.', 'red');
    process.exit(1);
  }
  
  // Save app info
  const appInfo = saveAppInfo(uploadResult);
  
  // Verify upload
  const verified = await verifyUpload(uploadResult.publicKey);
  
  if (!verified) {
    warn('Upload completed but verification failed');
  }
  
  // Test app URL
  await testAppUrl(uploadResult.publicURL);
  
  // Final summary
  log('\n🎉 Upload Complete!', 'green');
  log('==================', 'green');
  log(`App Key: ${uploadResult.publicKey}`, 'white');
  log(`Platform: ${uploadResult.platform}`, 'green');
  log(`App URL: ${uploadResult.publicURL}`, 'white');
  log(`Manage: https://appetize.io/manage/${uploadResult.publicKey}`, 'white');
  
  log('\n🔄 Next Steps:', 'yellow');
  log('1. Run: npm run test:quick', 'white');
  log('2. Verify app loads in Android emulator', 'white');
  log('3. Run full test suite: npm run test:smoke', 'white');
  log('4. Check the app at:', 'white');
  log(`   ${uploadResult.publicURL}`, 'cyan');
  
  return uploadResult;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadApk, saveAppInfo, verifyUpload, main };