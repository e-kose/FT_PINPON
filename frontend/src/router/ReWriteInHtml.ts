import ErrorPages  from "../components/errors/ErrorPages";

function fillIndex(htmlValue:string):void
{
	const app = document.getElementById("app");
	const errPages = new ErrorPages();
	if (app)
		htmlValue? app.innerHTML = htmlValue : errPages.ErrorPages.general();
	else
		throw new Error("Error: root is undefined");
}

export {fillIndex};