import { z } from 'zod';
import superjson from 'superjson';
export const schema = z.object({ itemId: z.string().min(1), message: z.string().trim().max(300).default('I need this item. Is it available now?') });
export type InputType = z.infer<typeof schema>;
export type OutputType = { requestId: number; message: string };
export const postItemContact = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch('/_api/item-contact', { method:'POST', body:superjson.stringify(schema.parse(body)), ...init, headers:{'Content-Type':'application/json', ...(init?.headers??{})}, credentials:'include' });
  const t=await r.text(); if(!r.ok) throw new Error(superjson.parse<{error:string}>(t).error); return superjson.parse<OutputType>(t);
};