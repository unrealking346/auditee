export class IndustryAnalytics {
  constructor(prisma){this.prisma=prisma}
  async record(data){return this.prisma.analyticsFact.create({data:{metric:data.metric,subjectType:data.subjectType,subjectId:data.subjectId,territoryCode:data.territoryCode,periodStart:new Date(data.periodStart),periodEnd:new Date(data.periodEnd),value:data.value,dimensions:data.dimensions}})}
  async series({metric,subjectType,subjectId,territoryCode,from,to}){return this.prisma.analyticsFact.findMany({where:{metric,subjectType,subjectId,...(territoryCode?{territoryCode}:{}),periodStart:{gte:new Date(from),lte:new Date(to)}},orderBy:{periodStart:'asc'}})}
  async artistOverview(artistId,from,to){const metrics=['streams','listeners','followers','likes','saves'];const out={};for(const m of metrics)out[m]=await this.series({metric:m,subjectType:'ARTIST',subjectId:artistId,from,to});return out}
}
