export class CompositePokemonRepository {
  constructor({ csvPokemonRepository, typeChartRepository, pokeApiPokemonClient, statAnalysisService, smogonRepository }) {
    this.csvPokemonRepository = csvPokemonRepository;
    this.typeChartRepository = typeChartRepository;
    this.pokeApiPokemonClient = pokeApiPokemonClient;
    this.statAnalysisService = statAnalysisService;
    this.smogonRepository = smogonRepository;
  }

  getSummaryList() {
    return this.csvPokemonRepository.getSummaryList();
  }

  getBattleCandidateList() {
    return this.csvPokemonRepository.getBattleCandidateList(this.typeChartRepository);
  }

  getBattleCandidate(identifierOrId) {
    return this.csvPokemonRepository.getBattleCandidate(identifierOrId, this.typeChartRepository);
  }

  async getProfileById(id) {
    const summary = this.csvPokemonRepository.getSummaryById(id);
    if (!summary) {
      throw new Error(`No se encontro Pokemon con id ${id}`);
    }
    return this.buildProfile(summary);
  }

  async getProfileByIdentifier(identifier) {
    const normalizedIdentifier = String(identifier).trim().toLowerCase().replaceAll(" ", "-");
    const summary = this.csvPokemonRepository.getSummaryByIdentifier(normalizedIdentifier);
    if (!summary) {
      throw new Error(`No se encontro Pokemon ${identifier}`);
    }
    return this.buildProfile(summary);
  }

  async buildProfile(summary) {
    const types = this.csvPokemonRepository.getTypesByPokemonId(summary.id, this.typeChartRepository);
    const apiPokemon = await this.getApiPokemon(summary.identifier);
    const stats = this.csvPokemonRepository.getStatsByPokemonId(summary.id);
    const combatClassification = this.statAnalysisService.classify(stats);
    const natures = this.csvPokemonRepository.getNatures();
    const natureRecommendations = this.statAnalysisService.recommendNatures(
      combatClassification,
      natures,
    );
    const smogon = await this.smogonRepository.getByPokemon(summary);

    return this.csvPokemonRepository.createPartialProfile(summary, {
      types,
      spriteUrl: apiPokemon?.sprites?.front_default || apiPokemon?.sprites?.other?.["official-artwork"]?.front_default || "",
      combatClassification,
      natureRecommendations,
      natures,
      smogon,
    });
  }

  async getApiPokemon(identifier) {
    try {
      return await this.pokeApiPokemonClient.getPokemon(identifier);
    } catch (error) {
      console.warn(`No se pudo enriquecer ${identifier} desde PokeAPI`, error);
      return null;
    }
  }
}
