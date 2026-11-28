import {customElement, property, query, queryAll, state} from "lit/decorators.js";
import {css, html, nothing, type TemplateResult} from "lit";
import {activeWindowChangeEvent, launchEvent, windowPropertyChangeEvent} from "../../lib/events.ts";
import {type ToolbarMenu, type ToolbarMenuItem, ToolbarUiElement} from "../ui/toolbar.ts";
import {type LinkNode, loadFolderNode} from "../../lib/fs.ts";
import {alertDialog, playSound, SystemSound, warnDialog} from "../../lib/os.ts";
import {Explorer} from "./common/explorer.ts";
import {WindowState, type Dimensions} from "../window.ts";
import {InternetExplorerAbout} from "./dialog/ie-about.ts";

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
    ]
  }
]

@customElement('internet-explorer')
export class InternetExplorer extends Explorer<string | LinkNode> {
  static styles = [
    ...Explorer.styles,
    css`
      .favorite-icon {
        align-items: center;
        cursor: pointer;
        display: flex;
        gap: 3px;
        padding: 2px 2px 2px 16px;

        &:hover {
          color: #316AC5;
          text-decoration: underline;
        }

        &.active {
          background-color: #ece9d8;

          &:hover {
            color: #ffffff;
          }
        }

        & > span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .favorites-folder {
        & > summary.favorite-icon {
          cursor: initial;
          padding: 2px;

          &.active {
            background-color: #316AC5;
            color: #ffffff;
          }
        }

        &[open] {
          border: 1px solid #7F9DB9;
        }

        summary:focus {
          outline: none;
        }
      }

      .favorites-icons {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 2px;
      }

      .loading-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .status-bar-field {
        align-items: center;
        display: flex;
        gap: 1ch;
        overflow: hidden;

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

      iframe {
        border: 1px groove rgb(199, 197, 178);
        color-scheme: light;
        width: 100%;
      }`
  ]

  @query('iframe')
  frame!: HTMLIFrameElement

  @queryAll('.favorite-icon')
  favoriteIcons!: HTMLElement[]

  @queryAll('.favorites-folder')
  favoritesFolders!: HTMLDetailsElement[]

  @property()
  path: string | LinkNode = HOME

  @property({type: String})
  windowIcon = '/img/icons/small/internet-explorer.ico'

  @property({type: String})
  windowTitle = 'Microsoft Internet Explorer'

  @state()
  isFullscreen = false

  @state()
  isLoading = true

  @state()
  showExperimentalWarning = true

