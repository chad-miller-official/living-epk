import {customElement, property, query, state} from "lit/decorators.js";
import {css, html} from "lit";
import {closeWindowEvent, launchEvent} from "../../lib/events.ts";
import {type ToolbarMenu, ToolbarUiElement} from "../ui/toolbar.ts";
import {EpkApp} from "../app.ts";
import {type LinkNode, loadFolderNode} from "../../lib/fs.ts";
import {alertDialog} from "../../lib/os.ts";
import {buttonStyle2} from "../../lib/ui.ts";

const HOME = 'https://web.archive.org/web/20080422002359/http://www.msn.com/'

@customElement('internet-explorer')
export class InternetExplorer extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    buttonStyle2,
    css`
      #closeButton {
        height: 18px;
        width: 18px;
      }

      #goButton {
        padding: 0 8px 0 4px;
      }

      #pathInput {
        flex-grow: 1;
      }

      .address {
        opacity: 0.5;
        padding: 0 4px;
      }

      .explorer {
        background-color: #ffffff;
        display: flex;
        height: 100%;
      }

      .navigation {
        align-items: center;
        background-color: #eceadb;
        border-bottom: 1px groove #c7c5b2;
        display: flex;
        width: 100%;

        button {
          padding: 9px 7px;
          margin: 1px;
        }
      }

      .hidden {
        display: none;
      }

      .viewport {
        -webkit-font-smoothing: none;
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        font-size: 11px;
        height: 100%;
        user-select: none;
      }

      iframe {
        border: 1px groove rgb(199, 197, 178);
        color-scheme: light;
        width: 100%;
      }
    `
  ]

  @query('#pathInput')
  pathInput!: HTMLInputElement

  @query('iframe')
  frame?: HTMLIFrameElement

  @property()
  url: string | LinkNode = HOME

  @property({type: String})
  windowTitle = 'Microsoft Internet Explorer'

  @property({type: String})
  windowIcon = '/img/internet-explorer.ico'

  @state()
  showStandardButtons = true

  @state()
  showAddressBar = true

  @state()
  showLinks = true

  @state()
  showStatusBar = true

  @state()
  showFavorites = false

  pathStack: (string | LinkNode)[] = []
  pathStackIdx = 0

  private toolbarSpec: ToolbarMenu[] = [
    {
      text: 'File',
      items: [
        {
          text: 'New',
          items: [
            {
              text: 'Window',
              shortcut: 'Ctrl+N',
              action: () => {
                const internetExplorer = new InternetExplorer()

                internetExplorer.url = this.url
                internetExplorer.showAddressBar = this.showAddressBar
                internetExplorer.showLinks = this.showLinks
                internetExplorer.showStandardButtons = this.showStandardButtons
                internetExplorer.showStatusBar = this.showStatusBar
                internetExplorer.pathStack = this.pathStack
                internetExplorer.pathStack.pop()
                internetExplorer.pathStackIdx = this.pathStackIdx

                this.dispatchEvent(launchEvent(() => new Promise<InternetExplorer>(resolve => resolve(internetExplorer))))
              }
            },
          ],
        },
        ToolbarUiElement.DIVIDER,
        {text: 'Print...', shortcut: 'Ctrl+P', action: () => window.print()},
        ToolbarUiElement.DIVIDER,
        {text: 'Close', action: () => this.dispatchEvent(closeWindowEvent())},
      ],
    },
    {
      text: 'Edit',
      items: [
        {
          text: 'Cut', shortcut: 'Ctrl+X', action: () => {
            navigator.clipboard.writeText(window.getSelection()?.toString() || '')

            this.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Backspace',
              code: 'Backspace',
              keyCode: 8,
              which: 8,
              bubbles: true,
              cancelable: true,
            }))
          },
        },
        {
          text: 'Copy',
          shortcut: 'Ctrl+C',
          action: () => navigator.clipboard.writeText(this.frame?.contentWindow?.getSelection()?.toString() || ''),
        },
        {
          text: 'Paste',
          shortcut: 'Ctrl+V',
          action: () => navigator.clipboard.readText().then(text => this.getFrameDocument().execCommand('insertText', false, text)),
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Select All',
          shortcut: 'Ctrl+A',
          action: () => {
            const selection = this.frame?.contentWindow?.getSelection()
            const range = this.getFrameDocument().createRange()

            selection?.removeAllRanges()

            range.selectNodeContents(this.getFrameDocument().body)
            selection?.addRange(range)
          }
        }
      ]
    },
    {
      text: 'View',
      items: [
        {
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
            {
              text: 'Links',
              selected: () => this.showLinks,
              action: () => this.showLinks = !this.showLinks,
            }
          ],
        },
        {
          text: 'Status Bar',
          selected: () => this.showStatusBar,
          action: () => this.showStatusBar = !this.showStatusBar,
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Go To',
          items: [
            {
              text: 'Back',
              disabled: () => !this.canGoBack(),
              action: () => this.goBack(),
              shortcut: 'Alt+Left Arrow',
            },
            {
              text: 'Forward',
              disabled: () => !this.canGoForward(),
              action: () => this.goForward(),
              shortcut: 'Alt+Right Arrow',
            },
            ToolbarUiElement.DIVIDER,
            {
              text: 'Home Page',
              shortcut: 'Alt+Home',
              action: () => this.goHome(),
            }
          ]
        },
        {
          text: 'Stop',
          shortcut: 'Esc',
          action: this.stop,
        },
        {
          text: 'Refresh',
          action: this.refresh,
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Full Screen',
          shortcut: 'F11',
          action: () => {
            // TODO XXX FIXME
          }
        }
      ],
    },
    {
      text: 'Favorites',
      items: [
        // TODO XXX FIXME
      ],
    },
    {
      text: 'Help',
      items: [
        {
          text: 'About Internet Explorer',
          action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            /*
            TODO FIXME XXX
            const about = new AppAbout()

            this.dispatchEvent(launchEvent(() => new Promise<AppAbout>(resolve => resolve(about)), {
              width: 419,
              height: 350,
              disallowFlags: DisallowFlags.DisallowAll,
            }))
             */
          },
        },
      ],
    }
  ]

  connectedCallback() {
    super.connectedCallback()
    this.pathStack.push(this.url)
  }

  firstUpdated() {
    window.addEventListener('blur', () => {
      if (this.shadowRoot?.activeElement === this.frame) {
        this.toolbar?.closeAll()
      }
    })
  }

  stop() {
    this.frame?.contentWindow?.stop()
  }

  refresh() {
    if (this.frame) {
      this.frame.src = this.frame.src
    }
  }

  goHome() {
    this.playClick().then(() => this.navigate(HOME))
  }

  getFrameDocument() {
    return this.frame?.contentDocument || this.frame?.contentWindow?.document!
  }

  playClick() {
    return new Audio('/audio/click.wav').play()
  }

  navigate(newUrl: string) {
    this.playClick().then(async () => {
      let newUrlToUse: string | LinkNode | undefined

      if (newUrl.startsWith('C:')) {
        const parts = newUrl.split('\\')
        parts.pop()
        const path = parts.join('\\')
        const folder = await loadFolderNode(path)

        newUrlToUse = folder.fileLinks.find(l => l.logicalPath === newUrl)

        if (!newUrlToUse) {
          alertDialog(this, 'Microsoft Internet Explorer', `Cannot find '${newUrl}'. Make sure the path or Internet address is correct.`)
        }
      } else {
        newUrlToUse = newUrl

        if (!newUrlToUse.match(/^https?:\/\//)) {
          newUrlToUse = `https://${newUrlToUse}`
        }
      }

      this.url = newUrlToUse!
      this.pathStackIdx++
      this.pathStack.length = this.pathStackIdx
      this.pathStack.push(newUrlToUse!)
    })
  }

  canGoBack() {
    return this.pathStackIdx !== 0
  }

  canGoForward() {
    return this.pathStackIdx !== this.pathStack.length - 1
  }

  goBack() {
    if (this.pathStackIdx > 0) {
      this.playClick().then(() => {
        this.pathStackIdx--
        this.url = this.pathStack[this.pathStackIdx]
      })
    }
  }

  goForward() {
    if (this.pathStackIdx < this.pathStack.length - 1) {
      this.playClick().then(() => {
        this.pathStackIdx++
        this.url = this.pathStack[this.pathStackIdx]
      })
    }
  }

  handlePathInputSubmit(event: SubmitEvent) {
    event.preventDefault()
    this.navigate(this.pathInput.value)
  }

  handleLoad() {
    // TODO FIXME XXX
  }

  getTrueUrl(logical: boolean) {
    return typeof this.url === 'string' ? this.url : logical ? this.url.logicalPath : this.url.physicalPath
  }

  render() {
    return html`
      <div class="app" @click="${this.handleClick}">
        <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"
                     logo="/img/internet-explorer/logo.png"></epk-toolbar>
        <section class="content">
          <div class="viewport">
            <div class="navigation ${this.showStandardButtons ? '' : 'hidden'}">
              <button type="button" id="backButton" class="style-2"
                      ?disabled="${!this.canGoBack()}" @click="${this.goBack}">
                <img src="/img/file-explorer/back.png"/>
                <span>Back</span>
              </button>
              <button type="button" id="forwardButton" class="style-2"
                      ?disabled="${!this.canGoForward()}" @click="${this.goForward}">
                <img src="/img/file-explorer/forward.png"/>
              </button>
              <button type="button" class="style-2" @click="${this.stop}">
                <img src="/img/internet-explorer/stop.png"/>
              </button>
              <button type="button" class="style-2" @click="${this.refresh}">
                <img src="/img/internet-explorer/refresh.png"/>
              </button>
              <button type="button" class="style-2" @click="${this.goHome}">
                <img src="/img/internet-explorer/home.png"/>
              </button>
              <div class="divider"></div>
              <button type="button" class="style-2 ${this.showFavorites ? 'active' : ''}"
                      @click="${() => this.showFavorites = !this.showFavorites}">
                <img src="/img/internet-explorer/favorites.png"/>
                <span>Favorites</span>
              </button>
              <div class="divider"></div>
              <button type="button" class="style-2"
                      @click="${() => window.print()}">
                <img src="/img/internet-explorer/print.png"/>
              </button>
            </div>
            <form class="navigation ${this.showAddressBar ? '' : 'hidden'}"
                  @submit="${this.handlePathInputSubmit}">
              <span class="address">Address</span>
              <input type="text" .value="${this.getTrueUrl(true)}" id="pathInput"/>
              <button type="submit" id="goButton" class="style-2">
                <img src="/img/file-explorer/go.png"/>
                <span>Go</span>
              </button>
              <!-- TODO XXX FIXME ADD LINKS -->
            </form>
            <div class="explorer">
              <iframe src="${this.getTrueUrl(false)}" @load="${this.handleLoad}"></iframe>
            </div>
          </div>
        </section>
        <div class="status-bar ${this.showStatusBar ? '' : 'hidden'}">
          <p class="status-bar-field">
            Done.
          </p>
          <p class="status-bar-field"></p>
          <p class="status-bar-field"></p>
          <p class="status-bar-field"></p>
          <p class="status-bar-field"></p>
          <p class="status-bar-field"></p>
          <p class="status-bar-field">Internet</p>
        </div>
      </div>`
  }
}