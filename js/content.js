import { round, listPoints } from './score.js';
import { rawDirForRef } from './timemachine.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = 'data';

export async function fetchList(ref = null) {
    const base = ref ? rawDirForRef(ref) : dir;
    const listResult = await fetch(`${base}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${base}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors(ref = null) {
    const base = ref ? rawDirForRef(ref) : dir;
    try {
        const editorsResults = await fetch(`${base}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchPacks(ref = null) {
    const base = ref ? rawDirForRef(ref) : dir;
    try {
        const result = await fetch(`${base}/_packs.json`);
        if (!result.ok) return { tiers: [], packs: [] };
        const data = await result.json();
        return {
            tiers: Array.isArray(data?.tiers) ? data.tiers : [],
            packs: Array.isArray(data?.packs) ? data.packs : [],
        };
    } catch {
        return { tiers: [], packs: [] };
    }
}

export async function fetchLeaderboard(ref = null) {
    const [list, packsData] = await Promise.all([fetchList(ref), fetchPacks(ref)]);
    const errs = [];
    const total = list ? list.length : 0;
    const scoreMap = {};

    (list || []).forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        const full = listPoints(rank + 1, total);
        const minPercent = Number(level.percentToQualify) || 1;
        const entryFor = (name) => {
            const key = Object.keys(scoreMap).find((u) => u.toLowerCase() === name.toLowerCase()) || name;
            scoreMap[key] ??= { verified: [], completed: [], progressed: [], packList: [] };
            return scoreMap[key];
        };

        entryFor(level.verifier).verified.push({
            rank: rank + 1,
            level: level.name,
            score: full,
            link: level.verification,
            path: level.path,
        });

        level.records.forEach((record) => {
            const entry = entryFor(record.user);
            if (record.percent === 100) {
                entry.completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: full,
                    link: record.link,
                    path: level.path,
                });
                return;
            }
            const factor = (record.percent - (minPercent - 1)) / (100 - (minPercent - 1));
            entry.progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: round(Math.max(0, full * factor * (2 / 3))),
                link: record.link,
                path: level.path,
            });
        });
    });

    // Levely ukonczone przez kazdego gracza (do packow)
    const completedPaths = {};
    Object.entries(scoreMap).forEach(([user, scores]) => {
        const set = new Set();
        scores.verified.forEach((v) => set.add(v.path));
        scores.completed.forEach((c) => set.add(c.path));
        completedPaths[user] = set;
    });

    const packs = packsData.packs;
    Object.entries(scoreMap).forEach(([user, scores]) => {
        const set = completedPaths[user];
        packs.forEach((pack) => {
            if (!Array.isArray(pack.levels) || pack.levels.length === 0) return;
            if (pack.levels.every((p) => set.has(p))) {
                scores.packList.push({
                    id: pack.id,
                    name: pack.name,
                    tier: pack.tierName || pack.tier,
                    points: Number(pack.points) || 0,
                });
            }
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed, packList } = scores;
        const levelTotal = [...verified, ...completed, ...progressed].reduce((prev, cur) => prev + cur.score, 0);
        const packTotal = packList.reduce((prev, cur) => prev + cur.points, 0);
        return {
            user,
            total: round(levelTotal + packTotal),
            levelTotal: round(levelTotal),
            packTotal: round(packTotal),
            verified,
            completed,
            progressed,
            packs: packList,
        };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}
