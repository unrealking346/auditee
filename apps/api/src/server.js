import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';
import {authRequired,requireRole,hashPassword,verifyPassword,signAccessToken} from './auth.js';
import {TerritoryEngine} from './services/territory.js';
import {RightsGraph} from './services/rights.js';
import {RoyaltyEngine} from './services/royalty.js';
import {MusicKnowledgeGraph} from './services/knowledge.js';
import {DiscoveryEngine} from './services/discovery.js';
import {TrustEngine} from './services/trust.js';
import {EditorialCMS} from './services/editorial.js';
import {AIGateway} from './services/ai.js';
import {IndustryAnalytics} from './services/analytics.js';
import {registerPlatformRoutes} from './routes/platform.js';

let prismaInstance = null;

const getPrisma = () => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
};

const prisma = new Proxy({}, {
  get(_target, property) {
    return getPrisma()[property];
  }
});
const app=express();
const port=Number(process.env.PORT||8080);
const uploadDir=path.resolve(process.env.UPLOAD_DIR||'./storage/uploads');
fs.mkdirSync(uploadDir,{recursive:true});

app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({origin:process.env.CORS_ORIGIN?.split(',')||true,credentials:true}));
app.use(express.json({limit:'1mb'}));

const upload=multer({
  dest:uploadDir,
  limits:{fileSize:250*1024*1024},
  fileFilter:(_r,f,cb)=>cb(null,new Set(['audio/mpeg','audio/wav','audio/x-wav','audio/flac','image/jpeg','image/png','image/webp']).has(f.mimetype))
});

const publicUser=u=>({id:u.id,email:u.email,username:u.username,displayName:u.displayName,role:u.role,country:u.country,region:u.region,language:u.language,timezone:u.timezone,avatarUrl:u.avatarUrl,coverUrl:u.coverUrl});

app.get('/health',(_r,s)=>s.json({ok:true,service:'waeve-api',time:new Date().toISOString(),platformServices:['rights-graph','royalty-engine','music-knowledge-graph','discovery-engine','trust-engine','editorial-cms','ai-gateway','industry-analytics','territory-engine']}));

const territory=new TerritoryEngine(prisma);
const rights=new RightsGraph(prisma,territory);
const royalty=new RoyaltyEngine(prisma,rights);
const knowledge=new MusicKnowledgeGraph(prisma);
const discovery=new DiscoveryEngine(prisma);
const trust=new TrustEngine(prisma);
const editorial=new EditorialCMS(prisma);
const ai=new AIGateway(prisma);
const analytics=new IndustryAnalytics(prisma);
registerPlatformRoutes(app,{prisma,auth:authRequired(prisma),roles:(...r)=>requireRole(...r),services:{territory,rights,royalty,knowledge,discovery,trust,editorial,ai,analytics}});

app.post('/api/v1/auth/register',async(req,res,next)=>{
  try{
    const i=z.object({email:z.string().email(),password:z.string().min(12),username:z.string().min(3).max(32).regex(/^[A-Za-z0-9_]+$/),displayName:z.string().min(1).max(80),country:z.string().length(2).optional(),region:z.string().max(80).optional()}).parse(req.body);
    const email=i.email.toLowerCase();
    const exists=await prisma.user.findFirst({where:{OR:[{email},{username:i.username}]}});
    if(exists)return res.status(409).json({error:{code:'ACCOUNT_EXISTS',message:'Email or username already exists.'}});
    const {password,...profile}=i;
    const user=await prisma.user.create({data:{...profile,email,passwordHash:await hashPassword(password)}});
    await prisma.subscription.create({data:{userId:user.id,tier:'FREE'}});
    res.status(201).json({user:publicUser(user),accessToken:signAccessToken(user)});
  }catch(e){next(e)}
});

