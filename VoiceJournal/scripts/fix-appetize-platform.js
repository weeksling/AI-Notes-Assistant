#!/usr/bin/env node

/**
 * 🔧 Appetize.io Platform Fix Script
 * 
 * This script attempts to fix the platform mismatch issue by updating
 * the existing app to use Android platform instead of iOS.
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

// Load app info
function loadAppInfo() {
  const infoPath = path.join(__dirname, '../appetize-app-info.json');
  return JSON.parse(fs.readFileSync(infoPath, 'utf8'));
}

// Try to update the app platform
async function updateAppPlatform() {
  const appInfo = loadAppInfo();
  const apiKey = process.env.APPETIZE_API_KEY;
  
  if (!apiKey) {
    error('APPETIZE_API_KEY not found in environment variables');
    return false;
  }
  
  log('\n🔧 Attempting to fix Appetize.io platform issue...', 'cyan');
  log(`App Key: ${appInfo.publicKey}`, 'white');
  log(`Current Platform: ${appInfo.platform || 'unknown'}`, 'white');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Method 1: Try to update platform directly
    info('Method 1: Updating platform via API...');
    
    const updateResponse = await fetch(`https://api.appetize.io/v1/apps/${appInfo.publicKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: 'android'
      })
    });
    
    if (updateResponse.ok) {
      const result = await updateResponse.json();
      success('Platform updated successfully!');
      log(`New configuration: ${JSON.stringify(result, null, 2)}`, 'white');
      return true;
    } else {
      warn(`Platform update failed: ${updateResponse.status} ${updateResponse.statusText}`);
      
      // Method 2: Try form data approach
      info('Method 2: Trying form data approach...');
      
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('platform', 'android');
      
      const formResponse = await fetch(`https://api.appetize.io/v1/apps/${appInfo.publicKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData
      });
      
      if (formResponse.ok) {
        const result = await formResponse.json();
        success('Platform updated successfully with form data!');
        log(`New configuration: ${JSON.stringify(result, null, 2)}`, 'white');
        return true;
      } else {
        error(`Both update methods failed. Status: ${formResponse.status}`);
        return false;
      }
    }
    
  } catch (err) {
    error(`API call failed: ${err.message}`);
    return false;
  }
}

// Get current app info to verify the fix
async function verifyFix() {
  const appInfo = loadAppInfo();
  const apiKey = process.env.APPETIZE_API_KEY;
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    info('Verifying current app configuration...');
    
    const response = await fetch(`https://api.appetize.io/v1/apps/${appInfo.publicKey}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      log(`\nCurrent App Configuration:`, 'yellow');
      log(`Platform: ${result.platform}`, 'white');
      log(`Updated: ${result.updated}`, 'white');
      log(`Created: ${result.created}`, 'white');
      
      if (result.platform === 'android') {
        success('✅ Platform is correctly set to Android!');
        return true;
      } else {
        error(`❌ Platform is still: ${result.platform}`);
        return false;
      }
    } else {
      error(`Failed to get app info: ${response.status}`);
      return false;
    }
    
  } catch (err) {
    error(`Verification failed: ${err.message}`);
    return false;
  }
}

// Main function
async function main() {
  log('\n🔍 Appetize.io Platform Fix Utility', 'cyan');
  log('===================================', 'cyan');
  
  // Check if dependencies are available
  try {
    await import('node-fetch');
    await import('form-data');
  } catch (err) {
    error('Missing dependencies. Please install:');
    log('npm install node-fetch form-data', 'yellow');
    process.exit(1);
  }
  
  // Verify current state
  await verifyFix();
  
  // Attempt to fix
  const success = await updateAppPlatform();
  
  if (success) {
    // Verify the fix worked
    log('\n🔍 Verifying fix...', 'cyan');
    const verified = await verifyFix();
    
    if (verified) {
      log('\n🎉 Platform fix completed successfully!', 'green');
      log('\nNext steps:', 'yellow');
      log('1. Run: npm run test:quick', 'white');
      log('2. Verify app loads in Android emulator', 'white');
      log('3. Continue with full testing', 'white');
    } else {
      log('\n⚠️  Fix applied but verification failed', 'yellow');
      log('Please check manually at: https://appetize.io/manage', 'white');
    }
  } else {
    log('\n❌ Automatic fix failed', 'red');
    log('\nManual fix required:', 'yellow');
    log('1. Go to: https://appetize.io/manage', 'white');
    log('2. Delete current app', 'white');
    log('3. Re-upload APK with platform=android', 'white');
    log('4. Update appetize-app-info.json with new key', 'white');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateAppPlatform, verifyFix };