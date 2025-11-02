package com.noscroll.guard

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.util.Log
import android.graphics.Rect
import kotlin.math.abs

private const val IG_PKG = "com.instagram.android"

/**
 * Guard service:
 * - Detects IG Reels viewer by known clips_* nodes
 * - Allows the first reel
 * - On the first clear vertical scroll, triggers BACK → HOME
 * - Logs only "REEL_VIEWER_ENTER" and "BLOCK_REELS_SCROLL"
 */
class InstagramGuardService : AccessibilityService() {

  private val handler = Handler(Looper.getMainLooper())

  // State
  private var inReelViewer = false
  private var enteredAt = 0L
  private var allowedFirst = false
  private var suppressUntil = 0L

  // Debounce for blocking to avoid repeated BACKs
  private val BLOCK_COOLDOWN_MS = 1200L
  // Minimum time after entering viewer before we consider a scroll as "user intent"
  private val MIN_ENTRY_GRACE_MS = 220L

  // Scroll detector
  private val scrollDetector = ScrollDetector(
    idleGraceMs = 160L,
    jitterPx = 3,
    minVerticalDy = 200,
    onVerticalScroll = {
      val now = System.currentTimeMillis()
      if (inReelViewer &&
          allowedFirst &&
          now - enteredAt >= MIN_ENTRY_GRACE_MS &&
          now >= suppressUntil) {

        allowedFirst = false
        suppressUntil = now + BLOCK_COOLDOWN_MS
        logInfo("BLOCK_REELS_SCROLL")
        backBack()
      }
    }
  )

  override fun onServiceConnected() {
    super.onServiceConnected()
    serviceInfo = serviceInfo.apply {
      eventTypes =
        AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
        AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or
        AccessibilityEvent.TYPE_VIEW_SCROLLED or
        AccessibilityEvent.TYPE_TOUCH_INTERACTION_START or
        AccessibilityEvent.TYPE_TOUCH_INTERACTION_END
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
              AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
      notificationTimeout = 50
    }
    logDebug("Service connected")
  }

  override fun onInterrupt() {
    // no-op
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg != IG_PKG) return
    if (!InstagramGuardState.guardEnabled) return

    val now = System.currentTimeMillis()
    val isReel = isInReelsViewer()

    if (isReel && !inReelViewer) {
      // Entered viewer
      inReelViewer = true
      allowedFirst = true
      enteredAt = now
      logInfo("REEL_VIEWER_ENTER")
      InstagramGuardState.currentSurface = IgSurface.REELS
    } else if (!isReel && inReelViewer) {
      // Exited viewer
      inReelViewer = false
      allowedFirst = false
      InstagramGuardState.currentSurface = IgSurface.OTHER
    }

    // Feed all events to the scroll detector (it decides if it's a vertical scroll)
    if (inReelViewer) {
      scrollDetector.onAccessibilityEvent(event)
    }
  }

  // ------------------------------------------------------------
  // Reels detection (based on your actual IDs/classes/bounds)
  // ------------------------------------------------------------
  private fun isInReelsViewer(): Boolean {
    val root = rootInActiveWindow ?: return false

    var foundPager = false
    var foundVideo = false

    val dm = resources.displayMetrics
    val sw = dm.widthPixels.toFloat()
    val sh = dm.heightPixels.toFloat()
    val r = Rect()

    bfs(root) { n ->
      if (!foundPager) {
        val id = n.viewIdResourceName ?: ""
        val cls = n.className?.toString() ?: ""
        if (
          id.endsWith("clips_viewer_view_pager") ||
          id.endsWith("clips_single_media_component") ||
          id.endsWith("clips_media_component") ||
          cls.contains("ViewPager", true)
        ) {
          foundPager = true
        }
      }

      if (!foundVideo) {
        val id = n.viewIdResourceName ?: ""
        val cls = n.className?.toString() ?: ""
        if (
          id.endsWith("clips_video_container") ||
          cls.contains("TextureView", true) ||
          cls.contains("PlayerView", true) ||
          cls.contains("Video", true)
        ) {
          n.getBoundsInScreen(r)
          val wr = r.width() / sw
          val hr = r.height() / sh
          if (wr > 0.75f && hr > 0.75f && n.isVisibleToUser) {
            foundVideo = true
          }
        }
      }
    }

    return foundPager && foundVideo
  }

  // ------------------------------------------------------------
  // Simple exit: BACK → HOME
  // ------------------------------------------------------------
  private fun backBack() {
    performGlobalAction(GLOBAL_ACTION_BACK)
    performGlobalAction(GLOBAL_ACTION_HOME)
  }

  // ------------------------------------------------------------
  // Small BFS helper
  // ------------------------------------------------------------
  private inline fun bfs(root: AccessibilityNodeInfo, visit: (AccessibilityNodeInfo) -> Unit) {
    val q = ArrayDeque<AccessibilityNodeInfo>()
    q.add(root)
    while (q.isNotEmpty()) {
      val n = q.removeFirst()
      try { visit(n) } catch (_: Throwable) {}
      for (i in 0 until n.childCount) n.getChild(i)?.let { q.add(it) }
    }
  }

  // ------------------------------------------------------------
  // Logging
  // ------------------------------------------------------------
  private fun logInfo(msg: String) {
    if (!InstagramGuardState.debug) return
    Log.d("NoScroll", msg)
  }
  private fun logDebug(msg: String) {
    if (!InstagramGuardState.debug) return
    Log.d("NoScroll", msg)
  }

  // ------------------------------------------------------------
  // Scroll detector inner class
  // ------------------------------------------------------------
  private class ScrollDetector(
    private val idleGraceMs: Long,
    private val jitterPx: Int,
    private val minVerticalDy: Int,
    private val onVerticalScroll: () -> Unit
  ) {
    private enum class S { IDLE, DRAGGING, SETTLING }
    private var state = S.IDLE
    private var touchActive = false
    private var lastScrollTs = 0L
    private val handler = Handler(Looper.getMainLooper())
    private var idleRunnable: Runnable? = null

    fun onAccessibilityEvent(ev: AccessibilityEvent) {
      when (ev.eventType) {
        AccessibilityEvent.TYPE_TOUCH_INTERACTION_START -> {
          touchActive = true
          cancelIdle()
        }
        AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
          val now = SystemClock.uptimeMillis()
          val dx = try { ev.scrollDeltaX } catch (_: Throwable) { 0 }
          val dy = try { ev.scrollDeltaY } catch (_: Throwable) { 0 }
          if (abs(dx) < jitterPx && abs(dy) < jitterPx) {
            scheduleIdle()
            return
          }
          lastScrollTs = now
          cancelIdle()

          val vertical = abs(dy) >= minVerticalDy && abs(dy) > abs(dx) * 1.4f
          if (vertical) {
            if (state == S.IDLE) {
              state = if (touchActive) S.DRAGGING else S.SETTLING
            }
            onVerticalScroll()
          }
        }
        AccessibilityEvent.TYPE_TOUCH_INTERACTION_END -> {
          touchActive = false
          if (state != S.IDLE) {
            state = S.SETTLING
            scheduleIdle()
          }
        }
      }
    }

    private fun scheduleIdle() {
      cancelIdle()
      idleRunnable = Runnable {
        val now = SystemClock.uptimeMillis()
        if (now - lastScrollTs >= idleGraceMs) {
          state = S.IDLE
        } else {
          scheduleIdle()
        }
      }.also { handler.postDelayed(it, idleGraceMs) }
    }

    private fun cancelIdle() {
      idleRunnable?.let { handler.removeCallbacks(it) }
      idleRunnable = null
    }
  }
}
