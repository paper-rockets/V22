import React, { useState, useRef, useEffect } from 'react';
import { ReferenceImageItem } from '../types';
import {
  Image,
  Trash2,
  RotateCw,
  X,
  Upload,
  Clipboard,
  Pin,
  PinOff,
  Contrast,
  Sun,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FloatingReferenceClipboardProps {
  isOpen: boolean;
  onClose: () => void;
  referenceImages: ReferenceImageItem[];
  setReferenceImages: React.Dispatch<React.SetStateAction<ReferenceImageItem[]>>;
  theme?: 'light' | 'dark';
}

export const FloatingReferenceClipboard: React.FC<FloatingReferenceClipboardProps> = ({
  isOpen,
  onClose,
  referenceImages,
  setReferenceImages,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const [activeImageId, setActiveImageId] = useState<string | null>(
    referenceImages[0]?.id || null
  );
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [clipboardPosition, setClipboardPosition] = useState<{ x: number; y: number }>({
    x: 24,
    y: 80,
  });
  const [isDraggingHeader, setIsDraggingHeader] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync active image when list changes
  useEffect(() => {
    if (!activeImageId && referenceImages.length > 0) {
      setActiveImageId(referenceImages[0].id);
    } else if (activeImageId && !referenceImages.some((img) => img.id === activeImageId)) {
      setActiveImageId(referenceImages[0]?.id || null);
    }
  }, [referenceImages, activeImageId]);

  // Global paste handler for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const url = event.target?.result as string;
              if (url) {
                addImageItem(url, `Reference ${referenceImages.length + 1}`);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, referenceImages.length]);

  // Window drag handler (mouse)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingHeader) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setClipboardPosition({
        x: Math.max(8, Math.min(window.innerWidth - 300, dragStartRef.current.startX + dx)),
        y: Math.max(8, Math.min(window.innerHeight - 80, dragStartRef.current.startY + dy)),
      });
    };

    const handleMouseUp = () => {
      setIsDraggingHeader(false);
    };

    if (isDraggingHeader) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHeader]);

  // Touch drag handlers (mobile/tablet support)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDraggingHeader(true);
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      startX: clipboardPosition.x,
      startY: clipboardPosition.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingHeader) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - dragStartRef.current.mouseX;
    const dy = touch.clientY - dragStartRef.current.mouseY;
    setClipboardPosition({
      x: Math.max(8, Math.min(window.innerWidth - 300, dragStartRef.current.startX + dx)),
      y: Math.max(8, Math.min(window.innerHeight - 80, dragStartRef.current.startY + dy)),
    });
  };

  const handleTouchEnd = () => {
    setIsDraggingHeader(false);
  };

  const addImageItem = (url: string, name: string = 'Reference Image') => {
    const id = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem: ReferenceImageItem = {
      id,
      name,
      url,
      x: 10,
      y: 10,
      width: 240,
      height: 180,
      opacity: 0.75,
      rotation: 0,
      scale: 1.0,
      visible: true,
      locked: false,
      pinned: true,
      grayscale: false,
      invert: false,
    };

    setReferenceImages((prev) => [newItem, ...prev]);
    setActiveImageId(id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        if (url) {
          addImageItem(url, file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activeItem = referenceImages.find((item) => item.id === activeImageId);

  const updateActiveItem = (updates: Partial<ReferenceImageItem>) => {
    if (!activeImageId) return;
    setReferenceImages((prev) =>
      prev.map((item) => (item.id === activeImageId ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setReferenceImages((prev) => prev.filter((item) => item.id !== id));
    if (activeImageId === id) {
      const remaining = referenceImages.filter((item) => item.id !== id);
      setActiveImageId(remaining[0]?.id || null);
    }
  };

  return (
    <div
      id="mody-floating-clipboard"
      style={{
        left: `${clipboardPosition.x}px`,
        top: `${clipboardPosition.y}px`,
      }}
      className={`fixed z-40 select-none shadow-2xl rounded-2xl border font-sans w-80 sm:w-[350px] overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
        isLight
          ? 'bg-white border-neutral-200 text-neutral-900 shadow-2xl'
          : 'bg-[#18191d] border-neutral-800 text-neutral-100 shadow-2xl'
      }`}
    >
      {/* Header (Draggable Handle) */}
      <div
        onMouseDown={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
            setIsDraggingHeader(true);
            dragStartRef.current = {
              mouseX: e.clientX,
              mouseY: e.clientY,
              startX: clipboardPosition.x,
              startY: clipboardPosition.y,
            };
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`drag-handle flex items-center justify-between p-3.5 px-4 border-b cursor-grab active:cursor-grabbing select-none ${
          isLight ? 'bg-neutral-50/90 border-neutral-200' : 'bg-[#121316] border-neutral-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          <span className="text-xs font-semibold tracking-tight">Reference Images</span>
          {referenceImages.length > 0 && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium ${
                isLight
                  ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
                  : 'bg-white/10 text-neutral-300 border-white/10'
              }`}
            >
              {referenceImages.length} {referenceImages.length === 1 ? 'image' : 'images'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? 'Expand reference board' : 'Collapse reference board'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900'
                : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reference board"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900'
                : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3.5 space-y-3.5 max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Quick Actions: Upload File, Paste Helper */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-xs cursor-pointer ${
                isLight
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  : 'bg-white hover:bg-neutral-100 text-neutral-950'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.read().then((items) => {
                  for (const item of items) {
                    const imageType = item.types.find((t) => t.startsWith('image/'));
                    if (imageType) {
                      item.getType(imageType).then((blob) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const url = ev.target?.result as string;
                          if (url) addImageItem(url, `Reference ${referenceImages.length + 1}`);
                        };
                        reader.readAsDataURL(blob);
                      });
                    }
                  }
                }).catch(() => {
                  // Fallback if clipboard permission prompt is denied
                });
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-800'
                  : 'bg-white/10 hover:bg-white/15 border border-white/10 text-neutral-200'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste (Ctrl+V)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Thumbnail Pin Strip */}
          {referenceImages.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <span>Pinned Images</span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Tap to select</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {referenceImages.map((img) => {
                  const isSelected = activeImageId === img.id;
                  return (
                    <div
                      key={img.id}
                      onClick={() => setActiveImageId(img.id)}
                      className={`relative shrink-0 w-16 h-14 rounded-xl overflow-hidden border cursor-pointer group transition-all ${
                        isSelected
                          ? isLight
                            ? 'ring-2 ring-neutral-900 border-transparent shadow-xs'
                            : 'ring-2 ring-white border-transparent shadow-xs'
                          : isLight
                          ? 'border-neutral-200 opacity-70 hover:opacity-100'
                          : 'border-neutral-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={(e) => handleDeleteItem(img.id, e)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-neutral-900/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Selected Reference Controls & Live Preview Overlay */}
          {activeItem ? (
            <div
              className={`space-y-3 pt-3 border-t ${
                isLight ? 'border-neutral-200' : 'border-neutral-800'
              }`}
            >
              {/* Framed Image Preview Box */}
              <div
                className={`relative w-full h-44 rounded-xl overflow-hidden border flex items-center justify-center p-2 ${
                  isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                <img
                  src={activeItem.url}
                  alt={activeItem.name}
                  style={{
                    opacity: activeItem.opacity,
                    transform: `scale(${activeItem.scale}) rotate(${activeItem.rotation}deg)`,
                    filter: `${activeItem.grayscale ? 'grayscale(100%)' : ''} ${
                      activeItem.invert ? 'invert(100%)' : ''
                    }`,
                  }}
                  className="max-w-full max-h-full object-contain transition-transform duration-100 pointer-events-none select-none"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-neutral-900/85 text-[10px] font-mono text-white border border-white/15 shadow-sm">
                  {Math.round(activeItem.opacity * 100)}% opacity • {activeItem.rotation}° • {activeItem.scale.toFixed(1)}x
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                    <Sun className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>Overlay Opacity</span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-white">
                    {Math.round(activeItem.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={activeItem.opacity}
                  onChange={(e) =>
                    updateActiveItem({ opacity: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 rounded-lg accent-neutral-900 dark:accent-white cursor-pointer"
                />
              </div>

              {/* Zoom & Rotation Controls */}
              <div className="space-y-2.5">
                {/* Zoom Scale */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Scale</span>
                    <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-white">
                      {activeItem.scale.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Zoom out"
                      onClick={() =>
                        updateActiveItem({ scale: Math.max(0.2, +(activeItem.scale - 0.1).toFixed(1)) })
                      }
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-neutral-50 hover:bg-neutral-200 border-neutral-200 text-neutral-800'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
                      }`}
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={activeItem.scale}
                      onChange={(e) =>
                        updateActiveItem({ scale: parseFloat(e.target.value) })
                      }
                      className="w-full h-1.5 rounded-lg accent-neutral-900 dark:accent-white cursor-pointer"
                    />
                    <button
                      type="button"
                      aria-label="Zoom in"
                      onClick={() =>
                        updateActiveItem({ scale: Math.min(3.0, +(activeItem.scale + 0.1).toFixed(1)) })
                      }
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-neutral-50 hover:bg-neutral-200 border-neutral-200 text-neutral-800'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
                      }`}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Rotation</span>
                    <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-white">
                      {activeItem.rotation}°
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveItem({ rotation: (activeItem.rotation + 90) % 360 })
                      }
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-neutral-50 hover:bg-neutral-200 border-neutral-200 text-neutral-800'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
                      }`}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>+90° Turn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateActiveItem({ rotation: 0, scale: 1.0 })}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-neutral-50 hover:bg-neutral-200 border-neutral-200 text-neutral-700'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Toggles: Grayscale, Invert, Pin */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    updateActiveItem({ grayscale: !activeItem.grayscale })
                  }
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    activeItem.grayscale
                      ? isLight
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-950 border-white'
                      : isLight
                      ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      : 'bg-neutral-900/60 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <Contrast className="w-3.5 h-3.5" />
                  <span>Grayscale</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateActiveItem({ invert: !activeItem.invert })}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    activeItem.invert
                      ? isLight
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-950 border-white'
                      : isLight
                      ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      : 'bg-neutral-900/60 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <Contrast className="w-3.5 h-3.5 rotate-180" />
                  <span>Invert</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateActiveItem({ pinned: !activeItem.pinned })}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    activeItem.pinned
                      ? isLight
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-950 border-white'
                      : isLight
                      ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      : 'bg-neutral-900/60 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                  }`}
                >
                  {activeItem.pinned ? (
                    <Pin className="w-3.5 h-3.5" />
                  ) : (
                    <PinOff className="w-3.5 h-3.5" />
                  )}
                  <span>{activeItem.pinned ? 'Pinned' : 'Float'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`text-center py-8 px-4 border border-dashed rounded-xl space-y-2 ${
                isLight ? 'border-neutral-300' : 'border-neutral-800'
              }`}
            >
              <Image className="w-8 h-8 mx-auto text-neutral-400 dark:text-neutral-500" />
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                No Reference Images
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
                Upload an image or press Ctrl+V to paste blueprint artwork and moodboards
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
