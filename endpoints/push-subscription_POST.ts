import superjson from 'superjson';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema } from './push-subscription_POST.schema';
export async function handle(request:Request){
 try{
  const {user}=await getServerUserSession(request);
  const input=schema.parse(superjson.parse(await request.text()));
  if(input.action==='delete'){
   await db.deleteFrom('pushSubscriptions').where('userId','=',user.id).where('identity','=',input.identity).execute();
  }else{
   if(!input.subscription) return new Response(superjson.stringify({error:'Subscription missing'}),{status:400});
   await db.insertInto('pushSubscriptions').values({userId:user.id,identity:input.identity,subscription:input.subscription}).onConflict(oc=>oc.column('identity').doUpdateSet({userId:user.id,subscription:input.subscription,updatedAt:new Date()})).execute();
  }
  return new Response(superjson.stringify({ok:true}));
 }catch(e){return new Response(superjson.stringify({error:e instanceof Error?e.message:'Push subscription failed.'}),{status:401});}
}