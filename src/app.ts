// Validation interface

interface Valid {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validation(validInput: Valid) {
  let isValid = true;
  if (validInput.required) {
    isValid = isValid && validInput.value.toString().trim().length !== 0;
  }
  if (validInput.minLength != null && typeof validInput.value === "string") {
    isValid = isValid && validInput.value.length >= validInput.minLength;
  }
  if (validInput.maxLength != null && typeof validInput.value === "string") {
    isValid = isValid && validInput.value.length <= validInput.maxLength;
  }
  if (validInput.min != null && typeof validInput.value === "number") {
    isValid = isValid && validInput.value >= validInput.min;
  }
  if (validInput.max != null && typeof validInput.value === "number") {
    isValid = isValid && validInput.value <= validInput.max;
  }

  return isValid;
}

class ProjectInput {
  template: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  formElement: HTMLFormElement;
  titleInput: HTMLInputElement;
  discriptionInput: HTMLInputElement;
  peopleInput: HTMLInputElement;

  constructor() {
    this.template = <HTMLTemplateElement>document.getElementById("form")!;
    this.hostElement = <HTMLDivElement>document.getElementById("app")!;

    const importedNode = document.importNode(this.template.content, true);
    this.formElement = <HTMLFormElement>importedNode.firstElementChild;

    this.titleInput = <HTMLInputElement>(
      this.formElement.querySelector("#title")
    );
    this.discriptionInput = <HTMLInputElement>(
      this.formElement.querySelector("#description")
    );
    this.peopleInput = <HTMLInputElement>(
      this.formElement.querySelector("#people")
    );

    this._configure();
    this._attach();
  }

  _getUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInput.value;
    const enteredDiscription = this.discriptionInput.value;
    const enteredPeople = this.peopleInput.value;

    const titleValid: Valid = {
      value: enteredTitle,
      required: true,
    };
    const discriptionValid: Valid = {
      value: enteredDiscription,
      required: true,
      minLength: 5,
      maxLength: 500,
    };
    const peopleValid: Valid = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 10,
    };

    if (
      !validation(titleValid) ||
      !validation(discriptionValid) ||
      !validation(peopleValid)
    ) {
      alert("Invalid input, try again");
      return;
    } else {
      return [enteredTitle, enteredDiscription, +enteredPeople];
    }
  }

  _clearForm() {
    this.titleInput.value = "";
    this.discriptionInput.value = "";
    this.peopleInput.value = "";
  }

  _submitHandler(e: Event) {
    e.preventDefault();
    const userInput = this._getUserInput();
    if (Array.isArray(userInput)) {
      const [title, discription, people] = userInput;
      console.log(title, discription, people);
      this._clearForm();
    }
  }

  _configure() {
    this.formElement.addEventListener("submit", this._submitHandler.bind(this));
  }

  _attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.formElement);
  }
}

const input = new ProjectInput();
