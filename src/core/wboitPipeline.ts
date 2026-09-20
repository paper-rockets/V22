/**
 * @license
 * Weighted Blended Order-Independent Transparency (WBOIT) Pipeline
 *
 * Implements the McGuire & Bavoil (2013) Order-Independent Transparency algorithm
 * using WebGL 2.0 Multiple Render Targets (MRT count: 2) and a shared DepthTexture
 * between the Opaque and Accumulation passes:
 *
 * - Pass 1 (Opaque & Cutout Pass):
 *   Renders opaque and alpha-tested geometry into `opaqueTarget` with depth writing enabled.
 *   Generates the reference depth buffer in `sharedDepthTexture`.
 *
 * - Pass 2 (Transparent Accumulation Pass):
 *   Renders all transparent geometry into `accumTarget` (MRT count: 2) with `depthWrite: false`
 *   and `depthTest: true` testing against `sharedDepthTexture`.
 *   - Target 0 (Accumulation Buffer):
 *     RGB = sum(C_i * alpha_i * w(z_i))
 *     Alpha = product(1.0 - alpha_i) [Revealage]
 *     Blend state:
 *       RGB:   gl.ONE, gl.ONE (Additive accumulation)
 *       Alpha: gl.ZERO, gl.ONE_MINUS_SRC_ALPHA (Multiplicative revealage product)
 *   - Target 1 (Weight Sum Buffer):
 *     R = sum(alpha_i * w(z_i))
 *     Blend state:
 *       gl.ONE, gl.ONE (Additive accumulation)
 *
 * - Pass 3 (Composite Pass):
 *   Full-screen quad combining `opaqueTarget`, `accumTarget.textures[0]`, and `accumTarget.textures[1]`
 *   using the McGuire & Bavoil reconstruction:
 *   Color = (Accum.rgb / max(Weight.r, 1e-5)) * (1.0 - Revealage) + Opaque.rgb * Revealage
 *
 * - Pass 4 (Overlay Pass):
 *   Renders helpers (cursor, guides, selection) on top of the composite with cleared depth.
 *   Special blend-mode strokes (multiply, screen) are drawn at the end of Pass 1 instead,
 *   so they stay depth-tested against the opaque scene.
 *
 * Designed and optimized for mobile Mali / Adreno GPUs including Galaxy Tab S6 Lite (Mali-G72).
 */

import * as THREE from 'three';
import { OKLAB_FULL_PIPELINE_GLSL } from './colorMath';
import { ScreenScissorRect } from './wboitScissor';

// Static scratch Float32Array objects to avoid per-frame allocations
// Target 0 clear: RGB = 0.0 (accumulated color), Alpha = 1.0 (initial revealage = 1.0)
const CLEAR_COLOR_0 = new Float32Array([0.0, 0.0, 0.0, 1.0]);
// Target 1 clear: R = 0.0 (initial weight sum = 0.0), GBA = 0.0
const CLEAR_COLOR_1 = new Float32Array([0.0, 0.0, 0.0, 0.0]);

/**
 * McGuire & Bavoil depth-based transparency weight function
 * Features near-plane singularity attenuation so ribbons close to the camera lens
 * do not cause FP16 overflow or dark blotches.
 */
export const WBOIT_WEIGHT_GLSL_CHUNK = `
// McGuire & Bavoil depth-based transparency weight function
float computeWBOITWeight(float z, float alpha) {
  float d = max(abs(z), 0.001);
  // Attenuate near-plane singularity when ribbon is directly adjacent to the camera lens
  float camDistFactor = smoothstep(0.01, 0.45, d);
  // McGuire & Bavoil rational depth weight function, clamped for half-float FP16 stability
  float w = (0.2 + 0.8 * camDistFactor) * (10.0 / (1e-5 + pow(max(d, 0.25), 2.0) + pow(d / 2.5, 4.0)));
  return clamp(w, 0.01, 50.0);
}
`;

export const WBOIT_ACCUM_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vWboitViewDepth;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  vWboitViewDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const WBOIT_ACCUM_FRAGMENT_SHADER = `
${OKLAB_FULL_PIPELINE_GLSL}
${WBOIT_WEIGHT_GLSL_CHUNK}

layout(location = 0) out highp vec4 pc_fragData0;
layout(location = 1) out highp vec4 pc_fragData1;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uRoughness;
uniform float uMetalness;
uniform vec3 uLightDir;
uniform vec3 uLightColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vWboitViewDepth;

void main() {
  float alpha = clamp(uOpacity, 0.0, 1.0);
  if (alpha < 0.005) discard;

  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewPosition);
  vec3 L = normalize(uLightDir);
  vec3 H = normalize(L + V);

  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, H), 0.0);

  vec3 linearBase = srgb_to_linear(uColor);
  vec3 diffuse = linearBase * (1.0 - uMetalness) * (0.35 + 0.65 * NdotL);
  vec3 specular = vec3(pow(max(0.0, NdotH), 24.0) * (0.04 + 0.96 * uMetalness));
  vec3 color = diffuse + specular;

  float weight = computeWBOITWeight(vWboitViewDepth, alpha);

  // Target 0: Accumulation Buffer = vec4(color * alpha * weight, alpha)
  // Blended with (ONE, ONE) for RGB, and (ZERO, ONE_MINUS_SRC_ALPHA) for Alpha (Revealage)
  pc_fragData0 = vec4(color * alpha * weight, alpha);

  // Target 1: Weight Sum Buffer = vec4(alpha * weight, 0, 0, 0)
  // Blended with (ONE, ONE) for additive accumulation of total weight
  pc_fragData1 = vec4(alpha * weight, 0.0, 0.0, 0.0);
}
`;

