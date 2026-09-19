import superjson from 'superjson';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema } from './profile-update_POST.schema';
export async function handle(request:Request){
  try{
    const {user}=await getServerUserSession(request);
    const input=schema.parse(superjson.parse(await request.text()));
    const updated=await db.updateTable('users').set({displayName:input.displayName,phone:input.phone,updatedAt:new Date()}).where('id','=',user.id).returning(['id','email','displayName','phone']).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({user:updated}));
  }catch(e){return new Response(superjson.stringify({error:e instanceof Error?e.message:'Unable to update profile.'}),{status:400});}
}