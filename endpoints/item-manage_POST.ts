import superjson from 'superjson';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema } from './item-manage_POST.schema';

export async function handle(request: Request) {
  try {
    const {user}=await getServerUserSession(request);
    const input=schema.parse(superjson.parse(await request.text()));
    const item=await db.selectFrom('items').select(['id','ownerId']).where('id','=',input.itemId).executeTakeFirst();
    if(!item) return new Response(superjson.stringify({error:'Item not found'}),{status:404});
    if(item.ownerId!==user.id) return new Response(superjson.stringify({error:'You can only manage your own items.'}),{status:403});
    if(input.action==='delete'){
      await db.deleteFrom('items').where('id','=',input.itemId).execute();
      return new Response(superjson.stringify({ok:true,message:'Item deleted from your toolbox.'}));
    }
    const values:any={};
    for(const key of ['name','description','price','priceUnit','contactMethod','availableNow'] as const) if(input[key]!==undefined) values[key]=input[key];
    await db.updateTable('items').set(values).where('id','=',input.itemId).execute();
    return new Response(superjson.stringify({ok:true,message:'Item updated.'}));
  } catch(e) {
    return new Response(superjson.stringify({error:e instanceof Error?e.message:'Unable to manage item.'}),{status:400});
  }
}