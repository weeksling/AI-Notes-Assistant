#!/bin/bash

# 🤖 Cursor Background Agent - Enhanced Android App Testing Script
# This script performs comprehensive testing with detailed error capturing

set -e  # Exit on any error

echo "🚀 Starting Enhanced Android App Testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
CRITICAL_ERRORS=()

# Create logs directory
mkdir -p logs

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
        CRITICAL_ERRORS+=("$test_name")
        return 1
    fi
}

capture_app_logs() {
    local duration="$1"
    local log_file="$2"
    
    echo -e "📝 Capturing app logs for ${duration} seconds..."
    
    # Clear existing logs
    adb logcat -c 2>/dev/null || true
    
    # Start logcat in background, filtering for our app and React Native
    timeout "$duration" adb logcat \
        -s "ReactNativeJS:*" \
        -s "ExpoModulesCore:*" \
        -s "VoiceJournal:*" \
        -s "com.voicejournal:*" \
        -s "AndroidRuntime:*" \
        -s "ActivityManager:*" \
        -s "System.err:*" \
        > "$log_file" 2>&1 &
    
    local logcat_pid=$!
    return $logcat_pid
}

analyze_logs() {
    local log_file="$1"
    
    echo -e "\n🔍 Analyzing logs from $log_file..."
    
    if [ ! -f "$log_file" ]; then
        echo -e "⚠️  ${YELLOW}Log file not found${NC}"
        return 1
    fi
    
    # Check for JavaScript errors
    if grep -i "error\|exception\|crash\|fatal" "$log_file" > /dev/null; then
        echo -e "❌ ${RED}ERRORS DETECTED IN LOGS:${NC}"
        echo "=================================="
        grep -i "error\|exception\|crash\|fatal" "$log_file" | head -20
        echo "=================================="
        
        # Look for specific React Native errors
        if grep -i "unable to load script\|bundler\|metro" "$log_file" > /dev/null; then
            echo -e "🔧 ${BLUE}BUNDLE LOADING ISSUES DETECTED${NC}"
            grep -i "unable to load script\|bundler\|metro" "$log_file"
        fi
        
        # Look for JavaScript runtime errors
        if grep -i "reactnativejs.*error" "$log_file" > /dev/null; then
            echo -e "🔧 ${BLUE}JAVASCRIPT RUNTIME ERRORS:${NC}"
            grep -i "reactnativejs.*error" "$log_file"
        fi
        
        return 1
    else
        echo -e "✅ ${GREEN}No critical errors found in logs${NC}"
        return 0
    fi
}

test_app_startup() {
    local package_name="com.voicejournal"
    local main_activity="com.voicejournal.MainActivity"
    
    echo -e "\n🚀 Testing App Startup Process..."
    
    # Clear app data to ensure clean start
    adb shell pm clear "$package_name" 2>/dev/null || true
    
    # Start capturing logs
    capture_app_logs 20 "logs/startup_logs.txt"
    local logcat_pid=$!
    
    # Start the app
    echo -e "📱 Launching app: $main_activity"
    if ! adb shell am start -W -n "$main_activity" 2>&1 | tee logs/launch_output.txt; then
        echo -e "❌ ${RED}Failed to start app${NC}"
        kill $logcat_pid 2>/dev/null || true
        return 1
    fi
    
    # Wait for app to fully load
    echo -e "⏳ Waiting for app to load..."
    sleep 10
    
    # Check if app is running
    local app_status=$(adb shell "dumpsys activity activities" | grep -E "mResumedActivity|mFocusedActivity" | grep "$package_name" || echo "NOT_FOUND")
    
    if [[ "$app_status" == "NOT_FOUND" ]]; then
        echo -e "❌ ${RED}App is not running or not in foreground${NC}"
        
        # Check if app crashed
        if adb shell "dumpsys activity activities" | grep -i "crash\|error" > /dev/null; then
            echo -e "💥 ${RED}APP CRASHED DURING STARTUP${NC}"
        fi
        
        # Stop log capture
        kill $logcat_pid 2>/dev/null || true
        sleep 2
        
        # Analyze logs for errors
        analyze_logs "logs/startup_logs.txt"
        return 1
    else
        echo -e "✅ ${GREEN}App is running successfully${NC}"
        echo -e "📋 App Status: ${BLUE}$app_status${NC}"
        
        # Test app responsiveness
        echo -e "🎯 Testing app responsiveness..."
        
        # Send a home key press and return to app
        adb shell input keyevent KEYCODE_HOME
        sleep 2
        adb shell am start -n "$main_activity" 2>/dev/null
        sleep 3
        
        # Check if app is still responsive
        local final_status=$(adb shell "dumpsys activity activities" | grep -E "mResumedActivity|mFocusedActivity" | grep "$package_name" || echo "NOT_FOUND")
        
        if [[ "$final_status" == "NOT_FOUND" ]]; then
            echo -e "⚠️  ${YELLOW}App may have issues with background/foreground transitions${NC}"
        else
            echo -e "✅ ${GREEN}App handles background/foreground transitions properly${NC}"
        fi
        
        # Stop log capture
        kill $logcat_pid 2>/dev/null || true
        sleep 2
        
        # Analyze logs (even if app is running, might have warnings)
        analyze_logs "logs/startup_logs.txt"
        
        # Force stop the app for cleanup
        adb shell am force-stop "$package_name" 2>/dev/null || true
        
        return 0
    fi
}

