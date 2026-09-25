export class RightsGraph {
  constructor(prisma,territory){this.prisma=prisma;this.territory=territory}
  async upsertGrant(data){
    const t=await this.territory.resolve(data.territoryCode); if(!t) throw new Error('UNKNOWN_TERRITORY');
    return this.prisma.rightsGrant.create({data:{resourceType:data.resourceType,resourceId:data.resourceId,rightType:data.rightType,ownerName:data.ownerName,ownerPartyId:data.ownerPartyId,percentage:data.percentage,territoryId:t.id,status:data.status||'DRAFT',startsAt:data.startsAt?new Date(data.startsAt):null,endsAt:data.endsAt?new Date(data.endsAt):null,contractRef:data.contractRef,metadata:data.metadata}})
  }
  async getGraph(resourceType,resourceId){return this.prisma.rightsGrant.findMany({where:{resourceType,resourceId},include:{territory:true},orderBy:{createdAt:'desc'}})}
  async authorize(resourceType,resourceId,territoryCode){return this.territory.canServe({resourceType,resourceId,territoryCode})}
}
