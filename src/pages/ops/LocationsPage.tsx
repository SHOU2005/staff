import { useEffect, useState, useCallback } from 'react';
import { MapPin, Phone, MessageCircle, RefreshCw, Navigation } from 'lucide-react';
import { getCaptains, getCandidates, timeAgo, type Captain } from '../../lib/data';
import CaptainMap from '../../components/CaptainMap';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function LocationsPage() {
  const [captains, setCaptains]     = useState<Captain[]>([]);
  const [placedMap, setPlacedMap]   = useState<Record<string, number>>({});
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(() => {
    const caps = getCaptains();
    setCaptains(caps);
    const cands = getCandidates();
    const pm: Record<string, number> = {};
    caps.forEach(c => { pm[c.id] = cands.filter(x => x.referredBy === c.id && x.currentStage === 'Placed').length; });
    setPlacedMap(pm);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const withLoc    = captains.filter(c => c.lastLocation);
  const withoutLoc = captains.filter(c => !c.lastLocation);

  const isLive = (updatedAt: string) =>
    (Date.now() - new Date(updatedAt).getTime()) < 2 * 60 * 60 * 1000;

  const liveCount = withLoc.filter(c => isLive(c.lastLocation!.updatedAt)).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
            Field Intelligence
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>
            Live Locations
          </h1>
          <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
            Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · auto-refresh 30s
          </div>
        </div>
        <button
          onClick={load}
          style={{ width: 38, height: 38, borderRadius: 11, border: '1.5px solid var(--neutral-200)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <RefreshCw size={15} color="var(--neutral-500)" />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total', value: captains.length, color: 'var(--neutral-700)', bg: 'var(--neutral-100)' },
          { label: '🟢 Live', value: liveCount, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
          { label: 'No Pin', value: withoutLoc.length, color: '#D97706', bg: 'rgba(217,119,6,0.07)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Interactive map — always rendered, handles empty state internally */}
      <div style={{ marginBottom: 20 }}>
        <CaptainMap captains={captains} height={380} />
      </div>

      {/* Captains sharing location */}
      {withLoc.length === 0 && withoutLoc.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--neutral-400)' }}>
          <Navigation size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>No captains yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Add captains from Settings</div>
        </div>
      )}

      {withLoc.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            📍 Sharing Location ({withLoc.length})
          </div>
          {withLoc.map((cap, i) => {
            const loc   = cap.lastLocation!;
            const live  = isLive(loc.updatedAt);
            const colors= ['var(--brand-green)', '#2563EB', '#D97706', '#7C3AED', '#059669'];
            const color = colors[i % colors.length];
            return (
              <div
                key={cap.id}
                style={{ background: '#fff', border: `1.5px solid ${live ? 'rgba(5,150,105,0.25)' : 'var(--neutral-200)'}`, borderRadius: 20, marginBottom: 10, overflow: 'hidden', boxShadow: live ? '0 4px 20px rgba(5,150,105,0.08)' : 'none' }}
              >
                {/* Captain info */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800 }}>
                      {getInitials(cap.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--neutral-900)' }}>{cap.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 1 }}>
                        {live ? '🟢 Last seen ' : '⏱ '}{timeAgo(loc.updatedAt)} · {placedMap[cap.id] || 0} placed
                      </div>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div style={{ background: 'var(--neutral-100)', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--neutral-600)' }}>
                      {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--neutral-400)' }}>GPS</span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                    <a
                      href={`https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=16`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}
                    >
                      <MapPin size={13} /> Google Maps
                    </a>
                    <a
                      href={`tel:${cap.mobile}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(46,168,106,0.1)', border: '1px solid rgba(46,168,106,0.2)', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, color: 'var(--brand-green)', textDecoration: 'none' }}
                    >
                      <Phone size={13} />
                    </a>
                    <a
                      href={`https://wa.me/91${cap.mobile}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, color: '#25D366', textDecoration: 'none' }}
                    >
                      <MessageCircle size={13} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Captains NOT sharing */}
      {withoutLoc.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            📵 Not Sharing ({withoutLoc.length})
          </div>
          {withoutLoc.map(cap => (
            <div
              key={cap.id}
              style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--neutral-500)', flexShrink: 0 }}>
                {getInitials(cap.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--neutral-700)' }}>{cap.name}</div>
                <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 1 }}>No location shared yet</div>
              </div>
              <a
                href={`https://wa.me/91${cap.mobile}?text=${encodeURIComponent('Bhai, Switch app mein location share karo please 📍')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 9, padding: '7px 11px', fontSize: 11, fontWeight: 700, color: '#25D366', textDecoration: 'none', flexShrink: 0 }}
              >
                <MessageCircle size={12} /> Ping
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
