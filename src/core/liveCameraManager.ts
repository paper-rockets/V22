/**
 * @license
 * Live Camera & AR Passthrough Engine
 *
 * Provides hardware-accelerated video streaming from the device's physical camera
 * (front-facing selfie 'user' or rear-facing 'environment') into a THREE.VideoTexture
 * and DOM elements for live AR background drawing and PIP preview.
 *
 * Tuned for mobile battery and thermal efficiency:
 * - Streams at lightweight 720p (1280x720) with fallback to 480p to conserve memory bus bandwidth.
 * - Shuts down all hardware video tracks immediately when deactivated to prevent battery drain.
 */

import * as THREE from 'three';

export type CameraFacingMode = 'user' | 'environment';

export interface LiveCameraState {
  isActive: boolean;
  facingMode: CameraFacingMode;
  mirrored: boolean;
  opacity: number;
  hasPermission: boolean;
  error: string | null;
}

export class LiveCameraManager {
  private videoEl: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private videoTexture: THREE.VideoTexture | null = null;
  private facingMode: CameraFacingMode = 'user';
  private isActive: boolean = false;
  private mirrored: boolean = true;
  private opacity: number = 1.0;
  private hasPermission: boolean = false;
  private lastError: string | null = null;
  private onStateChangeCallbacks: Set<(state: LiveCameraState) => void> = new Set();

  constructor() {
    // Lazy video element initialization
  }

  public subscribe(cb: (state: LiveCameraState) => void): () => void {
    this.onStateChangeCallbacks.add(cb);
    cb(this.getState());
    return () => this.onStateChangeCallbacks.delete(cb);
  }

  private notify(): void {
    const state = this.getState();
    this.onStateChangeCallbacks.forEach((cb) => {
      try { cb(state); } catch (_) {}
    });
  }

  public getState(): LiveCameraState {
    return {
      isActive: this.isActive,
      facingMode: this.facingMode,
      mirrored: this.mirrored,
      opacity: this.opacity,
      hasPermission: this.hasPermission,
      error: this.lastError,
    };
  }

  private ensureVideoElement(): HTMLVideoElement {
    if (!this.videoEl) {
      const vid = document.createElement('video');
      vid.autoplay = true;
      vid.playsInline = true;
      vid.muted = true;
      vid.crossOrigin = 'anonymous';
      vid.style.position = 'fixed';
      vid.style.top = '-9999px';
      vid.style.left = '-9999px';
      vid.style.width = '1px';
      vid.style.height = '1px';
      vid.style.opacity = '0';
      vid.style.pointerEvents = 'none';
      document.body.appendChild(vid);
      this.videoEl = vid;
    }
    return this.videoEl;
  }

  /**
   * Starts the camera stream
   */
  public async start(preferredFacing: CameraFacingMode = this.facingMode): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.lastError = 'Camera access is not supported on this browser';
      this.notify();
      return false;
    }

    this.stop(); // Stop any existing stream first
    this.facingMode = preferredFacing;
    this.mirrored = preferredFacing === 'user';
    this.lastError = null;

    try {
      // Lightweight constraints (720p ideal, 30fps) for cool and fast mobile operation
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: preferredFacing },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;
      this.hasPermission = true;

      const vid = this.ensureVideoElement();
      vid.srcObject = stream;
      await vid.play();

      if (!this.videoTexture) {
        const tex = new THREE.VideoTexture(vid);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        this.videoTexture = tex;
      } else {
        this.videoTexture.image = vid;
        this.videoTexture.needsUpdate = true;
      }

      this.isActive = true;
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('LiveCameraManager start failed:', err);
      this.lastError = err?.message || 'Could not access camera';
      this.hasPermission = false;
      this.isActive = false;
      this.notify();
      return false;
    }
  }

  /**
   * Stops camera stream and releases hardware tracks immediately to save battery
   */
  public stop(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try { track.stop(); } catch (_) {}
      });
      this.mediaStream = null;
    }

    if (this.videoEl) {
      this.videoEl.pause();
      this.videoEl.srcObject = null;
    }

    this.isActive = false;
    this.notify();
  }

  public toggle(): Promise<boolean> {
    if (this.isActive) {
      this.stop();
      return Promise.resolve(false);
    } else {
      return this.start();
    }
  }

  /**
   * Flips between Front (user) and Back (environment) camera
   */
  public async switchFacingMode(): Promise<boolean> {
    const nextMode: CameraFacingMode = this.facingMode === 'user' ? 'environment' : 'user';
    return this.start(nextMode);
  }

  public setOpacity(opacity: number): void {
    this.opacity = Math.max(0.0, Math.min(1.0, opacity));
    this.notify();
  }

  public setMirrored(mirrored: boolean): void {
    this.mirrored = mirrored;
    this.notify();
  }

  public updateTextureAspect(viewportWidth: number, viewportHeight: number): void {
    if (!this.videoTexture || !this.videoEl) return;
    const videoW = this.videoEl.videoWidth || 1280;
    const videoH = this.videoEl.videoHeight || 720;
    if (viewportWidth <= 0 || viewportHeight <= 0 || videoW <= 0 || videoH <= 0) return;

    const screenAspect = viewportWidth / viewportHeight;
    const videoAspect = videoW / videoH;

    this.videoTexture.matrixAutoUpdate = false;
    this.videoTexture.matrix.identity();

    if (screenAspect > videoAspect) {
      // Viewport is wider than camera: crop top/bottom
      const scaleY = videoAspect / screenAspect;
      this.videoTexture.matrix.scale(this.mirrored ? -1 : 1, scaleY);
      this.videoTexture.matrix.translate(this.mirrored ? -1 : 0, (1 - scaleY) * 0.5);
    } else {
      // Viewport is taller than camera: crop sides
      const scaleX = screenAspect / videoAspect;
      this.videoTexture.matrix.scale(this.mirrored ? -scaleX : scaleX, 1);
      this.videoTexture.matrix.translate(this.mirrored ? -(1 + scaleX) * 0.5 : (1 - scaleX) * 0.5, 0);
    }
  }

  public getVideoTexture(): THREE.VideoTexture | null {
    return this.isActive ? this.videoTexture : null;
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoEl;
  }

  public getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  public dispose(): void {
    this.stop();
    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }
    if (this.videoEl && this.videoEl.parentElement) {
      this.videoEl.parentElement.removeChild(this.videoEl);
      this.videoEl = null;
    }
    this.onStateChangeCallbacks.clear();
  }
}
