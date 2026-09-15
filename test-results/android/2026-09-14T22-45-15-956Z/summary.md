# Android Test Execution Summary

- **Timestamp:** 2026-09-14T22:45:15.974Z
- **Device:** samsung SM-P610 (R52N606W6XR)
- **Android Version:** 13
- **Resolution:** Physical size: 1200x2000
- **Build Variants Tested:**
  - Debug APK: `android\app\build\outputs\apk\debug\app-debug.apk` (`9f6314013bd3...`)
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
| **D. View Controls & Navigator** | `FAIL` | Camera-state assertion failed: [{"view":"front","changed":false,"pose":{}},{"view":"right","changed":false,"pose":{}},{"view":"top","changed":false,"pose":{}},{"view":"isometric","changed":false,"pose":{}}] |
| **E. Modal Containment** | `PASS` | Menu content was exposed and Back returned focus to the app |
| **F. Orientation Adaptation** | `PASS` | Observed ROTATION_0 then ROTATION_90 with no command failure |
| **G. Lifecycle and Recovery** | `PASS` | Application successfully survived backgrounding and restored active workspace |
| **H. Export & Storage Isolation** | `FAIL` | Export assertion failed: GLB={}, PNG={} |
| **I. Offline Application Behavior** | `FAIL` | Offline assertion failed: offline=false, draw=false, save=false |
| **J. Accessibility Surface Probe** | `PASS` | Accessibility dump contains the WebView surface; control labels and focus order require dedicated assertions |
| **K. Stylus Diagnostics** | `SKIP` | Stylus hardware=true; received type=none, maxPressure=0, events=0 |

---

## Performance Summary (Benchmark Variant)

- **Cold Startup (Median):** 787 ms
- **Cold Startup (P90):** 1381 ms
- **Rendered Frames:** 102
- **Slow/Janky Frame %:** 10.78%

---

## Device Cleanup & Integrity

- **Orientation Restored:** Yes (0)
- **Production Data Touched:** No (0 production tables/files accessed)
- **Artifacts Saved:** `test-results\android\2026-09-14T22-45-15-956Z`
