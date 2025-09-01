export abstract class UserForm extends HTMLElement {
  protected form!: HTMLFormElement;

  connectedCallback() {
    this.innerHTML = this.createForm();
    this.form = this.querySelector("form") as HTMLFormElement;
    this.setupEvents();
  }

  protected abstract createForm(): string;

  protected setupEvents(): void {
    this.form?.addEventListener("submit", this.handleSubmit.bind(this));
  }

  protected abstract handleSubmit(e: Event): void;
}
