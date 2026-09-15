import"./vendor-react-Lkv5cdhV.js";const c=`precision mediump float;
varying vec2 v_uv;
varying vec2 v_view_uv;
varying vec3 v_obj_pos;
varying vec3 v_normal;
varying vec3 v_position;

void main() {
  v_uv = uv;
  v_obj_pos = position;
  v_normal = normalize(normalMatrix * normal);
  v_view_uv = v_normal.xy * 0.5 + 0.5;
  vec4 mv_pos = modelViewMatrix * vec4(position, 1.0);
  v_position = mv_pos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,f=`
uniform float u_mapping;
varying vec2 v_uv;
varying vec2 v_view_uv;
varying vec3 v_obj_pos;
varying vec3 v_normal;

vec2 getCoords() {
    if (u_mapping > 2.5) {
        return v_uv;
    } else if (u_mapping > 1.5) {
        return gl_FragCoord.xy / iResolution.xy;
    } else if (u_mapping > 0.5) {
        if (abs(v_normal.z) > 0.99 && length(v_normal.xy) < 0.02) return v_uv;
        return vec2(v_obj_pos.x * 0.38 + 0.5, v_obj_pos.y * 0.45 + 0.5);
    } else {
        if (abs(v_normal.z) > 0.99 && length(v_normal.xy) < 0.02) return v_uv;
        return v_view_uv;
    }
}
`,z=[{id:"live_toon_water_07",name:"Toon Water Ripples",category:"🌊 Live Desktop Shaders",type:"shader",description:"Layered dual-octave FBM animated toon water ripples, dynamic crest foam, and vibrant gradient aqua.",generate:(e,o,i)=>{const a=e.createLinearGradient(0,0,0,i);a.addColorStop(0,"#00d2d3"),a.addColorStop(.5,"#0984e3"),a.addColorStop(1,"#074278"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255, 255, 255, 0.85)",e.lineWidth=5;for(let r=0;r<4;r++)e.beginPath(),e.arc(o/2,i*(.3+r*.18),o*.35,.2,Math.PI-.2),e.stroke()},vertexShader:c,fragmentShader:`precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float u_speed;
uniform vec3 u_tint;
`+f+`
#define white vec3(1.0)

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
    vec3 n = h * h * h * h * vec3(
        dot(a, hash(i + 0.0)),
        dot(b, hash(i + o)),
        dot(c, hash(i + 1.0))
    );
    return dot(n, vec3(70.0));
}

float fbm(vec2 p){
    float a = 0.5;
    float n = 0.0;
    for(float i = 0.0; i < 4.0; i++){
        n += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return n;
}

void main() {
    float T = iTime * (u_speed > 0.0 ? u_speed : 1.0);
    vec2 uv = getCoords();
    vec3 col = mix(vec3(0.11, 0.86, 0.98), vec3(0.04, 0.35, 0.96), 1.0 - uv.y);

    float n1 = abs(fbm(uv * 4.0 + vec2(0.0, T * 0.5)) - noise(uv * 2.0 + vec2(0.0, T * 1.2)) * 0.8);
    float v = 0.05;
    float feath = 0.05;
    float s = smoothstep(v + feath, v, n1);
    col = mix(col, white, s * 0.5);

    float n2 = abs(fbm(uv * 3.0 + vec2(0.0, T * 0.2) + vec2(0.1)) - noise(uv * 2.0 + vec2(0.0, T * 0.8)) * 0.5);
    float v2 = 0.04;
    float s2 = smoothstep(v2 + feath, v2, n2);
    col = mix(col, white, s2 * 0.3);

    float d = uv.y - sin(uv.x * 10.0) / 15.0 - n1 * 0.5;
    float s3 = smoothstep(0.1, 0.09, d);
    col = mix(col, white, s3 * 0.6);

    gl_FragColor = vec4(col, 1.0);
}`},{id:"live_galaxy_fractal",name:"Parallax Fractal Galaxy",category:"🌊 Live Desktop Shaders",type:"shader",description:"Multi-layer Kaliset fractal galaxy with parallax cosmic depth, starfield sparkles, and harmonic pulsation.",generate:(e,o,i)=>{const a=e.createRadialGradient(o/2,i/2,10,o/2,i/2,o/2);a.addColorStop(0,"#f368e0"),a.addColorStop(.35,"#5f27cd"),a.addColorStop(.7,"#0a0026"),a.addColorStop(1,"#02000a"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255, 235, 150, 0.6)",e.lineWidth=3,e.beginPath();for(let r=0;r<Math.PI*4;r+=.1){const t=r*15,l=o/2+Math.cos(r)*t,n=i/2+Math.sin(r)*t;r===0?e.moveTo(l,n):e.lineTo(l,n)}e.stroke()},vertexShader:c,fragmentShader:`precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float u_speed;
`+f+`

float field(in vec3 p, float s, float t) {
    float strength = 7.0 + 0.03 * log(1.e-6 + fract(sin(t) * 4373.11));
    float accum = s / 4.0;
    float prev = 0.0;
    float tw = 0.0;
    for (int i = 0; i < 26; ++i) {
        float mag = dot(p, p);
        p = abs(p) / mag + vec3(-0.5, -0.4, -1.5);
        float w = exp(-float(i) / 7.0);
        accum += w * exp(-strength * pow(abs(mag - prev), 2.2));
        tw += w;
        prev = mag;
    }
    return max(0.0, 5.0 * accum / tw - 0.7);
}

float field2(in vec3 p, float s, float t) {
    float strength = 7.0 + 0.03 * log(1.e-6 + fract(sin(t) * 4373.11));
    float accum = s / 4.0;
    float prev = 0.0;
    float tw = 0.0;
    for (int i = 0; i < 18; ++i) {
        float mag = dot(p, p);
        p = abs(p) / mag + vec3(-0.5, -0.4, -1.5);
        float w = exp(-float(i) / 7.0);
        accum += w * exp(-strength * pow(abs(mag - prev), 2.2));
        tw += w;
        prev = mag;
    }
    return max(0.0, 5.0 * accum / tw - 0.7);
}

vec3 nrand3(vec2 co) {
    vec3 a = fract(cos(co.x * 8.3e-3 + co.y) * vec3(1.3e5, 4.7e5, 2.9e5));
    vec3 b = fract(sin(co.x * 0.3e-3 + co.y) * vec3(8.1e5, 1.0e5, 0.1e5));
    return mix(a, b, 0.5);
}

float getFreq(float x, float t) {
    return clamp(sin(t * 2.0 + x * 10.0) * 0.3 + cos(t * 1.5 - x * 5.0) * 0.3 + 0.5, 0.0, 1.0);
}

void main() {
    float t = iTime * (u_speed > 0.0 ? u_speed : 1.0);
    vec2 uv = (getCoords() * 2.0 - 1.0);
    vec3 p = vec3(uv / 2.0, 0.0) + vec3(1.0, -1.3, 0.0);
    p += 0.2 * vec3(sin(t / 16.0), sin(t / 12.0), sin(t / 128.0));

    float f0 = getFreq(0.01, t);
    float f1 = getFreq(0.07, t);
    float f2 = getFreq(0.15, t);
    float f3 = getFreq(0.30, t);

    float t1 = field(p, f2, t);
    float v = (1.0 - exp((abs(uv.x) - 1.0) * 6.0)) * (1.0 - exp((abs(uv.y) - 1.0) * 6.0));

    vec3 p2 = vec3(uv / (4.0 + sin(t * 0.11) * 0.2 + 0.2 + sin(t * 0.15) * 0.3 + 0.4), 1.5) + vec3(2.0, -1.3, -1.0);
    p2 += 0.25 * vec3(sin(t / 16.0), sin(t / 12.0), sin(t / 128.0));
    float t2 = field2(p2, f3, t);
    vec4 c2 = mix(0.4, 1.0, v) * vec4(1.3 * t2 * t2 * t2, 1.8 * t2 * t2, t2 * f0, t2);

    vec2 seed = floor(p.xy * 2.0 * 500.0);
    vec3 rnd = nrand3(seed);
    vec4 starcolor = vec4(pow(rnd.y, 40.0));

    vec4 finalColor = mix(f3 - 0.3, 1.0, v) * vec4(1.5 * f2 * t1 * t1 * t1, 1.2 * f1 * t1 * t1, f3 * t1, 1.0) + c2 + starcolor;
    gl_FragColor = vec4(finalColor.rgb, 1.0);
}`},{id:"live_mystic_portal",name:"Mystic Energy Portal",category:"🌊 Live Desktop Shaders",type:"shader",description:"Swirling concentric vortex rings with chromatic edge aberration, event horizon distortion, and pulsing core.",generate:(e,o,i)=>{const a=e.createRadialGradient(o/2,i/2,5,o/2,i/2,o/2);a.addColorStop(0,"#ffffff"),a.addColorStop(.2,"#00d2d3"),a.addColorStop(.5,"#5f27cd"),a.addColorStop(.85,"#1e0847"),a.addColorStop(1,"#05010f"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(0, 210, 211, 0.75)",e.lineWidth=4;for(let r=40;r<o/2;r+=35)e.beginPath(),e.arc(o/2,i/2,r,0,Math.PI*2),e.stroke()},vertexShader:c,fragmentShader:`precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float u_speed;
`+f+`

float hash12(vec2 p) {
    vec3 p3 = fract(p.xyx * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float res = mix(
        mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
        mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0)), f.x), f.y);
    return res * res;
}

void main() {
    float t = iTime * (u_speed > 0.0 ? u_speed : 1.0);
    vec2 uv = (getCoords() * 2.0 - 1.0);

    float l = sqrt(length(uv));
    float a = l * 9.0 - t;

    uv = cos(-uv.x + a) * uv + sin(a) * vec2(-uv.y, uv.x);

    float n = sqrt(noise(uv * 6.0));
    float b = noise(35.185 - uv * 8.0);
    float c = 1.0 / (b + 1.0);
    float s = smoothstep(0.3, 0.6 * c, n * (1.25 - l * l));
    float d = sin(6.0 * n * b) * 0.5 + 0.5;

    vec3 c1 = cos(vec3(s * n, n * n, d - s) * 8.0 - b) * 0.5 + 0.5;
    vec3 c2 = sin((vec3(s - b, -n, n)) * 6.0);
    vec3 c3 = sin(vec3(b, b, d) * 2.0 / (0.2 + l));

    vec3 col = c1 * s;
    col += (1.0 - s) * c2 * smoothstep(0.2, 0.4, b * (1.1 - l * l));
    col += mix((1.0 - l) * c3 * l, (0.8 - l) * c3 * l, l);
    col = clamp(col, vec3(0.0), vec3(1.0));

    gl_FragColor = vec4(col, 1.0);
}`},{id:"live_mind_flowers",name:"Mind Flowers Mandala",category:"🌊 Live Desktop Shaders",type:"shader",description:"Hypnotic kaleidoscope sacred geometry portal with blooming psychedelic mandalas and color cycling.",generate:(e,o,i)=>{e.fillStyle="#08020f",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const a=["#ff9ff3","#feca57","#ff6b6b","#48dbfb","#1dd1a1"];for(let r=0;r<5;r++){e.strokeStyle=a[r],e.lineWidth=3;const t=8+r*2,l=25+r*25;for(let n=0;n<t;n++){const s=n/t*Math.PI*2;e.beginPath(),e.arc(o/2+Math.cos(s)*l,i/2+Math.sin(s)*l,18,0,Math.PI*2),e.stroke()}}},vertexShader:c,fragmentShader:`precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float u_speed;
`+f+`

#define TIME (iTime * (u_speed > 0.0 ? u_speed : 1.0))
#define PI 3.141592654
#define TAU (2.0*PI)
#define PI_2 (0.5*PI)
#define BPM 33.0

const float planeDist = 0.20;
const int furthest = 16;
const int fadeFrom = 12;
const float fadeDist = 0.80;

const float ringDistance = 0.075;
const float glowFactor = 0.05;

vec4 alphaBlend(vec4 back, vec4 front) {
    float w = front.w + back.w * (1.0 - front.w);
    vec3 xyz = (front.xyz * front.w + back.xyz * back.w * (1.0 - front.w)) / max(w, 0.0001);
    return w > 0.0 ? vec4(xyz, w) : vec4(0.0);
}

float hash(float co) {
    return fract(sin(co * 12.9898) * 13758.5453);
}

vec3 offset(float z) {
    float a = z;
    vec2 p = -0.15 * (vec2(cos(a), sin(a * sqrt(2.0))) + vec2(cos(a * sqrt(0.75)), sin(a * sqrt(0.5))));
    return vec3(p, z);
}

vec3 doffset(float z) {
    float eps = 0.05;
    return 0.5 * (offset(z + eps) - offset(z - eps)) / (2.0 * eps);
}

vec3 ddoffset(float z) {
    float eps = 0.05;
    return 0.5 * (doffset(z + eps) - doffset(z - eps)) / (2.0 * eps);
}

float mod1(inout float p, float size) {
    float halfsize = size * 0.5;
    float c = floor((p + halfsize) / size);
    p = mod(p + halfsize, size) - halfsize;
    return c;
}

float atan_approx(float y, float x) {
    float cosatan2 = x / (abs(x) + abs(y) + 1e-6);
    float t = PI_2 - cosatan2 * PI_2;
    return y < 0.0 ? -t : t;
}

vec2 toPolar(vec2 p) {
    return vec2(length(p), atan_approx(p.y, p.x));
}