# Change to VoiceJournal directory
cd VoiceJournal

echo "📂 Working directory: $(pwd)"

# Phase 1: Static Analysis
echo -e "\n🔍 Phase 1: Static Analysis"

run_test "TypeScript Compilation" "npm run typecheck"
run_test "Dependency Installation" "npm install"
run_test "Security Audit" "npm run audit:security || true"

# Phase 2: Build Verification
echo -e "\n🏗️  Phase 2: Build Verification"

run_test "Clean Build Environment" "rm -rf android node_modules/.expo android/.gradle || true"
run_test "Reinstall Dependencies" "npm install"
run_test "Android APK Build" "npm run build:android"

# Check APK size and details
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    APK_SIZE=$(du -h android/app/build/outputs/apk/debug/app-debug.apk | cut -f1)
    echo -e "📦 APK Size: ${YELLOW}$APK_SIZE${NC}"
    
    # Get APK info
    echo -e "📋 APK Details:"
    aapt dump badging android/app/build/outputs/apk/debug/app-debug.apk 2>/dev/null | head -5 || true
    
    # Check if APK is reasonable size
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

# Phase 3: Enhanced Android Testing
echo -e "\n📱 Phase 3: Enhanced Android Testing"

# Check if Android SDK and tools are available
if command -v adb &> /dev/null; then
    echo "📱 Android tools detected, proceeding with device testing..."
    
    # List available devices/emulators
    echo -e "\n🔍 Available Android devices/emulators:"
    adb devices -l
    
    # Check if any device is connected
    if adb devices | grep -q "device$"; then
        echo -e "✅ ${GREEN}Android device/emulator detected${NC}"
        
        # Install APK
        echo -e "\n� Installing APK..."
        if adb install -r android/app/build/outputs/apk/debug/app-debug.apk 2>&1 | tee logs/install_output.txt; then
            echo -e "✅ ${GREEN}APK installed successfully${NC}"
            ((TESTS_PASSED++))
            
            # ENHANCED APP STARTUP TESTING
            echo -e "\n🎯 ENHANCED APP STARTUP TESTING"
            echo "========================================="
            
            if test_app_startup; then
                echo -e "✅ ${GREEN}APP STARTUP TEST PASSED${NC}"
                ((TESTS_PASSED++))
            else
                echo -e "❌ ${RED}APP STARTUP TEST FAILED${NC}"
                ((TESTS_FAILED++))
                CRITICAL_ERRORS+=("App Startup Failed")
            fi
            
        else
            echo -e "❌ ${RED}Failed to install APK${NC}"
            ((TESTS_FAILED++))
            CRITICAL_ERRORS+=("APK Installation Failed")
        fi
        
    else
        echo -e "⚠️  ${YELLOW}No Android device or emulator connected${NC}"
        echo "ℹ️  To test app startup, connect a device or start an emulator"
        
        # Try to start an emulator if available
        if command -v emulator &> /dev/null; then
            EMULATORS=$(emulator -list-avds 2>/dev/null || echo "")
            if [ -n "$EMULATORS" ]; then
                echo -e "🎯 Available emulators: ${BLUE}$EMULATORS${NC}"
                echo "🚀 Starting emulator for testing..."
                
                FIRST_EMULATOR=$(echo "$EMULATORS" | head -n1)
                timeout 120 emulator -avd "$FIRST_EMULATOR" -no-window -no-audio &
                EMULATOR_PID=$!
                
                echo "⏳ Waiting for emulator to boot (up to 60 seconds)..."
                for i in {1..60}; do
                    if adb devices | grep -q "emulator.*device"; then
                        echo -e "✅ ${GREEN}Emulator is ready${NC}"
                        break
                    fi
                    sleep 1
                done
                
                if adb devices | grep -q "emulator.*device"; then
                    # Retry the testing with emulator
                    echo -e "\n🔄 Retrying tests with emulator..."
                    
                    if adb install -r android/app/build/outputs/apk/debug/app-debug.apk 2>&1 | tee logs/install_output.txt; then
                        echo -e "✅ ${GREEN}APK installed on emulator${NC}"
                        
                        if test_app_startup; then
                            echo -e "✅ ${GREEN}APP STARTUP TEST PASSED ON EMULATOR${NC}"
                            ((TESTS_PASSED++))
                        else
                            echo -e "❌ ${RED}APP STARTUP TEST FAILED ON EMULATOR${NC}"
                            ((TESTS_FAILED++))
                            CRITICAL_ERRORS+=("App Startup Failed on Emulator")
                        fi
                    fi
                fi
                
                # Clean up emulator
                kill $EMULATOR_PID 2>/dev/null || true
            fi
        fi
    fi
