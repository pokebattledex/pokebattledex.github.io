export class GetPokemonPokedexProfile {
  constructor(pokemonRepository, typeMatchupService) {
    this.pokemonRepository = pokemonRepository;
    this.typeMatchupService = typeMatchupService;
  }

  async execute(identifierOrId) {
    const profile = Number.isInteger(Number(identifierOrId))
      ? await this.pokemonRepository.getProfileById(Number(identifierOrId))
      : await this.pokemonRepository.getProfileByIdentifier(String(identifierOrId));

    const offensive = this.typeMatchupService.getOffensiveMatchups(profile.types);
    const defensive = this.typeMatchupService.getDefensiveMatchups(profile.types);

    return {
      ...profile,
      matchups: {
        offensive,
        defensive,
      },
    };
  }
}
