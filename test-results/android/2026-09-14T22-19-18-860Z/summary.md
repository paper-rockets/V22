# Android Test Execution Summary

- **Timestamp:** 2026-09-14T22:19:18.876Z
- **Device:** samsung SM-P610 (R52N606W6XR)
- **Android Version:** 13
- **Resolution:** Physical size: 1200x2000
- **Build Variants Tested:**
  - Debug APK: `android\app\build\outputs\apk\debug\app-debug.apk` (`3638e8fc97f3...`)
  - Benchmark APK: `android\app\build\outputs\apk\benchmark\app-benchmark.apk` (`03a065de41bc...`)

---

## Test Results Overview

| Total Tests | Passed | Failed | Skipped | Infra Issues |
| :---: | :---: | :---: | :---: | :---: |
| 11 | 6 | 1 | 4 | 0 |

### Detailed Test Log

| Test Name | Status | Details |
| :--- | :---: | :--- |
| **A. Installation and Launch** | `PASS` | App launched cleanly from stopped state and acquired window focus |
| **B. Primary Tool Navigation & Back Key** | `PASS` | Android Back key closed topmost surface and restored active workspace |
| **C. Safe Deterministic Drawing** | `PASS` | Drawing strokes executed cleanly with no uncaught exceptions |
| **D. View Controls & Navigator** | `SKIP` | Gesture delivered; camera-state assertion is not implemented |
| **E. Modal Containment** | `PASS` | Menu content was exposed and Back returned focus to the app |
| **F. Orientation Adaptation** | `FAIL` | Rotation assertion failed (portrait=0, landscape=90) |
| **G. Lifecycle and Recovery** | `PASS` | Application successfully survived backgrounding and restored active workspace |
| **H. Export & Storage Isolation** | `SKIP` | Sandbox listing succeeded, but no export was performed and no exported file was validated |
| **I. Offline Application Behavior** | `SKIP` | No network-disable or offline-state assertion is implemented |
| **J. Accessibility Surface Probe** | `PASS` | Accessibility dump contains the WebView surface; control labels and focus order require dedicated assertions |
| **K. Stylus Diagnostics** | `SKIP` | Stylus hardware is present; pressure-event and stroke assertions are not implemented |

---

## Performance Summary (Benchmark Variant)

- **Cold Startup (Median):** 767 ms
- **Cold Startup (P90):** 1412 ms
- **Rendered Frames:** N/A
- **Slow/Janky Frame %:** 0.00%

---

## Device Cleanup & Integrity

- **Orientation Restored:** Yes (0)
- **Production Data Touched:** No (0 production tables/files accessed)
- **Artifacts Saved:** `test-results\android\2026-09-14T22-19-18-860Z`
