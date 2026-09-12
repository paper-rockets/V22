import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  Check,
  Trash2,
  Copy,
  Search,
  RotateCcw,
  Atom,
  Layers,
  ArrowRight,
  Eye,
  X,
  AlertTriangle,
  FileCode,
  Box,
  Sliders,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { ALL_MATERIAL_PRESETS, PRESET_CATEGORIES, createMatCap } from '../presets/materialPresets';

export interface ShaderPresetManagerProps {
  onSwitchToStudio?: () => void;
}

function getPresetSourceFile(id: string): string {
  if (id.startsWith('blobmixer_')) return 'blobmixerShaders.js';
  if (id.startsWith('desktop_')) return 'desktopShaders.js';
  if (id.startsWith('godot_')) return 'godotShaders.js';
  if (id.startsWith('grassworks_')) return 'grassworksShaders.js';
  if (id.startsWith('reze_')) return 'rezeShaders.js';
  if (id.startsWith('wayfinder_')) return 'wayfinderShaders.js';
  return 'materialPresets.js';
}

const DEFAULT_VERTEX_SHADER = `precision mediump float;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_uv;
void main() {
  v_uv = uv;
  v_normal = normalize(normalMatrix * normal);
  v_position = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Interactive 3D Sphere WebGL Viewport
const Shader3DSphereModal: React.FC<{
  preset: any;
  onClose: () => void;
  isChecked: boolean;
  onToggleCheck: (id: string) => void;
}> = ({ preset, onClose, isChecked, onToggleCheck }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 3, 2);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0x38bdf8, 1.0, 10);
    pointLight.position.set(-2, -1, 1);
    scene.add(pointLight);

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    let material: THREE.Material;
    let uniforms: Record<string, { value: any }> | null = null;

    const previewUrl = preset.url || (typeof preset.generate === 'function' ? createMatCap(preset.generate) : undefined);

    if (preset.vertexShader || preset.fragmentShader) {
      uniforms = {
        u_time: { value: 0 },
        time: { value: 0 },
        iTime: { value: 0 },
        uTime: { value: 0 },
        u_resolution: { value: new THREE.Vector2(width, height) },
        resolution: { value: new THREE.Vector2(width, height) },
        iResolution: { value: new THREE.Vector3(width, height, 1) },
        u_mouse: { value: new THREE.Vector2(0, 0) },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
        uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
      };
      material = new THREE.ShaderMaterial({
        vertexShader: preset.vertexShader || DEFAULT_VERTEX_SHADER,
        fragmentShader: preset.fragmentShader,
        uniforms,
        side: THREE.DoubleSide,
        transparent: true,
      });
    } else if (previewUrl) {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(previewUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      material = new THREE.MeshMatcapMaterial({ matcap: texture });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: preset.color || '#38bdf8',
        roughness: preset.roughness ?? 0.4,
        metalness: preset.metalness ?? 0.1,
      });
    }

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      sphere.rotation.y += deltaX * 0.008;
      sphere.rotation.x += deltaY * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let animId: number;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;
      if (uniforms) {
        uniforms.u_time.value = elapsed;
        uniforms.time.value = elapsed;
        uniforms.iTime.value = elapsed;
        uniforms.uTime.value = elapsed;
      }
      if (!isDragging) {
        sphere.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (uniforms) {
        uniforms.u_resolution.value.set(w, h);
        uniforms.resolution.value.set(w, h);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [preset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-[#141720] border border-neutral-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#0f1118]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-sky-400" />
              {preset.name}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
              {preset.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D WebGL Canvas Area */}
        <div className="relative h-72 sm:h-80 w-full bg-radial from-neutral-900 to-[#0c0d12] flex items-center justify-center overflow-hidden">
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          <div className="absolute bottom-3 left-3 text-[11px] text-neutral-400/80 bg-black/50 px-2.5 py-1 rounded-md pointer-events-none backdrop-blur-sm">
            Drag to rotate sphere
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={() => onToggleCheck(preset.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-all ${
                isChecked
                  ? 'bg-rose-600 text-white hover:bg-rose-500 ring-2 ring-rose-400/50'
                  : 'bg-neutral-900/90 text-neutral-300 hover:bg-neutral-800 border border-neutral-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border ${
                  isChecked ? 'border-white bg-white text-rose-600' : 'border-neutral-500'
                }`}
              >
                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span>{isChecked ? 'Marked for Deletion' : 'Check to Delete'}</span>
            </button>
          </div>
        </div>

        {/* Preset Details & Code */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 block font-semibold">Category</span>
              <span className="font-medium text-neutral-200">{preset.category}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 block font-semibold">Type</span>
              <span className="font-medium text-sky-400 capitalize">{preset.type || 'MatCap'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 block font-semibold">Source File</span>
              <span className="font-medium text-emerald-400 font-mono">{getPresetSourceFile(preset.id)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 block font-semibold">Status</span>
              <span className={`font-semibold ${isChecked ? 'text-rose-400' : 'text-neutral-400'}`}>
                {isChecked ? 'Marked to Delete' : 'Not marked'}
              </span>
            </div>
          </div>

          {preset.description && (
            <div className="text-neutral-300 leading-relaxed bg-neutral-900/40 p-3 rounded-xl border border-neutral-800/80">
              <span className="font-semibold text-neutral-400">Description: </span>
              {preset.description}
            </div>
          )}

          {(preset.fragmentShader || preset.vertexShader) && (
            <div>
              <button
                onClick={() => setShowCode((s) => !s)}
                className="flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300 mb-2 transition-colors cursor-pointer"
              >
                <FileCode className="w-4 h-4" />
                <span>{showCode ? 'Hide Shader GLSL Code' : 'View Shader GLSL Code'}</span>
              </button>

              {showCode && (
                <div className="space-y-2">
                  {preset.fragmentShader && (
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 block mb-1">Fragment Shader</span>
                      <pre className="p-3 rounded-lg bg-[#0a0b0f] border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-48">
                        {preset.fragmentShader}
                      </pre>
                    </div>
                  )}
                  {preset.vertexShader && (
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 block mb-1">Vertex Shader</span>
                      <pre className="p-3 rounded-lg bg-[#0a0b0f] border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-48">
                        {preset.vertexShader}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800 bg-[#0f1118]">
          <button
            onClick={() => onToggleCheck(preset.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isChecked
                ? 'bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
          >
            {isChecked ? <X className="w-4 h-4 text-rose-400" /> : <Check className="w-4 h-4 text-rose-400" />}
            <span>{isChecked ? 'Uncheck (Do Not Delete)' : 'Check to Delete'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const ShaderPresetManager: React.FC<ShaderPresetManagerProps> = ({ onSwitchToStudio }) => {
  // Preset list state
  const [presets, setPresets] = useState<any[]>(() => {
    return ALL_MATERIAL_PRESETS.map((p) => {
      const url = p.url || (typeof p.generate === 'function' ? createMatCap(p.generate) : undefined);
      return { ...p, url };
    });
  });

  // Selected preset IDs (checked for deletion)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterView, setFilterView] = useState<'all' | 'checked' | 'unchecked'>('all');
  const [inspectedPreset, setInspectedPreset] = useState<any | null>(null);

  // Deletion in-progress state
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Filtered presets
  const filteredPresets = useMemo(() => {
    return presets.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const isChecked = checkedIds.has(p.id);
      const matchView =
        filterView === 'all' ? true : filterView === 'checked' ? isChecked : !isChecked;
      return matchCat && matchSearch && matchView;
    });
  }, [presets, activeCategory, searchQuery, filterView, checkedIds]);

  // Bulk actions
  const selectAllVisible = () => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      filteredPresets.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const deselectAll = () => {
    setCheckedIds(new Set());
  };

  const invertSelection = () => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      filteredPresets.forEach((p) => {
        if (next.has(p.id)) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  };

  // Copy selected list
  const copySelectedList = () => {
    const selected = presets.filter((p) => checkedIds.has(p.id));
    if (selected.length === 0) {
      showToast('No presets are checked yet. Check some presets first!');
      return;
    }
    const text = selected
      .map(
        (p, idx) =>
          `${idx + 1}. ${p.name} (id: '${p.id}', file: '${getPresetSourceFile(p.id)}', category: '${p.category}')`,
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
    showToast(`Copied list of ${selected.length} checked presets to clipboard!`);
  };

  // Perform permanent deletion from disk
  const executeDeleteSelected = async () => {
    const idsToDelete = Array.from(checkedIds);
    if (idsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/delete-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete presets');
      }

      // Remove from local state
      setPresets((prev) => prev.filter((p) => !checkedIds.has(p.id)));
      setCheckedIds(new Set());
      setShowConfirmModal(false);
      showToast(
        `Successfully deleted ${data.deletedCount ?? idsToDelete.length} presets from project files! (A backup was saved in src/presets/backups/)`,
      );
    } catch (err: any) {
      console.error('Failed to delete presets:', err);
      showToast(`Error deleting presets: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const checkedPresets = useMemo(() => {
    return presets.filter((p) => checkedIds.has(p.id));
  }, [presets, checkedIds]);

  return (
    <div className="w-full h-full min-h-screen bg-[#0a0c12] text-neutral-200 flex flex-col font-sans overflow-hidden">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0f121a]/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Shader Presets Reviewer</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {presets.length} Total
                </span>
                {checkedIds.size > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                    {checkedIds.size} Marked to Delete
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                View all shader presets rendered as in the app. Check items you want to delete.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {checkedIds.size > 0 && (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected ({checkedIds.size})</span>
              </button>
            )}

            <button
              onClick={copySelectedList}
              title="Copy list of checked presets to clipboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              <span>{copiedNotification ? 'Copied!' : 'Copy List'}</span>
            </button>

            {onSwitchToStudio && (
              <button
                onClick={onSwitchToStudio}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-black shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                <span>3D Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filter & Search Strip */}
      <section className="bg-[#121520] border-b border-neutral-800 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search shader presets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown & Filter Status */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="h-9 px-3 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs text-neutral-200 font-medium focus:outline-none focus:border-sky-500"
              aria-label="Filter category"
            >
              <option value="All">All Categories ({presets.length})</option>
              {PRESET_CATEGORIES.filter((c) => c !== 'All').map((cat) => {
                const count = presets.filter((p) => p.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>

            {/* View filter buttons */}
            <div className="flex items-center rounded-xl bg-neutral-900 border border-neutral-700/80 p-0.5 text-xs">
              <button
                onClick={() => setFilterView('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterView === 'all' ? 'bg-neutral-700 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterView('checked')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                  filterView === 'checked' ? 'bg-rose-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>To Delete</span>
                {checkedIds.size > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/50 font-bold text-white">
                    {checkedIds.size}
                  </span>
                )}
              </button>
            </div>

            {/* Quick bulk buttons */}
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={selectAllVisible}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium transition-colors"
                title="Check all currently visible presets"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium transition-colors"
                title="Uncheck all"
              >
                Clear
              </button>
              <button
                onClick={invertSelection}
                className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium transition-colors"
                title="Invert current selection"
              >
                Invert
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Scroll Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {filteredPresets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-400">
            <Search className="w-12 h-12 text-neutral-600 mb-3" />
            <h3 className="text-sm font-semibold text-neutral-300">No shader presets found</h3>
            <p className="text-xs text-neutral-500 mt-1">Try clearing your search query or changing category.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
                setFilterView('all');
              }}
              className="mt-4 px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredPresets.map((preset) => {
              const isChecked = checkedIds.has(preset.id);
              const sourceFile = getPresetSourceFile(preset.id);

              return (
                <div
                  key={preset.id}
                  className={`group relative flex flex-col rounded-2xl border transition-all select-none overflow-hidden ${
                    isChecked
                      ? 'bg-rose-950/20 border-rose-500/70 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/50'
                      : 'bg-[#131622] border-neutral-800/80 hover:border-neutral-700 hover:bg-[#161a28]'
                  }`}
                >
                  {/* Top action row: Checkbox and 3D preview button */}
                  <div className="flex items-center justify-between p-2.5 pb-1">
                    {/* Checkbox: Check to Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCheck(preset.id);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-rose-600 text-white ring-2 ring-rose-400/50 shadow-sm'
                          : 'bg-neutral-900/90 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700'
                      }`}
                      title={isChecked ? 'Checked to delete (click to uncheck)' : 'Check to mark for deletion'}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isChecked ? 'border-white bg-white text-rose-600' : 'border-neutral-500 bg-neutral-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] tracking-wide">Delete</span>
                    </button>

                    {/* Inspect in 3D button */}
                    <button
                      type="button"
                      onClick={() => setInspectedPreset(preset)}
                      className="w-7 h-7 rounded-lg bg-neutral-800/80 hover:bg-sky-500 hover:text-black text-neutral-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Inspect 3D rotating sphere preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail Container (Matching App Look) */}
                  <div
                    onClick={() => toggleCheck(preset.id)}
                    className="flex flex-col items-center justify-center p-3 cursor-pointer"
                  >
                    <div
                      className={`relative h-20 w-20 sm:h-22 sm:w-22 rounded-full border shadow-md overflow-hidden transition-transform group-hover:scale-105 flex items-center justify-center ${
                        isChecked
                          ? 'border-rose-500 ring-2 ring-rose-500/40'
                          : 'border-white/20 bg-neutral-900 shadow-black/40'
                      }`}
                    >
                      {preset.url ? (
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="h-full w-full rounded-full"
                          style={{
                            backgroundColor: preset.color || '#38bdf8',
                            background:
                              preset.category === 'Metals'
                                ? `radial-gradient(circle at 35% 35%, #fff, ${preset.color || '#d1d5db'}, #111)`
                                : preset.color || '#38bdf8',
                          }}
                        />
                      )}

                      {/* Animated Shader overlay badge */}
                      {(preset.vertexShader || preset.fragmentShader) && (
                        <span
                          className="absolute bottom-1 right-1 text-[9px] bg-black/70 backdrop-blur-xs text-sky-300 px-1 py-0.5 rounded font-mono"
                          title="Animated GLSL Shader"
                        >
                          GLSL
                        </span>
                      )}
                    </div>

                    {/* Preset Name */}
                    <span className="mt-2.5 text-xs font-bold text-center text-neutral-100 line-clamp-1 w-full px-1">
                      {preset.name}
                    </span>

                    {/* ID & Category */}
                    <span className="text-[10px] text-neutral-400 line-clamp-1 w-full text-center mt-0.5">
                      {preset.category}
                    </span>

                    <span className="text-[9px] text-emerald-400/90 font-mono mt-0.5 line-clamp-1">
                      {sourceFile}
                    </span>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-auto px-2.5 py-1.5 border-t border-neutral-800/60 bg-black/20 flex items-center justify-between text-[10px] text-neutral-500">
                    <span className="capitalize">{preset.type || 'matcap'}</span>
                    <button
                      onClick={() => setInspectedPreset(preset)}
                      className="text-sky-400 hover:underline hover:text-sky-300"
                    >
                      3D View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Summary Bar when items are checked */}
      {checkedIds.size > 0 && (
        <aside className="sticky bottom-0 z-40 bg-[#161219]/95 backdrop-blur-md border-t border-rose-900/50 px-4 py-3 sm:px-6 shadow-2xl">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-rose-300">
                  {checkedIds.size} shader preset{checkedIds.size === 1 ? '' : 's'} marked for deletion
                </div>
                <div className="text-[11px] text-neutral-400 hidden sm:block">
                  Click delete to permanently remove them from the project files.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete ({checkedIds.size})</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 3D Sphere Interactive Modal */}
      {inspectedPreset && (
        <Shader3DSphereModal
          preset={inspectedPreset}
          isChecked={checkedIds.has(inspectedPreset.id)}
          onToggleCheck={toggleCheck}
          onClose={() => setInspectedPreset(null)}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#151722] border border-rose-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete {checkedIds.size} Shader Presets?</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  This action will remove the selected presets from the source code files in{' '}
                  <code className="text-neutral-300 bg-neutral-900 px-1 py-0.5 rounded">src/presets/</code>. A backup
                  copy of the modified files will be automatically created in{' '}
                  <code className="text-neutral-300 bg-neutral-900 px-1 py-0.5 rounded">src/presets/backups/</code>.
                </p>
              </div>
            </div>

            {/* Preview of items to delete */}
            <div className="max-h-48 overflow-y-auto rounded-xl bg-[#0e1017] border border-neutral-800 p-2.5 space-y-1.5 studio-scroll">
              {checkedPresets.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-neutral-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-neutral-700 bg-neutral-900">
                      {p.url ? (
                        <img src={p.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full" style={{ backgroundColor: p.color || '#38bdf8' }} />
                      )}
                    </span>
                    <span className="font-semibold text-neutral-200">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">{p.id}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteSelected}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm & Delete Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-neutral-900/95 border border-sky-500/40 text-neutral-100 text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
