import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudioEngine } from '../core/studioEngine';
import { Layer, LightingPreset, BrushSettings, ToolType } from '../types';
import { AutoSaveStatus } from '../components/AutoSaveToast';
import {
  checkStoragePersistence,
  requestStoragePersistence,
  getStorageEstimate,
  saveAutoSaveProject,
  loadAutoSaveProject,
  hasAutoSaveProject,
  clearAutoSaveProject,
  StorageEstimateInfo,
  AutoSaveMetaInfo,
} from '../utils/storagePermission';
import { haptics } from '../utils/haptics';

interface UseAppAutoSaveProps {
  engine: StudioEngine | null;
  layers: Layer[];
  activeModelName: string;
  lightingPreset: LightingPreset;
  brushSettings: BrushSettings;
  tool: ToolType;
  setActiveModelName: (name: string) => void;
  setActiveModelId: (id: string | null) => void;
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  setActiveLayerId: (id: string) => void;
  setLightingPreset: (preset: LightingPreset) => void;
  setShowGrid: (show: boolean) => void;
  setShowPlane: (show: boolean) => void;
  setShowWireframe: (show: boolean) => void;
}

export function useAppAutoSave({
  engine,
  layers,
  activeModelName,
  lightingPreset,
  brushSettings,
  tool,
  setActiveModelName,
  setActiveModelId,
  setLayers,
  setActiveLayerId,
  setLightingPreset,
  setShowGrid,
  setShowPlane,
  setShowWireframe,
}: UseAppAutoSaveProps) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isStoragePersistent, setIsStoragePersistent] = useState<boolean>(false);
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimateInfo | null>(null);
  const [autoSaveMeta, setAutoSaveMeta] = useState<AutoSaveMetaInfo>({ exists: false });
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Storage Persistence check and query local autosave session
  useEffect(() => {
    checkStoragePersistence().then((persisted) => {
      setIsStoragePersistent(persisted);
      if (!persisted) {
        requestStoragePersistence().then((granted) => {
          setIsStoragePersistent(granted);
        });
      }
    });
    getStorageEstimate().then(setStorageEstimate);
    hasAutoSaveProject().then(setAutoSaveMeta);
  }, []);

  const handleRequestStoragePermission = useCallback(async () => {
    const granted = await requestStoragePersistence();
    setIsStoragePersistent(granted);
    const est = await getStorageEstimate();
    setStorageEstimate(est);
    return granted;
  }, []);

  const handleRestoreAutoSave = useCallback(async () => {
    if (!engine) return;
    try {
      const savedProject = await loadAutoSaveProject();
      if (savedProject) {
        await engine.importProjectData(savedProject);
        if (savedProject.activeModelName) {
          setActiveModelName(savedProject.activeModelName);
        }
        if (savedProject.activeModelId) {
          setActiveModelId(savedProject.activeModelId);
        }
        if (savedProject.layers && savedProject.layers.length > 0) {
          setLayers(savedProject.layers);
          setActiveLayerId(savedProject.layers[0].id);
        }
        if (savedProject.lightingPreset) {
          setLightingPreset(savedProject.lightingPreset);
        }
        if (savedProject.showGrid !== undefined) {
          setShowGrid(savedProject.showGrid);
        }
        if (savedProject.showPlane !== undefined) {
          setShowPlane(savedProject.showPlane);
        }
        if (savedProject.showWireframe !== undefined) {
          setShowWireframe(savedProject.showWireframe);
        }
        haptics.trigger('success');
      }
    } catch (err) {
      console.error('Failed to restore autosaved project:', err);
    }
  }, [engine, setActiveModelName, setActiveModelId, setLayers, setActiveLayerId, setLightingPreset, setShowGrid, setShowPlane, setShowWireframe]);

  const handleClearAutoSave = useCallback(async () => {
    await clearAutoSaveProject();
    setAutoSaveMeta({ exists: false });
    const est = await getStorageEstimate();
    setStorageEstimate(est);
    haptics.trigger('light');
  }, []);

  const triggerAutoSave = useCallback((_reason?: string) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (!engine) return;
      try {
        setAutoSaveStatus('saving');

        const projectData = engine.exportProjectData('Autosaved Session', layers);
        await saveAutoSaveProject(projectData);

        const metaState = {
          timestamp: Date.now(),
          layerCount: layers.length,
          modelName: activeModelName,
          lightingPreset,
          brushSettingsSummary: {
            color: brushSettings.color,
            size: brushSettings.size,
            tool,
          },
        };
        try {
          localStorage.setItem('mody_autosave_meta', JSON.stringify(metaState));
        } catch (_) {}

        setAutoSaveStatus('saved');
        setLastSavedTime(new Date());
        setAutoSaveMeta({
          exists: true,
          timestamp: Date.now(),
          strokeCount: projectData.strokes?.length || 0,
          layerCount: layers.length,
          modelName: activeModelName,
          formattedDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        getStorageEstimate().then(setStorageEstimate);

        setTimeout(() => {
          setAutoSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
        }, 2500);
      } catch (err) {
        console.warn('Auto-save storage failed:', err);
        setAutoSaveStatus('error');
        setTimeout(() => {
          setAutoSaveStatus((prev) => (prev === 'error' ? 'idle' : prev));
        }, 3500);
      }
    }, 650);
  }, [engine, layers, activeModelName, lightingPreset, brushSettings, tool]);

  return {
    autoSaveStatus,
    lastSavedTime,
    isStoragePersistent,
    storageEstimate,
    autoSaveMeta,
    handleRequestStoragePermission,
    handleRestoreAutoSave,
    handleClearAutoSave,
    triggerAutoSave,
  };
}
