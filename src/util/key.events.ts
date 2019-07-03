/**
 * This namespace contains some helpers for working with keyboard events
 */
export namespace KeyEvents {

  export function isTextElement(e: Event) {
    if (!(e.target instanceof HTMLElement)) {
      return false;
    }

    if (e.target.isContentEditable) {
      return true;
    }

    return e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
  }

}
