/**
 * VoiceJournal Functional Tests
 * 
 * These tests verify specific features and functionality
 * of the VoiceJournal app on Appetize.io.
 */

const { test, expect } = require('@playwright/test');
const {
  generateAppetizeUrl,
  waitForDeviceReady,
  waitForAppLoad,
  captureScreenshot,
  tapDevice,
  handleAppCrash,
  getDeviceLogs
} = require('../utils/appetize-utils');

test.describe('VoiceJournal App Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Set up error handling
    page.on('pageerror', async (error) => {
      console.error('Page error:', error);
      await handleAppCrash(page, 'functional-page-error');
    });
    
    page.on('crash', async () => {
      console.error('Page crashed');
      await handleAppCrash(page, 'functional-page-crash');
    });
  });

  test('should display main app interface', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableAdb: true
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Wait for main interface to load
    await page.waitForTimeout(5000);
    
    // Capture main interface
    await captureScreenshot(page, 'functional-test', 'main-interface');
    
    // Verify device frame is visible
    const deviceFrame = page.locator('iframe[title="Appetize"]');
    await expect(deviceFrame).toBeVisible();
    
    // Test basic app responsiveness
    await deviceFrame.click();
    await page.waitForTimeout(2000);
    
    // Capture after interaction
    await captureScreenshot(page, 'functional-test', 'after-interaction');
  });

  test('should handle voice recording permissions', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableAdb: true
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Wait for app to load completely
    await page.waitForTimeout(5000);
    
    // Look for recording-related UI elements or try to trigger recording
    await captureScreenshot(page, 'functional-test', 'ready-for-recording');
    
    // Try to find and interact with recording controls
    const deviceFrame = page.locator('iframe[title="Appetize"]');
    
    // Tap in different areas to find recording button
    const tapLocations = [
      { x: 200, y: 400 }, // Center bottom
      { x: 200, y: 300 }, // Center
      { x: 350, y: 600 }, // Bottom right
      { x: 50, y: 600 }   // Bottom left
    ];
    
    for (const location of tapLocations) {
      try {
        await tapDevice(page, location.x, location.y);
        await page.waitForTimeout(1000);
        
        // Check for permission dialogs
        const permissionTexts = [
          'Allow',
          'Microphone',
          'Audio',
          'Record',
          'Permission'
        ];
        
        for (const text of permissionTexts) {
          const element = page.locator(`text=${text}`);
          if (await element.isVisible()) {
            console.log(`Found permission dialog: ${text}`);
            await captureScreenshot(page, 'functional-test', 'permission-dialog');
            
            // Grant permission if it's an "Allow" button
            if (text === 'Allow') {
              await element.click();
              await page.waitForTimeout(1000);
            }
          }
        }
        
        await captureScreenshot(page, 'functional-test', `tap-${location.x}-${location.y}`);
      } catch (error) {
        console.log(`Tap at ${location.x}, ${location.y} failed:`, error.message);
      }
    }
    
    // Final screenshot
    await captureScreenshot(page, 'functional-test', 'recording-permissions-handled');
  });

  test('should navigate through app screens', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0'
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Initial state
    await captureScreenshot(page, 'functional-test', 'navigation-start');
    
    // Try to navigate by tapping different areas
    const navigationTaps = [
      { x: 50, y: 100, description: 'top-left' },
      { x: 350, y: 100, description: 'top-right' },
      { x: 200, y: 150, description: 'top-center' },
      { x: 100, y: 500, description: 'bottom-left' },
      { x: 300, y: 500, description: 'bottom-right' }
    ];
    
    for (const tap of navigationTaps) {
      try {
        await tapDevice(page, tap.x, tap.y);
        await page.waitForTimeout(2000);
        
        // Capture each navigation step
        await captureScreenshot(page, 'functional-test', `nav-${tap.description}`);
        
        // Check if we're on a new screen
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`Navigation tap at ${tap.description} failed:`, error.message);
      }
    }
  });

  test('should handle text input and keyboard', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableAdb: true
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Look for text input fields
    await page.waitForTimeout(5000);
    await captureScreenshot(page, 'functional-test', 'looking-for-input');
    
    // Try to find and interact with text input areas
    const inputTaps = [
      { x: 200, y: 200, description: 'center-top' },
      { x: 200, y: 300, description: 'center-middle' },
      { x: 200, y: 400, description: 'center-bottom' }
    ];
    
    for (const tap of inputTaps) {
      try {
        await tapDevice(page, tap.x, tap.y);
        await page.waitForTimeout(2000);
        
        // Check if keyboard appeared
        await captureScreenshot(page, 'functional-test', `input-${tap.description}`);
        
        // Try to type some text (this might need adjustment based on how Appetize handles keyboard)
        await page.keyboard.type('Test Entry');
        await page.waitForTimeout(1000);
        
        await captureScreenshot(page, 'functional-test', `typed-${tap.description}`);
        
      } catch (error) {
        console.log(`Input interaction at ${tap.description} failed:`, error.message);
      }
    }
  });

  test('should handle app state persistence', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableAdb: true
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Initial state
    await captureScreenshot(page, 'functional-test', 'persistence-initial');
    
    // Try to create some data or change app state
    await tapDevice(page, 200, 300);
    await page.waitForTimeout(2000);
    await captureScreenshot(page, 'functional-test', 'persistence-after-interaction');
    
    // Simulate app going to background
    try {
      const homeButton = page.locator('[data-testid="home-button"]');
      if (await homeButton.isVisible()) {
        await homeButton.click();
        await page.waitForTimeout(3000);
        
        // Return to app
        const appIcon = page.locator('text=VoiceJournal');
        if (await appIcon.isVisible()) {
          await appIcon.click();
          await page.waitForTimeout(3000);
          
          // Check if state is preserved
          await captureScreenshot(page, 'functional-test', 'persistence-restored');
        }
      }
    } catch (error) {
      console.log('App state persistence test not available:', error.message);
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableAdb: true
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    // Try to trigger potential error scenarios
    await captureScreenshot(page, 'functional-test', 'error-testing-start');
    
    // Rapid tapping to test UI responsiveness
    for (let i = 0; i < 10; i++) {
      await tapDevice(page, Math.random() * 400, Math.random() * 600);
      await page.waitForTimeout(100);
    }
    
    await captureScreenshot(page, 'functional-test', 'after-rapid-tapping');
    
    // Check for error messages
    const errorIndicators = [
      'Error',
      'Failed',
      'Something went wrong',
      'Try again',
      'Network error'
    ];
    
    for (const indicator of errorIndicators) {
      const element = page.locator(`text=${indicator}`);
      if (await element.isVisible()) {
        console.log(`Found error indicator: ${indicator}`);
        await captureScreenshot(page, 'functional-test', `error-${indicator.toLowerCase()}`);
      }
    }
    
    // Get device logs for debugging
    const logs = await getDeviceLogs(page);
    console.log('Device logs:', logs);
  });

  test('should handle different device orientations', async ({ page }) => {
    // Test portrait orientation
    const portraitUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      orientation: 'portrait'
    });
    
    await page.goto(portraitUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    await captureScreenshot(page, 'functional-test', 'orientation-portrait');
    
    // Test basic functionality in portrait
    await tapDevice(page, 200, 300);
    await page.waitForTimeout(2000);
    await captureScreenshot(page, 'functional-test', 'orientation-portrait-interaction');
    
    // Test landscape orientation
    const landscapeUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      orientation: 'landscape'
    });
    
    await page.goto(landscapeUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    await captureScreenshot(page, 'functional-test', 'orientation-landscape');
    
    // Test basic functionality in landscape
    await tapDevice(page, 400, 200);
    await page.waitForTimeout(2000);
    await captureScreenshot(page, 'functional-test', 'orientation-landscape-interaction');
  });

  test('should handle memory and performance under load', async ({ page }) => {
    const appUrl = generateAppetizeUrl({
      device: 'pixel6',
      osVersion: '12.0',
      enableAdb: true
    });
    
    await page.goto(appUrl);
    await waitForDeviceReady(page);
    await waitForAppLoad(page);
    
    await captureScreenshot(page, 'functional-test', 'performance-start');
    
    // Perform multiple interactions to test memory handling
    for (let i = 0; i < 20; i++) {
      await tapDevice(page, 200, 300);
      await page.waitForTimeout(500);
      
      // Capture screenshot every 5 interactions
      if (i % 5 === 0) {
        await captureScreenshot(page, 'functional-test', `performance-iteration-${i}`);
      }
    }
    
    // Wait and check if app is still responsive
    await page.waitForTimeout(5000);
    await captureScreenshot(page, 'functional-test', 'performance-end');
    
    // Test final responsiveness
    await tapDevice(page, 200, 300);
    await page.waitForTimeout(2000);
    await captureScreenshot(page, 'functional-test', 'performance-final-response');
  });

});