import * as THREE from 'three';
import { ModelStorage } from '../core/modelStorage';
import { Saved3DModel } from '../types';
import { modelLoader } from '../core/modelLoader';
import { ModelConverterEngine } from '../core/modelConverter';

export interface PreloadedModelData {
  scene?: THREE.Object3D | null;
  triangleCount?: number;
  vertexCount?: number;
  dimensions?: { x: number; y: number; z: number };
}

export class AutoPreviewGenerator {
  /**
   * Render a clean, studio-lit 2D thumbnail preview of any THREE.Object3D
   */
  public static async generateFromObject(
    object: THREE.Object3D,
    width = 256,
    height = 256
  ): Promise<string> {
    try {
      return await ModelConverterEngine.generateThumbnail(object, width, height);
    } catch (err) {
      console.warn('Thumbnail generation failed from object:', err);
      return '';
    }
  }

  /**
   * Auto-generate preview image and save an uploaded 3D file into ModelStorage.
   * If preloaded scene data is passed, re-parsing the file is skipped to save memory.
   */
  public static async autoPreviewAndSaveFile(
    file: File,
    engineSnapshot?: string | null,
    preloaded?: PreloadedModelData
  ): Promise<Saved3DModel> {
    const arrayBuffer = await file.arrayBuffer();
    const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Custom Model';
    const ext = (file.name.split('.').pop() || 'glb').toLowerCase();

    let thumbnail = engineSnapshot || '';
    let triangleCount = preloaded?.triangleCount || 0;
    let vertexCount = preloaded?.vertexCount || 0;
    let dimensions = preloaded?.dimensions || { x: 1, y: 1, z: 1 };

    // If preloaded scene is available, reuse it without parsing the file a second time
    if (preloaded?.scene) {
      if (!thumbnail) {
        try {
          thumbnail = await ModelConverterEngine.generateThumbnail(preloaded.scene, 256, 256);
        } catch (e) {
          console.warn('Thumbnail generation from preloaded scene failed:', e);
        }
      }
    } else if (!thumbnail || triangleCount === 0) {
      try {
        // Fallback: only parse if no preloaded scene was provided
        const loadRes = await modelLoader.loadFromFiles([file]);
        if (loadRes?.scene) {
          if (!thumbnail) {
            thumbnail = await ModelConverterEngine.generateThumbnail(loadRes.scene, 256, 256);
          }
          if (loadRes.metadata) {
            triangleCount = loadRes.metadata.triangles || 0;
            vertexCount = loadRes.metadata.vertices || 0;
            dimensions = loadRes.metadata.dimensions || { x: 1, y: 1, z: 1 };
          }
        }
        loadRes.cleanedBlobUrls?.();
      } catch (e) {
        console.warn('Offscreen inspection failed, falling back to snapshot:', e);
      }
    }

    if (!thumbnail && engineSnapshot) {
      thumbnail = engineSnapshot;
    }

    const savedModel: Saved3DModel = {
      id: `model_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      originalName: file.name,
      originalFormat: ext,
      originalSize: file.size,
      compressedSize: arrayBuffer.byteLength,
      savedDate: Date.now(),
      thumbnail,
      blob: arrayBuffer,
      triangleCount,
      vertexCount,
      meshCount: 1,
      materialCount: 1,
      dimensions,
      dracoCompressed: false,
      isBaked: false,
    };

    await ModelStorage.saveModel(savedModel);
    return savedModel;
  }

  /**
   * Auto-generate preview image and save an ArrayBuffer into ModelStorage
   */
  public static async autoPreviewAndSaveBuffer(
    buffer: ArrayBuffer,
    name: string,
    format = 'glb',
    engineSnapshot?: string | null
  ): Promise<Saved3DModel> {
    const file = new File([buffer], `${name}.${format}`, { type: 'model/gltf-binary' });
    return this.autoPreviewAndSaveFile(file, engineSnapshot);
  }
}
