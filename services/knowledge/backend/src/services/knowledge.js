export class MusicKnowledgeGraph {
  constructor(prisma){this.prisma=prisma}
  async entity(data){return this.prisma.musicEntity.upsert({where:{entityType_entityId:{entityType:data.entityType,entityId:data.entityId}},update:{canonicalName:data.canonicalName,aliases:data.aliases||[],country:data.country,language:data.language,attributes:data.attributes,embedding:data.embedding},create:{entityType:data.entityType,entityId:data.entityId,canonicalName:data.canonicalName,aliases:data.aliases||[],country:data.country,language:data.language,attributes:data.attributes,embedding:data.embedding}})}
  async relate(data){return this.prisma.musicRelation.upsert({where:{fromEntityId_toEntityId_relationType:{fromEntityId:data.fromEntityId,toEntityId:data.toEntityId,relationType:data.relationType}},update:{weight:data.weight??1,metadata:data.metadata},create:data})}
  async neighborhood(id){return this.prisma.musicRelation.findMany({where:{OR:[{fromEntityId:id},{toEntityId:id}]},take:200})}
}
