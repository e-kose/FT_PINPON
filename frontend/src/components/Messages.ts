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
	public showLoadingAnimation(parentSelector: string): void {
		const parent = document.querySelector(parentSelector);
		if (!parent) {
			console.warn(`Parent element not found: ${parentSelector}`);
			return;
		}

		// Loading container div
		const loadingDiv = document.createElement('div');
		loadingDiv.setAttribute('role', 'status');
		loadingDiv.className = 'flex flex-col justify-center items-center mt-4';
		loadingDiv.setAttribute('data-loading', 'true');

		
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('class', 'w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600');
		svg.setAttribute('viewBox', '0 0 100 101');
		svg.setAttribute('fill', 'none');

		
		const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path1.setAttribute('d', 'M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z');
		path1.setAttribute('fill', 'currentColor');

		
		const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path2.setAttribute('d', 'M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z');
		path2.setAttribute('fill', 'currentFill');

		
		const span = document.createElement('span');
		span.className = 'mb-3 text-lg font-medium text-green-600 dark:text-green-400';
		span.textContent = 'Giriş yapılıyor...';

		
		svg.appendChild(path1);
		svg.appendChild(path2);
		loadingDiv.appendChild(span);
		loadingDiv.appendChild(svg);


		parent.appendChild(loadingDiv);
	}

	public hideLoadingAnimation(parentSelector: string): void {
		const parent = document.querySelector(parentSelector);
		if (parent) {
			const loadingElement = parent.querySelector('[data-loading="true"]');
			if (loadingElement) {
				loadingElement.remove();
			}
		}
	}
}

const messages = new Messages();

export default messages;