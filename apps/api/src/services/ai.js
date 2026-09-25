export class AIGateway {
  constructor(prisma){this.prisma=prisma}
  async submit({userId,jobType,input,provider='internal',model='policy-v1'}){
    const blocked=/\b(password|api[_ -]?key|secret|private key)\b/i.test(JSON.stringify(input));
    const status=blocked?'BLOCKED':'QUEUED';
    return this.prisma.aIJob.create({data:{userId,jobType,input,provider,model,status,safetyFlags:blocked?['SENSITIVE_INPUT']:[]}})
  }
  async complete(id,output,{status='SUCCEEDED'}={}){return this.prisma.aIJob.update({where:{id},data:{output,status,completedAt:new Date()}})}
}
