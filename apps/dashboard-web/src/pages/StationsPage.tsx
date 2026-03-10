import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { useStations } from '../hooks/useStations';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';
import type { ChargePoint } from '../services/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (color: string) =>
    new L.DivIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 8px ${color}88"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });

const STATUS_COLORS: Record<string, string> = {
    AVAILABLE: '#a3e635',
    CHARGING: '#0ea5e9',
    FAULTED: '#ef4444',
    UNAVAILABLE: '#64748b',
    PREPARING: '#f59e0b',
    FINISHING: '#8b5cf6',
};

const CPStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors: Record<string, string> = {
        AVAILABLE: 'status-available',
        CHARGING: 'status-charging',
        FAULTED: 'status-faulted',
        UNAVAILABLE: 'status-unavailable',
        PREPARING: 'status-charging',
        FINISHING: 'status-charging',
    };
    return <span className={colors[status] ?? 'status-badge bg-slate-700 text-slate-300'}>{status}</span>;
};

const MapLegend: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="absolute bottom-4 left-4 z-[9000] card-glass p-3 text-xs space-y-1.5">
            {Object.entries(STATUS_COLORS).map(([s, c]) => (
                <div key={s} className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
                    <span className="text-slate-400">{t(`stations.statusLabels.${s}`, s)}</span>
                </div>
            ))}
        </div>
    );
};

const StationListItem: React.FC<{ cp: ChargePoint; onSelect: () => void }> = ({ cp, onSelect }) => (
    <button
        onClick={onSelect}
        className="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-slate-600 hover:bg-white/5 transition-all duration-200"
    >
        <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs text-slate-400">{cp.ocppId}</span>
            <CPStatusBadge status={cp.status} />
        </div>
        <p className="text-sm text-slate-200 font-medium">{cp.station?.name ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{cp.connectorType} · R${cp.pricePerKwh}/kWh</p>
    </button>
);

const MOCK_STATIONS: ChargePoint[] = [
    { id: '1', ocppId: 'CP-SP-001', status: 'AVAILABLE' as const, connectorType: 'CCS2', pricePerKwh: 1.99, maxPowerKw: 50, station: { id: 's1', name: 'Shopping Morumbi', lat: -23.624, lng: -46.717, address: 'Av. Roque Petroni Jr, SP' } },
    { id: '2', ocppId: 'CP-SP-002', status: 'CHARGING' as const, connectorType: 'Type 2', pricePerKwh: 1.75, maxPowerKw: 22, station: { id: 's2', name: 'Restaurante Fasano', lat: -23.561, lng: -46.662, address: 'R. Vittorio Fasano, SP' } },
    { id: '3', ocppId: 'CP-SP-003', status: 'FAULTED' as const, connectorType: 'CCS2', pricePerKwh: 2.10, maxPowerKw: 50, station: { id: 's3', name: 'Pátio Higienópolis', lat: -23.548, lng: -46.659, address: 'Av. Higienópolis, SP' } },
    { id: '4', ocppId: 'CP-SP-004', status: 'AVAILABLE' as const, connectorType: 'Type 2', pricePerKwh: 1.85, maxPowerKw: 22, station: { id: 's4', name: 'Hiper Eldorado', lat: -23.626, lng: -46.7, address: 'Av. Nações Unidas, SP' } },
    { id: '5', ocppId: 'CP-RJ-001', status: 'UNAVAILABLE' as const, connectorType: 'CCS2', pricePerKwh: 2.05, maxPowerKw: 50, station: { id: 's5', name: 'Shopping Barra da Tijuca', lat: -22.999, lng: -43.366, address: 'Av. das Américas, RJ' } },
];

export const StationsPage: React.FC = () => {
    const { t } = useTranslation();
    const { stations: apiStations, isLoading } = useStations();
    const { chargerStatuses } = useRealtimeEvents();

    const baseStations = apiStations.length > 0 ? apiStations : MOCK_STATIONS;
    const stations = useMemo(() => baseStations.map(cp => ({
        ...cp,
        status: (chargerStatuses[cp.ocppId] ?? cp.status) as ChargePoint['status'],
    })), [baseStations, chargerStatuses]);

    const center: [number, number] = [-23.56, -46.66];

    return (
        <div className="flex flex-col gap-6 h-full animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">{t('stations.title')}</h1>
                <p className="text-slate-400 text-sm mt-1">
                    {isLoading ? t('stations.subtitle_loading') : t('stations.subtitle', { count: stations.length })}
                </p>
            </div>

            <div className="flex gap-4 h-[600px]">
                <div className="w-72 flex-shrink-0 card-glass overflow-y-auto p-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 pb-1">{t('stations.allChargers')}</p>
                    {stations.map(cp => (
                        <StationListItem key={cp.id} cp={cp} onSelect={() => { }} />
                    ))}
                </div>

                <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700 relative">
                    <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} className="bg-surface-950">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {stations.map(cp => (
                            cp.station && (
                                <Marker
                                    key={cp.id}
                                    position={[cp.station.lat, cp.station.lng]}
                                    icon={makeIcon(STATUS_COLORS[cp.status] ?? '#64748b')}
                                >
                                    <Popup>
                                        <div className="min-w-48">
                                            <p className="font-bold text-sm mb-1">{cp.station.name}</p>
                                            <p className="text-xs text-gray-500 mb-2">{cp.station.address}</p>
                                            <div className="flex justify-between text-xs">
                                                <span>{cp.connectorType}</span>
                                                <span className="font-semibold">R${cp.pricePerKwh}/kWh</span>
                                            </div>
                                            <div className="mt-2 text-xs font-semibold">
                                                {t('stations.status')}: {cp.status}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        ))}
                    </MapContainer>
                    <MapLegend />
                </div>
            </div>
        </div>
    );
};
