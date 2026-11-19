import { afterEach, describe, expect, it, vi } from 'vitest';
import { OSRMRoutingProvider } from '../services/routing/osrm';

const origin = { lat: 28.6139, lon: 77.209 };
const destination = { lat: 28.7041, lon: 77.1025 };

const routePayload = {
  code: 'Ok',
  routes: [
    {
      distance: 12345.6,
      duration: 600.4,
      geometry: {
        type: 'LineString',
        coordinates: [
          [77.209, 28.6139],
          [77.15, 28.65],
          [77.1025, 28.7041],
        ],
      },
      legs: [
        {
          steps: [
            {
              name: 'Kartavya Path',
              distance: 500,
              duration: 60,
              maneuver: { type: 'depart', modifier: 'left' },
            },
            {
              name: 'Janpath',
              distance: 1000,
              duration: 120,
              maneuver: { type: 'turn', modifier: 'right' },
            },
          ],
        },
      ],
    },
  ],
};

function mockFetch(payload: unknown, ok = true) {
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => ({
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Server Error',
    json: async () => payload,
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OSRMRoutingProvider', () => {
  it('supports car, motorcycle, cycling, and walking only', () => {
    const provider = new OSRMRoutingProvider();

    expect(provider.isModeSupported('car')).toBe(true);
    expect(provider.isModeSupported('motorcycle')).toBe(true);
    expect(provider.isModeSupported('cycling')).toBe(true);
    expect(provider.isModeSupported('walking')).toBe(true);
    expect(provider.isModeSupported('bus')).toBe(false);
    expect(provider.isModeSupported('metro_train')).toBe(false);
  });

  it.each([
    ['car', 'routed-car'],
    ['motorcycle', 'routed-car'],
    ['cycling', 'routed-bike'],
    ['walking', 'routed-foot'],
  ] as const)('requests the dedicated %s graph (%s)', async (mode, host) => {
    const fetchMock = mockFetch(routePayload);
    const provider = new OSRMRoutingProvider();

    await provider.calculateRoute(origin, destination, mode);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain(host);
    expect(url).toContain('geometries=geojson');
    expect(url).toContain('steps=true');
  });

  it('parses distance, duration, geometry, and maneuver steps', async () => {
    mockFetch(routePayload);
    const provider = new OSRMRoutingProvider();

    const result = await provider.calculateRoute(origin, destination, 'cycling');

    expect(result.status).toBe('available');
    expect(result.distanceMeters).toBe(12345.6);
    expect(result.distanceKm).toBe(12.35);
    expect(result.durationSeconds).toBe(600.4);
    expect(result.durationMinutes).toBe(10);
    expect(result.geometry).toHaveLength(3);
    expect(result.steps).toEqual([
      {
        instruction: 'Start route',
        distanceMeters: 500,
        durationSeconds: 60,
        name: 'Kartavya Path',
      },
      {
        instruction: 'Turn right',
        distanceMeters: 1000,
        durationSeconds: 120,
        name: 'Janpath',
      },
    ]);
  });

  it('marks bus and metro as unsupported without making a network request', async () => {
    const fetchMock = mockFetch(routePayload);
    const provider = new OSRMRoutingProvider();

    const bus = await provider.calculateRoute(origin, destination, 'bus');
    const metro = await provider.calculateRoute(origin, destination, 'metro_train');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(bus.status).toBe('unsupported_by_provider');
    expect(metro.status).toBe('unsupported_by_provider');
    expect(bus.unavailableReason).toContain('forbids fabricated transit routes');
  });

  it('returns an error result when the routing response is not Ok', async () => {
    mockFetch({ code: 'NoRoute', message: 'No route found' });
    const provider = new OSRMRoutingProvider();

    const result = await provider.calculateRoute(origin, destination, 'car');

    expect(result.status).toBe('error');
    expect(result.unavailableReason).toContain('No route found');
    expect(result.geometry).toEqual([]);
  });

  it('returns an error result on HTTP failure', async () => {
    mockFetch({}, false);
    const provider = new OSRMRoutingProvider();

    const result = await provider.calculateRoute(origin, destination, 'walking');

    expect(result.status).toBe('error');
    expect(result.unavailableReason).toContain('status 500');
  });

  it('returns a friendly error result when the network request rejects', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));
    const provider = new OSRMRoutingProvider();

    const result = await provider.calculateRoute(origin, destination, 'car');

    expect(result.status).toBe('error');
    expect(result.unavailableReason).toContain('Network error connecting to OSRM');
  });

  it('aborts a hung request after 20 seconds instead of blocking the planner', async () => {
    vi.useFakeTimers();
    try {
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
      const provider = new OSRMRoutingProvider();

      const pending = provider.calculateRoute(origin, destination, 'car');
      await vi.advanceTimersByTimeAsync(20_000);
      const result = await pending;

      expect(result.status).toBe('error');
      expect(result.unavailableReason).toContain('did not respond within 20 seconds');
    } finally {
      vi.useRealTimers();
    }
  });
});
