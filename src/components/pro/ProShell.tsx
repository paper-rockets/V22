import React from 'react';
import { ProRail } from './ProRail';
import { ProPanel, ProPanelProps } from './ProPanel';

export type ProShellProps = ProPanelProps & {
  onOpenIllumination?: () => void;
  isIlluminationOpen?: boolean;
  isModalActive?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  fingerDraw?: boolean;
  onToggleFingerDraw?: (val: boolean) => void;
};

export const ProShell: React.FC<ProShellProps> = (props) => {
  return (
    <>
      <ProPanel {...props} />
      <ProRail
        theme={props.theme}
        tool={props.tool}
        setTool={props.setTool}
        brushSettings={props.brushSettings}
        setBrushSettings={props.setBrushSettings}
        onOpenColorStudio={props.onOpenColorStudio}
        onOpenIllumination={props.onOpenIllumination}
        isIlluminationOpen={props.isIlluminationOpen}
        engine={props.engine}
        onOpenCustomMirror={props.onOpenCustomMirror}
        activeGuide={props.activeGuide}
        targetScope={props.targetScope}
        onSelectTargetScope={props.onSelectTargetScope}
        isModalActive={props.isModalActive}
        onOpenNumpad={props.onOpenNumpad}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
        canUndo={props.canUndo}
        canRedo={props.canRedo}
        fingerDraw={props.fingerDraw}
        onToggleFingerDraw={props.onToggleFingerDraw}
      />
    </>
  );
};
