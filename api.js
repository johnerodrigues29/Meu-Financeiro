const config=window.APP_CONFIG||{};
function safeKey(key){if(!key||key.startsWith('sb_secret_'))return false;if(key.startsWith('sb_publishable_'))return true;try{return JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{return false;}}
export const configured=()=>/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl||'')&&safeKey(config.supabaseKey);
let session=null,refreshing=null;
try{session=JSON.parse(sessionStorage.getItem('mf-session')||'null');}catch{}
function keep(s){session=s;try{s?sessionStorage.setItem('mf-session',JSON.stringify(s)):sessionStorage.removeItem('mf-session');}catch{}}
async function request(path,{method='GET',body,auth=false}={}){
 if(!configured())throw Error('Configure a conexão seguindo o guia de instalação.');
 const headers={apikey:config.supabaseKey,'Content-Type':'application/json'};
 if(auth){await refresh();if(!session)throw Error('Entre novamente para continuar.');headers.Authorization=`Bearer ${session.access_token}`;}
 let r;try{r=await fetch(config.supabaseUrl+path,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});}catch{throw Error('Sem conexão. Seus dados não foram alterados. Tente novamente.');}
 const text=await r.text();let data;try{data=text?JSON.parse(text):null;}catch{throw Error('Resposta inesperada do servidor.');}
 if(!r.ok){if(auth&&r.status===401){keep(null);window.dispatchEvent(new Event('session-expired'));}throw Error(data?.message||data?.error_description||data?.msg||'Não foi possível concluir.');}return data;
}
async function refresh(){if(!session||session.expires_at>Date.now()/1000+90)return;if(!refreshing)refreshing=request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}}).then(keep).catch(e=>{keep(null);window.dispatchEvent(new Event('session-expired'));throw e;}).finally(()=>refreshing=null);await refreshing;}
export const api={
 recoverFromURL(){const p=new URLSearchParams(location.hash.slice(1));if(p.get('type')!=='recovery'||!p.get('access_token')||!p.get('refresh_token'))return false;keep({access_token:p.get('access_token'),refresh_token:p.get('refresh_token'),expires_at:Date.now()/1000+Number(p.get('expires_in')||3600),user:{}});history.replaceState(null,'',location.pathname+location.search);return true;},
 get user(){return session?.user;},
 async login(email,password){keep(await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}}));},
 async logout(){try{if(session)await request('/auth/v1/logout',{method:'POST',auth:true});}finally{keep(null);}},
 async member(){return (await request('/rest/v1/family_members?select=name',{auth:true}))[0];},
 async records(){let all=[],offset=0;while(true){const rows=await request(`/rest/v1/records?select=*&order=id&limit=500&offset=${offset}`,{auth:true});all.push(...rows);if(rows.length<500)return all;offset+=500;}},
 save(operations){return request('/rest/v1/rpc/change_records',{method:'POST',body:{operations},auth:true});},
 password(password){return request('/auth/v1/user',{method:'PUT',body:{password},auth:true});}
};
