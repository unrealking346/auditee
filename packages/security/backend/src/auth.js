import jwt from 'jsonwebtoken';
import argon2 from 'argon2';

const secret = () => process.env.JWT_SECRET || 'development-only-change-me';

export const hashPassword = p => argon2.hash(p);
export const verifyPassword = (h,p) => argon2.verify(h,p);
export const signAccessToken = u => jwt.sign({sub:u.id,role:u.role},secret(),{expiresIn:'15m'});
export const verifyToken = t => jwt.verify(t,secret());

export const authRequired = prisma => async (req,res,next)=>{
  try{
    const raw=req.headers.authorization?.replace(/^Bearer\s+/i,'');
    if(!raw) return res.status(401).json({error:{code:'UNAUTHENTICATED',message:'Authentication required.'}});
    const p=verifyToken(raw);
    const user=await prisma.user.findUnique({where:{id:p.sub}});
    if(!user) return res.status(401).json({error:{code:'UNAUTHENTICATED',message:'Session invalid.'}});
    req.user=user; next();
  }catch{res.status(401).json({error:{code:'UNAUTHENTICATED',message:'Session invalid.'}})}
};
export const requireRole = (...roles)=>(req,res,next)=>{
  if(!roles.includes(req.user?.role)) return res.status(403).json({error:{code:'FORBIDDEN',message:'Insufficient permissions.'}});
  next();
};
