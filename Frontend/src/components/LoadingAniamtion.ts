class LoadingAnimation extends HTMLElement {
	connectedCallback(): void {
		this.render();
	}

	private render(): void {
		this.innerHTML = `
			<style>
				@keyframes loading-l1 {
					0% { top: 0%; }
					10% { top: -20%; }
					20% { top: 0%; }
					30% { top: 40%; }
					40% { top: 0%; }
					50% { top: 30%; }
					60% { top: 40%; }
					70% { top: 60%; }
					80% { top: -10%; }
					90% { top: 10%; }
					100% { top: 0%; }
				}
				@keyframes loading-l2 {
					0% { bottom: 0%; }
					10% { bottom: -20%; }
					20% { bottom: 40%; }
					30% { bottom: 60%; }
					40% { bottom: 20%; }
					50% { bottom: 30%; }
					60% { bottom: 40%; }
					70% { bottom: 60%; }
					80% { bottom: -10%; }
					90% { bottom: 10%; }
					100% { bottom: 0%; }
				}
				@keyframes loading-ball {
					0% { top: 80%; left: 96%; }
					10% { top: 10%; left: 3%; }
					20% { top: 10%; left: 90%; }
					30% { top: 60%; left: 3%; }
					40% { top: 10%; left: 90%; }
					50% { top: 50%; left: 3%; }
					60% { top: 10%; left: 90%; }
					70% { top: 93%; left: 3%; }
					80% { top: 83%; left: 90%; }
					90% { top: 10%; left: 3%; }
					100% { top: 80%; left: 90%; }
				}
				@keyframes glow-pulse {
					0%, 100% { opacity: 0.85; }
					50% { opacity: 1; }
				}
				.loading-paddle {
					background: rgba(226, 232, 240, 0.95);
					border-radius: 5px;
					box-shadow: 0 0 15px rgba(226, 232, 240, 0.4), 0 0 25px rgba(148, 163, 184, 0.2);
				}
				.loading-ball-element {
					background: rgba(241, 245, 249, 0.98);
					box-shadow: 0 0 12px rgba(226, 232, 240, 0.5), 0 0 20px rgba(148, 163, 184, 0.3);
					animation: loading-ball 4s linear infinite, glow-pulse 1.5s ease-in-out infinite;
				}
				.loading-l1 { animation: loading-l1 4s linear infinite; }
				.loading-l2 { animation: loading-l2 4s linear infinite; }
			</style>
			<div class="w-full flex items-center justify-center" role="status" aria-live="polite">
				<div class="relative flex items-center justify-around w-[250px] h-[100px]">
					<div class="absolute left-0 w-[12px] h-[65px] loading-paddle loading-l1"></div>
					<div class="absolute w-[14px] h-[14px] rounded-full loading-ball-element"></div>
					<div class="absolute right-0 w-[12px] h-[65px] loading-paddle loading-l2"></div>
				</div>
			</div>
		`;
	}
}

customElements.define("loading-animation", LoadingAnimation);
