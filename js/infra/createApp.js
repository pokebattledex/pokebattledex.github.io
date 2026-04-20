import { GetPokemonPokedexProfile } from "../application/GetPokemonPokedexProfile.js";
import { GetPokemonAlternatives } from "../application/GetPokemonAlternatives.js";
import { GetPokemonCounters } from "../application/GetPokemonCounters.js";
import { GetPokemonAdvantages } from "../application/GetPokemonAdvantages.js";
import { SearchPokemonForPokedex } from "../application/SearchPokemonForPokedex.js";
import { TypeMatchupService } from "../domain/typeMatchupService.js";
import { StatAnalysisService } from "../domain/statAnalysisService.js";
import { PokemonRecommendationService } from "../domain/pokemonRecommendationService.js";
import { CompositePokemonRepository } from "./CompositePokemonRepository.js";
import { CsvDataSource } from "./CsvDataSource.js";
import { CsvPokemonRepository } from "./CsvPokemonRepository.js";
import { CsvTypeChartRepository } from "./CsvTypeChartRepository.js";
import { FusePokemonSearchRepository } from "./FusePokemonSearchRepository.js";
import { LocalStorageCacheRepository } from "./LocalStorageCacheRepository.js";
import { PokeApiPokemonClient } from "./PokeApiPokemonClient.js";
import { HttpSmogonRepository } from "./SmogonRepository.js";
import { PokedexEventController } from "./PokedexEventController.js";
import { PokedexRenderer } from "./PokedexRenderer.js";

const DATASETS = [
  "pokemon",
  "types",
  "type_efficacy",
  "pokemon_stats",
  "pokemon_abilities",
  "pokemon_types",
  "abilities",
  "ability_names",
  "ability_flavor_text",
  "natures",
  "nature_names",
  "type_names",
];

export async function createApp({ documentRef = document } = {}) {
  const cacheRepository = new LocalStorageCacheRepository();
  const dataSource = new CsvDataSource({ cacheRepository });
  let appContext = await buildContext({ cacheRepository, dataSource });

  const api = {
    async init({ forceReload = false } = {}) {
      appContext = await buildContext({ cacheRepository, dataSource, forceReload });
      return api;
    },
    async searchPokemon(query, options) {
      return appContext.searchPokemonForPokedex.execute(query, options);
    },
    async getPokemonProfile(identifierOrId) {
      return appContext.getPokemonPokedexProfile.execute(identifierOrId);
    },
    async getPokemonAlternatives(identifierOrId, options) {
      return appContext.getPokemonAlternatives.execute(identifierOrId, options);
    },
    async getPokemonCounters(identifierOrId, options) {
      return appContext.getPokemonCounters.execute(identifierOrId, options);
    },
    async getPokemonAdvantages(identifierOrId, options) {
      return appContext.getPokemonAdvantages.execute(identifierOrId, options);
    },
    clearCache() {
      cacheRepository.clearNamespace();
    },
    async reloadCache() {
      cacheRepository.clearNamespace();
      await api.init({ forceReload: true });
    },
  };

  const renderer = new PokedexRenderer({
    statusElement: documentRef.querySelector("#app-status"),
    resultsElement: documentRef.querySelector("#autocomplete-results"),
    secondaryResultsElement: documentRef.querySelector("#autocomplete-results-secondary"),
    profileElement: documentRef.querySelector("#profile-panel"),
  });

  const controller = new PokedexEventController({
    inputElement: documentRef.querySelector("#pokemon-search"),
    secondaryInputElement: documentRef.querySelector("#pokemon-search-secondary"),
    compareToggle: documentRef.querySelector("#compare-toggle"),
    compareSearchPanel: documentRef.querySelector("#compare-search-panel"),
    reloadButton: documentRef.querySelector("#reload-cache"),
    darkModeToggle: documentRef.querySelector("#dark-mode-toggle"),
    themeStyleToggle: documentRef.querySelector("#theme-style-toggle"),
    renderer,
    searchPokemon: api.searchPokemon,
    getPokemonProfile: api.getPokemonProfile,
    getPokemonAlternatives: api.getPokemonAlternatives,
    getPokemonCounters: api.getPokemonCounters,
    getPokemonAdvantages: api.getPokemonAdvantages,
    reloadCache: api.reloadCache,
  });
  controller.bind();
  renderer.setStatus("Datos listos. Escribe para buscar Pokemon.", "ok");

  return api;
}

async function buildContext({ cacheRepository, dataSource, forceReload = false }) {
  const datasets = Object.fromEntries(
    await Promise.all(DATASETS.map(async (name) => [name, await dataSource.load(name, { forceReload })])),
  );

  const csvPokemonRepository = new CsvPokemonRepository({
    pokemon: datasets.pokemon,
    pokemonStats: datasets.pokemon_stats,
    pokemonAbilities: datasets.pokemon_abilities,
    pokemonTypes: datasets.pokemon_types,
    abilities: datasets.abilities,
    abilityNames: datasets.ability_names,
    abilityFlavorText: datasets.ability_flavor_text,
    natures: datasets.natures,
    natureNames: datasets.nature_names,
  });
  const typeChartRepository = new CsvTypeChartRepository({
    types: datasets.types,
    typeNames: datasets.type_names,
    typeEfficacy: datasets.type_efficacy,
  });
  const pokemonRepository = new CompositePokemonRepository({
    csvPokemonRepository,
    typeChartRepository,
    pokeApiPokemonClient: new PokeApiPokemonClient(),
    statAnalysisService: new StatAnalysisService(),
    smogonRepository: new HttpSmogonRepository(),
  });
  const searchRepository = new FusePokemonSearchRepository();
  searchRepository.buildIndex(pokemonRepository.getSummaryList());
  const recommendationService = new PokemonRecommendationService();

  return {
    cacheRepository,
    dataSource,
    pokemonRepository,
    typeChartRepository,
    searchPokemonForPokedex: new SearchPokemonForPokedex(searchRepository),
    getPokemonPokedexProfile: new GetPokemonPokedexProfile(
      pokemonRepository,
      new TypeMatchupService(typeChartRepository),
    ),
    getPokemonAlternatives: new GetPokemonAlternatives(pokemonRepository, recommendationService),
    getPokemonCounters: new GetPokemonCounters(pokemonRepository, recommendationService, typeChartRepository),
    getPokemonAdvantages: new GetPokemonAdvantages(pokemonRepository, recommendationService, typeChartRepository),
  };
}
