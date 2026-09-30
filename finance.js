export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((n||0)/100);
export function cents(v){const s=String(v).trim().replace(/\s/g,'').replace(/\./g,'').replace(',','.');if(!/^-?\d+(\.\d{1,2})?$/.test(s))throw Error('Informe um valor válido, como 1.250,50.');const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n)||Math.abs(n)>1e12)throw Error('Valor fora do limite.');return n;}
export const inputMoney=n=>(n/100).toFixed(2).replace('.',',');
export function addMonths(date,n){const [y,m,d]=date.split('-').map(Number),last=new Date(Date.UTC(y,m+n,0)).getUTCDate();return new Date(Date.UTC(y,m-1+n,Math.min(d,last))).toISOString().slice(0,10);}
export function split(total,n){const base=Math.floor(total/n),rest=total%n;return Array.from({length:n},(_,i)=>base+(i<rest?1:0));}
export function billMonth(date,closing){return Number(date.slice(8))>=closing?addMonths(date,1).slice(0,7):date.slice(0,7);}
export function balance(account,entries,cutoff=today()){return account.initial+entries.filter(e=>e.status==='paid'&&e.date<=cutoff).reduce((s,e)=>s+(e.account===account.id?(e.type==='income'?e.amount:e.type==='card'?0:-e.amount):0)+(e.to===account.id?e.amount:0),0);}
export const isSpending=e=>['expense','card'].includes(e.type);
export function totals(entries,month){const es=entries.filter(e=>e.date.startsWith(month));return {income:es.filter(e=>e.type==='income'&&e.status==='paid').reduce((s,e)=>s+e.amount,0),expense:es.filter(e=>isSpending(e)&&(e.type==='card'||e.status==='paid')).reduce((s,e)=>s+e.amount,0),pending:es.filter(e=>e.status==='pending'&&e.type==='expense').reduce((s,e)=>s+e.amount,0),receivable:es.filter(e=>e.status==='pending'&&e.type==='income').reduce((s,e)=>s+e.amount,0)};}
export function cardBill(entries,id,month){return entries.filter(e=>e.card===id&&e.bill===month).reduce((s,e)=>s+(e.type==='card'?e.amount:e.type==='card_payment'?-e.amount:0),0);}
export function validate(kind,d){if(!d||typeof d!=='object')throw Error('Registro inválido.');if(kind!=='entry'&&(!d.name||d.name.length>120))throw Error('Informe um nome de até 120 caracteres.');if(kind==='entry'){if(!d.description||d.description.length>200)throw Error('Informe uma descrição de até 200 caracteres.');if(!Number.isSafeInteger(d.amount)||d.amount<=0||d.amount>1e12)throw Error('O valor precisa ser positivo.');if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(Date.parse(d.date)))throw Error('Data inválida.');if(!['income','expense','transfer','card','card_payment'].includes(d.type))throw Error('Tipo inválido.');if(!['paid','pending'].includes(d.status))throw Error('Situação inválida.');if(d.type!=='card'&&!d.account)throw Error('Selecione uma conta.');if(d.type==='transfer'&&(!d.to||d.to===d.account))throw Error('Escolha outra conta de destino.');if(['card','card_payment'].includes(d.type)&&(!d.card||!/^\d{4}-\d{2}$/.test(d.bill)))throw Error('Selecione cartão e fatura.');}return true;}

export function monthEnd(month){const [year,m]=month.split('-').map(Number);return new Date(Date.UTC(year,m,0)).toISOString().slice(0,10);}
export function invoiceDueDate(card,bill){const m=card.due<=card.closing?addMonths(bill+'-01',1).slice(0,7):bill;return m+'-'+String(Math.min(card.due,Number(monthEnd(m).slice(8)))).padStart(2,'0');}
// Cash projection: bank balance already includes confirmed payments. Only unpaid
// receipts/expenses and the outstanding part of each invoice are added below.
export function monthlyForecast(accounts,cards,entries,month,asOf=today()){
 const historical=month<asOf.slice(0,7),end=monthEnd(month),start=month+'-01';
 const available=accounts.reduce((s,a)=>s+balance(a,entries,asOf),0);
 const recordedEnd=accounts.reduce((s,a)=>s+balance(a,entries,end),0);
 const pending=entries.filter(e=>e.status==='pending'&&['income','expense'].includes(e.type)).map(e=>({...e,forecastKind:'entry'}));
 for(const card of cards){
  const bills=new Map();
  for(const e of entries){if(e.card!==card.id||!e.bill)continue;if(e.type==='card')bills.set(e.bill,(bills.get(e.bill)||0)+e.amount);else if(e.type==='card_payment'&&e.status==='paid'&&e.date<=asOf)bills.set(e.bill,(bills.get(e.bill)||0)-e.amount);}
  for(const [bill,amount] of bills)if(amount>0)pending.push({id:'invoice-'+card.id+'-'+bill,forecastKind:'invoice',type:'card_payment',description:'Fatura '+card.name,card:card.id,bill,amount,date:invoiceDueDate(card,bill),status:'pending',category:'Fatura do cartão'});
 }
 pending.sort((a,b)=>a.date.localeCompare(b.date)||a.description.localeCompare(b.description));
 const selected=pending.filter(e=>e.date>=start&&e.date<=end),prior=pending.filter(e=>e.date<start);
 const income=items=>items.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0);
 const outgoings=items=>items.filter(e=>e.type!=='income').reduce((s,e)=>s+e.amount,0);
 const receivable=income(selected),payable=outgoings(selected),priorReceivable=income(prior),priorPayable=outgoings(prior);
 const paid=entries.filter(e=>e.status==='paid'&&e.date>=start&&e.date<=end&&e.date<=asOf);
 const received=paid.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0);
 const spent=paid.filter(e=>['expense','card_payment'].includes(e.type)).reduce((s,e)=>s+e.amount,0);
 return {month,end,historical,available,recordedEnd,selected,prior,receivable,payable,priorReceivable,priorPayable,received,spent,
  totalIncome:received+receivable,totalOutgoings:spent+payable,
  expectedEnd:historical?recordedEnd:available+priorReceivable-priorPayable+receivable-payable};
}
