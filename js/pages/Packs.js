import { store } from "../main.js";
import { listPoints } from "../score.js";
import { fetchPacks, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";

export default {
    components: { Spinner },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-packs">
            <div class="packs-list">
                <div class="panel-heading">
                    <div><h2>Packs</h2></div>
                    <span class="count-pill">{{ packs.length }} PACKÓW</span>
                </div>
                <template v-for="tier in orderedTiers" :key="tier.key">
                    <div class="pack-tier" :class="'tier-' + tier.key">{{ tier.name }}</div>
                    <table class="list">
                        <tr v-for="pack in packsByTier(tier.key)" :class="{ active: selected === pack.id }">
                            <td class="level">
                                <button @click="selected = pack.id">
                                    <span class="tier-dot" :class="'tier-' + pack.tier"></span>
                                    <span class="type-label-lg">{{ pack.name }}</span>
                                </button>
                            </td>
                            <td class="rank"><p class="type-label-lg">+{{ pack.points }}</p></td>
                        </tr>
                    </table>
                </template>
                <p v-if="!packs.length" class="pack-empty">Nie ma jeszcze żadnych packów.</p>
            </div>
            <div class="packs-detail">
                <div v-if="pack" class="pack" :class="'tier-' + pack.tier">
                    <div class="level-kicker">
                        <span class="rank-badge tier-badge">{{ pack.tierName || pack.tier }}</span>
                        <span>{{ pack.points }} PKT</span>
                    </div>
                    <h1>{{ pack.name }}</h1>
                    <div class="section-heading">
                        <div><span class="eyebrow">LEVELE</span><h2>{{ packLevels.length }}</h2></div>
                    </div>
                    <table class="pack-levels">
                        <tr v-for="lvl in packLevels">
                            <td class="pos">#{{ lvl.rank }}</td>
                            <td class="name"><router-link :to="{ path: '/', query: { level: lvl.path } }">{{ lvl.name }}</router-link></td>
                            <td class="pts">+{{ lvl.points }}</td>
                        </tr>
                    </table>
                    <div class="section-heading">
                        <div><span class="eyebrow">VICTORS</span><h2>{{ victors.length }}</h2></div>
                    </div>
                    <ol class="pack-victors">
                        <li v-for="v in victors"><router-link :to="{ path: '/leaderboard', query: { player: v } }">{{ v }}</router-link></li>
                    </ol>
                    <p v-if="!victors.length" class="pack-empty">Nikt jeszcze nie ukończył tego packu.</p>
                </div>
                <div v-else class="pack pack-placeholder">
                    <p>Wybierz pack z listy po lewej.</p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        packs: [],
        tiers: [],
        list: [],
        loading: true,
        selected: null,
        store,
    }),
    computed: {
        orderedTiers() {
            if (this.tiers.length) return this.tiers;
            const seen = [];
            this.packs.forEach((pack) => {
                if (!seen.find((t) => t.key === pack.tier)) {
                    seen.push({ key: pack.tier, name: pack.tierName || pack.tier });
                }
            });
            return seen;
        },
        pack() {
            return this.packs.find((p) => p.id === this.selected) || null;
        },
        packLevels() {
            if (!this.pack) return [];
            const total = this.list.length;
            return (this.pack.levels || []).map((path) => {
                const index = this.list.findIndex(([level]) => level && level.path === path);
                const level = index >= 0 ? this.list[index][0] : null;
                return {
                    name: level ? level.name : path,
                    path,
                    rank: index + 1,
                    points: index >= 0 ? listPoints(index + 1, total) : 0,
                    link: level ? level.verification : "#",
                };
            });
        },
        victors() {
            if (!this.pack) return [];
            const paths = this.pack.levels || [];
            const counts = {};
            const names = {};
            this.list.forEach(([level]) => {
                if (!level || !paths.includes(level.path)) return;
                const done = new Set([level.verifier, ...(level.records || []).filter((r) => r.percent === 100).map((r) => r.user)]);
                done.forEach((user) => {
                    const key = String(user || "").toLowerCase();
                    if (!key) return;
                    names[key] = names[key] || user;
                    counts[key] = (counts[key] || 0) + 1;
                });
            });
            return Object.keys(counts)
                .filter((key) => counts[key] === paths.length)
                .map((key) => names[key]);
        },
    },
    methods: {
        packsByTier(key) {
            return this.packs
                .filter((pack) => pack.tier === key)
                .sort((a, b) => (Number(a.points) || 0) - (Number(b.points) || 0));
        },
    },
    async mounted() {
        const [list, packsData] = await Promise.all([fetchList(), fetchPacks()]);
        this.list = list || [];
        this.packs = packsData.packs;
        this.tiers = packsData.tiers;
        const wanted = this.$route.query.pack;
        if (wanted && this.packs.find((p) => p.id === wanted)) this.selected = wanted;
        else if (this.packs.length) this.selected = this.packs[0].id;
        this.loading = false;
    },
};
