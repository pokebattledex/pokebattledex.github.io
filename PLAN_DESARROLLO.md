# Plan De Desarrollo: Modo Pokedex

## Resumen

La primera version de la SPA implementa un modo Pokedex: busqueda de Pokemon con autocomplete usando Fuse.js y, al seleccionar uno, muestra informacion competitiva base: stats, tipos, habilidades, ventajas ofensivas y desventajas defensivas por tipo.

La simulacion de equipos y batallas queda fuera de esta etapa. La arquitectura queda preparada para crecer despues.

La app es una SPA estatica para GitHub Pages con HTML, CSS y JavaScript vanilla usando ES modules, sin build step obligatorio. La logica se organiza con arquitectura hexagonal:

- `js/domain`: entidades, servicios puros e interfaces abstractas.
- `js/application`: casos de uso.
- `js/infra`: PokeAPI, CSV, localStorage, Fuse.js, render y eventos.

## Checklist De Desarrollo

### 0. Base Del Proyecto

- [x] Crear `PLAN_DESARROLLO.md` con este plan.
- [x] Crear estructura base: `index.html`, `css/styles.css`, `js/main.js`, `js/domain`, `js/application`, `js/infra`.
- [x] Configurar `index.html` para cargar `js/main.js` como ES module.
- [x] Cargar Fuse.js desde CDN.
- [x] Cargar PokeAPI JS Wrapper desde CDN.
- [x] Confirmar en navegador que la SPA funciona servida desde rutas relativas compatibles con GitHub Pages.
- [x] Exponer temporalmente la app en consola mediante `window.pokebattledex`.

### 1. Dominio Pokedex

- [x] Definir entidades de dominio: `PokemonSummary`, `PokemonProfile`, `PokemonStats`, `PokemonAbility`, `PokemonType`, `TypeMatchup`.
- [x] Definir interfaces abstractas: `PokemonRepository`, `PokemonSearchRepository`, `TypeChartRepository`, `CacheRepository`.
- [x] Definir servicio puro de dominio para calculo de tipos: ventajas ofensivas, debilidades defensivas, resistencias e inmunidades.
- [x] Mantener dominio sin dependencias de DOM, PokeAPI, Fuse.js, `fetch` o `localStorage`.
- [x] Usar espanol primero para nombres visibles, con fallback a identifiers en ingles.

### 2. Datos CSV Y Cache

- [x] Implementar carga de CSV desde `/data`.
- [x] Implementar parser CSV en infraestructura.
- [x] Cachear CSV descargados en `localStorage`.
- [x] Usar claves versionadas para datos CSV.
- [x] Implementar estrategia cache-first: leer `localStorage`, descargar si falta, guardar datos normalizados.
- [x] Agregar o generar `data/pokemon_types.csv`.
- [x] Agregar comandos de consola: `clearCache()` y `reloadCache()`.

### 3. Repositorios E Infraestructura

- [x] Implementar `LocalStorageCacheRepository`.
- [x] Implementar `CsvPokemonRepository` para datos base, stats y habilidades.
- [x] Implementar `CsvTypeChartRepository` usando `type_efficacy.csv`.
- [x] Implementar `PokeApiPokemonClient` usando PokeAPI JS Wrapper para datos enriquecidos.
- [x] Implementar un repositorio compuesto `PokemonRepository`.
- [x] Normalizar nombres y datos por ids e identifiers.
- [x] Crear fabrica de infraestructura para construir dependencias desde `main.js`.

### 4. Busqueda Con Fuse.js

- [x] Implementar `FusePokemonSearchRepository`.
- [x] Construir indice de busqueda con `id`, `identifier`, nombre localizado y nombre normalizado.
- [x] Soportar busqueda parcial por nombre.
- [x] Limitar resultados iniciales a 10.
- [x] Ordenar resultados por score de Fuse.js.
- [x] Manejar busqueda vacia sin error.
- [x] Manejar Pokemon no encontrado con resultado explicito.
- [x] Exponer busqueda desde consola.

