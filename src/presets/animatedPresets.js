// ============================================================================
// ⚡ Live Animated Shaders (100% Original Code, Strictly NO Water Shaders)
// High-Dopamine animated WebGL shaders: Rainbow, Electric, Stars, Lava, Plasma
// Safe for commercial distribution
// ============================================================================

export const ANIMATED_PRESETS = [
  {
    id: 'anim_rainbow_pulse',
    name: 'Animated Rainbow Pulse',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'Continuously undulating rainbow frequency waves with pulsating chromatic glow.',
    generate: (ctx, w, h) => {
      for (let i = 0; i < 6; i++) {
        const hue = i * 60;
        const grad = ctx.createRadialGradient(w*0.5, h*0.5, w*i*0.07, w*0.5, h*0.5, w*(i+1)*0.07);
        grad.addColorStop(0, `hsla(${hue},100%,65%,1)`);
        grad.addColorStop(1, `hsla(${hue+60},100%,65%,1)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
      }
      const shine = ctx.createRadialGradient(w*0.6, h*0.35, 2, w*0.6, h*0.35, w*0.25);
      shine.addColorStop(0, 'rgba(255,255,255,0.9)');
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine;
      ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
    },
    vertexShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;

vec3 rainbow(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  float fresnel = 1.0 - max(dot(v_normal, v_view_dir), 0.0);
  float t = fresnel * 3.0 + u_time * 1.2 + v_normal.y * 2.0;
  vec3 col = rainbow(t);
  float pulse = 0.85 + 0.25 * sin(u_time * 4.0 + fresnel * 8.0);
  gl_FragColor = vec4(col * pulse, 1.0);
}`
  },
  {
    id: 'anim_electric_arc',
    name: 'Electric Arc Lightning',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'High-voltage electric lightning energy with pulsing blue-violet plasma bolts.',
    generate: (ctx, w, h) => {
      ctx.fillStyle = '#050518';
      ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
      const rim = ctx.createRadialGradient(w/2, h/2, w*0.3, w/2, h/2, w*0.5);
      rim.addColorStop(0, 'rgba(0,0,0,0)');
      rim.addColorStop(0.7, 'rgba(80,160,255,0.5)');
      rim.addColorStop(0.95, 'rgba(180,220,255,0.95)');
      rim.addColorStop(1, 'rgba(255,255,255,1)');
      ctx.fillStyle = rim;
      ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#00eeff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w*0.45, h*0.3); ctx.lineTo(w*0.52, h*0.5); ctx.lineTo(w*0.47, h*0.55); ctx.lineTo(w*0.55, h*0.72);
      ctx.stroke();
    },
    vertexShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec3 v_position;
uniform float u_time;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec3 pos = position;
  float bolt = sin(pos.y * 18.0 + u_time * 20.0) * 0.012 * max(0.0, sin(u_time * 5.0));
  pos.x += bolt;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  v_view_dir = normalize(-mv.xyz);
  v_position = pos;
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec3 v_position;

void main() {
  float fresnel = pow(1.0 - max(dot(v_normal, v_view_dir), 0.0), 2.0);
  float sparks = sin(v_position.y * 30.0 + u_time * 15.0) * cos(v_position.x * 25.0 - u_time * 12.0);
  float bolt = smoothstep(0.85, 0.98, abs(sparks));
  vec3 baseColor = mix(vec3(0.05, 0.02, 0.2), vec3(0.1, 0.5, 1.0), fresnel);
  vec3 sparkColor = vec3(0.6, 0.95, 1.0) * bolt * 2.5;
  gl_FragColor = vec4(baseColor + sparkColor, 1.0);
}`
  },
  {
    id: 'anim_cosmic_galaxy',
    name: 'Parallax Fractal Galaxy',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'Multi-layer cosmic galaxy with starfield sparkles and deep space pulsation.',
    generate: (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w/2);
      grad.addColorStop(0, '#f368e0');
      grad.addColorStop(0.35, '#5f27cd');
      grad.addColorStop(0.7, '#0a0026');
      grad.addColorStop(1, '#02000a');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI * 2); ctx.fill();
    },
    vertexShader: `precision mediump float;
varying vec2 v_view_uv;
varying vec3 v_normal;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_view_uv = v_normal.xy * 0.5 + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `precision highp float;
uniform float u_time;
varying vec2 v_view_uv;
varying vec3 v_normal;

void main() {
  vec2 p = (v_view_uv - 0.5) * 2.5;
  float t = u_time * 0.4;
  float a = atan(p.y, p.x) + t * 0.5;
  float r = length(p);
  float spiral = sin(r * 12.0 - a * 3.0);
  float stars = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  stars = step(0.96, stars) * (0.5 + 0.5 * sin(u_time * 6.0 + r * 10.0));
  
  vec3 col = mix(vec3(0.02, 0.0, 0.1), vec3(0.9, 0.2, 0.8), smoothstep(0.8, 0.0, r));
  col += vec3(0.2, 0.6, 1.0) * smoothstep(0.2, 0.8, spiral) * (1.0 - r * 0.5);
  col += vec3(1.0, 0.9, 0.8) * stars * 2.0;
  
  gl_FragColor = vec4(col, 1.0);
}`
  },
  {
    id: 'anim_molten_lava',
    name: 'Molten Dopamine Lava',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'Viscous glowing neon magma with swirling incandescent thermal cracks.',
    generate: (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w/2);
      grad.addColorStop(0, '#ffff00');
      grad.addColorStop(0.3, '#ff4500');
      grad.addColorStop(0.7, '#8b0000');
      grad.addColorStop(1, '#1a0000');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
    },
    vertexShader: `precision mediump float;
varying vec3 v_normal;
varying vec2 v_uv;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
  vec2 uv = (v_normal.xy * 0.5 + 0.5) * 4.0;
  float t = u_time * 0.6;
  float noise = sin(uv.x * 3.0 + t) * cos(uv.y * 3.0 - t * 0.8) + sin(uv.x * 5.0 - uv.y * 4.0 + t * 1.5) * 0.5;
  
  vec3 crust = vec3(0.12, 0.02, 0.02);
  vec3 fire = vec3(1.0, 0.25, 0.0);
  vec3 core = vec3(1.0, 0.95, 0.3);
  
  float crack = smoothstep(-0.2, 0.6, noise);
  vec3 col = mix(crust, fire, crack);
  col = mix(col, core, smoothstep(0.4, 0.9, noise));
  
  gl_FragColor = vec4(col, 1.0);
}`
  },
  {
    id: 'anim_hologram_scan',
    name: 'Cyber Hologram Scan',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'Sci-fi holographic projection with sweeping scanline beam and digital interference.',
    generate: (ctx, w, h) => {
      ctx.fillStyle = '#03111a'; ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
      const rim = ctx.createRadialGradient(w/2, h/2, w*0.35, w/2, h/2, w*0.5);
      rim.addColorStop(0, 'rgba(0,255,255,0)');
      rim.addColorStop(1, 'rgba(0,255,255,0.9)');
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
    },
    vertexShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec3 v_pos;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  v_pos = position;
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec3 v_pos;

void main() {
  float fresnel = pow(1.0 - max(dot(v_normal, v_view_dir), 0.0), 2.0);
  float scanline = sin(v_pos.y * 60.0 + u_time * 12.0) * 0.5 + 0.5;
  float beam = smoothstep(0.9, 1.0, sin(v_pos.y * 8.0 - u_time * 4.0));
  vec3 holoColor = vec3(0.0, 0.95, 1.0);
  float alpha = clamp(fresnel * 0.8 + scanline * 0.25 + beam * 0.5, 0.0, 1.0);
  gl_FragColor = vec4(holoColor * (1.0 + beam), alpha);
}`
  },
  {
    id: 'anim_twgl_plasma',
    name: 'Psychedelic Plasma Waves',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'Hypnotic mathematical plasma wave interference with shifting neon spectrum colors.',
    generate: (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w/2, h/2, 5, w/2, h/2, w/2);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(0.3, '#ff00ff');
      grad.addColorStop(0.6, '#ffff00');
      grad.addColorStop(1, '#0000ff');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
    },
    vertexShader: `precision mediump float;
varying vec2 v_uv;
varying vec3 v_normal;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_uv = v_normal.xy * 0.5 + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec2 v_uv;
varying vec3 v_normal;

void main() {
  vec2 uv = v_uv * 3.0;
  float t = u_time * 0.8;
  float v = sin(uv.x * 4.0 + t) + sin(uv.y * 4.0 - t * 0.7) + sin((uv.x + uv.y) * 3.0 + t * 1.2);
  v *= 0.333;
  vec3 col = vec3(sin(v * 3.1415 + t) * 0.5 + 0.5, sin(v * 3.1415 + t + 2.0) * 0.5 + 0.5, sin(v * 3.1415 + t + 4.0) * 0.5 + 0.5);
  gl_FragColor = vec4(col, 1.0);
}`
  },
  {
    id: 'anim_magic_glitter',
    name: 'Shimmering Magic Glitter',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'Dynamic sparkling starlight glitter field that twinkles and shifts with movement.',
    generate: (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w/2, h/2, 5, w/2, h/2, w/2);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ffeaa7');
      grad.addColorStop(0.7, '#fd79a8');
      grad.addColorStop(1, '#6c5ce7');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
    },
    vertexShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec3 v_pos;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  v_pos = position;
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec3 v_pos;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  float fresnel = 1.0 - max(dot(v_normal, v_view_dir), 0.0);
  
  // High-frequency micro-scale glitter field with circular particle falloff
  vec3 p = v_pos * 160.0;
  vec3 grid = floor(p);
  vec3 fractP = fract(p) - 0.5;
  float rnd = hash(grid);
  
  // Jitter spark center within each cell for natural distribution
  vec3 offset = (vec3(hash(grid + 0.1), hash(grid + 0.2), hash(grid + 0.3)) - 0.5) * 0.55;
  float d = length(fractP - offset);
  
  float twinkle = sin(u_time * 7.0 + rnd * 6.28318) * 0.5 + 0.5;
  float flake = smoothstep(0.32, 0.04, d);
  float sparkle = step(0.82, rnd) * flake * twinkle;
  
  vec3 base = mix(vec3(0.9, 0.4, 0.7), vec3(0.4, 0.8, 1.0), fresnel);
  vec3 glitter = vec3(1.0, 0.96, 0.8) * sparkle * 3.5;
  gl_FragColor = vec4(base + glitter, 1.0);
}`
  },
  {
    id: 'anim_candy_chrome',
    name: 'Pulsing Candy Chrome',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'Ultra-glossy metallic chrome reflecting animated chromatic rainbow horizon reflections.',
    generate: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#ff007f');
      grad.addColorStop(0.45, '#7928ca');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(0.55, '#00f2fe');
      grad.addColorStop(1, '#110033');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(w/2, h/2, w/2, 0, Math.PI*2); ctx.fill();
    },
    vertexShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;

void main() {
  vec3 ref = reflect(-v_view_dir, v_normal);
  float horizon = sin(ref.y * 6.0 + u_time * 2.0);
  vec3 sky = mix(vec3(1.0, 0.1, 0.6), vec3(0.0, 0.9, 1.0), ref.y * 0.5 + 0.5);
  vec3 ground = vec3(0.08, 0.02, 0.15);
  vec3 col = mix(ground, sky, step(0.0, horizon));
  col += vec3(1.0) * pow(max(dot(ref, normalize(vec3(0.5, 0.8, 0.3))), 0.0), 32.0);
  gl_FragColor = vec4(col, 1.0);
}`
  },
  {
    id: 'anim_playdoh_squish',
    name: 'Animated Squishy Play-Doh',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'Squishy organic morphing modeling clay that breathes and squishes with stop-motion animation.',
    generate: (ctx, w, h) => {
      const cx = w * 0.5, cy = h * 0.5, r = w * 0.5;
      const grad = ctx.createRadialGradient(cx * 0.7, cy * 0.35, 10, cx, cy, r);
      grad.addColorStop(0.0, '#ffec5c');
      grad.addColorStop(0.35, '#ffc048');
      grad.addColorStop(0.7, '#ff5e57');
      grad.addColorStop(1.0, '#485460');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    },
    vertexShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  v_uv = uv;
  vec3 pos = position;
  float squish = sin(pos.y * 6.0 + u_time * 3.0) * cos(pos.x * 6.0 + u_time * 2.5) * 0.04;
  pos += normal * squish;
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(-v_position);
  vec3 L = normalize(vec3(0.4, 0.8, 0.5));
  float diff = max(dot(N, L), 0.0);
  float rim = pow(1.0 - max(dot(V, N), 0.0), 2.5);
  
  // Soft matte Play-Doh clay color with subtle hue shifts
  vec3 clayColor = mix(vec3(1.0, 0.45, 0.2), vec3(1.0, 0.85, 0.2), sin(u_time * 1.5 + v_uv.y * 3.0) * 0.5 + 0.5);
  vec3 ambient = clayColor * 0.35;
  vec3 diffuse = clayColor * diff * 0.75;
  vec3 rimCol = vec3(1.0, 0.95, 0.8) * rim * 0.35;
  
  gl_FragColor = vec4(ambient + diffuse + rimCol, 1.0);
}`
  },
  {
    id: 'anim_playdoh_rainbow',
    name: 'Animated Rainbow Clay',
    category: '⚡ Animated Shaders',
    type: 'shader',
    description: 'Swirling rainbow swirl Play-Doh that squishes and flows like organic modeling dough.',
    generate: (ctx, w, h) => {
      const cx = w * 0.5, cy = h * 0.5, r = w * 0.5;
      const grad = ctx.createRadialGradient(cx * 0.65, cy * 0.35, 8, cx, cy, r);
      grad.addColorStop(0.0, '#ff9ff3');
      grad.addColorStop(0.3, '#feca57');
      grad.addColorStop(0.6, '#48dbfb');
      grad.addColorStop(1.0, '#1dd1a1');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    },
    vertexShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
void main() {
  vec3 pos = position;
  float wave = sin(pos.y * 8.0 + u_time * 2.0) * 0.03;
  pos += normal * wave;
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;

vec3 rainbow(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(-v_position);
  float diff = max(dot(N, normalize(vec3(0.5, 0.7, 0.5))), 0.0);
  float t = N.y * 2.0 + u_time * 0.5 + sin(N.x * 3.0);
  vec3 clay = rainbow(t);
  gl_FragColor = vec4(clay * (0.4 + diff * 0.6), 1.0);
}`
  },
  {
    id: 'anim_stars_galaxy',
    name: 'Cosmic Starfield & Galaxy',
    category: '⭐ Stars & Space',
    type: 'shader',
    description: 'Deep cosmic galaxy vortex with twinkling stars, rotating nebulae, and stardust particles.',
    generate: (ctx, w, h) => {
      const cx = w * 0.5, cy = h * 0.5, r = w * 0.5;
      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
      grad.addColorStop(0.0, '#fff');
      grad.addColorStop(0.2, '#9c88ff');
      grad.addColorStop(0.5, '#4834d4');
      grad.addColorStop(0.85, '#130f40');
      grad.addColorStop(1.0, '#020008');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    },
    vertexShader: `precision mediump float;
varying vec2 v_uv;
varying vec3 v_normal;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_uv = v_normal.xy * 0.5 + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `precision mediump float;
uniform float u_time;
varying vec2 v_uv;
varying vec3 v_normal;

void main() {
  vec2 p = (v_uv - 0.5) * 3.0;
  float t = u_time * 0.35;
  float r = length(p);
  float a = atan(p.y, p.x) + r * 2.0 - t;
  
  float spiral = sin(a * 4.0 + r * 6.0);
  float stars = fract(sin(dot(floor(p * 25.0), vec2(12.9898, 78.233))) * 43758.5453);
  float twinkle = step(0.92, stars) * (0.6 + 0.4 * sin(u_time * 8.0 + stars * 20.0));
  
  vec3 nebula = mix(vec3(0.02, 0.01, 0.08), vec3(0.8, 0.2, 0.9), smoothstep(1.5, 0.0, r));
  nebula += vec3(0.2, 0.7, 1.0) * smoothstep(0.1, 0.9, spiral) * max(0.0, 1.0 - r * 0.7);
  vec3 starColor = vec3(1.0, 0.95, 0.85) * twinkle * 2.5;
  
  gl_FragColor = vec4(nebula + starColor, 1.0);
}`
  }
];

