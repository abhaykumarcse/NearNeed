import { z } from 'zod';
import superjson from 'superjson';

export const schema = z.object({
  name: z.string().trim().min(2).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  category: z.enum(['creator','other','parts','tools','utility']).default('other'),
  description: z.string().trim().max(500).default(''),
  price: z.number().min(0).max(100000).default(0),
  priceUnit: z.string().trim().max(30).default('use'),
  contactMethod: z.enum(['in_app','call']).default('in_app'),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { id: string; name: string };
export const postItem = async (body: InputType, init?: RequestInit): Promise<OutputType> => { const r = await fetch('/_api/items', { method:'POST', body:superjson.stringify(schema.parse(body)), ...init, headers:{'Content-Type':'application/json', ...(init?.headers??{})} }); const t=await r.text(); if(!r.ok) throw new Error(superjson.parse<{error:string}>(t).error); return superjson.parse<OutputType>(t); };