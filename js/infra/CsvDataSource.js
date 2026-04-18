import { parseCsv } from "./csv.js";

export class CsvDataSource {
  constructor({ cacheRepository, basePath = "./data" }) {
    this.cacheRepository = cacheRepository;
    this.basePath = basePath;
  }

  async load(name, { forceReload = false } = {}) {
    const key = `data:${name}:v1`;
    if (!forceReload) {
      const cached = this.cacheRepository.get(key);
      if (cached) {
        return cached;
      }
    }

    const response = await fetch(`${this.basePath}/${name}.csv`);
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${name}.csv`);
    }

    const rows = parseCsv(await response.text());
    this.cacheRepository.set(key, rows);
    return rows;
  }
}
