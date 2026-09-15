# Android Test Execution Summary

- **Timestamp:** 2026-09-14T16:18:07.843Z
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
| 11 | 6 | 5 | 0 |

### Detailed Test Log

| Test Name | Status | Details |
| :--- | :---: | :--- |
| **A. Installation and Launch** | `FAIL` | Command failed: adb -s 192.168.0.33:34205 shell dumpsys window | grep -E "mCurrentFocus|mFocusedApp"
'grep' is not recognized as an internal or external command,
operable program or batch file.
 |
| **B. Primary Tool Navigation & Back Key** | `FAIL` | Command failed: adb -s 192.168.0.33:34205 shell dumpsys window | grep -E "mCurrentFocus"
'grep' is not recognized as an internal or external command,
operable program or batch file.
 |
| **C. Safe Deterministic Drawing** | `FAIL` | Logcat error during drawing: 'grep' is not recognized as an internal or external command,
operable program or batch file.
 |
| **D. View Controls & Navigator** | `PASS` | Navigator gestures registered without crash or modal masking |
| **E. Modal Containment** | `PASS` | Top menu opens and dismisses cleanly via Android Back key |
| **F. Orientation Adaptation** | `FAIL` | Command failed: adb -s 192.168.0.33:34205 shell dumpsys window | grep -E "mCurrentRotation"
'grep' is not recognized as an internal or external command,
operable program or batch file.
 |
| **G. Lifecycle and Recovery** | `FAIL` | Command failed: adb -s 192.168.0.33:34205 shell dumpsys window | grep -E "mCurrentFocus"
'grep' is not recognized as an internal or external command,
operable program or batch file.
 |
| **H. Export Isolation** | `PASS` | Verified debug storage namespace is completely isolated at /data/data/com.paperrockets.v22.debug |
| **I. Offline Application Behavior** | `PASS` | Capacitor local assets served from APK cache; zero server dependency for drawing |
| **J. Accessibility** | `PASS` | Accessibility tree renders WebView surface cleanly. WebView detected: true |
| **K. Stylus Diagnostics** | `PASS` | Hardware input scanner verified. S-Pen / Stylus hardware detected: false |

---

## Performance Summary (Benchmark Variant)

- **Cold Startup (Median):** N/A ms
- **Cold Startup (P90):** N/A ms
- **Rendered Frames:** N/A
- **Slow/Janky Frame %:** N/A

---

## Device Cleanup & Integrity

- **Orientation Restored:** Yes (1)
- **Production Data Touched:** No (0 production tables/files accessed)
- **Artifacts Saved:** `test-results\android\2026-09-14T16-18-07-831Z`
