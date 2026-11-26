import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../app.ts";
import {ImageGallery} from "../apps/image-gallery.ts";

@customElement('gallery-icon')
export class GalleryIcon extends EpkIcon {
  icon = '/img/icons/gallery.ico'

  @property({type: String})
  fsSpecPath!: string

  getAppInstance(): EpkApp {
    const imageGallery = new ImageGallery()
    imageGallery.fileLinkNode = this.fileLinkNode
    imageGallery.fsSpecPath = this.fsSpecPath
    return imageGallery
  }

  getLaunchOptions() {
    return {
      size: {
        height: 600,
        width: 800,
      },
    }
  }
}