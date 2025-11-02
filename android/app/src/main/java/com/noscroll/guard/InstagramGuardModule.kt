package com.noscroll.guard

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Binder
import android.provider.Settings
import com.facebook.react.bridge.*

class InstagramGuardModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "InstagramGuard"

  private fun svc(): InstagramGuardService? {
    // AccessibilityService is managed by system; we cannot hold a strong ref.
    return try {
      // best-effort: fetch from global service list not possible; using static holder is overkill.
      null
    } catch (_: Throwable) { null }
  }

  @ReactMethod
  fun isServiceEnabled(promise: Promise) {
    try {
      val enabled = Settings.Secure.getString(reactContext.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        ?.contains(reactContext.packageName) == true
      promise.resolve(enabled)
    } catch (e: Exception) { promise.resolve(false) }
  }

  @ReactMethod
  fun hasUsageAccessPermission(promise: Promise) {
    try {
      val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = appOps.checkOpNoThrow("android:get_usage_stats", Binder.getCallingUid(), reactContext.packageName)
      promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    } catch (_: Throwable) { promise.resolve(false) }
  }

  @ReactMethod
  fun openAccessibilitySettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) { promise.reject("ERR", e) }
  }

  @ReactMethod
  fun openUsageAccessSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) { promise.reject("ERR", e) }
  }

  @ReactMethod
  fun startService(promise: Promise) {
    try {
      InstagramGuardState.guardEnabled = true
      promise.resolve(true)
    } catch (e: Exception) { promise.reject("ERR", e) }
  }

  @ReactMethod
  fun stopService(promise: Promise) {
    try {
      InstagramGuardState.guardEnabled = false
      promise.resolve(true)
    } catch (e: Exception) { promise.reject("ERR", e) }
  }

  @ReactMethod
  fun toggleDebugMode(promise: Promise) {
    try {
      InstagramGuardState.debug = !InstagramGuardState.debug
      promise.resolve(InstagramGuardState.debug)
    } catch (e: Exception) { promise.reject("ERR", e) }
  }

  @ReactMethod
  fun getCurrentSurface(promise: Promise) {
    try {
      promise.resolve(InstagramGuardState.currentSurface.name)
    } catch (e: Exception) { promise.reject("ERR", e) }
  }
}


