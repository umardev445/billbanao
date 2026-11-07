import {CONFIG} from './config.js';
const email=CONFIG.supportEmail.trim(),name=CONFIG.publisherName.trim();
const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&!/[\r\n]/.test(email);
if(name)for(const node of document.querySelectorAll('[data-publisher]'))node.textContent=name;
for(const node of document.querySelectorAll('[data-version]'))node.textContent=CONFIG.version;
for(const node of document.querySelectorAll('[data-effective-date]'))node.textContent=CONFIG.effectiveDate;
if(name&&validEmail){
 for(const node of document.querySelectorAll('[data-publisher-notice]'))node.hidden=true;
 for(const node of document.querySelectorAll('[data-contact-inline],[data-contact-block]')){
  const a=document.createElement('a');a.href=`mailto:${encodeURIComponent(email).replace(/%40/g,'@')}`;a.textContent=email;node.replaceChildren(a);
 }
}
