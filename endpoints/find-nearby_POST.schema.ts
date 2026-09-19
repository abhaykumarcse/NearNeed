import { z } from 'zod';
import superjson from 'superjson';

export const schema = z.object({
  query: z.string().trim().min(2).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusM: z.number().int().min(100).max(2000).default(500),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  status: 'found' | 'unavailable';
  requestId?: string;
  results: Array<{ type: 'person' | 'shop'; id?: string; name: string; item: string; description?: string; distanceM: number; price: string; rating: number; available: string; latitude: number; longitude: number; contactMethod?: string; mapUrl: string }>;
  message: string;
};

export const postFindNearby = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch('/_api/find-nearby', { method: 'POST', body: superjson.stringify(validatedInput), ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const text = await result.text();
  if (!result.ok) throw new Error(superjson.parse<{ error: string }>(text).error);
  return superjson.parse<OutputType>(text);
};