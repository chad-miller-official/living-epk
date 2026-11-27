import {customElement, property, query, state} from "lit/decorators.js";
import {css, html} from "lit";
import {EpkApp} from "../app.ts";
import {closeWindowEvent, launchEvent, type WindowProperties, windowPropertyChangeEvent} from "../../lib/events.ts";
import {styleMap} from "lit/directives/style-map.js";
import interact from "interactjs";
import type {Interactable} from "@interactjs/types";
import type {ResizeEvent} from "@interactjs/actions/resize/plugin";
import {AppAbout} from "./dialog/about.ts";
import {getFileExtension, getLinkName, type LinkNode} from "../../lib/fs.ts";
import {type ToolbarMenu, ToolbarUiElement} from "../ui/toolbar.ts";
import {FilePicker} from "./dialog/file-picker.ts";
import {WindowRestriction} from "../window.ts";

@customElement('media-player')
export class MediaPlayer extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      #slider {
        background-image: url("/img/media-player/slider.png");
        cursor: default !important;
        height: 24px;
        position: absolute;
        top: -4px;
        width: 11px;
      }

      #toolbar {
        z-index: 1;
      }

      #progressBar {
        background-color: white;
        border-bottom: 2px solid #f1efe2;
        border-left: 2px solid #716f64;
        border-right: 2px solid #f1efe2;
        border-top: 2px solid #716f64;
        height: 16px;
        position: relative;
        width: 100%;
      }

      .buttons {
        padding: 2px;
        border-right: 1px solid black;
        display: flex;
        gap: 8px;
      }

      .button-group {
        align-items: center;
        display: flex;

        &:last-of-type {
          padding-right: 4px;
        }

        button {
          align-items: center;
          background: #ece9d8;
          border-bottom: 2px solid #716f64;
          border-left: 2px solid #ffffff;
          border-right: 2px solid #716f64;
          border-top: 2px solid #ffffff;
          border-radius: 0;
          display: flex;
          height: 24px;
          justify-content: center;
          min-height: 0;
          min-width: 0;
          padding: 0;
          width: 24px;

          &.small {
            height: fit-content;
            padding: 3px;
            width: fit-content;

            &:not([disabled]):active * {
              padding: 0;
            }
          }

          &[disabled] {
            img {
              opacity: 0.3;
            }
          }

          &:focus {
            border-bottom: 2px solid #716f64;
            border-left: 2px solid #ffffff;
            border-right: 2px solid #716f64;
            border-top: 2px solid #ffffff;
            box-shadow: none;
            outline: none;
          }

          &:hover {
            box-shadow: none;
          }

          &:not([disabled]):active {
            border-bottom: 2px solid #ffffff;
            border-left: 2px solid #716f64;
            border-right: 2px solid #ffffff;
            border-top: 2px solid #716f64;

            * {
              padding: 2px 0 0 2px;
            }
          }
        }
      }

      .content {
        display: flex;
        flex-direction: column;
        user-select: none;
      }

      .controls {
        border-top: 1px solid black;
        display: flex;
      }

      .progress-bar-container {
        align-items: flex-start;
        display: flex;
        flex-grow: 1;
        gap: 8px;
      }

      .tick {
        display: flex;
        flex-direction: column;
        min-width: 50px;

        &::before {
          content: "|";
          margin-bottom: 2px;
        }

        &:last-of-type {
          margin-right: -3px;
          text-align: right;
        }
      }

      .ticks {
        display: flex;
        justify-content: space-between;
      }

      .timeline {
        display: grid;
        font-family: "Pixelated MS Sans Serif", Arial;
        grid-column-gap: 8px;
        grid-template-columns: auto 36px;
        padding: 8px;
      }

      .timer-wrapper {
        display: flex;
        flex-grow: 1;
        width: 100%;
      }

      .timer {
        border-bottom: 1px solid #ffffff;
        border-left: 1px solid #aca899;
        border-right: 1px solid #ffffff;
        border-top: 1px solid #aca899;
        font-family: "Pixelated MS Sans Serif", Arial;
        margin: 6px;
        padding: 3px 1px;
        width: 100%;
      }

      video {
        background-color: #000000;
        height: 100%;
        min-height: 0;
        width: 100%;
      }
    `
  ]

  @query('#player')
  player!: HTMLAudioElement | HTMLVideoElement

  @query('#progressBar')
  progressBar!: HTMLDivElement

  @query('#slider')
  slider!: HTMLDivElement

  @property({type: String})
  windowTitle = 'Media Player'

  @property({type: String})
  windowIcon = '/img/icons/small/media-player-small.ico'

  @property({type: String})
  fileLinkNode?: LinkNode

  @state()
  mimeType?: string

  @state()
  isPlaying = false

  @state()
  isPaused = false

  @state()
  isStopped = true

  @state()
  isEnded = false

  @state()
  length = '00:00 (min:sec)'

  @state()
  timerText = '00:00 (min:sec)'

  @state()
  sliderPosition = '-5px'

  interact: Interactable | null = null
  dragged = false
  trackLastPosition = false

  toolbarSpec: ToolbarMenu[] = [
    {
      text: 'File',
      items: [
        {
          text: 'Open...', action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            this.dispatchEvent(launchEvent(() => {
              const filePicker = new FilePicker()
              filePicker.delegatingAppId = this.getAppId()
              filePicker.path = 'C:\\Users\\Chad\\My Music'

              const soundFilterRegex = '[.](mp3|wav)$'

              filePicker.fileTypeFilters = [
                {
                  regex: soundFilterRegex,
                  label: 'Sound (*.mp3, *.wav)',
                  selected: true
                },
                {
                  regex: '[.](mp4|webm)$',
                  label: 'Video (*.mp4, *.webm)',
                },
              ]

              filePicker.filterRegex = new RegExp(soundFilterRegex)
              return filePicker
            }, {
              size: {
                width: 500,
                height: 400,
              },
              disallowFlags: WindowRestriction.DisallowMaximize | WindowRestriction.DisallowMinimize,
            }))
          },
        },
        {
          text: 'Close', action: () => {
            this.fileLinkNode = undefined
            this.player.load()
            this.dispatchEvent(windowPropertyChangeEvent({title: 'Media Player'}))
          }
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Exit', action: () => this.dispatchEvent(closeWindowEvent()),
        },
      ]
    },
    {
      text: 'Help',
      items: [
        {
          text: 'About Media Player',
          action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            this.dispatchEvent(launchEvent(() => {
              const about = new AppAbout()
              about.appName = 'Microsoft &reg; Media Player'
              about.appIcon = '/img/icons/media-player.ico'
              about.windowTitle = 'About Media Player'
              about.delegatingAppId = this.getAppId()
              return about
            }, {
              size: {
                width: 419,
                height: 350,
              },
              disallowFlags: WindowRestriction.DisallowAll,
            }))
          },
        },
      ],
    },
  ]

  connectedCallback() {
    super.connectedCallback()
    this.resetMimeType()
  }

  disconnectedCallback() {
    this.interact?.unset()
  }

  firstUpdated() {
    const appThis = this
    this.interact = interact(this.slider)

    this.interact.draggable({
      listeners: {
        move: this.handleSliderDrag.bind(this),
        end() {
          setTimeout(() => appThis.dragged = false, 50)
        },
      },
      startAxis: 'x',
      lockAxis: 'x',
    })
  }

  getMinimumDimensions() {
    return {
      width: 256,
      height: this.fileLinkNode && getFileExtension(this.fileLinkNode)!.match(/mp4|webm/) ? 256 : 144
    }
  }

  resetMimeType() {
    if (this.fileLinkNode) {
      const extension = getFileExtension(this.fileLinkNode)
      let type: string

      switch (extension) {
        case 'mp3':
        case 'wav':
          type = 'audio'
          break
        case 'mp4':
          type = 'video'
          break
        default:
          type = ''
          break
      }

      this.mimeType = `${type}/${extension}`
    } else {
      this.mimeType = undefined
    }
  }

  updateWindowProperties(updateGeometry: boolean = false) {
    this.windowTitle = 'Media Player'

    if (this.fileLinkNode) {
      this.windowTitle += ` - ${getLinkName(this.fileLinkNode)}`

      if (this.isPlaying) {
        this.windowTitle += ' (playing)'
      } else if (this.isPaused) {
        this.windowTitle += ' (paused)'
      } else if (this.isStopped) {
        this.windowTitle += ' (stopped)'
      }
    }

    const updatedProperties: WindowProperties = {title: this.windowTitle}

    if (updateGeometry) {
      updatedProperties.size = {width: 0, height: 0}

      if (this.mimeType?.startsWith('video')) {
        updatedProperties.size.height = 600
        updatedProperties.disallowFlags = WindowRestriction.AllowAll
      } else {
        updatedProperties.size.height = 146
        updatedProperties.disallowFlags = WindowRestriction.DisallowVerticalResize | WindowRestriction.DisallowMaximize
      }
    }

    this.dispatchEvent(windowPropertyChangeEvent(updatedProperties))
  }

  handleFilePicked(fileLinkNode: LinkNode) {
    this.isPlaying = false
    this.isPaused = false
    this.isStopped = true
    this.isEnded = false

    this.fileLinkNode = fileLinkNode
    this.sliderPosition = '-5px'

    this.resetMimeType()
    this.updateWindowProperties(true)

    this.player.load()
  }

  handleSliderDrag(event: ResizeEvent) {
    this.dragged = true

    const progressBarWidth = parseInt(window.getComputedStyle(this.progressBar).width.replace(/px$/, ''))
    const percentMoved = event.dx / progressBarWidth
    this.player.currentTime += this.player.duration * percentMoved
  }

  handlePlayPauseClick() {
    if (this.isPlaying) {
      this.player.pause()

      this.isPlaying = false
      this.isPaused = true
      this.isStopped = false
      this.isEnded = false

      this.updateWindowProperties()
    } else {
      if (this.isEnded) {
        this.player.currentTime = 0
      }

      this.player.play().then(() => {
        this.isPlaying = true
        this.isPaused = false
        this.isStopped = false
        this.isEnded = false

        this.updateWindowProperties()
      })
    }
  }

  handleStopClick() {
    this.player.pause()
    this.player.currentTime = 0

    this.isPlaying = false
    this.isPaused = false
    this.isStopped = true
    this.isEnded = false

    this.updateWindowProperties()
  }

  getTimeString(time: number): [string, string] {
    if (this.player.duration < 60) {
      const seconds = time.toFixed(2)
      const [whole, fraction] = seconds.toString().split('.')
      return [`${whole.toString().padStart(2, '0')}.${fraction.toString().padStart(2, '0')}`, '(sec)']
    } else {
      const minutes = Math.trunc(time / 60)
      const seconds = Math.round(time % 60)
      return [`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, '(min:sec)']
    }
  }

  handleTimeUpdate() {
    const currentTime = this.player.currentTime
    this.sliderPosition = `-5px + ${(currentTime / this.player.duration) * 100}%`
    this.timerText = this.getTimeString(this.player.currentTime).join(' ')
  }

  handleLoadedMetadata() {
    this.length = this.getTimeString(this.player?.duration)[0]
  }

  handleEnded() {
    this.isPlaying = false
    this.isPaused = false
    this.isStopped = true
    this.isEnded = true

    this.updateWindowProperties()
  }

  handleProgressBarClick(event: PointerEvent) {
    if (this.dragged) {
      return
    }

    this.dragged = false

    const progressBarWidth = parseInt(window.getComputedStyle(this.progressBar).width.replace(/px$/, ''))
    const percentMoved = event.offsetX / progressBarWidth
    this.player.currentTime = this.player.duration * percentMoved
  }

  seek(amount: number) {
    let newTime = this.player.currentTime + amount

    if (newTime < 0) {
      newTime = 0
    } else if (newTime > this.player.duration) {
      newTime = this.player.duration
    }

    this.player.currentTime = newTime
  }

  render() {
    const sliderStyle = {left: `calc(${this.sliderPosition})`}

    const source = html`
      <source src="${this.fileLinkNode?.physicalPath}" type="${this.mimeType}"/>`

    let playerElement

    switch (this.mimeType?.split('/')[0]) {
      case 'audio':
        playerElement = html`
          <audio id="player" @timeupdate=${this.handleTimeUpdate} @loadedmetadata=${this.handleLoadedMetadata}
                 @ended=${this.handleEnded}>
            ${source}
          </audio>`
        break
      case 'video':
        playerElement = html`
          <video id="player" @timeupdate=${this.handleTimeUpdate} @loadedmetadata=${this.handleLoadedMetadata}
                 @ended=${this.handleEnded}>
            ${source}
          </video>`
        break
      default:
        playerElement = html`
          <div>Unrecognized MIME type: ${this.mimeType}</div>`
    }

    return html`
      <div class="app" @click="${this.handleClick}">
        <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
        <div class="content">
          ${playerElement}
          <div class="timeline">
            <div id="progressBar" @click="${this.handleProgressBarClick}">
              <div id="slider" style="${styleMap(sliderStyle)}"></div>
            </div>
            <div class="button-group">
              <button type="button" ?disabled="${!this.fileLinkNode}" class="small"
                      @click="${() => this.seek(-0.5)}">
                <img src="/img/media-player/scroll-backward.png"/>
              </button>
              <button type="button" ?disabled="${!this.fileLinkNode}" class="small"
                      @click="${() => this.seek(0.5)}">
                <img src="/img/media-player/scroll-forward.png"/>
              </button>
            </div>
            <div class="ticks">
              <div class="tick">0:00</div>
              <div class="tick">${this.length}</div>
            </div>
          </div>
          <div class="controls">
            <div class="buttons">
              <div class="button-group">
                <button type="button" ?disabled="${!this.fileLinkNode}"
                        @click="${this.handlePlayPauseClick}">
                  <img src="${`/img/media-player/${this.isPlaying ? 'pause' : 'play'}.png`}"/>
                </button>
                <button type="button" ?disabled="${this.isStopped}"
                        @click="${this.handleStopClick}">
                  <img src="/img/media-player/stop.png"/>
                </button>
              </div>
              <div class="button-group">
                <button type="button" ?disabled="${!this.fileLinkNode}"
                        @click="${() => this.seek(-5)}">
                  <img src="/img/media-player/rewind.png"/>
                </button>
                <button type="button" ?disabled="${!this.fileLinkNode}"
                        @click="${() => this.seek(5)}">
                  <img src="/img/media-player/fast-forward.png"/>
                </button>
              </div>
            </div>
            <div class="timer-wrapper">
              <span class="timer">${this.timerText}</span>
            </div>
          </div>
        </div>
      </div>`
  }
}