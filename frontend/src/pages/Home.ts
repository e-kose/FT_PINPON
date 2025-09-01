import { fillIndex } from "../router/ReWriteInHtml";
import { UserRegisterionForm } from "../components/forms/UserRegisterForm";
import "../components/forms/UserRegisterForm";
export default function loadHomePage(): void {
	const userRegForm = new UserRegisterionForm();
	userRegForm.createForm();
}