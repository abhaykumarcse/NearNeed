import superjson from 'superjson';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema } from './activity-action_POST.schema';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const input = schema.parse(superjson.parse(await request.text()));
    const row = await db.selectFrom('itemContactRequests').selectAll().where('id','=',input.requestId).executeTakeFirst();
    if (!row) return new Response(superjson.stringify({error:'Request not found'}),{status:404});
    const isOwner = row.ownerId === user.id;
    const isRequester = row.requesterId === user.id;
    if (!isOwner && !(isRequester && input.action === 'complete')) return new Response(superjson.stringify({error:'Not allowed'}),{status:403});

    if (input.action === 'accept') {
      if (!isOwner || row.status !== 'pending') return new Response(superjson.stringify({error:'Only a pending received request can be accepted.'}),{status:400});
      const item = await db.selectFrom('items').select(['price','availableNow']).where('id','=',row.itemId).executeTakeFirst();
      if (!item?.availableNow) return new Response(superjson.stringify({error:'This item is no longer available.'}),{status:409});
      await db.updateTable('itemContactRequests').set({status:'accepted',acceptedAt:new Date(),updatedAt:new Date(),priceSnapshot:item.price}).where('id','=',row.id).execute();
      return new Response(superjson.stringify({ok:true,status:'accepted',message:'Accepted. Contact details are now visible to both people.'}));
    }
    if (input.action === 'decline') {
      if (!isOwner || row.status !== 'pending') return new Response(superjson.stringify({error:'Only a pending received request can be declined.'}),{status:400});
      await db.updateTable('itemContactRequests').set({status:'declined',updatedAt:new Date()}).where('id','=',row.id).execute();
      return new Response(superjson.stringify({ok:true,status:'declined',message:'Request declined.'}));
    }
    if (row.status !== 'accepted') return new Response(superjson.stringify({error:'Only an accepted request can be completed.'}),{status:400});
    await db.updateTable('itemContactRequests').set({status:'completed',completedAt:new Date(),updatedAt:new Date()}).where('id','=',row.id).execute();
    return new Response(superjson.stringify({ok:true,status:'completed',message:'Help marked completed.'}));
  } catch(e) {
    return new Response(superjson.stringify({error:e instanceof Error?e.message:'Action failed.'}),{status:400});
  }
}