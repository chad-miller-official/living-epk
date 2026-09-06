export enum ToolbarUiElement {
  DIVIDER,
}

export type ToolbarMenuItem = {
  text: string,
  shortcut?: string,
  selected?: () => boolean,
  action?: (event: Event) => void,
}

export type ToolbarMenu = {
  text: string,
  items: (ToolbarMenuItem | ToolbarUiElement)[],
}