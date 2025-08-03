package com.voicejournal.app

import android.content.SharedPreferences
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class NativeErrorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MODULE_NAME = "NativeErrorModule"
        private const val ERROR_LOG_PREF = "native_error_logs"
    }

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun getNativeErrorLogs(promise: Promise) {
        try {
            val prefs: SharedPreferences = reactApplicationContext.getSharedPreferences("VoiceJournalPrefs", 0)
            val logsJson = prefs.getString(ERROR_LOG_PREF, "[]")
            
            if (logsJson != null) {
                val jsonArray = JSONArray(logsJson)
                val writableArray = Arguments.createArray()
                
                for (i in 0 until jsonArray.length()) {
                    val errorObj = jsonArray.getJSONObject(i)
                    val writableMap = Arguments.createMap()
                    
                    writableMap.putString("timestamp", errorObj.optString("timestamp", ""))
                    writableMap.putString("context", errorObj.optString("context", ""))
                    writableMap.putString("message", errorObj.optString("message", ""))
                    writableMap.putString("stackTrace", errorObj.optString("stackTrace", ""))
                    writableMap.putString("type", errorObj.optString("type", "native"))
                    
                    writableArray.pushMap(writableMap)
                }
                
                promise.resolve(writableArray)
            } else {
                promise.resolve(Arguments.createArray())
            }
        } catch (e: Exception) {
            promise.reject("ERROR_GETTING_LOGS", "Failed to get native error logs", e)
        }
    }

    @ReactMethod
    fun clearNativeErrorLogs(promise: Promise) {
        try {
            val prefs: SharedPreferences = reactApplicationContext.getSharedPreferences("VoiceJournalPrefs", 0)
            prefs.edit().remove(ERROR_LOG_PREF).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_CLEARING_LOGS", "Failed to clear native error logs", e)
        }
    }

    @ReactMethod
    fun logNativeError(context: String, message: String, stackTrace: String, promise: Promise) {
        try {
            val prefs: SharedPreferences = reactApplicationContext.getSharedPreferences("VoiceJournalPrefs", 0)
            val existingLogs = prefs.getString(ERROR_LOG_PREF, "[]")
            
            val logsArray = JSONArray(existingLogs)
            val newError = JSONObject().apply {
                put("timestamp", System.currentTimeMillis())
                put("context", context)
                put("message", message)
                put("stackTrace", stackTrace)
                put("type", "native")
            }
            
            logsArray.put(newError)
            
            // Keep only last 20 errors
            val finalArray = JSONArray()
            val startIndex = maxOf(0, logsArray.length() - 20)
            for (i in startIndex until logsArray.length()) {
                finalArray.put(logsArray.get(i))
            }
            
            prefs.edit().putString(ERROR_LOG_PREF, finalArray.toString()).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_LOGGING", "Failed to log native error", e)
        }
    }
}