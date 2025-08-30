import createErrorPage from "../components/errors/ErrorPages";

function fillIndex(htmlValue:string):void
{
	const app = document.getElementById("app");
	if (app)
	{

		htmlValue? app.innerHTML = htmlValue : createErrorPage("!","-","-"); 
	}
	
}