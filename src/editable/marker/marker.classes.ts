export class MarkerClasses {

  private static _instance: MarkerClasses;

  readonly list: string[] = [];

  static get instance(): MarkerClasses {
    if (!this._instance) {
      this._instance = new MarkerClasses();
    }
    return this._instance;
  }

  private constructor() {
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      this.addStyleSheet(<CSSStyleSheet>styleSheets[i]);
    }
  }

  private addStyleSheet(styleSheet: CSSStyleSheet) {
    const rules = styleSheet.cssRules;
    for (let i = 0; i < rules.length; i++) {
      this.addRule(<CSSStyleRule>rules[i]);
    }
  }

  private addRule(rule: CSSStyleRule) {
    if (!rule.selectorText) {
      return;
    }

    const matches = rule.selectorText.match(/^\.((fa|marker)-[a-zA-Z0-9_-]+)::before$/);
    if (matches) {
      this.list.push(matches[1]);
    }
  }
}
