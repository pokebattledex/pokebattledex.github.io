export class GetPokemonAdvantages {
  constructor(pokemonRepository, recommendationService, typeChartRepository) {
    this.pokemonRepository = pokemonRepository;
    this.recommendationService = recommendationService;
    this.typeChartRepository = typeChartRepository;
  }

  async execute(identifierOrId, options = {}) {
    const target = this.pokemonRepository.getBattleCandidate(identifierOrId);
    if (!target) {
      throw new Error(`No se encontro Pokemon ${identifierOrId}`);
    }
    const candidates = this.pokemonRepository.getBattleCandidateList();
    return this.recommendationService.getAdvantages(target, candidates, this.typeChartRepository, options);
  }
}
