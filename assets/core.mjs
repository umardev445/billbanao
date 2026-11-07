export const SCHEMA = 1;
export const CURRENCIES = ['PKR', 'INR', 'USD', 'AED', 'GBP', 'EUR'];
export const MAX_DOCUMENTS = 1500;
export const MAX_CLIENTS = 1500;
export const MAX_ITEMS = 100;
export const MAX_BACKUP_BYTES = 12 * 1024 * 1024;
export const MAX_TOTAL = 1_000_000_000_000;
export function uid() { return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`; }
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value && value >= '1900-01-01' && value <= '9999-12-31';
}
/** Exact decimal parsing: all supported currencies have two decimal places. */
export function scaled(value) {
  const str = String(value).trim();
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(str)) throw new Error('Use a positive number with up to two decimal places.');
  const [a, b = ''] = str.split('.');
  const result = Number(a) * 100 + Number(b.padEnd(2, '0'));
  if (!Number.isSafeInteger(result)) throw new Error('Number is too large.');
  return result;
}
function roundRatio(a, b, divisor) {
  return Number((BigInt(a) * BigInt(b) + BigInt(divisor / 2)) / BigInt(divisor));
}
export function calculate(doc) {
  if (!Array.isArray(doc.items) || doc.items.length < 1 || doc.items.length > MAX_ITEMS) throw new Error('Add between 1 and 100 items.');
  const rows = doc.items.map(item => {
    const q = scaled(item.quantity), r = scaled(item.rate);
    if (q <= 0 || q > 100_000_000) throw new Error('Quantity must be above zero and at most 1,000,000.');
    const amount = roundRatio(q, r, 100);
    if (!Number.isSafeInteger(amount) || amount > MAX_TOTAL) throw new Error('Item amount is too large.');
    return amount;
  });
  const subtotal = rows.reduce((a, b) => a + b, 0);
  const discountBps = scaled(doc.discount || '0');
  const taxBps = scaled(doc.tax || '0');
  if (discountBps > 10_000 || taxBps > 10_000) throw new Error('Discount and tax must be between 0 and 100%.');
  if (subtotal > MAX_TOTAL) throw new Error('Document total is too large.');
  const discount = roundRatio(subtotal, discountBps, 10_000);
  const tax = roundRatio(subtotal - discount, taxBps, 10_000);
  const total = subtotal - discount + tax;
  if (total > MAX_TOTAL) throw new Error('Document total is too large.');
  return { rows, subtotal, discount, tax, total };
}
export function money(minor, currency = 'PKR', locale = 'en') {
  return new Intl.NumberFormat(locale === 'ur' ? 'ur-PK' : 'en-GB', { style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100);
}
export function displayDate(value, locale = 'en') {
  if (!isDate(value)) return '—';
  return new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-GB', {day:'numeric', month:'short', year:'numeric'}).format(new Date(`${value}T12:00:00`));
}
export function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c])); }
export function validLogo(value) {
  return typeof value === 'string' && value.length <= 160_000 && (value === '' || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value));
}
const bounded = (value, max, label, required = false) => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`Invalid ${label}.`);
  return value;
};
export function validatePerson(p, required = true) {
  if (!p || typeof p !== 'object') throw new Error('Invalid contact.');
  bounded(p.name, 120, 'name', required);
  bounded(p.email, 180, 'email');
  bounded(p.phone, 50, 'phone');
  bounded(p.address, 500, 'address');
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error('Enter a valid email address.');
}
export function validateDocument(doc) {
  if (!doc || typeof doc !== 'object') throw new Error('Invalid document.');
  bounded(doc.id, 80, 'document ID', true);
  bounded(doc.number, 35, 'document number', true);
  if (!['invoice', 'quote'].includes(doc.kind) || !CURRENCIES.includes(doc.currency) || !['en', 'ur'].includes(doc.locale)) throw new Error('Invalid document type, language or currency.');
  const statuses = doc.kind === 'invoice' ? ['unpaid', 'paid', 'draft'] : ['draft', 'sent', 'accepted'];
  if (!statuses.includes(doc.status)) throw new Error('Invalid status.');
  if (!isDate(doc.issueDate) || (doc.dueDate && (!isDate(doc.dueDate) || doc.dueDate < doc.issueDate))) throw new Error('Due date cannot be earlier than issue date.');
  validatePerson(doc.client);
  validatePerson(doc.business);
  if (!validLogo(doc.business.logo)) throw new Error('Invalid logo.');
  bounded(doc.notes, 2000, 'notes');
  bounded(doc.createdAt, 40, 'creation time', true);
  bounded(doc.updatedAt, 40, 'update time', true);
  if (!Array.isArray(doc.items)) throw new Error('Invalid items.');
  for (const item of doc.items) bounded(item.description, 350, 'item description', true);
  return calculate(doc);
}
export function emptyState() {
  return {
    schema: SCHEMA,
    revision: 0,
    settings: {name:'', email:'', phone:'', address:'', logo:'', currency:'PKR', prefix:'INV', defaultNote:'Thank you for your business!', locale:'en', theme:'light'},
    sequences: {invoice:1, quote:1},
    clients: [],
    documents: [],
  };
}
export function validateState(state) {
  if (!state || state.schema !== SCHEMA || !Number.isSafeInteger(state.revision) || state.revision < 0) throw new Error('Unsupported or damaged backup.');
  const s = state.settings;
  validatePerson(s, false);
  if (!validLogo(s.logo) || !CURRENCIES.includes(s.currency) || !['en','ur'].includes(s.locale) || !['light','dark'].includes(s.theme)) throw new Error('Invalid app settings.');
  bounded(s.defaultNote, 2000, 'default note');
  if (typeof s.prefix !== 'string' || !/^[A-Za-z0-9-]{1,12}$/.test(s.prefix)) throw new Error('Use 1–12 letters, numbers or hyphens in the invoice prefix.');
  for (const kind of ['invoice','quote']) if (!Number.isSafeInteger(state.sequences?.[kind]) || state.sequences[kind] < 1 || state.sequences[kind] > 99999999) throw new Error('Invalid document sequence.');
  if (!Array.isArray(state.clients) || state.clients.length > MAX_CLIENTS || !Array.isArray(state.documents) || state.documents.length > MAX_DOCUMENTS) throw new Error('Too many records in this backup.');
  const clientIds = new Set(), docIds = new Set(), numbers = new Set();
  for (const client of state.clients) {
    validatePerson(client);
    bounded(client.id, 80, 'client ID', true);
    if (clientIds.has(client.id)) throw new Error('Duplicate client ID.');
    clientIds.add(client.id);
  }
  for (const doc of state.documents) {
    validateDocument(doc);
    if (docIds.has(doc.id) || numbers.has(doc.number)) throw new Error('Duplicate document ID or number.');
    docIds.add(doc.id); numbers.add(doc.number);
  }
  // Rebuild only known fields; imported extra object keys never become app state.
  const person = p => ({name:p.name,email:p.email,phone:p.phone,address:p.address});
  return {
    schema:SCHEMA, revision:state.revision,
    settings:{...person(s), logo:s.logo, currency:s.currency, prefix:s.prefix, defaultNote:s.defaultNote, locale:s.locale, theme:s.theme},
    sequences:{invoice:state.sequences.invoice, quote:state.sequences.quote},
    clients:state.clients.map(c=>({...person(c),id:c.id})),
    documents:state.documents.map(d=>({id:d.id,number:d.number,kind:d.kind,currency:d.currency,locale:d.locale,status:d.status,issueDate:d.issueDate,dueDate:d.dueDate || '',notes:d.notes,createdAt:d.createdAt,updatedAt:d.updatedAt,client:person(d.client),business:{...person(d.business),logo:d.business.logo},discount:String(d.discount || '0'),tax:String(d.tax || '0'),items:d.items.map(i=>({description:i.description,quantity:String(i.quantity),rate:String(i.rate)}))})),
  };
}
export function nextNumber(state, kind) {
  const prefix = kind === 'quote' ? 'QUO' : state.settings.prefix;
  let n = state.sequences[kind];
  const existing = new Set(state.documents.map(d=>d.number));
  while (existing.has(`${prefix}-${String(n).padStart(4, '0')}`)) n++;
  if (n >= 99999999) throw new Error('Document number limit reached.');
  return { number:`${prefix}-${String(n).padStart(4, '0')}`, next:n + 1 };
}
export function dashboard(documents, currency) {
  const list = documents.filter(d=>d.kind==='invoice' && d.status!=='draft' && d.currency===currency);
  let billed=0, collected=0, outstanding=0;
  for (const doc of list) { const amount=calculate(doc).total; billed+=amount; if(doc.status==='paid')collected+=amount; else outstanding+=amount; }
  return {billed,collected,outstanding,count:list.length};
}
