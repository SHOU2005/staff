import { useEffect, useState, useCallback } from 'react';
import {
  getCaptains, getCandidates, type Captain,
} from '../../lib/data';

export default function CaptainsPage() {
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [candidateMap, setCandidateMap] = useState<Record<string, { total: number; placed: number; earnings: number }>>({});

  const load = useCallback(() => {
    const caps = getCaptains();
    setCaptains(caps);
    const candidates = getCandidates();
    const cm: Record<string, { total: number; placed: number; earnings: number }> = {};
    caps.forEach((cap) => {
      const mine = candidates.filter((c) => c.referredBy === cap.id);
      cm[cap.id] = {
        total: mine.length,
        placed: mine.filter((c) => c.currentStage === 'Placed').length,
        earnings: mine.filter((c) => c.payout.status === 'paid').reduce((s, c) => s + c.payout.amount, 0),
      };
    });
    setCandidateMap(cm);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
          Field Agents
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>
          Captains ({captains.length})
        </h1>
      </div>

      {captains.map((cap, i) => {
        const stats = candidateMap[cap.id] || { total: 0, placed: 0, earnings: 0 };
        const conv = stats.total > 0 ? Math.round((stats.placed / stats.total) * 100) : 0;
        const colors = ['var(--brand-green)', '#2563EB', '#D97706', '#7C3AED', '#059669'];
        const color = colors[i % colors.length];
        return (
          <div
            key={cap.id}
            id={`captain-${cap.id}`}
            style={{
              background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)',
              borderRadius: 16, padding: '16px',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 50, height: 50, borderRadius: 15, flexShrink: 0,
                background: `${color}20`, color, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800,
              }}>
                {getInitials(cap.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--neutral-900)' }}>{cap.name}</div>
                <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>
                  {cap.mobile} · {cap.upiId || 'No UPI'}
                </div>
              </div>
              <span style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: cap.active ? 'var(--success-light)' : 'var(--neutral-100)',
                color: cap.active ? 'var(--success)' : 'var(--neutral-500)',
              }}>
                {cap.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Total', value: stats.total },
                { label: 'Placed', value: stats.placed },
                { label: 'Conv%', value: `${conv}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: `${color}08`, border: `1px solid ${color}20`,
                  borderRadius: 10, padding: '10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--neutral-900)', fontFamily: 'DM Mono, monospace' }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>Total earnings paid</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#D4A017', fontFamily: 'DM Mono, monospace' }}>
                ₹{stats.earnings.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
