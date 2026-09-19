import superjson from 'superjson';
export type OutputType = {
  items: Array<{id:string;name:string;description:string;price:string;priceUnit:string;availableNow:boolean;contactMethod:string;category:string}>;
  profile: {
    id:number; email:string; displayName:string; phone:string; avatarUrl:string|null; karma:number; rating:string; createdAt:Date;
    stats:{helpedCount:number;earned:string;receivedHelpCount:number}
  }
};
export const getProfileItems = async (init?: RequestInit): Promise<OutputType> => {
  const r=await fetch('/_api/profile-items',{method:'GET',...init,headers:{...(init?.headers??{})},credentials:'include'});
  const t=await r.text(); if(!r.ok) throw new Error(superjson.parse<{error:string}>(t).error); return superjson.parse<OutputType>(t);
};