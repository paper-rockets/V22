import React, { useEffect, useRef } from 'react';
import { getMenuSurfaceClasses } from '../ui/MenuPrimitives';
import {
  FolderOpen,
  Maximize2,
  Minimize2,
  Settings,
  X,
} from 'lucide-react';

interface StudioTopMoreMenuProps {
  open: boolean;
  theme: 'light' | 'dark';
  isFullscreen: boolean;
  onClose: () => void;
  onOpenSessions?: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onSelect: () => void;
  isLight: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, description, onSelect, isLight }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`min-h-[44px] sm:min-h-[56px] w-full rounded-xl px-3 py-1 sm:py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-[0.99] cursor-pointer ${
      isLight ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200' : 'bg-white/[0.07] text-white hover:bg-white/[0.12]'
    }`}
  >
    <span className="flex items-center gap-3">
      <span className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center" aria-hidden="true">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5">{label}</span>
        <span className={`block text-xs leading-4 ${isLight ? 'text-neutral-600' : 'text-white/60'}`}>
          {description}
        </span>
      </span>
    </span>
  </button>
);

export const StudioTopMoreMenu: React.FC<StudioTopMoreMenuProps> = ({
  open,
  theme,
  isFullscreen,
  onClose,
  onOpenSessions,
  onOpenSettings,
  onToggleFullscreen,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
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

  const select = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div
        id="studio-top-more-menu"
        data-theme={theme}
        ref={dialogRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="studio-more-title"
        className={`pointer-events-auto absolute right-3 top-2 sm:top-[calc(env(safe-area-inset-top)+3.25rem)] w-[min(var(--studio-menu-compact),calc(100vw-1.5rem))] flex flex-col rounded-2xl px-3 pb-3 pt-2 shadow-2xl ${
          getMenuSurfaceClasses(isLight)
        }`}
      >
        <div className="shrink-0 mb-2 sm:mb-3 flex min-h-11 items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-1">
          <h2 id="studio-more-title" className="text-base font-semibold">Workspace</h2>
          <button
            type="button"
            onClick={onClose}
            className={`grid h-11 w-11 place-items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              isLight ? 'hover:bg-neutral-100' : 'hover:bg-white/10'
            }`}
            aria-label="Close more actions"
          >
            <X className="h-5 w-5" strokeWidth={1.6} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5" aria-label="Workspace actions">
          {onOpenSessions && (
            <ActionButton icon={<FolderOpen className="h-5 w-5" strokeWidth={1.7} />} label="Projects" description="Save, open, and manage projects" onSelect={select(onOpenSessions)} isLight={isLight} />
          )}
          <ActionButton icon={<Settings className="h-5 w-5" strokeWidth={1.7} />} label="Studio settings" description="Canvas, appearance, and workspace preferences" onSelect={select(onOpenSettings)} isLight={isLight} />
          <ActionButton
            icon={isFullscreen ? <Minimize2 className="h-5 w-5" strokeWidth={1.7} /> : <Maximize2 className="h-5 w-5" strokeWidth={1.7} />}
            label={isFullscreen ? 'Exit full screen' : 'Full screen'}
            description={isFullscreen ? 'Return to browser' : 'Use the whole screen'}
            onSelect={select(onToggleFullscreen)}
            isLight={isLight}
          />
        </div>
      </div>
    </div>
  );
};
