const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];

export class PokemonRecommendationService {
  getAlternatives(target, candidates, { limit = 30 } = {}) {
    const targetTypeKey = getTypeKey(target.types);
    return candidates
      .filter((candidate) => candidate.summary.id !== target.summary.id)
      .filter((candidate) => getTypeKey(candidate.types) === targetTypeKey)
      .map((candidate) => ({
        ...candidate,
        score: vectorDistance(target.stats, candidate.stats),
      }))
      .sort((a, b) => a.score - b.score || a.summary.name.localeCompare(b.summary.name, "es"))
      .slice(0, limit);
  }

  getCounters(target, candidates, typeChartRepository, { limit = 30 } = {}) {
    const weakSide = target.stats.specialDefense < target.stats.defense ? "special" : "physical";
    return candidates
      .filter((candidate) => candidate.summary.id !== target.summary.id)
      .map((candidate) => {
        const bestAttack = getBestOffensiveMultiplier(candidate.types, target.types, typeChartRepository);
        const attackStat = weakSide === "special" ? candidate.stats.specialAttack : candidate.stats.attack;
        const offSideMatch = weakSide === "special"
          ? candidate.stats.specialAttack >= candidate.stats.attack
          : candidate.stats.attack >= candidate.stats.specialAttack;
        return {
          ...candidate,
          multiplier: bestAttack.multiplier,
          attackingType: bestAttack.type,
          weakSide,
          attackStat,
          offSideMatch,
        };
      })
      .filter((candidate) => candidate.multiplier > 1)
      .sort((a, b) => (
        b.multiplier - a.multiplier
        || Number(b.offSideMatch) - Number(a.offSideMatch)
        || b.attackStat - a.attackStat
        || statTotal(b.stats) - statTotal(a.stats)
        || a.summary.name.localeCompare(b.summary.name, "es")
      ))
      .slice(0, limit);
  }

  getAdvantages(target, candidates, typeChartRepository, { limit = 30 } = {}) {
    const attackSide = target.stats.specialAttack > target.stats.attack ? "special" : "physical";
    const typedAdvantages = candidates
      .filter((candidate) => candidate.summary.id !== target.summary.id)
      .map((candidate) => {
        const incoming = getBestOffensiveMultiplier(candidate.types, target.types, typeChartRepository);
        const outgoing = getBestOffensiveMultiplier(target.types, candidate.types, typeChartRepository);
        const targetAttackStat = attackSide === "special" ? target.stats.specialAttack : target.stats.attack;
        const candidateDefense = attackSide === "special" ? candidate.stats.specialDefense : candidate.stats.defense;
        return {
          ...candidate,
          multiplier: incoming.multiplier,
          attackingType: incoming.type,
          outgoingMultiplier: outgoing.multiplier,
          outgoingType: outgoing.type,
          attackSide,
          targetAttackStat,
          candidateDefense,
        };
      })
      .filter((candidate) => candidate.multiplier <= 0.5);
    const clearOffensiveAdvantages = typedAdvantages.filter((candidate) => candidate.outgoingMultiplier > 1);
    const source = clearOffensiveAdvantages.length ? clearOffensiveAdvantages : typedAdvantages;

    return source
      .sort((a, b) => clearOffensiveAdvantages.length ? (
        a.multiplier - b.multiplier
        || b.outgoingMultiplier - a.outgoingMultiplier
        || a.candidateDefense - b.candidateDefense
        || b.targetAttackStat - a.targetAttackStat
        || statTotal(b.stats) - statTotal(a.stats)
        || a.summary.name.localeCompare(b.summary.name, "es")
      ) : (
        a.multiplier - b.multiplier
        || a.summary.name.localeCompare(b.summary.name, "es")
      ))
      .slice(0, limit);
  }
}

function getBestOffensiveMultiplier(attackingTypes, defendingTypes, typeChartRepository) {
  return attackingTypes.reduce((best, attackingType) => {
    const multiplier = defendingTypes.reduce(
      (total, defendingType) => total * typeChartRepository.getEffectiveness(attackingType.identifier, defendingType.identifier),
      1,
    );
    if (multiplier > best.multiplier) {
      return { type: attackingType, multiplier };
    }
    return best;
  }, { type: null, multiplier: 1 });
}

function getTypeKey(types) {
  return types.map((type) => type.identifier).sort().join("|");
}

function vectorDistance(a, b) {
  const sum = STAT_KEYS.reduce((total, key) => {
    const diff = (Number(a[key]) - Number(b[key])) / 255;
    return total + diff * diff;
  }, 0);
  return Math.sqrt(sum);
}

function statTotal(stats) {
  return STAT_KEYS.reduce((total, key) => total + Number(stats[key] || 0), 0);
}
