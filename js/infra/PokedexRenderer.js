export class PokedexRenderer {
  constructor({ statusElement, resultsElement, secondaryResultsElement, profileElement }) {
    this.statusElement = statusElement;
    this.resultsElement = resultsElement;
    this.secondaryResultsElement = secondaryResultsElement;
    this.profileElement = profileElement;
  }

  setStatus(message, tone = "info") {
    this.statusElement.textContent = message;
    this.statusElement.dataset.tone = tone;
  }

  renderResults(results, onSelect, slot = "primary") {
    const resultsElement = this.getResultsElement(slot);
    resultsElement.innerHTML = "";
    if (!results.length) {
      const item = document.createElement("li");
      item.className = "px-4 py-3 text-sm text-slate-500";
      item.textContent = "Sin resultados";
      resultsElement.append(item);
      return;
    }

    for (const pokemon of results) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "grid w-full grid-cols-[72px_1fr] gap-x-3 border-b border-slate-200 px-4 py-3 text-left transition last:border-b-0 hover:bg-white";
      button.innerHTML = `
        <span class="text-xs font-bold text-slate-400">#${String(pokemon.id).padStart(4, "0")}</span>
        <strong class="font-semibold text-slate-900">${escapeHtml(pokemon.name)}</strong>
        <span></span>
        <small class="text-xs text-slate-500">${escapeHtml(pokemon.identifier)}</small>
      `;
      button.addEventListener("click", () => onSelect(pokemon));
      item.append(button);
      resultsElement.append(item);
    }
  }

  clearResults(slot = "primary") {
    this.getResultsElement(slot).innerHTML = "";
  }

  renderLoadingProfile(compareEnabled = false, slot = "primary", primaryProfile = null, secondaryProfile = null) {
    if (compareEnabled) {
      const loading = `<div class="grid min-h-[280px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500"><p>Cargando perfil...</p></div>`;
      this.renderComparison(slot === "primary" ? null : primaryProfile, slot === "secondary" ? null : secondaryProfile, loading, slot);
      return;
    }
    this.profileElement.innerHTML = `
      <div class="grid min-h-[480px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
        <p>Cargando perfil...</p>
      </div>
    `;
  }

  renderComparison(primaryProfile, secondaryProfile, loadingMarkup = "", loadingSlot = "") {
    this.profileElement.innerHTML = `
      <article class="grid gap-5">
        ${primaryProfile && secondaryProfile ? renderStatComparison(primaryProfile, secondaryProfile) : ""}
        <div class="comparison-layout">
          ${renderComparisonPanel("Pokemon A", primaryProfile, loadingSlot === "primary" ? loadingMarkup : "")}
          ${renderComparisonPanel("Pokemon B", secondaryProfile, loadingSlot === "secondary" ? loadingMarkup : "")}
        </div>
      </article>
    `;
    if (primaryProfile) {
      this.bindNatureSelector(primaryProfile, this.profileElement.querySelector('[data-profile-slot="primary"]'));
    }
    if (secondaryProfile) {
      this.bindNatureSelector(secondaryProfile, this.profileElement.querySelector('[data-profile-slot="secondary"]'));
    }
  }

  getResultsElement(slot) {
    return slot === "secondary" ? this.secondaryResultsElement : this.resultsElement;
  }

  renderError(error) {
    this.profileElement.innerHTML = `
      <div class="grid min-h-[480px] place-items-center rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p>${escapeHtml(error.message || "Ocurrio un error")}</p>
      </div>
    `;
  }

  renderProfile(profile) {
    this.profileElement.innerHTML = `
      <article class="grid gap-5">
        <header class="grid gap-4 rounded-2xl bg-gradient-to-br from-slate-100 to-white p-5 md:grid-cols-[1fr_180px]">
          <div>
            <p class="text-sm font-black text-red-600">#${String(profile.summary.id).padStart(4, "0")}</p>
            <h2 class="mt-1 text-4xl font-black tracking-tight">${escapeHtml(profile.summary.name)}</h2>
            <p class="mt-1 text-sm text-slate-500">${escapeHtml(profile.summary.identifier)}</p>
            <div class="mt-4 flex flex-wrap gap-2" aria-label="Tipos">
              ${profile.types.map((type) => `<span class="type-pill type-${type.identifier}">${escapeHtml(type.name)}</span>`).join("")}
            </div>
            ${profile.combatClassification ? `
              <div class="mt-4 rounded-xl bg-white/75 p-4">
                <p class="text-xs font-bold uppercase text-slate-500">Clasificación de combate</p>
                <p class="mt-1 text-lg font-black">${escapeHtml(profile.combatClassification.label)}</p>
                <p class="mt-1 text-sm text-slate-600">${escapeHtml(profile.combatClassification.description)}</p>
              </div>
            ` : ""}
          </div>
          <div class="grid min-h-40 place-items-center rounded-2xl border border-slate-200 bg-white">
            ${profile.spriteUrl ? `<img class="h-36 w-36 object-contain [image-rendering:pixelated]" src="${escapeAttribute(profile.spriteUrl)}" alt="${escapeAttribute(profile.summary.name)}">` : "<span class=\"text-sm text-slate-500\">Sin sprite</span>"}
          </div>
        </header>

        <section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div class="rounded-2xl border border-slate-200 p-5">
            <div class="mb-4 flex items-center justify-between gap-3">
              <h3 class="text-lg font-black">Stats base</h3>
              <p class="text-xs font-semibold text-slate-500">Radar competitivo</p>
            </div>
            <div data-radar-root>
              ${renderRadarChart(profile.stats)}
            </div>
            ${renderNatureSelector(profile)}
          </div>

          <div class="rounded-2xl border border-slate-200 p-5">
            <h3 class="text-lg font-black">Habilidades</h3>
            <ul class="mt-4 grid gap-3">
              ${profile.abilities.map(renderAbility).join("")}
            </ul>
            ${renderSmogonAnalyses(profile.smogon?.analyses)}
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 p-5">
          <h3 class="text-lg font-black">Daño recibido por tipo</h3>
          <div class="mt-4 grid gap-3">
            ${renderDefensiveTypeRows(profile.matchups.defensive)}
          </div>
        </section>
        ${renderSmogonSets(profile.smogon?.sets)}
      </article>
    `;
    this.bindNatureSelector(profile, this.profileElement);
  }

  bindNatureSelector(profile, rootElement = this.profileElement) {
    const radarRoot = rootElement.querySelector("[data-radar-root]");
    const natureButtons = rootElement.querySelectorAll("[data-nature-index]");
    if (!radarRoot) {
      return;
    }
    natureButtons.forEach((button) => {
      button.addEventListener("click", () => {
        natureButtons.forEach((item) => item.setAttribute("aria-pressed", "false"));
        button.setAttribute("aria-pressed", "true");
        const index = Number(button.dataset.natureIndex);
        const nature = profile.natureRecommendations[index];
        radarRoot.innerHTML = renderRadarChart(applyNature(profile.stats, nature), nature);
      });
    });
  }
}

