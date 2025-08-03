#!/bin/bash

# Build script for VoiceJournal with enhanced error handling

set -e

echo "🚀 Building VoiceJournal APK with enhanced error handling..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to handle errors
handle_error() {
    echo -e "${RED}❌ Build failed at: $1${NC}"
    exit 1
}

# Trap errors
trap 'handle_error $LINENO' ERR

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the VoiceJournal directory.${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install || handle_error "npm install"
fi

# Set Android SDK path
export ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-/workspace/android-sdk}
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/cmdline-tools/bin:$ANDROID_SDK_ROOT/platform-tools

# Update local.properties
echo "sdk.dir=$ANDROID_SDK_ROOT" > android/local.properties

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
if [ -d "android/app/build" ]; then
    rm -rf android/app/build
fi

# Prebuild with Expo
echo -e "${YELLOW}📱 Running Expo prebuild...${NC}"
npx expo prebuild --platform android || handle_error "expo prebuild"

# Build release APK
echo -e "${YELLOW}🔨 Building release APK...${NC}"
cd android

# Try to build with Gradle
if ./gradlew assembleRelease; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    
    # Find the APK
    APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
    
    if [ -n "$APK_PATH" ]; then
        echo -e "${GREEN}📦 APK built successfully: $APK_PATH${NC}"
        
        # Copy to releases folder
        mkdir -p ../releases
        cp "$APK_PATH" "../releases/VoiceJournal-$(date +%Y%m%d-%H%M%S).apk"
        echo -e "${GREEN}✅ APK copied to releases folder${NC}"
    else
        echo -e "${RED}❌ APK file not found${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Gradle build failed${NC}"
    
    # Try to build debug APK as fallback
    echo -e "${YELLOW}🔧 Attempting debug build as fallback...${NC}"
    if ./gradlew assembleDebug; then
        echo -e "${YELLOW}⚠️  Debug build successful (release build failed)${NC}"
        
        # Find the debug APK
        DEBUG_APK_PATH=$(find app/build/outputs/apk/debug -name "*.apk" | head -1)
        
        if [ -n "$DEBUG_APK_PATH" ]; then
            echo -e "${GREEN}📦 Debug APK built: $DEBUG_APK_PATH${NC}"
            
            # Copy to releases folder
            mkdir -p ../releases
            cp "$DEBUG_APK_PATH" "../releases/VoiceJournal-debug-$(date +%Y%m%d-%H%M%S).apk"
            echo -e "${GREEN}✅ Debug APK copied to releases folder${NC}"
        fi
    else
        echo -e "${RED}❌ Both release and debug builds failed${NC}"
        exit 1
    fi
fi

cd ..

echo -e "${GREEN}🎉 Build process completed!${NC}"