/**
 * Keeps development and benchmark instrumentation out of the normal product
 * path while still allowing automated device runs against release builds.
 */
export function isDiagnosticsEnabled(): boolean {
  if (typeof __IS_DEBUG_BUILD__ !== 'undefined' && __IS_DEBUG_BUILD__) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('transparencyBenchmark') === '1' || params.get('automation') === '1';
}
