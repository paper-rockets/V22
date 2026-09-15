/**
 * Native Debug Bridge & Security Gate
 *
 * Debug and test capabilities are ONLY enabled when the native Android build
 * explicitly authorizes them via NativeDebugBridgePlugin with BuildConfig.ENABLE_TEST_BRIDGE == true.
 * In release and benchmark builds, authorization is false and all test hooks remain inactive.
 */

import { registerPlugin } from '@capacitor/core';

export interface DebugAuthorization {
  isAuthorized: boolean;
  buildVariant: string;
  appId: string;
  versionName: string;
  versionCode: number;
  deviceManufacturer?: string;
  deviceModel?: string;
  androidVersion?: string;
  sdkInt?: number;
}

export interface NativeSystemDiagnostics {
  screenWidth?: number;
  screenHeight?: number;
  screenDensity?: number;
  densityDpi?: number;
  storageFreeBytes?: number;
  storageTotalBytes?: number;
  buildVariant?: string;
  appId?: string;
  manufacturer?: string;
  model?: string;
  androidVersion?: string;
}

interface NativeDebugBridgePluginInterface {
  getDebugAuthorization(): Promise<DebugAuthorization>;
  getSystemDiagnostics(): Promise<NativeSystemDiagnostics>;
  recordTestTelemetry(data: any): Promise<void>;
}

const NativeDebugBridge = registerPlugin<NativeDebugBridgePluginInterface>('NativeDebugBridge');

// Internal test simulation states (in-memory only, debug variant only)
let isAuthorizedCached: boolean | null = null;
let authDataCached: DebugAuthorization | null = null;

export const testSimulationState = {
  simulateOffline: false,
  simulateAutosaveFailure: false,
  simulateExportFailure: false,
  simulateReducedMotion: false,
  showFpsOverlay: false,
  showPointerDiagnostics: false,
};

// The debug bridge is loaded by the internal debug panel. Expose only this
// in-memory object so the test API can toggle simulation state synchronously;
// production builds never include this module or global.
if (typeof window !== 'undefined') {
  (window as any).__V22_TEST_SIMULATION_STATE__ = testSimulationState;
}

// Bounded in-memory log buffer (max 200 lines)
const MAX_LOGS = 200;
const inMemoryLogs: Array<{ timestamp: string; level: string; message: string }> = [];

export function logDebugMessage(level: 'info' | 'warn' | 'error', rawMessage: string) {
  if (!isNativeDebugAuthorized()) return;
  const sanitized = sanitizeDiagnosticString(rawMessage);
  inMemoryLogs.push({
    timestamp: new Date().toISOString(),
    level,
    message: sanitized,
  });
  if (inMemoryLogs.length > MAX_LOGS) {
    inMemoryLogs.shift();
  }
}

export function getInMemoryLogs(): Array<{ timestamp: string; level: string; message: string }> {
  return [...inMemoryLogs];
}

export function clearInMemoryLogs(): void {
  inMemoryLogs.length = 0;
}

/**
 * Sanitizes and redacts personal info, email addresses, file paths, and tokens.
 */
export function sanitizeDiagnosticString(str: string): string {
  if (!str) return '';
  return str
    // Redact emails
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]')
    // Redact absolute local file paths
    .replace(/([a-zA-Z]:|\/Users\/|\/home\/|\/data\/data\/)[^\s'",;]+/g, '[REDACTED_PATH]')
    // Redact potential tokens/keys
    .replace(/(bearer\s+|key=|token=)[a-zA-Z0-9_-]+/gi, '$1[REDACTED_TOKEN]');
}

/**
 * Check whether Native Debug/Test mode is authorized by the native layer.
 */
export async function checkDebugAuthorization(): Promise<boolean> {
  if (isAuthorizedCached !== null) {
    return isAuthorizedCached;
  }
  try {
    const res = await NativeDebugBridge.getDebugAuthorization();
    if (res && res.isAuthorized === true && res.buildVariant === 'debug') {
      isAuthorizedCached = true;
      authDataCached = res;
      return true;
    }
  } catch (_err) {
    // Plugin not registered (release build or web environment without bridge)
  }
  isAuthorizedCached = false;
  authDataCached = null;
  return false;
}

export function isNativeDebugAuthorized(): boolean {
  return isAuthorizedCached === true;
}

export function getCachedAuthData(): DebugAuthorization | null {
  return authDataCached;
}

export async function fetchNativeSystemDiagnostics(): Promise<NativeSystemDiagnostics | null> {
  if (!isNativeDebugAuthorized()) return null;
  try {
    return await NativeDebugBridge.getSystemDiagnostics();
  } catch (_e) {
    return null;
  }
}

export function broadcastTestTelemetry(telemetry: Record<string, any>): void {
  if (!isNativeDebugAuthorized()) return;
  try {
    NativeDebugBridge.recordTestTelemetry(telemetry);
  } catch (_e) {}
  console.log('__V22_TELEMETRY__:' + JSON.stringify(telemetry));
}
