// Time Machine: odtwarzanie listy z wybranego dnia na podstawie historii commitow GitHuba.

export const REPO = {
    owner: "pinterittejeden-gif",
    name: "PLGDPSi-ChallengeList",
    branch: "main",
};

const apiBase = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`;
const rawBase = `https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}`;

export function rawDirForRef(ref) {
    return `${rawBase}/${ref}/data`;
}

// Znajduje commit listy najblizszy podanej dacie (YYYY-MM-DD).
export async function resolveRefForDate(dateString) {
    const until = `${String(dateString).trim()}T23:59:59Z`;
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
