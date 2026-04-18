export class PokemonRepository {
  getSummaryList() {
    throw new Error("PokemonRepository.getSummaryList must be implemented");
  }

  getProfileById() {
    throw new Error("PokemonRepository.getProfileById must be implemented");
  }

  getProfileByIdentifier() {
    throw new Error("PokemonRepository.getProfileByIdentifier must be implemented");
  }
}

export class PokemonSearchRepository {
  buildIndex() {
    throw new Error("PokemonSearchRepository.buildIndex must be implemented");
  }

  search() {
    throw new Error("PokemonSearchRepository.search must be implemented");
  }
}

export class TypeChartRepository {
  getEffectiveness() {
    throw new Error("TypeChartRepository.getEffectiveness must be implemented");
  }

  getOffensiveMatchups() {
    throw new Error("TypeChartRepository.getOffensiveMatchups must be implemented");
  }

  getDefensiveMatchups() {
    throw new Error("TypeChartRepository.getDefensiveMatchups must be implemented");
  }
}

export class CacheRepository {
  get() {
    throw new Error("CacheRepository.get must be implemented");
  }

  set() {
    throw new Error("CacheRepository.set must be implemented");
  }

  delete() {
    throw new Error("CacheRepository.delete must be implemented");
  }

  clearNamespace() {
    throw new Error("CacheRepository.clearNamespace must be implemented");
  }
}

export class SmogonRepository {
  getByPokemon() {
    throw new Error("SmogonRepository.getByPokemon must be implemented");
  }
}
