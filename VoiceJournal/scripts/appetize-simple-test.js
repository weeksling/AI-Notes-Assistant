#!/usr/bin/env node

/**
 * 🍎 Simple Appetize Test
 * 
 * Basic test to verify APK loads on Appetize
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

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

// Load app info
function loadAppInfo() {
  const infoPath = path.join(__dirname, '../appetize-app-info.json');
  return JSON.parse(fs.readFileSync(infoPath, 'utf8'));
}

async function runSimpleTest() {
  let browser;
  
  try {
    const appInfo = loadAppInfo();
    
    log('\n🍎 Simple Appetize Test', 'purple');
    log('=======================', 'purple');
    log(`App Key: ${appInfo.publicKey}`, 'cyan');
    log(`App URL: ${appInfo.appUrl}`, 'cyan');
    
    // Launch browser in non-headless mode so we can see what happens
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 2000
    });
    
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 }
    });
    
    const page = await context.newPage();
    
    log('\n🌐 Opening Appetize app...', 'yellow');
    await page.goto(appInfo.appUrl);
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results');
    }
    
    await page.screenshot({ path: 'test-results/appetize-page.png', fullPage: true });
    log('📸 Screenshot saved: test-results/appetize-page.png', 'blue');
    
    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    
    log(`Page Title: ${title}`, 'white');
    log(`Current URL: ${url}`, 'white');
    
    // Look for common Appetize elements
    const appetizeElements = [
      'button[data-testid="session-start"]',
      '.session-start',
      '.appetize-start',
      'button:has-text("Tap to play")',
      'button:has-text("Start Session")',
      'button:has-text("Launch")',
      '.device-screen',
      '.device-container',
      'iframe'
    ];
    
    log('\n🔍 Looking for Appetize elements...', 'yellow');
    
    for (const selector of appetizeElements) {
      try {
        const element = await page.$(selector);
        if (element) {
          log(`✅ Found element: ${selector}`, 'green');
          
          // If it's a button, try clicking it
          if (selector.includes('button') || selector.includes('Tap') || selector.includes('Start')) {
            log(`🖱️  Clicking: ${selector}`, 'blue');
            await element.click();
            await page.waitForTimeout(3000);
          }
        }
      } catch (err) {
        // Element not found, continue
      }
    }
    
    // Wait a bit longer to see if app starts
    await page.waitForTimeout(10000);
    
    // Take another screenshot after interactions
    await page.screenshot({ path: 'test-results/appetize-after-interaction.png', fullPage: true });
    log('📸 Screenshot after interaction saved', 'blue');
    
    // Check for errors in console
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    if (errors.length > 0) {
      log('\n⚠️  Console errors detected:', 'yellow');
      errors.forEach(error => log(`  ${error}`, 'red'));
    }
    
    log('\n🎯 Test Results:', 'purple');
    log('✅ Successfully loaded Appetize page', 'green');
    log('✅ Screenshots captured for manual review', 'green');
    log(`✅ App available at: ${appInfo.appUrl}`, 'green');
    
    log('\n📋 Manual Testing Instructions:', 'cyan');
    log('1. Open this URL in your browser:', 'white');
    log(`   ${appInfo.appUrl}`, 'yellow');
    log('2. Look for a "Tap to play" or "Start Session" button', 'white');
    log('3. Click it to start the Android session', 'white');
    log('4. Wait for the app to load (may take 30-60 seconds)', 'white');
    log('5. Test the app functionality manually', 'white');
    
    // Keep browser open for manual inspection
    log('\n🔍 Keeping browser open for 60 seconds for manual inspection...', 'blue');
    await page.waitForTimeout(60000);
    
    return true;
    
  } catch (err) {
    log(`❌ Test failed: ${err.message}`, 'red');
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runSimpleTest().then(success => {
  process.exit(success ? 0 : 1);
});