import { normalizeText } from "../domain/entities.js";

export class FusePokemonSearchRepository {
  constructor(FuseConstructor = window.Fuse) {
    this.FuseConstructor = FuseConstructor;
    this.index = null;
    this.items = [];
  }

  buildIndex(pokemonList) {
    this.items = pokemonList.map((pokemon) => ({
      ...pokemon,
      searchName: normalizeText(`${pokemon.name} ${pokemon.identifier} ${pokemon.id}`),
    }));

    if (!this.FuseConstructor) {
      throw new Error("Fuse.js no esta disponible");
    }

    this.index = new this.FuseConstructor(this.items, {
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      keys: [
        { name: "name", weight: 0.5 },
        { name: "identifier", weight: 0.4 },
        { name: "id", weight: 0.1 },
        { name: "searchName", weight: 0.2 },
      ],
    });
  }

  search(query, options = {}) {
    const limit = options.limit || 10;
    const normalized = normalizeText(query);
    if (!normalized) {
      return [];
    }

    const exactStarts = this.items
      .filter((item) => item.searchName.startsWith(normalized) || item.identifier.startsWith(normalized))
      .slice(0, limit);

    const fused = this.index.search(normalized, { limit }).map((result) => result.item);
    return uniqueById([...exactStarts, ...fused]).slice(0, limit);
  }
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}