vec3 glow(vec2 pp, float h) {
    float hh = fract(h * 8677.0);
    float b = TAU * h + 0.5 * TIME * (hh > 0.5 ? 1.0 : -1.0);
    float a = pp.y + b;
    float d = max(abs(pp.x) - 0.001, 0.00125);
    return (smoothstep(0.667 * ringDistance, 0.2 * ringDistance, d) *
           mix(vec3(1.0), sin(vec3(0.0, 1.0, 2.0) + a * 3.0) * 0.5 + 0.5, 0.75) +
           glowFactor * ringDistance / d * sin(vec3(3.0, 2.0, 1.0) + a * 3.0) * 0.5 + 0.5) *
           exp(-10.0 * pp.x);
}

vec4 plane(vec3 ro, vec3 rd, vec3 pp, float h) {
    float l = length(pp - ro);
    vec2 p = pp.xy;
    p = toPolar(p);
    float h2 = mod1(p.x, ringDistance);
    vec3 col = glow(p, h + h2);
    float t = smoothstep(fadeDist, 0.0, l - float(fadeFrom) * planeDist);
    return vec4(col, t);
}

vec3 color(vec3 ww, vec3 uu, vec3 vv, vec3 ro, vec2 p) {
    vec3 rd = normalize(p.x * uu + p.y * vv + 2.0 * ww);
    float nz = floor(ro.z / planeDist);
    vec4 acol = vec4(0.0);
    for (int i = 1; i <= furthest; ++i) {
        float z = float(i) * planeDist + nz * planeDist;
        vec3 pp = ro + rd * (z - ro.z) / rd.z;
        float h = hash(z);
        vec4 col = plane(ro, rd, pp, h);
        acol = alphaBlend(col, acol);
    }
    return acol.xyz;
}

vec3 effect(vec2 p) {
    float tm = planeDist * TIME * BPM / 60.0;
    vec3 ro = offset(tm);
    vec3 dro = doffset(tm);
    vec3 ddro = ddoffset(tm);
    vec3 ww = normalize(dro);
    vec3 uu = normalize(cross(normalize(vec3(0.0, 1.0, 0.0) + ddro), ww));
    vec3 vv = cross(ww, uu);
    vec3 col = color(ww, uu, vv, ro, p);
    col -= 0.075 * vec3(2.0, 3.0, 1.0);
    col *= sqrt(2.0);
    col = clamp(col, 0.0, 1.0);
    col = sqrt(col);
    return col;
}

void main() {
    vec2 p = -1.0 + 2.0 * getCoords();
    vec3 col = effect(p);
    gl_FragColor = vec4(col, 1.0);
}`},{id:"live_simplicity_space",name:"Simplicity Galaxy Nebula",category:"🌊 Live Desktop Shaders",type:"shader",description:"Volumetric Kaliset nebula clouds with interactive dispersion, twinkling stars, and deep cosmic violet hues.",generate:(e,o,i)=>{const a=e.createRadialGradient(o/2,i/2,10,o/2,i/2,o/2);a.addColorStop(0,"#22a6b3"),a.addColorStop(.4,"#30336b"),a.addColorStop(.75,"#130f40"),a.addColorStop(1,"#05021a"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#ffbe76";for(let r=0;r<30;r++){const t=Math.random()*o,l=Math.random()*i;e.beginPath(),e.arc(t,l,Math.random()*3+1,0,Math.PI*2),e.fill()}},vertexShader:c,fragmentShader:`precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float u_speed;
`+f+`

const int MAX_ITER = 18;

float field(vec3 p, float s, int iter) {
    float accum = s / 4.0;
    float prev = 0.0;
    float tw = 0.0;
    for (int i = 0; i < MAX_ITER; ++i) {
        if (i >= iter) break;
        float mag = dot(p, p);
        p = abs(p) / mag + vec3(-0.5, -0.4, -1.487);
        float w = exp(-float(i) / 5.0);
        accum += w * exp(-9.025 * pow(abs(mag - prev), 2.2));
        tw += w;
        prev = mag;
    }
    return max(0.0, 5.2 * accum / tw - 0.65);
}

vec3 nrand3(vec2 co) {
    vec3 a = fract(cos(co.x * 8.3e-3 + co.y) * vec3(1.3e5, 4.7e5, 2.9e5));
    vec3 b = fract(sin(co.x * 0.3e-3 + co.y) * vec3(8.1e5, 1.0e5, 0.1e5));
    return mix(a, b, 0.5);
}

vec4 starLayer(vec2 p, float time) {
    vec2 seed = 1.9 * p.xy;
    seed = floor(seed * 400.0);
    vec3 rnd = nrand3(seed);
    vec4 col = vec4(pow(rnd.y, 17.0));
    float mul = 10.0 * rnd.x;
    col.xyz *= sin(time * mul + mul) * 0.25 + 1.0;
    return col;
}

void main() {
    float time = (iTime * (u_speed > 0.0 ? u_speed : 1.0)) * 0.8;
    vec2 uv = (getCoords() * 2.0 - 1.0);
    vec3 p = vec3(uv / 2.5, 0.0) + vec3(0.8, -1.3, 0.0);
    p += 0.45 * vec3(sin(time / 32.0), sin(time / 24.0), sin(time / 64.0));

    float freqs[4];
    freqs[0] = 0.45;
    freqs[1] = 0.40;
    freqs[2] = 0.15;
    freqs[3] = 0.90;

    float t = field(p, freqs[2], 13);
    float v = (1.0 - exp((abs(uv.x) - 1.0) * 6.0)) * (1.0 - exp((abs(uv.y) - 1.0) * 6.0));

    vec3 p2 = vec3(uv / (4.0 + sin(time * 0.11) * 0.2 + 0.2 + sin(time * 0.15) * 0.3 + 0.4), 4.0) + vec3(2.0, -1.3, -1.0);
    p2 += 0.16 * vec3(sin(time / 32.0), sin(time / 24.0), sin(time / 64.0));
    float t2 = field2(p2, freqs[3], 18);
    vec4 c2 = mix(0.4, 1.0, v) * vec4(1.3 * t2 * t2 * t2, 1.8 * t2 * t2, t2 * freqs[0], t2);

    vec4 starcolor = starLayer(p.xy, time);
    vec4 starcolor2 = starLayer(p2.xy, time * 0.8);

    vec4 colour = mix(freqs[3] - 0.3, 1.0, v) * vec4(1.5 * freqs[2] * t * t * t, 1.2 * freqs[1] * t * t, freqs[3] * t, 1.0) + c2 + starcolor + starcolor2;
    gl_FragColor = vec4(colour.rgb, 1.0);
}`},{id:"live_toon_beach",name:"Toon Beach & Waves",category:"🌊 Live Desktop Shaders",type:"shader",description:"Stylized anime shoreline with rhythmic rolling wave surf, animated foam boundary, and golden sand.",generate:(e,o,i)=>{e.fillStyle="#00cec9",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#f6e58d",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI),e.fill(),e.strokeStyle="#ffffff",e.lineWidth=6,e.beginPath(),e.moveTo(0,i/2),e.quadraticCurveTo(o*.25,i*.45,o*.5,i*.5),e.quadraticCurveTo(o*.75,i*.55,o,i*.5),e.stroke()},vertexShader:c,fragmentShader:`precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float u_speed;
`+f+`

#define PI 3.14159265359

float plotFoam(vec2 st, float pct, float t){
    return step(pct + 0.06, st.y) - step(pct + 0.08 + abs(sin(t * 0.25) * 0.3), st.y);
}

float plotSand(vec2 st, float pct){
    return step(pct + 0.08, st.y);
}

float plotSea(vec2 st, float pct){
    return step(pct - 0.7, st.y) - step(pct + 0.06, st.y);
}

float plotDeepSea(vec2 st, float pct){
    return 1.0 - step(pct - 0.7, st.y);
}

void main() {
    float t = iTime * (u_speed > 0.0 ? u_speed : 1.0);
    vec2 st = getCoords();
    float y = sin(t * 0.5) * 0.4 + sin(PI * 8.0 * st.x) * 0.02 + st.x - 0.2;

    float foam = plotFoam(st, y, t);
    float sand = plotSand(st, y);
    float sea = plotSea(st, y);
    float deepSea = plotDeepSea(st, y);

    vec3 color = sea * vec3(0.0, 0.8, 1.0) +
                 foam * vec3(1.0) +
                 sand * vec3(1.0, 0.8, 0.2) +
                 deepSea * vec3(0.2, 0.3, 0.8);

    gl_FragColor = vec4(color, 1.0);
}`},{id:"live_toon_water_voronoi",name:"Toon Voronoi Water",category:"🌊 Live Desktop Shaders",type:"shader",description:"Animated caustic Voronoi cell network with specular water peaks, crystal aqua lagoon refraction, and foam.",generate:(e,o,i)=>{const a=e.createRadialGradient(o/2,i/2,10,o/2,i/2,o/2);a.addColorStop(0,"#55efc4"),a.addColorStop(.4,"#00cec9"),a.addColorStop(.8,"#0984e3"),a.addColorStop(1,"#074278"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255, 255, 255, 0.8)",e.lineWidth=3;const r=[[o*.3,i*.3],[o*.7,i*.25],[o*.5,i*.55],[o*.25,i*.75],[o*.75,i*.7]];for(let t=0;t<r.length;t++)for(let l=t+1;l<r.length;l++)e.beginPath(),e.moveTo(r[t][0],r[t][1]),e.lineTo(r[l][0],r[l][1]),e.stroke()},vertexShader:c,fragmentShader:`precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float u_speed;
`+f+`

float hash1(float n) { return fract(sin(n) * 43758.5453); }
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float voronoi(in vec2 x, float w, float offset, float t) {
    vec2 n = floor(x);
    vec2 f = fract(x);
    float m = 8.0;
    for (int j = -2; j <= 2; j++) {
        for (int i = -2; i <= 2; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);
            o = offset + 0.3 * sin(t + 6.2831 * o + x);
            float d = length(g - f + o);
            float h = smoothstep(-1.0, 1.0, (m - d) / w);
            m = mix(m, d, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w);
        }
    }
    return m;
}

void main() {
    float t = iTime * (u_speed > 0.0 ? u_speed : 1.0);
    vec2 uv = getCoords() * 4.0;
    uv.x += t * 0.5;
    uv.y += t * 0.25;

    vec4 a = vec4(0.114, 0.635, 0.847, 1.0);
    vec4 b = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 c = a * 0.8;

    float vNoise = voronoi(uv, 0.001, 0.5, t);
    float sNoise = voronoi(uv, 0.4, 0.5, t);
    float fVoronoi = smoothstep(0.0, 0.01, vNoise - sNoise);

    float vNoise2 = voronoi(uv, 0.001, 0.3, t);
    float sNoise2 = voronoi(uv, 0.4, 0.3, t);
    float offsetVoronoi = smoothstep(0.0, 0.01, vNoise2 - sNoise2);

    float pi = 3.14159265359;
    float wave = (sin(pi * (uv.x + uv.y)) + 1.0) / 2.0;

    vec4 bgColor2 = mix(a, c, offsetVoronoi + wave);
    vec4 finalVoronoi = mix(bgColor2, b, fVoronoi);

    gl_FragColor = vec4(finalVoronoi.rgb, 1.0);
}`},{id:"live_waterfall_toon",name:"Waterfall Toon Waves",category:"🌊 Live Desktop Shaders",type:"shader",description:"Cascading stylized waterfall rapids with froth crests, foaming water spray bursts, and emerald-mint gradients.",generate:(e,o,i)=>{const a=e.createLinearGradient(0,0,0,i);a.addColorStop(0,"#10ac84"),a.addColorStop(.5,"#1dd1a1"),a.addColorStop(1,"#00d2d3"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#ffffff";for(let r=0;r<15;r++){const t=o*(.2+r%5*.15),l=i*(.15+Math.floor(r/5)*.28);e.beginPath(),e.arc(t,l,12,0,Math.PI*2),e.fill()}},vertexShader:c,fragmentShader:`precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float u_speed;
`+f+`

#define T (iTime * (u_speed > 0.0 ? u_speed : 1.0))

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
    vec3 n = h * h * h * h * vec3(
        dot(a, hash(i + 0.0)),
        dot(b, hash(i + o)),
        dot(c, hash(i + 1.0))
    );
    return dot(n, vec3(70.0));
}

