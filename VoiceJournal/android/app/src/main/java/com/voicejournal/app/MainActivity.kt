package com.voicejournal.app

import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  companion object {
    private const val TAG = "MainActivity"
    private const val ERROR_LOG_PREF = "native_error_logs"
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    try {
      // Set the theme to AppTheme BEFORE onCreate to support
      // coloring the background, status bar, and navigation bar.
      // This is required for expo-splash-screen.
      setTheme(R.style.AppTheme)
      super.onCreate(null)
      
      // Initialize native error handling
      setupNativeErrorHandling()
      
      Log.d(TAG, "MainActivity created successfully")
    } catch (e: Exception) {
      Log.e(TAG, "Error in onCreate: ${e.message}", e)
      logNativeError("MainActivity.onCreate", e)
      // Show user-friendly error instead of crashing
      showErrorToast("App initialization error. Please restart the app.")
    }
  }

  private fun setupNativeErrorHandling() {
    try {
      // Set up uncaught exception handler
      val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
      Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
        Log.e(TAG, "Uncaught exception in thread ${thread.name}: ${throwable.message}", throwable)
        logNativeError("UncaughtException", throwable)
        
        // Show user-friendly error
        runOnUiThread {
          showErrorToast("An unexpected error occurred. The app will restart.")
        }
        
        // Call default handler
        defaultHandler?.uncaughtException(thread, throwable)
      }
      
      Log.d(TAG, "Native error handling initialized")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to setup native error handling: ${e.message}", e)
    }
  }

  private fun logNativeError(context: String, error: Throwable) {
    try {
      val errorLog = mapOf(
        "timestamp" to System.currentTimeMillis(),
        "context" to context,
        "message" to (error.message ?: "Unknown error"),
        "stackTrace" to Log.getStackTraceString(error),
        "type" to "native"
      )
      
      // Store in SharedPreferences for later retrieval
      val prefs = getSharedPreferences("VoiceJournalPrefs", MODE_PRIVATE)
      val existingLogs = prefs.getString(ERROR_LOG_PREF, "[]")
      val logsList = try {
        org.json.JSONArray(existingLogs).toString()
      } catch (e: Exception) {
        "[]"
      }
      
      val newLogsArray = org.json.JSONArray(logsList)
      newLogsArray.put(org.json.JSONObject(errorLog))
      
      // Keep only last 20 errors
      val finalArray = org.json.JSONArray()
      val startIndex = maxOf(0, newLogsArray.length() - 20)
      for (i in startIndex until newLogsArray.length()) {
        finalArray.put(newLogsArray.get(i))
      }
      
      prefs.edit().putString(ERROR_LOG_PREF, finalArray.toString()).apply()
      Log.d(TAG, "Native error logged: $context")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to log native error: ${e.message}", e)
    }
  }

  private fun showErrorToast(message: String) {
    try {
      Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    } catch (e: Exception) {
      Log.e(TAG, "Failed to show error toast: ${e.message}", e)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
