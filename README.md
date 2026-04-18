# PokeBattleDex

SPA estatica para GitHub Pages con un primer modo Pokedex competitivo.

## Uso Local

Servir el proyecto desde la raiz:

```bash
python3 -m http.server 4173
```

Abrir:

```text
http://0.0.0.0:4173/
```

La app carga CSV locales desde `data/`, cachea esos datos en `localStorage`, usa Fuse.js para autocomplete, Tailwind por CDN para la UI y PokeAPI JS Wrapper para enriquecer el perfil con sprites cuando hay conexion disponible.

La interfaz principal es minimalista/moderna, con switch de modo oscuro y un tema alternativo 90s.

El perfil incluye una clasificacion de combate segun porcentajes de stats base, muestra BST total con barra vertical y recomienda 3 naturalezas. Al seleccionar una naturaleza, el radar y el BST actualizan los stats aplicando el ajuste de +10%/-10%.

El modo comparar habilita una segunda busqueda para ver dos perfiles en paralelo y una comparacion de stats. En mobile los perfiles se muestran como paneles desplegables.

Los perfiles tambien consultan Smogon Gen 9 para mostrar analisis debajo de habilidades y sets recomendados debajo de la tabla de dano recibido. Los JSON de Smogon se cachean en memoria durante la sesion.

## API De Consola

Cuando la pagina termina de inicializar, expone:

```js
window.pokebattledex.searchPokemon("char")
window.pokebattledex.searchPokemon("pikachu")
window.pokebattledex.getPokemonProfile("charizard")
window.pokebattledex.getPokemonProfile(25)
window.pokebattledex.clearCache()
window.pokebattledex.reloadCache()
```

## Estructura

```text
js/domain       Entidades, interfaces abstractas y servicios puros
js/application  Casos de uso
js/infra        CSV, cache, Fuse.js, PokeAPI, render y eventos
css             Estilos pixel-art de la SPA
data            CSV usados por el modo Pokedex
```

El plan de desarrollo vivo esta en `PLAN_DESARROLLO.md`.
