import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
const prisma = new PrismaClient();

const main = async () => {
  const listener = await prisma.user.upsert({
    where:{email:'listener@waeve.local'}, update:{},
    create:{
      email:'listener@waeve.local',
      passwordHash:await argon2.hash('WaeveDevListener!2026'),
      username:'waeve_listener', displayName:'WAEVE Listener',
      country:'UG', region:'East Africa'
    }
  });
  const artistUser = await prisma.user.upsert({
    where:{email:'artist@waeve.local'}, update:{},
    create:{
      email:'artist@waeve.local',
      passwordHash:await argon2.hash('WaeveDevArtist!2026'),
      username:'waeve_artist', displayName:'WAEVE Artist', role:'ARTIST',
      country:'UG', region:'East Africa'
    }
  });
  const artist = await prisma.artist.upsert({
    where:{userId:artistUser.id}, update:{},
    create:{userId:artistUser.id,stageName:'WAEVE Demo Artist',country:'UG',genres:['Afrobeats','Amapiano']}
  });
  const release = await prisma.release.create({
    data:{title:'WAEVE Demo Sessions',type:'EP',artistId:artist.id,uploadedById:artistUser.id,status:'PUBLISHED',genre:'Afrobeats',language:'en',coverUrl:'/assets/demo-cover.svg',releaseDate:new Date()}
  });
  await prisma.track.createMany({data:[
    {title:'First Wave',releaseId:release.id,artistName:artist.stageName,durationMs:210000,previewUrl:'/music/first-wave.mp3'},
    {title:'Night Pulse',releaseId:release.id,artistName:artist.stageName,durationMs:198000,previewUrl:'/music/night-pulse.mp3'}
  ]});
  await prisma.subscription.upsert({
    where:{userId:listener.id},update:{},
    create:{userId:listener.id,tier:'PREMIUM',trialEndsAt:new Date(Date.now()+30*86400000)}
  });

  const territories = [
    ['UG','Uganda','East Africa','UGX','en'],['KE','Kenya','East Africa','KES','en'],['TZ','Tanzania','East Africa','TZS','sw'],
    ['NG','Nigeria','West Africa','NGN','en'],['GH','Ghana','West Africa','GHS','en'],['ZA','South Africa','Southern Africa','ZAR','en'],
    ['US','United States','North America','USD','en'],['GB','United Kingdom','Europe','GBP','en'],['CA','Canada','North America','CAD','en'],
    ['BR','Brazil','South America','BRL','pt'],['FR','France','Europe','EUR','fr'],['DE','Germany','Europe','EUR','de'],
    ['JP','Japan','Asia','JPY','ja'],['KR','South Korea','Asia','KRW','ko'],['IN','India','South Asia','INR','en'],
    ['AU','Australia','Oceania','AUD','en'],['AE','United Arab Emirates','Middle East','AED','ar']
  ];
  for(const [code,name,region,currency,language] of territories) await prisma.territory.upsert({where:{code},update:{name,region,currency,language},create:{code,name,region,currency,language}});
  console.log('Seeded WAEVE.');
};
main().finally(()=>prisma.$disconnect());