float fbm(vec2 p) {
    float a = 0.5;
    float n = 0.0;
    for(float i = 0.0; i < 4.0; i++) {
        n += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return n;
}

void main() {
    vec2 uv = getCoords() * 2.0;
    vec3 col = vec3(0.69, 0.80, 0.54);

    float n = noise(uv * vec2(12.0, 1.0) + vec2(0.0, T * 1.5));
    float s = smoothstep(0.2, 0.1, abs(n));
    col = mix(col, vec3(0.81, 0.93, 0.66), s);

    n = noise(uv * vec2(6.0, 0.5) + vec2(0.0, T));
    float d1 = uv.y - 0.4 + n * 0.6;
    float s1 = smoothstep(0.2, 0.1, d1);
    col = mix(col, vec3(0.557, 0.627, 0.475), s1);

    float d = abs(uv.y - sin(30.0 * uv.x + T * 3.0) / 20.0 - 0.7);
    float sh = smoothstep(0.2, 0.0, d);
    sh *= n * smoothstep(0.0, 0.5, sin(uv.x * 6.0 - 2.0));
    sh = smoothstep(0.1, 0.2, sh);
    col = mix(col, vec3(1.0, 1.0, 0.85), sh);

    float n2 = fbm(uv + T * 0.4);
    float d2 = uv.y - sin(uv.x * 5.0 + T * 5.0) / 25.0 - n2 * 0.1;
    float s2 = smoothstep(0.1, 0.0, d2);
    col = mix(col, vec3(0.76, 0.86, 0.67), s2);

    gl_FragColor = vec4(col, 1.0);
}`}];z.map(e=>({id:e.id,name:e.name,category:"🌊 Live Desktop Shaders",description:e.description,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,uniforms:{u_speed:{type:"range",label:"Animation Speed",value:1,min:.1,max:3,step:.1}}}));const k=[{id:"godot_wind_grass",name:"Godot: Interactive Wind Grass",category:"🌿 Godot Water & Grass",type:"shader",description:"Lush 3D grass blades with procedural Voronoi fibers, triplanar mapping, wind wave shimmer, and player push interaction.",generate:(e,o,i)=>{const a=o*.5,r=i*.5,t=o*.5,l=e.createRadialGradient(a*.65,r*.4,t*.05,a,r,t);l.addColorStop(0,"#62df2e"),l.addColorStop(.35,"#2d8c1c"),l.addColorStop(.7,"#144c0c"),l.addColorStop(1,"#072004"),e.fillStyle=l,e.beginPath(),e.arc(a,r,t,0,Math.PI*2),e.fill();const n=m=>{let p=Math.sin(m++)*1e4;return p-Math.floor(p)};e.save(),e.beginPath(),e.arc(a,r,t-1,0,Math.PI*2),e.clip();const s=["#1a520f","#2b781b","#429e28","#5ec437","#7fe34d","#a4f56c","#d2ff94"];let d=42;for(let m=8;m<t-4;m+=10){const p=Math.floor(m*2.2);for(let _=0;_<p;_++){const u=_/p*Math.PI*2+(n(d++)-.5)*.25,h=m+(n(d++)-.5)*10,y=a+Math.cos(u)*h,S=r+Math.sin(u)*h,b=10+n(d++)*16,C=u+(n(d++)-.5)*.9-Math.PI*.15,P=y+Math.cos(C)*b,M=S+Math.sin(C)*b,w=Math.min(s.length-1,Math.floor(n(d++)*s.length*(h/t*.6+.4)));e.strokeStyle=s[w],e.lineWidth=1.4+n(d++)*1.8,e.lineCap="round",e.beginPath(),e.moveTo(y,S);const G=(y+P)*.5+(n(d++)-.5)*6,I=(S+M)*.5+(n(d++)-.5)*6;e.quadraticCurveTo(G,I,P,M),e.stroke()}}const g=e.createRadialGradient(a*.35,r*.25,10,a*.35,r*.25,t*.6);g.addColorStop(0,"rgba(230, 255, 170, 0.45)"),g.addColorStop(.5,"rgba(120, 230, 50, 0.15)"),g.addColorStop(1,"rgba(0, 0, 0, 0)"),e.fillStyle=g,e.beginPath(),e.arc(a,r,t,0,Math.PI*2),e.fill(),e.restore()},vertexShader:`// VERTEX
precision mediump float;
uniform float u_time;
uniform float u_wind_speed;
uniform float u_wind_strength;
uniform float u_blade_fluff;
uniform vec3 u_char_pos;
uniform float u_char_radius;
uniform float u_push_strength;

varying vec3 v_world_pos;
varying vec3 v_local_pos;
varying vec3 v_normal;
varying vec3 v_view_pos;
varying float v_wind_wave;

float hash3D(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3D(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3D(p + vec3(0,0,0)), hash3D(p + vec3(1,0,0)), f.x),
                   mix(hash3D(p + vec3(0,1,0)), hash3D(p + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash3D(p + vec3(0,0,1)), hash3D(p + vec3(1,0,1)), f.x),
                   mix(hash3D(p + vec3(0,1,1)), hash3D(p + vec3(1,1,1)), f.x), f.y), f.z);
}

void main() {
    v_local_pos = position;
    vec3 pos = position;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    
    vec2 windDir = normalize(vec2(1.0, 0.4));
    float wave1 = sin(u_time * u_wind_speed * 2.5 + worldPos.x * 3.0 + worldPos.z * 2.0);
    float wave2 = cos(u_time * u_wind_speed * 4.0 + worldPos.x * 6.0 - worldPos.z * 4.0) * 0.5;
    float windWave = wave1 + wave2;
    v_wind_wave = windWave;

    float tuftNoise = noise3D(pos * 24.0);
    pos += normal * (tuftNoise * u_blade_fluff * 0.12);
    pos += vec3(windDir.x, 0.2, windDir.y) * (windWave * u_wind_strength * 0.08);

    vec3 toChar = worldPos.xyz - u_char_pos;
    toChar.y = 0.0;
    float dist = length(toChar);
    float pushFalloff = 1.0 - smoothstep(0.0, u_char_radius, dist);
    if (dist > 0.001) {
        pos += (inverse(mat3(modelMatrix)) * normalize(toChar)) * (pushFalloff * u_push_strength * 0.15);
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    v_view_pos = -mv.xyz;
    v_normal = normalize(normalMatrix * normal);
    v_world_pos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
}`,fragmentShader:`// FRAGMENT
precision mediump float;
uniform float u_time;
uniform vec3 u_root_color;
uniform vec3 u_mid_color;
uniform vec3 u_tip_color;
uniform vec3 u_gust_color;
uniform float u_blade_density;
uniform float u_sss_strength;
uniform vec3 u_light_dir;

varying vec3 v_world_pos;
varying vec3 v_local_pos;
varying vec3 v_normal;
varying vec3 v_view_pos;
varying float v_wind_wave;

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float voronoiGrass(vec2 uv, out float bladeHeight, out float bladeId) {
    vec2 g = floor(uv);
    vec2 f = fract(uv);
    float minD = 8.0;
    
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 cell = vec2(float(x), float(y));
            vec2 randPt = hash2(g + cell);
            vec2 offset = 0.5 + 0.35 * sin(u_time * 2.0 + 6.2831 * randPt);
            vec2 delta = cell + offset - f;
            delta.x *= 2.2;
            float d = length(delta);
            if (d < minD) {
                minD = d;
                bladeHeight = clamp(1.0 - (f.y - cell.y * 0.5), 0.0, 1.0);
                bladeId = randPt.x;
            }
        }
    }
    return minD;
}

void main() {
    vec3 norm = normalize(v_normal);
    vec3 viewDir = normalize(v_view_pos);
    vec3 light = normalize(u_light_dir);

    vec3 blend = abs(norm);
    blend = pow(blend, vec3(4.0));
    blend /= (blend.x + blend.y + blend.z);

    vec2 uvX = v_local_pos.yz * u_blade_density;
    vec2 uvY = v_local_pos.xz * u_blade_density;
    vec2 uvZ = v_local_pos.xy * u_blade_density;

    float hX, idX, hY, idY, hZ, idZ;
    float dX = voronoiGrass(uvX, hX, idX);
    float dY = voronoiGrass(uvY, hY, idY);
    float dZ = voronoiGrass(uvZ, hZ, idZ);

    float bladeDist = dX * blend.x + dY * blend.y + dZ * blend.z;
    float bladeHeight = hX * blend.x + hY * blend.y + hZ * blend.z;
    float bladeId = idX * blend.x + idY * blend.y + idZ * blend.z;

    float bladeMask = smoothstep(0.75, 0.15, bladeDist);
    float bladeTip = clamp(bladeHeight + (bladeId - 0.5) * 0.3, 0.0, 1.0);

    vec3 baseColor = mix(u_root_color, u_mid_color, smoothstep(0.0, 0.45, bladeTip));
    baseColor = mix(baseColor, u_tip_color, smoothstep(0.4, 0.95, bladeTip));

    vec3 tintVar = mix(vec3(0.92, 1.05, 0.9), vec3(1.08, 0.95, 1.0), bladeId);
    baseColor *= tintVar;

    float diff = max(dot(norm, light) * 0.5 + 0.5, 0.0);
    
    float windShimmer = smoothstep(0.2, 0.9, v_wind_wave) * bladeTip;
    vec3 finalColor = mix(baseColor * diff, u_gust_color, windShimmer * 0.45);

    float backDot = max(dot(-viewDir, light), 0.0);
    float sss = pow(backDot, 3.0) * bladeTip * u_sss_strength;
    finalColor += u_tip_color * sss;

    float ao = smoothstep(0.0, 0.5, bladeMask) * 0.6 + 0.4;
    finalColor *= ao;

    float rim = pow(1.0 - max(dot(viewDir, norm), 0.0), 3.0);
    finalColor += u_tip_color * (rim * 0.25);

    gl_FragColor = vec4(finalColor, 1.0);
}`,uniforms:{u_root_color:{type:"color",label:"Dark Root Color",value:"#0a2906"},u_mid_color:{type:"color",label:"Lush Mid Blade",value:"#2e821e"},u_tip_color:{type:"color",label:"Sunlit Tip Color",value:"#8ae638"},u_gust_color:{type:"color",label:"Wind Wave Sheen",value:"#e2ff7a"},u_blade_density:{type:"range",label:"Blade Density",value:36,min:10,max:80,step:2},u_blade_fluff:{type:"range",label:"Fluffiness / Silhouette",value:.35,min:0,max:1,step:.05},u_wind_speed:{type:"range",label:"Wind Speed",value:1,min:.1,max:4,step:.1},u_wind_strength:{type:"range",label:"Wind Wave Sway",value:.35,min:0,max:1,step:.02},u_sss_strength:{type:"range",label:"Subsurface Glow",value:.45,min:0,max:1,step:.05},u_push_strength:{type:"range",label:"Player Repulsion",value:.6,min:0,max:2,step:.05},u_char_radius:{type:"range",label:"Push Radius",value:2.5,min:.5,max:6,step:.2},u_char_pos:{type:"vector",label:"Player Position",value:[0,0,0]},u_light_dir:{type:"vector",label:"Sun Light Dir",value:[.5,.8,.3]}}},{id:"godot_foliage_grass",name:"Godot: Foliage Clump Grass",category:"🌿 Godot Water & Grass",type:"shader",description:"GDQuest foliage clump grass with synchronized directional wave propagation.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.5,i*.5,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#88d840"),a.addColorStop(.6,"#3a8e22"),a.addColorStop(1,"#0e380a"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
uniform float u_time;
uniform float u_wind_speed;
uniform float u_wind_strength;
uniform float u_wave_size;

varying vec2 v_uv;
varying vec3 v_normal;

void main() {
    v_uv = uv;
    vec2 windDir = normalize(vec2(1.0, -0.5));
    vec4 worldPos = modelMatrix * vec4(position, 1.0);

    float wave = sin(u_time * u_wind_speed * 2.5 + (worldPos.x * windDir.x + worldPos.z * windDir.y) / max(u_wave_size, 0.1));
    float heightMask = 1.0 - uv.y;

    vec3 dispPos = position;
    dispPos.xz += windDir * (wave * heightMask * u_wind_strength);

    v_normal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(dispPos, 1.0);
},

, 
    ,
    `,fragmentShader:`precision mediump float;
uniform vec3 u_tint;
varying vec2 v_uv;
varying vec3 v_normal;

void main() {
    float height = 1.0 - v_uv.y;
    vec3 baseColor = mix(vec3(0.08, 0.22, 0.05), u_tint, height);
    float diff = max(dot(v_normal, normalize(vec3(0.4, 0.8, 0.3))), 0.0) * 0.5 + 0.5;
    gl_FragColor = vec4(baseColor * diff, 1.0);
},

,
    ,
`,uniforms:{u_tint:{type:"color",label:"Foliage Tint",value:"#6bc928"},u_wind_speed:{type:"range",label:"Wave Frequency",value:1.2,min:.1,max:4,step:.1},u_wind_strength:{type:"range",label:"Wave Amplitude",value:.25,min:0,max:1,step:.02},u_wave_size:{type:"range",label:"Wavelength",value:3.5,min:1,max:10,step:.5}}},{id:"godot_waterfall",name:"Godot: 3D Stylized Waterfall",category:"🌿 Godot Water & Grass",type:"shader",description:"GDQuest stylized waterfall with dual noise scrolling, stepped foam edges, and edge rim glow.",generate:(e,o,i)=>{const a=e.createLinearGradient(0,0,0,i);a.addColorStop(0,"#005599"),a.addColorStop(.5,"#1fb2d8"),a.addColorStop(1,"#e6fbff"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#ffffff";for(let r=0;r<8;r++)e.fillRect(o*.2+r*28,i*.2+r%3*40,12,60)},vertexShader:`precision mediump float;
uniform float u_time;
uniform float u_flow_speed;
uniform float u_displacement;

varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view_pos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    v_uv = uv;
    vec2 flowUv = uv * vec2(4.0, 1.0) + vec2(0.0, u_time * u_flow_speed * 1.5);
    float n = noise(flowUv);

    vec3 pos = position + normal * (n * u_displacement);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    v_view_pos = -mv.xyz;
    v_normal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
},

, 
    ,
    `,fragmentShader:`precision mediump float;
uniform float u_time;
uniform float u_flow_speed;
uniform vec3 u_deep_color;
uniform vec3 u_surface_color;
uniform vec3 u_foam_color;
uniform float u_cutoff;
uniform float u_foam_edge_cutoff;

varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view_pos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    vec2 mainUv = v_uv * vec2(6.0, 1.5) + vec2(0.05, 0.6) * (u_time * u_flow_speed);
    vec2 detailUv = v_uv * vec2(12.0, 3.0) + vec2(0.05, 1.2) * (u_time * u_flow_speed);

    float mainNoise = noise(mainUv);
    float detailNoise = noise(detailUv);
    float combinedNoise = mainNoise * detailNoise;

    float foamEdge = step(u_cutoff, combinedNoise);
    float foamLine = step(u_foam_edge_cutoff, combinedNoise);

    vec3 waterCol = mix(u_deep_color, u_surface_color, mainNoise);
    vec3 finalCol = mix(waterCol, u_foam_color, foamEdge);
    finalCol = mix(finalCol, u_foam_color, foamLine);

    vec3 viewDir = normalize(v_view_pos);
    float fresnel = pow(1.0 - max(dot(normalize(v_normal), viewDir), 0.0), 3.0);
    finalCol += u_foam_color * (fresnel * 0.35);

    gl_FragColor = vec4(finalCol, 0.95);
},

,
    ,
`,uniforms:{u_deep_color:{type:"color",label:"Waterfall Abyss",value:"#004d99"},u_surface_color:{type:"color",label:"Torrent Turquoise",value:"#1ab3cc"},u_foam_color:{type:"color",label:"Cascade Foam",value:"#f0fbff"},u_flow_speed:{type:"range",label:"Cascade Flow Speed",value:1,min:.1,max:3,step:.1},u_cutoff:{type:"range",label:"Foam Cutoff",value:.22,min:.05,max:.5,step:.01},u_foam_edge_cutoff:{type:"range",label:"Edge Line Cutoff",value:.42,min:.1,max:.8,step:.01},u_displacement:{type:"range",label:"Surface Jiggle",value:.06,min:0,max:.2,step:.01}}},{id:"godot_stylized_toon_water",name:"Godot: Stylized Toon Water",category:"🌿 Godot Water & Grass",type:"shader",description:"Anime / Ghibli stylized water with stepped color banding and surface contour foam.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.4,i*.4,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#54c4ff"),a.addColorStop(.5,"#1b80db"),a.addColorStop(1,"#0d408f"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.strokeStyle="#ffffff",e.lineWidth=4,e.beginPath(),e.arc(o*.5,i*.5,o*.35,.5,2.5),e.stroke()},vertexShader:`precision mediump float;
uniform float u_time;
uniform float u_speed;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view_pos;

void main() {
    v_uv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    v_view_pos = -mv.xyz;
    v_normal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
},

, 
    ,
    `,fragmentShader:`precision mediump float;
uniform float u_time;
uniform float u_speed;
uniform vec3 u_surface_color;
uniform vec3 u_deep_color;
uniform vec3 u_foam_color;
uniform float u_bands;

varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view_pos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    vec2 uv1 = v_uv * 10.0 + vec2(u_time * u_speed * 0.15, 0.0);
    vec2 uv2 = v_uv * 10.0 + vec2(0.0, u_time * u_speed * 0.12);

    float n1 = noise(uv1);
    float n2 = noise(uv2);
    float wave = (n1 + n2) * 0.5;

    float stepped = floor(wave * u_bands) / u_bands;
    float foam = step(0.68, wave);

    vec3 col = mix(u_deep_color, u_surface_color, stepped);
    col = mix(col, u_foam_color, foam);

    gl_FragColor = vec4(col, 0.9);
},

