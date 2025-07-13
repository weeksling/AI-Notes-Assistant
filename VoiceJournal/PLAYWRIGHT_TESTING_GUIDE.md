# 🎭 Playwright Testing with Appetize.io

## Overview

This guide covers the comprehensive Playwright testing setup for VoiceJournal app using Appetize.io cloud emulation. The testing framework provides automated testing on real Android devices without requiring local emulators.

## 🚀 Features

- **Cloud Device Testing**: Test on real Android devices via Appetize.io
- **Comprehensive Test Suites**: Smoke, functional, and performance tests
- **Automated Reporting**: HTML reports, JSON results, and test analytics
- **Error Handling**: Automatic crash detection and logging
- **Screenshot Capture**: Visual test evidence and debugging
- **Network Monitoring**: Track API calls and network behavior
- **Performance Metrics**: Startup time and responsiveness testing

## 📋 Prerequisites

1. **Node.js**: Version 14 or higher
2. **Appetize.io Account**: Sign up at [appetize.io](https://appetize.io)
3. **API Key**: Your Appetize.io API key (already configured)
4. **Uploaded App**: APK must be uploaded to Appetize.io

## 🔧 Setup

### 1. Install Dependencies

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npm run playwright:install
```

### 3. Environment Configuration

The `.env` file is already configured with your API key:

```env
APPETIZE_API_KEY=tok_tka3maf57c5zuqdat64vyqmteq
```

## 🏃 Running Tests

### Quick Start

```bash
# Run a quick smoke test
npm run test:quick

# Run all smoke tests
npm run test:smoke

# Run functional tests
npm run test:functional

# Run all tests
npm test
```

### Advanced Options

```bash
# Run tests with browser visible
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run performance tests only
npm run test:performance
```

### Manual Test Runner

```bash
# Show available options
node tests/utils/test-runner.js --help

# Run specific test with options
node tests/utils/test-runner.js smoke --headed --workers=1
```

## 📊 Test Suites

### 1. Smoke Tests (`smoke.test.js`)

Basic functionality and stability tests:

- ✅ **App Launch**: Verify app loads successfully
- ✅ **Crash Detection**: Ensure no crashes during startup
- ✅ **UI Elements**: Check main interface is displayed
- ✅ **Device Rotation**: Test portrait/landscape modes
- ✅ **Permissions**: Handle app permissions gracefully
- ✅ **Background/Foreground**: App lifecycle testing
- ✅ **Network Connectivity**: Basic network functionality
- ✅ **Device Controls**: Back button, home button handling
- ✅ **Performance**: Startup time and responsiveness

### 2. Functional Tests (`voicejournal.test.js`)

Feature-specific testing:

- ✅ **Main Interface**: Verify app UI is displayed
- ✅ **Voice Recording**: Test microphone permissions
- ✅ **Navigation**: Screen navigation and transitions
- ✅ **Text Input**: Keyboard and input field handling
- ✅ **State Persistence**: Data preservation across sessions
- ✅ **Error Handling**: Graceful error recovery
- ✅ **Device Orientations**: Portrait and landscape testing
- ✅ **Memory Management**: Performance under load

### 3. Performance Tests

- ⚡ **Startup Time**: App launch performance
- ⚡ **Memory Usage**: Resource consumption monitoring
- ⚡ **UI Responsiveness**: Interaction response times
- ⚡ **Network Performance**: API call timing

## 📁 Test Structure

```
VoiceJournal/
├── tests/
│   ├── e2e/
│   │   ├── smoke.test.js          # Basic functionality tests
│   │   └── voicejournal.test.js   # Feature-specific tests
│   ├── setup/
│   │   ├── global-setup.js        # Test environment setup
│   │   └── global-teardown.js     # Cleanup and reporting
│   └── utils/
│       ├── appetize-utils.js      # Appetize.io helper functions
│       └── test-runner.js         # Test execution management
├── test-results/                  # Test outputs and reports
├── playwright.config.js           # Playwright configuration
└── .env                          # Environment variables
```

## 📈 Test Results

### Reports Generated

1. **HTML Report**: Interactive test results
   - Location: `test-results/html-report/index.html`
   - Access via: `npm run playwright:report`

2. **JSON Results**: Machine-readable test data
   - Location: `test-results/test-results.json`

3. **Screenshots**: Visual evidence of tests
   - Location: `test-results/*.png`

4. **Crash Reports**: Error analysis
   - Location: `test-results/crash-*.json`

### Viewing Results

```bash
# Open HTML report
npm run playwright:report

# View latest results
ls -la test-results/
```

## 🔍 Test Configuration

### Playwright Configuration

Key settings in `playwright.config.js`:

```javascript
{
  testDir: './tests',
  timeout: 120000,        // 2 minutes per test
  retries: 2,            // Retry failed tests
  use: {
    baseURL: 'https://appetize.io',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
}
```

### Appetize.io Configuration

Default device settings:

```javascript
{
  device: 'pixel6',
  osVersion: '12.0',
  orientation: 'portrait',
  enableAdb: true,
  enableNetwork: true
}
```

## 🛠️ Customization

### Adding New Tests

1. Create test file in `tests/e2e/`
2. Use existing utilities from `appetize-utils.js`
3. Follow the established patterns:

```javascript
const { test, expect } = require('@playwright/test');
const { generateAppetizeUrl, waitForDeviceReady } = require('../utils/appetize-utils');

test('my new test', async ({ page }) => {
  const appUrl = generateAppetizeUrl({ device: 'pixel6' });
  await page.goto(appUrl);
  await waitForDeviceReady(page);
  
  // Your test logic here
});
```

### Modifying Device Settings

Edit `appetize-utils.js` to change default device configuration:

```javascript
function generateAppetizeUrl(options = {}) {
  const params = new URLSearchParams({
    device: options.device || 'pixel7',      // Change device
    osVersion: options.osVersion || '13.0',  // Change OS
    // ... other settings
  });
}
```

## 🐛 Debugging

### Common Issues

1. **Device Not Ready**: Increase timeout in `waitForDeviceReady()`
2. **App Not Loading**: Check APK is uploaded and accessible
3. **Permission Dialogs**: Update permission handling in tests
4. **Network Issues**: Verify API key and connectivity

### Debug Mode

```bash
# Run with debug mode
npm run test:debug

# Run specific test with debugging
node tests/utils/test-runner.js smoke --debug --headed
```

### Debugging Features

- **Screenshots**: Captured on failure
- **Video Recording**: Test execution recording
- **Traces**: Detailed execution traces
- **Console Logs**: Real-time test output
- **Device Logs**: Android device logs

## 📊 Best Practices

### Writing Tests

1. **Use Descriptive Names**: Clear test descriptions
2. **Handle Async Operations**: Proper awaiting of operations
3. **Screenshot Evidence**: Capture key test states
4. **Error Handling**: Graceful failure handling
5. **Timeouts**: Appropriate timeout values

### Test Organization

1. **Group Related Tests**: Use `test.describe()` blocks
2. **Setup/Teardown**: Use `beforeEach/afterEach`
3. **Utility Functions**: Reuse common operations
4. **Data-Driven Tests**: Parameterize test data

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Appetize.io Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run playwright:install
      - run: npm run test:smoke
        env:
          APPETIZE_API_KEY: ${{ secrets.APPETIZE_API_KEY }}
```

## 🎯 Testing Strategy

### Test Pyramid

1. **Smoke Tests** (Fast): Basic functionality verification
2. **Functional Tests** (Medium): Feature-specific testing
3. **Performance Tests** (Slow): Resource and timing validation

### Test Execution

1. **Development**: Run `npm run test:quick` for rapid feedback
2. **Pre-commit**: Run `npm run test:smoke` before committing
3. **CI/CD**: Run `npm test` in continuous integration
4. **Release**: Run full test suite with performance tests

## 📞 Support

### Getting Help

1. **Documentation**: Check this guide and inline comments
2. **Logs**: Review test output and screenshots
3. **Appetize.io Docs**: [appetize.io documentation](https://docs.appetize.io)
4. **Playwright Docs**: [playwright.dev](https://playwright.dev)

### Common Commands

```bash
# Quick verification
npm run test:quick

# Full test suite
npm test

# Debug failing test
npm run test:debug

# View test report
npm run playwright:report

# Check test runner options
node tests/utils/test-runner.js --help
```

## 🚀 Next Steps

1. **Run Initial Tests**: Start with `npm run test:quick`
2. **Review Results**: Check screenshots and reports
3. **Customize Tests**: Add app-specific test scenarios
4. **Integrate CI/CD**: Add to your deployment pipeline
5. **Monitor Results**: Track test performance over time

---

**Happy Testing!** 🎉

The testing framework is ready to use and provides comprehensive coverage for your VoiceJournal app on Appetize.io. Start with the quick test to verify everything works, then expand to the full test suite as needed.