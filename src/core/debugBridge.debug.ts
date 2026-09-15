/** Debug-build adapter.  The native bridge itself remains a debug source-set
 * dependency; release/benchmark builds resolve the same adapter name to a
 * tiny no-op module. */
import {
  checkDebugAuthorization,
  broadcastTestTelemetry,
} from './nativeDebugBridge';

export const authorize = checkDebugAuthorization;
export const emitTelemetry = broadcastTestTelemetry;
