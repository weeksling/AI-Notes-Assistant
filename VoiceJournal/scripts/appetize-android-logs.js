#!/usr/bin/env node

/**
 * 📱 Android Device Logs Extractor for Appetize.io
 * 
 * This script captures Android device logs, logcat output, and app startup
 * errors from Appetize.io to debug why the VoiceJournal app fails to start.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
require('dotenv').config();

// Configuration
const ANDROID_BOOT_TIMEOUT = 180000; // 3 minutes
const LOG_CAPTURE_INTERVAL = 2000; // 2 seconds

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
  log(`⚠️  WARN: ${message}`, 'yellow');
}

// Load app info
function loadAppInfo() {
  const appInfoPath = path.join(__dirname, '../appetize-app-info.json');
  if (!fs.existsSync(appInfoPath)) {
    throw new Error('App info file not found. Please run upload script first.');
  }
  return JSON.parse(fs.readFileSync(appInfoPath, 'utf8'));
}

// Generate diagnostics directory
function createDiagnosticsDir() {
  const diagnosticsDir = path.join(__dirname, '../diagnostics');
  if (!fs.existsSync(diagnosticsDir)) {
    fs.mkdirSync(diagnosticsDir, { recursive: true });
  }
  return diagnosticsDir;
}

// Capture Android device logs
async function captureAndroidLogs(page) {
  const logs = [];
  
  // Listen for any console messages from the device
  page.on('console', (msg) => {
    const timestamp = new Date().toISOString();
    logs.push({
      timestamp,
      type: 'device_console',
      level: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Listen for page errors (app crashes)
  page.on('pageerror', (err) => {
    const timestamp = new Date().toISOString();
    logs.push({
      timestamp,
      type: 'page_error',
      message: err.message,
      stack: err.stack,
      name: err.name
    });
  });

  // Monitor for device-specific errors
  await page.addInitScript(() => {
    // Override console methods to capture device logs
    const originalConsole = window.console;
    ['log', 'error', 'warn', 'info', 'debug'].forEach(method => {
      window.console[method] = (...args) => {
        originalConsole[method](...args);
        // Send to parent window for capture
        if (window.parent && window.parent.postMessage) {
          window.parent.postMessage({
            type: 'device_log',
            level: method,
            args: args.map(arg => String(arg)),
            timestamp: Date.now()
          }, '*');
        }
      };
    });
  });

  return logs;
}

// Extract device frame and monitor app startup
async function monitorAppStartup(page) {
  const startupLogs = [];
  let deviceFrame = null;
  let startupStartTime = Date.now();
  
  info('🔍 Monitoring app startup process...');
  
  // Wait for device frame to appear
  try {
    await page.waitForSelector('iframe[src*="appetize"]', { timeout: 60000 });
    deviceFrame = await page.$('iframe[src*="appetize"]');
    
    if (deviceFrame) {
      success('Device frame found');
      
      // Monitor iframe source changes
      const iframeSrc = await deviceFrame.getAttribute('src');
      startupLogs.push({
        timestamp: new Date().toISOString(),
        type: 'iframe_detected',
        src: iframeSrc,
        message: 'Device iframe loaded'
      });
      
      // Try to access iframe content
      try {
        const iframeContent = await deviceFrame.contentFrame();
        if (iframeContent) {
          success('Device iframe content accessible');
          
          // Monitor for app-specific elements
          await monitorAppElements(iframeContent, startupLogs);
        }
      } catch (iframeError) {
        warn(`Cannot access iframe content: ${iframeError.message}`);
        startupLogs.push({
          timestamp: new Date().toISOString(),
          type: 'iframe_access_error',
          error: iframeError.message,
          message: 'Cannot access device iframe content'
        });
      }
    }
  } catch (waitError) {
    error(`Device frame timeout: ${waitError.message}`);
    startupLogs.push({
      timestamp: new Date().toISOString(),
      type: 'device_frame_timeout',
      error: waitError.message,
      message: 'Device frame did not appear within timeout'
    });
  }

  // Monitor for session status changes
  await monitorSessionStatus(page, startupLogs);
  
  return startupLogs;
}

// Monitor app-specific elements in device frame
async function monitorAppElements(frame, logs) {
  const appSelectors = [
    'android-widget-TextView',
    '[class*="android"]',
    '[id*="android"]',
    'webview',
    'react-native',
    '[class*="react"]',
    '[class*="expo"]',
    '[class*="voice"]',
    '[class*="journal"]'
  ];
  
  for (const selector of appSelectors) {
    try {
      await frame.waitForSelector(selector, { timeout: 5000 });
      success(`Found app element: ${selector}`);
      logs.push({
        timestamp: new Date().toISOString(),
        type: 'app_element_found',
        selector,
        message: `App element detected: ${selector}`
      });
    } catch (e) {
      // Element not found, continue
    }
  }
}

// Monitor session status
async function monitorSessionStatus(page, logs) {
  const statusSelectors = [
    'text="Session ended"',
    'text="Session timeout"',
    'text="App crashed"',
    'text="Failed to load"',
    '[data-testid="session-status"]',
    '.session-status',
    '.error-message'
  ];
  
  for (const selector of statusSelectors) {
    try {
      const element = await page.waitForSelector(selector, { timeout: 2000 });
      if (element) {
        const text = await element.textContent();
        warn(`Session status: ${text}`);
        logs.push({
          timestamp: new Date().toISOString(),
          type: 'session_status',
          selector,
          text,
          message: `Session status detected: ${text}`
        });
      }
    } catch (e) {
      // Status not found, continue
    }
  }
}

// Main diagnostic function
async function runAndroidDiagnostics() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const diagnosticsDir = createDiagnosticsDir();
  
  log('🚀 Starting Android device diagnostics...', 'cyan');
  
  let browser = null;
  let allLogs = [];
  let startupLogs = [];
  
  try {
    // Load app configuration
    const appInfo = loadAppInfo();
    info(`Using app: ${appInfo.publicKey} (${appInfo.platform})`);
    
    // Launch browser
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: path.join(diagnosticsDir, 'videos'),
        size: { width: 1280, height: 720 }
      }
    });
    
    const page = await context.newPage();
    
    // Set up log capture
    allLogs = await captureAndroidLogs(page);
    
    // Navigate to Appetize.io
    const url = `https://appetize.io/app/${appInfo.publicKey}?device=pixel7&osVersion=13.0&toolbar=true`;
    info(`Navigating to: ${url}`);
    await page.goto(url);
    
    // Start session
    info('Starting Appetize.io session...');
    await page.click('button:has-text("Tap to Start")', { timeout: 30000 });
    
    // Monitor startup process
    startupLogs = await monitorAppStartup(page);
    
    // Wait for device to fully boot or timeout
    info('Waiting for device boot or timeout...');
    await page.waitForTimeout(ANDROID_BOOT_TIMEOUT);
    
    // Capture final state
    await page.screenshot({
      path: path.join(diagnosticsDir, `${timestamp}-final-state.png`),
      fullPage: true
    });
    
    success('Android diagnostics completed');
    
  } catch (err) {
    error(`Android diagnostics failed: ${err.message}`);
    console.error(err.stack);
    
    allLogs.push({
      timestamp: new Date().toISOString(),
      type: 'diagnostic_error',
      error: err.message,
      stack: err.stack
    });
    
  } finally {
    // Save all logs
    const logFiles = [
      { name: 'android-device-logs.json', data: allLogs },
      { name: 'app-startup-logs.json', data: startupLogs }
    ];
    
    for (const logFile of logFiles) {
      const filepath = path.join(diagnosticsDir, `${timestamp}-${logFile.name}`);
      fs.writeFileSync(filepath, JSON.stringify(logFile.data, null, 2));
      info(`Saved: ${logFile.name}`);
    }
    
    // Generate summary report
    const summary = {
      timestamp,
      appKey: loadAppInfo().publicKey,
      platform: loadAppInfo().platform,
      totalLogs: allLogs.length,
      startupLogs: startupLogs.length,
      diagnosticDuration: ANDROID_BOOT_TIMEOUT,
      keyFindings: extractKeyFindings(allLogs, startupLogs)
    };
    
    fs.writeFileSync(
      path.join(diagnosticsDir, `${timestamp}-android-summary.json`),
      JSON.stringify(summary, null, 2)
    );
    
    success(`Android diagnostic report saved to diagnostics/`);
    
    if (browser) {
      await browser.close();
    }
  }
}

// Extract key findings from logs
function extractKeyFindings(allLogs, startupLogs) {
  const findings = [];
  
  // Check for device frame issues
  const deviceFrameErrors = allLogs.filter(log => 
    log.type === 'device_frame_timeout' || 
    log.type === 'iframe_access_error'
  );
  
  if (deviceFrameErrors.length > 0) {
    findings.push({
      severity: 'high',
      category: 'device_frame',
      message: 'Device frame failed to load or access',
      count: deviceFrameErrors.length
    });
  }
  
  // Check for app startup issues
  const appErrors = allLogs.filter(log => 
    log.type === 'page_error' || 
    log.level === 'error'
  );
  
  if (appErrors.length > 0) {
    findings.push({
      severity: 'high',
      category: 'app_errors',
      message: 'App startup errors detected',
      count: appErrors.length,
      examples: appErrors.slice(0, 3)
    });
  }
  
  // Check for session issues
  const sessionIssues = startupLogs.filter(log => 
    log.type === 'session_status' && 
    (log.text.includes('ended') || log.text.includes('timeout'))
  );
  
  if (sessionIssues.length > 0) {
    findings.push({
      severity: 'medium',
      category: 'session',
      message: 'Session ended or timed out',
      count: sessionIssues.length
    });
  }
  
  return findings;
}

// Run the diagnostics
if (require.main === module) {
  runAndroidDiagnostics().catch(console.error);
}

module.exports = {
  runAndroidDiagnostics,
  captureAndroidLogs,
  monitorAppStartup
};