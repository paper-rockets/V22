# Android Test Execution Summary

- **Timestamp:** 2026-09-14T16:22:39.957Z
- **Device:** samsung SM-P610 (192.168.0.33:34205)
- **Android Version:** 13
- **Resolution:** Physical size: 1200x2000
- **Build Variants Tested:**
  - Debug APK: `android\app\build\outputs\apk\debug\app-debug.apk` (`bdfbfdcf5052...`)
  - Benchmark APK: `android\app\build\outputs\apk\benchmark\app-benchmark.apk` (`51610f9685a0...`)

---

## Test Results Overview

| Total Tests | Passed | Failed | Infra Issues |
| :---: | :---: | :---: | :---: |
| 11 | 9 | 2 | 0 |

### Detailed Test Log

| Test Name | Status | Details |
| :--- | :---: | :--- |
| **A. Installation and Launch** | `FAIL` | Command failed: adb -s 192.168.0.33:34205 shell "dumpsys window | grep -E \"mCurrentFocus|mFocusedApp\""
'mFocusedApp\""' is not recognized as an internal or external command,
operable program or batch file.
 |
| **B. Primary Tool Navigation & Back Key** | `FAIL` | App lost focus upon back key: mCurrentFocus=Window{ea8fa7e u0 com.sec.android.app.launcher/com.sec.android.app.launcher.activities.LauncherActivity} |
| **C. Safe Deterministic Drawing** | `PASS` | Drawing strokes executed cleanly with no uncaught exceptions |
| **D. View Controls & Navigator** | `PASS` | Navigator gestures registered without crash or modal masking |
| **E. Modal Containment** | `PASS` | Top menu opens and dismisses cleanly via Android Back key |
| **F. Orientation Adaptation** | `PASS` | App transitioned between portrait and landscape without ANR or crash |
| **G. Lifecycle and Recovery** | `PASS` | Application successfully survived backgrounding and restored active workspace |
| **H. Export & Storage Isolation** | `PASS` | Verified debug storage namespace is completely isolated: total 77 |
| **I. Offline Application Behavior** | `PASS` | Capacitor local assets served from APK cache; zero server dependency for drawing |
| **J. Accessibility** | `PASS` | Accessibility tree renders WebView surface cleanly. WebView detected: true |
| **K. Stylus Diagnostics** | `PASS` | Hardware input scanner verified. S-Pen / Stylus hardware detected: true |

---

## Performance Summary (Benchmark Variant)

- **Cold Startup (Median):** 896 ms
- **Cold Startup (P90):** 1680 ms
- **Rendered Frames:** 124
- **Slow/Janky Frame %:** 5.65%

---

## Device Cleanup & Integrity

- **Orientation Restored:** Yes (1)
- **Production Data Touched:** No (0 production tables/files accessed)
- **Artifacts Saved:** `test-results\android\2026-09-14T16-22-39-944Z`
