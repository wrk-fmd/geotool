import {DomUtil} from "leaflet";

/**
 * This class builds a Bootstrap Modal dynamically
 */
export class Modal {

  private readonly container: HTMLElement;
  private readonly title: HTMLElement;
  private readonly body: HTMLElement;

  constructor(title: string, body: HTMLElement) {
    this.container = DomUtil.create("div", "modal fade", document.body);

    // Modal wrappers
    const dialog = DomUtil.create("div", "modal-dialog", this.container);
    const content = DomUtil.create("div", "modal-content", dialog);

    // Header with title
    const header = DomUtil.create("div", "modal-header", content);
    this.title = DomUtil.create("h5", "modal-title", header);
    this.title.innerText = title;

    // Close button and event handler
    const close = DomUtil.create("button", "close", header);
    close.innerHTML = "&times;";
    close.onclick = () => this.close();

    // Modal body
    this.body = DomUtil.create("div", "modal-body", content);
    this.body.appendChild(body);
  }

  /**
   * Remove the modal from the DOM
   */
  remove() {
    this.container.remove();
  }

  /**
   * Open the modal dialog
   */
  show() {
    DomUtil.addClass(this.container, "show");
  }

  /**
   * Close the modal dialog
   */
  close() {
    DomUtil.removeClass(this.container, "show");
  }

  /**
   * Update the modal's title
   * @param title The new title
   */
  setTitle(title: string) {
    this.title.innerText = title;
  }

  /**
   * Update the modal's content
   * @param body The new DOM node to be used as body
   */
  setBody(body: Node) {
    DomUtil.empty(this.body);
    this.body.appendChild(body);
  }
}
