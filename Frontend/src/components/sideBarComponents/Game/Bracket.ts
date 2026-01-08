import { LocalizedComponent } from "../../base/LocalizedComponent";
import { t } from "../../../i18n/lang";
import { getUser } from "../../../store/UserStore";
import { gameWebSocketService } from "../../../services/GameWebSocketService";
import type { TournamentData, TournamentRound, GameMatch } from "../../../types/GameTypes";

export class Bracket extends LocalizedComponent {
	private tournamentData: TournamentData | null = null;

	protected renderComponent(): void {
		this.innerHTML = `
      <div class="flex flex-col items-center justify-start w-full h-full p-8 pt-24 space-y-8">
        <div id="bracketHeader" class="text-center space-y-4 z-10">
          <h2 class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-[0.2em] uppercase filter drop-shadow-[0_0_15px_rgba(0,243,255,0.3)]">
            ${t("game_bracket_title")}
          </h2>
          <div id="statusMessage" class="text-xl font-medium tracking-widest text-blue-200/80 min-h-[2rem]"></div>
          <div id="actionButtons" class="flex gap-4 justify-center hidden">
          </div>
        </div>

        <div id="bracketContainer" class="flex gap-12 overflow-x-auto w-full justify-start md:justify-center items-start p-12 custom-scrollbar min-h-[500px]">
           <div class="flex flex-col items-center justify-center h-64 w-full">
               <div class="relative mb-6">
                   <div class="w-16 h-16 sm:w-20 sm:h-20 border-4 border-violet-200/20 border-t-violet-500 rounded-full animate-spin"></div>
                   <div class="absolute inset-0 flex items-center justify-center">
                       <span class="text-2xl sm:text-3xl animate-pulse">🏆</span>
                   </div>
               </div>
               <p class="text-base font-medium text-blue-300/80 mb-3">${t("game_bracket_initializing")}</p>
               <div class="flex items-center gap-1.5">
                   <span class="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style="animation-delay: 0ms;"></span>
                   <span class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 150ms;"></span>
                   <span class="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" style="animation-delay: 300ms;"></span>
               </div>
           </div>
        </div>
      </div>
    `;
	}

	protected afterRender(): void {
		if (this.tournamentData) {
			this.renderBracket(this.tournamentData);
		}
	}

	private isCleanupActive: boolean = false;

	public updateStatus(message: string, showAction: boolean = false, actionType: 'leave' | 'return' = 'leave'): void {
		if (this.isCleanupActive) return;

		const statusEl = this.querySelector('#statusMessage');
		const actionsEl = this.querySelector('#actionButtons');

		if (statusEl) {
			statusEl.textContent = message;
			statusEl.className = "text-xl font-bold tracking-wider animate-pulse transition-colors duration-300";
			if (message.includes(t('game_status_victory')) || message.includes("CHAMPION")) statusEl.className += " text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]";
			else if (message.includes("Eliminated") || message.includes("ELIMINATED")) statusEl.className += " text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]";
			else statusEl.className += " text-blue-300/80";
		}

		if (actionsEl) {
			if (showAction) {
				actionsEl.classList.remove('hidden');

				if (actionType === 'return') {
					actionsEl.innerHTML = '';
					this.createReturnButton(actionsEl);
				} else {
					// Leave button logic (unchanged)
					actionsEl.innerHTML = '';
					const btn = document.createElement('button');
					btn.className = "group relative px-6 py-2 bg-red-500/10 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all duration-300 uppercase tracking-widest font-bold text-xs cursor-pointer overflow-hidden";
					btn.innerHTML = `<span class="relative z-10">${t('game_bracket_leave')}</span><div class="absolute inset-0 bg-red-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>`;
					btn.onclick = () => this.leaveTournament();
					actionsEl.appendChild(btn);
				}
			} else {
				actionsEl.classList.add('hidden');
				actionsEl.innerHTML = '';
			}
		}
	}

	private createReturnButton(container: Element): void {
		const btn = document.createElement('button');
		btn.className = "group relative px-8 py-3 bg-cyan-500/10 border border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300 uppercase tracking-widest font-bold text-sm cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]";
		btn.innerHTML = `
			<span class="relative z-10 flex items-center gap-2">
				${t('game_bracket_return')}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
				</svg>
			</span>
		`;
		btn.onclick = () => this.returnToDashboard();
		container.appendChild(btn);
	}

