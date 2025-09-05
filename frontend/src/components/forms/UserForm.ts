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
  protected checkInput = (rule : RegExp, inputElement:string, labelElement: string, labelText: string): boolean =>{
			const input = this.querySelector(inputElement) as HTMLInputElement;
			const label = this.querySelector(labelElement) as HTMLLabelElement;
			if (!rule.test(input.value)) {
				label.innerHTML = `${labelText} <span class="text-red-500 text-xs">(Geçerli bir değer girin)</span>`;
				label.classList.add('text-red-500');
				
				const handleInput = () => {
					if (rule.test(input.value)) {
						label.innerHTML = labelText;
						label.classList.remove('text-red-500');
						input.removeEventListener('input', handleInput);
					}
				};
				input.addEventListener('input', handleInput);
				return false;
			}
			return true;
		}
  protected abstract handleSubmit(e: Event): void;
}