### 5. Caso De Uso Principal: Modo Pokedex

- [x] Crear caso de uso `SearchPokemonForPokedex`.
- [x] Devolver lista de Pokemon candidatos para autocomplete.
- [x] Crear caso de uso `GetPokemonPokedexProfile`.
- [x] Devolver datos base, tipos, stats, habilidades, ventajas ofensivas, debilidades defensivas, resistencias e inmunidades.
- [x] Calcular matchups para Pokemon de uno o dos tipos.
- [x] Mantener calculo de matchups como logica pura de dominio.
- [x] Devolver objetos planos serializables para inspeccion en consola.
- [x] Exponer `getPokemonProfile` desde consola.

### 6. Render Y Eventos

- [x] Crear `PokedexRenderer` en `js/infra`.
- [x] Crear `PokedexEventController` en `js/infra`.
- [x] Conectar input de busqueda con Fuse.js.
- [x] Mostrar autocomplete mientras se escribe.
- [x] Al seleccionar un Pokemon, ejecutar `GetPokemonPokedexProfile`.
- [x] Renderizar ficha Pokedex.
- [x] Mostrar estados de UI.
- [x] Mantener render y eventos fuera de dominio y aplicacion.

### 7. Estilo Visual Pixel-Art

- [x] Disenar la primera pantalla como herramienta Pokedex directa, sin landing page.
- [x] Aplicar estetica pixel-art inspirada en Pokedex.
- [x] Usar sprites oficiales desde PokeAPI cuando esten disponibles.
- [x] Crear layout responsive desktop/mobile.
- [x] Evitar que el contenido principal parezca una preview embebida.
- [x] Usar botones y paneles con estetica retro.
- [x] Mantener radios de borde de 8px o menos.
- [x] Evitar una paleta dominada por un solo color.
- [x] Evitar que textos largos rompan el layout.
- [x] Mantener dimensiones estables para autocomplete, panel de stats y tabla de tipos.

### 8. Pruebas Y Validacion

- [x] Probar carga inicial sin cache.
- [ ] Probar carga inicial con cache existente.
- [ ] Probar limpieza y recarga de cache.
- [ ] Probar busqueda exacta: `pikachu`, `charizard`, `gengar`.
- [ ] Probar busqueda parcial: `char`, `bulba`, `mew`.
- [ ] Probar busqueda sin resultados.
- [ ] Probar perfil de Pokemon de un tipo.
- [ ] Probar perfil de Pokemon de doble tipo.
- [ ] Probar calculo de efectividad conocido.
- [ ] Probar habilidades normales y ocultas.
- [ ] Probar comandos desde consola antes de validar UI.
- [x] Probar UI inicial en desktop.
- [x] Probar UI inicial en mobile.
- [x] Probar con servidor estatico local.
- [x] Probar compatibilidad basica con rutas relativas de GitHub Pages.

## Interfaces Publicas Iniciales

- `window.pokebattledex.init()`
- `window.pokebattledex.searchPokemon(query, options)`
- `window.pokebattledex.getPokemonProfile(identifierOrId)`
- `window.pokebattledex.clearCache()`
- `window.pokebattledex.reloadCache()`

## Fuera De Alcance Por Ahora

- Simulacion de batallas.
- Carga de equipos en formato Smogon.
- Motor de reglas VGC.
- Recomendacion avanzada de counters por movesets, abilities o metagame.
- Persistencia de equipos.
- Comparador entre dos Pokemon.

## Supuestos

- `data/pokemon_types.csv` se obtuvo desde el repositorio oficial de PokeAPI.
- PokeAPI se usa para enriquecer perfiles con sprites; los CSV son la base para busqueda rapida, stats, habilidades y tabla de tipos.
- Los datos visibles priorizan espanol cuando esta disponible.
- La logica queda usable desde consola y la UI consume esos mismos casos de uso.
