export class PokedexEventController {
  constructor({ inputElement, secondaryInputElement, compareToggle, compareSearchPanel, reloadButton, darkModeToggle, themeStyleToggle, renderer, searchPokemon, getPokemonProfile, getPokemonAlternatives, getPokemonCounters, getPokemonAdvantages, reloadCache }) {
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
    this.getPokemonAlternatives = getPokemonAlternatives;
    this.getPokemonCounters = getPokemonCounters;
    this.getPokemonAdvantages = getPokemonAdvantages;
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
      this.bindRecommendationActions();
      return;
    }
    if (this.primaryProfile) {
      this.renderer.renderProfile(this.primaryProfile);
      this.bindRecommendationActions();
    }
  }

  bindRecommendationActions() {
    this.renderer.bindRecommendationButtons({
      onAlternatives: (profileId) => this.openRecommendations("alternatives", profileId),
      onCounters: (profileId) => this.openRecommendations("counters", profileId),
      onAdvantages: (profileId) => this.openRecommendations("advantages", profileId),
    });
  }

  async openRecommendations(kind, profileId) {
    const target = this.findLoadedProfile(profileId);
    if (!target) {
      this.renderer.setStatus("No se encontro el perfil cargado", "error");
      return;
    }

    const isAlternatives = kind === "alternatives";
    const isAdvantages = kind === "advantages";
    const label = isAlternatives ? "alternativas" : isAdvantages ? "ventajas" : "riesgos";
    this.renderer.setStatus(`Buscando ${label} para ${target.summary.name}...`, "info");
    try {
      const items = isAlternatives
        ? await this.getPokemonAlternatives(target.summary.id)
        : isAdvantages
          ? await this.getPokemonAdvantages(target.summary.id)
          : await this.getPokemonCounters(target.summary.id);
      this.renderer.renderRecommendationModal({
        title: `${isAlternatives ? "Alternativas" : isAdvantages ? "Ventajas" : "Riesgos"} para ${target.summary.name}`,
        description: isAlternatives
          ? "Mismos tipos, ordenados por similitud vectorial de stats base."
          : isAdvantages
            ? "Rivales cuyos ataques por tipo quedan inmunes o resistidos, priorizando el lado ofensivo propio."
            : "Ordenados por ventaja ofensiva contra sus tipos y por el lado ofensivo que ataca su defensa mas baja.",
        items,
        emptyText: isAlternatives
          ? "No hay alternativas con la misma combinacion de tipos."
          : isAdvantages
            ? "No hay ventajas claras por inmunidad o resistencia."
            : "No hay riesgos claros por tipo.",
        onSelect: (pokemon) => this.selectRecommendedPokemon(pokemon),
      });
      this.renderer.setStatus(`${items.length} ${label}`, items.length ? "ok" : "warn");
    } catch (error) {
      this.renderer.setStatus(error.message || "No se pudieron calcular recomendaciones", "error");
    }
  }

  async selectRecommendedPokemon(pokemon) {
    if (!this.compareEnabled) {
      this.compareEnabled = true;
      this.compareToggle.checked = true;
      this.compareSearchPanel.classList.remove("hidden");
    }
    await this.selectPokemon(pokemon, "secondary");
  }

  findLoadedProfile(profileId) {
    return [this.primaryProfile, this.secondaryProfile]
      .find((profile) => profile?.summary.id === Number(profileId)) || null;
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
