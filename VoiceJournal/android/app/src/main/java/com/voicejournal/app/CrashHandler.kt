package com.voicejournal.app

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.*

class CrashHandler private constructor(private val context: Context) : Thread.UncaughtExceptionHandler {
    
    companion object {
        private const val TAG = "VoiceJournalCrash"
        private const val CRASH_PREFS = "voice_journal_crashes"
        private const val CRASH_LOGS_KEY = "crash_logs"
        private const val MAX_CRASH_LOGS = 10
        
        @Volatile
        private var INSTANCE: CrashHandler? = null
        
        fun getInstance(context: Context): CrashHandler {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: CrashHandler(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    private val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
    private val prefs: SharedPreferences = context.getSharedPreferences(CRASH_PREFS, Context.MODE_PRIVATE)
    
    init {
        Thread.setDefaultUncaughtExceptionHandler(this)
    }
    
    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        try {
            // Log the crash
            Log.e(TAG, "Uncaught exception in thread ${thread.name}", throwable)
            
            // Save crash details
            saveCrashLog(thread, throwable)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling uncaught exception", e)
        } finally {
            // Call the default handler
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }
    
    private fun saveCrashLog(thread: Thread, throwable: Throwable) {
        try {
            val crashLog = JSONObject().apply {
                put("id", "crash_${System.currentTimeMillis()}_${UUID.randomUUID()}")
                put("timestamp", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date()))
                put("type", "native")
                put("thread", thread.name)
                put("message", throwable.message ?: "Unknown crash")
                put("className", throwable.javaClass.name)
                put("stackTrace", getStackTraceString(throwable))
                
                // Add device info
                put("device", JSONObject().apply {
                    put("manufacturer", android.os.Build.MANUFACTURER)
                    put("model", android.os.Build.MODEL)
                    put("androidVersion", android.os.Build.VERSION.RELEASE)
                    put("sdkInt", android.os.Build.VERSION.SDK_INT)
                })
            }
            
            // Get existing logs
            val existingLogsJson = prefs.getString(CRASH_LOGS_KEY, "[]")
            val existingLogs = JSONArray(existingLogsJson)
            
            // Add new log at the beginning
            val newLogs = JSONArray()
            newLogs.put(crashLog)
            
            // Add existing logs up to MAX_CRASH_LOGS - 1
            val limit = minOf(existingLogs.length(), MAX_CRASH_LOGS - 1)
            for (i in 0 until limit) {
                newLogs.put(existingLogs.getJSONObject(i))
            }
            
            // Save to SharedPreferences
            prefs.edit().putString(CRASH_LOGS_KEY, newLogs.toString()).apply()
            
            Log.d(TAG, "Crash log saved: ${crashLog.getString("id")}")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save crash log", e)
        }
    }
    
    private fun getStackTraceString(throwable: Throwable): String {
        return try {
            val sw = StringWriter()
            val pw = PrintWriter(sw)
            throwable.printStackTrace(pw)
            sw.toString()
        } catch (e: Exception) {
            "Failed to get stack trace: ${e.message}"
        }
    }
    
    fun getCrashLogs(): String {
        return prefs.getString(CRASH_LOGS_KEY, "[]") ?: "[]"
    }
    
    fun clearCrashLogs() {
        prefs.edit().remove(CRASH_LOGS_KEY).apply()
    }
}