import { z } from 'zod';
import superjson from 'superjson';
export const schema=z.object({action:z.enum(['save','delete']),identity:z.string().min(1).max(2000),subscription:z.record(z.any()).optional()});
export type InputType=z.infer<typeof schema>;
export type OutputType={ok:true};
export const postPushSubscription=async(body:InputType,init?:RequestInit):Promise<OutputType>=>{
 const r=await fetch('/_api/push-subscription',{method:'POST',body:superjson.stringify(schema.parse(body)),...init,headers:{'Content-Type':'application/json',...(init?.headers??{})},credentials:'include'});
 const t=await r.text();if(!r.ok)throw new Error(superjson.parse<{error:string}>(t).error);return superjson.parse<OutputType>(t);
};