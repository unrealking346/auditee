import {z} from 'zod';
export function registerPlatformRoutes(app,{prisma,auth,roles,services}){
  const {territory,rights,royalty,knowledge,discovery,trust,editorial,ai,analytics}=services;
  app.get('/api/v1/platform/territories/:code',async(req,res)=>{const t=await territory.resolve(req.params.code);res.json({territory:t})});
  app.post('/api/v1/platform/rights/grants',auth,roles('ADMIN','ARTIST'),async(req,res,next)=>{try{const i=z.object({resourceType:z.string(),resourceId:z.string(),rightType:z.enum(['MASTER','PUBLISHING','MECHANICAL','PERFORMANCE','NEIGHBORING','LYRICS','ARTWORK','SYNC','UGC','OFFLINE','REMIX','AI']),ownerName:z.string(),ownerPartyId:z.string().optional(),percentage:z.number().min(0).max(100),territoryCode:z.string().length(2),status:z.enum(['DRAFT','ACTIVE','SUSPENDED','EXPIRED','REJECTED']).optional(),startsAt:z.string().optional(),endsAt:z.string().optional(),contractRef:z.string().optional(),metadata:z.any().optional()}).parse(req.body);res.status(201).json({grant:await rights.upsertGrant(i)})}catch(e){next(e)}});
  app.get('/api/v1/platform/rights/:resourceType/:resourceId',async(req,res)=>res.json({rights:await rights.getGraph(req.params.resourceType,req.params.resourceId)}));
  app.post('/api/v1/platform/rights/authorize',async(req,res)=>res.json(await rights.authorize(req.body.resourceType,req.body.resourceId,req.body.territoryCode)));
  app.post('/api/v1/platform/royalties/calculate',auth,roles('ADMIN'),async(req,res,next)=>{try{res.json({ledger:await royalty.calculate(req.body)})}catch(e){next(e)}});
  app.get('/api/v1/platform/royalties/:ownerPartyId',auth,async(req,res)=>res.json({statement:await royalty.statement(req.params.ownerPartyId,req.query.from,req.query.to)}));
  app.post('/api/v1/platform/knowledge/entities',auth,roles('ADMIN','ARTIST'),async(req,res)=>res.status(201).json({entity:await knowledge.entity(req.body)}));
  app.post('/api/v1/platform/knowledge/relations',auth,roles('ADMIN','ARTIST'),async(req,res)=>res.status(201).json({relation:await knowledge.relate(req.body)}));
  app.get('/api/v1/platform/knowledge/:id',async(req,res)=>res.json({relations:await knowledge.neighborhood(req.params.id)}));
  app.get('/api/v1/platform/discovery',auth,async(req,res)=>res.json({recommendations:await discovery.recommend(req.user.id,{limit:Number(req.query.limit||20),region:req.query.region})}));
  app.post('/api/v1/platform/trust/score',auth,async(req,res)=>res.json(await trust.score({...req.body,userId:req.user.id,ip:req.ip,device:req.headers['x-device-id'],fingerprint:req.headers['x-device-fingerprint']})));
  app.post('/api/v1/platform/editorial/collections',auth,roles('ADMIN','MODERATOR'),async(req,res)=>res.status(201).json({collection:await editorial.create(req.body)}));
  app.post('/api/v1/platform/editorial/:id/items',auth,roles('ADMIN','MODERATOR'),async(req,res)=>res.status(201).json({item:await editorial.addItem(req.params.id,req.body)}));
  app.post('/api/v1/platform/editorial/:id/publish',auth,roles('ADMIN','MODERATOR'),async(req,res)=>res.json({collection:await editorial.publish(req.params.id)}));
  app.get('/api/v1/platform/editorial/live',async(req,res)=>res.json({collections:await editorial.live(req.query.territory)}));
  app.post('/api/v1/platform/ai/jobs',auth,async(req,res)=>res.status(202).json({job:await ai.submit({...req.body,userId:req.user.id})}));
  app.post('/api/v1/platform/ai/jobs/:id/complete',auth,roles('ADMIN'),async(req,res)=>res.json({job:await ai.complete(req.params.id,req.body.output,req.body)}));
  app.post('/api/v1/platform/analytics/facts',auth,roles('ADMIN','ARTIST'),async(req,res)=>res.status(201).json({fact:await analytics.record(req.body)}));
  app.get('/api/v1/platform/analytics/artist/:id',auth,async(req,res)=>res.json(await analytics.artistOverview(req.params.id,req.query.from,req.query.to)));
}
