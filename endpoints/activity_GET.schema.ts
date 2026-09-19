import superjson from 'superjson';

export type ActivityRequest = {
  id: number;
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemPrice: string;
  itemPriceUnit: string;
  otherUserName: string;
  otherUserEmail?: string;
  otherUserPhone?: string;
  message: string;
  status: string;
  createdAt: Date;
  acceptedAt: Date | null;
  completedAt: Date | null;
  direction: 'received' | 'sent';
};

export type OutputType = {
  received: ActivityRequest[];
  sent: ActivityRequest[];
  stats: { helpedCount: number; earned: string; receivedHelpCount: number };
};

export const getActivity = async (init?: RequestInit): Promise<OutputType> => {
  const r = await fetch('/_api/activity', { method: 'GET', ...init, credentials: 'include' });
  const t = await r.text();
  if (!r.ok) throw new Error(superjson.parse<{error:string}>(t).error);
  return superjson.parse<OutputType>(t);
};