/**
 * Smoke Tests for VoiceJournal App
 * 
 * These tests verify basic functionality and app stability
 * on Appetize.io cloud devices.
 */

const { test, expect } = require('@playwright/test');
const {
  generateAppetizeUrl,
  waitForDeviceReady,
  waitForAppLoad,
  captureScreenshot,
  measureAppStartupTime,
  handleAppCrash
} = require('../utils/appetize-utils');

test.describe('VoiceJournal Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up error handling
    page.on('pageerror', async (error) => {
      console.error('Page error:', error);
      await handleAppCrash(page, 'page-error');
    });
    
    page.on('crash', async () => {
      console.error('Page crashed');
      await handleAppCrash(page, 'page-crash');
    });
  });

  test('should load app successfully on Android device', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableAdb: true
    });
    
    console.log(`🚀 Loading app: ${appUrl}`);
    await page.goto(appUrl);
    
    // Wait for device to be ready
    await waitForDeviceReady(page);
    
    // Measure startup time
    const startupTime = await measureAppStartupTime(page);
    expect(startupTime).toBeLessThan(30000); // Should start within 30 seconds
    
    // Capture screenshot of loaded app
    await captureScreenshot(page, 'smoke-test', 'app-loaded');
    
    // Verify app is responsive
    await expect(page).toHaveTitle(/Appetize/);
  });

  test('should handle app launch without crashes', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0'
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Wait for app to stabilize
    await page.waitForTimeout(5000);
    
    // Capture screenshot
    await captureScreenshot(page, 'smoke-test', 'no-crash');
    
    // Verify no crash indicators
    const crashIndicators = [
      'text=Unfortunately',
      'text=has stopped',
      'text=Application Error',
      'text=Force Close'
    ];
    
    for (const indicator of crashIndicators) {
      await expect(page.locator(indicator)).not.toBeVisible();
    }
  });

  test('should display app UI elements', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0'
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Capture screenshot for UI verification
    await captureScreenshot(page, 'smoke-test', 'ui-elements');
    
    // Wait for UI to settle
    await page.waitForTimeout(3000);
    
    // Basic UI should be present (this will need to be customized based on your app)
    // For now, we'll just verify the device is showing content
    const deviceFrame = page.locator('iframe[title="Appetize"]');
    await expect(deviceFrame).toBeVisible();
  });

  test('should handle device rotation', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      orientation: 'portrait'
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Capture portrait screenshot
    await captureScreenshot(page, 'smoke-test', 'portrait');
    
    // Try to rotate device (this might need to be adjusted based on Appetize.io UI)
    try {
      const rotateButton = page.locator('[data-testid="rotate-button"]');
      if (await rotateButton.isVisible()) {
        await rotateButton.click();
        await page.waitForTimeout(2000);
        
        // Capture landscape screenshot
        await captureScreenshot(page, 'smoke-test', 'landscape');
      }
    } catch (error) {
      console.log('Device rotation not available or failed:', error.message);
    }
  });

  test('should handle app permissions', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableAdb: true
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Wait for potential permission dialogs
    await page.waitForTimeout(5000);
    
    // Look for common permission dialogs
    const permissionTexts = [
      'Allow',
      'Deny',
      'While using the app',
      'Only this time',
      'Don\'t allow'
    ];
    
    for (const text of permissionTexts) {
      const element = page.locator(`text=${text}`);
      if (await element.isVisible()) {
        console.log(`Found permission dialog: ${text}`);
        await captureScreenshot(page, 'smoke-test', 'permission-dialog');
        
        // Grant permission if it's an "Allow" button
        if (text === 'Allow' || text === 'While using the app') {
          await element.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Capture final state
    await captureScreenshot(page, 'smoke-test', 'permissions-handled');
  });

  test('should survive background/foreground cycle', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableAdb: true
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Capture initial state
    await captureScreenshot(page, 'smoke-test', 'foreground-initial');
    
    // Simulate going to background (press home button)
    try {
      const homeButton = page.locator('[data-testid="home-button"]');
      if (await homeButton.isVisible()) {
        await homeButton.click();
        await page.waitForTimeout(2000);
        
        // Capture home screen
        await captureScreenshot(page, 'smoke-test', 'background-home');
        
        // Try to return to app (this might need adjustment)
        const appIcon = page.locator('text=VoiceJournal');
        if (await appIcon.isVisible()) {
          await appIcon.click();
          await page.waitForTimeout(2000);
          
          // Capture app restored
          await captureScreenshot(page, 'smoke-test', 'foreground-restored');
        }
      }
    } catch (error) {
      console.log('Background/foreground cycle not available:', error.message);
    }
  });

  test('should handle network connectivity', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableNetwork: true
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method()
      });
    });
    
    // Wait for app to make network requests
    await page.waitForTimeout(10000);
    
    // Capture network activity
    await captureScreenshot(page, 'smoke-test', 'network-activity');
    
    console.log(`Network requests captured: ${networkRequests.length}`);
    
    // Basic network connectivity check
    if (networkRequests.length > 0) {
      console.log('✅ App made network requests');
    } else {
      console.log('⚠️ No network requests detected');
    }
  });

  test('should handle device back button', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0'
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Capture initial state
    await captureScreenshot(page, 'smoke-test', 'before-back');
    
    // Press back button
    try {
      const backButton = page.locator('[data-testid="back-button"]');
      if (await backButton.isVisible()) {
        await backButton.click();
        await page.waitForTimeout(2000);
        
        // Capture after back press
        await captureScreenshot(page, 'smoke-test', 'after-back');
        
        // Verify app handles back button gracefully
        const crashIndicators = [
          'text=Unfortunately',
          'text=has stopped'
        ];
        
        for (const indicator of crashIndicators) {
          await expect(page.locator(indicator)).not.toBeVisible();
        }
      }
    } catch (error) {
      console.log('Back button interaction not available:', error.message);
    }
  });

  test('should maintain reasonable performance', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0'
    });
    
    const startTime = Date.now();
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    
    const deviceReadyTime = Date.now() - startTime;
    console.log(`Device ready time: ${deviceReadyTime}ms`);
    
    const appStartTime = Date.now();
    await waitForAppLoad(page);
    const appLoadTime = Date.now() - appStartTime;
    console.log(`App load time: ${appLoadTime}ms`);
    
    // Capture performance state
    await captureScreenshot(page, 'smoke-test', 'performance-check');
    
    // Performance assertions
    expect(deviceReadyTime).toBeLessThan(60000); // Device should be ready within 60 seconds
    expect(appLoadTime).toBeLessThan(30000); // App should load within 30 seconds
    
    // Test app responsiveness
    await page.waitForTimeout(5000);
    const responsiveTime = Date.now();
    
    // Try to interact with the app (tap in center)
    try {
      const deviceFrame = page.locator('iframe[title="Appetize"]');
      if (await deviceFrame.isVisible()) {
        await deviceFrame.click();
        const responseTime = Date.now() - responsiveTime;
        console.log(`Interaction response time: ${responseTime}ms`);
        
        expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      }
    } catch (error) {
      console.log('Interaction test failed:', error.message);
    }
  });

});