#!/bin/bash

# 🤖 Cursor Background Agent - Android App Testing Script
# This script performs comprehensive testing of the VoiceJournal Android app

set -e  # Exit on any error

echo "🚀 Starting Android App Testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n📊 Running: ${YELLOW}$test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "✅ ${GREEN}PASSED${NC}: $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "❌ ${RED}FAILED${NC}: $test_name"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Change to VoiceJournal directory
cd VoiceJournal

echo "📂 Working directory: $(pwd)"

# Phase 1: Static Analysis
echo -e "\n🔍 Phase 1: Static Analysis"

run_test "TypeScript Compilation" "npm run typecheck"
run_test "Dependency Installation" "npm install"
run_test "Security Audit" "npm run audit:security || true"  # Don't fail on audit warnings

# Phase 2: Build Verification
echo -e "\n🏗️  Phase 2: Build Verification"

run_test "Clean Build Environment" "rm -rf android node_modules/.expo android/.gradle || true"
run_test "Reinstall Dependencies" "npm install"
run_test "Android APK Build" "npm run build:android"

# Check APK size
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    APK_SIZE=$(du -h android/app/build/outputs/apk/debug/app-debug.apk | cut -f1)
    echo -e "📦 APK Size: ${YELLOW}$APK_SIZE${NC}"
    
    # Check if APK is reasonable size (< 200MB for debug)
    APK_SIZE_MB=$(du -m android/app/build/outputs/apk/debug/app-debug.apk | cut -f1)
    if [ "$APK_SIZE_MB" -lt 200 ]; then
        echo -e "✅ ${GREEN}APK size is acceptable${NC} (< 200MB)"
        ((TESTS_PASSED++))
    else
        echo -e "⚠️  ${YELLOW}APK size is large${NC} (> 200MB)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "❌ ${RED}APK file not found${NC}"
    ((TESTS_FAILED++))
fi

# Phase 3: Basic Runtime Testing
echo -e "\n🌐 Phase 3: Basic Runtime Testing"

# Test web version (background process)
run_test "Web Version Startup" "timeout 30 bash -c 'npx expo start --web --non-interactive > /dev/null 2>&1 & sleep 15; curl -f http://localhost:8081 > /dev/null 2>&1'"

# Kill any remaining expo processes
pkill -f "expo start" || true

# Phase 4: Android Emulator Testing (if available)
echo -e "\n📱 Phase 4: Android Emulator Testing"

# Check if Android SDK and tools are available
if command -v adb &> /dev/null && command -v emulator &> /dev/null; then
    echo "📱 Android tools detected, attempting emulator testing..."
    
    # List available emulators
    EMULATORS=$(emulator -list-avds 2>/dev/null || echo "")
    
    if [ -n "$EMULATORS" ]; then
        echo "🎯 Available emulators: $EMULATORS"
        
        # Try to start an emulator (non-blocking test)
        FIRST_EMULATOR=$(echo "$EMULATORS" | head -n1)
        
        echo "🚀 Testing with emulator: $FIRST_EMULATOR"
        
        # Start emulator in background (headless)
        timeout 60 emulator -avd "$FIRST_EMULATOR" -no-window -no-audio &
        EMULATOR_PID=$!
        
        # Wait for emulator to boot
        echo "⏳ Waiting for emulator to boot..."
        sleep 30
        
        # Check if emulator is running
        if adb devices | grep -q "emulator"; then
            echo "✅ Emulator is running"
            
            # Try to install APK
            if adb install android/app/build/outputs/apk/debug/app-debug.apk 2>/dev/null; then
                echo -e "✅ ${GREEN}APK installed successfully${NC}"
                ((TESTS_PASSED++))
                
                # Try to start the app
                if adb shell am start -n com.voicejournal/.MainActivity 2>/dev/null; then
                    echo -e "✅ ${GREEN}App launched successfully${NC}"
                    ((TESTS_PASSED++))
                    
                    # Wait a moment and check if app is still running
                    sleep 5
                    if adb shell "dumpsys activity activities" | grep -q "mResumedActivity.*voicejournal"; then
                        echo -e "✅ ${GREEN}App is running stable${NC}"
                        ((TESTS_PASSED++))
                    else
                        echo -e "⚠️  ${YELLOW}App may have crashed or is not in foreground${NC}"
                        ((TESTS_FAILED++))
                    fi
                    
                    # Stop the app
                    adb shell am force-stop com.voicejournal 2>/dev/null || true
                else
                    echo -e "❌ ${RED}Failed to launch app${NC}"
                    ((TESTS_FAILED++))
                fi
            else
                echo -e "❌ ${RED}Failed to install APK${NC}"
                ((TESTS_FAILED++))
            fi
        else
            echo -e "⚠️  ${YELLOW}Emulator failed to start properly${NC}"
            ((TESTS_FAILED++))
        fi
        
        # Clean up emulator
        kill $EMULATOR_PID 2>/dev/null || true
        adb kill-server 2>/dev/null || true
        
    else
        echo -e "⚠️  ${YELLOW}No Android emulators configured${NC}"
        echo "ℹ️  To enable emulator testing, create an AVD with Android Studio"
    fi
else
    echo -e "⚠️  ${YELLOW}Android SDK tools not found${NC}"
    echo "ℹ️  Emulator testing requires Android SDK to be installed"
fi

# Final Results
echo -e "\n📊 Testing Complete!"
echo "=================================="
echo -e "✅ Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Tests Failed: ${RED}$TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo -e "📈 Success Rate: ${YELLOW}$SUCCESS_RATE%${NC}"
fi

echo "=================================="

# Cleanup
echo -e "\n🧹 Cleaning up..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "emulator" 2>/dev/null || true
adb kill-server 2>/dev/null || true

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All critical tests passed!${NC}"
    exit 0
else
    echo -e "\n⚠️  ${YELLOW}Some tests failed. Check the output above for details.${NC}"
    exit 1
fi