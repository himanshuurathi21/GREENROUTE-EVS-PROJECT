import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const RAW_RESULT = {
  place_id: 1,
  osm_id: 2,
  osm_type: 'node',
  lat: '28.6129',
  lon: '77.2295',
  display_name: 'India Gate, Rajpath, New Delhi, Delhi, India',
  type: 'monument',
  importance: 0.91,
  boundingbox: ['28.5', '28.7', '77.1', '77.3'],
  address: {
    road: 'Rajpath',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
  },
};

describe('NominatimGeocodingService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns no results for a too-short query without calling the network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { NominatimGeocodingService } = await import('../services/geocoding/nominatim');
    const service = new NominatimGeocodingService();

    await expect(service.search('a')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a live Nominatim result into verified coordinates and labels', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [RAW_RESULT],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { NominatimGeocodingService } = await import('../services/geocoding/nominatim');
    const service = new NominatimGeocodingService();

    const results = await service.search('India Gate');

    expect(results).toHaveLength(1);
    expect(results[0].shortName).toBe('India Gate, New Delhi');
    expect(results[0].coordinates).toEqual({ lat: 28.6129, lon: 77.2295 });
    expect(results[0].boundingBox).toEqual([28.5, 28.7, 77.1, 77.3]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('q=India+Gate');
  });

  it('surfaces a friendly rate-limit error on HTTP 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({}),
      }))
    );
    const { NominatimGeocodingService } = await import('../services/geocoding/nominatim');
    const service = new NominatimGeocodingService();

    await expect(service.search('India Gate')).rejects.toThrow('rate limit reached');
  });

  it('aborts a hung geocoder after 10 seconds with a friendly error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          })
      )
    );
    const { NominatimGeocodingService } = await import('../services/geocoding/nominatim');
    const service = new NominatimGeocodingService();

    const request = service.search('India Gate');
    const assertion = expect(request).rejects.toThrow('did not respond within 10 seconds');
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });

  it('returns null from reverse geocoding when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    const { NominatimGeocodingService } = await import('../services/geocoding/nominatim');
    const service = new NominatimGeocodingService();

    await expect(service.reverse({ lat: 28.6129, lon: 77.2295 })).resolves.toBeNull();
  });
});
