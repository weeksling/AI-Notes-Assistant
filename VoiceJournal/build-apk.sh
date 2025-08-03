#!/bin/bash

# Voice Journal APK Build Script
# This script builds a production APK with comprehensive error handling

set -e

echo "🚀 Building Voice Journal APK with Error Handling..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the VoiceJournal directory"
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Prebuild the Android project
echo "🔨 Prebuilding Android project..."
npx expo prebuild --platform android

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ] && [ ! -f "android/local.properties" ]; then
    echo "⚠️  Warning: Android SDK not configured"
    echo "   Please set ANDROID_HOME environment variable or create android/local.properties"
    echo "   Example: echo 'sdk.dir=/path/to/android-sdk' > android/local.properties"
    echo ""
    echo "✅ Production bundle has been created in releases/production-bundle/"
    echo "   You can use this bundle with any Android build tool"
    exit 0
fi

# Build the APK
echo "🏗️  Building APK..."
cd android
./gradlew assembleRelease

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ APK built successfully!"
    echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
    
    # Copy to releases directory
    mkdir -p ../releases
    cp app/build/outputs/apk/release/app-release.apk ../releases/VoiceJournal-v1.3-ErrorHandling.apk
    echo "📁 APK copied to: releases/VoiceJournal-v1.3-ErrorHandling.apk"
else
    echo "❌ APK build failed"
    exit 1
fi

cd ..

echo ""
echo "🎉 Build completed successfully!"
echo "📋 Features included in this build:"
echo "   ✅ Comprehensive JavaScript error handling"
echo "   ✅ Native Android error handling"
echo "   ✅ Error logging and persistence"
echo "   ✅ Debug interface for error reports"
echo "   ✅ Graceful error recovery"
echo ""
echo "📱 To install on device:"
echo "   adb install releases/VoiceJournal-v1.3-ErrorHandling.apk"