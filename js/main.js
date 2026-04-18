import { createApp } from "./infra/createApp.js";

window.pokebattledex = {
  init: async () => {
    throw new Error("PokeBattleDex todavia se esta inicializando");
  },
};

createApp()
  .then((api) => {
    window.pokebattledex = api;
    console.info("PokeBattleDex listo", {
      search: 'window.pokebattledex.searchPokemon("char")',
      profile: 'window.pokebattledex.getPokemonProfile("charizard")',
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar PokeBattleDex", error);
    const status = document.querySelector("#app-status");
    if (status) {
      status.textContent = `Error al inicializar: ${error.message}`;
      status.dataset.tone = "error";
    }
  });
