import {css, html, type TemplateResult} from "lit";
import {EpkApp} from "../../app.ts";
import {type ToolbarMenu, type ToolbarMenuItem, ToolbarUiElement} from "../../ui/toolbar.ts";
import {styleMap} from "lit/directives/style-map.js";
import {property, query, state} from "lit/decorators.js";
import {PathStack} from "../../../lib/path-stack.ts";
import {EXTENDED_UI_STYLE} from "../../ui/styles.ts";
import {closeWindowEvent, launchEvent} from "../../../lib/events.ts";
import {WindowRestriction} from "../../window.ts";
import {playSound, SystemSound} from "../../../lib/os.ts";

export abstract class Explorer<T> extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    EXTENDED_UI_STYLE,
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
        display: flex;
        flex-direction: column;
        min-width: 12ch;
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

      .content {
        -webkit-font-smoothing: none;
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        font-size: 11px;
        height: 100%;
        user-select: none;
      }

      .explorer {
        background-color: #ffffff;
        display: flex;
        height: 100%;
        overflow: hidden;
      }

      .explorer-divider {
        background-color: #eee9d5;
        cursor: col-resize;
        width: 5px;
      }

      .hidden {
        // No way around this !important due to non-deterministic ordering of css() styles
        display: none !important;
      }

      .navigation {
        align-items: center;
        background-color: #eceadb;
        border-bottom: 1px groove #c7c5b2;
        display: flex;
        gap: 1px;
        margin: 1px 0;

        button {
          padding: 9px 7px;
        }
      }

      .sidebar-header {
        align-items: center;
        background: linear-gradient(to right, #f3f4f7, #eee9d5);
        display: flex;
        justify-content: space-between;
        padding: 3px 7px;
      }`
  ]

  private static sidebarWidth = 160

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

  protected pathStack = new PathStack<T>()

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

  protected toolbarHelpMenu<T extends EpkApp>(aboutName: string, aboutApp: () => T) {
    return {
      text: 'Help',
      items: [
        {
          text: `About ${aboutName}`,
          action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            this.dispatchEvent(launchEvent(aboutApp, {
              size: {
                width: 419,
                height: 350,
              },
              disallowFlags: WindowRestriction.DisallowAll,
            }))
          },
        },
      ],
    }
  }

  protected abstract toolbarSpec: ToolbarMenu[]

  protected abstract navigate(to: string): void

  protected abstract getNavigationButtons(): TemplateResult

  protected abstract getAddressBar(): TemplateResult

  protected abstract getSidebarContent(): TemplateResult

  protected abstract getMainContent(): TemplateResult

  protected abstract getStatusBarFields(): TemplateResult

  connectedCallback() {
    super.connectedCallback()
    this.pathStack.push(this.path, true)
  }

  getPositionTrackingName() {
    return 'explorer'
  }

  protected goBack() {
    if (this.pathStack.canGoBack()) {
      playSound(SystemSound.Click).then(() => this.path = this.pathStack.goBack())
    }
  }

  protected goForward() {
    if (this.pathStack.canGoForward()) {
      playSound(SystemSound.Click).then(() => this.path = this.pathStack.goForward())
    }
  }

  private handlePathInputSubmit(event: SubmitEvent) {
    event.preventDefault()
    this.navigate(this.pathInput.value)
  }

  protected connectDividerDragListeners(handleMouseMove: (mouseMoveEvent: MouseEvent) => void) {
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  private handlePrimaryDividerDrag(mouseDownEvent: MouseEvent) {
    const startX = mouseDownEvent.clientX
    const startWidth = this.sidebar.offsetWidth

    this.connectDividerDragListeners((mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX
      Explorer.sidebarWidth = startWidth + deltaX
      this.requestUpdate()
    })
  }

  render() {
    const sidebarStyle: any = {}

    if (this.showSidebar) {
      sidebarStyle.width = `${Explorer.sidebarWidth}px`
    }

    return html`
      <div class="app" @click="${this.handleClick}">
        <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"
                     logo="/img/logo.png"></epk-toolbar>
        <div class="content">
          <div class="navigation ${this.showStandardButtons ? '' : 'hidden'}">
            <button type="button" class="tool-button"
                    ?disabled="${!this.pathStack.canGoBack()}" @click="${this.goBack}">
              <img src="/img/explorer/back.png"/>
              <span>Back</span>
            </button>
            <button type="button" class="tool-button"
                    ?disabled="${!this.pathStack.canGoForward()}" @click="${this.goForward}">
              <img src="/img/explorer/forward.png"/>
            </button>
            ${this.getNavigationButtons()}
          </div>
          <form class="navigation ${this.showAddressBar ? '' : 'hidden'}"
                @submit="${this.handlePathInputSubmit}">
            <span class="address">Address</span>
            <div class="address-bar">
              ${this.getAddressBar()}
            </div>
            <button type="submit" id="goButton" class="tool-button">
              <img src="/img/explorer/go.png"/>
              <span>Go</span>
            </button>
          </form>
          <div class="explorer">
            <div id="sidebar" class="${this.showSidebar ? '' : 'hidden'}" style="${styleMap(sidebarStyle)}">
              <div class="sidebar-header">
                Favorites
                <button type="button" id="closeButton" class="tool-button"
                        @click="${() => this.showSidebar = false}">
                  <img src="/img/explorer/x.png"/>
                </button>
              </div>
              ${this.getSidebarContent()}
            </div>
            <div class="explorer-divider ${this.showSidebar ? '' : 'hidden'}"
                 @mousedown="${this.handlePrimaryDividerDrag}"></div>
            ${this.getMainContent()}
          </div>
        </div>
        <div class="status-bar ${this.showStatusBar ? '' : 'hidden'}">
          ${this.getStatusBarFields()}
        </div>
      </div>`
  }
}