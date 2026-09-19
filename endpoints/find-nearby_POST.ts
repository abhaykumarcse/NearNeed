import superjson from 'superjson';
import { schema, OutputType } from './find-nearby_POST.schema';
import { db } from '../helpers/db';

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const terms = input.query.toLowerCase().split(/\s+/).filter(Boolean);
    const [rows, users] = await Promise.all([
      db.selectFrom('items').selectAll().where('availableNow', '=', true).execute(),
      db.selectFrom('users').select(['id', 'displayName']).execute(),
    ]);
    const userNames = new Map(users.map((u) => [u.id, u.displayName]));
    const scored = rows.map((r) => {
      const hay = r.name.toLowerCase();
      const hits = terms.filter(t => hay.includes(t)).length;
      const dLat = (r.latitude - input.latitude) * 111000;
      const dLon = (r.longitude - input.longitude) * 111000 * Math.cos(input.latitude * Math.PI / 180);
      const distanceM = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));
      return { r, hits, distanceM };
    }).filter(x => x.hits > 0 && x.distanceM <= input.radiusM).sort((a,b) => b.hits - a.hits || a.distanceM - b.distanceM).slice(0, 10);
    let results: OutputType['results'] = scored.map(({r, distanceM}) => ({ type: 'person', id: r.id, name: userNames.get(r.ownerId) ?? 'Nearby member', item: r.name, description: r.description, distanceM, price: Number(r.price) > 0 ? `₹${r.price} / ${r.priceUnit}` : 'Free', rating: 4.8, available: 'Available now', latitude: r.latitude, longitude: r.longitude, contactMethod: r.contactMethod, mapUrl: `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}` }));

    // If no community item matches, also query nearby public places (schools, shops, hospitals, etc.)
    // through OpenStreetMap's lightweight Photon search. This does not claim stock; it only finds a nearby place.
    if (!results.length) {
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(input.query)}&lat=${input.latitude}&lon=${input.longitude}&limit=8`;
        const response = await fetch(url, { headers: { 'User-Agent': 'NearNeed/1.0' } });
        if (response.ok) {
          const data = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: { name?: string; street?: string; city?: string; osm_value?: string; osm_key?: string } }> };
          const places = (data.features ?? []).map((f) => {
            const [lon, lat] = f.geometry?.coordinates ?? [NaN, NaN];
            const dLat = (lat - input.latitude) * 111000;
            const dLon = (lon - input.longitude) * 111000 * Math.cos(input.latitude * Math.PI / 180);
            const distanceM = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));
            return { f, lat, lon, distanceM };
          }).filter(x => Number.isFinite(x.lat) && x.distanceM <= input.radiusM).sort((a,b) => a.distanceM - b.distanceM);
          results = places.map(({f, lat, lon, distanceM}) => ({
            type: 'shop', name: f.properties?.name ?? 'Nearby place', item: f.properties?.osm_value ?? input.query,
            distanceM, price: 'Availability not confirmed', rating: 0, available: 'Nearby place found', latitude: lat, longitude: lon,
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
          }));
        }
      } catch { /* Public-place lookup is a fallback; never block the main search. */ }
    }

    return new Response(superjson.stringify({ status: results.length ? 'found' : 'unavailable', results, message: results.length ? `${results.length} nearby result${results.length > 1 ? 's' : ''} found.` : 'Available nahi hai — is 500m area me abhi koi matching provider/place nahi mila.' } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : 'Unable to search nearby.' }), { status: 400 });
  }
}