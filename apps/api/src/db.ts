import pg from 'pg'; import 'dotenv/config';
const {Pool}=pg; export const pool=new Pool({connectionString:process.env.DATABASE_URL, max:20, idleTimeoutMillis:30000});
export async function q<T=any>(text:string,params:any[]=[]){return pool.query<T>(text,params)}
