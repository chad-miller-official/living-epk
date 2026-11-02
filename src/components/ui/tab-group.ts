import {css, html, LitElement, unsafeCSS} from "lit";
import {customElement, queryAssignedElements} from "lit/decorators.js";
import xpStyle from "xp.css";

@customElement('tab-group')
export class TabGroup extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      .tabs {
        box-sizing: border-box;
        height: 100%;
        padding: 10px 6px;
      }`
  ]

  @queryAssignedElements({slot: 'tabs'})
  tabs!: HTMLButtonElement[]

  @queryAssignedElements({slot: 'panels'})
  panels!: HTMLElement[]

  switchTab(event: Event) {
    const targetTab = event.target as HTMLButtonElement
    targetTab.ariaSelected = "true"

    Array.from(this.shadowRoot!.querySelectorAll('button[role=tab]'))
      .filter(tab => tab !== targetTab)
      .forEach(tab => tab.ariaSelected = "false")

    const targetId = targetTab.getAttribute('aria-controls')

    const tabPanels = Array.from(this.shadowRoot!.querySelectorAll('article[role=tabpanel]'))
    const targetTabPanel = tabPanels.find(panel => panel.id === targetId)!

    targetTabPanel.removeAttribute('hidden')

    tabPanels
      .filter(panel => panel !== targetTabPanel)
      .forEach(panel => panel.setAttribute('hidden', 'hidden'))
  }

  connectedCallback() {
    super.connectedCallback()

    this.tabs.forEach(tab => {
      tab.onclick = this.switchTab
      tab.role = 'tab'
    })

    this.panels.forEach(panel => panel.role = 'tabpanel')
  }

  render() {
    return html`
      <section class="tabs">
        <menu role="tablist" aria-label="Tabs">
          <slot name="tabs"></slot>
        </menu>
        <slot name="panels"></slot>
      </section>
    `
  }
}