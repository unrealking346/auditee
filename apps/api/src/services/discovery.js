export class DiscoveryEngine {
  constructor(prisma){this.prisma=prisma}
  async buildProfile(userId){
    const [likes,plays,searches]=await Promise.all([
      this.prisma.like.findMany({where:{userId},include:{track:true,release:true}}),
      this.prisma.playEvent.findMany({where:{userId},orderBy:{createdAt:'desc'},take:500,include:{track:{include:{release:true}}}}),
      this.prisma.searchEvent.findMany({where:{userId},orderBy:{createdAt:'desc'},take:100})
    ]);
    const artists={},genres={};
    for(const x of [...plays,...likes.map(x=>({track:x.track}))]) if(x.track){const a=x.track.artistName;artists[a]=(artists[a]||0)+1; const g=x.track.release?.genre; if(g)genres[g]=(genres[g]||0)+1}
    return this.prisma.recommendationProfile.upsert({where:{userId},update:{features:{artists,genres,queries:searches.map(s=>s.query)},version:'2026.1'},create:{userId,features:{artists,genres,queries:searches.map(s=>s.query)},version:'2026.1'}})
  }
  async recommend(userId,{limit=20,region}={}){
    await this.buildProfile(userId);
    const profile=await this.prisma.recommendationProfile.findUnique({where:{userId}}); const genres=Object.keys(profile?.features?.genres||{});
    const tracks=await this.prisma.track.findMany({where:{release:{status:'PUBLISHED',...(region?{artist:{country:region}}:{})}},include:{release:{include:{artist:true}}},take:200,orderBy:{createdAt:'desc'}});
    const ranked=tracks.map(t=>{let score=0;if(genres.includes(t.release?.genre))score+=10;score+=(t.release?.artist?.score||0);return {...t,recommendationScore:score}}).sort((a,b)=>b.recommendationScore-a.recommendationScore).slice(0,limit);
    await this.prisma.recommendationCandidate.deleteMany({where:{userId}}); if(ranked.length)await this.prisma.recommendationCandidate.createMany({data:ranked.map(t=>({userId,trackId:t.id,source:'hybrid',score:t.recommendationScore,reason:{genres}}))});
    return ranked;
  }
}
