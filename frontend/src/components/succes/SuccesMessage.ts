
export default class SuccesMessage  {
	public userRegister(status: string, message: string): string {
		return (
	`<div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
    	<p class="text-lg font-semibold">Order Status: ${status}</p>
   		<p>${message}</p>
	</div>`);
	}
}