function renderRadarChart(stats, selectedNature = null) {
  const values = [
    { label: "HP", value: stats.hp },
    { label: "Ataque", value: stats.attack },
    { label: "Defensa", value: stats.defense },
    { label: "Velocidad", value: stats.speed },
    { label: "Def. Esp.", value: stats.specialDefense },
    { label: "At. Esp.", value: stats.specialAttack },
  ];
  const center = 150;
  const radius = 92;
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const polygon = values.map((stat, index) => pointFor(index, Math.min(stat.value / 255, 1), center, radius)).join(" ");
  const bstTotal = values.reduce((total, stat) => total + Number(stat.value), 0);

  return `
    <div class="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-center">
      <div class="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-4">
        <svg class="mx-auto h-80 w-80 max-w-full overflow-visible" viewBox="0 0 300 300" role="img" aria-label="Radar de stats base">
          ${gridLevels.map((level) => `<polygon points="${values.map((_, index) => pointFor(index, level, center, radius)).join(" ")}" class="radar-grid"></polygon>`).join("")}
          ${values.map((_, index) => `<line x1="${center}" y1="${center}" x2="${pointFor(index, 1, center, radius).split(",")[0]}" y2="${pointFor(index, 1, center, radius).split(",")[1]}" class="radar-axis"></line>`).join("")}
          <polygon points="${polygon}" class="radar-area"></polygon>
          <polyline points="${polygon} ${polygon.split(" ")[0]}" class="radar-line"></polyline>
          ${values.map((stat, index) => renderRadarLabel(stat, index, center, radius)).join("")}
        </svg>
        ${renderBstBar(bstTotal)}
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
        ${values.map((stat) => `
          <div class="rounded-xl bg-slate-100 p-3">
            <p class="text-xs font-bold uppercase text-slate-500">${escapeHtml(stat.label)}</p>
            <p class="text-2xl font-black">${Number(stat.value)}</p>
          </div>
        `).join("")}
      </div>
    </div>
    ${selectedNature ? `<p class="mt-3 text-sm font-semibold text-red-600">Aplicando naturaleza ${escapeHtml(selectedNature.name)}: +${escapeHtml(statLabel(selectedNature.increasedStat))}, -${escapeHtml(statLabel(selectedNature.decreasedStat))}</p>` : ""}
  `;
}

