// Project Type

enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

// Project State

type Listener = (item: Project[]) => void;

class ProjectState {
  listeners: Listener[] = [];
  projects: Project[] = [];
  static instance: ProjectState;

  constructor() {}

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Date.now().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );

    this.projects.push(newProject);
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance();

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

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  template: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertBefore: boolean,
    newElementId?: string
  ) {
    this.template = <HTMLTemplateElement>document.getElementById(templateId)!;
    this.hostElement = <T>document.getElementById(hostElementId)!;

    const importedNode = document.importNode(this.template.content, true);
    this.element = <U>importedNode.firstElementChild;
    if (newElementId) {
      this.element.id = newElementId;
    }

    this._attach(insertBefore);
  }
  _attach(insertBefore: boolean) {
    this.hostElement.insertAdjacentElement(
      insertBefore ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract render(): void;
}

// Project Item Class

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> {
  project: Project;

  get persons() {
    if (this.project.people === 1) {
      return "1 person";
    } else {
      return `${this.project.people} persons`;
    }
  }

  constructor(hostId: string, project: Project) {
    super("single-project", hostId, false, project.id);
    this.project = project;

    this.configure();
    this.render();
  }

  configure() {}
  render() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons + " assigned";
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

// Project List Class

class ProjectList extends Component<HTMLDivElement, HTMLElement> {
  assignedProjects: Project[];

  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.render();
  }

  configure() {
    projectState.addListener((projects: Project[]) => {
      const relevantProject = projects.filter((p) => {
        if (this.type === "active") {
          return p.status === ProjectStatus.Active;
        }
        return p.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProject;
      this._renderProjects();
    });
  }

  render() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type[0].toUpperCase() + this.type.slice(1) + " Projects";
  }

  _renderProjects() {
    const listElement = <HTMLUListElement>(
      document.getElementById(`${this.type}-projects-list`)!
    );
    listElement.innerHTML = "";
    for (const projectItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector("ul")!.id, projectItem);
    }
  }
}

// Project Input Class

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInput: HTMLInputElement;
  discriptionInput: HTMLInputElement;
  peopleInput: HTMLInputElement;

  constructor() {
    super("form", "app", true, "user-input");
    this.titleInput = <HTMLInputElement>this.element.querySelector("#title");
    this.discriptionInput = <HTMLInputElement>(
      this.element.querySelector("#description")
    );
    this.peopleInput = <HTMLInputElement>this.element.querySelector("#people");

    this.configure();
  }

  configure() {
    this.element.addEventListener("submit", this._submitHandler.bind(this));
  }

  render() {}

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
      projectState.addProject(title, discription, people);
      console.log(title, discription, people);
      this._clearForm();
    }
  }
}

const input = new ProjectInput();
const activeList = new ProjectList("active");
const finishedList = new ProjectList("finished");
