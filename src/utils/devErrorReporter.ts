// TEMPORARY dev-only probe: sends console errors and per-look shader link
// results from a device (e.g. the tablet) to the dev server log.
export function installDevErrorReporter(): void {
  const send = (kind: string, message: string) => {
    try {
      fetch('/__dev-log', {
        method: 'POST',
        body: JSON.stringify({ kind, message: message.slice(0, 6000) }),
        keepalive: true,
      });
    } catch (_) {}
  };
  const text = (args: unknown[]) =>
    args
      .map((a) => {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return `${a.message}\n${a.stack ?? ''}`;
        try {
          return JSON.stringify(a);
        } catch (_) {
          return String(a);
        }
      })
      .join(' ');

  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    origError(...args);
    send('console.error', text(args));
  };
  const origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    origWarn(...args);
    send('console.warn', text(args));
  };
  window.addEventListener('error', (e) => send('window.error', `${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener('unhandledrejection', (e) => send('unhandledrejection', text([e.reason])));

  send('hello', `${navigator.userAgent} dpr=${window.devicePixelRatio}`);

  const reported = new Set<string>();
  const unseen = new Map<string, number>();
  window.setInterval(() => {
    const engine = (window as any).__STUDIO_ENGINE__;
    if (!engine?.strokes) return;
    const renderer = engine.renderer;
    const gl = renderer.getContext();
    engine.strokes.forEach(({ descriptor, meshes }: any) => {
      const mesh = meshes[0];
      const mat = mesh?.material;
      if (!mat) return;
      const settings = descriptor.settings;
      const look = settings.activeLookName || settings.materialType;
      const key = `${look}|${mat.uuid}`;
      if (reported.has(key)) return;
      const program = renderer.properties.get(mat).currentProgram;
      if (!program) {
        // Never drawn: report once it has stayed undrawn for a few checks.
        const misses = (unseen.get(key) ?? 0) + 1;
        unseen.set(key, misses);
        if (misses === 3) {
          reported.add(key);
          const verts = mesh.geometry.getAttribute('position')?.count ?? 0;
          send(
            'stroke-never-drawn',
            `look="${look}" type=${settings.materialType} effect=${settings.shaderEffect ?? '-'} material=${mat.type} verts=${verts} visible=${mesh.visible} inScene=${!!mesh.parent} color=${settings.color}`
          );
        }
        return;
      }
      reported.add(key);
      const linked = gl.getProgramParameter(program.program, gl.LINK_STATUS);
      const verts = mesh.geometry.getAttribute('position')?.count ?? 0;
      let line = `look="${look}" type=${settings.materialType} effect=${settings.shaderEffect ?? '-'} material=${mat.type} linked=${linked} verts=${verts} opacity=${mat.opacity} visible=${mesh.visible}`;
      if (!linked) {
        line += `\nprogram: ${gl.getProgramInfoLog(program.program)}\nfragment: ${gl.getShaderInfoLog(program.fragmentShader)}\nvertex: ${gl.getShaderInfoLog(program.vertexShader)}`;
      }
      send('stroke', line);
    });
  }, 2000);
}
