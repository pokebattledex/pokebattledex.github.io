export class SearchPokemonForPokedex {
  constructor(searchRepository) {
    this.searchRepository = searchRepository;
  }

  async execute(query, options = {}) {
    return this.searchRepository.search(query, options);
  }
}