app.post('/api/v1/auth/login',async(req,res,next)=>{
  try{
    const i=z.object({email:z.string().email(),password:z.string()}).parse(req.body);
    const u=await prisma.user.findUnique({where:{email:i.email.toLowerCase()}});
    if(!u||!(await verifyPassword(i.password,u.passwordHash)))return res.status(401).json({error:{code:'INVALID_CREDENTIALS',message:'Invalid credentials.'}});
    res.json({user:publicUser(u),accessToken:signAccessToken(u)});
  }catch(e){next(e)}
});

app.get('/api/v1/me',authRequired(prisma),async(req,res)=>{
  const user=await prisma.user.findUnique({where:{id:req.user.id},include:{artist:true,subscription:true}});
  res.json({user});
});

app.get('/api/v1/home',async(_req,res)=>{
  const [tracks,artists]=await Promise.all([
    prisma.track.findMany({take:24,orderBy:{createdAt:'desc'},include:{release:{include:{artist:true}}}}),
    prisma.artist.findMany({take:12,orderBy:{score:'desc'}})
  ]);
  res.json({recentlyPlayed:[],madeForYou:tracks.slice(0,8),newReleases:tracks.slice(0,12),risingArtists:artists});
});

app.get('/api/v1/search',async(req,res)=>{
  const q=String(req.query.q||'').trim();
  if(!q)return res.json({tracks:[],artists:[],releases:[],playlists:[]});
  const [tracks,artists,releases,playlists]=await Promise.all([
    prisma.track.findMany({where:{title:{contains:q,mode:'insensitive'}},take:20,include:{release:true}}),
    prisma.artist.findMany({where:{stageName:{contains:q,mode:'insensitive'}},take:20}),
    prisma.release.findMany({where:{title:{contains:q,mode:'insensitive'}},take:20,include:{artist:true}}),
    prisma.playlist.findMany({where:{name:{contains:q,mode:'insensitive'}},take:20})
  ]);
  res.json({tracks,artists,releases,playlists});
});

app.get('/api/v1/playlists',authRequired(prisma),async(req,res)=>{
  const playlists=await prisma.playlist.findMany({where:{ownerId:req.user.id},include:{tracks:{include:{track:true},orderBy:{position:'asc'}}},orderBy:{updatedAt:'desc'}});
  res.json({playlists});
});

app.post('/api/v1/playlists',authRequired(prisma),async(req,res,next)=>{
  try{
    const i=z.object({name:z.string().min(1).max(120),description:z.string().max(500).optional(),collaborative:z.boolean().default(false),visibility:z.enum(['PUBLIC','PRIVATE','UNLISTED']).default('PRIVATE')}).parse(req.body);
    const p=await prisma.playlist.create({data:{ownerId:req.user.id,...i}});
    res.status(201).json({playlist:p});
  }catch(e){next(e)}
});

app.post('/api/v1/playlists/:id/tracks',authRequired(prisma),async(req,res,next)=>{
  try{
    const i=z.object({trackId:z.string()}).parse(req.body);
    const p=await prisma.playlist.findUnique({where:{id:req.params.id}});
    if(!p||(p.ownerId!==req.user.id&&!p.collaborative))return res.status(403).json({error:{code:'FORBIDDEN',message:'You cannot edit this playlist.'}});
    const last=await prisma.playlistTrack.findFirst({where:{playlistId:p.id},orderBy:{position:'desc'}});
    const row=await prisma.playlistTrack.create({data:{playlistId:p.id,trackId:i.trackId,position:(last?.position??-1)+1}});
    res.status(201).json({track:row});
  }catch(e){next(e)}
});

app.post('/api/v1/tracks/:id/like',authRequired(prisma),async(req,res)=>{
  const existing=await prisma.like.findFirst({where:{userId:req.user.id,trackId:req.params.id}});
  if(existing){await prisma.like.delete({where:{id:existing.id}});return res.json({liked:false})}
  await prisma.like.create({data:{userId:req.user.id,trackId:req.params.id}});
  res.json({liked:true});
});

