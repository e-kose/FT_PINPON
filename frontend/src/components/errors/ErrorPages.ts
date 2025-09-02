
export default class ErrorPages
{
	public	createErrorPage(errorCode : string, title:string, desc:string ):string
	{
		return (
		`<section class="bg-white dark:bg-gray-900">
			<div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
				<div class="mx-auto max-w-screen-sm text-center">
					<h1 class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500"> ${errorCode}</h1>
					<p class="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">${title}</p>
					<p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">${desc}</p>
					<a href="#" class="inline-flex text-white bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4">Back to Homepage</a>
				</div>   
			</div>
		</section>`);
	};
	public ErrorPages = {
		notFound: () => this.createErrorPage("404", "Page Not Found", "The page you are looking for does not exist"),
		serverError: () => this.createErrorPage("500", "Server Error", "An error has occurred"),
		general: () => this.createErrorPage("!", "Error", "Something went wrong")
	};
	public errorMessage(status: string, message: string): string {
		return(`<div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
    	<p class="text-lg font-semibold">Order Status: ${status}</p>
   		<p>${message}</p>
	</div>`);
	}
};



