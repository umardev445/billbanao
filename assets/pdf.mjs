import {calculate, money, displayDate} from './core.mjs';
import {translate} from './i18n.mjs';
// Small dependency-free PDF writer. Text is rendered by the browser to a local
// canvas, preserving Urdu shaping and fonts without any server or remote font.
// Pages are embedded as JPEG images: PDFs are printable but not selectable text.
export function jpegPagesToPdf(pages) {
  const enc=new TextEncoder(), parts=[], offsets=[0]; let length=0;
  const push=value=>{const bytes=typeof value==='string'?enc.encode(value):value;parts.push(bytes);length+=bytes.length;};
  const object=(id,body)=>{offsets[id]=length;push(`${id} 0 obj\n`);push(body);push('\nendobj\n');};
  push('%PDF-1.4\n%BillBanao\n');
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  const kids=pages.map((_,i)=>`${3+i*3} 0 R`).join(' ');
  object(2,`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  pages.forEach((p,i)=>{
    const page=3+i*3, content=page+1, img=page+2;
    object(page,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im${i} ${img} 0 R >> >> /Contents ${content} 0 R >>`);
    const commands=`q\n595.28 0 0 841.89 0 0 cm\n/Im${i} Do\nQ\n`;
    object(content,`<< /Length ${enc.encode(commands).length} >>\nstream\n${commands}endstream`);
    offsets[img]=length;
    push(`${img} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`);
    push(p.bytes);push('\nendstream\nendobj\n');
  });
  const xref=length, count=3+pages.length*3;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for(let i=1;i<count;i++)push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const output=new Uint8Array(length);let cursor=0;for(const part of parts){output.set(part,cursor);cursor+=part.length;}return output;
}
function loadImage(src){return new Promise(resolve=>{if(!src)return resolve(null);const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});}
export async function createPdf(doc, sample=false) {
  await document.fonts?.ready;
  const logo=await loadImage(doc.business.logo), totals=calculate(doc), t=k=>translate(doc.locale,k);
  const W=1240,H=1754,M=88,BOTTOM=H-110, pages=[];let canvas,ctx,y;
  const font='"Segoe UI", Tahoma, Arial, sans-serif';
  function setFont(size=23,bold=false){ctx.font=`${bold?'600':'400'} ${size}px ${font}`;}
  function lines(value,maxWidth,size=23,bold=false){
    setFont(size,bold);const result=[];
    for(const paragraph of String(value || '').split('\n')){
      let line='';
      for(const token of paragraph.split(/\s+/)){
        if(ctx.measureText(token).width>maxWidth){
          if(line){result.push(line);line='';}
          for(const ch of Array.from(token)){if(ctx.measureText(line+ch).width>maxWidth){result.push(line);line='';}line+=ch;}
        }else if(line && ctx.measureText(`${line} ${token}`).width>maxWidth){result.push(line);line=token;}
        else line+=(line?' ':'')+token;
      }
      result.push(line);
    }return result;
  }
  function text(value,x,top,width,options={}){
    const size=options.size || 23,lh=options.lh || Math.round(size*1.6),bold=!!options.bold;
    const wrapped=lines(value,width,size,bold);setFont(size,bold);ctx.fillStyle=options.color || '#243b32';ctx.textBaseline='top';ctx.textAlign=options.align || 'left';ctx.direction=options.rtl?'rtl':'ltr';
    for(let i=0;i<wrapped.length;i++)ctx.fillText(wrapped[i],x,top+i*lh);
    return top+wrapped.length*lh;
  }
  function rule(at,color='#e3e9dd'){ctx.fillStyle=color;ctx.fillRect(M,at,W-2*M,2);}
  function page(continued=false){canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');if(!ctx)throw new Error('PDF rendering is unavailable in this browser.');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);pages.push(canvas);y=M;if(continued){text(doc.business.name,M,y,650,{size:22,bold:true});text(doc.number,W-M,y,290,{size:20,align:'right',color:'#78846f'});y+=60;rule(y);y+=25;}}
  function ensure(height){if(y+height>BOTTOM)page(true);}
  function label(value,x,at,width){return text(value,x,at,width,{size:17,color:'#829173',bold:true});}
  function party(p,x,at,width,title){let py=label(title,x,at,width)+14;py=text(p.name,x,py,width,{size:26,bold:true,rtl:doc.locale==='ur'})+7;for(const v of [p.address,p.email,p.phone].filter(Boolean))py=text(v,x,py,width,{size:20,color:'#6f7d63',rtl:/[\u0600-\u06ff]/.test(v)})+5;return py;}
  function itemHeader(){ctx.fillStyle='#214e3b';ctx.fillRect(M,y,W-2*M,53);text(t('description'),M+17,y+13,560,{size:18,color:'#fff',bold:true,rtl:doc.locale==='ur'});text(t('qty'),784,y+13,90,{size:18,color:'#fff',align:'right'});text(t('rate'),965,y+13,160,{size:18,color:'#fff',align:'right'});text(t('amount'),W-M-16,y+13,170,{size:18,color:'#fff',align:'right'});y+=53;}
  page();
  if(sample){ctx.fillStyle='#f7f0de';ctx.fillRect(M,y,W-2*M,42);text(t('example'),W/2,y+10,W-2*M,{size:16,align:'center',color:'#8c7540'});y+=65;}
  let bx=M;
  if(logo){const ratio=Math.min(70/logo.width,70/logo.height);ctx.drawImage(logo,M,y,logo.width*ratio,logo.height*ratio);bx+=90;}
  const titleEnd=text(doc.business.name,bx,y,620-(bx-M),{size:32,bold:true,color:'#214e3b',rtl:doc.locale==='ur'});
  text(t(doc.kind==='quote'?'quoteLabel':'invoiceLabel'),W-M,y,350,{size:36,bold:true,color:'#214e3b',align:'right',rtl:doc.locale==='ur'});
  text(doc.number,W-M,y+59,330,{size:21,align:'right',color:'#8a977d'});
  text(t(doc.status),W-M,y+91,330,{size:17,align:'right',color:'#66854c',rtl:doc.locale==='ur'});
  y=Math.max(titleEnd,y+123)+26;rule(y,'#214e3b');y+=35;
  const p1=party(doc.business,M,y,460,t('from')),p2=party(doc.client,680,y,472,t('billTo'));y=Math.max(p1,p2)+28;
  ensure(110);ctx.fillStyle='#f3f6ee';ctx.fillRect(M,y,W-2*M,88);label(t('documentDate'),M+20,y+13,400);text(displayDate(doc.issueDate,doc.locale),M+20,y+42,400,{size:21});if(doc.dueDate){label(t(doc.kind==='quote'?'validUntil':'dueDate'),680,y+13,400);text(displayDate(doc.dueDate,doc.locale),680,y+42,400,{size:21});}y+=119;
  ensure(125);itemHeader();
  for(let i=0;i<doc.items.length;i++){
    const row=doc.items[i],desc=lines(row.description,560,21),rh=Math.max(67,desc.length*34+29);
    if(y+rh>BOTTOM){page(true);itemHeader();}
    text(row.description,M+17,y+16,560,{size:21,lh:34,rtl:doc.locale==='ur'});
    text(row.quantity,784,y+16,90,{size:19,align:'right'});
    text(money(Math.round(Number(row.rate)*100),doc.currency,doc.locale),965,y+16,160,{size:17,align:'right'});
    text(money(totals.rows[i],doc.currency,doc.locale),W-M-16,y+16,170,{size:17,align:'right'});
    y+=rh;rule(y);
  }
  y+=26;ensure(250);
  function totalRow(name,value,grand=false){if(grand){ctx.fillStyle='#eaf1df';ctx.fillRect(650,y,502,58);}text(name,670,y+12,245,{size:grand?24:20,bold:grand,color:grand?'#214e3b':'#819174',rtl:doc.locale==='ur'});text(money(value,doc.currency,doc.locale),W-M-17,y+12,310,{size:grand?24:20,bold:grand,align:'right'});y+=grand?64:45;}
  totalRow(t('subtotal'),totals.subtotal);if(totals.discount)totalRow(`${t('discountLabel')} (${doc.discount}%)`,-totals.discount);if(totals.tax)totalRow(`${t('taxLabel')} (${doc.tax}%)`,totals.tax);totalRow(t('total'),totals.total,true);
  if(doc.notes){y+=34;ensure(95);rule(y);y+=25;label(t('notes'),M,y,1000);y+=40;const noteLines=lines(doc.notes,W-M*2,21);for(const ln of noteLines){ensure(36);text(ln,M,y,W-M*2,{size:21,color:'#76876a',rtl:doc.locale==='ur'});y+=34;}}
  for(let i=0;i<pages.length;i++){
    canvas=pages[i];ctx=canvas.getContext('2d');rule(H-83);text('BillBanao',M,H-61,400,{size:16,color:'#8e9d82'});text(`${i+1} / ${pages.length}`,W-M,H-61,200,{size:16,align:'right',color:'#8e9d82'});
  }
  const encoded=pages.map(c=>({width:W,height:H,bytes:Uint8Array.from(atob(c.toDataURL('image/jpeg',.94).split(',')[1]),ch=>ch.charCodeAt(0))}));
  return new Blob([jpegPagesToPdf(encoded)],{type:'application/pdf'});
}
export function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