app.post('/api/v1/artists/:id/follow',authRequired(prisma),async(req,res)=>{
  const a=await prisma.artist.findUnique({where:{id:req.params.id}});
  if(!a)return res.status(404).json({error:{code:'NOT_FOUND',message:'Artist not found.'}});
  const f=await prisma.follow.findFirst({where:{followerId:req.user.id,targetType:'ARTIST',targetId:a.id}});
  if(f){await prisma.follow.delete({where:{id:f.id}});await prisma.artist.update({where:{id:a.id},data:{followersCount:{decrement:1}}});return res.json({following:false})}
  await prisma.follow.create({data:{followerId:req.user.id,targetType:'ARTIST',targetId:a.id}});
  await prisma.artist.update({where:{id:a.id},data:{followersCount:{increment:1}}});
  res.json({following:true});
});

app.post('/api/v1/playback/events',authRequired(prisma),async(req,res,next)=>{
  try{
    const i=z.object({trackId:z.string(),playedMs:z.number().int().nonnegative(),completed:z.boolean().default(false),region:z.string().max(80).optional(),territoryCode:z.string().length(2).optional()}).parse(req.body);
    const trustDecision=await trust.score({userId:req.user.id,targetType:'TRACK',targetId:i.trackId,eventType:'STREAM',ip:req.ip,device:req.headers['x-device-id'],fingerprint:req.headers['x-device-fingerprint'],signals:{playedMs:i.playedMs,completed:i.completed}});
    if(trustDecision.decision==='BLOCK') return res.status(202).json({accepted:false,blocked:true,reason:'TRUST_POLICY',trustDecision});
    if(i.territoryCode){const authz=await rights.authorize('TRACK',i.trackId,i.territoryCode);if(!authz.allowed)return res.status(403).json({error:{code:'TERRITORY_NOT_LICENSED',message:authz.reason}});}
    const e=await prisma.playEvent.create({data:{userId:req.user.id,trackId:i.trackId,playedMs:i.playedMs,completed:i.completed,region:i.region}});
    res.status(202).json({accepted:true,eventId:e.id,trustDecision});
  }catch(e){next(e)}
});

app.post('/api/v1/artists/releases',authRequired(prisma),requireRole('ARTIST'),upload.fields([{name:'audio',maxCount:20},{name:'artwork',maxCount:1}]),async(req,res,next)=>{
  try{
    const a=await prisma.artist.findUnique({where:{userId:req.user.id}});
    if(!a)return res.status(400).json({error:{code:'ARTIST_PROFILE_REQUIRED',message:'Create an artist profile first.'}});
    const m=z.object({title:z.string().min(1),type:z.enum(['SINGLE','EP','ALBUM']),genre:z.string().optional(),subgenre:z.string().optional(),mood:z.string().optional(),language:z.string().optional(),explicit:z.string().optional(),releaseDate:z.string().optional()}).parse(req.body);
    const r=await prisma.release.create({data:{title:m.title,type:m.type,artistId:a.id,uploadedById:req.user.id,genre:m.genre,subgenre:m.subgenre,mood:m.mood,language:m.language,explicit:m.explicit==='true',releaseDate:m.releaseDate?new Date(m.releaseDate):null,status:'VALIDATING'}});
    res.status(202).json({release:r,pipeline:['VALIDATING','AUDIO_CHECK','ARTWORK_CHECK','RIGHTS_CHECK','MODERATION','SCHEDULE','PUBLISH']});
  }catch(e){next(e)}
});

app.delete('/api/v1/account',authRequired(prisma),async(req,res)=>{
  await prisma.user.delete({where:{id:req.user.id}});
  res.status(204).end();
});

app.use((err,_req,res,_next)=>{
  if(err?.name==='ZodError')return res.status(400).json({error:{code:'VALIDATION_ERROR',message:err.issues?.[0]?.message||'Invalid request.'}});
  console.error(err);res.status(500).json({error:{code:'INTERNAL_ERROR',message:'Unexpected server error.'}});
});
app.listen(port,()=>console.log(`WAEVE API listening on :${port}`));
