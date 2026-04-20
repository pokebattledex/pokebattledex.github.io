export class GetPokemonAlternatives {
  constructor(pokemonRepository, recommendationService) {
    this.pokemonRepository = pokemonRepository;
    this.recommendationService = recommendationService;
  }

  async execute(identifierOrId, options = {}) {
    const target = this.pokemonRepository.getBattleCandidate(identifierOrId);
    if (!target) {
      throw new Error(`No se encontro Pokemon ${identifierOrId}`);
    }
    const candidates = this.pokemonRepository.getBattleCandidateList();
    return this.recommendationService.getAlternatives(target, candidates, options);
  }
}
