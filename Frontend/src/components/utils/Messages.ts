import { t } from "../../i18n/lang";

export class Messages {
	// Mevcut mesajları temizleme fonksiyonu
	public clearMessages(parentSelector: string): void {
		const parent = document.querySelector(parentSelector);
		if (parent) {
			// Mevcut mesajları ve loading animasyonlarını temizle
			const existingMessages = parent.querySelectorAll('[data-message="true"], [data-loading="true"]');
			existingMessages.forEach(msg => msg.remove());
		}
	}

	showMessage(status: string, message: string, msgType: string, lastElement: string): void {
		// Önce mevcut mesajları temizle
		this.clearMessages(lastElement);

		const messageDiv = document.createElement('div');
		messageDiv.setAttribute('data-message', 'true');
		
		const msgClass = msgType === "error" 
			? 'mt-3 bg-gradient-to-r from-red-50 to-red-100 border-l-3 border-red-500 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow duration-300 dark:from-red-900/30 dark:to-red-800/30 dark:border-red-400' 
			: 'mt-3 bg-gradient-to-r from-green-50 to-green-100 border-l-3 border-green-500 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow duration-300 dark:from-green-900/30 dark:to-green-800/30 dark:border-green-400';
		
		messageDiv.className = msgClass;

		// Ana container div
		const flexDiv = document.createElement('div');
		flexDiv.className = 'flex items-start';

		// SVG icon container
		const iconContainer = document.createElement('div');
		iconContainer.className = msgType === "error" 
			? 'flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3'
			: 'flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3';

		// SVG icon
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'w-4 h-4 text-white');
		svg.setAttribute('fill', 'currentColor');
		svg.setAttribute('viewBox', '0 0 20 20');

		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('fill-rule', 'evenodd');
		path.setAttribute('clip-rule', 'evenodd');

