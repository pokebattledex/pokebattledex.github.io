import { normalizeText, PokemonAbility, PokemonNature, PokemonProfile, PokemonStats, PokemonSummary } from "../domain/entities.js";

const SPANISH_LANGUAGE_ID = "7";
const ENGLISH_LANGUAGE_ID = "9";
const STAT_IDENTIFIERS = {
  1: "hp",
  2: "attack",
  3: "defense",
  4: "specialAttack",
  5: "specialDefense",
  6: "speed",
};

export class CsvPokemonRepository {
  constructor({ pokemon, pokemonStats, pokemonAbilities, pokemonTypes, abilities, abilityNames, abilityFlavorText, natures, natureNames }) {
    this.summaries = pokemon
      .filter((row) => row.id && row.identifier)
      .map((row) => new PokemonSummary({
        id: row.id,
        identifier: row.identifier,
        name: formatIdentifier(row.identifier),
        normalizedName: normalizeText(row.identifier),
        speciesId: row.species_id,
        isDefault: row.is_default === "1",
      }));

    this.summaryById = new Map(this.summaries.map((summary) => [summary.id, summary]));
    this.summaryByIdentifier = new Map(this.summaries.map((summary) => [summary.identifier, summary]));
    this.statsByPokemonId = groupBy(pokemonStats, "pokemon_id");
    this.abilitiesByPokemonId = groupBy(pokemonAbilities, "pokemon_id");
    this.typesByPokemonId = groupBy(pokemonTypes, "pokemon_id");
    this.abilitiesById = new Map(abilities.map((row) => [row.id, row]));
    this.abilityNamesById = buildLocalizedNameMap(abilityNames, "ability_id");
    this.abilityDescriptionsById = buildAbilityDescriptionMap(abilityFlavorText);
    this.natureNamesById = buildLocalizedNameMap(natureNames, "nature_id");
    this.natures = natures.map((row) => new PokemonNature({
      id: row.id,
      identifier: row.identifier,
      name: this.natureNamesById.get(row.id) || formatIdentifier(row.identifier),
      increasedStat: STAT_IDENTIFIERS[row.increased_stat_id],
      decreasedStat: STAT_IDENTIFIERS[row.decreased_stat_id],
    }));
    this.battleCandidateCache = null;
  }

  getSummaryList() {
    return this.summaries;
  }

  getSummaryById(id) {
    return this.summaryById.get(Number(id));
  }

  getSummaryByIdentifier(identifier) {
    return this.summaryByIdentifier.get(identifier);
  }

  getNatures() {
    return this.natures;
  }

  getStatsByPokemonId(id) {
    const values = {};
    for (const row of this.statsByPokemonId.get(String(id)) || []) {
      const key = STAT_IDENTIFIERS[row.stat_id];
      if (key) {
        values[key] = Number(row.base_stat);
      }
    }
    return new PokemonStats(values);
  }

  getAbilitiesByPokemonId(id) {
    return (this.abilitiesByPokemonId.get(String(id)) || [])
      .map((row) => {
        const ability = this.abilitiesById.get(row.ability_id);
        if (!ability) {
          return null;
        }
        return new PokemonAbility({
          id: ability.id,
          identifier: ability.identifier,
          name: this.abilityNamesById.get(ability.id) || formatIdentifier(ability.identifier),
          description: this.abilityDescriptionsById.get(ability.id) || "",
          isHidden: row.is_hidden === "1",
          slot: row.slot,
        });
      })
      .filter(Boolean)
      .sort((a, b) => a.slot - b.slot);
  }

  getTypesByPokemonId(id, typeChartRepository) {
    return (this.typesByPokemonId.get(String(id)) || [])
      .slice()
      .sort((a, b) => Number(a.slot) - Number(b.slot))
      .map((row) => typeChartRepository.getTypeById(row.type_id))
      .filter(Boolean);
  }

  getBattleCandidateList(typeChartRepository) {
    if (!this.battleCandidateCache) {
      this.battleCandidateCache = this.summaries
        .map((summary) => ({
          summary,
          stats: this.getStatsByPokemonId(summary.id),
          types: this.getTypesByPokemonId(summary.id, typeChartRepository),
        }))
        .filter((candidate) => candidate.types.length && statTotal(candidate.stats) > 0);
    }
    return this.battleCandidateCache;
  }

  getBattleCandidate(identifierOrId, typeChartRepository) {
    const summary = Number.isInteger(Number(identifierOrId))
      ? this.getSummaryById(Number(identifierOrId))
      : this.getSummaryByIdentifier(String(identifierOrId).trim().toLowerCase().replaceAll(" ", "-"));
    if (!summary) {
      return null;
    }
    return this.getBattleCandidateList(typeChartRepository)
      .find((candidate) => candidate.summary.id === summary.id) || null;
  }

  createPartialProfile(summary, { types = [], spriteUrl = "", combatClassification = null, natureRecommendations = [], natures = [], smogon = null } = {}) {
    return new PokemonProfile({
      summary,
      spriteUrl,
      types,
      stats: this.getStatsByPokemonId(summary.id),
      abilities: this.getAbilitiesByPokemonId(summary.id),
      matchups: null,
      combatClassification,
      natureRecommendations,
      natures,
      smogon,
    });
  }
}

function groupBy(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!result.has(value)) {
      result.set(value, []);
    }
    result.get(value).push(row);
  }
  return result;
}

function buildLocalizedNameMap(rows, idKey) {
  const result = new Map();
  for (const row of rows) {
    if (row.local_language_id === SPANISH_LANGUAGE_ID) {
      result.set(row[idKey], row.name);
    }
  }
  for (const row of rows) {
    if (row.local_language_id === ENGLISH_LANGUAGE_ID && !result.has(row[idKey])) {
      result.set(row[idKey], row.name);
    }
  }
  return result;
}

function buildAbilityDescriptionMap(rows) {
  const byLanguage = new Map();
  for (const row of rows) {
    const key = `${row.ability_id}:${row.language_id}`;
    const current = byLanguage.get(key);
    if (!current || Number(row.version_group_id) > Number(current.version_group_id)) {
      byLanguage.set(key, {
        version_group_id: row.version_group_id,
        text: normalizeFlavorText(row.flavor_text),
      });
    }
  }

  const result = new Map();
  for (const [key, value] of byLanguage.entries()) {
    const [abilityId, languageId] = key.split(":");
    if (languageId === SPANISH_LANGUAGE_ID) {
      result.set(abilityId, value.text);
    }
  }
  for (const [key, value] of byLanguage.entries()) {
    const [abilityId, languageId] = key.split(":");
    if (languageId === ENGLISH_LANGUAGE_ID && !result.has(abilityId)) {
      result.set(abilityId, value.text);
    }
  }
  return result;
}

function normalizeFlavorText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function statTotal(stats) {
  return ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"]
    .reduce((total, key) => total + Number(stats[key] || 0), 0);
}

function formatIdentifier(identifier) {
  return String(identifier)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
