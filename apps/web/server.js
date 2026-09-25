const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const UPLOADS = path.join(ROOT, 'uploads');
for (const dir of [DATA, UPLOADS]) fs.mkdirSync(dir, { recursive: true });
const DB_FILE = path.join(DATA, 'waeve.json');

const seed = {
  users: [], artists: [], tracks: [], albums: [], playlists: [], likes: [], follows: [], plays: [],
  sessions: [], recommendations: [], settings: {}
};
function loadDB(){
  try { return {...seed, ...JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}; }
  catch { fs.writeFileSync(DB_FILE, JSON.stringify(seed,null,2)); return {...seed}; }
}
let db = loadDB();
function save(){ fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2)); }
function id(prefix){ return `${prefix}_${crypto.randomBytes(7).toString('hex')}`; }
function hash(v){ return crypto.createHash('sha256').update(String(v)).digest('hex'); }
function json(res, code, body){ res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(body)); }
function body(req){ return new Promise((resolve,reject)=>{let s=''; req.on('data',c=>{s+=c}); req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});}); }
function user(req){ const token=(req.headers.authorization||'').replace(/^Bearer\s+/,''); return db.sessions.find(s=>s.token===token)?.userId ? db.users.find(u=>u.id===db.sessions.find(s=>s.token===token).userId) : null; }
function safeUser(u){ if(!u)return null; const {passwordHash,...x}=u; return x; }
function seedIfEmpty(){
  if(db.tracks.length) return;
  const demo=[
    ['Neon Horizon','Waeve Studio','Electronic','Demo Signal','https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80'],
    ['Midnight Run','Waeve Studio','Afrobeat','City Lights','https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80'],
    ['Golden Hour','Waeve Studio','Pop','Open Skies','https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'],
    ['River Code','Waeve Studio','Hip-Hop','New Current','https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?auto=format&fit=crop&w=900&q=80']
  ];
  const artist={id:id('art'),name:'Waeve Studio',slug:'waeve-studio',verified:true,followers:0,monthlyListeners:0,region:'Global'}; db.artists.push(artist);
  for(const [title,an,genre,album,artwork] of demo) db.tracks.push({id:id('trk'),title,artistId:artist.id,artistName:an,albumTitle:album,genre,artwork,duration:180,source:'demo',plays:0,likes:0,releaseDate:new Date().toISOString(),explicit:false});
  db.albums.push({id:id('alb'),title:'Waeve Sessions',artistId:artist.id,artistName:artist.name,artwork:demo[0][4],genre:'Electronic',type:'album',trackIds:db.tracks.map(t=>t.id)});
  save();
}
seedIfEmpty();

