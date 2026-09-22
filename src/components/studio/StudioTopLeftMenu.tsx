import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getMenuSurfaceClasses } from '../ui/MenuPrimitives';
import {
  FolderOpen,
  Download,
  Trash2,
  Settings,
  Save,
  X,
  ChevronRight,
} from 'lucide-react';

interface StudioTopLeftMenuProps {
  open: boolean;
  theme: 'light' | 'dark';
  onClose: () => void;
  projectName: string;
  onOpenSessions?: () => void;
  onSaveProject?: () => void;
  onOpenExport?: () => void;
  onClearCanvas?: () => void;
  onOpenSettings?: () => void;
}

const ActionRow: React.FC<{
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  onClick: () => void;
  isLight: boolean;
  chevron?: boolean;
  destructive?: boolean;
}> = ({ icon: Icon, label, hint, onClick, isLight, chevron = false, destructive = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-left transition-colors cursor-pointer min-h-[38px] ${
      destructive
        ? isLight
          ? 'hover:bg-red-50 text-red-700 active:bg-red-100'
          : 'hover:bg-red-950/30 text-red-400 active:bg-red-950/50'
        : isLight
          ? 'hover:bg-neutral-100 text-neutral-900 active:bg-neutral-200'
          : 'hover:bg-white/[0.08] text-white active:bg-white/[0.12]'
    }`}
  >
    <Icon className={`w-3.5 h-3.5 shrink-0 ${destructive ? 'text-red-500' : 'opacity-80'}`} strokeWidth={1.75} />
    <div className="flex-1 min-w-0">
      <div className="text-[12px] font-medium leading-tight">{label}</div>
      {hint && (
        <div className={`text-[10px] leading-tight mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
          {hint}
        </div>
      )}
    </div>
    {chevron && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-45" />}
  </button>
);

export const StudioTopLeftMenu: React.FC<StudioTopLeftMenuProps> = ({
  open,
  theme,
  onClose,
  projectName,
  onOpenSessions,
  onSaveProject,
  onOpenExport,
  onClearCanvas,
  onOpenSettings,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
      ) as HTMLElement[];
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const closeWhenFocusLeaves = (event: PointerEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) onClose();
    };
    window.addEventListener('pointerdown', closeWhenFocusLeaves);
    return () => window.removeEventListener('pointerdown', closeWhenFocusLeaves);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div
        id="studio-top-left-menu"
        data-theme={theme}
        ref={dialogRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="studio-left-menu-title"
        className={`pointer-events-auto absolute left-3 top-2 sm:top-[calc(env(safe-area-inset-top)+3.25rem)] w-[min(250px,calc(100vw-1.5rem))] flex flex-col rounded-2xl p-2.5 shadow-2xl ${
          getMenuSurfaceClasses(isLight)
        }`}
      >
        {/* Header */}
        <div className="shrink-0 mb-0.5 flex min-h-8 items-center justify-between border-b border-black/5 dark:border-white/5 pb-1">
          <div className="min-w-0 pr-2">
            <h2 id="studio-left-menu-title" className="text-xs font-semibold tracking-tight truncate">
              Project
            </h2>
            <span className={`block text-[10px] truncate ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {projectName || 'Project & Files'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`grid h-7 w-7 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer ${
              isLight ? 'hover:bg-neutral-100 text-neutral-600' : 'hover:bg-white/10 text-neutral-300'
            }`}
            aria-label="Close menu"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Action rows */}
        <div className="flex flex-col gap-0.5">
          {onOpenSessions && (
            <ActionRow
              icon={FolderOpen}
              label="Projects"
              hint="Save, open, and manage projects"
              onClick={() => {
                onClose();
                onOpenSessions();
              }}
              isLight={isLight}
              chevron
            />
          )}

          {onSaveProject && (
            <ActionRow
              icon={Save}
              label="Save Project"
              hint="Quick save changes to storage"
              onClick={() => {
                onClose();
                onSaveProject();
              }}
              isLight={isLight}
            />
          )}

          {onOpenExport && (
            <ActionRow
              icon={Download}
              label="Export Artwork"
              hint="Save as image (PNG) or 3D file (GLB)"
              onClick={() => {
                onClose();
                onOpenExport();
              }}
              isLight={isLight}
              chevron
            />
          )}

          {onClearCanvas && (
            <ActionRow
              icon={Trash2}
              label="Clear Canvas"
              hint="Remove strokes, keep canvas & layers"
              onClick={() => {
                onClose();
                onClearCanvas();
              }}
              isLight={isLight}
              destructive
            />
          )}

          {onOpenSettings && (
            <ActionRow
              icon={Settings}
              label="Preferences"
              hint="Studio theme, UI scale, stylus & input"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              isLight={isLight}
              chevron
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
