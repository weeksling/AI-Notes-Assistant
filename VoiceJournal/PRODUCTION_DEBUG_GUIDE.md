# Production APK Debug Guide

## 🚨 Issue: Production APK Crashes Immediately

This guide outlines the debugging improvements added to help identify and resolve the immediate crash issue in the production APK.

## 🔧 Error Handling Improvements Added

### 1. Enhanced AudioRecorder Component
**File: `src/components/AudioRecorder.tsx`**

#### Improvements Made:
- **Comprehensive Permission Handling**: Better microphone permission checking with user-friendly error messages
- **Fallback Audio Settings**: If high-quality recording fails, automatically tries lower-quality settings
- **Error Logging**: All audio-related errors are now logged to AsyncStorage for debugging
- **UI Error Display**: Permission errors are shown directly in the interface
- **Defensive Programming**: Every async operation is wrapped in try-catch blocks

#### Key Features:
- Detects permission denial and guides users to device settings
- Handles audio mode setup failures gracefully
- Validates file selection with proper error messages
- Provides troubleshooting tips in the UI

### 2. Error Logging System
**Files: `src/services/ErrorHandler.ts`, `src/screens/ErrorReportScreen.tsx`**

#### Capabilities:
- **Automatic Error Capture**: JavaScript errors, promise rejections, and component errors
- **Persistent Storage**: All errors saved to AsyncStorage with timestamps
- **User-Accessible Reports**: Debug screen accessible via "🔧 Debug" button on home screen
- **Error Sharing**: Users can share detailed error logs for debugging
- **Error Classification**: Categorizes errors by type (audio, permission, component, etc.)

### 3. Navigation Integration
**Files: `src/navigation/AppNavigator.tsx`, `src/types/index.ts`**

#### Added:
- **Error Report Screen**: New navigation route for accessing error logs
- **Debug Button**: Small debug button on home screen for easy access

## 🔍 Debugging Steps for Users

### Step 1: Check for Logged Errors
1. Open the Voice Journal app
2. On the home screen, look for a small "🔧 Debug" button in the top-right corner
3. Tap the Debug button to access the Error Report screen
4. Review any logged errors for clues about the crash

### Step 2: Test Audio Recording Functionality
1. Navigate to the Record screen
2. Try to start a recording
3. Check if permission errors appear in the UI
4. If permission issues are shown, follow the on-screen guidance

### Step 3: Check Device Permissions
1. Go to device Settings
2. Find Apps → Voice Journal → Permissions
3. Ensure Microphone permission is enabled
4. Also check Storage/Files permission if available

### Step 4: Test File Selection
1. On the Record screen, try "Select Audio File"
2. Choose an audio file from your device
3. Check if file validation errors appear

## 🐛 Common Crash Causes & Solutions

### 1. Microphone Permission Issues
**Symptoms**: App crashes when trying to access microphone
**Solution**: 
- Enable microphone permissions in device settings
- Restart the app after enabling permissions

### 2. Audio System Conflicts
**Symptoms**: Crashes during recording initialization
**Solution**:
- Close other apps that might be using the microphone (voice recorders, video calls)
- Restart the device to clear audio system conflicts

### 3. Storage Permission Issues
**Symptoms**: Crashes when saving data
**Solution**:
- Ensure the app has storage permissions
- Check if device storage is full

### 4. Expo Module Loading Issues
**Symptoms**: Immediate crash on app start
**Solution**:
- Try clearing app data/cache
- Reinstall the APK
- Check if device supports the required Android version

## 📊 Error Log Analysis

### Error Types to Look For:
- **`audio`**: Problems with microphone/recording
- **`permission_denied`**: Permission-related issues
- **`component`**: React component errors
- **`javascript`**: General JavaScript errors
- **`promise`**: Unhandled promise rejections

### Important Error Contexts:
- **`permission_check`**: Permission system failures
- **`recording_creation`**: Audio recording initialization
- **`audio_mode_setup`**: Audio system configuration
- **`file_selection`**: Document picker issues

## 🚀 Testing the Fixes

### Manual Testing Steps:
1. **Install the updated APK**
2. **Test basic app launch** - should not crash immediately
3. **Test navigation** - verify all screens load
4. **Test audio recording** - check permission flow
5. **Test file selection** - verify document picker works
6. **Check error reports** - verify error logging is working

### Expected Behavior:
- App should launch successfully without immediate crashes
- Permission errors should be displayed in UI rather than causing crashes
- All errors should be logged and accessible via the Debug screen
- Users should see helpful error messages and troubleshooting tips

## 🔄 Next Steps If Issues Persist

### 1. Gather Error Logs
- Use the Debug screen to export error logs
- Share the error logs for further analysis

### 2. Test on Different Devices
- Try the APK on different Android devices
- Check if the issue is device-specific

### 3. Check Build Configuration
- Verify the APK was built with the latest code changes
- Ensure all dependencies are properly included

### 4. Native Debugging
- Use `adb logcat` to capture native Android logs
- Look for native crashes in the system logs

## 📝 Important Notes

- The error logging system stores up to 50 recent errors
- Error logs persist between app restarts
- The Debug button is intentionally small to not clutter the main UI
- All error handling is designed to be non-blocking (app continues running)

## 🆘 If App Still Crashes Immediately

If the app continues to crash before reaching the UI:
1. Use `adb logcat` during app launch to capture system logs
2. Check for native module initialization failures
3. Verify the APK was built correctly with all improvements
4. Test the debug APK first before testing the release APK

The improvements focus heavily on the most likely crash points (audio permissions, storage access, and component errors) while providing comprehensive logging for any issues that do occur.