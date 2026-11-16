/** Shared layout metrics for resizing, persistence and CSS layout. */
export const sidebarMetrics = { default: 220, min: 176, max: 320, collapsed: 64 } as const;
export const sidebarCssVariables = {
  "--sidebar-width-default": `${sidebarMetrics.default}px`,
  "--sidebar-width-min": `${sidebarMetrics.min}px`,
  "--sidebar-width-max": `${sidebarMetrics.max}px`,
  "--sidebar-width-collapsed": `${sidebarMetrics.collapsed}px`,
};
