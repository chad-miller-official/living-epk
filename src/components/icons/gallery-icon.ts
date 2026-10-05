import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../app.ts";
import type {LaunchOptions} from "../../lib/events.ts";
import {ImageGallery} from "../apps/image-gallery.ts";

@customElement('gallery-icon')
export class GalleryIcon extends EpkIcon {
  icon = '/img/gallery.ico'

  @property({type: String})
  fsSpecPath!: string

  getAppInstance(): Promise<EpkApp> {
    return new Promise<ImageGallery>(resolve => {
      const imageGallery = new ImageGallery()
      imageGallery.filePath = this.filePath
      imageGallery.fsSpecPath = this.fsSpecPath
      return resolve(imageGallery)
    })
  }

  getLaunchOptions(): LaunchOptions {
    return {
      height: 600,
      width: 800,
    }
  }
}