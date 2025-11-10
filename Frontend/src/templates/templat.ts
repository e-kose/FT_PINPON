import "./styles/style.css"
document.querySelector<HTMLDivElement>('#app')!.innerHTML = await (await fetch('./Template.html')).text();