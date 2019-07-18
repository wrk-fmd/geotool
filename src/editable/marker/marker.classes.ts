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
    try {
      const rules = styleSheet.cssRules;
      for (let i = 0; i < rules.length; i++) {
        this.addRule(<CSSStyleRule>rules[i]);
      }
    } catch (e) {
      // At least Chrome does not allow access to the rule if serving through the local filesystem
      console.warn("Could not read CSS rules, CORS in effect?", e);
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
