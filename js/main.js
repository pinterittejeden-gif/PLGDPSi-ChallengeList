import routes from './routes.js';
import { resolveEarliestDate, resolveRefForDate } from './timemachine.js';

const savedTheme = localStorage.getItem('dark');

function formatDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return match ? `${match[3]}.${match[2]}.${match[1]}` : (value || "");
}

export const store = Vue.reactive({
    dark: savedTheme === null ? true : JSON.parse(savedTheme),
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
        document.documentElement.dataset.theme = this.dark ? 'dark' : 'light';
    },
    tm: {
        date: "",
        min: "",
        ref: null,
        activeDate: null,
        loading: false,
        error: "",
        open: false,
    },
    tmMinLabel() {
        return formatDate(this.tm.min);
    },
    async tmApply() {
        const tm = this.tm;
        if (!tm.date) return;
        if (tm.min && tm.date < tm.min) {
            tm.error = `Lista powstała ${this.tmMinLabel()} - nie da się cofnąć wcześniej.`;
            return;
        }
        tm.loading = true;
        tm.error = "";
        try {
            const { sha } = await resolveRefForDate(tm.date);
            tm.ref = sha;
            tm.activeDate = tm.date;
            tm.open = false;
        } catch (error) {
            tm.error = String(error?.message || error);
        } finally {
            tm.loading = false;
        }
    },
    tmReset() {
        const tm = this.tm;
        tm.date = "";
        tm.ref = null;
        tm.activeDate = null;
        tm.error = "";
    },
});

document.documentElement.dataset.theme = store.dark ? 'dark' : 'light';

resolveEarliestDate().then(date => {
    if (date) store.tm.min = date;
});

const app = Vue.createApp({
    data: () => ({ store, today: new Date().toISOString().slice(0, 10) }),
});
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);

app.mount('#app');
