package com.noscroll.guard

enum class IgSurface {
  OTHER,
  REELS,
  FEED
}

object InstagramGuardState {
  @Volatile var currentSurface: IgSurface = IgSurface.OTHER
  @Volatile var debug: Boolean = true
  @Volatile var guardEnabled: Boolean = true
}


