export class LocalStorageCacheRepository {
  constructor(namespace = "pokebattledex") {
    this.namespace = namespace;
  }

  get(key) {
    const raw = localStorage.getItem(this.key(key));
    return raw ? JSON.parse(raw) : null;
  }

  set(key, value) {
    localStorage.setItem(this.key(key), JSON.stringify(value));
  }

  delete(key) {
    localStorage.removeItem(this.key(key));
  }

  clearNamespace(namespace = this.namespace) {
    const prefix = `${namespace}:`;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }
  }

  key(key) {
    return `${this.namespace}:${key}`;
  }
}