  protected toolbarSpec: ToolbarMenu[] = [
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
                this.dispatchEvent(launchEvent(() => {
                  const internetExplorer = new InternetExplorer()

                  internetExplorer.path = this.path
                  internetExplorer.showAddressBar = this.showAddressBar
                  internetExplorer.showStandardButtons = this.showStandardButtons
                  internetExplorer.showStatusBar = this.showStatusBar
                  internetExplorer.pathStack = this.pathStack
                  internetExplorer.pathStack.removeMostRecent()

                  return internetExplorer
                }))
              }
            },
          ],
        },
        ToolbarUiElement.DIVIDER,
        {text: 'Print...', shortcut: 'Ctrl+P', action: () => window.print()},
        ToolbarUiElement.DIVIDER,
        this.toolbarCloseItem,
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
          action: () => navigator.clipboard.writeText(this.frame.contentWindow?.getSelection()?.toString() || ''),
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
            const selection = this.frame.contentWindow?.getSelection()
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
        this.toolbarViewToolbarsItem,
        this.toolbarViewStatusBarItem,
        ToolbarUiElement.DIVIDER,
        this.toolbarViewGoToItems([
          ToolbarUiElement.DIVIDER,
          {
            text: 'Home Page',
            shortcut: 'Alt+Home',
            action: this.goHome,
          }]
        ),
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
          selected: () => this.isFullscreen,
          action: () => {
            this.isFullscreen = !this.isFullscreen

            this.dispatchEvent(windowPropertyChangeEvent({
              state: this.isFullscreen ? WindowState.Fullscreen : WindowState.Default
            }))
          }
        }
      ],
    },
    {
      text: 'Favorites',
      items: this.getFavoritesMenuItems(FAVORITES),
    },
    this.toolbarHelpMenu('Internet Explorer', () => this.spawnDialog(InternetExplorerAbout)),
  ]

  firstUpdated() {
    this.frame.addEventListener('load', () => {
      this.isLoading = false
      this.getFrameDocument()?.addEventListener('click', () => this.dispatchEvent(activeWindowChangeEvent()))
    })

    window.addEventListener('blur', () => {
      if (this.shadowRoot?.activeElement === this.frame) {
        this.toolbar?.closeAll()
      }
    })
  }

  getMinimumDimensions(): Partial<Dimensions> {
    return {width: 400, height: 320}
  }

  protected navigate(newPath: string) {
    if (this.getTruePath(true).replace(/\\?$/, '') === newPath.replace(/\\?$/, '')) {
      return
    }

    playSound(SystemSound.Click).then(async () => {
      let newPathToUse: string | LinkNode | undefined

      if (newPath.startsWith('C:')) {
        const parts = newPath.split('\\')
        parts.pop()
        const path = parts.join('\\')
        const folder = await loadFolderNode(path)

        newPathToUse = folder.links.find(l => l.logicalPath === newPath)

        if (!newPathToUse) {
          alertDialog(this, 'Microsoft Internet Explorer', `Cannot find '${newPath}'. Make sure the path or Internet address is correct.`)
        }
      } else {
        newPathToUse = newPath

        if (!newPathToUse.match(/^https?:\/\//)) {
          newPathToUse = `https://${newPathToUse}`
        }

        if (newPathToUse.startsWith('http') && this.showExperimentalWarning) {
          cookieStore.get(COOKIE_EXPERIMENTAL_WARNING).then(cookie => {
            if (cookie?.value !== 'true') {
              warnDialog(
                this,
                'Microsoft Internet Explorer',
                `Support for external webpages is experimental. The address bar may not
                reflect clicked links and the Back button may not behave as expected. Some external
                webpages additionally may not function correctly.`,
                {silenceId: COOKIE_EXPERIMENTAL_WARNING, buttonPosition: 'right'},
              )

              this.showExperimentalWarning = false
            }
          })
        }

        this.isLoading = true
      }

      this.path = newPathToUse!
      this.pathStack.push(newPathToUse!)
    })
  }

  protected getNavigationButtons() {
    return html`
      <button type="button" class="tool-button" @click="${this.stop}">
        <img src="/img/internet-explorer/stop.png"/>
      </button>
      <button type="button" class="tool-button" @click="${this.refresh}">
        <img src="/img/internet-explorer/refresh.png"/>
      </button>
      <button type="button" class="tool-button" @click="${this.goHome}">
        <img src="/img/internet-explorer/home.png"/>
      </button>
      <div class="divider"></div>
      <button type="button" class="tool-button ${this.showSidebar ? 'active' : ''}"
              @click="${() => this.showSidebar = !this.showSidebar}">
        <img src="/img/internet-explorer/favorites.png"/>
        <span>Favorites</span>
      </button>
      <div class="divider"></div>
      <button type="button" class="tool-button"
              @click="${() => window.print()}">
        <img src="/img/internet-explorer/print.png"/>
      </button>`
  }

  protected getAddressBar() {
    return html`
      <img src="/img/internet-explorer/default.ico"/>
      <input type="text" .value="${this.getTruePath(true)}" id="pathInput"/>`
  }

  protected getSidebarContent() {
    return html`
      <div class="favorites-icons">
        ${this.buildFavoritesPanel(FAVORITES)}
      </div>`
  }

  protected getMainContent() {
    return html`
      <iframe src="${this.getTruePath(false)}"></iframe>`
  }

  protected getStatusBarFields() {
    return html`
      <p class="status-bar-field">
        <img src="/img/internet-explorer/default.ico"/>
        <span class="loading-text">
              ${this.isLoading ? `Opening page ${this.getTruePath(true)}...` : 'Done.'}
            </span>
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
      </p>`
  }

  private getFrameDocument() {
    return this.frame.contentDocument || this.frame.contentWindow?.document!
  }

  private getTruePath(logical: boolean): string {
    return typeof this.path === 'string' ? this.path : logical ? this.path.logicalPath : this.path.physicalPath
  }

  private buildFavoritesPanel(favorites: (Favorite | FavoriteFolder)[]): TemplateResult[] {
    return favorites.map(f => {
      if ('url' in f) {
        return html`
          <div class="favorite-icon" @click="${(event: Event) => this.selectFavorite(event, f)}">
            <img src="${f.icon || '/img/internet-explorer/default.ico'}"/>
            <span>${f.title}</span>
          </div>`
      } else {
        return html`
          <details class="favorites-folder">
            <summary class="favorite-icon" @click="${this.expandFavoritesFolder}">
              <img src="/img/explorer/folder-closed.png"/>
              <span>${f.title}</span>
            </summary>
            ${this.buildFavoritesPanel(f.favorites)}
          </details>`
      }
    })
  }

  private stop() {
    this.frame.contentWindow?.stop()
  }

  private refresh() {
    if (this.frame) {
      /*
       * This weird line takes advantage of a quirk in which setting an iframe's src to itself
       * effectively "refreshes" the contents of the iframe
       */
      this.frame.src = this.frame.src
    }
  }

  private goHome() {
    this.navigate(HOME)
  }

  private getFavoritesMenuItems(favorites: (Favorite | FavoriteFolder)[]): (ToolbarMenuItem | ToolbarMenu)[] {
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
          items: this.getFavoritesMenuItems(f.favorites)
        }
      }
    })
  }

  private expandFavoritesFolder(event: Event): void {
    let target = event.target as HTMLElement

    if (!target.classList.contains('favorite-icon')) {
      target = target.parentElement!
    }

    target.classList.add('active')

    const parent = target.parentElement!

    Array.from(this.favoritesFolders)
      .filter(e => e !== parent)
      .forEach(e => e.removeAttribute('open'))

    Array.from(this.favoriteIcons)
      .filter(e => e !== target)
      .forEach(e => e.classList.remove('active'))
  }

  private selectFavorite(event: Event, favorite: Favorite): void {
    let target = event.target as HTMLElement

    if (!target.classList.contains('favorite-icon')) {
      target = target.parentElement!
    }

    target.classList.add('active')

    Array.from(this.favoriteIcons)
      .filter(e => e !== target)
      .forEach(e => e.classList.remove('active'))

    this.navigate(favorite.url)
  }
}