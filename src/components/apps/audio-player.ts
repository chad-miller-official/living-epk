import {customElement, property, query, state} from "lit/decorators.js";
import {css, html} from "lit";
import {EpkApp} from "../app.ts";
import {type ToolbarMenu, ToolbarUiElement} from "../../lib/toolbar.ts";
import {
  closeWindowEvent,
  DisallowFlags,
  launchEvent,
  windowPropertyChangeEvent
} from "../../lib/events.ts";
import {styleMap} from "lit/directives/style-map.js";
import interact from "interactjs";
import type {Interactable} from "@interactjs/types";
import type {ResizeEvent} from "@interactjs/actions/resize/plugin";
import {FilePicker} from "./file-picker.ts";
import {AppAbout} from "./about.ts";
import {getFileExtension, getLinkName, type LinkNode} from "../../lib/fs.ts";

@customElement('audio-player')
export class AudioPlayer extends EpkApp {
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
        justify-content: space-between;
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
    `
  ]

  @query('#audioPlayer')
  audioPlayer!: HTMLAudioElement

  @query('#progressBar')
  progressBar!: HTMLDivElement

  @query('#slider')
  slider!: HTMLDivElement

  @property({type: String})
  windowTitle = 'Media Player'

  @property({type: String})
  windowIcon = '/img/media-player-small.ico'

  @property({type: String})
  fileLinkNode?: LinkNode

  @state()
  mimeType: string | undefined

  @state()
  isPlaying = false

  @state()
  isPaused = false

  @state()
  isStopped = true

  @state()
  isEnded = false

  @state()
  audioLength = '00:00 (min:sec)'

  @state()
  timerText = '00:00 (min:sec)'

  @state()
  sliderPosition = '-5px'

  interact: Interactable | null = null
  dragged = false

  toolbarSpec: ToolbarMenu[] = [
    {
      text: 'File',
      items: [
        {
          text: 'Open...', action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            const filePicker = new FilePicker()
            filePicker.folderNodeJsonPath = 'C:\\Users\\Chad\\My Music'
            filePicker.onFilePick = this.loadFile.bind(this)

            const soundFilterRegex = '[.](mp3|wav)$'

            filePicker.fileTypeFilters = [{
              regex: soundFilterRegex,
              label: 'Sound (*.mp3, *.wav)',
              selected: true
            }]

            filePicker.filterRegex = new RegExp(soundFilterRegex)

            this.dispatchEvent(launchEvent(() => new Promise<FilePicker>(resolve => resolve(filePicker)), {
              width: 500,
              height: 400,
              disallowFlags: DisallowFlags.DisallowMaximize | DisallowFlags.DisallowMinimize,
            }))
          },
        },
        {
          text: 'Close', action: () => {
            this.fileLinkNode = undefined
            this.audioPlayer.load()
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

            const about = new AppAbout()
            about.appName = 'Microsoft &reg; Media Player'
            about.appIcon = '/img/media-player.ico'
            about.windowTitle = 'About Media Player'

            this.dispatchEvent(launchEvent(() => new Promise<AppAbout>(resolve => resolve(about)), {
              width: 419,
              height: 350,
              disallowFlags: DisallowFlags.DisallowAll,
            }))
          },
        },
      ],
    },
  ]

  connectedCallback() {
    super.connectedCallback()

    if (this.fileLinkNode) {
      this.mimeType = `audio/${getFileExtension(this.fileLinkNode)}`
    }
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

  getMinimumDimensions(): [number, number] {
    return [256, 144]
  }

  updateWindowTitle() {
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

    this.dispatchEvent(windowPropertyChangeEvent({title: this.windowTitle}))
  }

  loadFile(fileLinkNode: LinkNode) {
    this.isPlaying = false
    this.isPaused = false
    this.isStopped = true
    this.isEnded = false

    this.fileLinkNode = fileLinkNode
    this.mimeType = `audio/${getFileExtension(this.fileLinkNode)}`

    this.sliderPosition = '-5px'

    this.updateWindowTitle()
    this.audioPlayer.load()
  }

  handleSliderDrag(event: ResizeEvent) {
    this.dragged = true

    const progressBarWidth = parseInt(window.getComputedStyle(this.progressBar).width.replace(/px$/, ''))
    const percentMoved = event.dx / progressBarWidth
    this.audioPlayer.currentTime += this.audioPlayer.duration * percentMoved
  }

  handlePlayPauseClick() {
    if (this.isPlaying) {
      this.audioPlayer.pause()

      this.isPlaying = false
      this.isPaused = true
      this.isStopped = false
      this.isEnded = false

      this.updateWindowTitle()
    } else {
      if (this.isEnded) {
        this.audioPlayer.currentTime = 0
      }

      this.audioPlayer.play().then(() => {
        this.isPlaying = true
        this.isPaused = false
        this.isStopped = false
        this.isEnded = false

        this.updateWindowTitle()
      })
    }
  }

  handleStopClick() {
    this.audioPlayer.pause()
    this.audioPlayer.currentTime = 0

    this.isPlaying = false
    this.isPaused = false
    this.isStopped = true
    this.isEnded = false

    this.updateWindowTitle()
  }

  getTimeString(time: number): [string, string] {
    if (this.audioPlayer.duration < 60) {
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
    const currentTime = this.audioPlayer.currentTime
    this.sliderPosition = `-5px + ${(currentTime / this.audioPlayer.duration) * 100}%`
    this.timerText = this.getTimeString(this.audioPlayer.currentTime).join(' ')
  }

  handleLoadedMetadata() {
    this.audioLength = this.getTimeString(this.audioPlayer?.duration)[0]
  }

  handleEnded() {
    this.isPlaying = false
    this.isPaused = false
    this.isStopped = true
    this.isEnded = true

    this.updateWindowTitle()
  }

  handleProgressBarClick(event: PointerEvent) {
    if (this.dragged) {
      return
    }

    this.dragged = false

    const progressBarWidth = parseInt(window.getComputedStyle(this.progressBar).width.replace(/px$/, ''))
    const percentMoved = event.offsetX / progressBarWidth
    this.audioPlayer.currentTime = this.audioPlayer.duration * percentMoved
  }

  seek(amount: number) {
    let newTime = this.audioPlayer.currentTime + amount

    if (newTime < 0) {
      newTime = 0
    } else if (newTime > this.audioPlayer.duration) {
      newTime = this.audioPlayer.duration
    }

    this.audioPlayer.currentTime = newTime
  }

  render() {
    const sliderStyle = {left: `calc(${this.sliderPosition})`}

    return html`
      <div class="app" @click="${this.handleClick}">
        <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
        <div class="content">
          <audio id="audioPlayer" @timeupdate="${this.handleTimeUpdate}"
                 @loadedmetadata="${this.handleLoadedMetadata}"
                 @ended="${this.handleEnded}">
            <source src="${this.fileLinkNode?.path}" type="${this.mimeType}"/>
          </audio>
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
              <div class="tick">${this.audioLength}</div>
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