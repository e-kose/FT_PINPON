import { ErrorPages } from "../components/errors/ErrorPages";

function fillIndex(htmlValue:string):void
{
	const app = document.getElementById("app");
	if (app)
		htmlValue? app.innerHTML = htmlValue : ErrorPages.general();
	else
		throw new Error("Error: root is undefined");
}

export {fillIndex};