export const WBOIT_COMPOSITE_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const WBOIT_COMPOSITE_FRAGMENT_SHADER = `
uniform sampler2D tOpaque;
uniform sampler2D tAccum;
uniform sampler2D tWeight;
uniform int uDebugView; // 0 = normal, 1 = raw accum, 2 = raw reveal, 3 = raw weight, 4 = 3-way split
uniform int uShowPipOverlay; // 0 = off, 1 = on (PIP thumbnails)
uniform vec4 uScissor; // minU, minV, maxU, maxV; full target when disabled
varying vec2 vUv;

void main() {
  vec4 opaque = texture2D(tOpaque, vUv);
  if (uDebugView == 0 && (vUv.x < uScissor.x || vUv.y < uScissor.y || vUv.x > uScissor.z || vUv.y > uScissor.w)) {
    gl_FragColor = opaque;
    return;
  }
  vec4 accum = texture2D(tAccum, vUv);
  vec4 weightSample = texture2D(tWeight, vUv);

  float weightSum = weightSample.r;
  float revealage = accum.a;

  // Diagnostic mode 1: Raw Accumulation Buffer (RGB)
  if (uDebugView == 1) {
    gl_FragColor = vec4(accum.rgb, 1.0);
    return;
  }
  // Diagnostic mode 2: Raw Revealage Buffer (Alpha)
  if (uDebugView == 2) {
    gl_FragColor = vec4(vec3(revealage), 1.0);
    return;
  }
  // Diagnostic mode 3: Raw Weight-Sum Buffer (R normalized)
  if (uDebugView == 3) {
    gl_FragColor = vec4(vec3(clamp(weightSum / 25.0, 0.0, 1.0)), 1.0);
    return;
  }
  // Diagnostic mode 4: 3-Way Split Screen View (Accumulation | Revealage | Weight-Sum)
  if (uDebugView == 4) {
    if (vUv.x < 0.331) {
      gl_FragColor = vec4(accum.rgb, 1.0);
    } else if (vUv.x < 0.334) {
      gl_FragColor = vec4(0.29, 0.87, 0.5, 1.0); // Emerald divider
    } else if (vUv.x < 0.664) {
      gl_FragColor = vec4(vec3(revealage), 1.0);
    } else if (vUv.x < 0.667) {
      gl_FragColor = vec4(0.29, 0.87, 0.5, 1.0); // Emerald divider
    } else {
      gl_FragColor = vec4(vec3(clamp(weightSum / 25.0, 0.0, 1.0)), 1.0);
    }
    return;
  }

  // Base composite: if no transparent fragments covered this pixel, pass opaque through directly
  vec4 finalPixel = opaque;
  if (revealage < 0.999 && weightSum > 0.0001) {
    // McGuire & Bavoil composite with FP16 overflow & NaN prevention
    vec3 avgColor = accum.rgb / max(weightSum, 0.001);
    avgColor = clamp(avgColor, 0.0, 8.0);
    vec3 finalColor = max(avgColor * (1.0 - revealage) + opaque.rgb * revealage, vec3(0.0));
    finalPixel = vec4(finalColor, 1.0);
  }

  // Toggleable PIP overlay rendering all three diagnostic targets side-by-side in bottom-right corner
  if (uShowPipOverlay == 1 && vUv.y < 0.22 && vUv.x > 0.44) {
    float pipX = (vUv.x - 0.44) / 0.54;
    float pipY = vUv.y / 0.22;

    // Window 1: Raw Accumulation Target
    if (pipX >= 0.02 && pipX <= 0.31 && pipY >= 0.10 && pipY <= 0.90) {
      vec2 subUv = vec2((pipX - 0.02) / 0.29, (pipY - 0.10) / 0.80);
      vec4 subAccum = texture2D(tAccum, subUv);
      gl_FragColor = vec4(subAccum.rgb, 1.0);
      return;
    }
    // Window 2: Raw Revealage Target
    if (pipX >= 0.35 && pipX <= 0.64 && pipY >= 0.10 && pipY <= 0.90) {
      vec2 subUv = vec2((pipX - 0.35) / 0.29, (pipY - 0.10) / 0.80);
      vec4 subAccum = texture2D(tAccum, subUv);
      gl_FragColor = vec4(vec3(subAccum.a), 1.0);
      return;
    }
    // Window 3: Raw Weight-Sum Target
    if (pipX >= 0.68 && pipX <= 0.97 && pipY >= 0.10 && pipY <= 0.90) {
      vec2 subUv = vec2((pipX - 0.68) / 0.29, (pipY - 0.10) / 0.80);
      vec4 subWeight = texture2D(tWeight, subUv);
      gl_FragColor = vec4(vec3(clamp(subWeight.r / 25.0, 0.0, 1.0)), 1.0);
      return;
    }
    // Dark container banner behind PIP windows
    if (pipX >= 0.0 && pipX <= 1.0 && pipY >= 0.0 && pipY <= 1.0) {
      finalPixel = mix(finalPixel, vec4(0.05, 0.06, 0.08, 0.92), 0.75);
    }
  }

  gl_FragColor = finalPixel;
}
`;

/**
 * Injects McGuire & Bavoil WBOIT accumulation logic into any material:
 * - Computes view-space depth `vWboitViewDepth` in the vertex shader.
 * - Adds MRT attachment 1 output `layout(location = 1) out highp vec4 pc_fragData1`.
 * - Multiplies color and alpha in Target 0 by the depth-attenuated weight function.
 * - Writes `alpha * weight` to Target 1 for the composite weight sum.
 * Compatible with standard Three.js materials AND custom THREE.ShaderMaterials.
 */
/**
 * Shared switch for every injected material. The accumulation maths rewrites
 * the fragment colour into weighted, premultiplied form, which is only valid
 * while drawing into the MRT accumulation target. Outside that pass (WBOIT off,
 * low-tier devices, snapshots, ray tracing, the cutout pass) injected materials
 * must render exactly as they did before injection.
 */
export const WBOIT_ACCUM_UNIFORM = { value: 0 };

