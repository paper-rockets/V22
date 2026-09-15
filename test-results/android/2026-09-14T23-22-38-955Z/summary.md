# Android Test Execution Summary

- **Timestamp:** 2026-09-14T23:22:38.962Z
- **Device:** samsung SM-P610 (R52N606W6XR)
- **Android Version:** 13
- **Resolution:** Physical size: 1200x2000
- **Build Variants Tested:**
  - Debug APK: `android\app\build\outputs\apk\debug\app-debug.apk` (`513417f0a063...`)
  - Benchmark APK: `android\app\build\outputs\apk\benchmark\app-benchmark.apk` (`34d0633ccedc...`)

---

## Test Results Overview

| Total Tests | Passed | Failed | Skipped | Infra Issues |
| :---: | :---: | :---: | :---: | :---: |
| 11 | 7 | 3 | 1 | 0 |

### Detailed Test Log

| Test Name | Status | Details |
| :--- | :---: | :--- |
| **A. Installation and Launch** | `PASS` | App launched cleanly from stopped state and acquired window focus |
| **B. Primary Tool Navigation & Back Key** | `PASS` | Android Back key closed topmost surface and restored active workspace |
| **C. Safe Deterministic Drawing** | `PASS` | Drawing strokes executed cleanly with no uncaught exceptions |
| **D. View Controls & Navigator** | `PASS` | Camera pose changed and resolved to Front, Side, Top, then Reset via debug API |
| **E. Modal Containment** | `FAIL` | Modal containment assertion failed: {"found":false} |
| **F. Orientation Adaptation** | `PASS` | Observed ROTATION_0 then ROTATION_90 with no command failure |
| **G. Lifecycle and Recovery** | `FAIL` | App did not regain focus on return: mCurrentFocus=Window{f9cfff1 u0 NotificationShade} |
| **H. Export & Storage Isolation** | `PASS` | GLB and PNG payloads validated; debug sandbox accessible (total 77) |
| **I. Offline Application Behavior** | `PASS` | Offline state, local stroke and save verified (status=saved) |
| **J. Accessibility Surface Probe** | `FAIL` | Accessibility dump did not contain the WebView surface |
| **K. Stylus Diagnostics** | `SKIP` | Stylus hardware=true; received type=none, maxPressure=0, events=0 |

---

## Performance Summary (Benchmark Variant)

- **Cold Startup (Median):** N/A ms
- **Cold Startup (P90):** N/A ms
- **Rendered Frames:** N/A
- **Slow/Janky Frame %:** 0.00%

---

## Device Cleanup & Integrity

- **Orientation Restored:** Yes (0)
- **Production Data Touched:** No (0 production tables/files accessed)
- **Artifacts Saved:** `test-results\android\2026-09-14T23-22-38-955Z`
