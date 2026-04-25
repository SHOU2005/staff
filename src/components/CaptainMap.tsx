import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { timeAgo, type Captain } from '../lib/data';

// Fix default icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function isLive(updatedAt: string) {
  return (Date.now() - new Date(updatedAt).getTime()) < 2 * 60 * 60 * 1000;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function makePinIcon(label: string, live: boolean) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:38px; height:38px; border-radius:50%;
        background:${live ? '#059669' : '#9CA3AF'};
        border:3px solid #fff;
        box-shadow:0 2px 10px rgba(0,0,0,0.25);
        display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:800; color:#fff;
        font-family:sans-serif;
        position:relative;
      ">
        ${label}
        ${live ? `<span style="position:absolute;bottom:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:#4ADE80;border:2px solid #fff;"></span>` : ''}
      </div>`,
    iconSize:   [38, 38],
    iconAnchor: [19, 38],
    popupAnchor:[0, -40],
  });
}

// Auto-fit map bounds to all markers
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }, [map, coords]);
  return null;
}

interface Props {
  captains: Captain[];
  height?: number;
  compact?: boolean;
}

export default function CaptainMap({ captains, height = 420, compact = false }: Props) {
  const withLoc = captains.filter(c => c.lastLocation);

  if (withLoc.length === 0) {
    return (
      <div style={{ height, borderRadius: 16, background: 'var(--neutral-100)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--neutral-200)', gap: 8 }}>
        <div style={{ fontSize: 32 }}>📍</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--neutral-500)' }}>No captain locations yet</div>
        <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>Locations appear as captains use the app</div>
      </div>
    );
  }

  const coords: [number, number][] = withLoc.map(c => [c.lastLocation!.lat, c.lastLocation!.lng]);
  const center: [number, number]   = [
    coords.reduce((s, c) => s + c[0], 0) / coords.length,
    coords.reduce((s, c) => s + c[1], 0) / coords.length,
  ];

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--neutral-200)', height }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={!compact}
        zoomControl={!compact}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <FitBounds coords={coords} />

        {withLoc.map(cap => {
          const loc  = cap.lastLocation!;
          const live = isLive(loc.updatedAt);
          return (
            <Marker
              key={cap.id}
              position={[loc.lat, loc.lng]}
              icon={makePinIcon(getInitials(cap.name), live)}
            >
              <Popup>
                <div style={{ minWidth: 160, fontFamily: 'inherit' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{cap.name}</div>
                  <div style={{ fontSize: 12, color: live ? '#059669' : '#9CA3AF', marginBottom: 6 }}>
                    {live ? '🟢 Live · ' : '⏱ '}{timeAgo(loc.updatedAt)}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a
                      href={`https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=16`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, textAlign: 'center', padding: '6px 8px', borderRadius: 8, background: 'rgba(37,99,235,0.1)', color: '#2563EB', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
                    >
                      Google Maps
                    </a>
                    <a
                      href={`tel:${cap.mobile}`}
                      style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(46,168,106,0.1)', color: '#059669', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
                    >
                      Call
                    </a>
                    <a
                      href={`https://wa.me/91${cap.mobile}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(37,211,102,0.1)', color: '#25D366', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
                    >
                      WA
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
