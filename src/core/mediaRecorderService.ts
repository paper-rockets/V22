/**
 * High-performance WebGL Canvas Video Recorder
 * Uses HTMLCanvasElement.captureStream + MediaRecorder (VP9 / H.264 / WebM / MP4)
 */

export interface VideoRecordingFormat {
  mimeType: string;
  extension: string;
}

export function getSupportedVideoMimeType(): VideoRecordingFormat {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: '', extension: 'webm' };
  }

  const candidates: VideoRecordingFormat[] = [
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
    { mimeType: 'video/mp4;codecs=avc1', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
  ];

  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c.mimeType)) {
        return c;
      }
    } catch (_) {
      // Ignored
    }
  }

  return { mimeType: 'video/webm', extension: 'webm' };
}

export function isVideoRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    'captureStream' in HTMLCanvasElement.prototype &&
    typeof MediaRecorder !== 'undefined'
  );
}

export class MediaRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private currentFormat: VideoRecordingFormat = { mimeType: 'video/webm', extension: 'webm' };
  private active: boolean = false;
  private stopResolver: ((value: { blob: Blob; mimeType: string; extension: string }) => void) | null = null;
  private stopRejecter: ((reason?: any) => void) | null = null;

  public isRecording(): boolean {
    return this.active;
  }

  /**
   * Starts capturing frames directly from the WebGL canvas
   */
  public startRecording(
    canvas: HTMLCanvasElement,
    fps: number = 60,
    bitrate: number = 8_000_000
  ): boolean {
    if (this.active) {
      this.cancelRecording();
    }

    if (!isVideoRecordingSupported()) {
      console.warn('[MediaRecorderService] Video recording is not supported in this browser.');
      return false;
    }

    try {
      this.stream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
      if (!this.stream) {
        console.warn('[MediaRecorderService] captureStream not available on canvas element.');
        return false;
      }

      this.currentFormat = getSupportedVideoMimeType();
      this.recordedChunks = [];

      const options: MediaRecorderOptions = {
        videoBitsPerSecond: bitrate,
      };

      if (this.currentFormat.mimeType) {
        options.mimeType = this.currentFormat.mimeType;
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const finalBlob = new Blob(this.recordedChunks, {
          type: this.currentFormat.mimeType || 'video/webm',
        });
        this.cleanup();
        if (this.stopResolver) {
          this.stopResolver({
            blob: finalBlob,
            mimeType: this.currentFormat.mimeType,
            extension: this.currentFormat.extension,
          });
          this.stopResolver = null;
          this.stopRejecter = null;
        }
      };

      this.mediaRecorder.onerror = (e: any) => {
        console.error('[MediaRecorderService] Error during recording:', e);
        if (this.stopRejecter) {
          this.stopRejecter(e);
          this.stopResolver = null;
          this.stopRejecter = null;
        }
        this.cleanup();
      };

      // Request data chunks every 500ms
      this.mediaRecorder.start(500);
      this.active = true;
      return true;
    } catch (err) {
      console.error('[MediaRecorderService] Failed to start MediaRecorder:', err);
      this.cleanup();
      return false;
    }
  }

  /**
   * Requests a keyframe render / data slice
   */
  public requestData(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.requestData();
      } catch (_) {}
    }
  }

  /**
   * Stops recording and returns the final video Blob with format details
   */
  public stopRecording(): Promise<{ blob: Blob; mimeType: string; extension: string }> {
    return new Promise((resolve, reject) => {
      if (!this.active || !this.mediaRecorder) {
        resolve({
          blob: new Blob([], { type: 'video/webm' }),
          mimeType: 'video/webm',
          extension: 'webm',
        });
        return;
      }

      this.stopResolver = resolve;
      this.stopRejecter = reject;

      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch (err) {
        console.error('[MediaRecorderService] Error stopping MediaRecorder:', err);
        reject(err);
        this.cleanup();
      }
    });
  }

  /**
   * Cancels recording without emitting a result
   */
  public cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (_) {}
    }
    if (this.stopRejecter) {
      this.stopRejecter(new Error('Recording cancelled'));
      this.stopResolver = null;
      this.stopRejecter = null;
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.active = false;
    this.mediaRecorder = null;
    if (this.stream) {
      try {
        this.stream.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      this.stream = null;
    }
  }
}
