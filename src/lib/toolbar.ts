export enum ToolbarUiElement {
  DIVIDER,
}

export type ToolbarMenuItem = {
  text: string,
  shortcut?: string,
  action: () => void,
}

export type ToolbarItem = {
  text: string,
  items: (ToolbarMenuItem | ToolbarUiElement)[],
}