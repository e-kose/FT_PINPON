import { fillIndex } from "../router/Router";
import "../components/forms/UserOperations";
import "../components/forms/SignupForm";
export default function loadHomePage(): void {
	fillIndex(`<signup-form></signup-form>`);
}