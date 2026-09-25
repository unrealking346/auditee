export class TerritoryEngine {
  constructor(prisma){this.prisma=prisma}
  async resolve(code){
    const c=String(code||'').toUpperCase();
    if(!c) return null;
    return this.prisma.territory.findUnique({where:{code:c},include:{policies:true}});
  }
  async canServe({resourceType,resourceId,territoryCode}){
    const t=await this.resolve(territoryCode); if(!t||!t.active)return {allowed:false,reason:'TERRITORY_UNAVAILABLE'};
    const grants=await this.prisma.rightsGrant.findMany({where:{resourceType,resourceId,territoryId:t.id,status:'ACTIVE',OR:[{startsAt:null},{startsAt:{lte:new Date()}}],AND:[{OR:[{endsAt:null},{endsAt:{gte:new Date()}}]}]}});
    if(!grants.length)return {allowed:false,reason:'NO_ACTIVE_RIGHT'};
    const deny=await this.prisma.territoryPolicy.findFirst({where:{territoryId:t.id,resourceType,resourceId,policyType:'DENY'}});
    return deny?{allowed:false,reason:deny.reason||'POLICY_DENY'}:{allowed:true,territory:t.code,rights:grants};
  }
}
