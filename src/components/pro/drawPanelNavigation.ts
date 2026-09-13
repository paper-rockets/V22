export type DrawPanelSection = 'style' | 'brushes' | 'size';

export const DRAW_PANEL_SECTION_EVENT = 'remix3d:draw-panel-section';

let pendingSection: DrawPanelSection | null = null;

export const requestDrawPanelSection = (section: DrawPanelSection) => {
  pendingSection = section;
  window.dispatchEvent(new CustomEvent<DrawPanelSection>(DRAW_PANEL_SECTION_EVENT, { detail: section }));
};

export const consumeDrawPanelSection = (): DrawPanelSection | null => {
  const section = pendingSection;
  pendingSection = null;
  return section;
};
