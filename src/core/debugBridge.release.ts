/** Release/benchmark adapter.  Keep test bridge implementation out of the
 * production JavaScript graph entirely. */
export async function authorize(): Promise<boolean> {
  return false;
}

export function emitTelemetry(_telemetry: Record<string, unknown>): void {
  // Intentionally empty in production and benchmark builds.
}
