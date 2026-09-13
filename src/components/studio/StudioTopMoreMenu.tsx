import React, { useEffect, useRef } from 'react';
import {
  Compass,
  FolderOpen,
  Grid,
  Maximize2,
  Minimize2,
  Moon,
  Save,
  Settings,
  X,
  Sun,
} from 'lucide-react';

const CanvasSheetIcon = Grid;

interface StudioTopMoreMenuProps {
  open: boolean;
  theme: 'light' | 'dark';
  isFullscreen: boolean;
  onClose: () => void;
  onQuickSave?: () => void;
  onOpenSessions?: () => void;
  onOpenIllumination?: () => void;
  onToggleModelDisplay?: () => void;
  onOpenShapes: () => void;
  onOpenSettings: () => void;
  onOpenDeform: () => void;
  onToggleFullscreen: () => void;
  isGizmoActive?: boolean;
  onToggleGizmo?: () => void;
  showPlane?: boolean;
  onTogglePlane?: () => void;
  onToggleTheme?: () => void;
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
    className={`min-h-[62px] w-full rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-[0.99] ${
      isLight ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200' : 'bg-white/[0.07] text-white hover:bg-white/[0.12]'
    }`}
  >
    <span className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center" aria-hidden="true">{icon}</span>
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
  onQuickSave,
  onOpenSessions,
  onOpenIllumination,
  onToggleModelDisplay,
  onOpenShapes,
  onOpenSettings,
  onOpenDeform,
  onToggleFullscreen,
  isGizmoActive = true,
  onToggleGizmo,
  showPlane = true,
  onTogglePlane,
  onToggleTheme,
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

  if (!open) return null;

  const select = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 h-full w-full cursor-default bg-black/45"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        id="studio-top-more-menu"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-more-title"
        className={`absolute right-3 top-[calc(env(safe-area-inset-top)+3.25rem)] max-h-[calc(100dvh-4.5rem)] w-[min(360px,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl px-3 pb-3 pt-2 shadow-2xl ${
          isLight ? 'bg-white text-neutral-900' : 'bg-[#15171c] text-white'
        }`}
      >
        <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
          <h2 id="studio-more-title" className="text-base font-semibold">More actions</h2>
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

        <div className="grid grid-cols-1 gap-2" aria-label="Studio actions">
          {onQuickSave && (
            <ActionButton icon={<Save className="h-5 w-5" strokeWidth={1.7} />} label="Save" description="Quick save" onSelect={select(onQuickSave)} isLight={isLight} />
          )}
          {onOpenSessions && (
            <ActionButton icon={<FolderOpen className="h-5 w-5" strokeWidth={1.7} />} label="Projects" description="Save & Backup" onSelect={select(onOpenSessions)} isLight={isLight} />
          )}
          {onOpenIllumination && (
            <ActionButton icon={<Sun className="h-5 w-5 text-amber-400" strokeWidth={1.7} />} label="Scene lights" description="Illuminate the artwork" onSelect={select(onOpenIllumination)} isLight={isLight} />
          )}
          {onTogglePlane && (
            <ActionButton
              icon={<CanvasSheetIcon className="h-5 w-5 text-emerald-400" strokeWidth={1.7} />}
              label={showPlane ? 'Hide Plane' : 'Show Plane'}
              description="Canvas surface"
              onSelect={select(onTogglePlane)}
              isLight={isLight}
            />
          )}
          <ActionButton icon={<Settings className="h-5 w-5" strokeWidth={1.7} />} label="Settings" description="Studio preferences" onSelect={select(onOpenSettings)} isLight={isLight} />
          {onToggleTheme && (
            <ActionButton
              icon={isLight ? <Moon className="h-5 w-5" strokeWidth={1.7} /> : <Sun className="h-5 w-5" strokeWidth={1.7} />}
              label="Appearance"
              description={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              onSelect={select(onToggleTheme)}
              isLight={isLight}
            />
          )}
          {onToggleGizmo && (
            <ActionButton
              icon={<Compass className="h-5 w-5 text-sky-400" strokeWidth={1.7} />}
              label={isGizmoActive ? 'Hide Gizmo' : 'Show Gizmo'}
              description="3D Navigator"
              onSelect={select(onToggleGizmo)}
              isLight={isLight}
            />
          )}
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
