#!/usr/bin/env node

/**
 * 🔍 Appetize.io Diagnostic Script
 * 
 * This script investigates app crashes and pulls detailed logs from Appetize.io
 * to identify what's causing the VoiceJournal app to crash.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
require('dotenv').config();

// Configuration
const DIAGNOSTIC_TIMEOUT = 180000; // 3 minutes
const SCREENSHOT_INTERVAL = 5000; // 5 seconds

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

// Load app info
function loadAppInfo() {
  const infoPath = path.join(__dirname, '../appetize-app-info.json');
  return JSON.parse(fs.readFileSync(infoPath, 'utf8'));
}

// Create diagnostics directory
function createDiagnosticsDir() {
  const diagDir = path.join(__dirname, '../diagnostics');
  if (!fs.existsSync(diagDir)) {
    fs.mkdirSync(diagDir, { recursive: true });
  }
  return diagDir;
}

// Save diagnostic data
function saveDiagnosticData(filename, data) {
  const diagDir = createDiagnosticsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filepath = path.join(diagDir, `${timestamp}-${filename}`);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  info(`Diagnostic data saved: ${filepath}`);
  return filepath;
}

// Capture detailed screenshot
async function captureDetailedScreenshot(page, description) {
  const diagDir = createDiagnosticsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${description}.png`;
  const filepath = path.join(diagDir, filename);
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: true
  });
  
  info(`Screenshot saved: ${filename}`);
  return filepath;
}

// Extract page information
async function extractPageInfo(page) {
  return await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      readyState: document.readyState,
      body: document.body ? document.body.innerHTML.length : 0,
      elements: {
        iframes: document.querySelectorAll('iframe').length,
        buttons: document.querySelectorAll('button').length,
        forms: document.querySelectorAll('form').length,
        inputs: document.querySelectorAll('input').length
      },
      console_errors: window.errors || [],
      network_errors: window.networkErrors || []
    };
  });
}

// Look for Appetize.io specific elements
async function findAppetizeElements(page) {
  const elements = await page.evaluate(() => {
    const found = {};
    
    // Check for iframes
    const iframes = document.querySelectorAll('iframe');
    if (iframes.length > 0) {
      found['iframe'] = {
        count: iframes.length,
        visible: Array.from(iframes).some(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
        titles: Array.from(iframes).map(el => el.title || '').filter(Boolean),
        sources: Array.from(iframes).map(el => el.src || '').filter(Boolean)
      };
    }
    
    // Check for buttons with relevant text
    const buttons = document.querySelectorAll('button');
    const relevantButtons = Array.from(buttons).filter(btn => {
      const text = btn.textContent?.toLowerCase() || '';
      return text.includes('start') || text.includes('tap') || text.includes('play') || text.includes('launch');
    });
    
    if (relevantButtons.length > 0) {
      found['relevant-buttons'] = {
        count: relevantButtons.length,
        visible: relevantButtons.some(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
        text: relevantButtons.map(el => el.textContent?.trim() || '').filter(Boolean)
      };
    }
    
    // Check for device frames
    const deviceFrames = document.querySelectorAll('.device-frame, .simulator-frame, [data-testid="device-frame"]');
    if (deviceFrames.length > 0) {
      found['device-frames'] = {
        count: deviceFrames.length,
        visible: Array.from(deviceFrames).some(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
        classes: Array.from(deviceFrames).map(el => el.className || '').filter(Boolean)
      };
    }
    
    // Check for appetize-specific classes
    const appetizeElements = document.querySelectorAll('[class*="appetize"], [id*="appetize"]');
    if (appetizeElements.length > 0) {
      found['appetize-elements'] = {
        count: appetizeElements.length,
        visible: Array.from(appetizeElements).some(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
        classes: Array.from(appetizeElements).map(el => el.className || '').filter(Boolean)
      };
    }
    
    return found;
  });
  
  return elements;
}

// Try to start Appetize.io session
async function startAppetizeSession(page) {
  info('Attempting to start Appetize.io session...');
  
  // Look for start buttons
  const startSelectors = [
    'button:has-text("Tap to Start")',
    'button:has-text("Start Session")',
    'button[data-testid="start-session"]',
    '.start-button',
    '.play-button'
  ];
  
  for (const selector of startSelectors) {
    try {
      const button = page.locator(selector);
      if (await button.isVisible({ timeout: 2000 })) {
        info(`Found start button: ${selector}`);
        await button.click();
        await page.waitForTimeout(3000);
        return true;
      }
    } catch (error) {
      // Continue to next selector
    }
  }
  
  // Try clicking on device area
  try {
    const deviceArea = page.locator('.device-frame, .simulator-frame, [data-testid="device-frame"]').first();
    if (await deviceArea.isVisible({ timeout: 2000 })) {
      info('Clicking on device area to start session...');
      await deviceArea.click();
      await page.waitForTimeout(3000);
      return true;
    }
  } catch (error) {
    // Continue
  }
  
  return false;
}

// Monitor for app crashes
async function monitorForCrashes(page) {
  const crashIndicators = [];
  
  // Check for crash-related text
  const crashTexts = [
    'Unfortunately',
    'has stopped',
    'Application Error',
    'Force Close',
    'App Crash',
    'Something went wrong',
    'Error occurred',
    'Failed to load',
    'Connection failed',
    'Session ended',
    'Device disconnected'
  ];
  
  for (const text of crashTexts) {
    try {
      const element = page.locator(`text=${text}`);
      if (await element.isVisible({ timeout: 1000 })) {
        crashIndicators.push({
          type: 'crash_text',
          text: text,
          visible: true
        });
      }
    } catch (error) {
      // Continue checking
    }
  }
  
  return crashIndicators;
}

// Get network logs
function setupNetworkLogging(page) {
  const networkLogs = [];
  
  page.on('request', request => {
    networkLogs.push({
      type: 'request',
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: request.url(),
      headers: request.headers()
    });
  });
  
  page.on('response', response => {
    networkLogs.push({
      type: 'response',
      timestamp: new Date().toISOString(),
      status: response.status(),
      url: response.url(),
      headers: response.headers()
    });
  });
  
  page.on('requestfailed', request => {
    networkLogs.push({
      type: 'request_failed',
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: request.url(),
      failure: request.failure()
    });
  });
  
  return networkLogs;
}

// Get console logs
function setupConsoleLogging(page) {
  const consoleLogs = [];
  
  page.on('console', msg => {
    consoleLogs.push({
      type: 'console',
      timestamp: new Date().toISOString(),
      level: msg.type(),
      text: msg.text(),
      args: msg.args().length
    });
  });
  
  page.on('pageerror', error => {
    consoleLogs.push({
      type: 'page_error',
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    });
  });
  
  return consoleLogs;
}

// Main diagnostic function
async function runDiagnostics() {
  let browser;
  
  try {
    const appInfo = loadAppInfo();
    
    log('\n🔍 Starting Appetize.io Diagnostics', 'purple');
    log('=====================================', 'purple');
    log(`App Key: ${appInfo.publicKey}`, 'cyan');
    log(`App URL: ${appInfo.appUrl}`, 'cyan');
    
    // Launch browser in headed mode to see what's happening
    browser = await chromium.launch({ 
      headless: false,  // Show browser so we can see what's happening
      slowMo: 1000      // Slow down actions
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: createDiagnosticsDir(),
        size: { width: 1920, height: 1080 }
      }
    });
    
    const page = await context.newPage();
    
    // Setup logging
    const networkLogs = setupNetworkLogging(page);
    const consoleLogs = setupConsoleLogging(page);
    
    // Navigate to app URL
    info(`Navigating to: ${appInfo.appUrl}`);
    await page.goto(appInfo.appUrl);
    
    // Initial screenshot and page info
    await captureDetailedScreenshot(page, 'initial-load');
    const initialPageInfo = await extractPageInfo(page);
    saveDiagnosticData('initial-page-info.json', initialPageInfo);
    
    info('Initial page loaded, analyzing...');
    
    // Look for Appetize elements
    const appetizeElements = await findAppetizeElements(page);
    saveDiagnosticData('appetize-elements.json', appetizeElements);
    
    if (Object.keys(appetizeElements).length > 0) {
      success('Found Appetize.io elements:');
      Object.entries(appetizeElements).forEach(([selector, info]) => {
        log(`  ${selector}: ${info.count} elements, visible: ${info.visible}`, 'cyan');
      });
    } else {
      warn('No Appetize.io elements found on page');
    }
    
    // Try to start session
    const sessionStarted = await startAppetizeSession(page);
    if (sessionStarted) {
      success('Session start attempted');
    } else {
      warn('Could not find session start button');
    }
    
    await captureDetailedScreenshot(page, 'after-session-start');
    
    // Wait and monitor for changes
    info('Monitoring for app launch and crashes...');
    const monitoringStartTime = Date.now();
    const screenshots = [];
    
    while (Date.now() - monitoringStartTime < DIAGNOSTIC_TIMEOUT) {
      // Take periodic screenshots
      if ((Date.now() - monitoringStartTime) % SCREENSHOT_INTERVAL < 1000) {
        const screenshotPath = await captureDetailedScreenshot(page, `monitor-${Math.floor((Date.now() - monitoringStartTime) / 1000)}s`);
        screenshots.push(screenshotPath);
      }
      
      // Check for crashes
      const crashIndicators = await monitorForCrashes(page);
      if (crashIndicators.length > 0) {
        error('Crash indicators detected!');
        crashIndicators.forEach(indicator => {
          log(`  ${indicator.type}: ${indicator.text}`, 'red');
        });
        
        await captureDetailedScreenshot(page, 'crash-detected');
        saveDiagnosticData('crash-indicators.json', crashIndicators);
        break;
      }
      
      // Check for iframe (device loaded)
      const iframeFound = await page.locator('iframe').count() > 0;
      if (iframeFound) {
        success('Device iframe detected!');
        await captureDetailedScreenshot(page, 'device-loaded');
        
        // Try to interact with the device
        try {
          const iframe = page.locator('iframe').first();
          await iframe.click();
          await page.waitForTimeout(5000);
          await captureDetailedScreenshot(page, 'device-interaction');
        } catch (error) {
          warn(`Device interaction failed: ${error.message}`);
        }
        
        break;
      }
      
      await page.waitForTimeout(1000);
    }
    
    // Final analysis
    const finalPageInfo = await extractPageInfo(page);
    saveDiagnosticData('final-page-info.json', finalPageInfo);
    
    await captureDetailedScreenshot(page, 'final-state');
    
    // Save all logs
    saveDiagnosticData('network-logs.json', networkLogs);
    saveDiagnosticData('console-logs.json', consoleLogs);
    
    // Generate diagnostic report
    const report = {
      timestamp: new Date().toISOString(),
      appInfo: appInfo,
      initialPageInfo: initialPageInfo,
      finalPageInfo: finalPageInfo,
      appetizeElements: appetizeElements,
      sessionStarted: sessionStarted,
      networkLogsCount: networkLogs.length,
      consoleLogsCount: consoleLogs.length,
      screenshotsCount: screenshots.length,
      monitoringDuration: Date.now() - monitoringStartTime
    };
    
    const reportPath = saveDiagnosticData('diagnostic-report.json', report);
    
    success('Diagnostics completed!');
    log(`\nDiagnostic Report Summary:`, 'yellow');
    log(`- App Key: ${appInfo.publicKey}`, 'white');
    log(`- Session Started: ${sessionStarted}`, 'white');
    log(`- Appetize Elements Found: ${Object.keys(appetizeElements).length}`, 'white');
    log(`- Network Requests: ${networkLogs.length}`, 'white');
    log(`- Console Messages: ${consoleLogs.length}`, 'white');
    log(`- Screenshots Taken: ${screenshots.length}`, 'white');
    log(`- Monitoring Duration: ${Math.floor((Date.now() - monitoringStartTime) / 1000)}s`, 'white');
    log(`\nFull report: ${reportPath}`, 'green');
    
    // Check for specific issues
    log(`\n🔍 Issue Analysis:`, 'yellow');
    
    if (!sessionStarted) {
      error('❌ Could not start Appetize.io session automatically');
      log('   This suggests the interface has changed or requires manual interaction', 'white');
    }
    
    if (Object.keys(appetizeElements).length === 0) {
      error('❌ No Appetize.io elements detected');
      log('   The page might not have loaded correctly or the selectors are outdated', 'white');
    }
    
    const errorRequests = networkLogs.filter(log => log.type === 'request_failed').length;
    if (errorRequests > 0) {
      error(`❌ ${errorRequests} network requests failed`);
      log('   This could indicate connectivity or API issues', 'white');
    }
    
    const pageErrors = consoleLogs.filter(log => log.type === 'page_error').length;
    if (pageErrors > 0) {
      error(`❌ ${pageErrors} JavaScript errors detected`);
      log('   These could be causing app functionality issues', 'white');
    }
    
    await context.close();
    
  } catch (err) {
    error(`Diagnostics failed: ${err.message}`);
    console.error(err.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics };