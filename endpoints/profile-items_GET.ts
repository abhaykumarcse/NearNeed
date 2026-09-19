import superjson from 'superjson';
import { sql } from 'kysely';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
export async function handle(request: Request) {
  try {
    const {user}=await getServerUserSession(request);
    const [items, profile] = await Promise.all([
      db.selectFrom('items').select(['id','name','description','price','priceUnit','availableNow','contactMethod','category']).where('ownerId','=',user.id).orderBy('createdAt','desc').execute(),
      db.selectFrom('users').select(['id','email','displayName','phone','avatarUrl','karma','rating','createdAt']).where('id','=',user.id).executeTakeFirstOrThrow()
    ]);
    const stats=await db.selectFrom('itemContactRequests').select([
      sql<number>`count(*) filter (where owner_id = ${user.id} and status = 'completed')`.as('helpedCount'),
      sql<string>`coalesce(sum(price_snapshot) filter (where owner_id = ${user.id} and status = 'completed'),0)`.as('earned'),
      sql<number>`count(*) filter (where requester_id = ${user.id} and status = 'completed')`.as('receivedHelpCount')
    ]).executeTakeFirst();
    return new Response(superjson.stringify({items:items.map(i=>({...i,price:String(i.price)})),profile:{...profile,rating:String(profile.rating),stats:{helpedCount:Number(stats?.helpedCount??0),earned:String(stats?.earned??'0'),receivedHelpCount:Number(stats?.receivedHelpCount??0)}}}));
  } catch(e) { return new Response(superjson.stringify({error:e instanceof Error?e.message:'Please log in first.'}),{status:401}); }
}