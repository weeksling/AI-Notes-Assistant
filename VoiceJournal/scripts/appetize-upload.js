#!/usr/bin/env node

/**
 * 🍎 Appetize APK Upload Script
 * 
 * Uploads Android APK to Appetize.io for cloud testing
 * Usage: ./scripts/appetize-upload.js [apk-file]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const APPETIZE_API_URL = 'https://api.appetize.io/v1/apps';
const DEFAULT_APK_PATH = 'releases/VoiceJournal-v1.2-ErrorHandling-UPDATED.apk';

// Colors for output
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  purple: '\x1b[0;35m',
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

// Load environment variables
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      envLines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
    }
  } catch (err) {
    warn('Could not load .env file');
  }
}

// Validate API key
function validateApiKey() {
  const apiKey = process.env.APPETIZE_API_KEY;
  if (!apiKey) {
    error('APPETIZE_API_KEY environment variable is required');
    info('Please set your API key in .env file or export APPETIZE_API_KEY=your_key');
    process.exit(1);
  }
  return apiKey;
}

// Get APK file path
function getApkPath() {
  const args = process.argv.slice(2);
  const apkPath = args[0] || DEFAULT_APK_PATH;
  
  if (!fs.existsSync(apkPath)) {
    error(`APK file not found: ${apkPath}`);
    info('Available APK files:');
    try {
      const releaseDir = path.dirname(DEFAULT_APK_PATH);
      const files = fs.readdirSync(releaseDir).filter(f => f.endsWith('.apk'));
      files.forEach(file => log(`  - ${releaseDir}/${file}`, 'cyan'));
    } catch (err) {
      error('Could not list release directory');
    }
    process.exit(1);
  }
  
  return apkPath;
}

// Get APK file info
function getApkInfo(apkPath) {
  const stats = fs.statSync(apkPath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  return {
    path: apkPath,
    size: stats.size,
    sizeInMB: sizeInMB,
    name: path.basename(apkPath)
  };
}

// Upload APK to Appetize
async function uploadApk(apkPath, apiKey) {
  return new Promise((resolve, reject) => {
    const apkInfo = getApkInfo(apkPath);
    
    info(`Uploading ${apkInfo.name} (${apkInfo.sizeInMB}MB) to Appetize...`);
    
    const fileStream = fs.createReadStream(apkPath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 9);
    
    const postData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="' + apkInfo.name + '"',
      'Content-Type: application/vnd.android.package-archive',
      '',
      ''
    ].join('\r\n');
    
    const endData = `\r\n--${boundary}--\r\n`;
    
    const options = {
      hostname: 'api.appetize.io',
      port: 443,
      path: '/v1/apps',
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData) + apkInfo.size + Buffer.byteLength(endData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(response);
          } else {
            reject(new Error(`Upload failed (${res.statusCode}): ${response.error || data}`));
          }
        } catch (err) {
          reject(new Error(`Invalid response: ${data}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    // Write the form data
    req.write(Buffer.from(postData));
    
    // Pipe the file
    fileStream.on('data', (chunk) => {
      req.write(chunk);
    });
    
    fileStream.on('end', () => {
      req.write(Buffer.from(endData));
      req.end();
    });
    
    fileStream.on('error', (err) => {
      reject(err);
    });
  });
}

// Save app info to file
function saveAppInfo(appInfo) {
  const infoPath = path.join(__dirname, '../appetize-app-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(appInfo, null, 2));
  info(`App info saved to ${infoPath}`);
}

// Main function
async function main() {
  try {
    log('\n🍎 Appetize APK Upload Script', 'purple');
    log('================================', 'purple');
    
    // Load environment and validate
    loadEnv();
    const apiKey = validateApiKey();
    const apkPath = getApkPath();
    
    // Upload APK
    log('\n📱 Uploading APK to Appetize...', 'yellow');
    const appInfo = await uploadApk(apkPath, apiKey);
    
    // Display results
    success('APK uploaded successfully!');
    log('\n📊 App Information:', 'cyan');
    log(`   App Key: ${appInfo.publicKey}`, 'white');
    log(`   Build ID: ${appInfo.buildId || 'N/A'}`, 'white');
    log(`   Platform: ${appInfo.platform}`, 'white');
    log(`   Bundle ID: ${appInfo.bundleId || 'N/A'}`, 'white');
    
    // Generate URLs
    const appUrl = `https://appetize.io/app/${appInfo.publicKey}`;
    const debugUrl = `${appUrl}?enableAdb=true&proxy=intercept`;
    
    log('\n🔗 URLs:', 'cyan');
    log(`   App URL: ${appUrl}`, 'white');
    log(`   Debug URL: ${debugUrl}`, 'white');
    
    // Save app info
    saveAppInfo({
      ...appInfo,
      appUrl,
      debugUrl,
      uploadTime: new Date().toISOString(),
      apkPath: apkPath
    });
    
    log('\n🎯 Next Steps:', 'green');
    log('   1. Test manually: Open the App URL in your browser', 'white');
    log('   2. Run automated tests: ./scripts/appetize-test.js', 'white');
    log('   3. Debug with ADB: Use the Debug URL', 'white');
    
  } catch (err) {
    error(`Upload failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { uploadApk, validateApiKey, loadEnv };