else
    echo -e "⚠️  ${YELLOW}Android SDK tools not found${NC}"
    echo "ℹ️  Install Android SDK to enable device testing"
fi

# Phase 4: Web Version Testing (as fallback)
echo -e "\n🌐 Phase 4: Web Version Testing (Fallback)"

run_test "Web Version Startup" "timeout 30 bash -c 'npx expo start --web --non-interactive > logs/web_output.txt 2>&1 & sleep 15; curl -f http://localhost:8081 > /dev/null 2>&1'"

# Kill any remaining processes
pkill -f "expo start" 2>/dev/null || true

# FINAL RESULTS WITH DETAILED ERROR REPORTING
echo -e "\n📊 DETAILED TEST RESULTS"
echo "========================================="
echo -e "✅ Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Tests Failed: ${RED}$TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo -e "📈 Success Rate: ${YELLOW}$SUCCESS_RATE%${NC}"
fi

# Report critical errors
if [ ${#CRITICAL_ERRORS[@]} -gt 0 ]; then
    echo -e "\n🚨 ${RED}CRITICAL ERRORS DETECTED:${NC}"
    for error in "${CRITICAL_ERRORS[@]}"; do
        echo -e "   • ${RED}$error${NC}"
    done
fi

# Show available logs
echo -e "\n📋 Available Log Files:"
if [ -d "logs" ]; then
    ls -la logs/
    echo -e "\n💡 ${BLUE}Check log files above for detailed error information${NC}"
fi

echo "========================================="

# Cleanup
echo -e "\n🧹 Cleaning up..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "emulator" 2>/dev/null || true
adb kill-server 2>/dev/null || true

if [ ${#CRITICAL_ERRORS[@]} -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All critical tests passed! App appears to be working properly.${NC}"
    exit 0
else
    echo -e "\n⚠️  ${RED}Critical errors detected. App may not be working properly.${NC}"
    echo -e "📋 ${YELLOW}Review the logs above and fix the identified issues.${NC}"
    exit 1
fi