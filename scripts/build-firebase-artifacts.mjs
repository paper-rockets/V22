/**
 * Builds production app/test APK pairs for Firebase Test Lab.
 *
 * The web bundle is rebuilt in production mode first so the generated Android
 * assets cannot accidentally contain the debug bridge. The Android test APK
 * is then compiled for release and benchmark variants.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const distDir = path.join(root, 'dist');
const publicDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');

function run(command, args, cwd, shell = process.platform === 'win32') {
  // Windows .cmd/.bat launchers require a shell; Unix keeps direct spawning.
  // When using a shell, quote only arguments containing spaces so Windows does
  // not split the work-folder path (which contains "AiStudio Workflow").
  const spawnArgs = shell
    ? args.map((arg) => /\s/.test(arg) ? `"${String(arg).replaceAll('"', '\\"')}"` : arg)
    : args;
  const result = spawnSync(command, spawnArgs, {
    cwd,
    stdio: 'inherit',
    shell,
  });
  if (result.error) {
    console.error(`[FIREBASE] Failed to start ${command}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[FIREBASE] ${command} exited with status ${result.status ?? 'unknown'}${result.signal ? ` (${result.signal})` : ''}`);
    process.exit(result.status ?? 1);
  }
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

console.log('[FIREBASE] Building production web bundle');
run(npmCommand, ['run', 'build'], root);

if (!fs.existsSync(distDir)) throw new Error(`Missing production bundle: ${distDir}`);
console.log('[FIREBASE] Replacing generated Android web assets');
fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.cpSync(distDir, publicDir, { recursive: true });

console.log('[FIREBASE] Building release/benchmark app and instrumentation APKs');
run(gradleCommand, [
  'assembleRelease',
  'assembleReleaseAndroidTest',
  'assembleBenchmark',
], androidDir);

// The production release is intentionally unsigned until the Play signing
// keystore is applied. Firebase instrumentation requires both APKs to be
// signed, so make a clearly named, test-only copy with the standard local
// debug key. This copy is never used for Play distribution.
const sdkRoot = process.env.ANDROID_SDK_ROOT
  || process.env.ANDROID_HOME
  || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
const buildToolsRoot = path.join(sdkRoot, 'build-tools');
const buildToolsVersions = fs.existsSync(buildToolsRoot)
  ? fs.readdirSync(buildToolsRoot).filter((entry) => fs.statSync(path.join(buildToolsRoot, entry)).isDirectory()).sort()
  : [];
const apksigner = process.platform === 'win32'
  ? path.join(buildToolsRoot, buildToolsVersions.at(-1) || '', 'apksigner.bat')
  : path.join(buildToolsRoot, buildToolsVersions.at(-1) || '', 'apksigner');
const debugKeystore = path.join(process.env.USERPROFILE || '', '.android', 'debug.keystore');
const releaseUnsigned = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');
const releaseTestUnsigned = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'androidTest', 'release', 'app-release-androidTest.apk');
const firebaseApp = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-firebase.apk');
const firebaseTest = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'androidTest', 'release', 'app-release-androidTest-firebase.apk');

if (fs.existsSync(apksigner) && fs.existsSync(debugKeystore)) {
  console.log('[FIREBASE] Signing test-only copies with the local debug key');
  run(apksigner, [
    'sign', '--ks', debugKeystore, '--ks-pass', 'pass:android', '--key-pass', 'pass:android',
    '--in', releaseUnsigned, '--out', firebaseApp,
  ], root);
  run(apksigner, [
    'sign', '--ks', debugKeystore, '--ks-pass', 'pass:android', '--key-pass', 'pass:android',
    '--in', releaseTestUnsigned, '--out', firebaseTest,
  ], root);
} else {
  console.warn(`[FIREBASE] Could not find apksigner or debug keystore; signed copies were not created.`);
}

console.log('\n[FIREBASE] Artifacts:');
for (const relative of [
  'android/app/build/outputs/apk/release/app-release-unsigned.apk',
  'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
  'android/app/build/outputs/apk/release/app-release-firebase.apk',
  'android/app/build/outputs/apk/androidTest/release/app-release-androidTest-firebase.apk',
  'android/app/build/outputs/apk/benchmark/app-benchmark.apk',
]) {
  const file = path.join(root, relative);
  console.log(fs.existsSync(file) ? `  ${file}` : `  MISSING ${file}`);
}
