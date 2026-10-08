// Time Machine: odtwarzanie listy z wybranego dnia na podstawie historii commitow GitHuba.

export const REPO = {
    owner: "pinterittejeden-gif",
    name: "PLGDPSi-ChallengeList",
    branch: "main",
};

// Dzien powstania listy. Wczesniej repo dziedziczy dane demonlisty, wiec blokujemy te daty.
export const CREATED = "2026-09-25";

function formatDay(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return match ? `${match[3]}.${match[2]}.${match[1]}` : (value || "");
}

const apiBase = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`;
const rawBase = `https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}`;

export function rawDirForRef(ref) {
    return `${rawBase}/${ref}/data`;
}

// Data pierwszego commita listy (dzien powstania listy) - najwczesniejsza mozliwa data.
export async function resolveEarliestDate() {
    const url = `${apiBase}/commits?path=${encodeURIComponent("data/_list.json")}&sha=${encodeURIComponent(REPO.branch)}&per_page=1`;
    let response;
    try {
        response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    } catch {
        return null;
    }
    if (!response.ok) return null;
    const link = response.headers.get("link") || "";
    const lastMatch = /<([^>]+)>;\s*rel="last"/.exec(link);
    let commits = await response.json();
    if (lastMatch) {
        try {
            const lastResponse = await fetch(lastMatch[1], { headers: { Accept: "application/vnd.github+json" } });
            if (lastResponse.ok) commits = await lastResponse.json();
        } catch {
            // zostaje pierwsza strona
        }
    }
    const oldest = Array.isArray(commits) && commits.length ? commits[commits.length - 1] : null;
    const date = oldest?.commit?.committer?.date || oldest?.commit?.author?.date || null;
    const first = date ? String(date).slice(0, 10) : null;
    if (CREATED) return first && first > CREATED ? first : CREATED;
    return first;
}

// Znajduje commit listy najblizszy podanej dacie (YYYY-MM-DD).
export async function resolveRefForDate(dateString) {
    const day = String(dateString).trim();
    if (CREATED && day < CREATED) {
        throw new Error(`Lista powstała ${formatDay(CREATED)} - nie da się cofnąć wcześniej.`);
    }
    const until = `${day}T23:59:59Z`;
    const url = `${apiBase}/commits?path=${encodeURIComponent("data/_list.json")}&sha=${encodeURIComponent(REPO.branch)}&until=${encodeURIComponent(until)}&per_page=1`;
    let response;
    try {
        response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    } catch {
        throw new Error("Brak polaczenia z GitHubem. Sprawdz internet i sprobuj ponownie.");
    }
    if (response.status === 403 || response.status === 429) {
        throw new Error("GitHub chwilowo ogranicza zapytania. Odczekaj minute i sprobuj ponownie.");
    }
    if (!response.ok) {
        throw new Error(`Nie udalo sie odczytac historii listy (HTTP ${response.status}).`);
    }
    const commits = await response.json();
    if (!Array.isArray(commits) || commits.length === 0) {
        throw new Error("Brak zmian listy z tego dnia albo wczesniej. Wybierz pozniejsza date.");
    }
    return {
        sha: commits[0].sha,
        date: commits[0].commit?.committer?.date || null,
    };
}
