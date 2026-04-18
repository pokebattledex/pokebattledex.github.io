import { PokemonType, TypeMatchup } from "../domain/entities.js";

const SPANISH_LANGUAGE_ID = "7";

export class CsvTypeChartRepository {
  constructor({ types, typeNames, typeEfficacy }) {
    this.typesById = new Map();
    this.typesByIdentifier = new Map();
    this.efficacy = new Map();

    const namesByTypeId = new Map(
      typeNames
        .filter((row) => row.local_language_id === SPANISH_LANGUAGE_ID)
        .map((row) => [row.type_id, row.name]),
    );

    for (const row of types.filter((item) => Number(item.id) <= 18)) {
      const type = new PokemonType({
        id: row.id,
        identifier: row.identifier,
        name: namesByTypeId.get(row.id) || row.identifier,
      });
      this.typesById.set(type.id, type);
      this.typesByIdentifier.set(type.identifier, type);
    }

    for (const row of typeEfficacy) {
      this.efficacy.set(`${row.damage_type_id}:${row.target_type_id}`, Number(row.damage_factor) / 100);
    }
  }

  getTypeById(id) {
    return this.typesById.get(Number(id));
  }

  getTypeByIdentifier(identifier) {
    return this.typesByIdentifier.get(identifier);
  }

  getEffectiveness(attackingType, defendingType) {
    const attack = this.resolveType(attackingType);
    const defense = this.resolveType(defendingType);
    return this.efficacy.get(`${attack.id}:${defense.id}`) ?? 1;
  }

  getOffensiveMatchups(attackingType) {
    const attack = this.resolveType(attackingType);
    return [...this.typesById.values()].map((target) => new TypeMatchup({
      type: target,
      multiplier: this.getEffectiveness(attack.identifier, target.identifier),
    }));
  }

  getDefensiveMatchups(defendingTypes) {
    return [...this.typesById.values()].map((attackingType) => {
      const multiplier = defendingTypes.reduce(
        (total, defendingType) => total * this.getEffectiveness(attackingType.identifier, defendingType),
        1,
      );
      return new TypeMatchup({ type: attackingType, multiplier });
    });
  }

  resolveType(type) {
    if (typeof type === "object" && type.identifier) {
      return type;
    }
    const byIdentifier = this.typesByIdentifier.get(String(type));
    if (byIdentifier) {
      return byIdentifier;
    }
    const byId = this.typesById.get(Number(type));
    if (byId) {
      return byId;
    }
    throw new Error(`Tipo desconocido: ${type}`);
  }
}
