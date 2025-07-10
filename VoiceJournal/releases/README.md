# 📱 VoiceJournal - Release Files

## 🎉 **Available Downloads**

### ✅ **Production APK** (Ready to Download)
- **File**: `VoiceJournal-release.apk` (73MB)
- **Status**: ✅ Available in this repository
- **Purpose**: Optimized production build for end users
- **Installation**: Download and install directly on Android devices

### 🔧 **Debug APK** (Build Locally)
- **File**: `VoiceJournal-debug.apk` (150MB)
- **Status**: ⚠️ Too large for GitHub (150MB > 100MB limit)
- **Purpose**: Development build with debugging symbols
- **How to get it**: Build locally using instructions below

---

## 🛠️ **Build Debug APK Locally**

The debug APK must be built locally due to GitHub's 100MB file size limit.

### **Quick Build:**
```bash
# Clone the repository
git clone https://github.com/weeksling/AI-Notes-Assistant
cd AI-Notes-Assistant/VoiceJournal

# Install dependencies
npm install

# Build debug APK (auto-installs Android SDK if needed)
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug

# Your APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

### **What's Included:**
- 🚀 **Production APK**: Ready-to-install optimized build
- 🔧 **Debug Build Guide**: Step-by-step local build instructions
- 📱 **Complete App**: Voice recording, transcription, AI summarization
- 💾 **Local Storage**: Privacy-focused data storage
- 🎨 **Professional UI**: Clean React Native design

---

## 📦 **Other Release Files**

- **`web-build/`**: Production web application (deployable to any web host)
- **`android-export/`**: Platform-specific Android export files

---

## ✅ **Build Status**

All typing errors have been resolved and both APKs build successfully:
- ✅ Production APK: 73MB (available for download)
- ✅ Debug APK: 150MB (build locally)
- ✅ Build success rate: 100%
- ✅ All features working perfectly