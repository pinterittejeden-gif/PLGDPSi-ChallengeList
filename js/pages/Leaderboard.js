import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="leaderboard-heading">
                    <div>
                        <h1>Ranking graczy</h1>
                    </div>
                    <span class="count-pill">{{ leaderboard.length }} GRACZY</span>
                </div>
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Ranking może być niepełny. Nie udało się wczytać: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in leaderboard" :class="{ podium: i < 3 }">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                    <small>{{ localize(ientry.total) }} pkt</small>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player" v-if="entry">
                        <div class="player-hero">
                            <span class="rank-badge">#{{ selected + 1 }}</span>
                            <div>
                                <span class="eyebrow">ŁĄCZNY WYNIK</span>
                                <h1>{{ entry.user }}</h1>
                                <strong>{{ localize(entry.total) }} pkt</strong>
                            </div>
                        </div>
                        <div class="section-heading" v-if="entry.verified.length > 0">
                            <div><span class="eyebrow">ZWERYFIKOWANE</span><h2>Weryfikacje</h2></div>
                            <span class="count-pill">{{ entry.verified.length }}</span>
                        </div>
                        <table class="table">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <div class="section-heading" v-if="entry.completed.length > 0">
                            <div><span class="eyebrow">UKOŃCZONE</span><h2>Completions</h2></div>
                            <span class="count-pill">{{ entry.completed.length }}</span>
                        </div>
                        <table class="table">
                            <tr v-for="score in entry.completed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <div class="section-heading" v-if="entry.progressed.length > 0">
                            <div><span class="eyebrow">PROGRESS</span><h2>Progresy</h2></div>
                            <span class="count-pill">{{ entry.progressed.length }}</span>
                        </div>
                        <table class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return this.leaderboard[this.selected] || null;
        },
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.err = err;
        // Hide loading spinner
        this.loading = false;
    },
    methods: {
        localize,
    },
};