function renderComparisonPanel(title, profile, fallbackMarkup = "") {
  if (fallbackMarkup) {
    return `<section class="comparison-panel">${fallbackMarkup}</section>`;
  }
  if (!profile) {
    return `
      <section class="comparison-panel">
        <div class="grid min-h-[280px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
          <p>Selecciona un Pokemon para ${escapeHtml(title)}.</p>
        </div>
      </section>
    `;
  }

  const slot = title.endsWith("B") ? "secondary" : "primary";
  return `
    <details class="comparison-panel" data-profile-slot="${slot}" open>
      <summary class="comparison-summary">
        <span>${escapeHtml(title)}</span>
        <strong>${escapeHtml(profile.summary.name)}</strong>
      </summary>
      <div class="mt-4 grid gap-4">
        <header class="grid gap-4 rounded-2xl bg-gradient-to-br from-slate-100 to-white p-4">
          <div>
            <p class="text-sm font-black text-red-600">#${String(profile.summary.id).padStart(4, "0")}</p>
            <h2 class="mt-1 text-3xl font-black tracking-tight">${escapeHtml(profile.summary.name)}</h2>
            <div class="mt-3 flex flex-wrap gap-2" aria-label="Tipos">
              ${profile.types.map((type) => `<span class="type-pill type-${type.identifier}">${escapeHtml(type.name)}</span>`).join("")}
            </div>
            ${profile.combatClassification ? `
              <div class="mt-4 rounded-xl bg-white/75 p-3">
                <p class="text-xs font-bold uppercase text-slate-500">Clasificación</p>
                <p class="mt-1 font-black">${escapeHtml(profile.combatClassification.label)}</p>
              </div>
            ` : ""}
          </div>
          <div class="grid min-h-32 place-items-center rounded-2xl border border-slate-200 bg-white">
            ${profile.spriteUrl ? `<img class="h-28 w-28 object-contain [image-rendering:pixelated]" src="${escapeAttribute(profile.spriteUrl)}" alt="${escapeAttribute(profile.summary.name)}">` : "<span class=\"text-sm text-slate-500\">Sin sprite</span>"}
          </div>
        </header>
        <section class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-lg font-black">Stats</h3>
          <div data-radar-root class="mt-3">
            ${renderRadarChart(profile.stats)}
          </div>
          ${renderNatureSelector(profile)}
        </section>
        <section class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-lg font-black">Habilidades</h3>
          <ul class="mt-3 grid gap-3">
            ${profile.abilities.map(renderAbility).join("")}
          </ul>
          ${renderSmogonAnalyses(profile.smogon?.analyses)}
        </section>
        <section class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-lg font-black">Daño recibido por tipo</h3>
          <div class="mt-3 grid gap-3">
            ${renderDefensiveTypeRows(profile.matchups.defensive)}
          </div>
        </section>
        ${renderSmogonSets(profile.smogon?.sets)}
      </div>
    </details>
  `;
}