,
    ,
`,uniforms:{u_surface_color:{type:"color",label:"Sunlit Surface",value:"#2892d7"},u_deep_color:{type:"color",label:"Shadowed Base",value:"#0d408f"},u_foam_color:{type:"color",label:"Contour Foam",value:"#ffffff"},u_speed:{type:"range",label:"Wave Evolution Speed",value:1,min:.1,max:3,step:.1},u_bands:{type:"range",label:"Quantized Bands",value:4,min:2,max:10,step:1}}},{id:"godot_realistic_water",name:"Godot: Realistic Gerstner Ocean",category:"🌿 Godot Water & Grass",type:"shader",description:"Multi-octave trochoidal Gerstner ocean waves with analytical normal generation and specular glints.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.35,i*.3,5,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.15,"#7ee6d8"),a.addColorStop(.5,"#16697a"),a.addColorStop(.85,"#093145"),a.addColorStop(1,"#021017"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
uniform float u_time;
uniform float u_wave_height;
uniform float u_speed;

varying vec2 v_uv;
varying vec3 v_world_pos;
varying vec3 v_normal;

vec3 gerstnerWave(vec2 dir, float steepness, float wavelength, vec2 pos, inout vec3 tangent, inout vec3 binormal) {
    float k = 6.28318 / wavelength;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(dir);
    float f = k * (dot(d, pos) - c * (u_time * u_speed * 0.8));
    float a = steepness / k;

    tangent += vec3(-d.x * d.x * (steepness * sin(f)), d.x * (steepness * cos(f)), -d.x * d.y * (steepness * sin(f)));
    binormal += vec3(-d.x * d.y * (steepness * sin(f)), d.y * (steepness * cos(f)), -d.y * d.y * (steepness * sin(f)));

    return vec3(d.x * (a * cos(f)), a * sin(f) * u_wave_height, d.y * (a * cos(f)));
}

void main() {
    v_uv = uv;
    vec3 pos = position;
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);

    vec3 disp = vec3(0.0);
    disp += gerstnerWave(vec2(1.0, 0.3), 0.22, 1.8, pos.xz, tangent, binormal);
    disp += gerstnerWave(vec2(0.6, 0.8), 0.15, 1.1, pos.xz, tangent, binormal);
    disp += gerstnerWave(vec2(-0.4, 0.9), 0.09, 0.5, pos.xz, tangent, binormal);

    pos += disp;
    v_world_pos = (modelMatrix * vec4(pos, 1.0)).xyz;
    v_normal = normalize(normalMatrix * cross(binormal, tangent));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
},

, 
    ,
    `,fragmentShader:`precision mediump float;
uniform float u_time;
uniform vec3 u_deep_color;
uniform vec3 u_shallow_color;
uniform vec3 u_sun_dir;

varying vec2 v_uv;
varying vec3 v_world_pos;
varying vec3 v_normal;

void main() {
    vec3 viewDir = normalize(cameraPosition - v_world_pos);
    vec3 surfNorm = normalize(v_normal);
    float fresnel = pow(1.0 - max(dot(viewDir, surfNorm), 0.0), 4.0);

    vec3 lightDir = normalize(u_sun_dir);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(surfNorm, halfVec), 0.0), 128.0) * 1.8;

    vec3 col = mix(u_deep_color, u_shallow_color, fresnel * 0.7);
    col += vec3(spec);

    gl_FragColor = vec4(col, 0.95);
},

,
    ,
`,uniforms:{u_deep_color:{type:"color",label:"Deep Ocean Trench",value:"#082136"},u_shallow_color:{type:"color",label:"Swell Turquoise",value:"#1a828a"},u_wave_height:{type:"range",label:"Gerstner Height",value:.12,min:0,max:.35,step:.01},u_speed:{type:"range",label:"Ocean Speed",value:1,min:.1,max:3,step:.1},u_sun_dir:{type:"vector",label:"Sun Position Vector",value:[.6,.8,.2]}}},{id:"godot_toon_water_roystan",name:"Godot: Roystan Toon Water",category:"🌿 Godot Water & Grass",type:"shader",description:"Erik Roystan Ross style toon water with surface noise foam and stepped color levels.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.35,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.2,"#55c9ff"),a.addColorStop(.6,"#0b70c9"),a.addColorStop(1,"#00264d"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view_pos;

void main() {
    v_uv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    v_view_pos = -mv.xyz;
    v_normal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
},

, 
    ,
    `,fragmentShader:`precision mediump float;
uniform float u_time;
uniform vec3 u_surface_color;
uniform vec3 u_deep_color;
uniform vec3 u_foam_color;
uniform float u_foam_cutoff;

varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view_pos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    vec2 fUv1 = v_uv * 14.0 + vec2(u_time * 0.12, u_time * 0.06);
    vec2 fUv2 = v_uv * 14.0 - vec2(u_time * 0.09, u_time * 0.09);
    float n = (noise(fUv1) + noise(fUv2)) * 0.5;

    vec3 viewDir = normalize(v_view_pos);
    float depthDiff = pow(1.0 - max(dot(viewDir, normalize(v_normal)), 0.0), 2.0);

    float isFoam = step(u_foam_cutoff, n);
    float edgeFoam = step(0.65, depthDiff + n * 0.25);
    isFoam = max(isFoam, edgeFoam);

    vec3 col = mix(u_surface_color, u_deep_color, depthDiff);
    col = mix(col, u_foam_color, isFoam);

    gl_FragColor = vec4(col, 0.92);
},

,
    ,
