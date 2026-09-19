import { z } from 'zod';
import superjson from 'superjson';

export const schema = z.object({
  requestId: z.number().int().positive(),
  action: z.enum(['accept','decline','complete'])
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { ok: true; status: string; message: string };
export const postActivityAction = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch('/_api/activity-action', {method:'POST',body:superjson.stringify(schema.parse(body)),...init,headers:{'Content-Type':'application/json',...(init?.headers??{})},credentials:'include'});
  const t=await r.text(); if(!r.ok) throw new Error(superjson.parse<{error:string}>(t).error); return superjson.parse<OutputType>(t);
};