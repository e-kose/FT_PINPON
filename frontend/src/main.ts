import loadHomePage from "./pages/Home"
import "./styles/style.css"

// export async function loadTemplate(templateName: string): Promise<string> {
//   const response = await fetch(`../${templateName}.html`)
//   return response.text()
// }

// const html = await loadTemplate("template")
// document.querySelector('#app')!.innerHTML = html

loadHomePage();

