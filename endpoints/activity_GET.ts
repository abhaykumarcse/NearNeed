import superjson from 'superjson';
import { sql } from 'kysely';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import type { ActivityRequest, OutputType } from './activity_GET.schema';

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const [receivedRows, sentRows, statsRows] = await Promise.all([
      db.selectFrom('itemContactRequests as cr')
        .innerJoin('items as i', 'i.id', 'cr.itemId')
        .innerJoin('users as u', 'u.id', 'cr.requesterId')
        .select([
          'cr.id','cr.itemId','cr.message','cr.status','cr.createdAt','cr.acceptedAt','cr.completedAt',
          'i.name as itemName','i.description as itemDescription','i.price as itemPrice','i.priceUnit as itemPriceUnit',
          'u.displayName as otherUserName','u.email as otherUserEmail','u.phone as otherUserPhone'
        ])
        .where('cr.ownerId','=',user.id)
        .orderBy('cr.createdAt','desc')
        .limit(50).execute(),
      db.selectFrom('itemContactRequests as cr')
        .innerJoin('items as i', 'i.id', 'cr.itemId')
        .innerJoin('users as u', 'u.id', 'cr.ownerId')
        .select([
          'cr.id','cr.itemId','cr.message','cr.status','cr.createdAt','cr.acceptedAt','cr.completedAt',
          'i.name as itemName','i.description as itemDescription','i.price as itemPrice','i.priceUnit as itemPriceUnit',
          'u.displayName as otherUserName','u.email as otherUserEmail','u.phone as otherUserPhone'
        ])
        .where('cr.requesterId','=',user.id)
        .orderBy('cr.createdAt','desc')
        .limit(50).execute(),
      db.selectFrom('itemContactRequests')
        .select([
          sql<number>`count(*) filter (where owner_id = ${user.id} and status = 'completed')`.as('helpedCount'),
          sql<string>`coalesce(sum(price_snapshot) filter (where owner_id = ${user.id} and status = 'completed'), 0)`.as('earned'),
          sql<number>`count(*) filter (where requester_id = ${user.id} and status = 'completed')`.as('receivedHelpCount')
        ])
        .executeTakeFirst()
    ]);

    const mapRow = (r: any, direction: 'received'|'sent'): ActivityRequest => {
      const visible = r.status === 'accepted' || r.status === 'completed';
      return {
        id:r.id,itemId:r.itemId,itemName:r.itemName,itemDescription:r.itemDescription ?? '',
        itemPrice:String(r.itemPrice ?? 0),itemPriceUnit:r.itemPriceUnit ?? 'use',
        otherUserName:r.otherUserName,
        ...(visible ? {otherUserEmail:r.otherUserEmail, otherUserPhone:r.otherUserPhone || undefined} : {}),
        message:r.message ?? '',status:r.status,createdAt:r.createdAt,acceptedAt:r.acceptedAt ?? null,
        completedAt:r.completedAt ?? null,direction
      };
    };
    const output: OutputType = {
      received: receivedRows.map(r=>mapRow(r,'received')),
      sent: sentRows.map(r=>mapRow(r,'sent')),
      stats: {
        helpedCount:Number(statsRows?.helpedCount ?? 0),
        earned:String(statsRows?.earned ?? '0'),
        receivedHelpCount:Number(statsRows?.receivedHelpCount ?? 0)
      }
    };
    return new Response(superjson.stringify(output));
  } catch(e) {
    return new Response(superjson.stringify({error:e instanceof Error?e.message:'Please log in first.'}),{status:401});
  }
}