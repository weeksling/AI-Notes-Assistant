// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Appetize.io Testing
 * 
 * This configuration is optimized for testing Android apps through Appetize.io
 * cloud emulation platform.
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: './test-results/html-report' }],
    ['json', { outputFile: './test-results/test-results.json' }],
    ['line']
  ],
  
  use: {
    // Base URL for Appetize.io
    baseURL: 'https://appetize.io',
    
    // Trace configuration for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 30000,
    navigationTimeout: 60000,
    
    // Browser settings optimized for Appetize.io
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  // Test timeout settings
  timeout: 120000, // 2 minutes per test
  expect: {
    timeout: 30000
  },

  // Environment-specific configurations
  projects: [
    {
      name: 'appetize-android',
      use: {
        ...devices['Desktop Chrome'],
        // Appetize.io specific settings
        extraHTTPHeaders: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      },
    },
    {
      name: 'appetize-ios',
      use: {
        ...devices['Desktop Chrome'],
        // iOS specific settings if needed
      },
    },
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./tests/setup/global-setup.js'),
  globalTeardown: require.resolve('./tests/setup/global-teardown.js'),

  // Output directories
  outputDir: './test-results',
  
  // Web server for local development
  webServer: process.env.NODE_ENV === 'development' ? {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  } : undefined,
});