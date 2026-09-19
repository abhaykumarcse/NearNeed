import superjson from 'superjson';
import { nanoid } from 'nanoid';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema } from './items_POST.schema';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const input = schema.parse(superjson.parse(await request.text()));
    const id = nanoid();
    await db.insertInto('items').values({ id, ownerId: user.id, name: input.name, latitude: input.latitude, longitude: input.longitude, category: input.category, availableNow: true, description: input.description, price: input.price, priceUnit: input.priceUnit, contactMethod: input.contactMethod }).execute();
    return new Response(superjson.stringify({ id, name: input.name }));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : 'Please log in first.' }), { status: 401 });
  }
}