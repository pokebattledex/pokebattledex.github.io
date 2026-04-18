const ANALYSES_URL = "https://pkmn.github.io/smogon/data/analyses/gen9.json";
const SETS_URL = "https://pkmn.github.io/smogon/data/sets/gen9.json";

export class HttpSmogonRepository {
  constructor({ analysesUrl = ANALYSES_URL, setsUrl = SETS_URL } = {}) {
    this.analysesUrl = analysesUrl;
    this.setsUrl = setsUrl;
    this.analysesPromise = null;
    this.setsPromise = null;
  }

  async getByPokemon(summary) {
    try {
      const [analyses, sets] = await Promise.all([
        this.loadAnalyses(),
        this.loadSets(),
      ]);
      const candidates = getNameCandidates(summary);
      return {
        analyses: normalizeAnalyses(findEntry(analyses, candidates)),
        sets: normalizeSets(findEntry(sets, candidates)),
      };
    } catch (error) {
      console.warn(`No se pudieron cargar datos de Smogon para ${summary.name}`, error);
      return { analyses: [], sets: [] };
    }
  }

  loadAnalyses() {
    if (!this.analysesPromise) {
      this.analysesPromise = fetchJson(this.analysesUrl);
    }
    return this.analysesPromise;
  }

  loadSets() {
    if (!this.setsPromise) {
      this.setsPromise = fetchJson(this.setsUrl);
    }
    return this.setsPromise;
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Smogon respondio ${response.status} para ${url}`);
  }
  return response.json();
}

function getNameCandidates(summary) {
  const identifierName = String(summary.identifier || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
  return [
    summary.name,
    identifierName,
    identifierName.replaceAll("-", " "),
    identifierName.replaceAll(" ", "-"),
  ].filter(Boolean);
}

function findEntry(data, candidates) {
  for (const candidate of candidates) {
    if (data?.[candidate]) {
      return data[candidate];
    }
  }
  const normalizedCandidates = new Set(candidates.map(normalizeKey));
  return Object.entries(data || {}).find(([key]) => normalizedCandidates.has(normalizeKey(key)))?.[1] || null;
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeAnalyses(entry) {
  return Object.entries(entry || {}).map(([format, formatData]) => ({
    format,
    comments: htmlToText(formatData.comments || ""),
    sets: Object.entries(formatData.sets || {}).map(([name, setData]) => ({
      name,
      description: htmlToText(setData.description || ""),
    })).filter((set) => set.description),
  })).filter((analysis) => analysis.comments || analysis.sets.length);
}

function normalizeSets(entry) {
  return Object.entries(entry || {}).flatMap(([format, formatSets]) => (
    Object.entries(formatSets || {}).map(([name, setData]) => ({
      format,
      name,
      ability: normalizeField(setData.ability),
      item: normalizeField(setData.item),
      nature: normalizeField(setData.nature),
      moves: normalizeMoves(setData.moves),
      evs: normalizeStats(setData.evs),
      ivs: normalizeStats(setData.ivs),
      teraTypes: normalizeField(setData.teratypes),
    }))
  ));
}

function normalizeField(value) {
  if (Array.isArray(value)) {
    return value.flat().join(" / ");
  }
  return value || "";
}

function normalizeMoves(moves = []) {
  return moves.map((move) => Array.isArray(move) ? move.join(" / ") : move);
}

function normalizeStats(stats) {
  if (!stats) {
    return "";
  }
  if (Array.isArray(stats)) {
    return stats.map(normalizeStats).join(" | ");
  }
  return Object.entries(stats).map(([key, value]) => `${key.toUpperCase()} ${value}`).join(" / ");
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<h3>/g, "\n")
    .replace(/<\/h3>/g, "\n")
    .replace(/<\/p>/g, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
