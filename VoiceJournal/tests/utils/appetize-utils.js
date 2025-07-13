/**
 * Appetize.io Utility Functions
 * 
 * This module provides utility functions for interacting with Appetize.io
 * devices and handling common testing scenarios.
 */

const fs = require('fs');
const path = require('path');

// Load app info from the configuration file
function loadAppInfo() {
  const appInfoPath = path.join(__dirname, '../../appetize-app-info.json');
  if (!fs.existsSync(appInfoPath)) {
    throw new Error('App info file not found. Please run the upload script first.');
  }
  return JSON.parse(fs.readFileSync(appInfoPath, 'utf8'));
}

// Generate Appetize.io URL with specific parameters
function generateAppetizeUrl(options = {}) {
  const appInfo = loadAppInfo();
  const baseUrl = `https://appetize.io/app/${appInfo.publicKey}`;
  
  const params = new URLSearchParams({
    device: options.device || 'pixel6',
    osVersion: options.osVersion || '12.0',
    orientation: options.orientation || 'portrait',
    scale: options.scale || '75',
    ...options.extraParams
  });
  
  if (options.enableAdb) {
    params.set('enableAdb', 'true');
  }
  
  if (options.enableNetwork) {
    params.set('proxy', 'intercept');
  }
  
  return `${baseUrl}?${params.toString()}`;
}

// Wait for Appetize.io device to be ready
async function waitForDeviceReady(page, timeout = 60000) {
  console.log('⏳ Waiting for Appetize.io device to be ready...');
  
  // First, try to start the session if needed
  await startAppetizeSession(page);
  
  // Wait for the device frame to appear (try multiple selectors)
  const deviceSelectors = [
    'iframe[title="Appetize"]',
    'iframe[src*="appetize"]',
    'iframe[id*="appetize"]',
    '.device-frame iframe',
    '.simulator-frame iframe',
    '[data-testid="device-frame"] iframe'
  ];
  
  let deviceFrame = null;
  for (const selector of deviceSelectors) {
    try {
      deviceFrame = page.locator(selector).first();
      await deviceFrame.waitFor({ state: 'visible', timeout: 10000 });
      console.log(`✅ Found device frame: ${selector}`);
      break;
    } catch (error) {
      console.log(`⏳ Selector ${selector} not found, trying next...`);
    }
  }
  
  if (!deviceFrame) {
    throw new Error('No device frame found with any known selector');
  }
  
  // Wait for the device to boot up
  await page.waitForFunction(() => {
    const iframes = document.querySelectorAll('iframe');
    return Array.from(iframes).some(iframe => iframe.contentWindow);
  }, { timeout });
  
  console.log('✅ Device is ready');
}

