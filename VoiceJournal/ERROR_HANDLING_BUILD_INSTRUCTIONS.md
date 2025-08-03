# Error Handling Implementation & Build Instructions

## Overview
This branch contains comprehensive error handling for the VoiceJournal Android app, including:
- React Error Boundary for JavaScript errors
- Native Android crash handler for native crashes
- Persistent error logging that survives app crashes
- React Native bridge to access native crash logs

## Building the APK

Since the APK files are too large for GitHub (73MB for release, 150MB for debug), you'll need to build them locally.

### Prerequisites
1. Node.js and npm installed
2. Android SDK (or use Docker as described below)
3. Git

### Build Steps

1. **Clone the repository and checkout this branch:**
   ```bash
   git clone https://github.com/weeksling/AI-Notes-Assistant.git
   cd AI-Notes-Assistant/VoiceJournal
   git checkout cursor/debug-android-app-crash-and-build-releases-5e9c
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the APK:**
   
   **Option A - Using the build script (recommended):**
   ```bash
   chmod +x build-apk.sh
   ./build-apk.sh
   ```
   
   **Option B - Manual build:**
   ```bash
   # Fix gradle issues
   chmod +x fix-gradle-plugins.sh
   ./fix-gradle-plugins.sh
   
   # Prebuild with Expo
   npx expo prebuild --platform android
   
   # Build release APK
   cd android
   ./gradlew assembleRelease
   
   # Or build debug APK
   ./gradlew assembleDebug
   ```

4. **Find your APK:**
   - Release APK: `android/app/build/outputs/apk/release/app-release.apk`
   - Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`

### Using Docker (if you don't have Android SDK)

A Dockerfile is provided in the root directory that includes all necessary dependencies:

```bash
# From the repository root
docker build -t voicejournal-build .
docker run -it -v $(pwd):/app voicejournal-build

# Inside the container
cd /app/VoiceJournal
./build-apk.sh
```

## Error Handling Features

### 1. JavaScript Error Handling
- Global error handlers for unhandled errors and promise rejections
- React Error Boundary wrapping the entire app
- Errors stored in AsyncStorage

### 2. Native Android Crash Handling
- Custom UncaughtExceptionHandler in Kotlin
- Crash logs stored in SharedPreferences
- Survives app crashes and restarts
- Includes device info, stack traces, and timestamps

### 3. Error Viewing
- Navigate to Error Reports screen in the app
- Shows both JavaScript and native errors
- Detailed stack traces and device information
- Ability to clear error logs

### 4. Debugging Crash on Startup
If the app crashes immediately:
1. Install the debug APK for more verbose logging
2. Use `adb logcat` to see crash logs
3. Check the Error Reports screen after the app successfully starts
4. Native crashes are persisted and will be available on next successful launch

## Notes
- The release APK is optimized and smaller (~73MB)
- The debug APK includes additional debugging tools (~150MB)
- Both APKs include comprehensive error handling
- Errors are limited to the last 50 to prevent storage issues