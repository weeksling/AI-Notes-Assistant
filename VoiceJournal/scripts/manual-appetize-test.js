#!/usr/bin/env node

/**
 * 🔍 Manual Appetize.io Test Script
 * 
 * This script provides a simple manual test to debug app startup issues
 * by opening the Appetize.io page and allowing manual interaction.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
require('dotenv').config();

// Colors for output
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

function loadAppInfo() {
  const appInfoPath = path.join(__dirname, '../appetize-app-info.json');
  if (!fs.existsSync(appInfoPath)) {
    throw new Error('App info file not found. Please run upload script first.');
  }
  return JSON.parse(fs.readFileSync(appInfoPath, 'utf8'));
}

async function runManualTest() {
  log('🚀 Starting manual Appetize.io test...', 'cyan');
  
  const appInfo = loadAppInfo();
  const url = `https://appetize.io/app/${appInfo.publicKey}?device=pixel7&osVersion=13.0&toolbar=true`;
  
  log(`📱 App: ${appInfo.publicKey} (${appInfo.platform})`, 'blue');
  log(`🌐 URL: ${url}`, 'blue');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Add console logging
  page.on('console', (msg) => {
    log(`🖥️  Console [${msg.type()}]: ${msg.text()}`, 'yellow');
  });
  
  page.on('pageerror', (err) => {
    log(`❌ Page Error: ${err.message}`, 'red');
  });
  
  // Navigate to the app
  log('🔄 Navigating to Appetize.io...', 'cyan');
  await page.goto(url);
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  log('✅ Page loaded successfully!', 'green');
  log('📋 Instructions:', 'cyan');
  log('   1. Look for the "Tap to Start" button', 'white');
  log('   2. Click it to start the Android emulator', 'white');
  log('   3. Watch for any error messages', 'white');
  log('   4. Check if the app loads on the device', 'white');
  log('   5. Look for any crash indicators', 'white');
  log('   6. Press Ctrl+C to exit when done', 'white');
  
  // Take initial screenshot
  await page.screenshot({ path: 'manual-test-initial.png' });
  log('📸 Initial screenshot saved as manual-test-initial.png', 'blue');
  
  // Check for common elements
  const elements = await page.evaluate(() => {
    const selectors = [
      'button:has-text("Tap to Start")',
      'button:has-text("Start Session")',
      'text="Session ended"',
      'text="Session timeout"',
      'text="Failed to load"',
      'iframe[src*="appetize"]',
      '[data-testid="device-frame"]'
    ];
    
    const results = {};
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        results[selector] = elements.length > 0;
      } catch (e) {
        results[selector] = false;
      }
    });
    
    return results;
  });
  
  log('🔍 Element Detection Results:', 'cyan');
  Object.entries(elements).forEach(([selector, found]) => {
    const status = found ? '✅ Found' : '❌ Not found';
    log(`   ${selector}: ${status}`, found ? 'green' : 'red');
  });
  
  // Try to detect app status
  try {
    const pageTitle = await page.title();
    log(`📄 Page Title: ${pageTitle}`, 'blue');
    
    const pageUrl = page.url();
    log(`🌐 Current URL: ${pageUrl}`, 'blue');
    
    // Check if device is loading
    const deviceStatus = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="appetize"]');
      if (iframe) {
        return {
          hasIframe: true,
          iframeSrc: iframe.src,
          iframeVisible: iframe.offsetWidth > 0 && iframe.offsetHeight > 0
        };
      }
      return { hasIframe: false };
    });
    
    log('📱 Device Status:', 'cyan');
    log(`   Has iframe: ${deviceStatus.hasIframe}`, deviceStatus.hasIframe ? 'green' : 'red');
    if (deviceStatus.hasIframe) {
      log(`   Iframe src: ${deviceStatus.iframeSrc}`, 'blue');
      log(`   Iframe visible: ${deviceStatus.iframeVisible}`, deviceStatus.iframeVisible ? 'green' : 'red');
    }
    
  } catch (e) {
    log(`❌ Error checking page status: ${e.message}`, 'red');
  }
  
  // Keep the browser open for manual inspection
  log('🔄 Keeping browser open for manual testing...', 'cyan');
  log('   Press Ctrl+C to exit', 'yellow');
  
  // Wait indefinitely until user interrupts
  await new Promise(() => {});
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\\n👋 Exiting manual test...', 'cyan');
  process.exit(0);
});

// Run the manual test
runManualTest().catch(console.error);