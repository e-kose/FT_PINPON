import { LocalizedComponent } from "../base/LocalizedComponent";
import { t } from "../../i18n/lang";

class Tournament extends LocalizedComponent {
	protected renderComponent(): void {
		this.innerHTML = `
			<div class="p-8">
				<h1 class="text-2xl font-bold">${t("placeholder_tournament_title")}</h1>
				<p class="text-gray-600 dark:text-gray-400 mt-2">${t("placeholder_tournament_description")}</p>
			</div>
		`;
	}
}

customElements.define("tournament-component", Tournament);
export { Tournament };
