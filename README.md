# NoScroll

An Android app that automatically blocks Instagram Reels to help you stay focused. Uses AccessibilityService to monitor Instagram usage and redirects you to the home screen when accessing blocked content.

## Features

- **ID-based Inspection**: No surface detection. Inspects the Accessibility node tree and matches by view/resource IDs
- **Selective Blocking**: Allows everything except the Reels viewer
- **Reels Protection**: First reel is allowed until you scroll; on first scroll it kicks to home
- **Dark Mode Support**: Beautiful dark/light theme switching
- **No Database**: Simple toggle-based control

### Prerequisites

- Android device with Instagram installed

### Installation

1. **Clone and Install**

   ```bash
   git clone https://github.com/lszefner/NoScroll.git
   cd NoScroll
   npm install
   ```

2. **Build for Android**

   ```bash
   npm run apk
   ```

3. **Grant Permissions**
   - Open the app and tap "Enable Guard"
   - Grant Accessibility Service permission
   - Grant Usage Access permission
   - Enable the NoScroll Guard service

### Manual Permission Setup

If automatic permission requests fail:

1. **Accessibility Service**:

   - Go to Settings > Accessibility > Downloaded apps
   - Find "NoScroll Guard" and enable it

2. **Usage Access**:
   - Go to Settings > Apps > Special app access > Usage access
   - Find "NoScroll Guard" and enable it

## Technical Details

### Architecture

- **React Native**: UI layer with dark mode support
- **Kotlin AccessibilityService**: Core monitoring logic
- **Native Module Bridge**: Communication between RN and native code

### Detection Approach

- No surface detection layer. The service inspects the current Accessibility node tree
- Matches the Reels viewer by stable resource IDs/content-desc/class names
- Gated action: entering the Reels viewer does not kick immediately; it waits until the first scroll gesture, then kicks to home
- Other Instagram surfaces (Feed, DMs, Stories, Search, Profile) are left untouched

## Development

### Project Structure

```
NoScroll/
├── app/                    # React Native screens
├── android/               # Android native code
│   └── app/src/main/java/com/noscroll/guard/
│       ├── InstagramGuardService.kt    # Core accessibility service
│       ├── InstagramGuardModule.kt     # RN bridge
│       └── MainApplication.kt          # App initialization
└── android/app/src/main/res/
    ├── xml/accessibility_service_config.xml
    └── values/strings.xml
```

### Key Files

- `InstagramGuardService.kt`: Main accessibility service with ID-based inspection logic
- `app/index.tsx`: React Native UI with toggle and status
- `AndroidManifest.xml`: Service declarations and permissions

### Testing

1. Install Instagram if not already installed
2. Enable the guard service
3. Test each surface:
   - Feed: Should work normally
   - DMs: Should work normally
   - Reels tab: First reel allowed until you perform the first scroll; after that it kicks to home
   - Reel from Feed: Opens a single reel; allowed until you scroll; on first scroll it kicks
   - Continuous scrolling: After the first scroll, subsequent reels are blocked immediately

## Troubleshooting

### Service Not Working

1. Check Accessibility Service is enabled
2. Verify Usage Access permission
3. Restart the app
4. Check device logs for errors

### False Positives/Negatives

Instagram UI resource IDs can change between versions. If detection fails, check logs and update the matched IDs/selectors in `InstagramGuardService.kt`.

### Performance Issues

- The service only runs when Instagram is in foreground
- Detection is optimized for minimal battery impact
- Cooldown prevents excessive kicking

## Privacy

- No data collection or analytics
- No network requests
- Only monitors Instagram when service is enabled
- All processing happens locally on device

## License

MIT License - see LICENSE file for details.
