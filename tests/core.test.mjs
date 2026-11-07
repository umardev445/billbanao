import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,emptyState,validateState,validateDocument,nextNumber,scaled,isDate,dashboard,escapeHtml} from '../assets/core.mjs';
import {AppStore,STORAGE_KEY} from '../assets/store.mjs';
import {jpegPagesToPdf} from '../assets/pdf.mjs';
const person={name:'Test business',email:'',phone:'',address:''};
function doc(extra={}){return {id:'test-1',number:'INV-0001',kind:'invoice',status:'unpaid',locale:'en',currency:'PKR',issueDate:'2026-11-07',dueDate:'',business:{...person,logo:''},client:{...person,name:'Client'},notes:'',discount:'0',tax:'0',items:[{description:'Work',quantity:'1',rate:'10'}],createdAt:'2026-11-07T00:00:00Z',updatedAt:'2026-11-07T00:00:00Z',...extra};}
test('decimal arithmetic rounds each row, discounts subtotal, then taxes discounted amount',()=>{
 const d=doc({items:[{description:'A',quantity:'1.25',rate:'100.10'},{description:'B',quantity:'3',rate:'0.10'}],discount:'10',tax:'5'});
 assert.deepEqual(calculate(d),{rows:[12513,30],subtotal:12543,discount:1254,tax:564,total:11853});
 assert.equal(scaled('0.29'),29);
 assert.equal(calculate(doc({items:[{description:'A',quantity:'0.5',rate:'0.01'}]})).total,1);
});
test('reject invalid/huge amounts, over-100 percentages, empty items and invalid dates',()=>{
 for(const value of ['1e3','NaN','-1','1.123','Infinity'])assert.throws(()=>scaled(value));
 assert.throws(()=>calculate(doc({discount:'100.01'})));
 assert.throws(()=>calculate(doc({items:[]})));
 assert.throws(()=>calculate(doc({items:[{description:'A',quantity:'1000000',rate:'999999999'}]})));
 assert.throws(()=>validateDocument(doc({dueDate:'2026-11-06'})));
 assert.equal(isDate('2026-02-30'),false);assert.equal(isDate('2028-02-29'),true);
});
test('number generation avoids collisions and preserves separate quote sequence',()=>{
 const s=emptyState();s.documents=[doc()];assert.deepEqual(nextNumber(s,'invoice'),{number:'INV-0002',next:3});assert.equal(nextNumber(s,'quote').number,'QUO-0001');
});
test('backup validation strips unknown keys and rejects duplicate IDs, unsafe logos and statuses',()=>{
 const s=emptyState();s.documents=[doc()];s.injected=true;s.settings.injected=true;
 const out=validateState(s);assert.equal(out.injected,undefined);assert.equal(out.settings.injected,undefined);
 assert.throws(()=>validateState({...s,documents:[doc(),doc()]}));
 assert.throws(()=>validateState({...s,documents:[doc({business:{...person,logo:'data:image/svg+xml,<svg onload=alert(1)>'}})]}));
 assert.throws(()=>validateState({...s,documents:[doc({status:'accepted'})]}));
 assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});
test('dashboard never mixes currencies, quotations or draft invoices',()=>{
 const result=dashboard([doc(),doc({status:'paid'}),doc({currency:'USD'}),doc({kind:'quote',status:'accepted'}),doc({status:'draft'})],'PKR');
 assert.deepEqual(result,{billed:2000,collected:1000,outstanding:1000,count:2});
});
class MemoryStorage{constructor(){this.values=new Map();}getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);}removeItem(k){this.values.delete(k);}}
test('store reads latest data for each mutation and keeps other app storage on reset',()=>{
 const storage=new MemoryStorage(),a=new AppStore(storage),b=new AppStore(storage);a.update(s=>s.clients.push({...person,id:'one'}));b.update(s=>s.clients.push({...person,id:'two'}));assert.equal(a.read().clients.length,2);storage.setItem('another-app','keep');a.reset();assert.equal(storage.getItem('another-app'),'keep');assert.equal(a.read().clients.length,0);
});
test('corrupt records are never silently replaced and quota failures preserve old data',()=>{
 const storage=new MemoryStorage(),store=new AppStore(storage);storage.setItem(STORAGE_KEY,'{broken');assert.throws(()=>store.read());assert.throws(()=>store.update(()=>{}));assert.equal(store.raw(),'{broken');storage.removeItem(STORAGE_KEY);store.update(s=>s.settings.name='Original');const before=store.raw();storage.setItem=()=>{throw new Error('QuotaExceededError');};assert.throws(()=>store.update(s=>s.settings.name='New'));assert.equal(store.raw(),before);
});
test('PDF writes a valid cross-reference table and two-page structure',()=>{
 const bytes=jpegPagesToPdf([{width:1,height:1,bytes:new Uint8Array([255,216,255,217])},{width:1,height:1,bytes:new Uint8Array([255,216,255,217])}]);const text=new TextDecoder().decode(bytes);assert.ok(text.startsWith('%PDF-1.4'));assert.match(text,/\/Count 2/);assert.ok(text.endsWith('%%EOF'));const start=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(bytes.slice(start,start+4)),'xref');
});
