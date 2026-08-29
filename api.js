// Nexora API client
const API_BASE = localStorage.getItem('nexora_api') || 'http://localhost:3000/api';
const apiToken = () => localStorage.getItem('nexora_token');
async function api(path, options={}) { const headers={...(options.headers||{})}; if(apiToken()) headers.Authorization='Bearer '+apiToken(); if(!(options.body instanceof FormData)) headers['Content-Type']='application/json'; const r=await fetch(API_BASE+path,{...options,headers}); const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.error||'API error'); return d; }
