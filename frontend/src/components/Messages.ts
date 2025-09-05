export class Messages {
	showMessage(status: string, message: string, msgType: string, lastElement: string): void {
		const messageDiv = document.createElement('div');
		const msgClass = msgType === "error" 
			? 'mt-4 bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-700' 
			: 'mt-4 bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/20 dark:border-green-700';
		
		messageDiv.className = msgClass;

		// Ana container div
		const flexDiv = document.createElement('div');
		flexDiv.className = 'flex items-center';

		// SVG icon
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'w-5 h-5 text-green-600 mr-2');
		svg.setAttribute('fill', 'currentColor');
		svg.setAttribute('viewBox', '0 0 20 20');

		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('fill-rule', 'evenodd');
		path.setAttribute('d', 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z');
		path.setAttribute('clip-rule', 'evenodd');

		svg.appendChild(path);

		// Status text
		const statusP = document.createElement('p');
		statusP.className = 'text-green-800 dark:text-green-200 font-medium';
		statusP.textContent = status + ' !';

		// Message text
		const messageP = document.createElement('p');
		messageP.className = 'text-green-700 dark:text-green-300 mt-2';
		messageP.textContent = message;

		// Element'leri birleştir
		flexDiv.appendChild(svg);
		flexDiv.appendChild(statusP);
		messageDiv.appendChild(flexDiv);
		messageDiv.appendChild(messageP);

		const formContainer = document.querySelector(lastElement);
		if (formContainer) {
			formContainer.appendChild(messageDiv);
		}
	}
}

const messages = new Messages();

export default messages;