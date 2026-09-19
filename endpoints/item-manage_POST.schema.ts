import { z } from 'zod';
import superjson from 'superjson';

export const schema = z.object({
  action: z.enum(['update','delete']),
  itemId: z.string().min(1),
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  price: z.number().min(0).max(100000).optional(),
  priceUnit: z.string().trim().max(30).optional(),
  contactMethod: z.enum(['in_app','call']).optional(),
  availableNow: z.boolean().optional()
});
export type InputType = z.infer<typeof schema>;
export type OutputType = {ok:true; message:string};
export const postItemManage = async (body:InputType, init?:RequestInit):Promise<OutputType>=>{
  const r=await fetch('/_api/item-manage',{method:'POST',body:superjson.stringify(schema.parse(body)),...init,headers:{'Content-Type':'application/json',...(init?.headers??{})},credentials:'include'});
  const t=await r.text(); if(!r.ok) throw new Error(superjson.parse<{error:string}>(t).error); return superjson.parse<OutputType>(t);
};