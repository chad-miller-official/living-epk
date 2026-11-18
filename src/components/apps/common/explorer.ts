import {css, html, type TemplateResult} from "lit";
import {EpkApp} from "../../app.ts";
import {type ToolbarMenu, type ToolbarMenuItem, ToolbarUiElement} from "../../ui/toolbar.ts";
import {styleMap} from "lit/directives/style-map.js";
import {property, query, state} from "lit/decorators.js";
import {PathStack} from "../../../lib/path-stack.ts";
import {buttonStyle2} from "../../../lib/ui.ts";
import {closeWindowEvent, DisallowFlags, launchEvent} from "../../../lib/events.ts";
import {playClick} from "../../../lib/os.ts";

export abstract class Explorer<T> extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    buttonStyle2,
    css`
      #closeButton {
        height: 18px;
        width: 18px;
      }

      #goButton {
        padding: 0 16px 0 8px;
      }

      #pathInput {
        flex-grow: 1;
      }

      #sidebar {
        flex-shrink: 0;
        min-width: 12ch;
        overflow: auto;
      }

      .address {
        align-self: center;
        opacity: 0.5;
        padding: 0 4px;
      }

      .address-bar {
        align-items: center;
        background-color: #ffffff;
        border: 1px solid #7f9db9;
        display: flex;
        padding-left: 3px;
        width: 100%;

        & > input {
          border: none;
        }
      }

      .explorer {
        background-color: #ffffff;
        display: flex;
        height: 100%;
      }

      .explorer-divider {
        background-color: #eee9d5;
        cursor: col-resize;
        min-width: 5px;
        max-width: 5px;
        width: 5px;
      }

      .hidden {
        display: none;
      }

      .navigation {
        align-items: stretch;
        background-color: #eceadb;
        border-bottom: 1px groove #c7c5b2;
        display: flex;
        width: 100%;

        button {
          padding: 9px 7px;
          margin: 1px;
        }
      }

      .sidebar-header {
        align-items: center;
        background: linear-gradient(to right, #f3f4f7, #eee9d5);
        display: flex;
        justify-content: space-between;
        padding: 3px 7px;
      }

      .viewport {
        -webkit-font-smoothing: none;
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        font-size: 11px;
        height: 100%;
        user-select: none;
      }`
  ]

  static sidebarWidth = 160

  @property()
  path!: T

  @query('#pathInput')
  pathInput!: HTMLInputElement

  @query('#sidebar')
  sidebar!: HTMLDivElement

  @state()
  showStandardButtons = true

  @state()
  showAddressBar = true

  @state()
  showStatusBar = true

  @state()
  showSidebar = false

  pathStack = new PathStack<T>()

  protected toolbarCloseItem = {
    text: 'Close',
    action: () => this.dispatchEvent(closeWindowEvent())
  }

  protected toolbarViewToolbarsItem = {
    text: 'Toolbars',
    items: [
      {
        text: 'Standard Buttons',
        selected: () => this.showStandardButtons,
        action: () => this.showStandardButtons = !this.showStandardButtons,
      },
      {
        text: 'Address Bar',
        selected: () => this.showAddressBar,
        action: () => this.showAddressBar = !this.showAddressBar,
      },
    ],
  }

  protected toolbarViewStatusBarItem = {
    text: 'Status Bar',
    selected: () => this.showStatusBar,
    action: () => this.showStatusBar = !this.showStatusBar,
  }

  protected toolbarViewGoToItems(additionalItems: (ToolbarMenuItem | ToolbarUiElement | ToolbarMenu)[]) {
    return {
      text: 'Go To',
      items: [
        {
          text: 'Back',
          disabled: () => !this.pathStack.canGoBack(),
          action: () => this.goBack(),
          shortcut: 'Alt+Left Arrow',
        },
        {
          text: 'Forward',
          disabled: () => !this.pathStack.canGoForward(),
          action: () => this.goForward(),
          shortcut: 'Alt+Right Arrow',
        },
        ...additionalItems,
      ]
    }
  }

  protected toolbarHelpMenu<T extends EpkApp>(aboutApp: () => T) {
    return {
      text: 'Help',
      items: [
        {
          text: 'About Internet Explorer',
          action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            this.dispatchEvent(launchEvent(() => new Promise<T>(resolve => resolve(aboutApp())), {
              width: 419,
              height: 350,
              disallowFlags: DisallowFlags.DisallowAll,
            }))
          },
        },
      ],
    }
  }

  abstract toolbarSpec: ToolbarMenu[]

  abstract navigate(to: string): void

  abstract getNavigationButtons(): TemplateResult

  abstract getAddressBar(): TemplateResult

  abstract getSidebarContent(): TemplateResult

  abstract getMainContent(): TemplateResult

  abstract getStatusBarFields(): TemplateResult

  connectedCallback() {
    super.connectedCallback()
    this.pathStack.push(this.path, true)
  }

  goBack() {
    if (this.pathStack.canGoBack()) {
      playClick().then(() => this.path = this.pathStack.goBack())
    }
  }

  goForward() {
    if (this.pathStack.canGoForward()) {
      playClick().then(() => this.path = this.pathStack.goForward())
    }
  }

  handlePathInputSubmit(event: SubmitEvent) {
    event.preventDefault()
    this.navigate(this.pathInput.value)
  }

  connectDividerDragListeners(handleMouseMove: (mouseMoveEvent: MouseEvent) => void) {
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  handlePrimaryDividerDrag(mouseDownEvent: MouseEvent) {
    const startX = mouseDownEvent.clientX
    const startWidth = this.sidebar.offsetWidth

    this.connectDividerDragListeners((mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX
      Explorer.sidebarWidth = startWidth + deltaX
      this.requestUpdate()
    })
  }

  render() {
    const sidebarStyle: any = {width: `${Explorer.sidebarWidth}px`}
    const primaryDividerStyle: any = {}

    if (!this.showSidebar) {
      sidebarStyle.display = 'none'
      primaryDividerStyle.display = 'none'
    }

    return html`
      <div class="app" @click="${this.handleClick}">
        <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"
                     logo="/img/internet-explorer/logo.png"></epk-toolbar>
        <section class="content">
          <div class="viewport">
            <div class="navigation ${this.showStandardButtons ? '' : 'hidden'}">
              <button type="button" class="style-2"
                      ?disabled="${!this.pathStack.canGoBack()}" @click="${this.goBack}">
                <img src="/img/file-explorer/back.png"/>
                <span>Back</span>
              </button>
              <button type="button" class="style-2"
                      ?disabled="${!this.pathStack.canGoForward()}" @click="${this.goForward}">
                <img src="/img/file-explorer/forward.png"/>
              </button>
              ${this.getNavigationButtons()}
            </div>
            <form class="navigation ${this.showAddressBar ? '' : 'hidden'}"
                  @submit="${this.handlePathInputSubmit}">
              <span class="address">Address</span>
              <div class="address-bar">
                ${this.getAddressBar()}
              </div>
              <button type="submit" id="goButton" class="style-2">
                <img src="/img/file-explorer/go.png"/>
                <span>Go</span>
              </button>
            </form>
            <div class="explorer">
              <div id="sidebar" style="${styleMap(sidebarStyle)}">
                <div class="sidebar-header">
                  Favorites
                  <button type="button" id="closeButton" class="style-2"
                          @click="${() => this.showSidebar = false}">
                    <img src="/img/file-explorer/x.png"/>
                  </button>
                </div>
                ${this.getSidebarContent()}
              </div>
              <div class="explorer-divider" style="${styleMap(primaryDividerStyle)}"
                   @mousedown="${this.handlePrimaryDividerDrag}"></div>
              ${this.getMainContent()}
            </div>
        </section>
        <div class="status-bar ${this.showStatusBar ? '' : 'hidden'}">
          ${this.getStatusBarFields()}
        </div>
      </div>
    `
  }
}