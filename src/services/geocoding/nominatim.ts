import { Coordinates, LocationResult } from '../../types/routing';

interface NominatimRawResult {
  place_id: number;
  osm_id: number;
  osm_type: string;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

let lastRequestTime = 0;
let throttleQueue: Promise<void> = Promise.resolve();
const MIN_REQUEST_INTERVAL_MS = 1000; // Nominatim usage policy recommends 1 req/sec

/**
 * Throttle helper to respect OpenStreetMap Nominatim Usage Policy.
 *
 * Requests are chained instead of merely delayed: the origin and destination
 * inputs each search independently, so two calls made within the same second
 * would otherwise wake from their timers together and violate the 1 req/sec
 * policy. Serialising the queue guarantees the spacing between requests.
 */
function throttleNominatim(): Promise<void> {
  const scheduled = throttleQueue.then(async () => {
    const waitTime = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestTime);
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
  });

  // Keep the chain alive even if a wait is interrupted by a rejection.
  throttleQueue = scheduled.catch(() => undefined);
  return scheduled;
}

/**
 * Clean and format short label from Nominatim display name.
 * The first display-name segment is the actual selected place (for example
 * "India Gate"), so it must win over address.road, which is only the street
 * the place sits on.
 */
function extractShortName(raw: NominatimRawResult): string {
  const parts = raw.display_name
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const primary = parts[0];
  const secondary =
    raw.address?.city ||
    raw.address?.town ||
    raw.address?.village ||
    raw.address?.state ||
    raw.address?.country ||
    parts[1];

  if (primary && secondary && primary !== secondary) {
    return `${primary}, ${secondary}`;
  }
  return primary || raw.display_name;
}

export class NominatimGeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  /**
   * Search for locations matching a query using live OpenStreetMap Nominatim.
   * Handles empty query, network failure, 429 rate limit, and ambiguous matches.
   */
  async search(query: string): Promise<LocationResult[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return [];
    }

    await throttleNominatim();

    const params = new URLSearchParams({
      format: 'json',
      q: trimmed,
      limit: '5',
      addressdetails: '1',
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new Error('Nominatim rate limit reached. Please wait a moment before typing again.');
      }

      if (!response.ok) {
        throw new Error(`Geocoding server responded with HTTP status ${response.status}: ${response.statusText}`);
      }

      const data: NominatimRawResult[] = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      return data.map((item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        
        const boundingBox: [number, number, number, number] | undefined = item.boundingbox
          ? [
              parseFloat(item.boundingbox[0]),
              parseFloat(item.boundingbox[1]),
              parseFloat(item.boundingbox[2]),
              parseFloat(item.boundingbox[3]),
            ]
          : undefined;

        return {
          displayName: item.display_name,
          shortName: extractShortName(item),
          address: item.display_name,
          coordinates: { lat, lon },
          type: item.type,
          importance: item.importance,
          boundingBox,
        };
      });
    } catch (err: unknown) {
      const isTimeout =
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        (err as { name?: unknown }).name === 'AbortError';
      if (isTimeout) {
        throw new Error('The geocoding service did not respond within 10 seconds. Please retry.');
      }
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while contacting the geocoding service.');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Reverse geocode a set of coordinates to a human-readable location
   */
  async reverse(coords: Coordinates): Promise<LocationResult | null> {
    await throttleNominatim();

    const params = new URLSearchParams({
      format: 'json',
      lat: coords.lat.toString(),
      lon: coords.lon.toString(),
      addressdetails: '1',
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(`${this.baseUrl}/reverse?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) return null;
      const item: NominatimRawResult = await response.json();
      if (!item || !item.lat || !item.lon) return null;

      return {
        displayName: item.display_name,
        shortName: extractShortName(item),
        address: item.display_name,
        coordinates: { lat: parseFloat(item.lat), lon: parseFloat(item.lon) },
        type: item.type,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const geocodingService = new NominatimGeocodingService();
