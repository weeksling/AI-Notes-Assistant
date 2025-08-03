package com.voicejournal.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class CrashReportModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "CrashReportModule"
    }
    
    @ReactMethod
    fun getNativeCrashLogs(promise: Promise) {
        try {
            val crashHandler = CrashHandler.getInstance(reactApplicationContext)
            val crashLogs = crashHandler.getCrashLogs()
            promise.resolve(crashLogs)
        } catch (e: Exception) {
            promise.reject("ERROR_GETTING_CRASH_LOGS", "Failed to get crash logs", e)
        }
    }
    
    @ReactMethod
    fun clearNativeCrashLogs(promise: Promise) {
        try {
            val crashHandler = CrashHandler.getInstance(reactApplicationContext)
            crashHandler.clearCrashLogs()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_CLEARING_CRASH_LOGS", "Failed to clear crash logs", e)
        }
    }
}