async function route(req,res){
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`); const p=u.pathname;
  if(p==='/api/health') return json(res,200,{ok:true,version:'2.0.0',time:new Date().toISOString()});
  if(p==='/api/bootstrap') return json(res,200,{ok:true,user:safeUser(user(req)),tracks:db.tracks,artists:db.artists,albums:db.albums,playlists:db.playlists,genres:[...new Set(db.tracks.map(t=>t.genre))],premium:{priceMonthly:'4.99',trialDays:30},features:['Waeve Radio','Waeve Intelligence','Regional Charts','Artist Insights','Time-synced Lyrics','Collaborative Playlists','Queue Intelligence']});
  if(p==='/api/auth/register' && req.method==='POST'){
    const b=await body(req); if(!b.email||!b.password||!b.name)return json(res,400,{error:'name, email and password are required'});
    if(db.users.some(x=>x.email.toLowerCase()===b.email.toLowerCase()))return json(res,409,{error:'Account already exists'});
    const u={id:id('usr'),name:String(b.name).slice(0,80),email:b.email.toLowerCase(),passwordHash:hash(b.password),role:b.role==='artist'?'artist':'listener',region:b.region||'Global',createdAt:new Date().toISOString(),premium:false,trialEndsAt:new Date(Date.now()+30*86400000).toISOString(),stats:{minutes:0,plays:0,likes:0}};
    db.users.push(u); const token=crypto.randomBytes(32).toString('hex'); db.sessions.push({token,userId:u.id,createdAt:Date.now()}); save(); return json(res,201,{token,user:safeUser(u)});
  }
  if(p==='/api/auth/login' && req.method==='POST'){
    const b=await body(req); const u=db.users.find(x=>x.email===String(b.email||'').toLowerCase()); if(!u||u.passwordHash!==hash(b.password))return json(res,401,{error:'Invalid credentials'});
    const token=crypto.randomBytes(32).toString('hex'); db.sessions.push({token,userId:u.id,createdAt:Date.now()}); save(); return json(res,200,{token,user:safeUser(u)});
  }
  if(p==='/api/search'){
    const q=(u.searchParams.get('q')||'').toLowerCase().trim(); const match=(x)=>!q||[x.title,x.artistName,x.name,x.genre,x.albumTitle].filter(Boolean).some(v=>String(v).toLowerCase().includes(q));
    return json(res,200,{tracks:db.tracks.filter(match).slice(0,50),artists:db.artists.filter(match).slice(0,30),albums:db.albums.filter(match).slice(0,30)});
  }
  if(p==='/api/play' && req.method==='POST'){
    const me=user(req); const b=await body(req); const t=db.tracks.find(x=>x.id===b.trackId); if(!t)return json(res,404,{error:'Track not found'});
    t.plays=(t.plays||0)+1; db.plays.push({id:id('ply'),userId:me?.id||null,trackId:t.id,at:new Date().toISOString(),source:b.source||t.source}); if(me){me.stats.plays++; me.stats.minutes+=(t.duration||180)/60;} save(); return json(res,200,{ok:true,track:t});
  }
  if(p==='/api/like' && req.method==='POST'){
    const me=user(req); if(!me)return json(res,401,{error:'Login required'}); const b=await body(req); const exists=db.likes.find(x=>x.userId===me.id&&x.trackId===b.trackId); if(exists) db.likes=db.likes.filter(x=>x!==exists); else db.likes.push({userId:me.id,trackId:b.trackId,at:new Date().toISOString()}); save(); return json(res,200,{liked:!exists});
  }
  if(p==='/api/follow' && req.method==='POST'){
    const me=user(req); if(!me)return json(res,401,{error:'Login required'}); const b=await body(req); const exists=db.follows.find(x=>x.userId===me.id&&x.artistId===b.artistId); if(exists)db.follows=db.follows.filter(x=>x!==exists);else db.follows.push({userId:me.id,artistId:b.artistId,at:new Date().toISOString()}); save(); return json(res,200,{following:!exists});
  }
  if(p==='/api/playlists' && req.method==='GET') return json(res,200,{playlists:db.playlists.filter(x=>x.ownerId===user(req)?.id)});
  if(p==='/api/playlists' && req.method==='POST'){
    const me=user(req); if(!me)return json(res,401,{error:'Login required'}); const b=await body(req); const pl={id:id('pl'),ownerId:me.id,name:String(b.name||'My Playlist').slice(0,80),description:String(b.description||''),collaborative:!!b.collaborative,trackIds:[],followers:0,createdAt:new Date().toISOString()}; db.playlists.push(pl); save(); return json(res,201,pl);
  }
  if(p==='/api/recommendations'){
    const me=user(req); const region=me?.region||'Global'; const liked=new Set(db.likes.filter(x=>x.userId===me?.id).map(x=>x.trackId)); const played=new Set(db.plays.filter(x=>x.userId===me?.id).map(x=>x.trackId));
    const tracks=[...db.tracks].sort((a,b)=>(b.plays||0)-(a.plays||0)).filter(t=>!liked.has(t.id)); return json(res,200,{region,forYou:tracks.slice(0,12),becauseYouLiked:[...db.tracks].filter(t=>liked.has(t.id)).slice(0,6),continueListening:[...db.tracks].filter(t=>played.has(t.id)).slice(0,6),dailyMix:tracks.slice(2,10)});
  }
  if(p==='/api/artist/upload' && req.method==='POST'){
    const me=user(req); if(!me||me.role!=='artist')return json(res,403,{error:'Artist account required'});
    const b=await body(req); const t={id:id('trk'),title:b.title,artistId:me.id,artistName:me.name,albumTitle:b.albumTitle||'Singles',genre:b.genre||'Other',artwork:b.artwork||'',duration:Number(b.duration||0),source:'waeve-upload',plays:0,likes:0,releaseDate:new Date().toISOString(),explicit:!!b.explicit,lyrics:b.lyrics||null,credits:b.credits||{}}; db.tracks.push(t); save(); return json(res,201,t);
  }
  if(p==='/api/stats'){
    const me=user(req); if(!me)return json(res,401,{error:'Login required'}); const mine=db.plays.filter(x=>x.userId===me.id); const counts={}; for(const x of mine)counts[x.trackId]=(counts[x.trackId]||0)+1; const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,plays])=>({...db.tracks.find(t=>t.id===id),plays})); return json(res,200,{minutes:Math.round(me.stats.minutes),plays:me.stats.plays,likes:db.likes.filter(x=>x.userId===me.id).length,top});
  }
  if(p.startsWith('/api/')) return json(res,404,{error:'API route not found'});
  return serveStatic(p,res);
}
function serveStatic(p,res){
  let file=path.join(PUBLIC,p==='/'?'/index.html':p); if(!file.startsWith(PUBLIC))return json(res,403,{error:'Forbidden'});
  fs.stat(file,(e,s)=>{ if(e||!s.isFile()) file=path.join(PUBLIC,'index.html'); fs.readFile(file,(er,data)=>{if(er)return json(res,500,{error:'Unable to load Waeve'}); const ext=path.extname(file); const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}; res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);});});
}
const PORT=Number(process.env.PORT||8787); http.createServer((req,res)=>route(req,res).catch(e=>{console.error(e);json(res,500,{error:'Waeve server error'});})).listen(PORT,()=>console.log(`Waeve ${PORT}: http://localhost:${PORT}`));
