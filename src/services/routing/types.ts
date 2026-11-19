import { Coordinates, RouteResult, TravelMode } from '../../types/routing';

export interface IRoutingProvider {
  name: string;
  isModeSupported(mode: TravelMode): boolean;
  calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TravelMode
  ): Promise<RouteResult>;
}

export interface RoutingServiceOptions {
  providerName?: string;
  orsApiKey?: string;
}