	public renderBracket(tournament: TournamentData): void {
		this.tournamentData = tournament;
		const container = this.querySelector('#bracketContainer');
		if (!container) return;

		container.innerHTML = '';

		const rounds = tournament.bracket.rounds;
		const currentUsername = getUser()?.username;

		rounds.forEach((round: TournamentRound, rIndex: number) => {
			const roundCol = document.createElement('div');
			roundCol.className = "flex flex-col justify-start h-full min-w-[280px] z-10";

			const roundTitle = document.createElement('h3');
			roundTitle.className = "text-center text-cyan-400 font-black tracking-[0.2em] mb-8 uppercase text-xs shadow-cyan-500/50 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]";
			roundTitle.textContent = this.getRoundName(rIndex, rounds.length);
			roundCol.appendChild(roundTitle);

			const matchesContainer = document.createElement('div');
			matchesContainer.className = "flex flex-col justify-around flex-grow space-y-8";
			roundCol.appendChild(matchesContainer);

			round.matches.forEach((match: GameMatch) => {
				const matchCard = document.createElement('div');

				let cardBase = "flex flex-col w-full relative transition-all duration-300 backdrop-blur-md";
				let borderColor = "border-white/5";
				let bgColor = "bg-[#0a0a0a]/80";
				let shadow = "";
				let statusIndicator = "";

				if (match.status === 'in_progress') {
					borderColor = "border-cyan-500/50";
					bgColor = "bg-black/90";
					shadow = "shadow-[0_0_20px_rgba(6,182,212,0.15)]";
					statusIndicator = `<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-black border border-cyan-500 text-cyan-400 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(6,182,212,0.3)] z-20">${t('game_bracket_status_live')}</div>`;
				} else if (match.status === 'scheduled') {
					borderColor = "border-yellow-500/30";
					statusIndicator = `<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-black border border-yellow-500/50 text-yellow-500/80 text-[10px] font-bold tracking-widest uppercase z-20">${t('game_bracket_status_next')}</div>`;
				} else if (match.status === 'finished') {
					borderColor = "border-white/10";
					bgColor = "bg-black/40";
				}

				const isUserMatch = match.player1Username == currentUsername || match.player2Username == currentUsername;
				if (isUserMatch) {
					borderColor = match.status === 'in_progress' ? "border-cyan-400" : "border-white/20";
					bgColor = "bg-white/5";
				}

				matchCard.className = `${cardBase} ${bgColor} border ${borderColor} ${shadow} p-0 group relative mt-4`;

				const p1Name = match.player1Username || "---";
				const p2Name = match.player2Username || "---";

				const p1Winner = !!(match.winnerId && match.winnerId === match.player1Id);
				const p2Winner = !!(match.winnerId && match.winnerId === match.player2Id);

				const rowBase = "flex justify-between items-center px-4 py-3 border-b border-white/5 last:border-0 relative transition-colors duration-300 first:rounded-t-lg last:rounded-b-lg";

				const getPlayerRow = (name: string, isWinner: boolean, id: string | null) => {
					let textClass = "text-white/40";
					let bgHighlight = "";

					if (id) {
						if (isWinner) {
							textClass = "text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]";
							bgHighlight = `<div class="absolute inset-0 bg-cyan-500/5"></div>`;
						} else if (match.status === 'finished') {
							textClass = "text-white/20 line-through decoration-white/10";
						} else {
							textClass = "text-white/90";
						}
					}

					return `
						<div class="${rowBase}">
							${bgHighlight}
							<div class="flex items-center w-full z-10">
								<span class="text-xs tracking-widest uppercase truncate w-full ${textClass}">${name}</span>
							</div>
							${isWinner ? `<span class="text-[10px] font-black text-black bg-cyan-400 px-1.5 py-0.5 z-10 shadow-[0_0_10px_rgba(34,211,238,0.5)] shrink-0 ml-2">${t('game_bracket_status_win')}</span>` : ''}
						</div>
					`;
				};

				matchCard.innerHTML = `
					${statusIndicator}
					${getPlayerRow(p1Name, p1Winner, match.player1Id)}
					${getPlayerRow(p2Name, p2Winner, match.player2Id)}
				`;

				matchesContainer.appendChild(matchCard);
			});

			container.appendChild(roundCol);


		});
	}

	private getRoundName(index: number, total: number): string {
		if (index === total - 1) return t('game_bracket_round_final');
		if (index === total - 2) return t('game_bracket_round_semi');
		if (index === total - 3) return t('game_bracket_round_quarter');
		return t('game_bracket_round_n', { round: index + 1 });
	}

	private leaveTournament(): void {
		gameWebSocketService.sendMessage('LEAVE_TOURNAMENT');
	}

	private returnToDashboard(): void {
		this.dispatchEvent(new CustomEvent('return-dashboard', { bubbles: true, composed: true }));
	}
}

customElements.define("game-bracket", Bracket);
