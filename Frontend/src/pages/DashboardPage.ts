class DashboardPage extends HTMLElement {
    constructor() {
        super();
        this.render();
    }

    private render(): void {
        this.innerHTML = `
            <div class="dashboard-page">
                <dashboard-component></dashboard-component>
            </div>
        `;
    }
}

customElements.define("dashboard-page", DashboardPage);