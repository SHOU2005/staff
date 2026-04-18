import { useEffect, useState, useCallback } from 'react';
import {
  getOpsAnalytics, getCaptains, getCandidates,
  STAGE_ORDER,
} from '../../lib/data';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ReturnType<typeof getOpsAnalytics> | null>(null);
  const [captainTable, setCaptainTable] = useState<{ name: string; leads: number; placed: number; conv: number; earnings: number }[]>([]);
  const [sortBy, setSortBy] = useState<'leads' | 'placed' | 'conv' | 'earnings'>('placed');

  const load = useCallback(() => {
    const a = getOpsAnalytics();
    setAnalytics(a);
    const captains = getCaptains();
    const candidates = getCandidates();
    const table = captains.map((cap) => {
      const mine = candidates.filter((c) => c.referredBy === cap.id);
      const placed = mine.filter((c) => c.currentStage === 'Placed').length;
      const earnings = mine.filter((c) => c.payout.status === 'paid').reduce((s, c) => s + c.payout.amount, 0);
      return {
        name: cap.name,
        leads: mine.length,
        placed,
        conv: mine.length > 0 ? Math.round((placed / mine.length) * 100) : 0,
        earnings,
      };
    });
    setCaptainTable(table);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = [...captainTable].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
          Reporting
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.03em' }}>
          Analytics
        </h1>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Pipeline (MTD)', value: analytics?.totalPipeline || 0, icon: '🗂', color: 'var(--brand-green)' },
          { label: 'Placements (MTD)', value: analytics?.placements || 0, icon: '✅', color: 'var(--success)' },
          { label: 'Conversion Rate', value: `${analytics?.conversionRate || 0}%`, icon: '📈', color: '#7C3AED' },
          { label: 'Gross Revenue', value: `₹${(analytics?.revenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: '#D4A017' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--neutral-900)', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--neutral-500)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 16 }}>
          Hiring Funnel
        </div>
        {analytics?.funnel.map((item, i) => {
          const prev = i > 0 ? analytics.funnel[i - 1].count : item.count;
          const convPct = prev > 0 ? Math.round((item.count / prev) * 100) : 100;
          const maxCount = analytics.funnel[0]?.count || 1;
          const width = Math.max((item.count / maxCount) * 100, 3);
          const stageColors = ['#6B7280', '#2563EB', '#D97706', '#7C3AED', '#059669'];
          const color = stageColors[i];
          return (
            <div key={item.stage} style={{ marginBottom: i < analytics.funnel.length - 1 ? 14 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>{item.stage}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {i > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: convPct > 50 ? 'var(--success)' : 'var(--warning)', background: convPct > 50 ? 'var(--success-light)' : 'var(--warning-light)', padding: '2px 6px', borderRadius: 4 }}>
                      {convPct}%
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--neutral-900)', fontFamily: 'DM Mono, monospace', width: 28, textAlign: 'right' }}>
                    {item.count}
                  </span>
                </div>
              </div>
              <div style={{ height: 12, background: 'var(--neutral-200)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 6, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue section */}
      <div style={{ background: 'linear-gradient(135deg, rgba(212,160,23,0.06), rgba(212,160,23,0.03))', border: '1.5px solid rgba(212,160,23,0.2)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#D4A017', marginBottom: 14 }}>💰 Revenue Breakdown</div>
        {[
          { label: 'Gross Revenue', value: analytics?.revenue || 0, color: 'var(--neutral-900)' },
          { label: 'Payouts Made', value: analytics?.payoutsMade || 0, color: 'var(--danger)' },
          { label: 'Net Revenue', value: analytics?.netRevenue || 0, color: 'var(--success)', bold: true },
        ].map(({ label, value, color, bold }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(212,160,23,0.15)' }}>
            <span style={{ fontSize: 13, color: 'var(--neutral-700)', fontWeight: bold ? 700 : 400 }}>{label}</span>
            <span style={{ fontSize: bold ? 20 : 16, fontWeight: bold ? 900 : 700, color, fontFamily: 'DM Mono, monospace' }}>
              ₹{value.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>

      {/* Captain performance table */}
      <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-700)' }}>Captain Performance</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['leads', 'placed', 'conv', 'earnings'] as const).map((col) => (
              <button
                key={col}
                onClick={() => setSortBy(col)}
                style={{
                  padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 10, fontWeight: 700,
                  background: sortBy === col ? 'var(--brand-green-light)' : 'var(--neutral-200)',
                  color: sortBy === col ? 'var(--brand-green)' : 'var(--neutral-500)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px', gap: 8, padding: '8px 16px', background: 'var(--neutral-100)' }}>
          {['Captain', 'Leads', 'Placed', 'Conv%'].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 800, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Captain' ? 'left' : 'center' }}>
              {h}
            </div>
          ))}
        </div>

        {sorted.map((row, i) => (
          <div key={row.name} style={{
            display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px', gap: 8,
            padding: '12px 16px',
            borderBottom: i < sorted.length - 1 ? '1px solid var(--neutral-200)' : 'none',
            background: i % 2 === 0 ? '#fff' : 'var(--neutral-50)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-900)' }}>{row.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-700)', textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>{row.leads}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>{row.placed}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-700)', textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>{row.conv}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
