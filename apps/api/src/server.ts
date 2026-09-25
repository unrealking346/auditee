import 'dotenv/config'; import express from 'express'; import cors from 'cors'; import helmet from 'helmet'; import rateLimit from 'express-rate-limit'; import path from 'node:path'; import fs from 'node:fs'; import routes from './routes/index.js';
const app=express(); const port=Number(process.env.API_PORT||4000); const origin=process.env.WEB_ORIGIN||'http://localhost:5173';
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}})); app.use(cors({origin,credentials:true})); app.use(express.json({limit:'1mb'})); app.use(rateLimit({windowMs:60_000,max:300,standardHeaders:true,legacyHeaders:false}));
const uploadDir=path.resolve(process.env.UPLOAD_DIR||'./storage'); fs.mkdirSync(uploadDir,{recursive:true}); app.use('/media',express.static(uploadDir,{maxAge:'1h',fallthrough:false}));
app.get('/health',(_req,res)=>res.json({ok:true,service:'waeve-api',time:new Date().toISOString()})); app.use('/v1',routes);
app.use((err:any,_req:any,res:any,_next:any)=>{console.error(err); if(err?.name==='ZodError')return res.status(400).json({error:'Invalid request',details:err.issues}); if(err?.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'File too large'}); res.status(500).json({error:'Internal server error'});});
const host=process.env.API_HOST||'0.0.0.0'; app.listen(port,host,()=>console.log(`WAEVE API listening on ${host}:${port}`));