		if (msgType === "error") {
			// Error icon (exclamation mark)
			path.setAttribute('d', 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z');
		} else {
			// Success icon (checkmark)
			path.setAttribute('d', 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z');
		}

		svg.appendChild(path);
		iconContainer.appendChild(svg);

		// Content container
		const contentDiv = document.createElement('div');
		contentDiv.className = 'flex-1 min-w-0';

		// Status text
		const statusP = document.createElement('h3');
		const statusColor = msgType === "error" ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200';
		statusP.className = `${statusColor} font-semibold text-sm mb-1 leading-tight`;
		statusP.textContent = status;

		// Message text
		const messageP = document.createElement('p');
		const messageColor = msgType === "error" ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300';
		messageP.className = `${messageColor} text-xs leading-relaxed break-words`;
		messageP.textContent = message;

		// Element'leri birleştir
		flexDiv.appendChild(iconContainer);
		contentDiv.appendChild(statusP);
		contentDiv.appendChild(messageP);
		flexDiv.appendChild(contentDiv);
		messageDiv.appendChild(flexDiv);

		const formContainer = document.querySelector(lastElement);
		if (formContainer) {
			formContainer.appendChild(messageDiv);
		}
	}
	public showLoadingAnimation(parentSelector: string): void {
		// Önce mevcut mesajları ve loading animasyonlarını temizle
		this.clearMessages(parentSelector);

		const parent = document.querySelector(parentSelector);
		if (!parent) {
			console.warn(`Parent element not found: ${parentSelector}`);
			return;
		}

		// Loading container div
		const loadingDiv = document.createElement('div');
		loadingDiv.setAttribute('role', 'status');
		loadingDiv.className = 'flex flex-col justify-center items-center mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm dark:bg-blue-900/20 dark:border-blue-700';
		loadingDiv.setAttribute('data-loading', 'true');

		// Text first for better visual hierarchy
		const span = document.createElement('span');
		span.className = 'mb-2 text-sm font-semibold text-blue-700 dark:text-green-300';
		span.textContent = t("messages_loading_login");

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('class', 'w-8 h-8 text-blue-200 animate-spin dark:text-blue-600 fill-blue-600');
		svg.setAttribute('viewBox', '0 0 100 101');
		svg.setAttribute('fill', 'none');

		const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path1.setAttribute('d', 'M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z');
		path1.setAttribute('fill', 'currentColor');

		const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path2.setAttribute('d', 'M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z');
		path2.setAttribute('fill', 'currentFill');

		svg.appendChild(path1);
		svg.appendChild(path2);
		loadingDiv.appendChild(span);
		loadingDiv.appendChild(svg);

		parent.appendChild(loadingDiv);
	}

	public hideLoadingAnimation(parentSelector: string): void {
		this.clearMessages(parentSelector);
	}

	public twoFaMessage (
		status: "enable" | "disable",
		success: boolean,
		hostSelector?: string,
		override?: { titleKey?: string; messageKey?: string; icon?: string; theme?: string }
	): void {
		// status: 'enable' | 'disable'
		// Placement rules:
		// - enable false (doğrulama hatası): inline QR kartı altında (#twofa-inline-message)
		// - diğer tüm durumlar: ana kart altı (#twofa-global-message) sayfanın ortasında
		let host: HTMLElement | null = null;
		if (hostSelector) {
			host = document.querySelector(hostSelector) as HTMLElement | null;
		}
		if (!host && status === 'enable' && !success) {
			host = document.querySelector('#twofa-inline-message') as HTMLElement | null;
			if (!host) {
				host = document.createElement('div');
				host.id = 'twofa-inline-message';
				host.className = 'mt-3';
				const qrCard = document.querySelector('[data-action="verify"]')?.closest('div');
				qrCard?.appendChild(host);
			}
		} else if (!host) {
			host = document.querySelector('#twofa-global-message') as HTMLElement | null;
			if (!host) {
				host = document.createElement('div');
				host.id = 'twofa-global-message';
				host.className = 'mt-4 flex justify-center w-full';
				document.body.appendChild(host);
			}
		}
		// Öncekini temizle
		while (host.firstChild) host.removeChild(host.firstChild);

		const wrapper = document.createElement('div');
		wrapper.setAttribute('data-message', 'true');
		wrapper.className = 'relative group rounded-lg px-5 py-4 flex flex-row items-start md:items-center gap-3 shadow-md border w-full max-w-xl overflow-hidden transition-all duration-300 justify-center text-center mx-auto';

		let icon = '';
		let title = '';
		let desc = '';
		let theme = '';

		if (status === 'enable') {
			if (success) {
				icon = '✅';
				title = t("twofa_enable_success_title");
				desc = t("twofa_enable_success_message");
				theme = 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-green-800 dark:text-green-200';
			} else {
				icon = '⚠️';
				title = t("twofa_enable_error_title");
				desc = t("twofa_enable_error_message");
				theme = 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200';
			}
		} else { // disable
			if (success) {
				icon = '🛑';
				title = t("twofa_disable_success_title");
				desc = t("twofa_disable_success_message");
				theme = 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-200';
			} else {
				icon = '❌';
				title = t("twofa_disable_error_title");
				desc = t("twofa_disable_error_message");
				theme = 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200';
			}
		}
		if (override?.titleKey) title = t(override.titleKey);
		if (override?.messageKey) desc = t(override.messageKey);
		if (override?.icon) icon = override.icon;
		if (override?.theme) theme = override.theme;
		wrapper.className += ' ' + theme;

		// Icon
		const iconDiv = document.createElement('div');
		iconDiv.className = 'text-xl leading-none pt-0.5';
		iconDiv.textContent = icon;

		// Content
		const content = document.createElement('div');
		content.className = 'flex-1';
		const h = document.createElement('p');
		h.className = 'font-semibold mb-0.5 text-sm';
		h.textContent = title;
		const p = document.createElement('p');
		p.className = 'text-xs opacity-90 leading-snug';
		p.textContent = desc;
		content.appendChild(h);
		content.appendChild(p);

		// Close btn
		const closeBtn = document.createElement('button');
		closeBtn.type = 'button';
		closeBtn.setAttribute('aria-label', t("common_close"));
		closeBtn.className = 'text-xs px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition';
		closeBtn.textContent = '✕';
		closeBtn.addEventListener('click', () => {
			wrapper.classList.add('opacity-0', 'scale-95');
			setTimeout(() => wrapper.remove(), 250);
		});

		wrapper.appendChild(iconDiv);
		wrapper.appendChild(content);
		wrapper.appendChild(closeBtn);
		host.appendChild(wrapper);

		// Otomatik kaldırma (başarı 6sn, hata 8sn)
		const timeout = success ? 6000 : 8000;
		setTimeout(() => {
			if (!wrapper.isConnected) return;
			wrapper.classList.add('opacity-0', 'scale-95');
			setTimeout(() => wrapper.remove(), 300);
		}, timeout);
	}
}


const messages = new Messages();

export default messages;