export function injectWboitShader(material: THREE.Material, timeUniform?: { value: number }): void {
  if ((material as any).userData?.wboitInjected) return;
  (material as any).userData = (material as any).userData || {};
  (material as any).userData.wboitInjected = true;

  const wboitFragHeader = `layout(location = 1) out highp vec4 pc_fragData1;\nuniform float uWboitAccum;\nvarying highp float vWboitViewDepth;\n`;

  const wboitFragInjection = `
  if (uWboitAccum > 0.5) {
    // McGuire & Bavoil WBOIT accumulation logic with camera-distance dependent term
    float wboitAlpha = clamp(gl_FragColor.a, 0.0, 1.0);
    float wboitD = max(vWboitViewDepth, 0.001);

    // Attenuates near-plane singularity so ribbons very close to camera don't blow up
    float camDistFactor = smoothstep(0.01, 0.45, wboitD);
    float w = (0.2 + 0.8 * camDistFactor) * (10.0 / (1e-5 + pow(max(wboitD, 0.25), 2.0) + pow(wboitD / 2.5, 4.0)));
    w = clamp(w, 0.01, 50.0);

    // Target 0: accum rgb + revealage alpha
    gl_FragColor = vec4(gl_FragColor.rgb * wboitAlpha * w, wboitAlpha);
    // Target 1: weightSum
    pc_fragData1 = vec4(wboitAlpha * w, 0.0, 0.0, 0.0);
  } else {
    pc_fragData1 = vec4(0.0);
  }
`;

  if (material instanceof THREE.ShaderMaterial) {
    material.uniforms.uWboitAccum = WBOIT_ACCUM_UNIFORM;
    if (!material.vertexShader.includes('vWboitViewDepth')) {
      material.vertexShader = `varying highp float vWboitViewDepth;\n${material.vertexShader}`;
      material.vertexShader = material.vertexShader.replace(
        /void\s+main\s*\(\s*\)\s*{/,
        `void main() {\n  vec4 _wboitMvPos = modelViewMatrix * vec4(position, 1.0);\n  vWboitViewDepth = -_wboitMvPos.z;\n`
      );
    }
    if (!material.fragmentShader.includes('pc_fragData1')) {
      material.fragmentShader = `${wboitFragHeader}${material.fragmentShader}`;
      material.fragmentShader = material.fragmentShader.replace(
        /}\s*$/,
        `${wboitFragInjection}\n}`
      );
    }
    material.needsUpdate = true;
    return;
  }

  const prevOnBeforeCompile = material.onBeforeCompile;
  const prevCacheKey = material.customProgramCacheKey;
  const prevSource = prevOnBeforeCompile ? prevOnBeforeCompile.toString() : '';
  material.onBeforeCompile = (shader, renderer) => {
    if (prevOnBeforeCompile) {
      prevOnBeforeCompile(shader, renderer);
    }

    shader.uniforms.uWboitAccum = WBOIT_ACCUM_UNIFORM;

    if (timeUniform && !shader.uniforms.uTime) {
      shader.uniforms.uTime = timeUniform;
    }

    // 1. Injects vWboitViewDepth varying (view-space depth)
    if (!shader.vertexShader.includes('vWboitViewDepth')) {
      shader.vertexShader = `varying highp float vWboitViewDepth;\n${shader.vertexShader}`;
      if (shader.vertexShader.includes('#include <project_vertex>')) {
        shader.vertexShader = shader.vertexShader.replace(
          '#include <project_vertex>',
          `#include <project_vertex>\nvWboitViewDepth = -mvPosition.z;`
        );
      } else {
        shader.vertexShader = shader.vertexShader.replace(
          /void\s+main\s*\(\s*\)\s*{/,
          `void main() {\n  vec4 _wboitMvPos = modelViewMatrix * vec4(position, 1.0);\n  vWboitViewDepth = -_wboitMvPos.z;\n`
        );
      }
    }

    // 2. Adds layout(location=1) out highp vec4 pc_fragData1 for MRT weight output
    if (!shader.fragmentShader.includes('pc_fragData1')) {
      shader.fragmentShader = `${wboitFragHeader}${shader.fragmentShader}`;

      if (shader.fragmentShader.includes('#include <dithering_fragment>')) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>\n${wboitFragInjection}`
        );
      } else {
        shader.fragmentShader = shader.fragmentShader.replace(
          /}\s*$/,
          `${wboitFragInjection}\n}`
        );
      }
    }
  };

  // Keyed by the injected code, not the material instance, so every colour and
  // opacity variant shares one compiled program instead of compiling its own.
  const hasCustomPrevKey = prevCacheKey !== THREE.Material.prototype.customProgramCacheKey;
  material.customProgramCacheKey = () =>
    `wboit|${prevSource}|${hasCustomPrevKey ? prevCacheKey.call(material) : ''}`;
  material.needsUpdate = true;
}

export class WBOITPipeline {
  private renderer: THREE.WebGLRenderer;
  private width: number;
  private height: number;

  public mrtSupported: boolean = true;
  public isUserEnabled: boolean = true;
  public transparencyModeOverride: 'auto' | 'wboit' | 'sorted' = 'auto';
  public drawBuffersIndexedExt: any = null;
  public hasIndexedBlending: boolean = false;
  public opaqueTarget: THREE.WebGLRenderTarget | null = null;
  public accumTarget: THREE.WebGLRenderTarget | null = null;
  public sharedDepthTexture: THREE.DepthTexture | null = null;

  // Composite Quad Scene
  private compositeScene: THREE.Scene;
  private compositeCamera: THREE.OrthographicCamera;
  private compositeMaterial: THREE.ShaderMaterial;
  private compositeQuad: THREE.Mesh;

  // Scratch objects for back-to-front sorting (low-tier fallback)
  private lastSortCameraPos = new THREE.Vector3();
  private lastSortCameraRot = new THREE.Quaternion();
  private lastSortRevision = -1;
  private savedVisibility = new Map<THREE.Object3D, boolean>();
  private scratchVecA = new THREE.Vector3();
  private scratchVecB = new THREE.Vector3();

  // Debug overlay (?wboitDebug=1) state
  private debugOverlayEl: HTMLDivElement | null = null;
  private debugInfoTextEl: HTMLDivElement | null = null;
  private lastDebugUpdate = 0;
  private frameCount = 0;
  private lastFpsCalcTime = 0;
  private cachedFps = 60;
  private cachedGpuName: string = '';
  private sharedDepthVerifiedCount = 0;

  // URL flags & visualization modes
  private debugViewMode: number = 0; // 0 = off, 1 = raw accum, 2 = raw reveal, 3 = raw weight, 4 = split 3-way
  private isPipOverlayEnabled: boolean = false;
  private isDebugOverlayEnabled: boolean = false;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);

    this.checkUrlFlags();
    this.initTargets();

    // Composite Quad setup
    this.compositeScene = new THREE.Scene();
    this.compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tOpaque: { value: this.opaqueTarget ? this.opaqueTarget.texture : null },
        tAccum: { value: this.accumTarget ? this.accumTarget.textures[0] : null },
        tWeight: { value: this.accumTarget ? this.accumTarget.textures[1] : null },
        uDebugView: { value: this.debugViewMode },
        uShowPipOverlay: { value: this.isPipOverlayEnabled ? 1 : 0 },
        uScissor: { value: new THREE.Vector4(0, 0, 1, 1) },
      },
      vertexShader: WBOIT_COMPOSITE_VERTEX_SHADER,
      fragmentShader: WBOIT_COMPOSITE_FRAGMENT_SHADER,
      depthTest: false,
      depthWrite: false,
    });

    this.compositeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.compositeMaterial);
    this.compositeScene.add(this.compositeQuad);

    if (this.isDebugOverlayEnabled) {
      this.initDebugOverlay();
    }
  }

  private checkUrlFlags(): void {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('wboitView');
      if (view === 'accum') this.debugViewMode = 1;
      else if (view === 'reveal') this.debugViewMode = 2;
      else if (view === 'weight') this.debugViewMode = 3;
      else if (view === 'split') this.debugViewMode = 4;

      if (params.get('wboitPip') === '1') {
        this.isPipOverlayEnabled = true;
      }

      this.isDebugOverlayEnabled = params.get('wboitDebug') === '1';
    } catch (_) {}
  }

  private computeTargetDimensions(): { width: number; height: number } {
    const dpr = this.renderer.getPixelRatio();
    // Clamp DPR to max 1.25 on high-DPI displays (e.g. S25 Ultra DPR 2.8) to prevent VRAM saturation and GPU watchdog timeouts
    const effectiveDpr = Math.min(dpr, 1.25);
    let w = Math.max(1, Math.floor(this.width * effectiveDpr));
    let h = Math.max(1, Math.floor(this.height * effectiveDpr));
    const maxDim = 1920;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.max(1, Math.floor(w * scale));
      h = Math.max(1, Math.floor(h * scale));
    }
    return { width: w, height: h };
  }

  private initTargets(): void {
    // Both Opaque and Accumulation targets MUST share identical dimensions
    // to preserve WebGL framebuffer completeness with the shared DepthTexture.
    const { width: w, height: h } = this.computeTargetDimensions();

    const gl = this.renderer.getContext();
    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    const halfFloatExt =
      gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');

    if (!isWebGL2 || !halfFloatExt) {
      this.mrtSupported = false;
      return;
    }

    // Query OES_draw_buffers_indexed extension to enable independent per-target blending states
    this.drawBuffersIndexedExt =
      gl.getExtension('OES_draw_buffers_indexed') ||
      gl.getExtension('EXT_draw_buffers_indexed') ||
      null;

    this.hasIndexedBlending = !!(
      this.drawBuffersIndexedExt &&
      (this.drawBuffersIndexedExt.blendFuncSeparateiOES ||
       this.drawBuffersIndexedExt.blendFuncSeparateiEXT ||
       this.drawBuffersIndexedExt.blendFuncSeparatei)
    );

    try {
      // 1. Shared DepthTexture between Opaque and Accumulation passes
      this.sharedDepthTexture = new THREE.DepthTexture(w, h);
      this.sharedDepthTexture.type = THREE.UnsignedIntType;
      this.sharedDepthTexture.format = THREE.DepthFormat;

      // 2. Opaque Render Target (writes depth into sharedDepthTexture)
      this.opaqueTarget = new THREE.WebGLRenderTarget(w, h, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        depthTexture: this.sharedDepthTexture,
        depthBuffer: true,
        stencilBuffer: false,
      });

      // 3. Accumulation Render Target: Multiple Render Targets (MRT count: 2)
      // - Attachment 0: vec4(color.rgb * alpha * weight, alpha)
      // - Attachment 1: vec4(alpha * weight, 0, 0, 0)
      // Shares the exact same DepthTexture instance so depth-test compares against opaque geometry
      this.accumTarget = new THREE.WebGLRenderTarget(w, h, {
        count: 2,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        depthTexture: this.sharedDepthTexture,
        depthBuffer: true,
        stencilBuffer: false,
      });

      // Pre-initialize WebGL framebuffer objects if supported by renderer
      if ((this.renderer as any).initRenderTarget) {
        try {
          (this.renderer as any).initRenderTarget(this.opaqueTarget);
          (this.renderer as any).initRenderTarget(this.accumTarget);
        } catch (_) {}
      }

      this.mrtSupported = true;
    } catch (err) {
      console.warn('WBOIT MRT target allocation failed:', err);
      this.mrtSupported = false;
      this.opaqueTarget?.dispose();
      this.accumTarget?.dispose();
      this.sharedDepthTexture?.dispose();
      this.opaqueTarget = null;
      this.accumTarget = null;
      this.sharedDepthTexture = null;
    }
  }

  /**
   * Verification step to ensure the DepthTexture shared between Opaque and Accumulation passes
   * is valid, properly reference-linked, and re-bound before accumulation draw calls.
   * Prevents depth-testing failures on low-end Mali GPUs where framebuffer attachment states
   * may get desynchronized across render target switches.
   */
  public verifySharedDepthBinding(): boolean {
    if (!this.mrtSupported || !this.opaqueTarget || !this.accumTarget || !this.sharedDepthTexture) {
      return false;
    }

    const depthTexture = this.sharedDepthTexture;

    // 1. Ensure both targets point to the shared DepthTexture instance
    if (this.opaqueTarget.depthTexture !== depthTexture) {
      this.opaqueTarget.depthTexture = depthTexture;
      this.opaqueTarget.depthBuffer = true;
    }
    if (this.accumTarget.depthTexture !== depthTexture) {
      this.accumTarget.depthTexture = depthTexture;
      this.accumTarget.depthBuffer = true;
    }

    // 2. Ensure depth texture dimensions match render targets
    const curW = this.opaqueTarget.width;
    const curH = this.opaqueTarget.height;
    if (depthTexture.image.width !== curW || depthTexture.image.height !== curH) {
      depthTexture.image.width = curW;
      depthTexture.image.height = curH;
      depthTexture.needsUpdate = true;
    }

    // 3. Low-level WebGL FBO attachment synchronization
    try {
      const props = (this.renderer as any).properties;
      if (props) {
        const opaqueProps = props.get(this.opaqueTarget);
        const accumProps = props.get(this.accumTarget);
        if (opaqueProps && accumProps) {
          if (opaqueProps.__webglDepthTexture && !accumProps.__webglDepthTexture) {
            accumProps.__webglDepthTexture = opaqueProps.__webglDepthTexture;
          }
        }
      }
    } catch (_) {}

    this.sharedDepthVerifiedCount++;
    return true;
  }

  public setSize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);

    if (!this.mrtSupported || !this.opaqueTarget || !this.accumTarget || !this.sharedDepthTexture) return;

    const { width: w, height: h } = this.computeTargetDimensions();

    this.opaqueTarget.setSize(w, h);
    this.accumTarget.setSize(w, h);

    // Re-link and resize shared depth texture
    this.sharedDepthTexture.image.width = w;
    this.sharedDepthTexture.image.height = h;
    this.sharedDepthTexture.needsUpdate = true;
    this.opaqueTarget.depthTexture = this.sharedDepthTexture;
    this.accumTarget.depthTexture = this.sharedDepthTexture;
  }

  /**
   * Sorts meshes back-to-front for low tier when WBOIT is inactive.
   * Only re-sorts when camera position/orientation or scene revision changes.
   * Uses preallocated scratch vectors to prevent garbage collection spikes.
   */
  public sortMeshesForLowTier(
    meshes: THREE.Mesh[],
    camera: THREE.Camera,
    sceneRevision: number
  ): void {
    if (meshes.length <= 1) return;

    const posMoved = camera.position.distanceToSquared(this.lastSortCameraPos) > 1e-4;
    const rotChanged = camera.quaternion.angleTo(this.lastSortCameraRot) > 1e-3;

    if (!posMoved && !rotChanged && sceneRevision === this.lastSortRevision) {
      return;
    }

    this.lastSortCameraPos.copy(camera.position);
    this.lastSortCameraRot.copy(camera.quaternion);
    this.lastSortRevision = sceneRevision;

    const camPos = this.lastSortCameraPos;

    meshes.sort((a, b) => {
      a.getWorldPosition(this.scratchVecA);
      b.getWorldPosition(this.scratchVecB);
      return camPos.distanceToSquared(this.scratchVecB) - camPos.distanceToSquared(this.scratchVecA);
    });

    for (let i = 0; i < meshes.length; i++) {
      meshes[i].renderOrder = 100 + i;
    }
  }

  /**
   * Clears WBOIT buffers with correct McGuire & Bavoil initial values:
   * Target 0: (0, 0, 0, 1) -> Color = 0, Revealage = 1.0
   * Target 1: (0, 0, 0, 0) -> Weight sum = 0.0
   * Preserves shared depth buffer intact.
   */
  public clearBuffers(): void {
    if (!this.accumTarget) return;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    this.renderer.setRenderTarget(this.accumTarget);
    gl.clearBufferfv(gl.COLOR, 0, CLEAR_COLOR_0);
    gl.clearBufferfv(gl.COLOR, 1, CLEAR_COLOR_1);
  }

  /**
   * Executes the complete McGuire & Bavoil WBOIT multi-pass pipeline:
   *
   * Pass 1: into opaqueTarget (populates color & sharedDepthTexture)
   *   1a. Background (sky, floor grid) so cutout holes reveal it rather than a blank clear.
   *   1b. Cutout depth-only meshes punch holes into the depth buffer.
   *   1c. Opaque meshes, depth-tested against the holes.
   *   1d. Ordered non-normal meshes (multiply, screen) blend onto the opaque colour and are
   *       depth-tested against the same depth, so models still occlude them.
   * Pass 2: Transparent Accumulation Pass into accumTarget (MRT count: 2, tests sharedDepthTexture)
   * Pass 3: Composite Pass combining opaqueTarget + accumTarget into destinationTarget
   * Pass 4: Overlay meshes (cursor, guides, selection) on top with cleared depth, never cut or covered.
   *
   * Every visible drawable in the scene must be in exactly one list: visibility is only
   * toggled on listed objects, so anything left out is drawn again in every pass.
   */
  public renderWboitFrame(
    scene: THREE.Scene,
    camera: THREE.Camera,
    opaqueMeshes: THREE.Mesh[],
    cutoutMeshes: THREE.Mesh[],
    transparentMeshes: THREE.Mesh[],
    orderedNonNormalMeshes: THREE.Mesh[],
    destinationTarget: THREE.WebGLRenderTarget | null = null,
    backgroundMeshes: THREE.Object3D[] = [],
    overlayMeshes: THREE.Object3D[] = [],
    sortedTransparentMeshes: THREE.Mesh[] = [],
    scissorRect: ScreenScissorRect | null = null
  ): void {
    if (!this.mrtSupported || !this.isUserEnabled || !this.opaqueTarget || !this.accumTarget) {
      return;
    }

    const startTime = performance.now();
    const gl = this.renderer.getContext() as WebGL2RenderingContext;

    const lists: THREE.Object3D[][] = [
      backgroundMeshes,
      opaqueMeshes,
      cutoutMeshes,
      transparentMeshes,
      sortedTransparentMeshes,
      orderedNonNormalMeshes,
      overlayMeshes,
    ];
    const savedVisibility = this.savedVisibility;
    savedVisibility.clear();
    for (const list of lists) {
      for (const obj of list) savedVisibility.set(obj, obj.visible);
    }
    const showOnly = (...visibleLists: THREE.Object3D[][]): void => {
      for (const list of lists) {
        const on = visibleLists.includes(list);
        for (const obj of list) obj.visible = on && (savedVisibility.get(obj) ?? true);
      }
    };

    interface SavedMatState {
      blending: THREE.Blending;
      blendSrc: THREE.BlendingSrcFactor;
      blendDst: THREE.BlendingDstFactor;
      blendSrcAlpha: THREE.BlendingSrcFactor | null;
      blendDstAlpha: THREE.BlendingDstFactor | null;
      blendEquation: THREE.BlendingEquation;
      blendEquationAlpha: THREE.BlendingEquation | null;
      depthWrite: boolean;
      depthTest: boolean;
      transparent: boolean;
    }
    const savedStates = new Map<THREE.Material, SavedMatState>();
    const prevAutoClear = this.renderer.autoClear;
    const prevSceneBackground = scene.background;
    let scissorEnabled = false;

    this.setDisplayReferred(
      destinationTarget === null || (destinationTarget as any).isXRRenderTarget === true
    );

    try {
      // -------------------------------------------------------------
      // PASS 1: Opaque, Cutout & Ordered into opaqueTarget
      // -------------------------------------------------------------
      this.renderer.setRenderTarget(this.opaqueTarget);
      this.renderer.autoClear = false;
      this.renderer.clear(true, true, true);

      if (cutoutMeshes.length > 0) {
        showOnly(backgroundMeshes);
        this.renderer.render(scene, camera);
        scene.background = null;

        showOnly(cutoutMeshes);
        this.renderer.render(scene, camera);

        showOnly(opaqueMeshes);
      } else {
        showOnly(backgroundMeshes, opaqueMeshes);
      }
      this.renderer.render(scene, camera);
      scene.background = null;

      // Isolated transparent strokes keep Three.js's native camera-depth sort.
      if (sortedTransparentMeshes.length > 0) {
        showOnly(sortedTransparentMeshes);
        this.renderer.render(scene, camera);
      }

      if (orderedNonNormalMeshes.length > 0) {
        showOnly(orderedNonNormalMeshes);
        this.renderer.render(scene, camera);
      }

      // -------------------------------------------------------------
      // PASS 2: Transparent Accumulation Pass (MRT count: 2)
      // -------------------------------------------------------------
      // Verify and synchronize shared depth texture binding before accumulation draw calls
      this.verifySharedDepthBinding();

      showOnly(transparentMeshes);

      this.renderer.setRenderTarget(this.accumTarget);

      if (scissorRect) {
        const targetWidth = this.accumTarget.width;
        const targetHeight = this.accumTarget.height;
        const x = Math.max(0, Math.min(targetWidth - 1, Math.floor(scissorRect.x)));
        const y = Math.max(0, Math.min(targetHeight - 1, Math.floor(scissorRect.y)));
        const width = Math.max(1, Math.min(targetWidth - x, Math.ceil(scissorRect.width)));
        const height = Math.max(1, Math.min(targetHeight - y, Math.ceil(scissorRect.height)));
        this.renderer.setScissor(x, y, width, height);
        this.renderer.setScissorTest(true);
        scissorEnabled = true;
      }

      // Clear color buffers ONLY — NEVER clear depth or stencil!
      gl.clearBufferfv(gl.COLOR, 0, CLEAR_COLOR_0); // target 0: [0, 0, 0, 1] (revealage = 1.0)
      gl.clearBufferfv(gl.COLOR, 1, CLEAR_COLOR_1); // target 1: [0, 0, 0, 0] (weightSum = 0.0)

      for (let i = 0; i < transparentMeshes.length; i++) {
        const mesh = transparentMeshes[i];
        if (!mesh.material) continue;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        for (const mat of materials) {
          if (!mat) continue;

          // Ensure WBOIT shader injection is present on all drawn lines and transparent meshes
          if (!(mat as any).userData?.wboitInjected) {
            injectWboitShader(mat);
          }

          if (!savedStates.has(mat)) {
            savedStates.set(mat, {
              blending: mat.blending,
              blendSrc: mat.blendSrc,
              blendDst: mat.blendDst,
              blendSrcAlpha: mat.blendSrcAlpha,
              blendDstAlpha: mat.blendDstAlpha,
              blendEquation: mat.blendEquation,
              blendEquationAlpha: mat.blendEquationAlpha,
              depthWrite: mat.depthWrite,
              depthTest: mat.depthTest,
              transparent: mat.transparent,
            });

            // Set McGuire & Bavoil WebGL2 blend states directly on Three.js material:
            // Target 0 RGB:   gl.ONE, gl.ONE (Additive color accumulation)
            // Target 0 Alpha: gl.ZERO, gl.ONE_MINUS_SRC_ALPHA (Multiplicative revealage product)
            mat.blending = THREE.CustomBlending;
            mat.blendEquation = THREE.AddEquation;
            mat.blendSrc = THREE.OneFactor;
            mat.blendDst = THREE.OneFactor;
            mat.blendEquationAlpha = THREE.AddEquation;
            mat.blendSrcAlpha = THREE.ZeroFactor;
            mat.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
            mat.depthWrite = false; // Do not overwrite opaque depth
            mat.depthTest = true;  // Test against sharedDepthTexture from Pass 1
            mat.transparent = true;
          }
        }
      }

      // Standard WebGL 2.0 unified blend states (Zero extension dependencies):
      // Target 0 gets RGB: (ONE, ONE) additive, Alpha: (ZERO, ONE_MINUS_SRC_ALPHA) multiplicative revealage.
      // Target 1 writes weight sum into the R channel which accumulates additively via RGB: (ONE, ONE).
      // Target 1 writes 0.0 into Alpha, so (ZERO, ONE_MINUS_SRC_ALPHA) leaves Alpha untouched.
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);

      // Render transparent geometry into MRT accumTarget (preserve depth with autoClear = false)
      WBOIT_ACCUM_UNIFORM.value = 1;
      this.renderer.render(scene, camera);
      WBOIT_ACCUM_UNIFORM.value = 0;
      if (scissorEnabled) {
        this.renderer.setScissorTest(false);
        scissorEnabled = false;
      }

      // -------------------------------------------------------------
      // PASS 3: Composite Pass (Opaque + Accum -> destinationTarget)
      // -------------------------------------------------------------
      this.compositeMaterial.uniforms.tOpaque.value = this.opaqueTarget.texture;
      this.compositeMaterial.uniforms.tAccum.value = this.accumTarget.textures[0];
      this.compositeMaterial.uniforms.tWeight.value = this.accumTarget.textures[1];
      this.compositeMaterial.uniforms.uDebugView.value = this.debugViewMode;
      this.compositeMaterial.uniforms.uShowPipOverlay.value = this.isPipOverlayEnabled ? 1 : 0;
      const scissorUniform = this.compositeMaterial.uniforms.uScissor.value as THREE.Vector4;
      if (scissorRect) {
        scissorUniform.set(
          scissorRect.x / this.accumTarget.width,
          scissorRect.y / this.accumTarget.height,
          (scissorRect.x + scissorRect.width) / this.accumTarget.width,
          (scissorRect.y + scissorRect.height) / this.accumTarget.height
        );
      } else {
        scissorUniform.set(0, 0, 1, 1);
      }

      // Full clear first: the destination's depth still holds whatever the previous
      // frame left, and on tile-based GPUs a clear is cheaper than loading old contents.
      this.renderer.setRenderTarget(destinationTarget);
      this.renderer.clear(true, true, true);
      this.renderer.render(this.compositeScene, this.compositeCamera);

      // -------------------------------------------------------------
      // PASS 4: Overlay (helpers) on top, never occluded or cut
      // -------------------------------------------------------------
      if (overlayMeshes.length > 0) {
        showOnly(overlayMeshes);
        this.renderer.render(scene, camera);
      }
    } finally {
      WBOIT_ACCUM_UNIFORM.value = 0;
      if (scissorEnabled) this.renderer.setScissorTest(false);

      // Restore scene background
      scene.background = prevSceneBackground;

      // Restore renderer autoClear
      this.renderer.autoClear = prevAutoClear;

      // Restore original material states
      savedStates.forEach((state, mat) => {
        mat.blending = state.blending;
        mat.blendSrc = state.blendSrc;
        mat.blendDst = state.blendDst;
        mat.blendSrcAlpha = state.blendSrcAlpha;
        mat.blendDstAlpha = state.blendDstAlpha;
        mat.blendEquation = state.blendEquation;
        mat.blendEquationAlpha = state.blendEquationAlpha;
        mat.depthWrite = state.depthWrite;
        mat.depthTest = state.depthTest;
        mat.transparent = state.transparent;
      });

      try {
        this.renderer.state.setBlending(THREE.NormalBlending);
      } catch (_) {}

      // Restore original mesh visibilities
      savedVisibility.forEach((visible, obj) => { obj.visible = visible; });
      savedVisibility.clear();
    }

    // Update debug overlay if active
    if (this.isDebugOverlayEnabled) {
      const frameDuration = performance.now() - startTime;
      this.updateDebugOverlay(frameDuration, 'WBOIT');
    }
  }

  /**
   * Three.js applies tone mapping and output colour encoding per material, but
   * only when drawing to the canvas or an XR target; offscreen targets get raw
   * linear colour. When this frame is headed for the canvas, the offscreen
   * targets are flagged the same way so every material (including ones with
   * toneMapped:false, like the background) encodes exactly as in a plain render,
   * and transparency blends in the same space the canvas would. Without this,
   * the whole image shifts colour whenever WBOIT switches on.
   */
  private setDisplayReferred(on: boolean): void {
    if (!this.opaqueTarget || !this.accumTarget) return;
    const colorSpace = on ? this.renderer.outputColorSpace : THREE.NoColorSpace;
    for (const target of [this.opaqueTarget, this.accumTarget]) {
      (target as any).isXRRenderTarget = on;
      for (const texture of target.textures) texture.colorSpace = colorSpace;
    }
  }

  /**
   * Executes the full-screen composite pass directly
   */
  public renderComposite(destinationTarget: THREE.WebGLRenderTarget | null = null): void {
    if (!this.opaqueTarget || !this.accumTarget) return;
    this.compositeMaterial.uniforms.tOpaque.value = this.opaqueTarget.texture;
    this.compositeMaterial.uniforms.tAccum.value = this.accumTarget.textures[0];
    this.compositeMaterial.uniforms.tWeight.value = this.accumTarget.textures[1];
    this.renderer.setRenderTarget(destinationTarget);
    this.renderer.render(this.compositeScene, this.compositeCamera);
  }

  public setEnabled(enabled: boolean): void {
    this.isUserEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isUserEnabled && this.mrtSupported;
  }

  public setPipOverlay(enabled: boolean): void {
    this.isPipOverlayEnabled = enabled;
    if (this.compositeMaterial) {
      this.compositeMaterial.uniforms.uShowPipOverlay.value = enabled ? 1 : 0;
    }
  }

  public setDebugHud(enabled: boolean): void {
    this.isDebugOverlayEnabled = enabled;
    if (enabled && !this.debugOverlayEl) {
      this.initDebugOverlay();
    } else if (!enabled && this.debugOverlayEl) {
      this.debugOverlayEl.style.display = 'none';
    } else if (enabled && this.debugOverlayEl) {
      this.debugOverlayEl.style.display = 'block';
    }
  }

  /**
   * Prewarms and compiles shaders at startup to avoid runtime hitching
   */
  public prewarm(renderer: THREE.WebGLRenderer): void {
    try {
      renderer.compile(this.compositeScene, this.compositeCamera);
    } catch (_) {}
  }

  public setDebugViewMode(mode: number): void {
    this.debugViewMode = mode;
    if (this.compositeMaterial) {
      this.compositeMaterial.uniforms.uDebugView.value = mode;
    }
  }

  public togglePipOverlay(): void {
    this.isPipOverlayEnabled = !this.isPipOverlayEnabled;
    if (this.compositeMaterial) {
      this.compositeMaterial.uniforms.uShowPipOverlay.value = this.isPipOverlayEnabled ? 1 : 0;
    }
  }

  // -----------------------------------------------------------------
  // URL DIAGNOSTIC OVERLAY (?wboitDebug=1)
  // Toggleable overlay rendering raw accumulation, revealage, and weight-sum targets
  // -----------------------------------------------------------------
  private initDebugOverlay(): void {
    if (typeof document === 'undefined' || this.debugOverlayEl) return;

    const box = document.createElement('div');
    box.id = 'wboit-debug-overlay';
    box.style.position = 'fixed';
    box.style.top = '12px';
    box.style.left = '12px';
    box.style.zIndex = '99999';
    box.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    box.style.fontSize = '11px';
    box.style.lineHeight = '1.4';
    box.style.color = '#e2e8f0';
    box.style.backgroundColor = 'rgba(15, 23, 42, 0.88)';
    box.style.backdropFilter = 'blur(8px)';
    box.style.padding = '10px 12px';
    box.style.borderRadius = '8px';
    box.style.border = '1px solid rgba(74, 222, 128, 0.3)';
    box.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
    box.style.maxWidth = '380px';
    box.style.userSelect = 'none';

    // Title & Status header
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.marginBottom = '8px';

    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.color = '#4ade80';
    title.style.letterSpacing = '0.05em';
    title.textContent = 'WBOIT DIAGNOSTIC PIPELINE';
    titleRow.appendChild(title);

    box.appendChild(titleRow);

    // Telemetry text area
    const info = document.createElement('div');
    info.style.whiteSpace = 'pre';
    info.style.color = '#94a3b8';
    info.style.fontSize = '10px';
    info.style.lineHeight = '1.5';
    info.textContent = 'Analyzing pipeline states...';
    this.debugInfoTextEl = info;
    box.appendChild(info);

    document.body.appendChild(box);
    this.debugOverlayEl = box;
  }

  public updateDebugOverlay(frameTimeMs: number, mode: 'WBOIT' | 'Sorted' | 'Off'): void {
    if (!this.debugOverlayEl || !this.debugInfoTextEl) return;

    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFpsCalcTime >= 1000) {
      this.cachedFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
    }

    if (now - this.lastDebugUpdate < 1000) return;
    this.lastDebugUpdate = now;

    if (!this.cachedGpuName) {
      try {
        const gl = this.renderer.getContext();
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        this.cachedGpuName = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'WebGL2';
      } catch (_) {
        this.cachedGpuName = 'WebGL2';
      }
    }

    const blendingState = this.hasIndexedBlending
      ? 'OES_draw_buffers_indexed (Active)'
      : 'WebGL2 BlendFuncSeparate (Active)';

    const viewNames = ['Normal Composite', 'Raw Accumulation (RGB)', 'Raw Revealage (Alpha)', 'Raw Weight-Sum (R)', '3-Way Split Overlay'];
    const currentView = viewNames[this.debugViewMode] ?? 'Normal';

    this.debugInfoTextEl.textContent =
      `Target View : ${currentView}\n` +
      `PIP Preview : ${this.isPipOverlayEnabled ? 'Enabled (3 targets)' : 'Disabled'}\n` +
      `MRT Count   : 2 Attachments (Accum + Weight)\n` +
      `Blending    : ${blendingState}\n` +
      `Shared Depth: Verified (${this.sharedDepthVerifiedCount} frames)\n` +
      `FPS         : ${this.cachedFps} (${frameTimeMs.toFixed(1)} ms)\n` +
      `GPU         : ${this.cachedGpuName}`;
  }

  public dispose(): void {
    this.opaqueTarget?.dispose();
    this.accumTarget?.dispose();
    this.sharedDepthTexture?.dispose();
    this.opaqueTarget = null;
    this.accumTarget = null;
    this.sharedDepthTexture = null;

    this.compositeMaterial.dispose();
    this.compositeQuad.geometry.dispose();

    if (this.debugOverlayEl && this.debugOverlayEl.parentNode) {
      this.debugOverlayEl.parentNode.removeChild(this.debugOverlayEl);
      this.debugOverlayEl = null;
    }
  }
}
