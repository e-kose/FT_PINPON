import messages from "../Messages";

export abstract class UserForm extends HTMLElement {

  protected form!: HTMLFormElement;

  // Abstract error mapping - alt sınıflar kendi error mapping'lerini tanımlayacak
  protected abstract errorMappings: Record<number, { title: string, message: string }>;

  connectedCallback() {
    this.innerHTML = this.createForm();
    this.form = this.querySelector("form") as HTMLFormElement;
    this.setupEvents();
  }

  protected  handleGoogleAuth(): void {
	window.location.href = import.meta.env.VITE_GOOGLE_AUTH_ENDPOINT;
  }


  protected abstract createForm(): string;

  protected setupEvents(): void {
    this.form?.addEventListener("submit", this.handleSubmit.bind(this));
  }

  // Ortak hata yönetim metodu
  protected getErrorMessage(status: number): { title: string, message: string } {
    const errorInfo = this.errorMappings[status];
    
    if (!errorInfo) {
      return {
        title: "Beklenmeyen Hata",
        message: "Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin."
      };
    }

    return errorInfo;
  }

  // Ortak API hata işleme metodu
  protected handleApiError(status: number): void {
    const { title, message } = this.getErrorMessage(status);
    messages.showMessage(title, message, "error", "#messageContainer");
  }

  // XSS güvenliği için input sanitization
  protected sanitizeInput(input: string): string {
    return input.trim()
      .replace(/[<>]/g, '') // Remove < and > characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=
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
