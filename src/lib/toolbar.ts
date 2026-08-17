export enum ToolbarUiElement {
  DIVIDER,
}

export type ToolbarMenuItem = {
  text: string,
  shortcut?: string,
  action: () => void,
}

export type ToolbarMenu = {
  text: string,
  items: (ToolbarMenuItem | ToolbarUiElement)[],
}