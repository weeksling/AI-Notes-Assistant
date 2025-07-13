# 🍎 Appetize Integration - Cloud APK Testing

## Overview

This integration allows you to upload and test your Android APK on Appetize.io's cloud device emulation platform. This provides real device testing without needing local emulators.

## 🚀 Features

- **Cloud APK Upload**: Automatically upload APK to Appetize
- **Real Device Testing**: Test on actual Android devices in the cloud
- **Network Monitoring**: Capture network traffic and API calls
- **UI Automation**: Automated testing with Playwright
- **Error Logging**: Capture app crashes and errors
- **Session Recording**: Record testing sessions for debugging

## 📋 Prerequisites

1. **Appetize Account**: Sign up at [appetize.io](https://appetize.io)
2. **API Key**: Get your API key from Appetize dashboard
3. **Node.js**: For running the test scripts

## 🔧 Setup

### 1. Install Dependencies

```bash
cd VoiceJournal
npm install --save-dev @playwright/test appetize-playwright
```

### 2. Configure API Key

Create a `.env` file in the VoiceJournal directory:

```env
APPETIZE_API_KEY=your_api_key_here
```

### 3. Add to .gitignore

```gitignore
.env
appetize-sessions/
```

## 📱 Usage

### Upload APK to Appetize

```bash
# Upload latest APK
./scripts/appetize-upload.js

# Upload specific APK
./scripts/appetize-upload.js releases/VoiceJournal-v1.2-ErrorHandling-UPDATED.apk
```

### Run Tests on Appetize

```bash
# Run basic startup tests
./scripts/appetize-test.js

# Run full test suite
./scripts/appetize-test.js --full

# Run with network monitoring
./scripts/appetize-test.js --network
```

### Manual Testing

```bash
# Get public URL for manual testing
./scripts/appetize-info.js
```

## 🧪 Test Cases

### Basic Tests
- ✅ App launches without crash
- ✅ Home screen loads
- ✅ Debug button is visible
- ✅ Navigation works

### Error Handling Tests
- ✅ Permission dialogs handled gracefully
- ✅ Audio errors don't crash app
- ✅ Error logging works
- ✅ Debug interface accessible

### Network Tests
- ✅ API calls monitored
- ✅ No unauthorized requests
- ✅ Error responses handled

## 📊 Reports

Test results are saved to:
- `appetize-sessions/` - Session recordings
- `test-results/` - Test reports
- `logs/` - Error logs

## 🔗 Links

- [Appetize Documentation](https://docs.appetize.io)
- [Playwright for Mobile](https://playwright.dev/docs/mobile)
- [JavaScript SDK](https://docs.appetize.io/javascript-sdk)

## 🎯 Example Test Output

```
🚀 Starting Appetize Test Suite...
📱 Uploading APK to Appetize...
✅ APK uploaded successfully: https://appetize.io/app/abc123
🧪 Running tests on Android device...
✅ App launches without crash
✅ Home screen loads in 3.2s
✅ Debug button visible
✅ Navigation works correctly
✅ Error handling functional
📊 Test Results: 5/5 passed
🔗 Session URL: https://appetize.io/app/abc123?session=xyz789
```

## 🛠️ Configuration

### appetize.config.js

```javascript
module.exports = {
  apiKey: process.env.APPETIZE_API_KEY,
  platform: 'android',
  osVersion: '11.0',
  device: 'nexus5',
  timeout: 30000,
  networking: {
    proxy: 'intercept',
    allowList: ['*'],
    denyList: []
  },
  automation: {
    enabled: true,
    framework: 'playwright'
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **API Key Issues**
   - Verify API key is correct
   - Check account limits

2. **Upload Failures**
   - Ensure APK is valid
   - Check file size limits

3. **Test Failures**
   - Review session recordings
   - Check network logs

### Debug Commands

```bash
# Check Appetize status
curl -H "X-API-KEY: $APPETIZE_API_KEY" https://api.appetize.io/v1/apps

# Download session logs
./scripts/appetize-logs.js session_id
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
- name: Test APK on Appetize
  env:
    APPETIZE_API_KEY: ${{ secrets.APPETIZE_API_KEY }}
  run: |
    ./scripts/appetize-upload.js
    ./scripts/appetize-test.js
```

### Manual Integration

```bash
# Build -> Upload -> Test workflow
npm run build:android
./scripts/appetize-upload.js
./scripts/appetize-test.js --full
```

This integration provides cloud-based testing without requiring local Android emulators, making it perfect for CI/CD environments and comprehensive APK testing.