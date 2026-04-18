export class PokeApiPokemonClient {
  constructor() {
    const PokedexConstructor = window.Pokedex?.Pokedex || window.Pokedex;
    this.client = PokedexConstructor ? new PokedexConstructor() : null;
  }

  async getPokemon(identifierOrId) {
    if (this.client?.getPokemonByName) {
      return this.client.getPokemonByName(identifierOrId);
    }

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifierOrId}`);
    if (!response.ok) {
      throw new Error(`PokeAPI no encontro el Pokemon ${identifierOrId}`);
    }
    return response.json();
  }
}
