import { default as useSWR } from 'swr';
import { api } from '../services/api';
import type { ChargePoint } from '../services/api';


/**
 * SWR hook for fetching the list of charge points/stations.
 * Follows `client-swr-dedup` from react-best-practices:
 * multiple components can call this hook — only 1 request fires.
 */
export function useStations() {
    const { data, error, isLoading, mutate } = useSWR<{ success: true; data: ChargePoint[] }>(
        '/api/stations',
        () => api.stations.list(),
        {
            refreshInterval: 10_000, // Re-fetch every 10s for near-real-time status
            revalidateOnFocus: true,
        }
    );

    return {
        stations: data?.data ?? [],
        isLoading,
        error,
        refresh: mutate,
    };
}

/**
 * Derived metrics computed from the stations list.
 * Uses `rerender-derived-state` pattern — derive what you need, don't store separately.
 */
export function useStationMetrics() {
    const { stations, isLoading } = useStations();

    const total = stations.length;
    const available = stations.filter(s => s.status === 'AVAILABLE').length;
    const charging = stations.filter(s => s.status === 'CHARGING').length;
    const faulted = stations.filter(s => s.status === 'FAULTED').length;
    const unavailable = stations.filter(s => s.status === 'UNAVAILABLE').length;

    return { total, available, charging, faulted, unavailable, isLoading };
}
