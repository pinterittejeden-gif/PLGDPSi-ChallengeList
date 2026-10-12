// Kolejnosc tagow jak w AREDL (wg kolejnosci wyswietlania). Przekreslone (wersje/diff) pominiete.
export const TAG_ORDER = [
    "Medium", "Long", "XL", "XXL", "XXL+",
    "2P", "Circles", "Clicksync", "Fast-Paced", "Timings",
    "Chokepoints", "Unbalanced", "Learny", "Memory",
    "High CPS", "Gimmicky", "Flow", "Slow-Paced",
    "Bossfight", "Mirror", "Nerve Control", "Cube", "Ship",
    "Ball", "UFO", "Wave", "Robot", "Spider", "Old Swing",
    "New Swing", "Duals", "Overall",
];

const TAG_INDEX = new Map(TAG_ORDER.map((tag, index) => [tag.toLowerCase(), index]));

export function sortTags(tags) {
    if (!Array.isArray(tags)) return [];
    return tags
        .filter((tag) => typeof tag === "string" && tag.trim())
        .slice()
        .sort((a, b) => {
            const ia = TAG_INDEX.has(a.toLowerCase()) ? TAG_INDEX.get(a.toLowerCase()) : TAG_ORDER.length;
            const ib = TAG_INDEX.has(b.toLowerCase()) ? TAG_INDEX.get(b.toLowerCase()) : TAG_ORDER.length;
            return ia - ib;
        });
}