// Try to start Appetize.io session
async function startAppetizeSession(page) {
  console.log('🚀 Attempting to start Appetize.io session...');
  
  // Look for start buttons with multiple selectors
  const startSelectors = [
    'button:has-text("Tap to Start")',
    'button:has-text("Start Session")',
    'button:has-text("Start")',
    'button[data-testid="start-session"]',
    '.start-button',
    '.play-button',
    'button[aria-label*="start"]',
    'button[aria-label*="play"]'
  ];
  
  for (const selector of startSelectors) {
    try {
      const button = page.locator(selector);
      if (await button.isVisible({ timeout: 2000 })) {
        console.log(`🎯 Found start button: ${selector}`);
        await button.click();
        await page.waitForTimeout(5000); // Wait longer for session to start
        return true;
      }
    } catch (error) {
      // Continue to next selector
    }
  }
  
  // Try clicking on device area or preview image
  try {
    const deviceClickables = [
      '.device-frame',
      '.simulator-frame', 
      '[data-testid="device-frame"]',
      '.device-preview',
      '.app-preview',
      'img[alt*="device"]'
    ];
    
    for (const selector of deviceClickables) {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`🎯 Clicking on device area: ${selector}`);
        await element.click();
        await page.waitForTimeout(5000);
        return true;
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not find clickable device area: ${error.message}`);
  }
  
  console.log('⚠️ Could not automatically start session');
  return false;
}

// Wait for app to load completely
async function waitForAppLoad(page, timeout = 30000) {
  console.log('⏳ Waiting for app to load...');
  
  // Wait for app to appear in the device
  await page.waitForTimeout(3000); // Give initial loading time
  
  // Look for common app loading indicators
  const loadingSelectors = [
    'text=Loading',
    'text=Please wait',
    '[data-testid="loading"]',
    '.loading-spinner'
  ];
  
  // Wait for loading indicators to disappear
  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.waitForSelector(selector, { state: 'hidden', timeout });
    } catch (error) {
      // Loading indicator might not be present, continue
    }
  }
  
  console.log('✅ App loaded');
}

// Capture screenshot with timestamp
async function captureScreenshot(page, testName, description = '') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${testName}-${description}-${timestamp}.png`;
  const screenshotPath = path.join(__dirname, '../../test-results', filename);
  
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot captured: ${filename}`);
  return screenshotPath;
}

// Tap on device screen at specific coordinates
async function tapDevice(page, x, y) {
  console.log(`👆 Tapping device at coordinates (${x}, ${y})`);
  
  const iframe = await page.waitForSelector('iframe[title="Appetize"]');
  const frame = await iframe.contentFrame();
  
  if (frame) {
    await frame.click(`body`, { position: { x, y } });
  } else {
    console.warn('⚠️ Could not access device frame for tapping');
  }
}

// Simulate device back button
async function pressBackButton(page) {
  console.log('🔙 Pressing device back button');
  
  // Look for the back button in the Appetize.io interface
  const backButton = await page.locator('[data-testid="back-button"]');
  if (await backButton.isVisible()) {
    await backButton.click();
  } else {
    console.warn('⚠️ Back button not found in Appetize.io interface');
  }
}

// Simulate device home button
async function pressHomeButton(page) {
  console.log('🏠 Pressing device home button');
  
  const homeButton = await page.locator('[data-testid="home-button"]');
  if (await homeButton.isVisible()) {
    await homeButton.click();
  } else {
    console.warn('⚠️ Home button not found in Appetize.io interface');
  }
}

// Get device logs if available
async function getDeviceLogs(page) {
  console.log('📋 Retrieving device logs...');
  
  try {
    // Check if logs panel is available
    const logsButton = await page.locator('[data-testid="logs-button"]');
    if (await logsButton.isVisible()) {
      await logsButton.click();
      
      // Wait for logs to load
      await page.waitForTimeout(2000);
      
      const logsContent = await page.locator('.logs-content').textContent();
      return logsContent || 'No logs available';
    }
  } catch (error) {
    console.warn('⚠️ Could not retrieve device logs:', error.message);
  }
  
  return 'Logs not available';
}

// Network monitoring utilities
async function enableNetworkMonitoring(page) {
  console.log('🌐 Enabling network monitoring...');
  
  // Network monitoring is enabled via URL parameter
  // This function can be extended to interact with network monitoring UI
}

async function getNetworkRequests(page) {
  console.log('📡 Retrieving network requests...');
  
  // Return any captured network requests
  return page.evaluate(() => {
    // This would need to be implemented based on Appetize.io's network monitoring interface
    return [];
  });
}

// Error handling utilities
async function handleAppCrash(page, testName) {
  console.error('💥 App crash detected');
  
  // Capture screenshot of crash
  await captureScreenshot(page, testName, 'crash');
  
  // Get device logs
  const logs = await getDeviceLogs(page);
  
  // Save crash information
  const crashInfo = {
    timestamp: new Date().toISOString(),
    testName,
    logs,
    url: page.url()
  };
  
  const crashPath = path.join(__dirname, '../../test-results', `crash-${testName}-${Date.now()}.json`);
  fs.writeFileSync(crashPath, JSON.stringify(crashInfo, null, 2));
  
  console.log(`🗂️ Crash information saved: ${crashPath}`);
  
  return crashInfo;
}

// Performance monitoring
async function measureAppStartupTime(page) {
  console.log('⏱️ Measuring app startup time...');
  
  const startTime = Date.now();
  await waitForAppLoad(page);
  const endTime = Date.now();
  
  const startupTime = endTime - startTime;
  console.log(`📊 App startup time: ${startupTime}ms`);
  
  return startupTime;
}

module.exports = {
  loadAppInfo,
  generateAppetizeUrl,
  waitForDeviceReady,
  startAppetizeSession,
  waitForAppLoad,
  captureScreenshot,
  tapDevice,
  pressBackButton,
  pressHomeButton,
  getDeviceLogs,
  enableNetworkMonitoring,
  getNetworkRequests,
  handleAppCrash,
  measureAppStartupTime
};