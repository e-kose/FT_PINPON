import loadHomePage from "./pages/Home"
import { setupRouter } from "./router/Router"
import "./styles/style.css"
// import "./components/forms/SignupForm"

// export async function loadTemplate(templateName: string): Promise<string> {
//   const response = await fetch(`../${templateName}.html`)
//   return response.text()
// }

// const html = await loadTemplate("template")
// document.querySelector('#app')!.innerHTML = html

// Router'ı başlat
setupRouter();

loadHomePage();

