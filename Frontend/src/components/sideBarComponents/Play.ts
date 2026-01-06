import "./Game/Game";

// Play route now redirects to Game component which handles all game modes
class Play extends HTMLElement {
	connectedCallback(): void {
		// Replace this element with the game component
		const gameComponent = document.createElement('game-component');
		this.replaceWith(gameComponent);
	}
}

customElements.define("play-component", Play);
export { Play };
