import { z } from 'zod';
import superjson from 'superjson';
export const schema = z.object({ query: z.string().trim().min(2).max(120), latitude: z.number(), longitude: z.number(), radiusM: z.number().int().min(100).max(2000).default(500) });
export type InputType = z.infer<typeof schema>;
export type OutputType = { results: Array<{ name: string; distanceM: number; latitude: number; longitude: number; mapUrl: string }> };
export const postNearbyPlaces = async (body: InputType, init?: RequestInit): Promise<OutputType> => { const r = await fetch('/_api/nearby-places', { method: 'POST', body: superjson.stringify(schema.parse(body)), ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } }); const t = await r.text(); if (!r.ok) throw new Error('Nearby places search failed'); return superjson.parse<OutputType>(t); };