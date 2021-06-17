// Task Type

enum TaskStatus {
  Active,
  Completed,
}

class Task {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public days: number,
    public status: TaskStatus
  ) {}
}

// Task State

type Listener = (item: Task[]) => void;

class TaskState {
  listeners: Listener[] = [];
  tasks: Task[] = [];
  static instance: TaskState;

  constructor() {}

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new TaskState();
    return this.instance;
  }

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }

  addTask(title: string, description: string, numOfDays: number) {
    const newTask = new Task(
      Date.now().toString(),
      title,
      description,
      numOfDays,
      TaskStatus.Active
    );

    this.tasks.push(newTask);
    this._updateListeners();
  }

  switchTaskStatus(taskId: string, newStatus: TaskStatus) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      task.status = newStatus;
      this._updateListeners();
    }
  }

  _updateListeners() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.tasks.slice());
    }
  }
}

const taskState = TaskState.getInstance();

// Drag and Drop Interfaces
interface Drag {
  dragStartHandler(e: DragEvent): void;
  dragEndHandler(e: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(e: DragEvent): void;
  dropHandler(e: DragEvent): void;
  dragLeaveHandler(e: DragEvent): void;
}

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

// Task Item Class

class TaskItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Drag
{
  task: Task;

  get days() {
    if (this.task.days === 1) {
      return "1 day";
    } else {
      return `${this.task.days} days`;
    }
  }

  constructor(hostId: string, task: Task) {
    super("single-task", hostId, false, task.id);
    this.task = task;

    this.configure();
    this.render();
  }

  dragStartHandler(e: DragEvent) {
    e.dataTransfer!.setData("text/plain", this.task.id);
    e.dataTransfer!.effectAllowed = "move";
  }
  dragEndHandler(_: DragEvent) {}

  configure() {
    this.element.addEventListener(
      "dragstart",
      this.dragStartHandler.bind(this)
    );
    this.element.addEventListener("dragend", this.dragEndHandler.bind(this));
  }
  render() {
    this.element.querySelector("h2")!.textContent = this.task.title;
    this.element.querySelector("h3")!.textContent = this.days + " to complete the task";
    this.element.querySelector("p")!.textContent = this.task.description;
  }
}

// Task List Class
class TaskList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedTasks: Task[];

  constructor(private type: "active" | "finished") {
    super("task-list", "main", false, `${type}-tasks`);
    this.assignedTasks = [];

    this.configure();
    this.render();
  }

  dragOverHandler(e: DragEvent) {
    if (e.dataTransfer && e.dataTransfer.types[0] === "text/plain") {
      e.preventDefault();
      const listElement = this.element.querySelector("ul")!;
      listElement.classList.add("droppable");
    }
  }

  dropHandler(e: DragEvent) {
    const taskId = e.dataTransfer!.getData("text/plain");
    taskState.switchTaskStatus(
      taskId,
      this.type === "active" ? TaskStatus.Active : TaskStatus.Completed
    );
  }

  dragLeaveHandler(_: DragEvent) {
    const listElement = this.element.querySelector("ul")!;
    listElement.classList.remove("droppable");
  }

  configure() {
    this.element.addEventListener("dragover", this.dragOverHandler.bind(this));
    this.element.addEventListener("drop", this.dropHandler.bind(this));
    this.element.addEventListener(
      "dragleave",
      this.dragLeaveHandler.bind(this)
    );

    taskState.addListener((tasks: Task[]) => {
      const relevantTask = tasks.filter((t) => {
        if (this.type === "active") {
          return t.status === TaskStatus.Active;
        }
        return t.status === TaskStatus.Completed;
      });
      this.assignedTasks = relevantTask;
      this._renderTasks();
    });
  }

  render() {
    const listId = `${this.type}-tasks-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type[0].toUpperCase() + this.type.slice(1) + " Tasks";
  }

  _renderTasks() {
    const listElement = <HTMLUListElement>(
      document.getElementById(`${this.type}-tasks-list`)!
    );
    listElement.innerHTML = "";
    for (const taskItem of this.assignedTasks) {
      new TaskItem(this.element.querySelector("ul")!.id, taskItem);
    }
  }
}

// Task Input Class

class TaskInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInput: HTMLInputElement;
  discriptionInput: HTMLInputElement;
  taskInput: HTMLInputElement;

  constructor() {
    super("form", "app", true, "user-input");
    this.titleInput = <HTMLInputElement>this.element.querySelector("#title");
    this.discriptionInput = <HTMLInputElement>(
      this.element.querySelector("#description")
    );
    this.taskInput = <HTMLInputElement>this.element.querySelector("#days");

    this.configure();
  }

  configure() {
    this.element.addEventListener("submit", this._submitHandler.bind(this));
  }

  render() {}

  _getUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInput.value;
    const enteredDiscription = this.discriptionInput.value;
    const enteredTask = this.taskInput.value;

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
    const taskValid: Valid = {
      value: +enteredTask,
      required: true,
      min: 1,
      max: 10,
    };

    if (
      !validation(titleValid) ||
      !validation(discriptionValid) ||
      !validation(taskValid)
    ) {
      alert("Invalid input, try again");
      return;
    } else {
      return [enteredTitle, enteredDiscription, +enteredTask];
    }
  }

  _clearForm() {
    this.titleInput.value = "";
    this.discriptionInput.value = "";
    this.taskInput.value = "";
  }

  _submitHandler(e: Event) {
    e.preventDefault();
    const userInput = this._getUserInput();
    if (Array.isArray(userInput)) {
      const [title, discription, days] = userInput;
      taskState.addTask(title, discription, days);
      this._clearForm();
    }
  }
}

const input = new TaskInput();
const activeList = new TaskList("active");
const finishedList = new TaskList("finished");
