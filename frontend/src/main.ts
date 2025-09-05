
import { initializeRouter, router } from "./router/Router"
import "./styles/style.css"
import "./components/forms/SignupForm"
import "./components/forms/LoginForm"
import "./pages/Home"

// export async function loadTemplate(templateName: string): Promise<string> {
//   const response = await fetch(`../${templateName}.html`)
//   return response.text()
// }

// const html = await loadTemplate("template")
// document.querySelector('#app')!.innerHTML = html

// Router'ı başlat
initializeRouter();
// Başlangıç sayfasına yönlendir
router.navigate(document.location.pathname || "/signup");

