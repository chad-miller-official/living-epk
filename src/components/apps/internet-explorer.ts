import {customElement, property, query, state} from "lit/decorators.js";
import {css, html, nothing} from "lit";
import {closeWindowEvent, launchEvent} from "../../lib/events.ts";
import {type ToolbarMenu, type ToolbarMenuItem, ToolbarUiElement} from "../ui/toolbar.ts";
import {EpkApp} from "../app.ts";
import {type LinkNode, loadFolderNode} from "../../lib/fs.ts";
import {alertDialog, warnDialog} from "../../lib/os.ts";
import {buttonStyle2} from "../../lib/ui.ts";
import {styleMap} from "lit/directives/style-map.js";

const COOKIE_EXPERIMENTAL_WARNING = 'quietIeExperimentalWarning'

const HOME = 'https://web.archive.org/web/20080422002359/http://www.msn.com/'

type Favorite = {
  url: string,
  title: string,
  icon?: string,
}

type FavoriteFolder = {
  title: string,
  favorites: Favorite[],
}

const FAVORITES: (FavoriteFolder | Favorite)[] = [
  {
    title: "My Friends' Websites",
    favorites: [
      {
        url: 'https://www.handsomekrish.live/',
        title: 'DJ Handsome Krish',
      },
      {
        url: 'https://jackmcintoshthomson.com/',
        title: 'Jack McIntosh Thomson',
      },
      {
        url: 'https://matthewritch.com/',
        title: 'Matthew Ritch',
      },
    ],
  },
  {
    title: 'Websites I Like',
    favorites: [
      {
        url: 'https://toshihak.lolipop.jp/index.html',
        title: "Someone in Japan's website that's been online since 1997",
      },
      {
        url: 'https://speech.seedy.cc/',
        title: 'Speech synthesizer',
      },
      {
        url: 'https://compend.org/',
        title: 'Rate everything',
      },
    ]
  }
]

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

      #favorites {
        flex-shrink: 0;
        min-width: 12ch;
        overflow: auto;
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

      .favorites-header {
        align-items: center;
        background: linear-gradient(to right, #f3f4f7, #eee9d5);
        display: flex;
        justify-content: space-between;
        padding: 3px 7px;
      }

      .hidden {
        display: none;
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

      .status-bar-field {
        align-items: center;
        display: flex;
        gap: 1ch;

        &.blank {
          max-width: 18px;
        }

        &.internet {
          max-width: 150px;
        }

        &.loading-bar {
          max-width: fit-content;
        }
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

  static favoritesWidth = 160

  @query('#favorites')
  favorites!: HTMLDivElement

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
  isLoading = true

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

  buildFavoritesMenuItems(favorites: (Favorite | FavoriteFolder)[]): (ToolbarMenuItem | ToolbarMenu)[] {
    return favorites.map(f => {
      if ('url' in f) {
        return {
          text: f.title,
          icon: f.icon || '/img/internet-explorer/default.ico',
          action: () => this.navigate(f.url),
        }
      } else {
        return {
          text: f.title,
          items: this.buildFavoritesMenuItems(f.favorites)
        }
      }
    })
  }

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
      items: this.buildFavoritesMenuItems(FAVORITES),
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
    this.frame?.addEventListener('load', () => {
      this.isLoading = false
    })

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
    this.navigate(HOME)
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

        if (newUrlToUse.startsWith('http')) {
          cookieStore.get(COOKIE_EXPERIMENTAL_WARNING).then(cookie => {
            if (cookie?.value !== 'true') {
              warnDialog(
                this,
                'Microsoft Internet Explorer',
                'Support for external webpages is experimental. Some external webpages may not function correctly.',
                {silenceId: COOKIE_EXPERIMENTAL_WARNING, buttonPosition: 'right'},
              )
            }
          })
        }

        this.isLoading = true
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

  getTrueUrl(logical: boolean) {
    return typeof this.url === 'string' ? this.url : logical ? this.url.logicalPath : this.url.physicalPath
  }

  private connectDividerDragListeners(handleMouseMove: (mouseMoveEvent: MouseEvent) => void) {
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  handlePrimaryDividerDrag(mouseDownEvent: MouseEvent) {
    const startX = mouseDownEvent.clientX
    const startWidth = this.favorites.offsetWidth

    this.connectDividerDragListeners((mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX
      InternetExplorer.favoritesWidth = startWidth + deltaX
      this.requestUpdate()
    })
  }

  render() {
    const favoritesStyle: any = {width: `${InternetExplorer.favoritesWidth}px`}
    const primaryDividerStyle: any = {}

    if (!this.showFavorites) {
      favoritesStyle.display = 'none'
      primaryDividerStyle.display = 'none'
    }

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
              <div class="address-bar">
                <img src="/img/internet-explorer/default.ico"/>
                <input type="text" .value="${this.getTrueUrl(true)}" id="pathInput"/>
              </div>
              <button type="submit" id="goButton" class="style-2">
                <img src="/img/file-explorer/go.png"/>
                <span>Go</span>
              </button>
              <!-- TODO XXX FIXME ADD LINKS -->
            </form>
            <div class="explorer">
              <div id="favorites" style="${styleMap(favoritesStyle)}">
                <div class="favorites-header">
                  Favorites
                  <button type="button" id="closeButton" class="style-2"
                          @click="${() => this.showFavorites = false}">
                    <img src="/img/file-explorer/x.png"/>
                  </button>
                </div>
                <div class="favorites-icons">

                </div>
              </div>
              <div class="explorer-divider" style="${styleMap(primaryDividerStyle)}"
                   @mousedown="${this.handlePrimaryDividerDrag}"></div>
              <iframe src="${this.getTrueUrl(false)}"></iframe>
            </div>
          </div>
        </section>
        <div class="status-bar ${this.showStatusBar ? '' : 'hidden'}">
          <p class="status-bar-field">
            <img src="/img/internet-explorer/default.ico"/>
            <span>${this.isLoading ? `Opening page ${this.getTrueUrl(true)}...` : 'Done.'}</span>
          </p>
          ${this.isLoading ? html`
            <p class="status-bar-field loading-bar">
              <progress max="100" value="${Math.floor(Math.random() * 100)}"></progress>
            </p>
          ` : nothing}
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field internet">
            <img src="/img/internet-explorer/internet.ico"/>
            <span>Internet</span>
          </p>
        </div>
      </div>`
  }
}