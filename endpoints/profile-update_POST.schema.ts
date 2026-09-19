import { z } from 'zod';
import superjson from 'superjson';
export const schema=z.object({displayName:z.string().trim().min(2).max(80),phone:z.string().trim().max(20).default('')});
export type InputType=z.infer<typeof schema>;
export type OutputType={user:{id:number;email:string;displayName:string;phone:string}};
export const postProfileUpdate=async(body:InputType,init?:RequestInit):Promise<OutputType>=>{
  const r=await fetch('/_api/profile-update',{method:'POST',body:superjson.stringify(schema.parse(body)),...init,headers:{'Content-Type':'application/json',...(init?.headers??{})},credentials:'include'});
  const t=await r.text(); if(!r.ok) throw new Error(superjson.parse<{error:string}>(t).error); return superjson.parse<OutputType>(t);
};