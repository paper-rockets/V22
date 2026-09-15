import React from 'react';
import { ProRail } from './ProRail';
import { ProPanel, ProPanelProps } from './ProPanel';

export type ProShellProps = ProPanelProps & {
  onOpenIllumination?: () => void;
  isIlluminationOpen?: boolean;
  isModalActive?: boolean;
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
      />
    </>
  );
};