function renderStatComparison(primaryProfile, secondaryProfile) {
  const stats = [
    ["HP", "hp"],
    ["Ataque", "attack"],
    ["Defensa", "defense"],
    ["Velocidad", "speed"],
    ["Def. Esp.", "specialDefense"],
    ["At. Esp.", "specialAttack"],
  ];
  return `
    <section class="rounded-2xl border border-slate-200 p-5">
      <h3 class="text-lg font-black">Comparación de stats</h3>
      <div class="mt-4 grid gap-2">
        ${stats.map(([label, key]) => {
          const a = primaryProfile.stats[key];
          const b = secondaryProfile.stats[key];
          const max = Math.max(a, b, 1);
          return `
            <div class="compare-stat-row">
              <span>${escapeHtml(label)}</span>
              <div class="compare-bars">
                <i class="compare-a" style="width:${Math.round((a / max) * 100)}%"></i>
                <i class="compare-b" style="width:${Math.round((b / max) * 100)}%"></i>
              </div>
              <strong>${a} / ${b}</strong>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderBstBar(total) {
  const tier = bstTier(total);
  const height = Math.max(10, Math.min(100, Math.round((total / 720) * 100)));
  return `
    <div class="bst-meter" aria-label="BST total ${total}">
      <div class="bst-meter-track">
        <div class="bst-meter-fill bst-meter-${tier.id}" style="height:${height}%"></div>
      </div>
      <p class="bst-meter-total">${total}</p>
      <p class="bst-meter-label">BST</p>
      <p class="bst-meter-range">${escapeHtml(tier.label)}</p>
    </div>
  `;
}

function renderNatureSelector(profile) {
  if (!profile.natureRecommendations?.length) {
    return "";
  }
  return `
    <div class="mt-5 rounded-2xl bg-slate-50 p-4">
      <div class="flex flex-col gap-1">
        <h4 class="font-black">Naturalezas sugeridas</h4>
        <p class="text-sm text-slate-600">Selecciona una para ver como cambia el radar.</p>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" data-nature-index="-1" aria-pressed="true" class="nature-button">Base</button>
        ${profile.natureRecommendations.map((nature, index) => `
          <button type="button" data-nature-index="${index}" aria-pressed="false" class="nature-button">
            ${escapeHtml(nature.name)}
            <span>+${escapeHtml(statLabel(nature.increasedStat))} / -${escapeHtml(statLabel(nature.decreasedStat))}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderRadarLabel(stat, index, center, radius) {
  const [x, y] = pointFor(index, 1.24, center, radius).split(",").map(Number);
  return `
    <g>
      <text x="${x}" y="${y - 4}" text-anchor="middle" class="radar-label">${escapeHtml(stat.label)}</text>
      <text x="${x}" y="${y + 13}" text-anchor="middle" class="radar-value">${Number(stat.value)}</text>
    </g>
  `;
}

function applyNature(stats, nature) {
  const result = { ...stats };
  if (!nature || nature.increasedStat === nature.decreasedStat) {
    return result;
  }
  if (result[nature.increasedStat] !== undefined && nature.increasedStat !== "hp") {
    result[nature.increasedStat] = Math.floor(result[nature.increasedStat] * 1.1);
  }
  if (result[nature.decreasedStat] !== undefined && nature.decreasedStat !== "hp") {
    result[nature.decreasedStat] = Math.floor(result[nature.decreasedStat] * 0.9);
  }
  return result;
}

function bstTier(total) {
  if (total >= 600) {
    return { id: "sky", label: ">= 600" };
  }
  if (total >= 500) {
    return { id: "green", label: "500-599" };
  }
  if (total >= 459) {
    return { id: "yellow", label: "459-499" };
  }
  return { id: "red", label: "< 459" };
}

function statLabel(statKey) {
  return {
    hp: "HP",
    attack: "Ataque",
    defense: "Defensa",
    speed: "Velocidad",
    specialDefense: "Def. esp.",
    specialAttack: "At. esp.",
  }[statKey] || statKey || "neutral";
}

function pointFor(index, scale, center, radius) {
  const angle = (-90 + index * 60) * (Math.PI / 180);
  const x = center + Math.cos(angle) * radius * scale;
  const y = center + Math.sin(angle) * radius * scale;
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function renderAbility(ability) {
  return `
    <li class="rounded-xl bg-slate-100 p-4">
      <div class="flex items-center justify-between gap-3">
        <strong>${escapeHtml(ability.name)}</strong>
        ${ability.isHidden ? '<span class="rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700">Oculta</span>' : ""}
      </div>
      <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(ability.description || "Sin descripción disponible.")}</p>
    </li>
  `;
}

function renderSmogonAnalyses(analyses = []) {
  const visibleAnalyses = analyses.slice(0, 3);
  if (!visibleAnalyses.length) {
    return `
      <section class="mt-5 rounded-2xl bg-slate-50 p-4">
        <h4 class="font-black">Analisis Smogon</h4>
        <p class="mt-2 text-sm text-slate-500">Sin analisis disponible para Gen 9.</p>
      </section>
    `;
  }
  return `
    <section class="mt-5 rounded-2xl bg-slate-50 p-4">
      <h4 class="font-black">Analisis Smogon</h4>
      <div class="mt-3 grid gap-3">
        ${visibleAnalyses.map(renderSmogonAnalysisCard).join("")}
      </div>
    </section>
  `;
}

function renderSmogonAnalysisCard(analysis) {
  const fullText = buildSmogonAnalysisText(analysis);
  return `
    <details class="smogon-card">
      <summary>
        <span>${escapeHtml(analysis.format.toUpperCase())}</span>
        <small>${escapeHtml(truncateText(fullText, 200))}</small>
      </summary>
      ${analysis.comments ? `<p>${escapeHtml(analysis.comments)}</p>` : ""}
      ${analysis.sets.slice(0, 3).map((set) => `
        <article>
          <h5>${escapeHtml(set.name)}</h5>
          <p>${escapeHtml(set.description)}</p>
        </article>
      `).join("")}
    </details>
  `;
}

function buildSmogonAnalysisText(analysis) {
  return [
    analysis.comments,
    ...analysis.sets.map((set) => `${set.name}. ${set.description}`),
  ].filter(Boolean).join(" ");
}

function truncateText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}...`;
}

function renderSmogonSets(sets = []) {
  const visibleSets = sets.slice(0, 8);
  if (!visibleSets.length) {
    return `
      <section class="rounded-2xl border border-slate-200 p-5">
        <h3 class="text-lg font-black">Sets Smogon</h3>
        <p class="mt-2 text-sm text-slate-500">Sin sets disponibles para Gen 9.</p>
      </section>
    `;
  }
  return `
    <section class="rounded-2xl border border-slate-200 p-5">
      <h3 class="text-lg font-black">Sets Smogon</h3>
      <div class="mt-4 grid gap-3 smogon-set-grid">
        ${visibleSets.map((set) => `
          <article class="smogon-set-card">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase text-slate-500">${escapeHtml(set.format)}</p>
                <h4>${escapeHtml(set.name)}</h4>
              </div>
              ${set.nature ? `<span>${escapeHtml(set.nature)}</span>` : ""}
            </div>
            <dl>
              ${set.ability ? `<div><dt>Habilidad</dt><dd>${escapeHtml(set.ability)}</dd></div>` : ""}
              ${set.item ? `<div><dt>Item</dt><dd>${escapeHtml(set.item)}</dd></div>` : ""}
              ${set.teraTypes ? `<div><dt>Tera</dt><dd>${escapeHtml(set.teraTypes)}</dd></div>` : ""}
              ${set.evs ? `<div><dt>EVs</dt><dd>${escapeHtml(set.evs)}</dd></div>` : ""}
              ${set.ivs ? `<div><dt>IVs</dt><dd>${escapeHtml(set.ivs)}</dd></div>` : ""}
              ${set.moves?.length ? `<div><dt>Moves</dt><dd>${set.moves.map(escapeHtml).join(" / ")}</dd></div>` : ""}
            </dl>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDefensiveTypeRows(defensive) {
  const all = [
    ...defensive.weaknesses,
    ...defensive.neutral,
    ...defensive.resistances,
    ...defensive.immunities,
  ];
  const groups = [
    { label: "Debilidades x 4", multiplier: 4, tone: "danger" },
    { label: "Debilidades x 2", multiplier: 2, tone: "warning" },
    { label: "Daño normal", multiplier: 1, tone: "neutral" },
    { label: "Resistencia 1/2", multiplier: 0.5, tone: "resist" },
    { label: "Resistencia 1/4", multiplier: 0.25, tone: "resist" },
    { label: "Inmune 0", multiplier: 0, tone: "immune" },
  ];

  return groups.map((group) => {
    const items = all.filter((item) => item.multiplier === group.multiplier);
    return `
      <div class="type-row type-row-${group.tone}">
        <div>
          <p class="text-sm font-black">${escapeHtml(group.label)}</p>
          <p class="text-xs text-slate-500">${items.length || "Ningún"} tipo${items.length === 1 ? "" : "s"}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${items.length ? items.map((item) => `<span class="type-pill type-${item.type.identifier}">${escapeHtml(item.type.name)}</span>`).join("") : "<em class=\"text-sm text-slate-400\">Ninguno</em>"}
        </div>
      </div>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
