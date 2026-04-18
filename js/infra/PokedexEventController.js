export class PokedexEventController {
  constructor({ inputElement, secondaryInputElement, compareToggle, compareSearchPanel, reloadButton, darkModeToggle, themeStyleToggle, renderer, searchPokemon, getPokemonProfile, reloadCache }) {
    this.inputElement = inputElement;
    this.secondaryInputElement = secondaryInputElement;
    this.compareToggle = compareToggle;
    this.compareSearchPanel = compareSearchPanel;
    this.reloadButton = reloadButton;
    this.darkModeToggle = darkModeToggle;
    this.themeStyleToggle = themeStyleToggle;
    this.renderer = renderer;
    this.searchPokemon = searchPokemon;
    this.getPokemonProfile = getPokemonProfile;
    this.reloadCache = reloadCache;
    this.searchTimeouts = new Map();
    this.compareEnabled = false;
    this.primaryProfile = null;
    this.secondaryProfile = null;
  }

  bind() {
    this.restoreThemePreferences();
    this.inputElement.addEventListener("input", () => this.onSearchInput("primary"));
    this.secondaryInputElement.addEventListener("input", () => this.onSearchInput("secondary"));
    this.compareToggle.addEventListener("change", () => this.toggleCompareMode());
    this.reloadButton.addEventListener("click", async () => {
      this.renderer.setStatus("Recargando cache...", "info");
      await this.reloadCache();
      this.renderer.setStatus("Cache recargada", "ok");
      this.inputElement.focus();
    });
    this.darkModeToggle.addEventListener("click", () => this.toggleDarkMode());
    this.themeStyleToggle.addEventListener("click", () => this.toggleThemeStyle());
  }

  onSearchInput(slot) {
    clearTimeout(this.searchTimeouts.get(slot));
    this.searchTimeouts.set(slot, setTimeout(async () => {
      const input = this.getInput(slot);
      const query = input.value;
      const results = await this.searchPokemon(query);
      if (!query.trim()) {
        this.renderer.clearResults(slot);
        this.renderer.setStatus(`Escribe para buscar ${slot === "secondary" ? "el segundo Pokemon" : "Pokemon"}`, "info");
        return;
      }
      this.renderer.renderResults(results, (pokemon) => this.selectPokemon(pokemon, slot), slot);
      this.renderer.setStatus(results.length ? `${results.length} resultado(s)` : "Sin resultados", results.length ? "ok" : "warn");
    }, 120));
  }

  async selectPokemon(pokemon, slot = "primary") {
    this.getInput(slot).value = pokemon.name;
    this.renderer.clearResults(slot);
    this.renderer.renderLoadingProfile(this.compareEnabled, slot, this.primaryProfile, this.secondaryProfile);
    this.renderer.setStatus(`Cargando ${pokemon.name}...`, "info");

    try {
      const profile = await this.getPokemonProfile(pokemon.identifier);
      if (slot === "secondary") {
        this.secondaryProfile = profile;
      } else {
        this.primaryProfile = profile;
      }
      this.renderCurrentProfiles();
      this.renderer.setStatus(`${pokemon.name} cargado`, "ok");
    } catch (error) {
      this.renderer.renderError(error);
      this.renderer.setStatus("No se pudo cargar el perfil", "error");
    }
  }

  toggleCompareMode() {
    this.compareEnabled = this.compareToggle.checked;
    this.compareSearchPanel.classList.toggle("hidden", !this.compareEnabled);
    if (!this.compareEnabled) {
      this.secondaryInputElement.value = "";
      this.secondaryProfile = null;
      this.renderer.clearResults("secondary");
    }
    this.renderCurrentProfiles();
  }

  renderCurrentProfiles() {
    if (this.compareEnabled) {
      this.renderer.renderComparison(this.primaryProfile, this.secondaryProfile);
      return;
    }
    if (this.primaryProfile) {
      this.renderer.renderProfile(this.primaryProfile);
    }
  }

  getInput(slot) {
    return slot === "secondary" ? this.secondaryInputElement : this.inputElement;
  }

  restoreThemePreferences() {
    const darkMode = localStorage.getItem("pokebattledex:ui:dark") === "true";
    const style = localStorage.getItem("pokebattledex:ui:style") || "modern";
    document.documentElement.classList.toggle("dark", darkMode);
    document.body.dataset.theme = style;
    this.updateThemeLabels();
  }

  toggleDarkMode() {
    const enabled = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", enabled);
    localStorage.setItem("pokebattledex:ui:dark", String(enabled));
    this.updateThemeLabels();
  }

  toggleThemeStyle() {
    const nextStyle = document.body.dataset.theme === "retro" ? "modern" : "retro";
    document.body.dataset.theme = nextStyle;
    localStorage.setItem("pokebattledex:ui:style", nextStyle);
    this.updateThemeLabels();
  }

  updateThemeLabels() {
    const darkMode = document.documentElement.classList.contains("dark");
    const retro = document.body.dataset.theme === "retro";
    this.darkModeToggle.textContent = darkMode ? "Claro" : "Oscuro";
    this.themeStyleToggle.textContent = retro ? "Moderno" : "90s";
  }
}
