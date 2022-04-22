import {Subject, Subscription} from "rxjs";

import {DomUtil} from "leaflet";

/**
 * This class is used to create a HTML form dynamically
 */
export class Form {

  private static id = 0;

  readonly container: HTMLElement;
  private readonly subscriptions: Subscription[] = [];

  constructor(fields: FormField[]) {
    this.container = DomUtil.create("div");
    this.appendInputs(fields);
  }

  /**
   * Remove the form and unsubscribe from all updates
   */
  remove() {
    this.container.remove();
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  appendInputs(fields: FormField[]) {
    fields.forEach(field => this.appendInput(field));
  }

  private appendInput(field: FormField) {
    const id = `form-input-${++Form.id}`;

    const row = DomUtil.create("div", "form-group row", this.container);

    const label = <HTMLLabelElement>DomUtil.create("label", "col-4 col-form-label", row);
    label.innerText = field.label;
    label.htmlFor = id;

    const inputGroup = DomUtil.create("div", "col-8 input-group", row);

    let input: HTMLTextAreaElement | HTMLInputElement, defaultValue = "";
    switch (field.type) {
      case "textarea":
        input = document.createElement("textarea");

        if (field.rows !== undefined) {
          input.rows = field.rows;
        }
        break;
      case "color":
        input = document.createElement("input");
        input.type = "color";
        defaultValue = "#000000";
        break;
      case "range":
        input = document.createElement("input");
        input.type = "range";
        defaultValue = "0";

        if (field.min !== undefined) {
          input.min = field.min.toString();
        }
        if (field.max !== undefined) {
          input.max = field.max.toString();
        }
        if (field.step !== undefined) {
          input.step = field.step.toString();
        }
        break;

      default:
        input = document.createElement("input");
        input.type = field.type || "text";

        if (field.list) {
          input.setAttribute("list", `${id}-list`);

          const list = document.createElement("datalist");
          list.id = `${id}-list`;
          field.list.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            list.append(option);
          });
          inputGroup.append(list);
        }

        break;
    }

    input.id = id;
    input.className = "form-control";
    inputGroup.append(input);

    const inputAppend = DomUtil.create("div", "input-group-append", inputGroup);
    const clear = DomUtil.create("button", "btn btn-sm btn-outline-secondary fas fa-backspace", inputAppend);
    clear.onclick = () => {
      field.data.next(null);
      input.focus();
    };

    this.subscriptions.push(field.data.subscribe(value => input.value = value || defaultValue));
    input.addEventListener("input", () => field.data.next(input.value || null));
  }
}

/**
 * The config used for creating a form field
 */
export interface FormField {
  /** The label text for the form field */
  label: string;

  /** The type of the form field, which is either 'textarea' or a value for the HTML5 input type attribute */
  type?: string;

  /** The datalist entries to use **/
  list?: string[];

  /** The minimum number for numeric inputs */
  min?: number;

  /** The maximum number for numeric inputs */
  max?: number;

  /** The step for numeric inputs */
  step?: number;

  /** The default number of rows for textarea inputs */
  rows?: number;

  /** The subject, which is triggered when the value is changed */
  data: Subject<string | null>;
}
