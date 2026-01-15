import { LocalizedComponent } from "../../base/LocalizedComponent";
import { t } from "../../../i18n/lang";
import { getUser } from "../../../store/UserStore";
import { gameWebSocketService } from "../../../services/GameWebSocketService";
import type { TournamentData, TournamentRound, GameMatch } from "../../../types/GameTypes";

type BadgeTone = "info" | "success" | "danger" | "warning" | "live";
type BadgeSize = "sm" | "md";

export class Bracket extends LocalizedComponent {
	private tournamentData: TournamentData | null = null;

	protected renderComponent(): void {
		this.innerHTML = `
			<div class="w-full min-h-full flex flex-col items-center px-4 sm:px-6 lg:px-8 py-8 text-slate-900 dark:text-slate-100">
				<div id="bracketHeader" class="w-full max-w-5xl mb-6">
					<div class="rounded-3xl border-2 border-amber-200/70 dark:border-amber-500/30 bg-gradient-to-br from-white via-amber-50/40 to-white dark:from-slate-900/80 dark:via-amber-950/20 dark:to-slate-900/80 shadow-lg shadow-amber-500/10 dark:shadow-black/40 p-6 sm:p-7">
						<div class="flex flex-col items-center gap-4 text-center">
							<div class="flex items-center gap-4 min-w-0">
								<div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
									<svg class="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2C13.1 2 14 2.9 14 4V5H16C17.1 5 18 5.9 18 7V8C18 9.65 16.65 11 15 11H14.82C14.4 12.84 12.87 14.14 11 14.14V16H14V18H17V20H7V18H10V16H9V14.14C7.13 14.14 5.6 12.84 5.18 11H5C3.35 11 2 9.65 2 8V7C2 5.9 2.9 5 4 5H6V4C6 2.9 6.9 2 8 2H12Z"/>
									</svg>
								</div>
								<div class="min-w-0">
									<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
										${t("game_bracket_title")}
									</h1>
								</div>
							</div>
							<div class="w-full max-w-3xl rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 px-3 py-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center justify-center gap-3">
								<div id="statusMessage" class="w-full sm:w-auto flex flex-wrap items-center justify-center gap-2 min-w-0"></div>
								<div id="actionButtons" class="hidden w-full sm:w-auto flex-wrap items-center justify-center gap-2"></div>
							</div>
						</div>
					</div>
				</div>

				<div id="bracketContainer" class="w-full max-w-6xl flex-1">
					<div class="w-full max-w-xl mx-auto rounded-3xl border border-slate-200/70 dark:border-slate-700/50 bg-white/85 dark:bg-slate-900/60 p-8 sm:p-10 text-center flex flex-col items-center gap-4">
						<div class="w-12 h-12 border-2 border-slate-300/70 dark:border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
						<p class="text-sm text-slate-500 dark:text-slate-400">${t("game_bracket_initializing")}</p>
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

	public updateStatus(
		message: string,
		showAction: boolean = false,
		actionType: 'leave' | 'return' = 'leave',
		variant: 'info' | 'success' | 'danger' = 'info'
	): void {
		if (this.isCleanupActive) return;

		const statusEl = this.querySelector('#statusMessage');
		const actionsEl = this.querySelector('#actionButtons');

		if (statusEl) {
			statusEl.className = "w-full sm:w-auto flex flex-wrap items-center justify-center gap-2 min-w-0";
			statusEl.innerHTML = this.renderStatusBadge(message, variant, "md");
		}

		if (actionsEl) {
			if (showAction) {
				actionsEl.classList.remove('hidden');
				actionsEl.innerHTML = '';
				
				const btn = document.createElement('button');
				
				if (actionType === 'return') {
					btn.className = this.getActionButtonClasses('return');
					btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l9-9 9 9"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10v10h14V10"></path></svg><span>${t('game_bracket_return')}</span>`;
					btn.onclick = () => this.returnToDashboard();
				} else {
					btn.className = this.getActionButtonClasses('leave');
					btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h4a2 2 0 012 2v4"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10v8a2 2 0 01-2 2h-4"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 12h10"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 12l3-3m-3 3l3 3"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3H7a2 2 0 00-2 2v14a2 2 0 002 2h8"></path></svg><span>${t('game_bracket_leave')}</span>`;
					btn.onclick = () => this.leaveTournament();
				}
				
				actionsEl.appendChild(btn);
			} else {
				actionsEl.classList.add('hidden');
				actionsEl.innerHTML = '';
			}
		}
	}

	public renderBracket(tournament: TournamentData): void {
		this.tournamentData = tournament;
		const container = this.querySelector('#bracketContainer');
		if (!container) return;

		const rounds = tournament.bracket.rounds;
		const currentUsername = getUser()?.username;
		const roundCount = rounds.length;

		// Create bracket grid
		container.innerHTML = '';
		const bracketGrid = document.createElement('div');
		bracketGrid.className = "grid gap-5 sm:gap-6 lg:gap-8 w-full items-start justify-items-center";
		bracketGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
		container.appendChild(bracketGrid);

		rounds.forEach((round: TournamentRound, rIndex: number) => {
			const roundCol = document.createElement('div');
			roundCol.className = "flex flex-col gap-3 min-w-0 w-full";

			// Round Header
			const roundHeader = document.createElement('div');
			roundHeader.className = "flex items-center justify-center";
			roundHeader.innerHTML = this.renderRoundBadge(this.getRoundName(rIndex, roundCount));
			roundCol.appendChild(roundHeader);

			// Matches Container
			const matchesContainer = document.createElement('div');
			matchesContainer.className = "flex flex-col gap-4";
			roundCol.appendChild(matchesContainer);

			round.matches.forEach((match: GameMatch) => {
				const matchCard = document.createElement('div');
				const card = this.renderMatchCard(match, currentUsername);
				matchCard.className = card.className;
				matchCard.innerHTML = card.content;

				matchesContainer.appendChild(matchCard);
			});

			bracketGrid.appendChild(roundCol);
		});
	}

	private getRoundName(index: number, total: number): string {
		if (index === total - 1) return t('game_bracket_round_final');
		if (index === total - 2) return t('game_bracket_round_semi');
		if (index === total - 3) return t('game_bracket_round_quarter');
		return t('game_bracket_round_n', { round: index + 1 });
	}

	private getBadgeClasses(tone: BadgeTone, size: BadgeSize): string {
		const base = "inline-flex items-center gap-2 rounded-full border font-semibold leading-snug max-w-full whitespace-normal break-words";
		const sizeClass = size === "sm"
			? "text-[10px] px-2.5 py-1 uppercase tracking-[0.25em]"
			: "text-[11px] sm:text-xs px-3 py-1";
		const toneClass = {
			info: "bg-gradient-to-r from-slate-100/90 to-slate-50/80 dark:from-slate-800/70 dark:to-slate-900/70 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-200",
			success: "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-400/50 text-emerald-700 dark:text-emerald-300",
			danger: "bg-gradient-to-r from-rose-500/20 to-pink-500/10 border-rose-400/50 text-rose-700 dark:text-rose-300",
			warning: "bg-gradient-to-r from-amber-500/25 to-orange-500/10 border-amber-400/60 text-amber-700 dark:text-amber-300",
			live: "bg-gradient-to-r from-cyan-500/25 to-sky-500/10 border-cyan-400/60 text-cyan-700 dark:text-cyan-300"
		}[tone];
		return `${base} ${sizeClass} ${toneClass}`;
	}

	private getBadgeIcon(tone: BadgeTone): string {
		if (tone === "success") {
			return `<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
		}
		if (tone === "danger") {
			return `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
		}
		if (tone === "warning") {
			return `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M12 2a10 10 0 1010 10A10 10 0 0012 2z"/></svg>`;
		}
		return `<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C13.1 2 14 2.9 14 4V5H16C17.1 5 18 5.9 18 7V8C18 9.65 16.65 11 15 11H14.82C14.4 12.84 12.87 14.14 11 14.14V16H14V18H17V20H7V18H10V16H9V14.14C7.13 14.14 5.6 12.84 5.18 11H5C3.35 11 2 9.65 2 8V7C2 5.9 2.9 5 4 5H6V4C6 2.9 6.9 2 8 2H12Z"/></svg>`;
	}

	private renderStatusBadge(label: string, tone: BadgeTone, size: BadgeSize = "md", pulse: boolean = false): string {
		const dot = pulse ? `<span class="w-1.5 h-1.5 rounded-full bg-current/80 animate-pulse"></span>` : "";
		const icon = size === "md" ? this.getBadgeIcon(tone) : "";
		return `<span class="${this.getBadgeClasses(tone, size)}">${dot}${icon}<span class="min-w-0 break-words whitespace-normal">${label}</span></span>`;
	}

	private renderRoundBadge(label: string): string {
		return `<span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200/70 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/20 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-200">${label}</span>`;
	}

	private renderPlayerRow(name: string, isWinner: boolean, playerId: string | null, isFinished: boolean): string {
		const isEmpty = !playerId;
		const winnerBadge = isWinner ? this.renderStatusBadge(t('game_bracket_status_win'), "success", "sm") : "";
		let nameClass = "text-sm font-semibold leading-snug break-words whitespace-normal";

		if (isEmpty) {
			nameClass += " text-slate-400 dark:text-slate-500 italic";
		} else if (isWinner) {
			nameClass += " text-emerald-700 dark:text-emerald-300";
		} else if (isFinished) {
			nameClass += " text-slate-500 dark:text-slate-400";
		} else {
			nameClass += " text-slate-800 dark:text-slate-100";
		}

		const initial = name && name !== "—" ? name.charAt(0).toUpperCase() : "?";
		const avatarClass = isWinner
			? "w-9 h-9 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 text-xs font-bold shrink-0"
			: isEmpty
				? "w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-bold shrink-0"
				: "w-9 h-9 rounded-xl bg-slate-200/80 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold shrink-0";

		return `
			<div class="px-4 py-3 min-w-0">
				<div class="flex items-start gap-3 min-w-0">
					<div class="${avatarClass}">${initial}</div>
					<div class="min-w-0 flex-1">
						<div class="${nameClass}">${name}</div>
						${winnerBadge ? `<div class="mt-1">${winnerBadge}</div>` : ""}
					</div>
				</div>
			</div>
		`;
	}

	private renderMatchCard(match: GameMatch, currentUsername?: string): { className: string; content: string } {
		const isLive = match.status === 'in_progress';
		const isNext = match.status === 'scheduled';
		const isFinished = match.status === 'finished';
		const isUserMatch = !!currentUsername && (match.player1Username === currentUsername || match.player2Username === currentUsername);

		let cardClass = "w-full max-w-[360px] mx-auto flex flex-col rounded-2xl border-2 border-[#00f3ff]/60 dark:border-[#00f3ff]/50 bg-gradient-to-br from-white/95 via-slate-50/90 to-white/95 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/80 shadow-md shadow-[#00f3ff]/15 dark:shadow-black/40 transition-colors min-w-0";

		if (isLive) {
			cardClass += " border-[#00f3ff]/80 dark:border-[#00f3ff]/70 bg-gradient-to-br from-[#00f3ff]/20 via-white/95 to-white/95 dark:from-[#00f3ff]/15 dark:via-slate-900/80 dark:to-slate-900/80 shadow-[#00f3ff]/25";
		} else if (isNext) {
			cardClass += " border-[#bd00ff]/70 dark:border-[#bd00ff]/60 bg-gradient-to-br from-[#bd00ff]/16 via-white/95 to-white/95 dark:from-[#bd00ff]/12 dark:via-slate-900/80 dark:to-slate-900/80 shadow-[#bd00ff]/20";
		} else if (isFinished) {
			cardClass += " border-[#bd00ff]/35 dark:border-[#bd00ff]/30 bg-gradient-to-br from-slate-50/90 via-white/95 to-white/95 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/70";
		}

		if (isUserMatch && !isFinished) {
			cardClass += " ring-2 ring-cyan-400/25 ring-offset-2 ring-offset-white dark:ring-offset-slate-950";
		}

		let statusBadge = "";
		if (isLive) {
			statusBadge = this.renderStatusBadge(t('game_bracket_status_live'), "live", "sm", true);
		} else if (isNext) {
			statusBadge = this.renderStatusBadge(t('game_bracket_status_next'), "warning", "sm");
		}

		const p1Name = match.player1Username || "—";
		const p2Name = match.player2Username || "—";
		const p1Winner = !!(match.winnerId && match.winnerId === match.player1Id);
		const p2Winner = !!(match.winnerId && match.winnerId === match.player2Id);

		const statusSection = statusBadge ? `<div class="px-4 pt-4 pb-2">${statusBadge}</div>` : "";
		const rowsSection = `
			<div class="divide-y divide-slate-200/70 dark:divide-slate-700/60">
				${this.renderPlayerRow(p1Name, p1Winner, match.player1Id, isFinished)}
				${this.renderPlayerRow(p2Name, p2Winner, match.player2Id, isFinished)}
			</div>
		`;

		return { className: cardClass, content: `${statusSection}${rowsSection}` };
	}

	private getActionButtonClasses(actionType: 'return' | 'leave'): string {
		const base = "inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
		if (actionType === 'return') {
			return `${base} bg-slate-100/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 focus-visible:ring-slate-400/70 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950`;
		}
		return `${base} bg-rose-500/15 dark:bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 focus-visible:ring-rose-500/60 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950`;
	}

	private leaveTournament(): void {
		gameWebSocketService.sendMessage('LEAVE_TOURNAMENT');
	}

	private returnToDashboard(): void {
		this.dispatchEvent(new CustomEvent('return-dashboard', { bubbles: true, composed: true }));
	}
}

customElements.define("game-bracket", Bracket);
