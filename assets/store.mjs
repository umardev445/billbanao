import {emptyState, validateState} from './core.mjs';
// Project-scoped key: other apps on the same GitHub Pages origin are left alone.
export const STORAGE_KEY = `billbanao:v1:${new URL('../', import.meta.url).pathname}`;
export class AppStore {
  constructor(storage = globalThis.localStorage) { this.storage = storage; }
  read() {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) return emptyState();
    try { return validateState(JSON.parse(raw)); }
    catch { throw new Error('Saved data could not be read. Export a recovery copy before resetting. Nothing has been overwritten.'); }
  }
  update(change) {
    const state = this.read();
    change(state);
    state.revision++;
    const safe = validateState(state);
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(safe)); }
    catch { throw new Error('Could not save on this device. Storage may be full or blocked. Export a backup and free space; your changes have not been saved.'); }
    return safe;
  }
  replace(input) {
    const state=validateState(input);
    state.revision=Math.max(state.revision, this.read().revision)+1;
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { throw new Error('Backup could not be restored: device storage is full or blocked. Existing data has not been replaced.'); }
    return state;
  }
  reset() { this.storage.removeItem(STORAGE_KEY); return emptyState(); }
  raw() { return this.storage.getItem(STORAGE_KEY) || ''; }
}
