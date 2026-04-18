export class PokemonSummary {
  constructor({ id, identifier, name, normalizedName }) {
    this.id = Number(id);
    this.identifier = identifier;
    this.name = name || identifier;
    this.normalizedName = normalizedName || normalizeText(this.name);
  }
}

export class PokemonStats {
  constructor(stats) {
    this.hp = Number(stats.hp || 0);
    this.attack = Number(stats.attack || 0);
    this.defense = Number(stats.defense || 0);
    this.specialAttack = Number(stats.specialAttack || 0);
    this.specialDefense = Number(stats.specialDefense || 0);
    this.speed = Number(stats.speed || 0);
  }
}

export class PokemonNature {
  constructor({ id, identifier, name, increasedStat, decreasedStat }) {
    this.id = Number(id);
    this.identifier = identifier;
    this.name = name || identifier;
    this.increasedStat = increasedStat;
    this.decreasedStat = decreasedStat;
  }
}

export class PokemonAbility {
  constructor({ id, identifier, name, description = "", isHidden = false, slot = 0 }) {
    this.id = Number(id);
    this.identifier = identifier;
    this.name = name || identifier;
    this.description = description;
    this.isHidden = Boolean(isHidden);
    this.slot = Number(slot);
  }
}

export class PokemonType {
  constructor({ id, identifier, name }) {
    this.id = Number(id);
    this.identifier = identifier;
    this.name = name || identifier;
  }
}

export class TypeMatchup {
  constructor({ type, multiplier }) {
    this.type = type;
    this.multiplier = Number(multiplier);
  }
}

export class PokemonProfile {
  constructor({ summary, spriteUrl, types, stats, abilities, matchups, combatClassification, natureRecommendations, smogon }) {
    this.summary = summary;
    this.spriteUrl = spriteUrl || "";
    this.types = types;
    this.stats = stats;
    this.abilities = abilities;
    this.matchups = matchups;
    this.combatClassification = combatClassification || null;
    this.natureRecommendations = natureRecommendations || [];
    this.smogon = smogon || { analyses: [], sets: [] };
  }
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
