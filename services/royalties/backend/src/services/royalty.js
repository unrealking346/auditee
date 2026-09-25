import crypto from 'node:crypto';
export class RoyaltyEngine {
  constructor(prisma,rights){this.prisma=prisma;this.rights=rights}
  async calculate({resourceType,resourceId,territoryCode,usageType,grossAmount,currency,periodStart,periodEnd,eventId}){
    const auth=await this.rights.authorize(resourceType,resourceId,territoryCode); if(!auth.allowed) throw new Error(`RIGHTS_UNAVAILABLE:${auth.reason}`);
    const rights=auth.rights.filter(r=>['MASTER','PUBLISHING','MECHANICAL','PERFORMANCE','NEIGHBORING'].includes(r.rightType));
    const rows=rights.map(r=>({eventId:eventId||crypto.randomUUID(),resourceType,resourceId,territoryCode,usageType,grossAmount,netAmount:(Number(grossAmount)*Number(r.percentage)/100).toFixed(8),currency,ownerPartyId:r.ownerPartyId,ownerName:r.ownerName,status:'PENDING',periodStart:new Date(periodStart),periodEnd:new Date(periodEnd),calculationVersion:'2026.1',metadata:{rightType:r.rightType,percentage:String(r.percentage)}}));
    return this.prisma.royaltyLedger.createMany({data:rows}).then(()=>rows)
  }
  async statement(ownerPartyId,periodStart,periodEnd){return this.prisma.royaltyLedger.findMany({where:{ownerPartyId,periodStart:{gte:new Date(periodStart)},periodEnd:{lte:new Date(periodEnd)}},orderBy:{createdAt:'desc'}})}
}
