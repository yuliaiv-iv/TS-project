class ProjectInput {
  template: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  formElement: HTMLFormElement;

  constructor() {
    this.template = <HTMLTemplateElement>document.getElementById('form')!;
    this.hostElement = <HTMLDivElement>document.getElementById('app')!;

    const importedNode = document.importNode(this.template.content, true);
    this.formElement = <HTMLFormElement>importedNode.firstElementChild;
    this.attach();
  }

  attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.formElement);
  }
}

const input = new ProjectInput();