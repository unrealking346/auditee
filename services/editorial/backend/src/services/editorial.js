export class EditorialCMS {
  constructor(prisma){this.prisma=prisma}
  async create(data){return this.prisma.editorialCollection.create({data:{name:data.name,slug:data.slug,description:data.description,territoryCode:data.territoryCode,genre:data.genre,status:data.status||'DRAFT',coverUrl:data.coverUrl,curatorId:data.curatorId,startsAt:data.startsAt?new Date(data.startsAt):null,endsAt:data.endsAt?new Date(data.endsAt):null,metadata:data.metadata}})}
  async addItem(collectionId,data){return this.prisma.editorialItem.create({data:{collectionId,resourceType:data.resourceType,resourceId:data.resourceId,position:data.position,rationale:data.rationale}})}
  async publish(id){return this.prisma.editorialCollection.update({where:{id},data:{status:'PUBLISHED'}})}
  async live(territoryCode){return this.prisma.editorialCollection.findMany({where:{status:'PUBLISHED',OR:[{territoryCode:null},{territoryCode}]},include:{items:{orderBy:{position:'asc'}}},orderBy:{updatedAt:'desc'}})}
}
