import React, { useEffect } from 'react';
import { ToolType, BrushSettings } from '../types';

interface UseAppShortcutsOptions {
  handleUndo: () => void;
  handleRedo: () => void;
  handleCopyStrokes: () => void;
  handlePasteStrokes: () => void;
  handleQuickSave: () => void | Promise<void>;
  setTool: React.Dispatch<React.SetStateAction<ToolType>>;
  setBrushSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
}

export function useAppShortcuts({
  handleUndo,
  handleRedo,
  handleCopyStrokes,
  handlePasteStrokes,
  handleQuickSave,
  setTool,
  setBrushSettings,
}: UseAppShortcutsOptions) {
  // Global Ctrl+S / Cmd+S Quick Save shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleQuickSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickSave]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopyStrokes();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteStrokes();
      } else if (e.key.toLowerCase() === 'b') {
        setTool('brush');
      } else if (e.key.toLowerCase() === 'u') {
        setTool('spatial_brush');
      } else if (e.key.toLowerCase() === 'i') {
        setTool((prev) => (prev === 'paint_picker' || prev === 'eyedropper' ? 'brush' : 'paint_picker'));
      } else if (e.key.toLowerCase() === 'j') {
        setTool((prev) => (prev === 'brush_picker' ? 'brush' : 'brush_picker'));
      } else if (e.key === '[') {
        setBrushSettings((prev) => ({
          ...prev,
          size: Math.max(0.01, prev.size - 0.005),
        }));
      } else if (e.key === ']') {
        setBrushSettings((prev) => ({
          ...prev,
          size: Math.min(0.25, prev.size + 0.005),
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleCopyStrokes, handlePasteStrokes, setTool, setBrushSettings]);
}
