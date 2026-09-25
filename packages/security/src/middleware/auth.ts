import jwt from 'jsonwebtoken'; import type {Request,Response,NextFunction} from 'express';
export type AuthRequest=Request & {user?:{id:string;role:string}};
const secret=()=>process.env.JWT_SECRET||'dev-only-change-me';
export function signUser(user:{id:string;role:string}){return jwt.sign({sub:user.id,role:user.role},secret(),{expiresIn:'7d',issuer:'waeve'})}
export function auth(req:AuthRequest,res:Response,next:NextFunction){const token=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):undefined;if(!token)return res.status(401).json({error:'Authentication required'});try{const p=jwt.verify(token,secret(),{issuer:'waeve'}) as any;req.user={id:p.sub,role:p.role};next()}catch{return res.status(401).json({error:'Invalid or expired session'})}}
export function requireRole(...roles:string[]){return (req:AuthRequest,res:Response,next:NextFunction)=>{if(!req.user||!roles.includes(req.user.role))return res.status(403).json({error:'Forbidden'});next()}}
