import { LocalizedComponent } from "../../base/LocalizedComponent";
import { getUser } from "../../../store/UserStore";
// import { t } from "../../../i18n/lang";

export class Dashboard extends LocalizedComponent {
    protected renderComponent(): void {
        const user = getUser();
        if (!user) return;

        this.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full max-w-6xl mx-auto p-6 text-gray-100">
                <div class="text-center mb-12">
                    <h2 class="text-4xl md:text-5xl font-bold mb-2">
                        WELCOME, <span class="text-cyan-400">${user.username}</span>
                    </h2>
                    <p class="text-gray-500 tracking-widest text-sm md:text-base">SELECT YOUR BATTLE MODE</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <!-- LOCAL -->
                    <div id="btnLocal" class="mode-card group bg-white/5 border border-white/10 p-8 rounded-2xl cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,243,255,0.1)] transition-all relative overflow-hidden">
                        <span class="text-6xl mb-4 block group-hover:scale-110 transition-transform">🎮</span>
                        <div class="text-2xl font-bold text-cyan-400 mb-1 font-orbitron">LOCAL MATCH</div>
                        <div class="text-sm text-gray-400">1v1 Split Screen</div>
                    </div>

                    <!-- MATCHMAKING -->
                    <div id="btnMatchmaking" class="mode-card group bg-white/5 border border-white/10 p-8 rounded-2xl cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,243,255,0.1)] transition-all relative overflow-hidden">
                        <span class="text-6xl mb-4 block group-hover:scale-110 transition-transform">⚔️</span>
                        <div class="text-2xl font-bold text-cyan-400 mb-1 font-orbitron">RANKED</div>
                        <div class="text-sm text-gray-400">Online Matchmaking</div>
                    </div>

                    <!-- TOURNAMENTS -->
                    <div class="md:col-span-1 grid grid-rows-2 gap-4">
                        <div id="btnTourney4" class="mode-card group bg-white/5 border border-white/10 p-6 rounded-2xl cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,243,255,0.1)] transition-all flex items-center gap-4">
                            <span class="text-4xl">🏆</span>
                            <div>
                                <div class="text-xl font-bold text-cyan-400 font-orbitron">TOURNAMENT (4)</div>
                                <div class="text-xs text-gray-400">Quick Cup</div>
                            </div>
                        </div>
                        <div id="btnTourney8" class="mode-card group bg-white/5 border border-white/10 p-6 rounded-2xl cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,243,255,0.1)] transition-all flex items-center gap-4">
                            <span class="text-4xl">👑</span>
                            <div>
                                <div class="text-xl font-bold text-cyan-400 font-orbitron">TOURNAMENT (8)</div>
                                <div class="text-xs text-gray-400">Grand Prix</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    protected afterRender(): void {
        this.querySelector('#btnLocal')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('mode-select', { detail: { mode: 'local' }, bubbles: true }));
        });
        this.querySelector('#btnMatchmaking')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('mode-select', { detail: { mode: 'matchmaking' }, bubbles: true }));
        });
        this.querySelector('#btnTourney4')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('mode-select', { detail: { mode: 'tournament', size: 4 }, bubbles: true }));
        });
        this.querySelector('#btnTourney8')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('mode-select', { detail: { mode: 'tournament', size: 8 }, bubbles: true }));
        });
    }
}

customElements.define("game-dashboard", Dashboard);
