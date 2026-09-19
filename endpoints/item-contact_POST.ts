import superjson from 'superjson';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema } from './item-contact_POST.schema';
import { publish } from '@floot/realtime';
import { sendPushNotifications } from '@floot/push';
export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const input = schema.parse(superjson.parse(await request.text()));
    const item = await db.selectFrom('items').select(['id','ownerId','availableNow','price']).where('id','=',input.itemId).executeTakeFirst();
    if (!item) return new Response(superjson.stringify({error:'Item not found'}),{status:404});
    if (item.ownerId === user.id) return new Response(superjson.stringify({error:'You cannot contact yourself'}),{status:400});
    const existing = await db.selectFrom('itemContactRequests').select('id').where('itemId','=',item.id).where('requesterId','=',user.id).where('status','in',['pending','accepted']).executeTakeFirst();
    if(existing) return new Response(superjson.stringify({error:'You already have an active request for this item.'}),{status:409});
    const created = await db.insertInto('itemContactRequests').values({itemId:item.id, requesterId:user.id, ownerId:item.ownerId, message:input.message, status:'pending', priceSnapshot:item.price}).returning('id').executeTakeFirstOrThrow();
    const requester = await db.selectFrom('users').select('displayName').where('id','=',user.id).executeTakeFirstOrThrow();
    const title='New NearNeed request';
    const body=`${requester.displayName} requested your item`;
    const notification=await db.insertInto('notifications').values({userId:item.ownerId,title,body,type:'request',data:{requestId:created.id,itemId:item.id}}).returning('id').executeTakeFirstOrThrow();
    await publish('user:'+item.ownerId,{type:'notification',notificationId:notification.id,requestId:created.id,title,body});
    const subscriptions=await db.selectFrom('pushSubscriptions').select(['id','identity','subscription']).where('userId','=',item.ownerId).execute();
    if(subscriptions.length){
      const results=await sendPushNotifications(subscriptions.map(s=>s.subscription as any),{title,body,url:'/',tag:'nearneed-request-'+created.id,data:{type:'request',requestId:created.id},showWhenFocused:false});
      const gone=results.map((r,i)=>r.gone?subscriptions[i]:null).filter(Boolean) as typeof subscriptions;
      if(gone.length) await db.deleteFrom('pushSubscriptions').where('id','in',gone.map(s=>s.id)).execute();
    }
    return new Response(superjson.stringify({requestId:created.id,message:'Request sent. The owner can accept and contact you in Activity.'}));
  } catch (e) { return new Response(superjson.stringify({error:e instanceof Error?e.message:'Please log in first.'}),{status:401}); }
}