`,uniforms:{u_surface_color:{type:"color",label:"Surface Aquamarine",value:"#30a5ff"},u_deep_color:{type:"color",label:"Deep Cyan",value:"#004380"},u_foam_color:{type:"color",label:"Foam White",value:"#ffffff"},u_foam_cutoff:{type:"range",label:"Foam Threshold",value:.65,min:.3,max:.9,step:.02}}},{id:"godot_liquid_glass_ui",name:"Godot: Liquid Glass UI",category:"🌿 Godot Water & Grass",type:"shader",description:"Frosted liquid glass with chromatic dispersion, normal dome refraction, and bevel rim.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.5,i*.5,10,o*.5,i*.5,o*.5);a.addColorStop(0,"rgba(255,255,255,0.9)"),a.addColorStop(.5,"rgba(180,220,255,0.6)"),a.addColorStop(.85,"rgba(100,160,240,0.8)"),a.addColorStop(1,"#ffffff"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view_pos;

void main() {
    v_uv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    v_view_pos = -mv.xyz;
    v_normal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
},

, 
    ,
    `,fragmentShader:`precision mediump float;
uniform float u_time;
uniform vec3 u_glass_tint;
uniform float u_warp;
uniform float u_chromatic;
uniform float u_frosted;

varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_view_pos;

void main() {
    vec2 center = vec2(0.5);
    vec2 offset = v_uv - center;
    float dist = length(offset);

    vec2 warp = normalize(offset + 1e-4) * pow(dist, 2.0) * u_warp;
    
    vec3 col;
    col.r = sin((v_uv.x + warp.x + u_chromatic) * 20.0 + u_time) * 0.5 + 0.5;
    col.g = sin((v_uv.x + warp.x) * 20.0 + u_time) * 0.5 + 0.5;
    col.b = sin((v_uv.x + warp.x - u_chromatic) * 20.0 + u_time) * 0.5 + 0.5;

    float edge = smoothstep(0.40, 0.48, dist) * (1.0 - smoothstep(0.48, 0.50, dist));
    vec3 finalCol = mix(col * u_glass_tint, vec3(1.0), edge * 0.9);

    vec3 viewDir = normalize(v_view_pos);
    float fresnel = pow(1.0 - max(dot(viewDir, normalize(v_normal)), 0.0), 2.5);
    finalCol += vec3(fresnel * 0.4);

    gl_FragColor = vec4(finalCol, 0.88);
},

,
    ,
`,uniforms:{u_glass_tint:{type:"color",label:"Liquid Glass Tint",value:"#d4edff"},u_warp:{type:"range",label:"Refraction Warp",value:.15,min:0,max:.5,step:.01},u_chromatic:{type:"range",label:"Chromatic Dispersion",value:.03,min:0,max:.1,step:.005},u_frosted:{type:"range",label:"Frostiness Diffusion",value:.35,min:0,max:1,step:.05}}}],R=[{id:"blobmixer_deep_ocean_live",name:"Blobmixer: Deep Ocean Blue",category:"?? Blobmixer MatCaps",type:"shader",description:"Deep abyss blue with aqua highlights and metallic reflection.",generate:(e,o,i)=>{const a=o*.5,r=i*.5,t=o*.5,l=e.createRadialGradient(a*.65,r*.35,10,a,r,t);l.addColorStop(0,"#a1c4fd"),l.addColorStop(.3,"#00d2ff"),l.addColorStop(.7,"#003366"),l.addColorStop(1,"#000d1a"),e.fillStyle=l,e.beginPath(),e.arc(a,r,t,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  v_uv = uv;
  vec3 pos = position;
  float d = sin(pos.y * 6.0 + u_time * 2.0) * cos(pos.x * 6.0 + u_time * 1.5) * 0.1;
  pos += normal * d;
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(-v_position);
  float fresnel = pow(1.0 - max(0.0, dot(V, N)), 2.5);
  vec3 col = mix(vec3(0.0, 0.12, 0.35), vec3(0.0, 0.75, 0.95), dot(N, vec3(0.2, 0.8, 0.5)) * 0.5 + 0.5);
  col += vec3(0.7, 0.95, 1.0) * fresnel;
  gl_FragColor = vec4(col, 1.0);
}`},{id:"blobmixer_synthwave_live",name:"Blobmixer: Synthwave Chrome",category:"?? Blobmixer MatCaps",type:"shader",description:"Retro 80s synthwave horizon chrome reflection with electric pink and cyan edge glow.",generate:(e,o,i)=>{const a=o*.5,r=i*.5,t=o*.5,l=e.createRadialGradient(a*.65,r*.35,10,a,r,t);l.addColorStop(0,"#ff007f"),l.addColorStop(.35,"#7928ca"),l.addColorStop(.7,"#00f2fe"),l.addColorStop(1,"#0f051d"),e.fillStyle=l,e.beginPath(),e.arc(a,r,t,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  v_uv = uv;
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(-v_position);
  float fresnel = pow(1.0 - max(0.0, dot(V, N)), 2.0);
  float bands = sin(N.y * 15.0 + u_time * 2.0) * 0.5 + 0.5;
  vec3 col = mix(vec3(0.0, 0.85, 1.0), vec3(1.0, 0.05, 0.55), bands);
  col += vec3(1.0, 0.9, 0.2) * fresnel * 0.7;
  gl_FragColor = vec4(col, 1.0);
}`},{id:"blobmixer_iridescent_live",name:"Blobmixer: Iridescent Foil",category:"?? Blobmixer MatCaps",type:"shader",description:"Thin-film rainbow interference oil-slick with metallic sheen.",generate:(e,o,i)=>{const a=o*.5,r=i*.5,t=o*.5,l=e.createRadialGradient(a*.65,r*.35,10,a,r,t);l.addColorStop(0,"#ffffff"),l.addColorStop(.2,"#fbc2eb"),l.addColorStop(.5,"#a6c1ee"),l.addColorStop(.8,"#84fab0"),l.addColorStop(1,"#2c3e50"),e.fillStyle=l,e.beginPath(),e.arc(a,r,t,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  v_uv = uv;
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(-v_position);
  float d = dot(N, V);
  vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (d * 1.5 + vec3(0.0, 0.33, 0.67) + u_time * 0.1));
  rainbow += vec3(0.3) * pow(1.0 - max(0.0, d), 3.0);
  gl_FragColor = vec4(rainbow, 1.0);
}`}],D=[{id:"wayfinder_toon_forest",name:"Wayfinder: Biome Toon Shading",category:"?? Wayfinder & Grassworks",type:"shader",description:"Generative multi-step cel shading with rim lighting, value noise dither, and ground bounce.",generate:(e,o,i)=>{const a=o*.5,r=i*.5,t=o*.5,l=e.createRadialGradient(a*.65,r*.35,10,a,r,t);l.addColorStop(0,"#a8e6cf"),l.addColorStop(.3,"#3bba9c"),l.addColorStop(.65,"#2e3047"),l.addColorStop(1,"#171926"),e.fillStyle=l,e.beginPath(),e.arc(a,r,t,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255,255,255,0.8)",e.lineWidth=4,e.beginPath(),e.arc(a,r,t*.85,.4,2.2),e.stroke()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  v_uv = uv;
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(-v_position);
  vec3 L = normalize(vec3(0.5, 0.8, 0.6));
  float diff = dot(N, L) * 0.5 + 0.5;
  float rim = 1.0 - max(0.0, dot(V, N));
  rim = smoothstep(0.45, 0.75, rim);
  float stepDiff = smoothstep(0.3, 0.35, diff) * 0.4 + smoothstep(0.65, 0.7, diff) * 0.6;
  vec3 base = mix(vec3(0.18, 0.19, 0.28), vec3(0.23, 0.73, 0.61), stepDiff);
  base += vec3(0.66, 0.90, 0.81) * rim * 0.7;
  gl_FragColor = vec4(base, 1.0);
}`}],x=[{id:"grassworks_wind_wave",name:"Grassworks: Procedural Wind Turbulence",category:"?? Wayfinder & Grassworks",type:"shader",description:"Dense field blade simulation with dual trigonometric wave propagation and tip oscillation.",generate:(e,o,i)=>{const a=o*.5,r=i*.5,t=o*.5,l=e.createRadialGradient(a*.65,r*.35,10,a,r,t);l.addColorStop(0,"#b8e994"),l.addColorStop(.3,"#78e08f"),l.addColorStop(.65,"#38ada9"),l.addColorStop(1,"#074241"),e.fillStyle=l,e.beginPath(),e.arc(a,r,t,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  v_uv = uv;
  vec3 pos = position;
  float wind = sin(pos.x * 6.0 + u_time * 3.0) * cos(pos.z * 4.0 + u_time * 2.2) * 0.12;
  pos.x += wind * (pos.y + 1.0);
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(-v_position);
  float diff = max(0.0, dot(N, normalize(vec3(0.4, 0.9, 0.3))));
  vec3 baseGreen = mix(vec3(0.08, 0.32, 0.18), vec3(0.45, 0.88, 0.35), diff);
  float tipGlow = pow(1.0 - max(0.0, dot(V, N)), 2.5);
  baseGreen += vec3(0.8, 1.0, 0.4) * tipGlow * 0.5;
  gl_FragColor = vec4(baseGreen, 1.0);
}`}],T=[{id:"reze_cyber_particle",name:"Reze: Cyber WebGPU Particle Matrix",category:"? WebGPU & Cyber",type:"shader",description:"High-speed compute particle field visualization with glowing neon pulse lines.",generate:(e,o,i)=>{const a=o*.5,r=i*.5,t=o*.5,l=e.createRadialGradient(a*.65,r*.35,10,a,r,t);l.addColorStop(0,"#00f7ff"),l.addColorStop(.3,"#0084ff"),l.addColorStop(.7,"#1b004b"),l.addColorStop(1,"#050014"),e.fillStyle=l,e.beginPath(),e.arc(a,r,t,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  v_uv = uv;
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(-v_position);
  float fresnel = pow(1.0 - max(0.0, dot(V, N)), 2.0);
  float grid = step(0.92, fract(v_uv.x * 24.0 + u_time * 0.2)) + step(0.92, fract(v_uv.y * 24.0));
  vec3 col = mix(vec3(0.03, 0.01, 0.15), vec3(0.0, 0.95, 1.0), grid);
  col += vec3(0.9, 0.1, 0.9) * fresnel * 1.2;
  gl_FragColor = vec4(col, 1.0);
}`}],F=[{id:"summer_phong_rocks",name:"Summer Rock & Stone",category:"☀️ Summer Afternoon",type:"shader",description:"Weathered rock material with procedural noise variation and Blinn-Phong specular highlights.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.6,i*.35,5,o*.5,i*.5,o*.5);a.addColorStop(0,"#d6cfc7"),a.addColorStop(.5,"#a89880"),a.addColorStop(1,"#5c4a38"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec2 v_uv;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
varying vec3 v_normal;
varying vec2 v_uv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main() {
  vec3 sun = normalize(vec3(1.0, 1.3, 0.7));
  float diff = max(dot(v_normal, sun), 0.0);
  float n1 = noise(v_uv * 6.0);
  float n2 = noise(v_uv * 18.0 + 5.1);
  vec3 light_rock = vec3(0.78, 0.70, 0.60);
  vec3 dark_rock  = vec3(0.38, 0.33, 0.27);
  vec3 col = mix(dark_rock, light_rock, n1 * 0.6 + diff * 0.4);
  col += n2 * 0.08;
  vec3 h = normalize(sun + vec3(0,0,1));
  float spec = pow(max(dot(v_normal, h), 0.0), 32.0);
  col += vec3(0.95, 0.85, 0.65) * spec * 0.15;
  gl_FragColor = vec4(col, 1.0);
}`},{id:"summer_phong_characters",name:"Summer Characters Skinned",category:"☀️ Summer Afternoon",type:"shader",description:"Warm skin-toned character shader with subsurface scatter bloom and soft rim lighting.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.62,i*.38,8,o*.5,i*.5,o*.5);a.addColorStop(0,"#fce8d8"),a.addColorStop(.35,"#e8a87c"),a.addColorStop(.7,"#c4714a"),a.addColorStop(1,"#7a3820"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_view;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_normal = normalize(normalMatrix * normal);
  v_view = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view;
void main() {
  vec3 sun = normalize(vec3(0.8, 1.0, 0.6));
  float diff = max(dot(v_normal, sun), 0.0);
  float sss = pow(max(dot(-v_normal, sun), 0.0), 2.5) * 0.4;
  float rim = pow(1.0 - max(dot(v_view, v_normal), 0.0), 3.0);
  vec3 shadow = vec3(0.65, 0.33, 0.18);
  vec3 mid    = vec3(0.90, 0.62, 0.42);
  vec3 lit    = vec3(1.0,  0.85, 0.68);
  vec3 col = mix(shadow, mid, diff);
  col = mix(col, lit, pow(diff, 4.0) * 0.5);
  col += vec3(0.98, 0.40, 0.28) * sss;
  col += vec3(1.0, 0.85, 0.55) * rim * 0.25;
  gl_FragColor = vec4(col, 1.0);
}`},{id:"summer_phong_props",name:"Summer Props & Machinery",category:"☀️ Summer Afternoon",type:"shader",description:"Metallic prop shader: Blinn-Phong specular, environment rim, and warm golden highlight tint.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,5,o*.5,i*.5,o*.5);a.addColorStop(0,"#f0f0f0"),a.addColorStop(.3,"#adb5c0"),a.addColorStop(.7,"#6c7a88"),a.addColorStop(1,"#2c3440"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_view;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_normal = normalize(normalMatrix * normal);
  v_view = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_view;
void main() {
  vec3 sun = normalize(vec3(1.0, 1.2, 0.7));
  float diff = max(dot(v_normal, sun), 0.0);
  vec3 h = normalize(sun + v_view);
  float spec = pow(max(dot(v_normal, h), 0.0), 64.0);
  float rim = pow(1.0 - max(dot(v_view, v_normal), 0.0), 2.5);
  vec3 base = vec3(0.55, 0.60, 0.65);
  vec3 dark = vec3(0.18, 0.20, 0.24);
  vec3 col = mix(dark, base, diff * 0.8 + 0.2);
  col += vec3(1.0, 0.88, 0.60) * spec * 0.6;
  col += vec3(0.7, 0.85, 1.0) * rim * 0.15;
  gl_FragColor = vec4(col, 1.0);
}`},{id:"summer_birds_particles",name:"Flocking Birds (GPGPU)",category:"☀️ Summer Afternoon",type:"shader",description:"Boid-like velocity flow field across geometry surface, visualizing the flock separation and cohesion forces.",generate:(e,o,i)=>{e.fillStyle="#c8e8f8",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="rgba(25,25,50,0.85)";for(let a=0;a<18;a++){const r=o*(.2+.6*Math.random()),t=i*(.2+.6*Math.random());e.beginPath(),e.ellipse(r,t,8,3,-.4,0,Math.PI*2),e.fill()}},vertexShader:`precision mediump float;
varying vec2 v_uv;
varying vec3 v_normal;
void main() {
  v_uv = uv;
  v_normal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec2 v_uv;
varying vec3 v_normal;
vec2 hash2(vec2 p) {
  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
  return fract(sin(p)*43758.5453);
}
void main() {
  vec2 uv = v_uv * 5.0;
  vec2 cell = floor(uv);
  vec2 f = fract(uv);
  float minDist = 1.0;
  for(int y2=-1;y2<=1;y2++) for(int x2=-1;x2<=1;x2++) {
    vec2 nb = vec2(x2,y2);
    vec2 pt = 0.5 + 0.5*sin(u_time*0.8 + 6.28*hash2(cell+nb));
    minDist = min(minDist, length(nb+pt-f));
  }
  float light = max(dot(v_normal, normalize(vec3(1,1.2,0.8))), 0.0);
  vec3 sky   = vec3(0.55,0.82,0.98);
  vec3 birds = vec3(0.12,0.14,0.25);
  float flock = smoothstep(0.1,0.18,minDist)*(1.0-smoothstep(0.18,0.35,minDist));
  vec3 col = mix(sky, vec3(0.25,0.50,0.78), minDist*0.4);
  col = mix(col, birds, flock*0.9);
  col *= 0.7+0.3*light;
  gl_FragColor = vec4(col, 1.0);
}`},{id:"summer_birds_sim_velocity",name:"Boids Velocity Compute",category:"☀️ Summer Afternoon",type:"shader",description:"Hue-mapped visualization of GPGPU boid velocity field: separation, cohesion, and alignment force vectors.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.5,i*.5,0,o*.5,i*.5,o*.5);a.addColorStop(0,"#00d2ff"),a.addColorStop(.5,"#7b2ff7"),a.addColorStop(1,"#0a0020"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec2 v_uv;
void main() { v_uv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec2 v_uv;
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main() {
  vec2 uv = v_uv;
  vec2 vel = vec2(0.0);
  for(int i=0;i<8;i++) {
    float fi = float(i);
    vec2 boid = 0.5+0.4*sin(u_time*(0.4+fi*0.15)+vec2(hash(vec2(fi,0.3)),hash(vec2(fi,0.7)))*6.28);
    vec2 d = uv - boid;
    float len = length(d);
    vel += d/(len*len+0.01)*0.002 - d*0.015;
  }
  float angle = atan(vel.y, vel.x);
  float speed = clamp(length(vel)*8.0, 0.3, 1.0);
  vec3 col = hsv2rgb(vec3(angle/6.2831+0.5, 0.85, speed));
  col *= 0.6+0.4*sin(u_time*0.5+length(uv-0.5)*6.0);
  gl_FragColor = vec4(col, 1.0);
}`}],E=[{id:"toon_classic_2tone",name:"Toon Classic 2-Tone",category:"Toon Shaders",generate:(e,o,i)=>{e.fillStyle="#2c3e50",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#ecf0f1",e.beginPath(),e.arc(o*.58,i*.42,o*.46,0,Math.PI*2),e.fill(),e.fillStyle="#ffffff",e.beginPath(),e.arc(o*.68,i*.32,o*.12,0,Math.PI*2),e.fill()}},{id:"toon_anime_3tone",name:"Toon Anime 3-Tone",category:"Toon Shaders",generate:(e,o,i)=>{e.fillStyle="#4b4b66",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#f8b500",e.beginPath(),e.arc(o*.55,i*.45,o*.44,0,Math.PI*2),e.fill(),e.fillStyle="#fffa65",e.beginPath(),e.arc(o*.62,i*.38,o*.32,0,Math.PI*2),e.fill(),e.fillStyle="#ffffff",e.beginPath(),e.arc(o*.68,i*.32,o*.1,0,Math.PI*2),e.fill()}},{id:"toon_manga_ink",name:"Toon Manga Ink & White",category:"Toon Shaders",generate:(e,o,i)=>{e.fillStyle="#050505",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#ffffff",e.beginPath(),e.arc(o*.56,i*.44,o*.45,0,Math.PI*2),e.fill(),e.strokeStyle="#000000",e.lineWidth=o*.04,e.beginPath(),e.arc(o/2,i/2,o*.48,0,Math.PI*2),e.stroke()}},{id:"toon_warm_comic",name:"Toon Warm Comic Book",category:"Toon Shaders",generate:(e,o,i)=>{e.fillStyle="#574b90",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#e15f41",e.beginPath(),e.arc(o*.55,i*.45,o*.44,0,Math.PI*2),e.fill(),e.fillStyle="#f7d794",e.beginPath(),e.arc(o*.62,i*.38,o*.3,0,Math.PI*2),e.fill(),e.fillStyle="#ffffff",e.beginPath(),e.arc(o*.68,i*.32,o*.1,0,Math.PI*2),e.fill()}},{id:"toon_cyber_cel",name:"Toon Cyber Neon Cel",category:"Toon Shaders",generate:(e,o,i)=>{e.fillStyle="#1e0038",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#9b59b6",e.beginPath(),e.arc(o*.55,i*.45,o*.44,0,Math.PI*2),e.fill(),e.fillStyle="#00d2d3",e.beginPath(),e.arc(o*.62,i*.38,o*.32,0,Math.PI*2),e.fill(),e.fillStyle="#ffffff",e.beginPath(),e.arc(o*.68,i*.32,o*.12,0,Math.PI*2),e.fill()}},{id:"toon_pastel_anime",name:"Toon Pastel Dream",category:"Toon Shaders",generate:(e,o,i)=>{e.fillStyle="#778beb",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.fillStyle="#f8a5c2",e.beginPath(),e.arc(o*.55,i*.45,o*.44,0,Math.PI*2),e.fill(),e.fillStyle="#ea8685",e.beginPath(),e.arc(o*.62,i*.38,o*.3,0,Math.PI*2),e.fill(),e.fillStyle="#ffffff",e.beginPath(),e.arc(o*.68,i*.32,o*.1,0,Math.PI*2),e.fill()}},{id:"toon_extracted",name:"Authentic Toon Cel",category:"Toon Shaders",url:"/assets/matcaps/toon.jpeg"},{id:"check_rim_dark_toon",name:"Toon Rim Shadow Check",category:"Toon Shaders",url:"/assets/matcaps/check_rim_dark.jpeg"}],V=[{id:"flat_graphic_white",name:"Flat Graphic White",category:"Flat Colors",generate:(e,o,i)=>{e.fillStyle="#ffffff",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"flat_pop_red",name:"Flat Pop Art Red",category:"Flat Colors",generate:(e,o,i)=>{e.fillStyle="#ff3838",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"flat_cyber_yellow",name:"Flat Cyber Yellow",category:"Flat Colors",generate:(e,o,i)=>{e.fillStyle="#ffd32a",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"flat_electric_blue",name:"Flat Electric Blue",category:"Flat Colors",generate:(e,o,i)=>{e.fillStyle="#18dcff",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"flat_vibrant_orange",name:"Flat Vibrant Orange",category:"Flat Colors",generate:(e,o,i)=>{e.fillStyle="#ff9f1a",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"flat_pastel_lilac",name:"Flat Pastel Lilac",category:"Flat Colors",generate:(e,o,i)=>{e.fillStyle="#cd84f1",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"flat_mint_cyan",name:"Flat Mint Green",category:"Flat Colors",generate:(e,o,i)=>{e.fillStyle="#7efff5",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}}],W=[{id:"glass_crystal_clear",name:"Crystal Clear Glass",category:"Glass & Crystal",generate:(e,o,i)=>{e.fillStyle="#10121a",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const a=e.createRadialGradient(o/2,i/2,o*.35,o/2,i/2,o*.5);a.addColorStop(0,"rgba(255,255,255,0.0)"),a.addColorStop(.7,"rgba(180,225,255,0.4)"),a.addColorStop(.95,"rgba(255,255,255,0.95)"),a.addColorStop(1,"rgba(30,60,100,0.6)"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const r=e.createRadialGradient(o*.65,i*.35,2,o*.65,i*.35,o*.22);r.addColorStop(0,"rgba(255,255,255,1.0)"),r.addColorStop(.35,"rgba(255,255,255,0.7)"),r.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=r,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"glass_frosted_cyan",name:"Frosted Cyan Glass",category:"Glass & Crystal",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.5,i*.5,o*.08,o*.5,i*.5,o*.5);a.addColorStop(0,"#0a2233"),a.addColorStop(.55,"#144c6b"),a.addColorStop(.88,"#70e5ff"),a.addColorStop(1,"#ffffff"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"glass_ruby_wine",name:"Ruby Wine Glass",category:"Glass & Crystal",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.6,i*.4,8,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.25,"#ff2a6d"),a.addColorStop(.65,"#5c0524"),a.addColorStop(.92,"#ff7597"),a.addColorStop(1,"#ffffff"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"glass_emerald_bottle",name:"Emerald Bottle Glass",category:"Glass & Crystal",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.62,i*.38,8,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.25,"#05c46b"),a.addColorStop(.65,"#043820"),a.addColorStop(.9,"#80ffdb"),a.addColorStop(1,"#ffffff"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"glass_prism_rainbow",name:"Prism Rainbow Glass",category:"Glass & Crystal",generate:(e,o,i)=>{e.fillStyle="#0e111a",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const a=e.createLinearGradient(0,0,o,i);a.addColorStop(0,"rgba(255,0,0,0.6)"),a.addColorStop(.2,"rgba(255,165,0,0.6)"),a.addColorStop(.4,"rgba(255,255,0,0.6)"),a.addColorStop(.6,"rgba(0,255,0,0.6)"),a.addColorStop(.8,"rgba(0,100,255,0.6)"),a.addColorStop(1,"rgba(180,0,255,0.6)"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const r=e.createRadialGradient(o*.65,i*.35,2,o*.65,i*.35,o*.25);r.addColorStop(0,"rgba(255,255,255,1.0)"),r.addColorStop(1,"rgba(255,255,255,0.0)"),e.fillStyle=r,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"glass_smoked_obsidian",name:"Smoked Obsidian Glass",category:"Glass & Crystal",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,5,o*.5,i*.5,o*.5);a.addColorStop(0,"rgba(255,255,255,0.95)"),a.addColorStop(.2,"rgba(200,200,210,0.5)"),a.addColorStop(.7,"#111216"),a.addColorStop(.95,"#5b6272"),a.addColorStop(1,"#ffffff"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}}],L=[{id:"bright_neon_cyan",name:"Electric Neon Cyan",category:"Bright Colors",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.25,"#00f7ff"),a.addColorStop(.7,"#0066ff"),a.addColorStop(1,"#001a40"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"bright_neon_magenta",name:"Cyberpunk Magenta",category:"Bright Colors",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.25,"#ff007f"),a.addColorStop(.65,"#8800ff"),a.addColorStop(1,"#220033"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"bright_sunburst_yellow",name:"Sunburst Gold Glow",category:"Bright Colors",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.3,"#ffea00"),a.addColorStop(.7,"#ff5500"),a.addColorStop(1,"#4a1500"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"bright_acid_green",name:"Toxic Acid Lime",category:"Bright Colors",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.25,"#76ff03"),a.addColorStop(.7,"#00bfa5"),a.addColorStop(1,"#003322"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"bright_ultraviolet",name:"Electric Ultraviolet",category:"Bright Colors",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.3,"#c77dff"),a.addColorStop(.7,"#5a189a"),a.addColorStop(1,"#10002b"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"bright_hot_lava",name:"Hot Molten Lava",category:"Bright Colors",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.2,"#ffdd59"),a.addColorStop(.55,"#ff3f34"),a.addColorStop(1,"#3c0008"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}}],j=[{id:"metal_shiny",name:"Chrome Mirror Shiny",category:"Metals",url:"/assets/matcaps/metal_shiny.jpeg"},{id:"metal_carpaint",name:"Metallic Red Car Paint",category:"Metals",url:"/assets/matcaps/metal_carpaint.jpeg"},{id:"metal_lead",name:"Heavy Lead Metal",category:"Metals",url:"/assets/matcaps/metal_lead.jpeg"},{id:"metal_gold_ingot",name:"Polished Gold Ingot",category:"Metals",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.25,"#ffeaa7"),a.addColorStop(.65,"#d4af37"),a.addColorStop(.9,"#8c6d17"),a.addColorStop(1,"#3d2b00"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"metal_copper_rose",name:"Burnished Copper",category:"Metals",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.25,"#f8a5c2"),a.addColorStop(.65,"#b33939"),a.addColorStop(.9,"#78281f"),a.addColorStop(1,"#33100c"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}}],A=[{id:"clay_studio",name:"Classic Clay Studio",category:"Clay & Matte",url:"/assets/matcaps/clay_studio.jpeg"},{id:"clay_brown",name:"Terracotta Clay Brown",category:"Clay & Matte",url:"/assets/matcaps/clay_brown.jpeg"},{id:"clay_muddy",name:"Muddy Earth Clay",category:"Clay & Matte",url:"/assets/matcaps/clay_muddy.jpeg"},{id:"ceramic_dark",name:"Dark Ceramic Glaze",category:"Clay & Matte",url:"/assets/matcaps/ceramic_dark.jpeg"},{id:"ceramic_lightbulb",name:"Lightbulb Ceramic",category:"Clay & Matte",url:"/assets/matcaps/ceramic_lightbulb.jpeg"},{id:"basic_1",name:"Basic Studio Gray 1",category:"Clay & Matte",url:"/assets/matcaps/basic_1.jpg"},{id:"basic_2",name:"Basic Studio Gray 2",category:"Clay & Matte",url:"/assets/matcaps/basic_2.jpg"},{id:"basic_dark",name:"Basic Dark Studio",category:"Clay & Matte",url:"/assets/matcaps/basic_dark.jpeg"},{id:"basic_side",name:"Basic Side Light",category:"Clay & Matte",url:"/assets/matcaps/basic_side.jpeg"}],N=[{id:"jade",name:"Imperial Jade Gem",category:"Gems & Organics",url:"/assets/matcaps/jade.jpeg"},{id:"pearl",name:"Lustrous Pearl",category:"Gems & Organics",url:"/assets/matcaps/pearl.jpeg"},{id:"resin",name:"Amber Resin Gem",category:"Gems & Organics",url:"/assets/matcaps/resin.jpeg"},{id:"skin",name:"Subsurface Skin Tone",category:"Gems & Organics",url:"/assets/matcaps/skin.jpeg"},{id:"check_normal_y",name:"Normal Vector Map",category:"Gems & Organics",url:"/assets/matcaps/check_normal+y.jpeg"},{id:"gem_sapphire",name:"Deep Blue Sapphire",category:"Gems & Organics",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.2,"#48dbfb"),a.addColorStop(.65,"#0c2461"),a.addColorStop(.9,"#1e3799"),a.addColorStop(1,"#050c1e"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}},{id:"gem_amethyst",name:"Amethyst Crystal",category:"Gems & Organics",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.25,"#d980fa"),a.addColorStop(.65,"#5758bb"),a.addColorStop(.9,"#9980fa"),a.addColorStop(1,"#1b1464"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}}],q=[{id:"magic_rainbow_pulse",name:"Rainbow Pulse",category:"✨ Fun & Magic",type:"shader",generate:(e,o,i)=>{for(let r=0;r<6;r++){const t=r*60,l=e.createRadialGradient(o*.5,i*.5,o*r*.07,o*.5,i*.5,o*(r+1)*.07);l.addColorStop(0,`hsla(${t},100%,65%,1)`),l.addColorStop(1,`hsla(${t+60},100%,65%,1)`),e.fillStyle=l,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()}const a=e.createRadialGradient(o*.6,i*.35,2,o*.6,i*.35,o*.25);a.addColorStop(0,"rgba(255,255,255,0.9)"),a.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;

vec3 rainbow(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  float fresnel = 1.0 - max(dot(v_normal, v_view_dir), 0.0);
  float t = fresnel * 3.0 + u_time * 0.8 + v_normal.y * 2.0;
  vec3 col = rainbow(t);
  float pulse = 0.8 + 0.2 * sin(u_time * 4.0 + fresnel * 8.0);
  gl_FragColor = vec4(col * pulse, 1.0);
}`},{id:"magic_electric_arc",name:"Electric Arc",category:"✨ Fun & Magic",type:"shader",generate:(e,o,i)=>{e.fillStyle="#050518",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const a=e.createRadialGradient(o/2,i/2,o*.3,o/2,i/2,o*.5);a.addColorStop(0,"rgba(0,0,0,0)"),a.addColorStop(.7,"rgba(80,160,255,0.5)"),a.addColorStop(.95,"rgba(180,220,255,0.95)"),a.addColorStop(1,"rgba(255,255,255,1)"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.strokeStyle="#00eeff",e.lineWidth=3,e.beginPath(),e.moveTo(o*.45,i*.3),e.lineTo(o*.52,i*.5),e.lineTo(o*.47,i*.55),e.lineTo(o*.55,i*.72),e.stroke()},vertexShader:`precision mediump float;
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
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec3 v_position;

void main() {
  float fresnel = pow(1.0 - max(dot(v_normal, v_view_dir), 0.0), 2.0);
  
  // Core dark body
  vec3 col = vec3(0.02, 0.04, 0.12);
  
  // Electric glow on rim
  float spark = sin(v_position.y * 30.0 + u_time * 25.0) * 0.5 + 0.5;
  spark *= sin(v_position.x * 20.0 - u_time * 18.0) * 0.5 + 0.5;
  vec3 arc_color = mix(vec3(0.1, 0.4, 1.0), vec3(0.8, 0.95, 1.0), spark);
  
  col = mix(col, arc_color, fresnel * 1.2);
  col += arc_color * pow(spark, 3.0) * fresnel * 0.8;
  
  // Constant electric rim glow
  col += vec3(0.05, 0.15, 0.5) * pow(fresnel, 2.0);
  
  gl_FragColor = vec4(col, 1.0);
}`},{id:"magic_lava_flow",name:"Lava Flow",category:"✨ Fun & Magic",type:"shader",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.6,i*.4,5,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.15,"#ffee00"),a.addColorStop(.4,"#ff5500"),a.addColorStop(.7,"#cc1100"),a.addColorStop(.88,"#330800"),a.addColorStop(1,"#0a0000"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec3 v_position;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_uv = uv;
  v_position = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec3 v_position;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}

void main() {
  vec2 uv = v_uv * 3.0 + vec2(0.0, -u_time * 0.3);
  float n1 = noise(uv + vec2(u_time * 0.2, 0.0));
  float n2 = noise(uv * 2.0 - vec2(u_time * 0.15, u_time * 0.1));
  float lava = n1 * 0.6 + n2 * 0.4;

  vec3 dark_rock = vec3(0.04, 0.01, 0.0);
  vec3 hot_orange = vec3(1.0, 0.35, 0.0);
  vec3 bright_core = vec3(1.0, 0.95, 0.3);

  vec3 col = mix(dark_rock, hot_orange, smoothstep(0.35, 0.65, lava));
  col = mix(col, bright_core, smoothstep(0.65, 0.9, lava));

  // Edge glow
  float fresnel = pow(1.0 - max(dot(v_normal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
  col += vec3(1.0, 0.2, 0.0) * fresnel * 0.5;

  gl_FragColor = vec4(col, 1.0);
}`},{id:"magic_soap_bubble",name:"Soap Bubble",category:"✨ Fun & Magic",type:"shader",generate:(e,o,i)=>{e.fillStyle="rgba(10,12,20,0.95)",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const a=e.createLinearGradient(0,0,o,i);a.addColorStop(0,"rgba(255,100,200,0.5)"),a.addColorStop(.25,"rgba(100,200,255,0.5)"),a.addColorStop(.5,"rgba(200,255,100,0.5)"),a.addColorStop(.75,"rgba(255,180,50,0.5)"),a.addColorStop(1,"rgba(200,80,255,0.5)"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const r=e.createRadialGradient(o/2,i/2,o*.32,o/2,i/2,o*.5);r.addColorStop(0,"rgba(255,255,255,0.0)"),r.addColorStop(.85,"rgba(255,255,255,0.15)"),r.addColorStop(1,"rgba(255,255,255,0.9)"),e.fillStyle=r,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;

vec3 rainbow(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  float fresnel = 1.0 - max(dot(v_normal, v_view_dir), 0.0);
  
  // Thin-film soap iridescence — shifts with angle and time
  float film = fresnel * 5.0 + u_time * 0.4 + v_normal.x * 2.0 + v_normal.y * 1.5;
  vec3 irid = rainbow(film);
  
  // Very transparent interior, colorful rim
  float alpha_rim = pow(fresnel, 1.2);
  vec3 col = irid * alpha_rim;
  
  // Soft specular highlight
  float spec = pow(max(dot(v_normal, normalize(vec3(0.5, 0.7, 1.0))), 0.0), 24.0);
  col += vec3(spec * 0.6);

  gl_FragColor = vec4(col, 0.5 + fresnel * 0.45);
}`},{id:"magic_sparkle_glitter",name:"Magic Glitter",category:"✨ Fun & Magic",type:"shader",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,5,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.3,"#e040fb"),a.addColorStop(.65,"#6200ea"),a.addColorStop(1,"#12005e"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();for(let r=0;r<24;r++){const t=r/24*Math.PI*2,l=o*(.15+Math.random()*.3),n=o/2+Math.cos(t)*l,s=i/2+Math.sin(t)*l;e.fillStyle="rgba(255,255,255,0.9)",e.beginPath(),e.arc(n,s,3,0,Math.PI*2),e.fill()}},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec2 v_uv;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  v_uv = uv;
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec2 v_uv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

void main() {
  float fresnel = 1.0 - max(dot(v_normal, v_view_dir), 0.0);

  // Base purple-violet
  vec3 col = mix(vec3(0.1, 0.0, 0.25), vec3(0.7, 0.1, 1.0), fresnel);

  // Animated glitter — random sparks scattered across surface
  vec2 grid = v_uv * 18.0;
  vec2 cell = floor(grid);
  float spark_phase = hash(cell) * 6.28318;
  float spark = pow(max(0.0, sin(u_time * 4.0 + spark_phase)), 12.0);
  spark *= step(hash(cell + 0.5), 0.4); // Only 40% of cells sparkle

  col += vec3(spark * 1.5);

  // Rainbow shimmer on rim
  float hue_t = fresnel * 4.0 + u_time * 0.5;
  vec3 shimmer = 0.5 + 0.5 * cos(6.28318 * (hue_t + vec3(0.0, 0.33, 0.67)));
  col = mix(col, shimmer, fresnel * 0.4);

  gl_FragColor = vec4(col, 1.0);
}`},{id:"magic_hologram_scan",name:"Hologram Scan",category:"✨ Fun & Magic",type:"shader",generate:(e,o,i)=>{e.fillStyle="#010a0a",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const a=e.createRadialGradient(o/2,i/2,o*.28,o/2,i/2,o*.5);a.addColorStop(0,"rgba(0,255,200,0.0)"),a.addColorStop(.7,"rgba(0,255,180,0.3)"),a.addColorStop(1,"rgba(0,255,200,0.95)"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();for(let r=0;r<i;r+=12)e.fillStyle="rgba(0,255,180,0.12)",e.fillRect(0,r,o,4)},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec3 v_position;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  v_position = position;
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;
varying vec3 v_position;

void main() {
  float fresnel = pow(1.0 - max(dot(v_normal, v_view_dir), 0.0), 1.5);

  // Animated scan line sweep
  float scan_y = mod(v_position.y * 4.0 - u_time * 2.0, 1.0);
  float scanline = step(0.85, scan_y) * 0.6;

  // Holographic teal core
  vec3 holo = vec3(0.0, 1.0, 0.75);
  vec3 col = holo * (fresnel * 0.9 + 0.05);

  // Horizontal scan band moving up
  float sweep = smoothstep(0.0, 0.08, abs(scan_y - 0.5));
  col += holo * (1.0 - sweep) * 0.35;

  // Grid-line flicker
  col += holo * scanline * fresnel;

  // Flicker noise
  float flicker = 0.9 + 0.1 * sin(u_time * 60.0 + v_position.y * 100.0);
  col *= flicker;

  gl_FragColor = vec4(col, 0.75 + fresnel * 0.2);
}`},{id:"magic_candy_chrome",name:"Candy Chrome",category:"✨ Fun & Magic",type:"shader",generate:(e,o,i)=>{const a=e.createLinearGradient(0,0,o,i);a.addColorStop(0,"#ff9de2"),a.addColorStop(.2,"#a8edea"),a.addColorStop(.4,"#fed6e3"),a.addColorStop(.6,"#a1c4fd"),a.addColorStop(.8,"#ffecd2"),a.addColorStop(1,"#ff9de2"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const r=e.createRadialGradient(o*.65,i*.35,2,o*.65,i*.35,o*.3);r.addColorStop(0,"rgba(255,255,255,1.0)"),r.addColorStop(.5,"rgba(255,255,255,0.3)"),r.addColorStop(1,"rgba(255,255,255,0.0)"),e.fillStyle=r,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;

vec3 pastelRainbow(float t) {
  return 0.75 + 0.22 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  float fresnel = 1.0 - max(dot(v_normal, v_view_dir), 0.0);
  
  // Pastel color shift with normal angle + slow time drift
  float hue = (v_normal.x + v_normal.y) * 1.5 + u_time * 0.25;
  vec3 candy = pastelRainbow(hue);
  
  // Chrome-like reflective sheen
  float spec = pow(max(dot(v_normal, normalize(vec3(0.5, 0.8, 1.0))), 0.0), 32.0);
  vec3 col = candy + vec3(spec * 0.8);

  // Soft rim
  col = mix(col, vec3(1.0), fresnel * 0.25);
  
  gl_FragColor = vec4(col, 1.0);
}`},{id:"magic_xray",name:"X-Ray",category:"✨ Fun & Magic",type:"shader",generate:(e,o,i)=>{e.fillStyle="#000508",e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill();const a=e.createRadialGradient(o/2,i/2,o*.25,o/2,i/2,o*.5);a.addColorStop(0,"rgba(150,220,255,0.0)"),a.addColorStop(.75,"rgba(150,220,255,0.5)"),a.addColorStop(1,"rgba(220,245,255,1.0)"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_view_dir;
void main() {
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view_dir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_view_dir;

void main() {
  float fresnel = pow(1.0 - max(dot(v_normal, v_view_dir), 0.0), 1.8);
  float pulse = 0.85 + 0.15 * sin(u_time * 2.0);
  vec3 xray = vec3(0.55, 0.88, 1.0) * fresnel * pulse * 2.2;
  gl_FragColor = vec4(xray, fresnel * 0.9);
}`}],B=[{id:"wonderlust_anime_water",name:"Anime Caustics Water",category:"🌍 Wonderlust",type:"shader",description:"Procedural Voronoi water caustics with smooth minimum edge rings, 3-tier anime depth palette, and animated wave flow.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.25,"#4da9e8"),a.addColorStop(.65,"#1a4a8c"),a.addColorStop(1,"#091c38"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255,255,255,0.7)",e.lineWidth=3;for(let r=0;r<6;r++)e.beginPath(),e.arc(o*.3+r*30,i*.3+r%3*40,25,0,Math.PI*2),e.stroke()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec3 v_world_pos;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_uv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  v_world_pos = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec3 v_world_pos;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * h * k / 6.0;
}

vec2 cellPt(vec2 seed) {
  return 0.5 + 0.5 * sin(u_time * 0.8 + 6.2831 * seed);
}

float voronoiF1(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float md = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 n = vec2(float(x), float(y));
      vec2 pt = cellPt(hash2(i + n));
      md = min(md, length(n + pt - f));
    }
  }
  return md;
}

float voronoiSF1(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float res = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 n = vec2(float(x), float(y));
      vec2 pt = cellPt(hash2(i + n));
      res = smin(res, length(n + pt - f), 0.25);
    }
  }
  return res;
}

void main() {
  vec2 uv = (v_normal.xy * 0.5 + 0.5) * 6.0 + vec2(u_time * 0.08, u_time * 0.05);
  float f1 = voronoiF1(uv);
  float sf1 = voronoiSF1(uv);
  float edge = f1 - sf1;

  float t = smoothstep(0.03, 0.08, edge);
  vec3 deepColor = vec3(0.04, 0.15, 0.38);
  vec3 midColor = vec3(0.25, 0.65, 0.95);
  vec3 highlight = vec3(1.0, 1.0, 1.0);

  vec3 col = mix(deepColor, midColor, smoothstep(0.0, 0.5, t));
  col = mix(col, highlight, smoothstep(0.5, 1.0, t));

  // Fresnel edge brightness
  float fresnel = pow(1.0 - max(dot(v_normal, vec3(0.0, 0.0, 1.0)), 0.0), 2.5);
  col += vec3(0.3, 0.7, 1.0) * fresnel * 0.6;

  gl_FragColor = vec4(col, 1.0);
}`},{id:"wonderlust_ghibli_summer",name:"Ghibli Summer Split-Toning",category:"🌍 Wonderlust",type:"shader",description:"Golden sunlit highlights, soft atmospheric cerulean shadows, chlorophyll saturation boost, and celluloid vignette.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#fff4cc"),a.addColorStop(.3,"#78c25e"),a.addColorStop(.7,"#257d5a"),a.addColorStop(1,"#0e2b38"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec2 v_uv;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
  // Lighting computation with sun vector
  vec3 sunDir = normalize(vec3(0.5, 0.8, 0.6));
  float NdotL = max(dot(v_normal, sunDir), 0.0);
  
  // Base lush nature palette
  vec3 shadowCol = vec3(0.08, 0.22, 0.32);
  vec3 midCol = vec3(0.22, 0.55, 0.25);
  vec3 litCol = vec3(0.68, 0.88, 0.38);

  vec3 col = mix(shadowCol, midCol, smoothstep(0.1, 0.45, NdotL));
  col = mix(col, litCol, smoothstep(0.45, 0.9, NdotL));

  // Ghibli Summer Split-Toning
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 warmGold = col * vec3(1.12, 1.05, 0.88);
  vec3 azureShadow = col * vec3(0.90, 0.96, 1.10);
  col = mix(azureShadow, warmGold, smoothstep(0.2, 0.75, lum));

  // Lush saturation boost
  col = mix(vec3(lum), col, 1.25);

  // Optical sun shimmer on highlight peaks
  col += max(vec3(0.0), col - 0.55) * vec3(0.18, 0.14, 0.04);

  // Celluloid rim
  float fresnel = pow(1.0 - max(dot(v_normal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
  col += vec3(0.9, 0.95, 0.7) * fresnel * 0.4;

  gl_FragColor = vec4(col, 1.0);
}`},{id:"wonderlust_journey_sand",name:"Journey Desert Sand & Shimmer",category:"🌍 Wonderlust",type:"shader",description:"Warm desert dunes with Journey-inspired sparkling Blinn-Phong micro-glitter and ridge rim lighting.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#fff2d1"),a.addColorStop(.3,"#f39c12"),a.addColorStop(.7,"#d35400"),a.addColorStop(1,"#5c1d00"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_position;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;

void main() {
  vec3 viewDir = normalize(-v_position);
  vec3 lightDir = normalize(vec3(0.6, 0.8, 0.5));
  vec3 halfDir = normalize(lightDir + viewDir);

  float NdotL = max(dot(v_normal, lightDir), 0.0);
  vec3 sandShadow = vec3(0.38, 0.16, 0.06);
  vec3 sandMid = vec3(0.92, 0.58, 0.22);
  vec3 sandSun = vec3(1.0, 0.86, 0.55);

  vec3 col = mix(sandShadow, sandMid, smoothstep(0.08, 0.45, NdotL));
  col = mix(col, sandSun, smoothstep(0.45, 0.92, NdotL));

  // Dune rim lighting along grazing angles
  float rim = 1.0 - max(dot(v_normal, viewDir), 0.0);
  float rimStrength = pow(rim, 3.8) * 0.65;
  col += vec3(1.0, 0.78, 0.42) * rimStrength;

  // Journey Sand Specular Shimmer (Continuous organic micro-glitter, NO chunky pixels)
  float spec = pow(max(dot(v_normal, halfDir), 0.0), 20.0);
  vec3 p = v_position * 120.0;
  float s1 = sin(p.x * 1.5 + sin(p.y * 1.7 + u_time * 2.5) * 2.8);
  float s2 = cos(p.y * 1.6 + cos(p.z * 1.4 - u_time * 2.0) * 2.8);
  float s3 = sin(p.z * 1.8 + sin(p.x * 1.9 + u_time * 1.2) * 2.8);
  float sparkle = pow(clamp(s1 * s2 * s3 * 0.5 + 0.5, 0.0, 1.0), 10.0) * 4.5;

  col += vec3(1.0, 0.90, 0.65) * spec * (0.35 + sparkle * 1.4);

  gl_FragColor = vec4(col, 1.0);
}`},{id:"wonderlust_glacial_snow",name:"Glacial Diamond Snow & Ice",category:"🌍 Wonderlust",type:"shader",description:"Crisp sky-blue rim highlight, dynamic diamond snow glitter sparkle effect, and glacial subsurface ice tones.",generate:(e,o,i)=>{const a=e.createRadialGradient(o*.65,i*.35,10,o*.5,i*.5,o*.5);a.addColorStop(0,"#ffffff"),a.addColorStop(.3,"#bfe9ff"),a.addColorStop(.7,"#4895ef"),a.addColorStop(1,"#0e244d"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_position;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;

void main() {
  vec3 viewDir = normalize(-v_position);
  vec3 lightDir = normalize(vec3(0.5, 0.9, 0.4));
  vec3 halfDir = normalize(lightDir + viewDir);

  float NdotL = max(dot(v_normal, lightDir), 0.0);
  vec3 snowDeep = vec3(0.12, 0.26, 0.50);
  vec3 snowMid = vec3(0.68, 0.86, 0.98);
  vec3 snowHighlight = vec3(1.0, 1.0, 1.0);

  vec3 col = mix(snowDeep, snowMid, smoothstep(0.08, 0.48, NdotL));
  col = mix(col, snowHighlight, smoothstep(0.48, 0.92, NdotL));

  // Glacial crisp sky-blue rim
  float snowRim = 1.0 - max(dot(v_normal, viewDir), 0.0);
  col += vec3(0.65, 0.88, 1.0) * pow(snowRim, 3.2) * 0.85;

  // Diamond snow micro-sparkle (Continuous crystalline glints, NO chunky pixels)
  float spec = pow(max(dot(v_normal, halfDir), 0.0), 22.0);
  vec3 p = v_position * 135.0;
  float s1 = sin(p.x * 1.6 + cos(p.y * 1.9 + u_time * 2.6) * 3.0);
  float s2 = cos(p.y * 1.7 + sin(p.z * 1.8 - u_time * 2.2) * 3.0);
  float s3 = sin(p.z * 2.0 + cos(p.x * 1.4 + u_time * 1.4) * 3.0);
  float diamondSparkle = pow(clamp(s1 * s2 * s3 * 0.5 + 0.5, 0.0, 1.0), 12.0) * 5.0;

  col += vec3(0.90, 0.96, 1.0) * spec * (0.3 + diamondSparkle * 1.6);

  gl_FragColor = vec4(col, 1.0);
}`},{id:"wonderlust_crystal_glow",name:"Prismatic Instanced Crystal",category:"🌍 Wonderlust",type:"shader",description:"6-stop smooth cubic color gradient, animated hue shifting, Fresnel rim glow, and vibrance boosting.",generate:(e,o,i)=>{const a=e.createLinearGradient(0,0,o,i);a.addColorStop(0,"#ff007f"),a.addColorStop(.25,"#7928ca"),a.addColorStop(.5,"#0070f3"),a.addColorStop(.75,"#00dfd8"),a.addColorStop(1,"#79ffe1"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec3 v_normal;
varying vec3 v_position;
void main() {
  v_normal = normalize(normalMatrix * normal);
  v_position = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_position;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float tC = clamp((v_position.y + 1.2) / 2.4, 0.0, 1.0);
  
  // 6 color stops
  vec3 c0 = vec3(0.9, 0.1, 0.5);
  vec3 c1 = vec3(0.5, 0.1, 0.9);
  vec3 c2 = vec3(0.1, 0.4, 1.0);
  vec3 c3 = vec3(0.0, 0.9, 0.8);
  vec3 c4 = vec3(0.4, 1.0, 0.5);
  vec3 c5 = vec3(1.0, 0.9, 0.2);

  float segment = tC * 5.0;
  int idx = int(floor(segment));
  float frac = fract(segment);
  float t = frac * frac * (3.0 - 2.0 * frac);

  vec3 gradCol;
  if (idx == 0) gradCol = mix(c0, c1, t);
  else if (idx == 1) gradCol = mix(c1, c2, t);
  else if (idx == 2) gradCol = mix(c2, c3, t);
  else if (idx == 3) gradCol = mix(c3, c4, t);
  else gradCol = mix(c4, c5, t);

  // Time-based hue shift
  vec3 hsv = rgb2hsv(gradCol);
  hsv.x = fract(hsv.x + u_time * 0.1);
  gradCol = hsv2rgb(hsv);

  // High power Fresnel rim glow
  float fresnel = pow(1.0 - max(dot(v_normal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
  vec3 rimCol = mix(gradCol, vec3(1.0), 0.6);
  vec3 finalCol = mix(gradCol, rimCol, fresnel * 0.8);

  // Vibrance
  vec3 hsvFinal = rgb2hsv(finalCol);
  hsvFinal.y = min(hsvFinal.y * 1.3, 1.0);
  hsvFinal.z = min(hsvFinal.z * 1.2, 1.0);

  gl_FragColor = vec4(hsv2rgb(hsvFinal), 1.0);
}`},{id:"wonderlust_beach_shoreline",name:"Anime Beach Shoreline",category:"🌍 Wonderlust",type:"shader",description:"Stylized anime beach shoreline with oscillating wave foam, turquoise shallow sea, deep waters, and warm sand.",generate:(e,o,i)=>{e.fillStyle="#f5d77f",e.fillRect(0,0,o,i),e.fillStyle="#ffffff",e.fillRect(0,i*.35,o,20),e.fillStyle="#00d2d3",e.fillRect(0,i*.4,o,i*.3),e.fillStyle="#0984e3",e.fillRect(0,i*.7,o,i*.3)},vertexShader:`precision mediump float;
varying vec2 v_uv;
varying vec3 v_normal;
void main() {
  v_uv = uv;
  v_normal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec2 v_uv;
varying vec3 v_normal;

#define PI 3.14159265359

float plotFoam(vec2 st, float pct) {
  return step(pct + 0.06, st.y) - step(pct + 0.08 + abs(sin(u_time * 0.8) * 0.15), st.y);
}
float plotSand(vec2 st, float pct) {
  return step(pct + 0.08, st.y);
}
float plotSea(vec2 st, float pct) {
  return step(pct - 0.45, st.y) - step(pct + 0.06, st.y);
}
float plotDeepSea(vec2 st, float pct) {
  return 1.0 - step(pct - 0.45, st.y);
}

void main() {
  vec2 st = v_uv;
  float y = sin(u_time * 0.8) * 0.15 + sin(PI * 6.0 * st.x) * 0.03 + st.x * 0.3 + 0.35;

  float foam = plotFoam(st, y);
  float sand = plotSand(st, y);
  float sea = plotSea(st, y);
  float deepSea = plotDeepSea(st, y);

  vec3 sandCol = vec3(0.96, 0.82, 0.45);
  vec3 foamCol = vec3(1.0, 1.0, 1.0);
  vec3 seaCol = vec3(0.0, 0.82, 0.95);
  vec3 deepSeaCol = vec3(0.08, 0.25, 0.65);

  vec3 col = sand * sandCol + foam * foamCol + sea * seaCol + deepSea * deepSeaCol;
  
  // Soft 3D lighting shading
  float diff = max(dot(v_normal, normalize(vec3(0.4, 0.7, 0.6))), 0.0);
  col *= (0.75 + diff * 0.3);

  gl_FragColor = vec4(col, 1.0);
}`},{id:"wonderlust_sunset_ocean",name:"Minimalist Sunset Ocean",category:"🌍 Wonderlust",type:"shader",description:"3-color minimalist animated ocean sunset gradient with organic wave displacement and warm twilight glow.",generate:(e,o,i)=>{const a=e.createLinearGradient(0,0,0,i);a.addColorStop(0,"#f39c12"),a.addColorStop(.5,"#e74c3c"),a.addColorStop(1,"#2c3e50"),e.fillStyle=a,e.beginPath(),e.arc(o/2,i/2,o/2,0,Math.PI*2),e.fill()},vertexShader:`precision mediump float;
varying vec2 v_uv;
varying vec3 v_normal;
void main() {
  v_uv = uv;
  v_normal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,fragmentShader:`precision mediump float;
uniform float u_time;
varying vec2 v_uv;
varying vec3 v_normal;

float cnoise(vec2 uv) {
  const mat2 r = mat2(-0.1288, -0.9917, 0.9917, -0.1288);
  vec2 s0 = cos(uv);
  vec2 s1 = cos(uv * 2.5 * r);
  vec2 s2 = cos(uv * 4.0 * r * r);
  vec2 s = s0 * s1 * s2;
  return (s.x + s.y) * 0.25 + 0.5;
}

void main() {
  vec2 uv = (v_uv - 0.5) * 2.0;

  // Wave displacement
  float wave = cnoise(uv * vec2(2.0, 15.0) + u_time * 1.5) * 0.08;
  vec2 st = vec2(uv.x, uv.y + wave);

  vec3 sunGold = vec3(1.0, 0.78, 0.2);
  vec3 orangeSky = vec3(0.95, 0.42, 0.12);
  vec3 twilightDeep = vec3(0.18, 0.08, 0.25);

  vec3 col = mix(sunGold, orangeSky, smoothstep(-0.4, 0.4, st.y));
  col = mix(col, twilightDeep, smoothstep(0.2, 0.9, -st.y));

  // Sun disc in center
  float sunDisc = smoothstep(0.35, 0.33, length(uv - vec2(0.0, 0.15)));
  col = mix(col, vec3(1.0, 0.95, 0.8), sunDisc * 0.8);

  // Soft spherical shading
  float diff = max(dot(v_normal, normalize(vec3(0.2, 0.5, 0.8))), 0.0);
  col *= (0.7 + diff * 0.35);

  gl_FragColor = vec4(col, 1.0);
}`}];function v(e){const o=document.createElement("canvas");o.width=512,o.height=512;const i=o.getContext("2d");return e(i,512,512),o.toDataURL("image/png")}const K=[...R.map(e=>({...e,url:v(e.generate)})),...F.map(e=>({...e,url:v(e.generate)})),...k.map(e=>({...e,url:v(e.generate)})),...B.map(e=>({...e,url:v(e.generate)})),...D.map(e=>({...e,url:v(e.generate)})),...x.map(e=>({...e,url:v(e.generate)})),...T.map(e=>({...e,url:v(e.generate)})),...z.map(e=>({...e,url:v(e.generate)})),...q.map(e=>({...e,url:v(e.generate)})),...E.map(e=>e.generate?{...e,url:v(e.generate)}:e),...V.map(e=>e.generate?{...e,url:v(e.generate)}:e),...W.map(e=>e.generate?{...e,url:v(e.generate)}:e),...L.map(e=>e.generate?{...e,url:v(e.generate)}:e),...j.map(e=>e.generate?{...e,url:v(e.generate)}:e),...A.map(e=>e.generate?{...e,url:v(e.generate)}:e),...N.map(e=>e.generate?{...e,url:v(e.generate)}:e)],U=["All","🎨 Blobmixer MatCaps","☀️ Summer Afternoon","🌿 Godot Water & Grass","🌍 Wonderlust","🍃 Wayfinder & Grassworks","⚡ WebGPU & Cyber","🌊 Live Desktop Shaders","✨ Fun & Magic","Toon Shaders","Flat Colors","Glass & Crystal","Bright Colors","Metals","Clay & Matte","Gems & Organics"];export{K as A,U as P,v as c};
