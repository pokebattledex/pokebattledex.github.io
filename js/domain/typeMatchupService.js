export class TypeMatchupService {
  constructor(typeChartRepository) {
    this.typeChartRepository = typeChartRepository;
  }

  getOffensiveMatchups(types) {
    const byTarget = new Map();
    for (const attackingType of types) {
      for (const matchup of this.typeChartRepository.getOffensiveMatchups(attackingType.identifier)) {
        const current = byTarget.get(matchup.type.identifier);
        if (!current || matchup.multiplier > current.multiplier) {
          byTarget.set(matchup.type.identifier, matchup);
        }
      }
    }

    return {
      advantages: sortByTypeName([...byTarget.values()].filter((item) => item.multiplier > 1)),
      neutral: sortByTypeName([...byTarget.values()].filter((item) => item.multiplier === 1)),
      disadvantages: sortByTypeName([...byTarget.values()].filter((item) => item.multiplier < 1)),
    };
  }

  getDefensiveMatchups(types) {
    const defendingTypes = types.map((type) => type.identifier);
    const matchups = this.typeChartRepository.getDefensiveMatchups(defendingTypes);

    return {
      weaknesses: sortByTypeName(matchups.filter((item) => item.multiplier > 1)),
      resistances: sortByTypeName(matchups.filter((item) => item.multiplier > 0 && item.multiplier < 1)),
      immunities: sortByTypeName(matchups.filter((item) => item.multiplier === 0)),
      neutral: sortByTypeName(matchups.filter((item) => item.multiplier === 1)),
    };
  }
}

function sortByTypeName(items) {
  return items.sort((a, b) => a.type.name.localeCompare(b.type.name, "es"));
}
