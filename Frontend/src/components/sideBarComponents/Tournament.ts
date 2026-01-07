import "./Game/Game";

// Tournament route now redirects to Game component which handles tournament mode
class Tournament extends HTMLElement {
	connectedCallback(): void {
		// Replace this element with the game component
		const gameComponent = document.createElement('game-component');
		this.replaceWith(gameComponent);
	}
}

customElements.define("tournament-component", Tournament);
export { Tournament };
