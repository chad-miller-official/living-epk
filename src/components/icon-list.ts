import {css, html, LitElement} from "lit";
import {customElement, queryAssignedElements} from "lit/decorators.js";
import type {EpkIcon} from "./icon.ts";

@customElement('epk-icon-list')
export class EpkIconList extends LitElement {
  static styles = css`
    .icon-list {
      align-items: flex-start;
      display: flex;
      gap: 16px;
      height: 100%;
      overflow: auto;
      padding: 4px;
    }
  `

  @queryAssignedElements()
  icons: EpkIcon[] | undefined

  handleClick(event: Event) {
    this.icons?.filter(icon => icon !== event.target).forEach(icon => icon.selected = false)
  }

  render() {
    return html`
      <section class="icon-list" @click="${this.handleClick}">
        <slot></slot>
      </section>
    `
  }
}