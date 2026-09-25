import crypto from 'node:crypto';
export class TrustEngine {
  constructor(prisma){this.prisma=prisma}
  hash(value){return value?crypto.createHash('sha256').update(String(value)).digest('hex'):null}
  async score({userId,targetType,targetId,eventType,ip,device,fingerprint,signals={}}){
    let score=0;
    if(ip)score+=1;if(device)score+=1;if(fingerprint)score+=1;
    const recent=await this.prisma.trustEvent.count({where:{userId,createdAt:{gte:new Date(Date.now()-10*60*1000)}}}); if(recent>100)score+=60; else if(recent>40)score+=20;
    const decision=score>=60?'BLOCK':score>=25?'REVIEW':'ALLOW';
    const e=await this.prisma.trustEvent.create({data:{userId,targetType,targetId,eventType,ipHash:this.hash(ip),deviceHash:this.hash(device),fingerprint:this.hash(fingerprint),score,decision,signals}});
    if(userId)await this.prisma.trustProfile.upsert({where:{subjectType_subjectId:{subjectType:'USER',subjectId:userId}},update:{riskScore:score,status:decision,features:{recentEvents:recent,signals}},create:{subjectType:'USER',subjectId:userId,riskScore:score,status:decision,features:{recentEvents:recent,signals}}});
    return {decision,score,eventId:e.id};
  }
}
