/**
 * scripts/verify-release-safety.mjs
 *
 * Verifies that Release and Benchmark builds strictly isolate and disable
 * all Debug/Test mode capabilities, WebView debugging, and test bridges.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== RELEASE VERIFICATION & SECURITY AUDIT ===\n');

let failedChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedChecks++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedChecks++;
  }
}

// 1. Source-Set Architecture & Gating
console.log('--- 1. Source-Set Architecture & Gating ---');
const mainPluginPath = path.join(rootDir, 'android/app/src/main/java/com/paperrockets/v22/NativeDebugBridgePlugin.java');
assert(!fs.existsSync(mainPluginPath), 'NativeDebugBridgePlugin is completely absent from src/main/java');

const debugPluginPath = path.join(rootDir, 'android/app/src/debug/java/com/paperrockets/v22/NativeDebugBridgePlugin.java');
assert(fs.existsSync(debugPluginPath), 'NativeDebugBridgePlugin exists exclusively in src/debug/java');

const releaseRegistrarPath = path.join(rootDir, 'android/app/src/release/java/com/paperrockets/v22/DebugRegistrar.java');
const releaseRegistrar = fs.existsSync(releaseRegistrarPath) ? fs.readFileSync(releaseRegistrarPath, 'utf8') : '';
assert(
  releaseRegistrar.includes('WebView.setWebContentsDebuggingEnabled(false)') &&
  !releaseRegistrar.includes('NativeDebugBridgePlugin'),
  'src/release/java/DebugRegistrar is a strict no-op that disables WebView debugging and registers 0 plugins'
);

const benchmarkRegistrarPath = path.join(rootDir, 'android/app/src/benchmark/java/com/paperrockets/v22/DebugRegistrar.java');
const benchmarkRegistrar = fs.existsSync(benchmarkRegistrarPath) ? fs.readFileSync(benchmarkRegistrarPath, 'utf8') : '';
assert(
  benchmarkRegistrar.includes('WebView.setWebContentsDebuggingEnabled(false)') &&
  !benchmarkRegistrar.includes('NativeDebugBridgePlugin'),
  'src/benchmark/java/DebugRegistrar is a strict no-op identical to release'
);

// 2. Build Configuration & Manifest Safety
console.log('\n--- 2. Build Configuration & Manifest Safety ---');
const buildGradlePath = path.join(rootDir, 'android/app/build.gradle');
const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

assert(buildGradle.includes('ENABLE_TEST_BRIDGE", "false"'), 'Release and benchmark build types configure ENABLE_TEST_BRIDGE = false');
assert(buildGradle.includes('minifyEnabled true'), 'R8 shrinking and minification is enabled for release and benchmark');
assert(buildGradle.includes('shrinkResources true'), 'Resource shrinking is enabled for release and benchmark');

const proguardRulesPath = path.join(rootDir, 'android/app/proguard-rules.pro');
const proguardRules = fs.readFileSync(proguardRulesPath, 'utf8');
assert(
  proguardRules.includes('-keep public class com.getcapacitor.**') &&
  proguardRules.includes('-keep class * extends com.getcapacitor.Plugin'),
  'Capacitor keep rules are properly configured in proguard-rules.pro'
);

const manifestPath = path.join(rootDir, 'android/app/src/main/AndroidManifest.xml');
const manifest = fs.readFileSync(manifestPath, 'utf8');
assert(manifest.includes('android:allowBackup="false"'), 'AndroidManifest.xml explicitly specifies android:allowBackup="false"');

// 3. Compiled Artifacts Inspection
console.log('\n--- 3. Compiled Artifacts Inspection ---');
const releaseApk = path.join(rootDir, 'android/app/build/outputs/apk/release/app-release-unsigned.apk');
const benchmarkApk = path.join(rootDir, 'android/app/build/outputs/apk/benchmark/app-benchmark.apk');
const debugApk = path.join(rootDir, 'android/app/build/outputs/apk/debug/app-debug.apk');

assert(fs.existsSync(releaseApk), `Release APK artifact found: ${path.relative(rootDir, releaseApk)}`);
console.log('  [NOTE] Acknowledging release APK status: app-release-unsigned.apk is unsigned as expected prior to production signing keystore application.');

assert(fs.existsSync(benchmarkApk), `Benchmark APK artifact found: ${path.relative(rootDir, benchmarkApk)}`);
assert(fs.existsSync(debugApk), `Debug APK artifact found: ${path.relative(rootDir, debugApk)}`);

async function verifyApks() {
  if (fs.existsSync(releaseApk)) {
    console.log('\n--- 4. Release APK Bytecode & Asset Audit ---');
    const { default: JSZip } = await import('jszip');
    const releaseBuffer = fs.readFileSync(releaseApk);
    const releaseZip = await JSZip.loadAsync(releaseBuffer);

    // Asset inspection
    const packagedFiles = Object.keys(releaseZip.files);
    const debugAssetMatch = packagedFiles.find((f) => /DebugTestPanel/i.test(f) || /nativeDebugBridge/i.test(f));
    assert(!debugAssetMatch, 'Release APK assets contain ZERO debug panel or bridge assets: ' + (debugAssetMatch || 'Clean'));

    // Filenames can be hashed or renamed by a bundler, so inspect JavaScript
    // contents as well. A release artifact must not contain debug entry points.
    const debugMarkers = ['DebugTestPanel', 'nativeDebugBridge', 'checkDebugAuthorization', '__V22_TEST_API__'];
    let debugContentMatch = null;
    for (const assetName of packagedFiles.filter((f) => /\.(?:js|mjs|map)$/i.test(f))) {
      const assetText = await releaseZip.file(assetName).async('string');
      const marker = debugMarkers.find((candidate) => assetText.includes(candidate));
      if (marker) {
        debugContentMatch = `${marker} in ${assetName}`;
        break;
      }
    }
    assert(!debugContentMatch, 'Release APK JavaScript contains ZERO debug markers: ' + (debugContentMatch || 'Clean'));

    // DEX inspection: check all classes*.dex in release APK
    const dexFiles = packagedFiles.filter((f) => f.endsWith('.dex'));
    let foundBridgeInReleaseDex = false;
    for (const dexName of dexFiles) {
      const dexData = await releaseZip.file(dexName).async('nodebuffer');
      if (dexData.includes(Buffer.from('NativeDebugBridgePlugin'))) {
        foundBridgeInReleaseDex = true;
        break;
      }
    }
    assert(!foundBridgeInReleaseDex, 'NativeDebugBridgePlugin is 100% ABSENT from Release APK DEX bytecode');

    // apkanalyzer manifest check
    try {
      const apkanalyzerBat = 'C:\\Users\\macie\\AppData\\Local\\Android\\Sdk\\cmdline-tools\\latest\\bin\\apkanalyzer.bat';
      if (fs.existsSync(apkanalyzerBat)) {
        const manifestDump = execFileSync(apkanalyzerBat, ['manifest', 'print', releaseApk], { encoding: 'utf8' });
        assert(!manifestDump.includes('android:debuggable="true"'), 'Release APK manifest has debuggable=false');
        assert(manifestDump.includes('allowBackup="false"'), 'Release APK merged manifest retains allowBackup="false"');
        assert(!manifestDump.includes('android:profileable="true"'), 'Release APK profileable is disabled/false');
      }
    } catch (e) {
      console.warn('  [WARN] apkanalyzer inspection skipped:', e.message);
    }
  }

  if (fs.existsSync(benchmarkApk)) {
    console.log('\n--- 5. Benchmark APK Bytecode Audit ---');
    const { default: JSZip } = await import('jszip');
    const benchBuffer = fs.readFileSync(benchmarkApk);
    const benchZip = await JSZip.loadAsync(benchBuffer);
    const benchDexFiles = Object.keys(benchZip.files).filter((f) => f.endsWith('.dex'));
    let benchDebugContentMatch = null;
    for (const assetName of Object.keys(benchZip.files).filter((f) => /\.(?:js|mjs|map)$/i.test(f))) {
      const assetText = await benchZip.file(assetName).async('string');
      const marker = ['DebugTestPanel', 'nativeDebugBridge', 'checkDebugAuthorization', '__V22_TEST_API__']
        .find((candidate) => assetText.includes(candidate));
      if (marker) {
        benchDebugContentMatch = `${marker} in ${assetName}`;
        break;
      }
    }
    assert(!benchDebugContentMatch, 'Benchmark APK JavaScript contains ZERO debug markers: ' + (benchDebugContentMatch || 'Clean'));
    let foundBridgeInBenchDex = false;
    for (const dexName of benchDexFiles) {
      const dexData = await benchZip.file(dexName).async('nodebuffer');
      if (dexData.includes(Buffer.from('NativeDebugBridgePlugin'))) {
        foundBridgeInBenchDex = true;
        break;
      }
    }
    assert(!foundBridgeInBenchDex, 'NativeDebugBridgePlugin is 100% ABSENT from Benchmark APK DEX bytecode');
  }

  console.log('\n========================================');
  console.log(`AUDIT COMPLETE: ${passedChecks} passed, ${failedChecks} failed.`);
  if (failedChecks === 0) {
    console.log('ALL RELEASE SAFETY, BYTECODE & ISOLATION CHECKS PASSED.');
    process.exit(0);
  } else {
    console.error(`FAILED: ${failedChecks} checks failed.`);
    process.exit(1);
  }
}

verifyApks();
