import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <div class="panel-heading">
                    <div>
                        <h2>Lista</h2>
                    </div>
                    <span class="count-pill">{{ list?.length || 0 }} LEVELI</span>
                </div>
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in list" :class="{ podium: i < 3 }">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <div class="level-kicker">
                        <span class="rank-badge">#{{ selected + 1 }}</span>
                        <span>{{ selected + 1 <= 75 ? 'MAIN LIST' : selected + 1 <= 150 ? 'EXTENDED LIST' : 'LEGACY' }}</span>
                    </div>
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <div class="video-shell">
                        <iframe class="video" id="videoframe" :src="video" title="Wideo levelu" loading="lazy" allowfullscreen></iframe>
                    </div>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Punkty za 100%</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID levelu</div>
                            <p>{{ level.id }}</p>
                        </li>
                    </ul>
                    <div class="section-heading">
                        <div>
                            <span class="eyebrow">ZWERYFIKOWANE RUNY</span>
                            <h2>Rekordy</h2>
                        </div>
                        <span class="count-pill">{{ level.records.length }}</span>
                    </div>
                    <p class="qualification" v-if="selected + 1 <= 75">Próg kwalifikacyjny: <strong>{{ level.percentToQualify }}%</strong></p>
                    <p class="qualification" v-else-if="selected +1 <= 150">Próg kwalifikacyjny: <strong>100%</strong></p>
                    <p class="qualification" v-else>Ten level nie przyjmuje już nowych rekordów.</p>
                    <table class="records" v-if="level.records.length">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <span v-if="record.mobile" class="mobile-badge">
                                    <img :src="\`assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="">
                                    MOBILE
                                </span>
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                    <div class="empty-state" v-else>
                        <strong>Brak rekordów</strong>
                        <span>Bądź pierwszą osobą, która ukończy ten level.</span>
                    </div>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <h3>PLGDPSi Challenge List</h3>
                        <p class="type-label-md">Challenge'e i ich rekordy.</p>
                    </div>
                    <template v-if="editors">
                        <div class="section-heading compact">
                            <div>
                                <span class="eyebrow">ZESPÓŁ</span>
                                <h3>Opiekunowie listy</h3>
                            </div>
                        </div>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <div class="section-heading compact">
                        <div>
                            <span class="eyebrow">ZASADY</span>
                            <h3>Wymagania rekordu</h3>
                        </div>
                    </div>
                    <ol class="requirements">
                        <li>Sprawdź ID, run musi pochodzić z dokładnie tej wersji levelu, która widnieje na liście.</li>
                        <li>Nagranie musi zawierać dźwięk z gry albo kliknięcia/tapy. Sam edytowany dźwięk nie wystarczy.</li>
                        <li>Pokaż poprzednią próbę i pełną animację śmierci przed ukończeniem, chyba że completion było za pierwszym podejściem.</li>
                        <li>Nagranie musi pokazywać cały endscreen.</li>
                        <li>Secret routes, bug routes oraz easy mode są niedozwolone.</li>
                        <li>Po spadku levelu do Legacy rekordy przyjmujemy jeszcze przez 24 godziny.</li>
                    </ol>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        level() {
            return this.list?.[this.selected]?.[0] || null;
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
    },
};
