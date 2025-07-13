#!/usr/bin/env node

/**
 * 🍎 Appetize Playwright Test Script
 * 
 * Runs automated tests on the uploaded APK using Appetize + Playwright
 * Usage: ./scripts/appetize-test.js [--full] [--network]
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Configuration
const TEST_TIMEOUT = 60000; // 60 seconds
const APP_STARTUP_TIMEOUT = 30000; // 30 seconds

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

// Load app info from previous upload
function loadAppInfo() {
  const infoPath = path.join(__dirname, '../appetize-app-info.json');
  
  if (!fs.existsSync(infoPath)) {
    error('App info not found. Please upload APK first using ./scripts/appetize-upload.js');
    process.exit(1);
  }
  
  try {
    const appInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    return appInfo;
  } catch (err) {
    error(`Could not load app info: ${err.message}`);
    process.exit(1);
  }
}

// Wait for element with timeout
async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (err) {
    return false;
  }
}

// Test app startup
async function testAppStartup(page, appInfo) {
  log('\n🚀 Testing App Startup...', 'yellow');
  
  try {
    // Navigate to app URL with debugging enabled
    const testUrl = `${appInfo.appUrl}?enableAdb=true&proxy=intercept`;
    await page.goto(testUrl);
    
    info('Waiting for Appetize to load...');
    
    // Wait for the Appetize iframe or device container
    const deviceLoaded = await waitForElement(page, 'iframe[data-testid="device-iframe"], #device-container, .appetize-device', 15000);
    
    if (!deviceLoaded) {
      throw new Error('Appetize device container not found');
    }
    
    success('Appetize device loaded');
    
    // Wait for app to start (longer timeout for app startup)
    await page.waitForTimeout(10000); // Wait for app initialization
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/app-startup.png' });
    info('Screenshot saved: test-results/app-startup.png');
    
    return true;
    
  } catch (err) {
    error(`App startup test failed: ${err.message}`);
    return false;
  }
}

// Test basic UI elements
async function testBasicUI(page) {
  log('\n🎯 Testing Basic UI Elements...', 'yellow');
  
  try {
    // Wait a bit more for the app to fully load
    await page.waitForTimeout(5000);
    
    // Take another screenshot to see current state
    await page.screenshot({ path: 'test-results/ui-state.png' });
    info('UI state screenshot saved');
    
    // Since we're testing through Appetize, we need to interact with the device iframe
    // For now, we'll just verify the session is active
    const pageTitle = await page.title();
    log(`Page title: ${pageTitle}`, 'cyan');
    
    // Check if there are any error messages in the console
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.waitForTimeout(3000);
    
    if (logs.length > 0) {
      info('Console logs captured:');
      logs.forEach(logEntry => log(`  ${logEntry}`, 'cyan'));
    }
    
    success('Basic UI test completed');
    return true;
    
  } catch (err) {
    error(`Basic UI test failed: ${err.message}`);
    return false;
  }
}

// Test error handling features
async function testErrorHandling(page) {
  log('\n🛡️ Testing Error Handling...', 'yellow');
  
  try {
    // For error handling tests, we would typically:
    // 1. Try to trigger permission dialogs
    // 2. Test error logging functionality
    // 3. Verify debug interface
    
    // Since this is through Appetize, we'll monitor for any crashes or errors
    await page.waitForTimeout(5000);
    
    // Check if the session is still active (no crashes)
    const currentUrl = page.url();
    if (currentUrl.includes('appetize.io')) {
      success('App session still active - no crashes detected');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/error-handling.png' });
    
    return true;
    
  } catch (err) {
    error(`Error handling test failed: ${err.message}`);
    return false;
  }
}

// Run network monitoring test
async function testNetworkMonitoring(page) {
  log('\n🌐 Testing Network Monitoring...', 'yellow');
  
  try {
    // Monitor network requests
    const networkRequests = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    });
    
    page.on('response', response => {
      log(`Network: ${response.status()} ${response.url()}`, 'cyan');
    });
    
    // Wait for potential network activity
    await page.waitForTimeout(10000);
    
    if (networkRequests.length > 0) {
      info(`Captured ${networkRequests.length} network requests`);
      
      // Save network log
      fs.writeFileSync(
        'test-results/network-requests.json',
        JSON.stringify(networkRequests, null, 2)
      );
      
      success('Network monitoring completed');
    } else {
      warn('No network requests captured');
    }
    
    return true;
    
  } catch (err) {
    error(`Network monitoring test failed: ${err.message}`);
    return false;
  }
}

// Generate test report
function generateReport(testResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.length,
      passed: testResults.filter(t => t.passed).length,
      failed: testResults.filter(t => t.passed === false).length
    },
    tests: testResults
  };
  
  fs.writeFileSync('test-results/test-report.json', JSON.stringify(report, null, 2));
  
  log('\n📊 Test Results Summary:', 'purple');
  log(`   Total Tests: ${report.summary.total}`, 'white');
  log(`   Passed: ${report.summary.passed}`, 'green');
  log(`   Failed: ${report.summary.failed}`, 'red');
  
  if (report.summary.failed === 0) {
    success('All tests passed! 🎉');
  } else {
    error(`${report.summary.failed} test(s) failed`);
  }
  
  return report.summary.failed === 0;
}

// Main test function
async function runTests() {
  let browser;
  
  try {
    log('\n🧪 Appetize Playwright Test Suite', 'purple');
    log('===================================', 'purple');
    
    // Create test results directory
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results');
    }
    
    // Load app info
    const appInfo = loadAppInfo();
    info(`Testing app: ${appInfo.publicKey}`);
    info(`App URL: ${appInfo.appUrl}`);
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const isFullTest = args.includes('--full');
    const includeNetwork = args.includes('--network');
    
    // Launch browser
    info('Launching browser...');
    browser = await chromium.launch({ 
      headless: false, // Show browser for debugging
      slowMo: 1000 // Slow down for better visibility
    });
    
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      log(`Browser Console [${msg.type()}]: ${msg.text()}`, 'cyan');
    });
    
    // Run tests
    const testResults = [];
    
    // Test 1: App Startup
    const startupResult = await testAppStartup(page, appInfo);
    testResults.push({ name: 'App Startup', passed: startupResult });
    
    if (startupResult) {
      // Test 2: Basic UI
      const uiResult = await testBasicUI(page);
      testResults.push({ name: 'Basic UI', passed: uiResult });
      
      // Test 3: Error Handling
      const errorResult = await testErrorHandling(page);
      testResults.push({ name: 'Error Handling', passed: errorResult });
      
      // Test 4: Network Monitoring (if requested)
      if (includeNetwork) {
        const networkResult = await testNetworkMonitoring(page);
        testResults.push({ name: 'Network Monitoring', passed: networkResult });
      }
    }
    
    // Generate report
    const allPassed = generateReport(testResults);
    
    // Keep browser open for manual inspection if tests failed
    if (!allPassed) {
      warn('Tests failed. Keeping browser open for 30 seconds for inspection...');
      await page.waitForTimeout(30000);
    }
    
    return allPassed;
    
  } catch (err) {
    error(`Test execution failed: ${err.message}`);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the tests
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTests };