import { t, getLanguage } from "../../../i18n/lang";
import { LocalizedComponent } from "../../base/LocalizedComponent";
import { getUserStatistic } from "../../../services/GameStatService";
import type { RecentMatch, RecentTournament, UserGameProfile } from "../../../types/GameStatsType";

type GameStatisticsMode = "summary" | "detailed";

class GameStatistics extends LocalizedComponent {
	private profile: UserGameProfile | null = null;
	private loading = true;
	private error: string | null = null;
	private userId: string | null = null;
	private mode: GameStatisticsMode = "summary";

	static get observedAttributes() {
		return ["user-id", "mode"];
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
		if (oldValue === newValue) return;
		if (name === "user-id") {
			this.userId = newValue;
			void this.fetchStatistics();
		}
		if (name === "mode") {
			this.mode = this.resolveMode(newValue);
			this.renderAndBind();
		}
	}

	protected onConnected(): void {
		this.userId = this.getAttribute("user-id");
		this.mode = this.resolveMode(this.getAttribute("mode"));
		void this.fetchStatistics();
	}

	private resolveMode(rawMode: string | null): GameStatisticsMode {
		if (!rawMode) return "summary";
		const normalized = rawMode.toLowerCase();
		if (normalized === "full" || normalized === "detailed") return "detailed";
		if (normalized === "compact" || normalized === "summary") return "summary";
		return "summary";
	}

	private async fetchStatistics(): Promise<void> {
		this.loading = true;
		this.error = null;
		this.renderAndBind();

		try {
			const response = await getUserStatistic(this.userId || undefined);
			if (!response.ok || !response.data.success || !response.data.data) {
				this.error = response.data.error || response.data.message || t("game_stats_error_fetch");
				this.profile = null;
			} else {
				this.profile = response.data.data;
				this.error = null;
			}
		} catch (err) {
			console.error(t("statistics_load_error_log"), err);
			this.error = t("game_stats_error_network");
			this.profile = null;
		} finally {
			this.loading = false;
			this.renderAndBind();
		}
	}

	private parseDate(dateString: string): Date {
		const normalized = dateString.includes("T") ? dateString : dateString.replace(" ", "T");
		const parsed = new Date(normalized);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed;
		}
		return new Date(dateString);
	}

	private formatDateTime(dateString: string): string {
		const date = this.parseDate(dateString);
		const locale = getLanguage() === "tr" ? "tr-TR" : getLanguage() === "ku" ? "ku" : "en-US";
		return new Intl.DateTimeFormat(locale, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		}).format(date);
	}

	protected renderComponent(): void {
		if (this.loading) {
			this.innerHTML = this.renderLoading();
			return;
		}

		if (this.error) {
			this.innerHTML = this.renderError();
			return;
		}

		if (!this.profile) {
			this.innerHTML = this.renderEmpty();
			return;
		}

		const stats = this.profile.stats;
		const recentMatches = this.profile.recentMatches ?? [];
		const recentTournaments = this.profile.recentTournaments ?? [];
		const wins = stats.matchmaking.wins;
		const losses = stats.matchmaking.losses;
		const totalMatches = stats.matchmaking.total;
		const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
		const tournamentTotal = stats.tournaments.total;
		const tournamentWins = stats.tournaments.wins;
		const tournamentRate = tournamentTotal > 0 ? Math.round((tournamentWins / tournamentTotal) * 100) : 0;

		const matchLimit = this.mode === "summary" ? 3 : recentMatches.length;
		const tournamentLimit = this.mode === "summary" ? 2 : recentTournaments.length;
		const limitedMatches = recentMatches.slice(0, matchLimit);
		const limitedTournaments = recentTournaments.slice(0, tournamentLimit);

		this.innerHTML = `
			<section class="bg-gradient-to-br from-white/95 via-slate-50/90 to-white/95 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-4 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
				
				<!-- Header Section -->
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8 min-w-0">
					<div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
						<div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-purple-500/30 flex items-center justify-center transform hover:scale-105 transition-transform">
							<span class="text-2xl sm:text-3xl">🏓</span>
						</div>
						<div class="min-w-0 flex-1">
							<h2 class="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent truncate">${t("game_stats_title")}</h2>
							<p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 min-w-0 leading-tight break-words">
								<span>📊</span> ${t("game_stats_subtitle")}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2 flex-shrink-0">
						<button data-refresh="true" class="group bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-600/60 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 min-h-[42px] flex items-center gap-2">
							<span class="group-hover:rotate-180 transition-transform duration-500">🔄</span> ${t("game_stats_refresh")}
						</button>
					</div>
				</div>

				${this.mode === "detailed" ? this.renderUserSummary() : ""}

				<!-- Stats Cards Grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 mb-6 lg:mb-8">
					
					<!-- Matchmaking Stats Card -->
					<div class="group rounded-2xl lg:rounded-3xl border border-emerald-200/50 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-cyan-50/80 dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-cyan-900/30 p-4 sm:p-5 lg:p-6 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 min-w-0">
						<div class="flex items-center justify-between mb-4 lg:mb-5">
							<div class="flex items-center gap-2 min-w-0">
								<span class="text-xl sm:text-2xl">⚔️</span>
								<h3 class="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider truncate">${t("game_stats_matchmaking_label")}</h3>
							</div>
							<span class="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-center leading-tight whitespace-nowrap">${totalMatches} ${t("game_stats_total_matches")}</span>
						</div>
						<div class="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
							<div class="bg-white/60 dark:bg-slate-800/40 rounded-xl p-2 sm:p-3 min-w-0 text-center">
								<div class="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400">${wins}</div>
								<div class="text-[9px] sm:text-[10px] uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 font-semibold mt-1 leading-tight break-words whitespace-normal">${t("game_stats_wins")}</div>
							</div>
							<div class="bg-white/60 dark:bg-slate-800/40 rounded-xl p-2 sm:p-3 min-w-0 text-center">
								<div class="text-xl sm:text-2xl lg:text-3xl font-black text-rose-500 dark:text-rose-400">${losses}</div>
								<div class="text-[9px] sm:text-[10px] uppercase tracking-widest text-rose-500/70 dark:text-rose-400/70 font-semibold mt-1 leading-tight break-words whitespace-normal">${t("game_stats_losses")}</div>
							</div>
							<div class="col-span-2 bg-white/60 dark:bg-slate-800/40 rounded-xl p-4 sm:p-5 min-w-0 flex items-center justify-center">
								<div class="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36">
									<svg class="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
										<circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="7" fill="none" class="text-slate-200 dark:text-slate-700" />
										<circle cx="50" cy="50" r="40" stroke="url(#emeraldGradient)" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 40}" stroke-dashoffset="${2 * Math.PI * 40 * (1 - winRate / 100)}" class="transition-all duration-1000 ease-out" />
										<defs>
											<linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
												<stop offset="50%" style="stop-color:#14b8a6;stop-opacity:1" />
												<stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
											</linearGradient>
										</defs>
									</svg>
									<div class="absolute inset-0 flex flex-col items-center justify-center p-2">
										<span class="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none">${winRate}%</span>
										<span class="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-1.5 text-center leading-tight font-semibold">${t("game_stats_win_rate")}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Tournament Stats Card -->
					<div class="group rounded-2xl lg:rounded-3xl border border-amber-200/50 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 p-4 sm:p-5 lg:p-6 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 min-w-0">
						<div class="flex items-center justify-between mb-4 lg:mb-5">
							<div class="flex items-center gap-2 min-w-0">
								<span class="text-xl sm:text-2xl">🏟️</span>
								<h3 class="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider truncate">${t("game_stats_tournament_summary")}</h3>
							</div>
							<span class="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-center leading-tight whitespace-nowrap">${tournamentTotal} 🏟️</span>
						</div>
						<div class="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
							<div class="bg-white/60 dark:bg-slate-800/40 rounded-xl p-2 sm:p-3 min-w-0 text-center">
								<div class="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400">${tournamentTotal}</div>
								<div class="text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-600/70 dark:text-amber-400/70 font-semibold mt-1 leading-tight break-words whitespace-normal">${t("game_stats_tournaments_played")}</div>
							</div>
							<div class="bg-white/60 dark:bg-slate-800/40 rounded-xl p-2 sm:p-3 min-w-0 text-center">
								<div class="text-xl sm:text-2xl lg:text-3xl font-black text-yellow-600 dark:text-yellow-400">${tournamentWins}</div>
								<div class="text-[9px] sm:text-[10px] uppercase tracking-widest text-yellow-600/70 dark:text-yellow-400/70 font-semibold mt-1 leading-tight break-words whitespace-normal">${t("game_stats_championships")}</div>
							</div>
							<div class="col-span-2 bg-white/60 dark:bg-slate-800/40 rounded-xl p-4 sm:p-5 min-w-0 flex items-center justify-center">
								<div class="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36">
									<svg class="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
										<circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="7" fill="none" class="text-slate-200 dark:text-slate-700" />
										<circle cx="50" cy="50" r="40" stroke="url(#amberGradient)" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 40}" stroke-dashoffset="${2 * Math.PI * 40 * (1 - tournamentRate / 100)}" class="transition-all duration-1000 ease-out" />
										<defs>
											<linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
												<stop offset="50%" style="stop-color:#f97316;stop-opacity:1" />
												<stop offset="100%" style="stop-color:#eab308;stop-opacity:1" />
											</linearGradient>
										</defs>
									</svg>
									<div class="absolute inset-0 flex flex-col items-center justify-center p-2">
										<span class="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-600 dark:text-amber-400 leading-none">${tournamentRate}%</span>
										<span class="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-1.5 text-center leading-tight font-semibold">${t("game_stats_championship_rate")}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Activity Overview Card -->
					<div class="md:col-span-2 xl:col-span-1 group rounded-2xl lg:rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-950 dark:from-slate-950 dark:via-indigo-950 dark:to-blue-950 text-white p-4 sm:p-5 lg:p-6 overflow-hidden relative hover:shadow-2xl hover:shadow-indigo-900/40 transition-all duration-300 min-w-0">
						<div class="absolute inset-0 opacity-10">
							<div class="absolute top-2 right-4 text-5xl sm:text-6xl animate-bounce" style="animation-duration: 3s;">🏓</div>
							<div class="absolute bottom-2 left-4 text-6xl sm:text-7xl animate-pulse">🏟️</div>
							<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5">📊</div>
						</div>
						<div class="relative z-10">
							<div class="flex items-center gap-2 mb-4 lg:mb-5 min-w-0">
								<span class="text-xl sm:text-2xl">📊</span>
								<h3 class="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/90 truncate">${t("game_stats_activity_label")}</h3>
							</div>
							<div class="space-y-3 sm:space-y-4">
								<div class="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
									<div class="flex items-center gap-2 sm:gap-3 min-w-0">
										<span class="text-xl sm:text-2xl">⚔️</span>
										<span class="text-white/90 text-sm sm:text-base font-medium truncate">${t("game_stats_recent_matches")}</span>
									</div>
									<span class="text-xl sm:text-2xl font-black text-white">${recentMatches.length}</span>
								</div>
								<div class="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
									<div class="flex items-center gap-2 sm:gap-3 min-w-0">
										<span class="text-xl sm:text-2xl">🏟️</span>
										<span class="text-white/90 text-sm sm:text-base font-medium truncate">${t("game_stats_recent_tournaments")}</span>
									</div>
									<span class="text-xl sm:text-2xl font-black text-white">${recentTournaments.length}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Recent Activity Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
					
					<!-- Recent Matches Section -->
					<div class="space-y-3 sm:space-y-4 min-w-0">
						<div class="flex items-center justify-between flex-wrap gap-2 min-w-0">
							<h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
								<span class="text-lg sm:text-xl">⚔️</span>
								<span class="truncate">${t("game_stats_recent_matches")}</span>
							</h3>
							<span class="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${t("game_stats_showing_count", { count: limitedMatches.length })}</span>
						</div>
						${limitedMatches.length ? `
							<div class="space-y-2.5 max-h-[350px] sm:max-h-[450px] lg:max-h-[550px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-violet-400/60 hover:scrollbar-thumb-violet-500/80 dark:scrollbar-thumb-purple-600/60 dark:hover:scrollbar-thumb-purple-500/80 scrollbar-track-violet-100/30 dark:scrollbar-track-purple-900/20 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
								${limitedMatches.map(match => this.renderMatchCard(match)).join("")}
							</div>
						` : this.renderEmptyMatches()}
					</div>

					<!-- Recent Tournaments Section -->
					<div class="space-y-3 sm:space-y-4 min-w-0">
						<div class="flex items-center justify-between flex-wrap gap-2 min-w-0">
							<h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
								<span class="text-lg sm:text-xl">🏟️</span>
								<span class="truncate">${t("game_stats_recent_tournaments")}</span>
							</h3>
							<span class="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${t("game_stats_showing_count", { count: limitedTournaments.length })}</span>
						</div>
						${limitedTournaments.length ? `
							<div class="space-y-2.5 max-h-[350px] sm:max-h-[450px] lg:max-h-[550px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-400/60 hover:scrollbar-thumb-amber-500/80 dark:scrollbar-thumb-amber-600/60 dark:hover:scrollbar-thumb-amber-500/80 scrollbar-track-amber-100/30 dark:scrollbar-track-amber-900/20 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
								${limitedTournaments.map(tournament => this.renderTournamentCard(tournament)).join("")}
							</div>
						` : this.renderEmptyTournaments()}
					</div>
				</div>
			</section>
		`;
	}

	protected afterRender(): void {
		this.setupEvents();
	}

	private renderUserSummary(): string {
		if (!this.profile) return "";
		return `
			<div class="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-violet-50/80 via-purple-50/60 to-fuchsia-50/80 dark:from-violet-900/20 dark:via-purple-900/15 dark:to-fuchsia-900/20 border border-violet-200/50 dark:border-violet-800/40 rounded-2xl p-4 sm:p-5">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
						<span class="text-xl sm:text-2xl">👤</span>
					</div>
					<div>
						<div class="text-[10px] sm:text-xs uppercase tracking-widest text-violet-500 dark:text-violet-400 font-semibold">${t("game_stats_user_label")}</div>
						<div class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">@${this.profile.username}</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<span class="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-violet-200/50 dark:border-violet-700/40 text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
						<span>📊</span> ${t("game_stats_activity_label")}
					</span>
				</div>
			</div>
		`;
	}

	private renderMatchCard(match: RecentMatch): string {
		if (!this.profile) return "";
		const currentUserId = String(this.profile.userId);
		const isPlayer1 = String(match.player1.id) === currentUserId;
		const opponent = isPlayer1 ? match.player2 : match.player1;
		const myScore = isPlayer1 ? match.player1.score : match.player2.score;
		const opponentScore = isPlayer1 ? match.player2.score : match.player1.score;
		const isWinner = String(match.winnerId) === currentUserId;
		const resultText = isWinner ? t("last_games_result_win") : t("last_games_result_loss");
		const resultIcon = isWinner ? "🎉" : "😔";
		const resultClass = isWinner
			? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/50 dark:to-teal-900/50 dark:text-emerald-300 border-emerald-300/50 dark:border-emerald-700/50"
			: "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 dark:from-rose-900/50 dark:to-pink-900/50 dark:text-rose-300 border-rose-300/50 dark:border-rose-700/50";
		const cardBorderClass = isWinner
			? "border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700"
			: "border-rose-200/60 dark:border-rose-800/40 hover:border-rose-300 dark:hover:border-rose-700";
		const cardBgClass = isWinner
			? "bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-teal-950/30"
			: "bg-gradient-to-br from-white via-rose-50/30 to-pink-50/50 dark:from-slate-900 dark:via-rose-950/20 dark:to-pink-950/30";

		return `
			<div class="group rounded-xl border ${cardBorderClass} ${cardBgClass} p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all duration-300 min-w-0">
				<div class="flex items-start justify-between gap-2">
					<div class="flex items-center gap-2 min-w-0 flex-1">
						<div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${isWinner ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'} text-white flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 shadow-md ${isWinner ? 'shadow-emerald-500/20' : 'shadow-rose-500/20'}">
							⚔️
						</div>
						<div class="min-w-0 flex-1 overflow-hidden">
							<div class="flex items-center gap-1 mb-0.5">
								<span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide ${isWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} whitespace-nowrap">${t("game_stats_match_memo")}</span>
							</div>
							<p class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-0.5 min-w-0">
								<span class="text-slate-700 dark:text-slate-200 truncate max-w-[40%]">${this.profile.username}</span>
								<span class="text-slate-400 flex-shrink-0">vs</span>
								<span class="text-slate-600 dark:text-slate-300 truncate max-w-[40%]">${opponent.username}</span>
							</p>
						</div>
					</div>
					<div class="flex items-center gap-1 flex-shrink-0">
						<span class="text-base sm:text-lg">${resultIcon}</span>
						<span class="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border ${resultClass} text-center leading-tight max-w-[120px] sm:max-w-none truncate">${resultText}</span>
					</div>
				</div>

				<div class="mt-2 sm:mt-2.5 text-center py-1.5 sm:py-2 bg-white/60 dark:bg-slate-800/40 rounded-lg">
					<div class="text-xl sm:text-2xl lg:text-3xl font-black">
						<span class="${isWinner ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}">${myScore}</span>
						<span class="text-slate-300 dark:text-slate-600 mx-1.5 sm:mx-2">:</span>
						<span class="${!isWinner ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}">${opponentScore}</span>
					</div>
					<div class="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-400 mt-0.5 font-semibold">${t("last_games_final_score")}</div>
				</div>

				<div class="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-xs min-w-0">
					<div class="flex items-center gap-1 text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-2 py-1 rounded-lg min-w-0">
						<span>📅</span>
						<span class="font-medium truncate max-w-[140px] sm:max-w-none">${this.formatDateTime(match.playedAt)}</span>
					</div>
					<div class="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 min-w-0">
						<span>🏅</span>
						<span class="font-bold truncate max-w-[120px] sm:max-w-none">${t("last_games_mode_ranked")}</span>
					</div>
				</div>


			</div>
		`;
	}

	private renderTournamentCard(tournament: RecentTournament): string {
		const participantCount = tournament.participants.length;
		const displayParticipants = tournament.participants.slice(0, 4);
		const remainingCount = participantCount - 4;
		
		const participantList = displayParticipants.map(participant => `
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-50/90 to-amber-50/90 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-800 dark:text-orange-200 text-xs sm:text-sm font-semibold border border-orange-200/60 dark:border-orange-700/50 shadow-sm hover:shadow-md transition-shadow">
				<span class="flex-shrink-0 text-base">👤</span>
				<span class="truncate max-w-[100px] sm:max-w-[120px]">${participant.username}</span>
			</span>
		`).join("");
		
		const moreParticipants = remainingCount > 0 ? `
			<span class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-800/50 dark:to-amber-800/50 text-orange-700 dark:text-orange-300 text-xs sm:text-sm font-bold border border-orange-200/50 dark:border-orange-700/40 shadow-sm">
				+${remainingCount} 
			</span>
		` : "";

		const lastMatch = tournament.myStats.lastMatch;
		const lastMatchResult = lastMatch?.won ? t("game_stats_victory") : t("game_stats_defeat");
		const lastMatchBadge = lastMatch?.won
			? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-300"
			: "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 dark:from-rose-900/40 dark:to-pink-900/40 dark:text-rose-300";
		const lastMatchIcon = lastMatch?.won ? "🎉" : "😔";
		
		const isChampion = tournament.myStats.isChampion;
		const championBadge = isChampion
			? `<span class="inline-flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 dark:from-amber-900/60 dark:via-yellow-900/50 dark:to-amber-900/60 text-amber-700 dark:text-amber-300 text-[10px] sm:text-xs font-bold border border-amber-300/60 dark:border-amber-700/60 shadow-sm min-w-0">
				<span class="text-sm">👑</span>
				<span class="truncate max-w-[120px] sm:max-w-[160px]">${t("game_stats_champion")}</span>
			</span>`
			: `<div class="flex flex-col items-end gap-0.5 min-w-0">
				<span class="inline-flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-700 dark:text-orange-300 text-[10px] sm:text-xs font-semibold border border-orange-300/50 dark:border-orange-700/50 min-w-0">
					<span class="text-sm">🎯</span>
					<span class="truncate max-w-[140px] sm:max-w-[180px]">${t("game_stats_eliminated_round", { round: tournament.myStats.eliminatedInRound + 1 })}</span>
				</span>
			</div>`;

		const cardBgClass = isChampion 
			? "bg-gradient-to-br from-white via-amber-50/40 to-yellow-50/60 dark:from-slate-900 dark:via-amber-950/20 dark:to-yellow-950/30"
			: "bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 dark:from-slate-900 dark:via-orange-950/20 dark:to-amber-950/30";
		const cardBorderClass = isChampion
			? "border-amber-200/60 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700"
			: "border-orange-200/60 dark:border-orange-800/40 hover:border-orange-300 dark:hover:border-orange-700";

		return `
			<div class="group rounded-xl border ${cardBorderClass} ${cardBgClass} p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all duration-300 min-w-0">
				<div class="flex flex-col gap-2.5 sm:gap-3">
					<!-- Header -->
					<div class="flex items-center justify-between gap-2 min-w-0">
						<div class="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
							<div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${isChampion ? 'bg-gradient-to-br from-amber-500 to-yellow-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'} text-white flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0 shadow-md ${isChampion ? 'shadow-amber-500/20' : 'shadow-orange-500/20'}">
								🏟️
							</div>
							<div class="min-w-0 flex-1 overflow-hidden">
								<div class="flex items-center gap-1">
									<span class="text-[10px] sm:text-xs font-black uppercase tracking-wide ${isChampion ? 'text-amber-600 dark:text-amber-400' : 'text-orange-600 dark:text-orange-400'} truncate">${t("game_stats_tournament_size", { size: tournament.size })}</span>
								</div>
								<div class="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
									<span class="flex-shrink-0">📅</span>
									<span class="font-medium truncate">${this.formatDateTime(tournament.finishedAt)}</span>
								</div>
							</div>
						</div>
						<div class="flex-shrink-0">
							${championBadge}
						</div>
					</div>

					<!-- Winner Banner -->
					<div class="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-100/90 via-yellow-100/70 to-amber-100/90 dark:from-amber-900/40 dark:via-yellow-900/30 dark:to-amber-900/40 rounded-lg px-2 py-1.5 sm:py-2 border border-amber-300/50 dark:border-amber-700/40 min-w-0">
						<span class="text-base sm:text-lg flex-shrink-0">🥇</span>
						<div class="flex-1 min-w-0 overflow-hidden">
							<div class="text-[8px] sm:text-[9px] uppercase tracking-wide text-amber-600/80 dark:text-amber-400/80 font-bold whitespace-nowrap">${t("game_stats_winner")}</div>
							<div class="text-[10px] sm:text-xs font-black text-amber-800 dark:text-amber-200 truncate">${tournament.winnerUsername}</div>
						</div>
					</div>

					<!-- Stats Grid -->
					<div class="grid grid-cols-3 gap-1.5 sm:gap-2">
						<div class="bg-white/70 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-200/30 dark:border-slate-700/30 text-center min-w-0">
							<div class="text-lg sm:text-xl font-black text-violet-600 dark:text-violet-400">${tournament.myStats.totalMatches}</div>
							<div class="text-[8px] sm:text-[9px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-bold mt-0.5 leading-tight break-words whitespace-normal">${t("game_stats_total_matches")}</div>
						</div>
						<div class="bg-white/70 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-200/30 dark:border-slate-700/30 text-center min-w-0">
							<div class="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">${tournament.myStats.wins}</div>
							<div class="text-[8px] sm:text-[9px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-bold mt-0.5 leading-tight break-words whitespace-normal">${t("game_stats_wins")}</div>
						</div>
						<div class="bg-white/70 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-200/30 dark:border-slate-700/30 text-center min-w-0">
							<div class="text-lg sm:text-xl font-black text-rose-500 dark:text-rose-400">${tournament.myStats.losses}</div>
							<div class="text-[8px] sm:text-[9px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-bold mt-0.5 leading-tight break-words whitespace-normal">${t("game_stats_losses")}</div>
						</div>
					</div>

					<!-- Participants -->
					<div class="bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 dark:from-orange-900/20 dark:via-amber-900/15 dark:to-yellow-900/20 rounded-lg p-2.5 sm:p-3 border border-orange-200/50 dark:border-orange-700/40 min-w-0">
						<div class="text-[10px] sm:text-xs uppercase tracking-wide text-orange-700 dark:text-orange-400 mb-2 font-bold flex items-center gap-1.5 min-w-0">
							<span class="text-base">👥</span> ${t("game_stats_participants")} <span class="text-orange-600 dark:text-orange-400">(${participantCount})</span>
						</div>
						<div class="flex flex-wrap gap-1.5 sm:gap-2 min-w-0">${participantList}${moreParticipants}</div>
					</div>

					<!-- Last Match -->
					<div class="pt-2 border-t border-slate-200/50 dark:border-slate-700/40 min-w-0">
						<div class="text-[9px] uppercase tracking-wide text-slate-400 mb-1.5 font-bold flex items-center gap-1 min-w-0">
							<span>⚔️</span> ${t("game_stats_last_match")}
						</div>
						${lastMatch ? `
							<div class="flex flex-col gap-1.5 bg-gradient-to-br from-slate-50/80 to-white/60 dark:from-slate-800/60 dark:to-slate-800/40 rounded-lg p-2 border border-slate-200/50 dark:border-slate-700/40 min-w-0">
								<div class="flex items-center justify-between gap-2">
									<div class="flex items-center gap-1.5 min-w-0 flex-1">
										<div class="w-7 h-7 rounded-lg ${lastMatch.won ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'} flex items-center justify-center flex-shrink-0">
											<span class="text-sm">${lastMatchIcon}</span>
										</div>
									<div class="min-w-0 overflow-hidden">
										<div class="text-[10px] font-bold ${lastMatch.won ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'} whitespace-nowrap">${t("game_stats_round_label", { round: lastMatch.round + 1 })}</div>
										<div class="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5 min-w-0">
											<span class="flex-shrink-0">vs</span>
											<span class="font-medium truncate">${lastMatch.opponentUsername}</span>
											</div>
										</div>
									</div>
									<div class="flex items-center gap-1.5 flex-shrink-0">
										<div class="text-xs font-black text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 px-1.5 py-0.5 rounded-lg">
											${lastMatch.myScore} : ${lastMatch.opponentScore}
										</div>
										<span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold ${lastMatchBadge} border">${lastMatchResult}</span>
									</div>
								</div>
							</div>
						` : `
							<p class="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-800/30 rounded-lg px-2 py-1.5 text-center">${t("game_stats_last_match_empty")}</p>
						`}
					</div>
				</div>
			</div>
		`;
	}

	private renderLoading(): string {
		return `
			<div class="bg-gradient-to-br from-white/95 via-slate-50/90 to-white/95 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/95 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-6 sm:p-8">
				<div class="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
					<div class="relative">
						<div class="w-14 h-14 sm:w-16 sm:h-16 border-4 border-violet-200 dark:border-violet-800 border-t-violet-500 dark:border-t-violet-400 rounded-full animate-spin"></div>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-xl sm:text-2xl animate-pulse">🏓</span>
						</div>
					</div>
					<p class="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 mt-5">${t("game_stats_loading")}</p>
					<div class="flex items-center gap-1 mt-2">
						<span class="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style="animation-delay: 0ms;"></span>
						<span class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 150ms;"></span>
						<span class="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" style="animation-delay: 300ms;"></span>
					</div>
				</div>
			</div>
		`;
	}

	private renderError(): string {
		return `
			<div class="bg-gradient-to-br from-white/95 via-rose-50/30 to-white/95 dark:from-slate-900/95 dark:via-rose-950/20 dark:to-slate-900/95 rounded-3xl border border-rose-200/60 dark:border-rose-800/40 p-6 sm:p-8">
				<div class="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
					<div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-rose-500/20">
						<span class="text-3xl sm:text-4xl">😕</span>
					</div>
					<h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">${t("game_stats_error_fetch")}</h3>
					<p class="text-sm text-rose-600 dark:text-rose-400 mb-5 max-w-sm">${this.error}</p>
					<button data-refresh="true" class="group bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 flex items-center gap-2">
						<span class="group-hover:rotate-180 transition-transform duration-500">🔄</span>
						${t("game_stats_retry")}
					</button>
				</div>
			</div>
		`;
	}

	private renderEmpty(): string {
		return `
			<div class="bg-gradient-to-br from-white/95 via-slate-50/90 to-white/95 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/95 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-6 sm:p-8">
				<div class="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
					<div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
						<span class="text-3xl sm:text-4xl">🏓</span>
					</div>
					<h3 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">${t("game_stats_empty_title")}</h3>
					<p class="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">${t("game_stats_empty_description")}</p>
					<div class="flex items-center gap-2 text-slate-400">
						<span>🏓</span>
						<span class="text-xs">Let's play!</span>
						<span>🏓</span>
					</div>
				</div>
			</div>
		`;
	}

	private renderEmptyMatches(): string {
		return `
			<div class="rounded-2xl border-2 border-dashed border-slate-200/70 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 p-6 sm:p-8 text-center">
				<div class="flex flex-col items-center">
					<span class="text-3xl sm:text-4xl mb-3">⚔️</span>
					<p class="text-sm font-medium text-slate-500 dark:text-slate-400">${t("game_stats_empty_matches")}</p>
					<p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Start playing to see your matches here!</p>
				</div>
			</div>
		`;
	}

	private renderEmptyTournaments(): string {
		return `
			<div class="rounded-2xl border-2 border-dashed border-slate-200/70 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 p-6 sm:p-8 text-center">
				<div class="flex flex-col items-center">
					<span class="text-3xl sm:text-4xl mb-3">🏟️</span>
					<p class="text-sm font-medium text-slate-500 dark:text-slate-400">${t("game_stats_empty_tournaments")}</p>
					<p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Join a tournament to compete!</p>
				</div>
			</div>
		`;
	}

	private setupEvents(): void {
		this.querySelector('[data-refresh="true"]')?.addEventListener("click", () => {
			void this.fetchStatistics();
		});
	}
}

customElements.define("game-statistics", GameStatistics);

export default GameStatistics;
