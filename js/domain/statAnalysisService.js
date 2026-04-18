const STAT_LABELS = {
  hp: "HP",
  attack: "Ataque",
  defense: "Defensa",
  speed: "Velocidad",
  specialDefense: "Defensa especial",
  specialAttack: "Ataque especial",
};

const NATURE_RECOMMENDATIONS = {
  fastPhysicalSweeper: ["jolly", "adamant", "naive"],
  fastSpecialSweeper: ["timid", "modest", "hasty"],
  physicalAttacker: ["adamant", "jolly", "brave"],
  specialAttacker: ["modest", "timid", "quiet"],
  mixedAttacker: ["naive", "hasty", "rash"],
  physicalWall: ["impish", "bold", "relaxed"],
  specialWall: ["calm", "careful", "sassy"],
  wall: ["bold", "calm", "impish"],
  bulkyPhysicalAttacker: ["adamant", "impish", "careful"],
  bulkySpecialAttacker: ["modest", "calm", "bold"],
  specialTank: ["modest", "calm", "quiet"],
  physicalTank: ["adamant", "impish", "brave"],
  balanced: ["jolly", "timid", "bold"],
};

export class StatAnalysisService {
  classify(stats) {
    const bstTotal = this.getBstTotal(stats);
    const percentages = this.getStatPercentages(stats);
    const physicalBulk = percentages.hp + percentages.defense;
    const specialBulk = percentages.hp + percentages.specialDefense;
    const totalBulk = percentages.hp + percentages.defense + percentages.specialDefense;
    const specialAttackLead = percentages.specialAttack - percentages.attack;
    const physicalAttackLead = percentages.attack - percentages.specialAttack;
    const specialOffenseWithBulk = percentages.specialAttack >= 0.22 && specialBulk >= 0.33;
    const physicalOffenseWithBulk = percentages.attack >= 0.22 && physicalBulk >= 0.33;

    const withContext = (result) => ({
      ...result,
      bstTotal,
      bstTier: this.getBstTier(bstTotal),
      percentages,
    });

    if (percentages.hp >= 0.18 && percentages.defense >= 0.17 && percentages.specialDefense >= 0.17) {
      return withContext(classification("wall", "Muralla", "HP y ambas defensas concentran buena parte del BST."));
    }
    if (specialAttackLead >= 0.04 && specialOffenseWithBulk && percentages.specialDefense >= percentages.defense + 0.04) {
      return withContext(classification("specialTank", "Atacante especial con bulk especial", "Ataque especial y defensa especial son sus mayores puntos relativos."));
    }
    if (physicalAttackLead >= 0.04 && physicalOffenseWithBulk && percentages.defense >= percentages.specialDefense + 0.04) {
      return withContext(classification("physicalTank", "Atacante físico con bulk físico", "Ataque físico y defensa física son sus mayores puntos relativos."));
    }
    if (specialAttackLead >= 0.04 && totalBulk >= 0.45) {
      return withContext(classification("bulkySpecialAttacker", "Atacante especial bulky", "Ataque especial alto con una porción defensiva relevante del BST."));
    }
    if (physicalAttackLead >= 0.04 && totalBulk >= 0.45) {
      return withContext(classification("bulkyPhysicalAttacker", "Atacante físico bulky", "Ataque físico alto con una porción defensiva relevante del BST."));
    }
    if (physicalBulk >= specialBulk + 0.05 && percentages.defense >= 0.18) {
      return withContext(classification("physicalWall", "Defensivo físico", "El bulk está más concentrado en HP y defensa física."));
    }
    if (specialBulk >= physicalBulk + 0.05 && percentages.specialDefense >= 0.18 && percentages.specialAttack < 0.22) {
      return withContext(classification("specialWall", "Defensivo especial", "El bulk está más concentrado en HP y defensa especial."));
    }
    if (Math.abs(percentages.attack - percentages.specialAttack) <= 0.03 && percentages.attack + percentages.specialAttack >= 0.32) {
      return withContext(classification("mixedAttacker", "Atacante mixto", "El BST ofensivo está repartido entre ataque y ataque especial."));
    }
    if (percentages.speed >= 0.19 && percentages.attack >= percentages.specialAttack + 0.04) {
      return withContext(classification("fastPhysicalSweeper", "Sweeper físico rápido", "Velocidad y ataque físico son las mayores prioridades relativas."));
    }
    if (percentages.speed >= 0.19 && percentages.specialAttack >= percentages.attack + 0.04) {
      return withContext(classification("fastSpecialSweeper", "Sweeper especial rápido", "Velocidad y ataque especial son las mayores prioridades relativas."));
    }
    if (physicalAttackLead >= 0.04) {
      return withContext(classification("physicalAttacker", "Atacante físico", "El ataque físico concentra más BST que el ataque especial."));
    }
    if (specialAttackLead >= 0.04) {
      return withContext(classification("specialAttacker", "Atacante especial", "El ataque especial concentra más BST que el ataque físico."));
    }

    return withContext(classification("balanced", "Balanceado", "El BST está repartido sin una inclinación dominante."));
  }

  recommendNatures(classificationResult, natures) {
    const identifiers = NATURE_RECOMMENDATIONS[classificationResult.id] || NATURE_RECOMMENDATIONS.balanced;
    return identifiers
      .map((identifier) => natures.find((nature) => nature.identifier === identifier))
      .filter(Boolean)
      .slice(0, 3);
  }

  applyNature(stats, nature) {
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

  getStatLabel(statKey) {
    return STAT_LABELS[statKey] || statKey;
  }

  getBstTotal(stats) {
    return stats.hp + stats.attack + stats.defense + stats.specialAttack + stats.specialDefense + stats.speed;
  }

  getStatPercentages(stats) {
    const total = this.getBstTotal(stats) || 1;
    return {
      hp: stats.hp / total,
      attack: stats.attack / total,
      defense: stats.defense / total,
      speed: stats.speed / total,
      specialDefense: stats.specialDefense / total,
      specialAttack: stats.specialAttack / total,
    };
  }

  getBstTier(total) {
    if (total >= 600) {
      return { id: "elite", label: ">= 600", color: "sky" };
    }
    if (total >= 500) {
      return { id: "strong", label: "500-599", color: "green" };
    }
    if (total >= 459) {
      return { id: "mid", label: "459-499", color: "yellow" };
    }
    return { id: "low", label: "< 459", color: "red" };
  }
}

function classification(id, label, description) {
  return { id, label, description };
}
