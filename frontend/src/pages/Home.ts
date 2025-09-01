import { fillIndex } from "../router/ReWriteInHtml";
import { UserRegisterionForm } from "../components/forms/UserOperations";
import "../components/forms/UserOperations";
export default function loadHomePage(): void {
	const userRegForm = new UserRegisterionForm();
	userRegForm.createForm();
}